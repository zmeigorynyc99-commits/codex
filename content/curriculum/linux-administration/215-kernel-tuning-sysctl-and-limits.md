---
title: "Linux Administration — Kernel Tuning: sysctl & Limits"
slug: "linux-admin-kernel-tuning-sysctl-and-limits"
track: "linux-administration"
trackName: "Linux System Administration"
module: "Performance & Tuning"
order: 215
level: "Senior"
difficulty: "Senior"
distribution: "Ubuntu"
category: "Linux Administration"
tags: [linux, tuning, sysctl, ulimit, limits, kernel, performance, senior]
cover: "/covers/curriculum/linux-administration.svg"
estMinutes: 60
status: "published"
summary: "Safely tune the knobs that fix real production limits. Read and set kernel parameters with sysctl and /etc/sysctl.d, raise per-process and system ulimits (open files, processes), configure systemd resource limits, and fix the classic 'too many open files' and connection-ceiling problems — measured, persistent, and reversible."
seoTitle: "Linux Administration 15: sysctl, ulimit & Resource Limits"
seoDescription: "Senior Linux: tune kernel params with sysctl/sysctl.d, raise ulimits (nofile/nproc), set systemd LimitNOFILE/MemoryMax, and fix 'too many open files' safely. Lab + assessment."
---

You can now find a bottleneck precisely — this **Senior**-level lesson is about
**fixing** the ones that are configuration limits rather than hardware: the kernel
knobs (`sysctl`) and resource limits (`ulimit`, systemd) that cause real outages
like "too many open files," connection ceilings on busy servers, and processes
hitting caps. Tuning is powerful and easy to get wrong, so the throughline is
**measured, persistent, reversible** changes — never cargo-culted values copied
from a blog. This completes the Linux Administration track.

## Learning objectives

By the end of this lesson you will be able to:

- Read and set kernel parameters with **`sysctl`** (live) and **`/etc/sysctl.d`**
  (persistent).
- Raise **ulimits** (open files, processes) per user, system, and for services.
- Set **systemd** service resource limits (`LimitNOFILE`, `MemoryMax`, `TasksMax`).
- Fix the classic **"too many open files"** and connection-limit problems.
- Tune **safely**: change one thing, measure, document, keep it reversible.

## Part 1 — sysctl: kernel parameters

`sysctl` reads and writes tunable kernel parameters (exposed under `/proc/sys`):

```bash
sysctl -a | wc -l                       # how many tunables exist
sysctl net.ipv4.ip_forward              # read one
sysctl vm.swappiness                    # read another
sudo sysctl -w vm.swappiness=10         # set it NOW (lost on reboot)
sudo sysctl net.ipv4.tcp_syncookies     # values live under /proc/sys/net/ipv4/...
```

Make changes **persistent** with a drop-in file in `/etc/sysctl.d/` (preferred over
editing `/etc/sysctl.conf`):

```bash
sudo tee /etc/sysctl.d/99-tuning.conf >/dev/null <<'EOF'
vm.swappiness = 10
net.core.somaxconn = 4096
net.ipv4.tcp_tw_reuse = 1
fs.file-max = 2097152
EOF
sudo sysctl --system                    # apply ALL sysctl.d files now
sysctl vm.swappiness                    # confirm
```

Commonly tuned (only when measured to help):

- **`vm.swappiness`** (0–100) — lower = prefer keeping pages in RAM (servers often
  10).
- **`net.core.somaxconn`** — max queued connections per listening socket (raise for
  high-traffic servers; the app must also request a larger backlog).
- **`fs.file-max`** — system-wide open-file ceiling.
- **`net.ipv4.ip_forward`** — routing (Lesson 207).

> [!IMPORTANT]
> **Don't paste sysctl values from random blogs.** Many "performance" tweaks are
> outdated, harmful, or irrelevant to your kernel/workload. Change **one** parameter
> for a **measured** reason, document *why* in the drop-in file, apply with
> `sysctl --system`, and verify it actually helped. Tuning without before/after
> measurement is how stable servers get destabilized.

## Part 2 — ulimits: per-process resource caps

The kernel limits each process's resources (open files, processes, memory, etc.).
View **your** limits:

```bash
ulimit -a                    # all limits for the current shell/session
ulimit -n                    # open files (the one you'll hit most)
ulimit -u                    # max user processes
```

There are **soft** (current) and **hard** (ceiling) limits; a user can raise their
soft limit up to the hard limit:

```bash
ulimit -Sn                   # soft open-files limit
ulimit -Hn                   # hard open-files limit
ulimit -n 65536              # raise the soft limit for THIS shell (≤ hard limit)
```

`ulimit` set in a shell only affects that shell and its children. For **persistent**
per-user limits, edit `/etc/security/limits.conf` (or a file in `limits.d/`):

