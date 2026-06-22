==================================================================
HOW TO ADD THIS TUTORIAL (admin area)
------------------------------------------------------------------
1. Sign in at  https://botera.md/admin/login
2. Click  "New tutorial"
3. Copy each field below into the matching box.
4. Paste everything under "CONTENT (MARKDOWN)" into the big
   "Content (Markdown)" editor. Use "Show preview" to check it.
5. Set Status = Published (or Draft first), then Save.
   Tip: set the Publication date one day after Day 8.
==================================================================

TITLE:
Linux to DevOps Roadmap — Day 9: Scheduling, Backups & Log Management

URL SLUG:
linux-to-devops-day-9-scheduling-backups-logs

SUMMARY:
Day 9 of the Linux-to-DevOps roadmap. Make work happen without you: schedule jobs
with cron and modern systemd timers, build a real backup strategy with tar and
rsync (and a 3-2-1 mindset), and tame logs with journald and logrotate so they
never fill the disk. About one hour, hands-on, with other-distro and Windows notes.

CATEGORY:
Getting Started

TAGS:
linux, devops, roadmap, cron, systemd-timers, backups, rsync, logrotate, journald, beginner

DIFFICULTY:
Beginner

DISTRIBUTION:
Ubuntu

AUTHOR:
botera

COVER IMAGE (paste this URL into the "Cover image" box):
https://botera.md/covers/linux-devops-day-9.svg

SEO TITLE:
Linux to DevOps — Day 9: cron, systemd Timers, Backups & logrotate (Beginner)

SEO DESCRIPTION:
Day 9 of the Linux-to-DevOps roadmap: schedule jobs with cron and systemd timers,
back up with tar/rsync, and manage logs with journald and logrotate. ~1 hour.

------------------------------------------------------------------
CONTENT (MARKDOWN) — paste everything below this line
------------------------------------------------------------------

Welcome to **Day 9** of the **Linux to DevOps Roadmap**. On Day 8 you wrote a
backup script — but a backup you have to remember to run isn't a backup, it's a
hope. Today you make work happen **automatically and reliably**: you'll **schedule
jobs** with cron and modern systemd timers, build a **real backup strategy**, and
**manage logs** so they never silently fill your disk and take the server down at
3 a.m. (a classic, avoidable outage).

This is the lesson that turns a server you babysit into one that looks after
itself. It's pure operations — exactly what "the Ops in DevOps" means.

> [!NOTE]
> About an hour with the lab. Use your practice server with the `backup.sh` from
> Day 8 (keep it in `~/devops-lab` or `/opt`). Some steps need `sudo`. Everything
> here is safe to try on a non-production box.

## Today's mission

- Schedule recurring jobs with **cron** and read **crontab** syntax fluently.
- Use modern **systemd timers** and know when to prefer them.
- Build a **backup strategy** (`tar`, `rsync`, the 3-2-1 rule) and *test restores*.
- Understand logs: **journald** vs files in **`/var/log`**.
- Stop logs eating the disk with **`logrotate`**.

## Part 1 — cron: the classic scheduler

**cron** runs commands on a schedule. Each user has a **crontab** (cron table) of
jobs. Edit yours with:

```bash
crontab -e          # edit your jobs (picks an editor the first time)
crontab -l          # list your jobs
```

Every line is five time fields followed by the command:

```text
┌───────── minute        (0 - 59)
│ ┌─────── hour          (0 - 23)
│ │ ┌───── day of month  (1 - 31)
│ │ │ ┌─── month         (1 - 12)
│ │ │ │ ┌─ day of week   (0 - 7, 0 and 7 are Sunday)
│ │ │ │ │
* * * * *  command-to-run
```

Real examples — read each one out loud:

```text
0 2 * * *      /opt/backup.sh /var/www /opt/backups   # every day at 02:00
*/15 * * * *   /opt/healthcheck.sh                      # every 15 minutes
0 3 * * 0      /opt/weekly-report.sh                    # Sundays at 03:00
30 4 1 * *     /opt/monthly.sh                          # 4:30 on the 1st of each month
@reboot        /opt/startup.sh                          # once, at every boot
```

