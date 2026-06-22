---
title: "Linux Administration — Logging Architecture: journald, rsyslog & logrotate"
slug: "linux-admin-logging-architecture"
track: "linux-administration"
trackName: "Linux System Administration"
module: "Scheduling, Logging & Time"
order: 210
level: "Advanced"
difficulty: "Advanced"
distribution: "Ubuntu"
category: "Linux Administration"
tags: [linux, logging, journald, rsyslog, logrotate, journalctl, observability, advanced]
cover: "/covers/curriculum/linux-administration.svg"
estMinutes: 65
status: "published"
summary: "Understand and control logging end to end: how the systemd journal and rsyslog relate, querying with journalctl like a pro, making the journal persistent and capped, the /var/log layout, logrotate, and the basics of shipping logs to a central server."
seoTitle: "Linux Administration 10: journald, rsyslog, journalctl & logrotate"
seoDescription: "Advanced Linux: the journald + rsyslog logging architecture, powerful journalctl queries, persistent/capped journals, /var/log, logrotate, and central log shipping. Lab + assessment."
---

When something breaks, **logs are the truth**. But on a modern Linux system logging
is a two-headed beast — the **systemd journal** and **rsyslog** coexist — and many
admins only half-understand it, which makes troubleshooting slower than it should
be. This **Advanced** lesson gives you the full mental model: where logs come from,
how to query them precisely, how to keep them (or stop them eating the disk), and
how the pieces fit together so you can find any answer fast and ship logs onward
when you need central visibility.

## Learning objectives

By the end of this lesson you will be able to:

- Explain how **journald** and **rsyslog** relate and where each stores data.
- Query the journal **precisely** with `journalctl` (unit, time, priority, fields,
  boot).
- Make the journal **persistent** and **cap its size**.
- Navigate **`/var/log`** and the files that still matter.
- Configure **logrotate** for an application log.
- Understand the basics of **central log shipping**.

## Part 1 — The two-headed logging architecture

On a systemd distro, log messages flow like this:

1. Programs and the kernel emit messages (via `syslog()`, stdout/stderr of
   services, or the journal API).
2. **systemd-journald** receives them into a **structured, indexed binary
   journal** — every entry carries metadata fields (unit, PID, priority,
   hostname, etc.). This is what `journalctl` reads.
3. **rsyslog** (if installed, default on Ubuntu) reads from the journal and writes
   the familiar **plain-text files in `/var/log`** (`syslog`, `auth.log`, …), and
   can **forward** logs to a remote server.

So the same message often exists in **both** places: structured in the journal,
and as text in `/var/log`. The journal is better for **querying** (rich filters);
the text files are better for **grep/tail pipelines** and remote shipping.

```bash
journalctl -n 20            # last 20 journal entries (structured source)
sudo tail -n 20 /var/log/syslog   # the same era, as text (rsyslog output)
```

## Part 2 — journalctl like a pro

`journalctl` is your primary tool. The filters compose:

```bash
journalctl -u nginx                      # one unit
journalctl -u nginx -u ssh               # multiple units
journalctl -u nginx -f                   # follow live (Ctrl+C to stop)
journalctl -u nginx -n 100 --no-pager    # last 100 lines, no pager
journalctl --since "2 hours ago"
journalctl --since "2026-06-22 09:00" --until "2026-06-22 10:00"
journalctl -p err                        # priority: err and worse
journalctl -p warning..err               # a priority range
journalctl -b                            # this boot only
journalctl -b -1                         # the PREVIOUS boot (post-crash analysis)
journalctl -k                            # kernel messages (dmesg equivalent)
journalctl _PID=1234                     # by structured field (the PID)
journalctl _SYSTEMD_UNIT=ssh.service _COMM=sshd
journalctl -u nginx -o json-pretty | head   # raw structured output
```

Priorities (numeric `0`–`7`): `emerg(0) alert(1) crit(2) err(3) warning(4)
notice(5) info(6) debug(7)`. The everyday combos:

```bash
journalctl -xeu nginx        # explain (-x) + jump to end (-e) + unit — the go-to
journalctl -p err -b         # all errors this boot
journalctl --since today -p warning
```

> [!TIP]
> The structured fields are the journal's superpower. `journalctl -F _SYSTEMD_UNIT`
> lists every unit that has logged; `journalctl _UID=33` shows everything the
> `www-data` user did. When text-grepping `/var/log` feels clumsy, switch to a
> field filter — it's exact and fast.

## Part 3 — Persistent and capped journals

