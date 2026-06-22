---
title: "Linux Administration — Time, Clocks & NTP"
slug: "linux-admin-time-clocks-and-ntp"
track: "linux-administration"
trackName: "Linux System Administration"
module: "Scheduling, Logging & Time"
order: 211
level: "Intermediate"
difficulty: "Intermediate"
distribution: "Ubuntu"
category: "Linux Administration"
tags: [linux, ntp, chrony, timezone, timedatectl, clock, intermediate]
cover: "/covers/curriculum/linux-administration.svg"
estMinutes: 50
status: "published"
summary: "Keep the clock correct — because almost everything depends on it. Set timezones with timedatectl, understand UTC vs local and the hardware clock, sync time with systemd-timesyncd and chrony, and learn why a few seconds of drift breaks TLS, authentication, logs and clusters."
seoTitle: "Linux Administration 11: Time, Timezones, NTP & chrony"
seoDescription: "Intermediate Linux: timedatectl, UTC vs local time, the hardware clock, time sync with systemd-timesyncd and chrony, and why clock drift breaks TLS/auth/clusters. Lab + assessment."
---

Time feels trivial until it breaks something — and when the clock is wrong, the
failures are baffling: TLS certificates "expired" (or "not yet valid"), Kerberos/AD
logins refused, log entries out of order, database replicas diverging, a Kubernetes
node evicted. This short but important lesson makes sure you can keep a server's
clock **correct and synchronized**, set timezones properly, and recognize the
clock as the culprit when weird, time-related bugs appear. It completes the
Scheduling/Logging/Time module, since both depend on an accurate clock.

## Learning objectives

By the end of this lesson you will be able to:

- Read and set the system clock and **timezone** with `timedatectl`.
- Explain **UTC vs local time** and the **hardware (RTC)** clock.
- Enable and verify time sync with **systemd-timesyncd**.
- Use **chrony** for servers, and check synchronization status.
- Diagnose problems caused by **clock drift**.

## Part 1 — The clock, timezones, and UTC

Check everything at a glance with **`timedatectl`**:

```bash
timedatectl                  # local time, UTC, timezone, sync status, RTC
```

Typical output explained:

```text
               Local time: Mon 2026-06-22 11:00:00 UTC
           Universal time: Mon 2026-06-22 11:00:00 UTC
                 RTC time: Mon 2026-06-22 11:00:00
                Time zone: Etc/UTC (UTC, +0000)
System clock synchronized: yes
              NTP service: active
```

Key ideas:

- **UTC** (Universal time) is the absolute reference; **local time** is UTC plus
  your **timezone** offset. Servers are very commonly set to **UTC**.
- The **timezone** is just a label/offset applied for display; changing it does
  **not** change the underlying instant.
- The **RTC** (Real-Time Clock / hardware clock) is a battery-backed clock on the
  motherboard that keeps time while the machine is off; Linux usually keeps the RTC
  in **UTC**.

Set the timezone:

```bash
timedatectl list-timezones | grep -i chisinau     # find the zone name
sudo timedatectl set-timezone Europe/Chisinau      # set it
sudo timedatectl set-timezone UTC                  # servers often use UTC
```

> [!TIP]
> **Run servers in UTC** unless you have a specific reason not to. It removes
> daylight-saving ambiguity, makes logs from machines in different regions directly
> comparable, and avoids "the cron job ran twice / not at all" DST surprises.
> Display local time in your tools/dashboards, but keep the **system** in UTC.

## Part 2 — Why time sync matters (drift)

Computer clocks **drift** — they gain or lose fractions of a second per day. Left
unsynchronized, a server can be minutes off within weeks, and that breaks a
surprising amount:

- **TLS/HTTPS**: certificates are valid only within a time window. A clock far in
  the past sees certs as "not yet valid"; far in the future, "expired" — HTTPS and
  package downloads fail.
- **Authentication**: Kerberos/Active Directory reject tickets if the clock is off
  by more than ~5 minutes; SSH and 2FA (TOTP) can fail.
- **Logs & debugging**: out-of-order or wrongly-stamped entries make incident
  timelines impossible to reconstruct (and correlation across hosts useless).