> [!IMPORTANT]
> cron runs with a **minimal environment** — a bare `PATH` and no profile. The #1
> cron bug is "works when I type it, silently fails in cron." Defend against it:
> use **absolute paths** for everything (`/usr/bin/rsync`, not `rsync`; `/opt/
> backup.sh`, not `backup.sh`), and **capture output** so failures aren't lost:
>
> ```text
> 0 2 * * *  /opt/backup.sh /var/www /opt/backups >> /var/log/backup.log 2>&1
> ```
>
> The `>> ... 2>&1` appends both normal output and errors to a log you can read.

To run a job as **root** (e.g. system backups), use `sudo crontab -e`, or drop a
file into `/etc/cron.d/`. There are also handy directories — anything executable
in `/etc/cron.daily/`, `/etc/cron.weekly/` etc. runs on that cadence.

## Part 2 — systemd timers: the modern way

systemd (Day 4) has its own scheduler: **timers**. They're more verbose than cron
but more powerful — they log to the journal, can run a missed job after downtime
(`Persistent=true`), and tie into the whole systemd ecosystem.

A timer is **two files**: a `.service` (what to run) and a `.timer` (when):

```bash
sudo nano /etc/systemd/system/backup.service
```

```text
[Unit]
Description=Daily site backup

[Service]
Type=oneshot
ExecStart=/opt/backup.sh /var/www /opt/backups
```

```bash
sudo nano /etc/systemd/system/backup.timer
```

```text
[Unit]
Description=Run site backup daily at 02:00

[Timer]
OnCalendar=*-*-* 02:00:00
Persistent=true        # if the machine was off at 02:00, run it at next boot

[Install]
WantedBy=timers.target
```

Enable and inspect it (familiar Day 4 commands):

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now backup.timer
systemctl list-timers                  # see NEXT run time for all timers
systemctl status backup.service        # last run's result and output
journalctl -u backup.service           # full history/logs of the job
```

> [!TIP]
> Use **cron** for quick, simple, personal jobs — it's universal and instant to
> set up. Reach for **systemd timers** on servers when you want proper logging,
> missed-run handling, dependencies, or resource limits. Both are correct; many
> shops standardise on timers precisely because `journalctl -u name` shows you
> exactly what happened, which cron makes you wire up yourself.

## Part 3 — A real backup strategy

A backup script (Day 8) is step one. A **strategy** is what saves you. The
industry rule of thumb is **3-2-1**:

- **3** copies of your data,
- on **2** different types of media/storage,
- with **1** copy **off-site** (a different machine/region/provider).

Your tools:

**`tar`** bundles and compresses a directory into one portable archive:

```bash
tar -czf site-$(date +%F).tar.gz -C /var www      # create (c), gzip (z), file (f)
tar -tzf site-2026-06-22.tar.gz | head            # list (t) contents — verify it
tar -xzf site-2026-06-22.tar.gz -C /restore/here  # extract (x)
```

**`rsync`** (Day 6) syncs to another disk or, over SSH, to an **off-site** server —
and only transfers what changed, so nightly runs are fast:

```bash
# local copy to a second disk
rsync -a --delete /var/www/ /mnt/backupdisk/www/

