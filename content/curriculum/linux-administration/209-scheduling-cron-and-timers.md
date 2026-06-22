---
title: "Linux Administration — Scheduling with cron & systemd Timers"
slug: "linux-admin-scheduling-cron-and-timers"
track: "linux-administration"
trackName: "Linux System Administration"
module: "Scheduling, Logging & Time"
order: 209
level: "Intermediate"
difficulty: "Intermediate"
distribution: "Ubuntu"
category: "Linux Administration"
tags: [linux, cron, crontab, systemd-timers, scheduling, automation, intermediate]
cover: "/covers/curriculum/linux-administration.svg"
estMinutes: 60
status: "published"
summary: "Run jobs automatically and reliably. Master crontab syntax and the cron environment gotchas, then the modern systemd timers (OnCalendar, Persistent, accuracy) — when to use each, how to log their output, and how to verify a job actually ran on a production server."
seoTitle: "Linux Administration 9: cron & systemd Timers in Depth"
seoDescription: "Intermediate Linux: crontab syntax and environment pitfalls, system vs user cron, and systemd timers (OnCalendar, Persistent) with logging and verification. Lab + assessment."
---

A server earns its keep by doing work **without you** — rotating logs, taking
backups, syncing data, running health checks at 3 a.m. while you sleep. This
lesson makes you fluent with both schedulers on a modern Linux box: classic
**cron** (universal, instant to set up) and **systemd timers** (logged,
resilient, the modern default on servers). Just as important, you'll learn how to
make scheduled jobs *reliable* — the difference between a job that runs and one
that silently fails for a month before anyone notices.

## Learning objectives

By the end of this lesson you will be able to:

- Write **crontab** schedules fluently and read the five time fields.
- Avoid the classic **cron environment** pitfalls (PATH, output, `%`).
- Distinguish **user crontabs**, **system crontab**, and the `cron.*` directories.
- Create a **systemd timer** with `OnCalendar` and `Persistent`.
- **Verify** a scheduled job ran and read its output/logs.

## Part 1 — cron: the classic scheduler

Each user has a **crontab** (cron table). Edit and list yours:

```bash
crontab -e          # edit your jobs
crontab -l          # list them
crontab -r          # remove ALL your jobs (careful)
sudo crontab -e -u www-data   # edit another user's crontab (as root)
```

Each line is five time fields then the command:

```text
┌─ minute (0-59)
│ ┌─ hour (0-23)
│ │ ┌─ day of month (1-31)
│ │ │ ┌─ month (1-12)
│ │ │ │ ┌─ day of week (0-7, 0 & 7 = Sunday)
│ │ │ │ │
* * * * *  command
```

Read these aloud until the pattern is automatic:

```text
0 2 * * *        /opt/backup.sh                 # every day at 02:00
*/15 * * * *     /opt/healthcheck.sh            # every 15 minutes
0 */4 * * *      /opt/sync.sh                   # every 4 hours, on the hour
30 3 * * 1-5     /opt/weekday-report.sh         # 03:30 Mon–Fri
0 0 1 * *        /opt/monthly.sh                # midnight on the 1st
@reboot          /opt/startup.sh               # once, at boot
@daily           /opt/daily.sh                 # shorthand for 0 0 * * *
```

## Part 2 — The cron environment (where jobs go to die)

cron runs with a **deliberately minimal environment** — a bare `PATH`, no profile,
no aliases. The overwhelming majority of "it works in my shell but the cron job
fails" bugs come from this. Three defences:

```bash
# 1. ABSOLUTE PATHS for everything — commands and files.
0 2 * * *  /usr/bin/rsync -a /data/ /backup/   # not just "rsync"

# 2. CAPTURE OUTPUT so failures are visible, not lost.
0 2 * * *  /opt/backup.sh >> /var/log/backup.log 2>&1

# 3. Set variables at the top of the crontab if needed.
PATH=/usr/local/bin:/usr/bin:/bin
MAILTO=admin            # mails job output to this local user (if mail is set up)
SHELL=/bin/bash
```

> [!IMPORTANT]
> The single most common cron failure is **a relative path or missing PATH**, and
> the second is **lost output**. A job with `>> logfile 2>&1` tells you *why* it
> failed; without it, a broken backup can fail silently for weeks. Also: a literal
> **percent sign `%`** in a cron command means "newline" — escape it as `\%` (this
> bites `date +%F` constantly; wrap such commands in a script instead).

## Part 3 — System cron and the cron.* directories

Beyond per-user crontabs, the system offers:

- **`/etc/crontab`** and **`/etc/cron.d/`** — system crontabs with an **extra
  field**: the **user** to run as, before the command.
  ```text
  # m h dom mon dow user  command
  0 5 * * *          root  /usr/local/bin/cleanup.sh
  ```
- **`/etc/cron.hourly/`, `/etc/cron.daily/`, `/etc/cron.weekly/`,
  `/etc/cron.monthly/`** — drop an **executable script** in and it runs on that
  cadence (no crontab line needed). Great for packages and simple periodic tasks.

```bash
ls /etc/cron.daily/                 # what already runs daily (logrotate, etc.)
sudo cp myjob.sh /etc/cron.daily/   # must be executable, no .sh extension issues
sudo chmod +x /etc/cron.daily/myjob
```

> [!TIP]
> Drop-in files in `/etc/cron.d/` are the clean way to ship a scheduled job with a
> package or config-management tool — one file, self-contained, easy to add and
> remove. Prefer them over editing a shared crontab when automating.

## Part 4 — systemd timers: the modern way

systemd timers (introduced in Lesson 116/Day 9) are two units: a **`.service`**
(what to run) and a **`.timer`** (when). They beat cron on servers because they
**log to the journal**, can **catch up** missed runs after downtime, support
randomized delays, and tie into dependencies.

```bash
sudo nano /etc/systemd/system/backup.service
```
```ini
[Unit]
Description=Site backup

[Service]
Type=oneshot
ExecStart=/opt/backup.sh /var/www /opt/backups
```
```bash
sudo nano /etc/systemd/system/backup.timer
```
```ini
[Unit]
Description=Run the site backup daily at 02:00

[Timer]
OnCalendar=*-*-* 02:00:00     # daily at 02:00 (see `man systemd.time`)
Persistent=true               # if the machine was off at 02:00, run at next boot
RandomizedDelaySec=300        # spread load: start within 5 min of the target
AccuracySec=1min              # how precisely to fire

[Install]
WantedBy=timers.target
```

Enable and inspect:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now backup.timer
systemctl list-timers --all          # NEXT run, LAST run, for every timer
systemctl status backup.service      # the last run's result + output
journalctl -u backup.service         # full history of the job
```

`OnCalendar` is powerful: `hourly`, `daily`, `weekly`, `Mon *-*-* 09:00:00`,
`*-*-01 00:00:00` (monthly), `*:0/15` (every 15 min). Test an expression without
waiting:

```bash
systemd-analyze calendar "Mon *-*-* 09:00:00"   # shows the next elapse times
```

> [!IMPORTANT]
> **`Persistent=true` is the killer feature.** With cron, a job scheduled for 02:00
> simply **doesn't run** if the server was off at 02:00 — the backup is silently
> skipped. A persistent timer **runs the missed job at the next boot**, so laptops,
> spot instances and rebooted servers still get their backups. After editing any
> unit, remember **`systemctl daemon-reload`**.

## Part 5 — Choosing, and verifying it actually ran

**Use cron** for quick, simple, personal jobs and maximum portability. **Use
systemd timers** on servers where you want logging, missed-run handling, resource
control and dependency ordering. Many shops standardize on timers precisely
because `journalctl -u name` answers "did it run, and what happened?" instantly.

Whichever you pick, **verify** — a schedule you never check is a hope:

```bash
# cron: confirm the job is registered and read its log + cron's own log
crontab -l
tail -n 50 /var/log/backup.log
journalctl -u cron --since today | grep -i backup     # or /var/log/syslog
grep CRON /var/log/syslog | tail

# timers: confirm scheduling and last result
systemctl list-timers --all | grep backup
systemctl status backup.service
journalctl -u backup.service --since "2 days ago"
```

## Hands-on lab

```bash
# 1. A cron job done RIGHT (absolute paths + logging)
( crontab -l 2>/dev/null; \
  echo '*/2 * * * * /bin/date >> /tmp/cron-lab.log 2>&1' ) | crontab -
crontab -l
sleep 130; cat /tmp/cron-lab.log        # one or two timestamped lines appear
crontab -l | grep -v cron-lab | crontab - 2>/dev/null || crontab -r   # clean up

# 2. The same job as a systemd timer
sudo tee /etc/systemd/system/datelab.service >/dev/null <<'EOF'
[Unit]
Description=Date lab oneshot
[Service]
Type=oneshot
ExecStart=/bin/sh -c '/bin/date >> /tmp/timer-lab.log'
EOF
sudo tee /etc/systemd/system/datelab.timer >/dev/null <<'EOF'
[Unit]
Description=Run datelab every minute
[Timer]
OnCalendar=*:0/1
Persistent=true
[Install]
WantedBy=timers.target
EOF
sudo systemctl daemon-reload
sudo systemctl enable --now datelab.timer