```text
# /etc/security/limits.d/90-nofile.conf
# <domain> <type>  <item>   <value>
*          soft    nofile   65536
*          hard    nofile   1048576
deploy     soft    nproc    4096
```

These apply at **login** (via PAM `pam_limits`), so the user must re-log in. Note:
**they do not apply to systemd services** — that's Part 3, a frequent gotcha.

## Part 3 — Limits for services (systemd) — the real gotcha

Daemons started by **systemd ignore `/etc/security/limits.conf`** (PAM isn't in the
path). You set their limits in the **unit file**:

```ini
# /etc/systemd/system/myapp.service  (or a drop-in via `systemctl edit myapp`)
[Service]
LimitNOFILE=65536        # open files for this service
LimitNPROC=8192          # processes/threads
TasksMax=8192            # cgroup task limit
MemoryMax=2G             # hard memory cap (OOM-protects the rest of the box)
```
```bash
sudo systemctl edit myapp          # creates a drop-in override (clean way)
sudo systemctl daemon-reload
sudo systemctl restart myapp
# Verify the LIVE limits of the running process:
cat /proc/$(pgrep -f myapp | head -1)/limits | grep -i 'open files'
```

> [!IMPORTANT]
> **"Too many open files" in a service that you already raised limits for in
> `limits.conf`?** That's the #1 limits gotcha: the file affects **login sessions**,
> not **systemd services**. Set **`LimitNOFILE=`** in the unit (via `systemctl
> edit`), `daemon-reload`, restart, and confirm with `/proc/<pid>/limits`. Always
> verify the **running process's** live limits, not just the config.

## Part 4 — Fixing "too many open files" end to end

A busy web server, database or proxy can exhaust file descriptors (every socket and
file counts). The full fix touches three layers:

```bash
# 1. Diagnose: who's using how many FDs, and the limit
sudo lsof -p <PID> | wc -l                    # FDs this process holds
cat /proc/<PID>/limits | grep 'open files'    # its current limit
sysctl fs.file-nr                             # system-wide allocated/max FDs

# 2. Raise the SYSTEM ceiling if needed (sysctl)
echo 'fs.file-max = 2097152' | sudo tee /etc/sysctl.d/99-files.conf
sudo sysctl --system

# 3. Raise the SERVICE limit (systemd) — the part people miss
sudo systemctl edit nginx        # add [Service]\nLimitNOFILE=65536
sudo systemctl daemon-reload && sudo systemctl restart nginx
cat /proc/$(pgrep -f nginx | head -1)/limits | grep 'open files'   # confirm
```

Connection ceilings are similar: raise `net.core.somaxconn` **and** the app's listen
backlog **and** the service's `LimitNOFILE` — all three, or the lowest one caps you.

## Part 5 — Tuning safely (the discipline)

A repeatable, professional change process:

1. **Measure** the problem (Lessons 212–214) and form a hypothesis about the limit.
2. **Change one thing**, with a documented reason, in a **drop-in** file
   (`sysctl.d`, `limits.d`, `systemctl edit`) — never scatter edits in main configs.
3. **Apply and verify the live value** (`sysctl name`, `/proc/<pid>/limits`).
4. **Re-measure** to confirm it helped; if not, **revert** (drop-ins make this
   trivial).
5. **Document** what and why (a comment in the file, a note in your runbook).

> [!TIP]
> Reversibility is the whole game. Because every change lives in its own drop-in
> file, rolling back is `rm` + re-apply — no archaeology through a tangled
> `sysctl.conf`. This is what lets you tune confidently in production instead of
> fearing it.

## Hands-on lab

```bash
# 1. Inspect kernel params and limits
sysctl vm.swappiness net.core.somaxconn fs.file-max
ulimit -a
ulimit -Sn; ulimit -Hn

# 2. Set a sysctl live, then persist it reversibly
sudo sysctl -w vm.swappiness=10
sysctl vm.swappiness
echo '# lower swappiness for a server workload (lab)
vm.swappiness = 10' | sudo tee /etc/sysctl.d/99-lab.conf
sudo sysctl --system | grep swappiness || true

# 3. Raise open-files limit for THIS shell and see it
ulimit -n 4096; ulimit -n

# 4. Service limits the right way (demo unit)
sudo systemctl edit --force --full datelimit.service >/dev/null 2>&1 <<'EOF' || true
[Unit]
Description=limits demo
[Service]
Type=oneshot
LimitNOFILE=65536
ExecStart=/bin/sh -c 'cat /proc/self/limits | grep "open files"'
EOF
sudo systemctl daemon-reload
sudo systemctl start datelimit.service 2>/dev/null
journalctl -u datelimit.service -n 3 --no-pager 2>/dev/null

# 5. Diagnose FD usage of a real process
PID=$(pgrep -x sshd | head -1); [ -n "$PID" ] && cat /proc/$PID/limits | grep 'open files'

# 6. Clean up the lab changes (reversible!)
sudo rm -f /etc/sysctl.d/99-lab.conf /etc/systemd/system/datelimit.service
sudo systemctl daemon-reload; sudo sysctl --system >/dev/null
```