- **Distributed systems**: databases, clustering, certificate issuance and
  consensus protocols assume closely-synchronized clocks; drift causes split-brain
  and eviction.

The fix is **NTP** (Network Time Protocol): a daemon continuously **disciplines**
the clock against accurate upstream servers, making tiny adjustments so it stays
correct without jumping.

> [!IMPORTANT]
> When you hit an inexplicable "certificate expired/not valid yet," "login denied
> for no reason," or "cluster node keeps getting evicted," **check the clock
> early** (`timedatectl`). Time skew is a top hidden cause of these, and it takes
> ten seconds to rule in or out. `System clock synchronized: yes` and a small
> offset is what you want to see.

## Part 3 — systemd-timesyncd (the simple client)

Most desktop/lightweight servers use **systemd-timesyncd**, a minimal SNTP client
built into systemd. It's a *client only* (it can't serve time to others) but is
perfect for a single machine.

```bash
timedatectl show-timesync --all       # current NTP source and status
sudo timedatectl set-ntp true         # enable network time sync
systemctl status systemd-timesyncd
```

Configure upstream servers in `/etc/systemd/timesyncd.conf`:

```ini
[Time]
NTP=time.cloudflare.com pool.ntp.org
FallbackNTP=ntp.ubuntu.com
```
```bash
sudo systemctl restart systemd-timesyncd
timedatectl                            # confirm "System clock synchronized: yes"
```

## Part 4 — chrony (the server-grade choice)

For real servers — especially those that must **serve** time to others, recover
from large offsets, or sync tightly — **chrony** is the modern standard (default on
RHEL/Rocky, easy to install on Ubuntu). It handles intermittent connectivity and
big initial corrections better than timesyncd.

```bash
sudo apt install -y chrony            # (disables timesyncd automatically)
```

Key configuration in `/etc/chrony/chrony.conf` (Debian/Ubuntu) or
`/etc/chrony.conf` (RHEL):

```text
pool 2.pool.ntp.org iburst            # upstream sources; iburst = sync fast at start
makestep 1.0 3                        # step the clock if off >1s, but only first 3 updates
rtcsync                               # keep the hardware clock disciplined
# allow 10.0.0.0/8                    # (server mode) let this subnet use us as a time source
```

Operate and verify with **`chronyc`**:

```bash
chronyc tracking      # offset, frequency, and how well we're synced (the key view)
chronyc sources -v    # upstream servers, which is selected (*), reachability
chronyc sourcestats   # measurement quality per source
sudo chronyc makestep # force an immediate step correction (e.g. after a big jump)
```

In `chronyc tracking`, you want a small **System time** offset (well under a second)
and a selected reference source. `chronyc sources` shows a `*` next to the server
currently being used.

> [!IMPORTANT]
> **Stepping vs slewing:** NTP normally **slews** — nudges the clock gradually so
> time never jumps backward (which would break timers, logs and `make`). It only
> **steps** (jumps) for large initial offsets. Never "fix" a wrong clock by
> manually `date -s` on a running production box if you can avoid it — let chrony
> correct it, or use `chronyc makestep`, so dependent services aren't confused by
> time travelling backward.

## Hands-on lab

```bash
# 1. The full time picture
timedatectl
timedatectl show-timesync --all 2>/dev/null | head

# 2. Timezone: inspect and (optionally) set, then back to UTC
timedatectl list-timezones | grep -i europe | head
# sudo timedatectl set-timezone Europe/Chisinau
# timedatectl
# sudo timedatectl set-timezone UTC

# 3. Ensure network time sync is on (timesyncd path)
sudo timedatectl set-ntp true
timedatectl | grep -E 'synchronized|NTP'

# 4. chrony path (server-grade) — install and inspect
sudo apt install -y chrony
chronyc tracking
chronyc sources -v
sudo chronyc makestep        # force an immediate correction (safe on a lab box)

# 5. Prove the RTC and UTC relationship
timedatectl | grep -E 'Universal|RTC|Time zone'

# 6. (Diagnostic muscle memory) what to check when TLS/auth misbehaves
timedatectl   # is "System clock synchronized: yes"? is the offset tiny?
```