# 3. Verify scheduling and output
systemctl list-timers --all | grep datelab
systemd-analyze calendar "*:0/1" | head
sleep 70; cat /tmp/timer-lab.log
journalctl -u datelab.service --no-pager | tail

# 4. Clean up
sudo systemctl disable --now datelab.timer
sudo rm /etc/systemd/system/datelab.{service,timer}
sudo systemctl daemon-reload
rm -f /tmp/timer-lab.log /tmp/cron-lab.log
```

## Exercises

1. Write cron lines (don't install) for: every 10 minutes; 06:30 every weekday;
   the 1st of each month at midnight; once at every boot.
2. Add a real cron job that appends `date` to a log every 2 minutes **with**
   output redirection and absolute paths; confirm the log grows; then remove it.
3. Explain the two most common reasons a cron job "works in my shell but not in
   cron," and how you defend against each.
4. Create a systemd timer that runs a script daily at 07:00 with `Persistent=true`;
   show its next run with `list-timers` and `systemd-analyze calendar`.
5. Demonstrate how you'd verify, after the fact, that yesterday's scheduled backup
   actually ran (give the exact commands for both cron and a timer).

## Troubleshooting

- **cron job never runs** — check the cron service is active
  (`systemctl status cron`), the crontab saved (`crontab -l`), and the schedule is
  valid. Read `/var/log/syslog` / `journalctl -u cron` for `CRON` lines.
- **Runs interactively, fails in cron** — minimal environment. *Fix:* absolute
  paths, set `PATH` at the top of the crontab, and capture output with
  `>> log 2>&1` to see the real error.
- **`date +%F` breaks in a crontab** — the `%` means newline to cron. *Fix:*
  escape as `\%`, or put the command in a script and call the script.
- **Timer edited but unchanged behavior** — you forgot `systemctl daemon-reload`.
- **Timer "didn't run while the box was off"** — add `Persistent=true` so the
  missed run fires at next boot.
- **Two schedulers running the same job** — you migrated cron→timer but left the
  cron line. *Fix:* remove one; check both `crontab -l` and `list-timers`.

Reproduce the environment trap: a cron line calling `myscript` (no path) fails;
change it to `/full/path/myscript >> /tmp/x.log 2>&1` and read the log.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Run the practical items.

1. What are the five cron time fields, in order?
2. Write a cron schedule for "every weekday at 18:15."
3. Name the two most common cron failure causes and the fix for each.
4. How does `/etc/cron.d/` differ from a user crontab?
5. What do `OnCalendar` and `Persistent=true` do in a systemd timer?
6. Which command lists all timers with their next/last run?
7. How do you test an `OnCalendar` expression without waiting?
8. When would you choose a systemd timer over cron?
9. **Practical:** add, confirm, and remove a logging cron job. Commands?
10. **Practical:** after a timer runs, show its last result and logs. Commands?

## Solutions & validation

1. **minute, hour, day-of-month, month, day-of-week.**
2. `15 18 * * 1-5`.
3. **Relative paths / missing PATH** (fix: absolute paths + set PATH) and **lost
   output** (fix: `>> log 2>&1`).
4. `/etc/cron.d/` files are **system** crontabs with an extra **user** field (who
   to run as); a user crontab always runs as that user and has no user field.
5. `OnCalendar` sets **when** the timer fires; `Persistent=true` runs a **missed**
   job at the next boot if the system was off at the scheduled time.
6. `systemctl list-timers --all`.
7. `systemd-analyze calendar "<expression>"`.
8. On servers needing **journald logging, missed-run catch-up, randomized delays,
   resource limits, or dependency ordering**.
9. **Validation:** `crontab -e`/piped install of `*/2 * * * * /bin/date >> log
   2>&1`, `crontab -l` shows it, the log grows, then `crontab -r`/filtered removal.
10. **Validation:** `systemctl status <svc>` (last result) and `journalctl -u
    <svc>` (full output history).

> [!TIP]
> "Absolute paths, capture output, and verify it ran" is the reliability mindset
> that separates scheduled jobs you can trust from ones that fail in silence. Apply
> it to every job you ever schedule.

## What's next

Next: **Lesson 210 — Logging Architecture.** Your scheduled jobs (and everything
else) produce logs — now you'll master where they go and how to manage them at
scale: the **systemd journal** vs **rsyslog** and `/var/log`, structured queries
with `journalctl`, persistent vs volatile journals, **logrotate**, and the basics
of shipping logs to a central server.