## Exercises

1. Read `vm.swappiness`, set it to 10 live with `sysctl -w`, then make it persistent
   in a documented `/etc/sysctl.d/` file and apply it.
2. Show your shell's soft and hard open-file limits, and raise the soft limit.
3. Explain why a `limits.conf` change didn't affect a systemd service, and set the
   correct equivalent in the unit.
4. Diagnose a process's current open-file count and its limit, then describe the
   three layers you'd raise to fix "too many open files."
5. Describe your safe-tuning process as five concrete steps, emphasizing
   reversibility and measurement.

## Troubleshooting

- **`Too many open files`** — FD limit hit. *Fix:* raise the **service's**
  `LimitNOFILE` (systemd), the system `fs.file-max` if needed, and the app backlog;
  verify via `/proc/<pid>/limits`.
- **`limits.conf` change ignored** — it's for **login sessions**, not systemd
  services (or you didn't re-log in). *Fix:* `systemctl edit` for services; re-login
  for users.
- **`sysctl -w` reverted after reboot** — it's live-only. *Fix:* add it to
  `/etc/sysctl.d/` and `sysctl --system`.
- **Tuning made things worse** — a copied value that doesn't fit your kernel/
  workload. *Fix:* revert the drop-in (`rm` + re-apply), change one thing at a time
  with measurement.
- **Connection ceiling under load** — only one of backlog/`somaxconn`/`LimitNOFILE`
  raised. *Fix:* raise all three; the lowest caps you.

Reproduce the systemd-limits gotcha: set a high `nofile` in `limits.conf`, then
check a service's `/proc/<pid>/limits` (still the default) — proving services need
`LimitNOFILE=` in the unit.

## Assessment

**Passing requirement: at least 9 of 11 correct (≈82%) — this is a Senior lesson.**
Run the practical items.

1. How do you read and live-set a kernel parameter with `sysctl`?
2. Where do persistent sysctl settings go, and how do you apply them?
3. What's the difference between soft and hard ulimits?
4. Why don't `/etc/security/limits.conf` settings apply to systemd services?
5. Which unit directive sets a service's open-file limit?
6. How do you verify the **live** open-file limit of a running process?
7. Name the three layers involved in fixing "too many open files."
8. Why use drop-in files instead of editing main config files?
9. State the five steps of safe tuning.
10. **Practical:** persist `vm.swappiness=10` reversibly and apply it. Commands?
11. **Practical:** show a running service's open-files limit. Commands?

## Solutions & validation

1. `sysctl <name>` to read; `sudo sysctl -w <name>=<value>` to set live.
2. In **`/etc/sysctl.d/*.conf`**; apply with `sudo sysctl --system`.
3. **Soft** = the currently enforced value (raisable by the user up to the hard
   cap); **hard** = the ceiling (raisable only by root).
4. systemd doesn't go through **PAM** (`pam_limits`), so the login-time
   `limits.conf` isn't applied; services use unit directives instead.
5. **`LimitNOFILE=`** (in `[Service]`).
6. `cat /proc/<pid>/limits | grep 'open files'`.
7. **System** ceiling (`fs.file-max`), the **service** limit (`LimitNOFILE`), and
   the **app's** listen backlog/open-file usage.
8. They're **reversible and self-documenting** (one file per change), avoiding
   tangled edits and making rollback `rm` + re-apply.
9. **Measure → change one thing (documented drop-in) → apply & verify live value →
   re-measure → revert if no help / document.**
10. **Validation:** `echo 'vm.swappiness=10' | sudo tee /etc/sysctl.d/99-x.conf` then
    `sudo sysctl --system`; `sysctl vm.swappiness` shows 10.
11. **Validation:** `cat /proc/$(pgrep -x sshd|head -1)/limits | grep 'open files'`.

> [!TIP]
> 🎉 That completes the **Linux System Administration** track. You can provision
> storage, configure networking, schedule and log reliably, keep time correct,
> diagnose any resource bottleneck, and tune the system safely — the full toolkit of
> a working Linux sysadmin, and the foundation for the RHCSA/LPIC certifications.

## What's next

Next, the curriculum moves into the **Shell & Bash Scripting** track — turning the
commands you've mastered into reusable, robust automation. You'll go from your first
script to production-grade Bash: variables and quoting, conditionals and loops,
functions, arrays, and bullet-proof error handling. Automation is the bridge from
"administering servers by hand" to the DevOps half of the roadmap.