## Exercises

1. Report your system's local time, UTC, timezone, and whether the clock is
   synchronized — with one command.
2. List timezones for your region and set the system to one, confirm with
   `timedatectl`, then set it back to UTC.
3. Enable network time sync and show that `System clock synchronized` is `yes`.
4. Install chrony and use `chronyc` to show the current offset and which upstream
   source is selected.
5. Explain three distinct, real failures that a 10-minute clock skew could cause,
   and the one command you'd run first to suspect it.

## Troubleshooting

- **`System clock synchronized: no`** — sync isn't running or can't reach servers.
  *Fix:* `sudo timedatectl set-ntp true` (or install/enable chrony); check egress
  to NTP (UDP/123) through the firewall; `chronyc sources` for reachability.
- **TLS "certificate is not yet valid / expired" everywhere** — clock far off.
  *Fix:* `timedatectl`; correct the time (chrony/`makestep`); then retry.
- **AD/Kerberos logins fail intermittently** — skew beyond the ~5-minute tolerance.
  *Fix:* sync the clock; ensure all hosts use the same upstream NTP.
- **Clock keeps drifting after sync** — NTP egress blocked, or two time daemons
  fighting (timesyncd + chrony). *Fix:* run **one** time service; open UDP 123;
  verify with `chronyc tracking`/`timedatectl`.
- **Time jumped backward and timers/logs went weird** — a manual `date -s` step.
  *Fix:* let NTP slew; avoid manual stepping on production.

Reproduce the diagnosis habit: run `timedatectl` and read off the offset and sync
status — make "check the clock" the first reflex for any time-shaped bug.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Run the practical items.

1. Which command shows local time, UTC, timezone, and sync status together?
2. What's the difference between UTC, local time, and the timezone?
3. What is the RTC, and what does Linux usually keep it in?
4. Why are servers commonly run in UTC?
5. Name three things that break when the clock is significantly wrong.
6. What does NTP do, and what's the difference between slewing and stepping?
7. When would you choose chrony over systemd-timesyncd?
8. Which `chronyc` command shows the offset and sync quality?
9. **Practical:** confirm your clock is synchronized. Command and what you looked
   for?
10. **Practical:** set the timezone to `Europe/Chisinau` and back to UTC. Commands?

## Solutions & validation

1. `timedatectl`.
2. **UTC** is the absolute reference; **local time** is UTC plus the **timezone**
   offset; the **timezone** is a display label/offset and doesn't change the actual
   instant.
3. The **hardware/Real-Time Clock** on the motherboard (battery-backed), kept by
   Linux in **UTC**, that holds time while the machine is off.
4. To avoid **DST ambiguity** and make logs/scheduling **comparable across regions**
   (no double/missing runs at DST changes).
5. Any three: **TLS/cert validation**, **Kerberos/AD authentication**, **log
   ordering/correlation**, **database/cluster consistency**, TOTP 2FA.
6. NTP keeps the clock **synchronized** to accurate sources; **slewing** adjusts it
   gradually (no backward jumps), **stepping** makes a one-off jump for large
   offsets.
7. For **servers** needing to **serve** time, recover from large offsets, or sync
   tightly/over flaky links (and it's the RHEL default).
8. `chronyc tracking`.
9. **Validation:** `timedatectl` shows `System clock synchronized: yes` and a small
   offset.
10. **Validation:** `sudo timedatectl set-timezone Europe/Chisinau` then `sudo
    timedatectl set-timezone UTC`, confirmed via `timedatectl`.

> [!TIP]
> "Check the clock first" deserves a place next to "check DNS first" in your
> troubleshooting reflexes. A ten-second `timedatectl` rules out a whole class of
> maddening, time-shaped bugs.

## What's next

That completes the **Scheduling, Logging & Time** module. You can now automate work
dependably, find and manage logs at scale, and keep the clock correct — the
operational backbone of a well-run server. Next, the Linux Administration track
moves into **Performance & Tuning**: reading load and saturation, analyzing CPU,
memory, and disk I/O with the right tools, and safe kernel/limits tuning with
`sysctl` and `ulimit` — turning "the server feels slow" into a precise diagnosis.