By default on some systems the journal is **volatile** (stored in `/run`, **lost on
reboot**) — which is exactly when you most want last boot's logs. Make it
**persistent**:

```bash
journalctl --disk-usage               # how big is the journal now?
ls /var/log/journal 2>/dev/null && echo "persistent" || echo "volatile (in /run)"

# Make it persistent:
sudo mkdir -p /var/log/journal
sudo systemd-tmpfiles --create --prefix /var/log/journal
sudo systemctl restart systemd-journald
```

Then **cap it** in `/etc/systemd/journald.conf` so it can't fill the disk:

```ini
[Journal]
Storage=persistent
SystemMaxUse=1G          # hard cap on total journal size
SystemKeepFree=2G        # always leave this much free
MaxRetentionSec=30day    # delete entries older than 30 days
```
```bash
sudo systemctl restart systemd-journald
# Or vacuum on demand:
sudo journalctl --vacuum-size=500M
sudo journalctl --vacuum-time=14d
```

> [!IMPORTANT]
> **Cap the journal on every server.** An uncapped journal on a chatty service can
> quietly consume gigabytes and contribute to a disk-full outage (Lesson 204). Set
> `SystemMaxUse` (and persistence if you want post-reboot history), then forget
> about it. `journalctl --disk-usage` is the one-line health check.

## Part 4 — /var/log and logrotate

Many services still write plain text under `/var/log`. The files you open most:

```bash
ls /var/log
sudo less /var/log/syslog       # general system messages
sudo less /var/log/auth.log     # logins, sudo, SSH (security gold)
sudo less /var/log/kern.log     # kernel
sudo tail -f /var/log/nginx/access.log
```

These would grow forever, so **logrotate** (run daily by cron/timer) rotates,
compresses and deletes old logs. Add config for your own app in
`/etc/logrotate.d/`:

```text
/var/log/myapp/*.log {
    daily
    rotate 14            # keep 14 old versions, then delete
    compress
    delaycompress        # keep the most recent rotation uncompressed
    missingok
    notifempty
    copytruncate         # for apps that hold the log file open
    sharedscripts
    postrotate
        systemctl reload myapp >/dev/null 2>&1 || true
    endscript
}
```
```bash
sudo logrotate --debug /etc/logrotate.d/myapp    # dry run: what WOULD happen
sudo logrotate --force /etc/logrotate.d/myapp    # force a rotation now
```