# off-site copy over SSH (this is your "1" in 3-2-1)
rsync -az --delete /opt/backups/ backup@offsite-server:/srv/botera-backups/
```

> [!IMPORTANT]
> **A backup you've never restored is not a backup — it's a guess.** Schedule a
> calendar reminder to actually restore a backup to a scratch directory every so
> often and confirm the files are intact. The day you need a backup is the worst
> possible day to discover it was empty, corrupt, or missing the one directory
> that mattered. Test restores. Always.

Putting it together: schedule the Day 8 `backup.sh` (which already timestamps and
prunes), then `rsync` the result off-site — via cron or a timer. That's a real,
hands-off, 3-2-1-shaped backup system.

## Part 4 — Understand your logs

Linux logging comes in two overlapping forms:

1. **The systemd journal** (journald) — structured logs for all services, queried
   with `journalctl` (your Day 4 friend):

```bash
journalctl -u nginx --since "1 hour ago"   # one service, recent
journalctl -p err -b                        # priority error-and-worse, this boot
journalctl -f                               # follow everything live (like tail -f)
journalctl --disk-usage                     # how much space the journal uses
```

2. **Plain text files in `/var/log`** — many services still write here:

```bash
ls /var/log                                 # the lay of the land
sudo tail -f /var/log/nginx/access.log      # Day 5 again
sudo less /var/log/auth.log                 # authentication / sudo / SSH events
```

> [!TIP]
> `/var/log/syslog` (general system messages) and `/var/log/auth.log`
> (logins, sudo, SSH) are the two files you'll open most when something's wrong.
> Combine with Day 2's `grep`: `sudo grep -i 'fail' /var/log/auth.log` surfaces
> failed logins in a heartbeat.

## Part 5 — logrotate: stop logs eating the disk

Logs grow forever unless something trims them. **logrotate** rotates, compresses
and deletes old logs automatically — and it's almost certainly already running
daily on your server for the system's own logs. You add config for *your* apps.

```bash
sudo nano /etc/logrotate.d/myapp
```

```text
/var/log/myapp/*.log {
    daily                 # rotate every day
    rotate 14             # keep 14 old versions, then delete
    compress              # gzip rotated logs
    delaycompress         # keep the most recent rotation uncompressed
    missingok             # don't error if the log is absent
    notifempty            # skip rotation if the log is empty
    copytruncate          # safe for apps that hold the file open
}
```

Test your rule without waiting a day:

```bash
sudo logrotate --debug /etc/logrotate.d/myapp     # dry run: shows what it WOULD do
sudo logrotate --force /etc/logrotate.d/myapp     # force a rotation now
```

For the **journal**, you don't use logrotate — you cap it in
`/etc/systemd/journald.conf` (e.g. `SystemMaxUse=500M`) or vacuum it directly:

```bash
sudo journalctl --vacuum-size=500M     # keep at most 500 MB of journal
sudo journalctl --vacuum-time=30d      # delete entries older than 30 days
```

> [!IMPORTANT]
> "**Disk full**" is one of the most common causes of a server falling over, and
> runaway logs are a frequent culprit. `df -h` shows disk usage; `du -sh
> /var/log/*` shows which logs are the hogs. Configuring logrotate and capping the
> journal is preventive medicine that costs five minutes and saves a 3 a.m.
> outage.

## Hands-on lab: automate a backup end-to-end

```bash
# 1. Put the Day 8 backup script somewhere permanent
sudo cp ~/devops-lab/backup.sh /opt/backup.sh
sudo chmod +x /opt/backup.sh
sudo mkdir -p /opt/backups

# 2. Run it once by hand to confirm it works with absolute paths
/opt/backup.sh /etc /opt/backups
ls -lh /opt/backups

# 3a. Schedule it with cron — every day at 02:00, logging output
( crontab -l 2>/dev/null; \
  echo "0 2 * * * /opt/backup.sh /etc /opt/backups >> /var/log/backup.log 2>&1" ) | crontab -
crontab -l                              # confirm the job is there

# 3b. OR schedule it with a systemd timer (see Part 2), then:
systemctl list-timers | grep backup

# 4. Verify you can RESTORE (the step everyone skips — don't)
mkdir -p /tmp/restore-test
latest="$(ls -1t /opt/backups/etc-*.tar.gz | head -1)"
tar -xzf "$latest" -C /tmp/restore-test
ls /tmp/restore-test                    # your files are back — backup proven good

# 5. Add log rotation for your own backup log
printf '/var/log/backup.log {\n  weekly\n  rotate 8\n  compress\n  missingok\n  notifempty\n}\n' \
  | sudo tee /etc/logrotate.d/backup
sudo logrotate --debug /etc/logrotate.d/backup    # dry-run check

# 6. Check disk and journal health
df -h /
sudo du -sh /var/log/* | sort -h | tail
journalctl --disk-usage
```

If you scheduled the job, **restored** a backup successfully, and set up rotation
for its log — you've built a complete, self-maintaining backup pipeline. That's
production-grade operations.

## For Windows people

Windows schedules with **Task Scheduler** and backs up with built-in tools:

```powershell
# Schedule a daily task (the cron/timer equivalent)
$action  = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-File C:\scripts\backup.ps1"
$trigger = New-ScheduledTaskTrigger -Daily -At 2am
Register-ScheduledTask -TaskName "DailyBackup" -Action $action -Trigger $trigger

# Compress (tar/zip equivalent) and view logs
Compress-Archive -Path C:\inetpub\wwwroot -DestinationPath D:\backups\site.zip
Get-EventLog -LogName System -Newest 20        # logs live in Event Viewer
Get-WinEvent -LogName Security -MaxEvents 20
```

> [!NOTE]
> Concept map: **cron / systemd timers** ≈ **Task Scheduler**; **`tar`** ≈
> **`Compress-Archive`**; **journald / `/var/log`** ≈ **Event Viewer /
> `Get-WinEvent`**; **logrotate** ≈ Event Log size/retention settings. The 3-2-1
> rule and "test your restores" are universal truths on every operating system.

## Common mistakes to avoid

- **Relative paths in cron** — cron's `PATH` is tiny; use absolute paths and you'll
  avoid the most common cron failure.
- **No output capture** — without `>> log 2>&1`, a failing cron job fails silently.
  Log it.
- **Never testing restores** — an untested backup is a liability. Restore one
  regularly.
- **Only on-site backups** — a single failure (or ransomware, or a fat-fingered
  `rm`) takes both the data and the backup. Keep one copy off-site.
- **Ignoring disk usage** — runaway logs fill `/` and crash the box. Configure
  logrotate and cap the journal.
- **Forgetting `daemon-reload`** — after editing a `.service`/`.timer`, run
  `systemctl daemon-reload` or your changes aren't picked up.

## Recap — what you learned today

- **cron** schedules jobs via `crontab -e`; mind the **absolute paths** and
  **output logging**.
- **systemd timers** are the modern, well-logged alternative (`.service` +
  `.timer`, `list-timers`).
- A backup **strategy** beats a backup script: **3-2-1**, `tar` + `rsync`, and
  **tested restores**.
- Logs live in **journald** (`journalctl`) and **`/var/log`**; `auth.log` and
  `syslog` are your go-tos.
- **logrotate** and journal vacuuming stop logs from filling the disk.

## Homework (20–25 minutes)

1. Schedule `backup.sh` to run every day at a time of your choice via cron, with
   output appended to a log file.
2. Recreate the same job as a **systemd timer** and confirm it with `systemctl
   list-timers`.
3. **Restore** one of your backups into `/tmp/restore-test` and verify the files.
4. Write a `logrotate.d` rule for an app log: rotate weekly, keep 8, compress;
   test it with `logrotate --debug`.
5. Run `du -sh /var/log/* | sort -h` and identify your three largest logs.
6. Cap the journal with `journalctl --vacuum-time=14d` and re-check
   `journalctl --disk-usage`.

## Common questions

**cron or systemd timers — which should I learn?**
Both; they're each a one-liner of knowledge once you've seen them. Use cron for
quick personal jobs, timers for server services you want logged and resilient.
Knowing both makes you comfortable on any system you inherit.

**Where do my cron jobs' errors go?**
Nowhere, unless you redirect them — that's why we add `>> /var/log/backup.log
2>&1`. Some systems also email cron output to the local user; check `/var/mail`.
Explicit logging is the reliable habit.

**How often should I back up?**
As often as you'd hate to lose work. Daily is a sane default for most servers;
critical databases may want hourly or continuous. Match the frequency to how much
data you can afford to lose (your "recovery point").

**Is `rsync --delete` dangerous?**
It mirrors — it *deletes* destination files that no longer exist in the source. Run
with `--dry-run` first, and never point it at the wrong directory. Used carefully
it's perfect for keeping an off-site mirror exact.

## What's next — Day 10

You've now got a server that's reachable, secure, automated and backed up — a
complete operations baseline. **Day 10** is the bridge into the "Dev" half of
DevOps: **Git and version control**. You'll track changes, commit, branch, merge,
and push to **GitHub** — the skill that underpins collaboration, infrastructure-as
-code, and every CI/CD pipeline you'll build next. It ties the whole roadmap
together.

Superb work — automation and backups are what let engineers sleep at night.
Schedule one real job and test one real restore before moving on; that loop is the
job.
