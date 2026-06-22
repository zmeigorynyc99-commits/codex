---
title: "Linux Fundamentals — systemd & Services"
slug: "linux-fundamentals-systemd-and-services"
track: "linux-fundamentals"
trackName: "Linux Fundamentals"
module: "Users, Permissions & Processes"
order: 116
level: "Intermediate"
difficulty: "Intermediate"
distribution: "Ubuntu"
category: "Linux Fundamentals"
tags: [linux, systemd, systemctl, journalctl, services, units, intermediate]
cover: "/covers/curriculum/linux-fundamentals.svg"
estMinutes: 60
status: "published"
summary: "Run software the way real servers do — as managed services. Use systemctl to start, stop, enable, disable and inspect services, read their logs with journalctl, understand unit files, and write your own simple service so a program starts on boot and restarts on failure."
seoTitle: "Linux Fundamentals 16: systemd, systemctl & journalctl"
seoDescription: "Intermediate Linux: manage services with systemctl (start/stop/enable/status), read logs with journalctl, understand unit files, and write your own systemd service. Lab + assessment."
---

In the last lesson you ran programs by hand and backgrounded them with `&` and
`nohup`. Real servers don't work that way. Software that must always be running — a
web server, a database, your own app — runs as a **service** managed by **systemd**,
the init system on virtually every modern Linux distribution. systemd starts
services on boot, restarts them if they crash, manages dependencies, and collects
their logs. Mastering its control panel, **`systemctl`**, and its log reader,
**`journalctl`**, is a daily, essential skill.

## Learning objectives

By the end of this lesson you will be able to:

- Explain what **systemd**, a **service**, and a **unit** are.
- Control services with **`systemctl`**: start, stop, restart, reload, status.
- **Enable**/**disable** services for boot, and know how that differs from
  start/stop.
- Read service logs with **`journalctl`** (filter by unit, time, priority, follow).
- Understand a **unit file** and write a simple one of your own.

## Part 1 — systemd, services, and units

**systemd** is **PID 1** (Lesson 115) — the first process at boot and the manager of
everything that follows. It controls the system through **units**, configuration
objects of several types. The one you'll use most is the **service unit**
(`.service`), which describes a program systemd should run and supervise.

Common unit types you'll meet:

| Type | Suffix | Describes |
|------|--------|-----------|
| service | `.service` | a daemon/program to run (nginx, ssh) |
| socket | `.socket` | a socket that starts a service on demand |
| timer | `.timer` | a scheduled job (a modern cron — covered later) |
| target | `.target` | a group of units / a "runlevel" (e.g. `multi-user.target`) |
| mount | `.mount` | a filesystem mount point |

```bash
systemctl                       # list active units (q to quit the pager)
systemctl list-units --type=service       # all loaded services
systemctl list-unit-files --type=service  # all installed services + their boot state
```

## Part 2 — Controlling services with systemctl

The everyday verbs, using `ssh` (or `nginx`) as the example service:

```bash
systemctl status ssh            # is it running? recent logs? (no sudo needed to read)
sudo systemctl start ssh        # start it now
sudo systemctl stop ssh         # stop it now
sudo systemctl restart ssh      # stop then start (brief downtime)
sudo systemctl reload ssh       # re-read config WITHOUT dropping connections (if supported)
sudo systemctl reload-or-restart ssh   # reload if possible, else restart
```

Reading `systemctl status` is a skill in itself — it packs a lot in:

```text
● ssh.service - OpenBSD Secure Shell server
     Loaded: loaded (/lib/systemd/system/ssh.service; enabled; ...)
     Active: active (running) since Mon 2026-06-22 09:00:00 UTC; 2h ago
   Main PID: 812 (sshd)
     ...
```

- **Loaded:** where the unit file is, and whether it's **enabled** (starts at boot).
- **Active:** the live state — `active (running)`, `inactive (dead)`,
  `failed`, etc.
- **Main PID:** the process (ties back to Lesson 115).
- The tail shows the most recent log lines — often enough to diagnose a problem at a
  glance.

> [!IMPORTANT]
> **`reload` vs `restart`:** `reload` re-reads configuration **without stopping** the
> service (no dropped connections) — prefer it after a config change when the
> service supports it (nginx, ssh do). `restart` fully stops and starts it (a brief
> outage). Reaching for `reload` first is a professional reflex that avoids
> needless downtime.

## Part 3 — Enable vs start (boot persistence)

This trips up every beginner: **start** and **enable** are different axes.

- **start / stop** affect the service **right now**, this boot.
- **enable / disable** affect whether it **starts automatically at boot** — and do
  nothing to the current state.

```bash
sudo systemctl enable nginx       # will start on boot (but is NOT started now)
sudo systemctl disable nginx      # will NOT start on boot (still running now if it was)
sudo systemctl enable --now nginx # enable AND start in one go (the common combo)
sudo systemctl disable --now nginx# disable AND stop
systemctl is-enabled nginx        # boot state: enabled/disabled
systemctl is-active nginx         # current state: active/inactive
```

> [!IMPORTANT]
> A freshly installed service is often **running now but not enabled** (or vice
> versa). If a service you "started" is gone after a reboot, you forgot to
> **enable** it. The reliable pattern for "I want this running now and after every
> reboot" is **`systemctl enable --now <service>`**.

## Part 4 — Reading logs with journalctl

systemd captures each service's output into the **journal**. `journalctl` queries
it — your single most useful troubleshooting tool on a modern system:

```bash
journalctl -u ssh                 # all logs for the ssh UNIT
journalctl -u nginx --since "1 hour ago"      # time-filtered
journalctl -u nginx --since today
journalctl -u nginx -f            # FOLLOW live (like tail -f; Ctrl+C to stop)
journalctl -u nginx -n 50         # last 50 lines
journalctl -p err -b              # priority error-and-worse, this boot (-b)
journalctl -b                     # everything since the last boot
journalctl --since "2026-06-22 09:00" --until "2026-06-22 10:00"
```

Two everyday combos: `journalctl -u <svc> -e` jumps to the **end** (newest), and
`journalctl -u <svc> -f` watches live while you reproduce a problem. To stop the
journal eating disk, cap it (you saw this in the operations lesson):

```bash
journalctl --disk-usage           # how big is the journal?
sudo journalctl --vacuum-time=14d # keep only the last 14 days
```

> [!TIP]
> When a service won't start, the workflow is almost always: `systemctl status
> <svc>` (the summary + last lines), then `journalctl -xeu <svc>` for the full,
> explained recent log (`-x` adds hints, `-e` jumps to the end, `-u` filters to the
> unit). Those two commands diagnose the large majority of service failures.

## Part 5 — Anatomy of a unit file (and writing one)

Service unit files live in `/lib/systemd/system/` (shipped by packages) and
`/etc/systemd/system/` (your local/custom ones — these take precedence). A minimal
service looks like this:

```ini
# /etc/systemd/system/myapp.service
[Unit]
Description=My example app
After=network.target            # start after the network is up

[Service]
ExecStart=/usr/local/bin/myapp  # the command to run (absolute path!)
Restart=on-failure              # restart automatically if it crashes
User=myapp                      # run as an unprivileged user, not root
WorkingDirectory=/opt/myapp

[Install]
WantedBy=multi-user.target      # 'enable' hooks it into normal multi-user boot
```

After creating or editing a unit, tell systemd to re-read its config, then
enable/start it:

```bash
sudo systemctl daemon-reload      # REQUIRED after adding/editing a unit file
sudo systemctl enable --now myapp # start now and on boot
systemctl status myapp
```

The three sections: **`[Unit]`** (description + ordering/dependencies),
**`[Service]`** (what to run and how to supervise it), **`[Install]`** (what
`enable` wires it into). This is exactly how production software — including your
own apps — is run reliably.

> [!IMPORTANT]
> **Always `sudo systemctl daemon-reload` after creating or editing a unit file.**
> systemd caches unit definitions; without a reload it keeps using the old version
> and your changes appear to "do nothing." Edit → `daemon-reload` → `restart`/
> `enable`. Use absolute paths in `ExecStart` (systemd has a minimal environment,
> just like cron).

## Hands-on lab

```bash
# 1. Explore real services
systemctl status ssh            # read every field; q to exit the pager
systemctl is-enabled ssh
systemctl is-active ssh
systemctl list-units --type=service --state=running | head

# 2. Logs for a unit
journalctl -u ssh -n 20         # last 20 lines
journalctl -u ssh --since today | tail

# 3. Write and run your OWN service (safe, disposable)
printf '#!/usr/bin/env bash\nwhile true; do echo "myapp alive $(date)"; sleep 10; done\n' \
  | sudo tee /usr/local/bin/myapp.sh
sudo chmod +x /usr/local/bin/myapp.sh

sudo tee /etc/systemd/system/myapp.service >/dev/null <<'EOF'
[Unit]
Description=Demo app for the systemd lesson
After=network.target

[Service]
ExecStart=/usr/local/bin/myapp.sh
Restart=on-failure

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now myapp
systemctl status myapp          # active (running)
journalctl -u myapp -f          # watch it log every 10s; Ctrl+C to stop

# 4. Prove Restart=on-failure: kill it and watch systemd revive it
sudo systemctl kill myapp; sleep 2; systemctl status myapp | head -4

# 5. Clean up
sudo systemctl disable --now myapp
sudo rm /etc/systemd/system/myapp.service /usr/local/bin/myapp.sh
sudo systemctl daemon-reload
```

## Exercises

1. Report whether `ssh` is (a) currently active and (b) enabled at boot, using two
   separate commands.
2. Show the last 30 log lines for the `ssh` service, then follow them live and stop
   cleanly.
3. Explain, with commands, the difference between `systemctl start nginx` and
   `systemctl enable nginx`.
4. Write a unit file for a script of your own, enable it, and confirm it runs.
   Which command did you run after creating the file, and why?
5. Make your service auto-restart after a crash, then demonstrate it by killing the
   process and showing systemd brought it back.

## Troubleshooting

- **"I started a service but it's gone after reboot"** — you started it but never
  **enabled** it. *Fix:* `sudo systemctl enable --now <svc>`.
- **Edited a unit file but nothing changed** — systemd is using the cached version.
  *Fix:* `sudo systemctl daemon-reload`, then restart the service.
- **`systemctl status` shows `failed`** — *Fix:* `journalctl -xeu <svc>` to read why;
  common causes are a wrong path in `ExecStart`, a permissions issue, or a config
  error in the program itself.
- **`Job for X.service failed`** on start — same drill: `journalctl -xeu X` shows the
  actual error. For services like nginx, also run the app's own config test
  (`nginx -t`) before restarting.
- **Service runs in foreground / exits immediately** — your `ExecStart` program
  forks or returns; for most cases `Type=simple` (the default) expects a
  long-running foreground process. Match `Type=` to how your program behaves.

Reproduce the daemon-reload lesson with the lab service: change its `Description`,
run `systemctl status` (still old), then `daemon-reload` and check again (updated).

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Run the practical items on
a VM.

1. What is systemd, and what PID does it run as?
2. What is a "unit," and what does a `.service` unit describe?
3. Give the commands to start, stop, and restart a service.
4. What's the difference between `reload` and `restart`?
5. What's the difference between `start` and `enable`?
6. Which command shows a service's status and recent logs together?
7. How do you view only the logs for the `nginx` unit, following live?
8. Why must you run `daemon-reload` after editing a unit file?
9. **Practical:** is `ssh` enabled at boot on your system? Which command told you?
10. **Practical:** show the last 20 journal lines for `ssh`. Command?

## Solutions & validation

1. The init system and service manager that runs as **PID 1**, the first process at
   boot.
2. A **unit** is a systemd configuration object; a `.service` unit describes a
   **program/daemon to run and supervise**.
3. `sudo systemctl start <svc>`, `sudo systemctl stop <svc>`, `sudo systemctl
   restart <svc>`.
4. `reload` re-reads config **without stopping** the service (no dropped
   connections); `restart` **stops and starts** it (brief downtime).
5. `start` runs it **now**; `enable` makes it **start at boot** (independent of the
   current state). `enable --now` does both.
6. `systemctl status <svc>`.
7. `journalctl -u nginx -f`.
8. systemd **caches** unit definitions; `daemon-reload` makes it pick up your edits
   (otherwise the old definition is used).
9. **Validation:** `systemctl is-enabled ssh` prints `enabled` or `disabled`.
10. **Validation:** `journalctl -u ssh -n 20` prints up to 20 recent lines.

> [!TIP]
> `systemctl` + `journalctl` are the daily control panel of every Linux server.
> "Is it running? start/enable it. Why did it break? status + journalctl." That
> loop will serve you for your entire career.

## What's next

Next: **Lesson 117 — Package Management.** Services come from software, and software
comes from **packages**. You'll master installing, updating, searching and removing
software with `apt` (Debian/Ubuntu) and the equivalents on other distros
(`dnf`, `pacman`), understand repositories and signing, and keep a system patched —
the safe, repeatable way Linux installs everything.