> [!IMPORTANT]
> Choose **`copytruncate`** *or* a **`postrotate` reload** based on the app, not
> both casually. Apps that keep the log file open (and don't re-open on signal)
> need `copytruncate` (copy then truncate in place); apps that re-open on `reload`
> should be told to do so in `postrotate`. Mismatching these is why "logs stopped
> after rotation" happens.

## Part 5 — Central logging (the concept)

On more than a couple of servers, you don't want to SSH into each to read logs —
you **centralize** them. The classic Linux path is **rsyslog forwarding**: each
host ships its logs to a central rsyslog (or a log platform like the ELK/Opensearch
or Loki stack) over the network.

```text
# /etc/rsyslog.d/90-forward.conf on each client — send everything to a collector
*.*  @@logserver.internal:514     # @@ = TCP (reliable), @ = UDP (lossy)
```
```bash
sudo systemctl restart rsyslog
```

You'll go deep on aggregation, dashboards and alerting in the **Observability**
track. For now the takeaway: logs can be **forwarded**, and centralization is how
real fleets stay debuggable. (Lock down the collector's port with the firewall
from the security lessons.)

## Hands-on lab

```bash
# 1. The two sources, same events
journalctl -n 5 --no-pager
sudo tail -n 5 /var/log/syslog

# 2. Precise journal queries
journalctl -u ssh -n 20 --no-pager
journalctl -p err -b --no-pager | tail
journalctl -k -n 10 --no-pager           # kernel ring buffer
journalctl -b -1 -n 5 --no-pager 2>/dev/null || echo "(only one boot recorded)"
journalctl -F _SYSTEMD_UNIT | head       # units that have logged

# 3. Journal size + make it safe
journalctl --disk-usage
ls /var/log/journal 2>/dev/null && echo persistent || echo volatile
sudo journalctl --vacuum-time=30d        # trim to 30 days (safe demo)

# 4. logrotate dry run on an existing rule
ls /etc/logrotate.d/
sudo logrotate --debug /etc/logrotate.d/rsyslog 2>&1 | head -20

# 5. Security angle: recent auth failures (ties to the security track)
sudo grep -i 'fail' /var/log/auth.log | tail
journalctl -u ssh --since today | grep -i 'fail' | tail
```

## Exercises

1. Show all **error-and-worse** messages from the current boot, then from the
   previous boot (or explain why there isn't one).
2. Follow a single service's logs live, generate an event, and stop cleanly.
3. Report the journal's current disk usage and whether it is persistent or
   volatile; then make it persistent (on a test VM).
4. Cap the journal at 500 MB and 30 days in `journald.conf`, restart journald, and
   confirm the setting took effect.
5. Write a `logrotate.d` rule for an app log (daily, keep 10, compress) and verify
   it with `logrotate --debug`.

## Troubleshooting

- **No logs from before the last reboot** — journal is volatile. *Fix:* create
  `/var/log/journal` and set `Storage=persistent`; restart journald.
- **Disk filling from logs** — uncapped journal or unrotated `/var/log`. *Fix:*
  `journalctl --disk-usage` + cap with `SystemMaxUse`; add/verify logrotate;
  `du -sh /var/log/*` to find the hog (Lesson 204).
- **App stopped logging after rotation** — wrong rotation method. *Fix:* use
  `copytruncate` for apps that hold the file open, or a `postrotate` reload for
  apps that re-open on signal.
- **`journalctl` shows nothing for a unit** — wrong unit name or it logs to a file
  only. *Fix:* `systemctl status <unit>` for the exact name; check `/var/log` and
  the app's own log path.
- **Logs not arriving at the central server** — firewall/port, TCP vs UDP, or
  rsyslog not restarted. *Fix:* open 514 on the collector, prefer `@@` (TCP), and
  `systemctl restart rsyslog` on both ends; test with `logger "test"`.

Reproduce the persistence gap: `journalctl -b -1` on a freshly built volatile
system errors ("Failed to look up boot -1") — then enable persistence and the next
reboot makes prior-boot logs available.

## Assessment

**Passing requirement: at least 9 of 11 correct (≈82%).** Run the practical items.

1. How do journald and rsyslog relate? Where does each store data?
2. Which is better for rich filtering, and which for grep/tail pipelines?
3. Write the journalctl command for "all errors this boot."
4. How do you read the **previous** boot's logs, and when is that useful?
5. What's the difference between a volatile and a persistent journal?
6. How do you cap the journal's maximum size?
7. What does logrotate do, and where do you add app rules?
8. When do you use `copytruncate` vs a `postrotate` reload?
9. What does rsyslog forwarding achieve, and what's `@@` vs `@`?
10. **Practical:** show the journal's disk usage and persistence state. Commands?
11. **Practical:** list every unit that has written to the journal. Command?

## Solutions & validation

1. **journald** ingests structured logs into the **binary journal**; **rsyslog**
   reads from it and writes **plain-text files in `/var/log`** (and can forward).
   Same messages can exist in both.
2. The **journal** (journalctl field filters) for rich filtering; **`/var/log`**
   text files for grep/tail pipelines and shipping.
3. `journalctl -p err -b`.
4. `journalctl -b -1`; useful for **post-crash analysis** (logs from before a
   reboot/crash).
5. **Volatile** lives in `/run` and is **lost on reboot**; **persistent** lives in
   `/var/log/journal` and **survives reboots**.
6. `SystemMaxUse=` in `/etc/systemd/journald.conf` (or `journalctl --vacuum-size`).
7. Rotates/compresses/deletes old logs to bound disk use; app rules go in
   **`/etc/logrotate.d/`**.
8. **`copytruncate`** for apps that **hold the log open** and don't re-open;
   **`postrotate` reload** for apps that **re-open on signal**.
9. It **ships logs to a central server**; `@@` = **TCP** (reliable), `@` = **UDP**
   (lossy/lighter).
10. **Validation:** `journalctl --disk-usage` and `ls /var/log/journal` (exists =
    persistent).
11. **Validation:** `journalctl -F _SYSTEMD_UNIT` lists the units.

> [!TIP]
> Master the journal's field filters and you'll diagnose incidents far faster than
> grepping text — and capping the journal + logrotate means logs help you instead
> of taking the server down. This is the operational backbone the Observability
> track builds on.

## What's next

Next: **Lesson 211 — Time, Clocks & NTP.** Scheduling and logs both depend on the
clock being right — and clock drift causes some of the most baffling bugs (expired
certs, failed auth, out-of-order logs, broken clusters). You'll set timezones,
sync time with **chrony**/`systemd-timesyncd`, and understand why a few seconds of
drift can break a distributed system. That completes the module.
