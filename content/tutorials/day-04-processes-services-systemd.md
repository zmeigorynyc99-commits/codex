==================================================================
HOW TO ADD THIS TUTORIAL (admin area)
------------------------------------------------------------------
1. Sign in at  https://botera.md/admin/login
2. Click  "New tutorial"
3. Copy each field below into the matching box.
4. Paste everything under "CONTENT (MARKDOWN)" into the big
   "Content (Markdown)" editor. Use "Show preview" to check it.
5. Set Status = Published (or Draft first), then Save.
   Tip: set the Publication date one day after Day 3.
==================================================================

TITLE:
Linux to DevOps Roadmap — Day 4: Processes, Services & systemd

URL SLUG:
linux-to-devops-day-4-processes-services-systemd

SUMMARY:
Day 4 of the Linux-to-DevOps roadmap. See what's running with ps and top, stop
runaway programs with kill, and — the DevOps core — manage long-running services
with systemd (systemctl) and read their logs with journalctl. You'll even build
your own service. About one hour, with a hands-on lab and Windows parallels.

CATEGORY:
Getting Started

TAGS:
linux, devops, roadmap, processes, systemd, systemctl, journalctl, services, beginner

DIFFICULTY:
Beginner

DISTRIBUTION:
General Linux

AUTHOR:
botera

COVER IMAGE (paste this URL into the "Cover image" box):
https://botera.md/covers/linux-devops-day-4.svg

SEO TITLE:
Linux to DevOps — Day 4: Processes, Services & systemd (Beginner)

SEO DESCRIPTION:
Day 4 of the Linux-to-DevOps roadmap: ps and top, kill signals, manage services
with systemctl and read logs with journalctl — build your own service. ~1 hour.

------------------------------------------------------------------
CONTENT (MARKDOWN) — paste everything below this line
------------------------------------------------------------------

Welcome to **Day 4** of the **Linux to DevOps Roadmap**. You can now navigate the
system, wrangle text, and control who can do what. Today we make the system
*come alive*: we look at **processes** — the running programs — and then at
**services**, the long-running programs that a server exists to run, managed by
**systemd**.

This is the lesson where "Linux admin" turns into "DevOps". Every web server,
database, message queue and app you'll ever deploy runs as a **service**.
Knowing how to start, stop, enable, inspect and read the logs of a service — and
how to write your own — is a core, daily DevOps skill. Let's get it solid.

> [!NOTE]
> About an hour with the lab. The systemd parts use `sudo`, so do them on your
> practice VM or cloud server. Keep your `~/devops-lab` folder handy.

## Today's mission

By the end of this hour you'll be able to:

- Explain what a **process** is and list what's running with **ps** and **top**.
- Run programs in the **background** and manage **jobs**.
- Stop processes cleanly (and forcefully) with **signals** and **kill**.
- Check a server's **resource usage** (CPU, memory, disk, load).
- Manage services with **systemd**: `systemctl start/stop/restart/enable/status`.
- **Write and run your own systemd service.**
- Read service logs with **journalctl**.

## Part 1 — What is a process?

A **process** is a running instance of a program. When you launch `nano`, the
kernel creates a process for it; when it exits, the process ends. Every process
has:

- a **PID** (process ID) — a unique number identifying it,
- a **parent** process (its PPID) that started it,
- an **owner** (the user it runs as — remember Day 3),
- and its own slice of CPU and memory.

The whole system is a tree of processes descending from the very first one
(`systemd`, PID 1), which the kernel starts at boot.

## Part 2 — See what's running: ps and top

`ps` takes a snapshot of current processes. The flags everyone uses are
`ps aux` (BSD style) or `ps -ef`:

```bash
ps aux | head             # USER, PID, %CPU, %MEM, COMMAND ...
ps -ef | grep nginx       # find a specific process (or use pgrep)
pgrep -a sshd             # list PIDs whose command matches "sshd"
```

`ps` is a still photo. For a **live, updating** view — the Linux equivalent of
Task Manager — use `top`:

```bash
top      # press 'q' to quit, 'M' to sort by memory, 'P' by CPU
```

Even better, if it's installed, is `htop` (colourful, scrollable, mouse-friendly):

```bash
sudo apt install -y htop
htop     # F10 or 'q' to quit
```

The header of `top`/`htop` is a quick server health dashboard. The most important
number is the **load average** (three numbers: the last 1, 5 and 15 minutes).
Roughly, a load average equal to your number of CPU cores means the machine is
fully busy; much higher means work is queuing up. Check your core count with
`nproc`.

## Part 3 — Foreground, background and jobs

A command normally runs in the **foreground** — it holds your terminal until it
finishes. Sometimes you want it to run in the **background** so you get your
prompt back. Append `&`:

```bash
cd ~/devops-lab
sleep 300 &        # runs in the background; prints its job number and PID
jobs               # list background jobs in this shell
```

Job control keys and commands:

- **Ctrl + Z** — suspend the foreground program (pauses it, gives you the prompt).
- `bg` — resume the suspended job in the background.
- `fg` — bring a background job back to the foreground.
- `jobs -l` — list jobs with their PIDs.

> [!TIP]
> A background job started with `&` still dies when you close the terminal. To
> keep something running after you log out, use `nohup command &` or — much
> better for anything real — make it a **systemd service** (Part 6). On servers,
> "I started it with `&` and it vanished when I disconnected" is a classic
> beginner trap; services are the professional answer.

## Part 4 — Signals: stopping processes with kill

You stop a process by sending it a **signal**. Despite the scary name, `kill`
just delivers a signal to a PID. The two that matter most:

- **SIGTERM (15)** — the default. "Please shut down cleanly." The program can
  finish writing files, close connections, then exit. **Always try this first.**
- **SIGKILL (9)** — "Stop immediately, no cleanup." The kernel terminates the
  process at once. Use only as a last resort.

```bash
sleep 600 &
kill <PID>          # polite shutdown (SIGTERM) — use the PID from jobs/ps
kill -9 <PID>       # force kill (SIGKILL) — last resort
pkill sleep         # kill by name instead of PID
killall sleep       # similar: kill all processes named 'sleep'
```

> [!WARNING]
> Don't reach for `kill -9` first. SIGKILL gives the program **no chance to clean
> up**, which can corrupt files or leave a database in a bad state. Send a normal
> `kill` (SIGTERM), wait a few seconds, and only escalate to `-9` if it's truly
> stuck. And always double-check the PID — killing the wrong one can take down a
> service.

## Part 5 — Resource usage at a glance

A handful of commands answer "is this server healthy?":

```bash
uptime         # how long it's been up + the load average
free -h        # memory: used / free / available (human-readable)
df -h          # disk space per filesystem (watch for 100% — a common outage!)
du -sh *       # size of each item in the current directory
nproc          # number of CPU cores
```

> [!IMPORTANT]
> "**Disk full**" is one of the most common real-world incidents. A full disk
> (`df -h` shows 100%) makes services fail in confusing ways — they can't write
> logs, databases, or temp files. When something breaks mysteriously on a server,
> `df -h` and `free -h` are two of the first commands an experienced engineer runs.

## Part 6 — systemd: how Linux runs services

On modern Linux, **systemd** is the "init" system — process 1 — and the **service
manager**. It starts services at boot, restarts them if they crash, manages their
dependencies and collects their logs. You control it with one command:
**`systemctl`**.

Each service is described by a **unit file** (e.g. `nginx.service`). The everyday
commands:

```bash
systemctl status ssh         # is it running? show recent log lines (q to quit)
sudo systemctl start  ssh    # start it now
sudo systemctl stop   ssh    # stop it now
sudo systemctl restart ssh   # stop then start (apply config changes)
sudo systemctl reload ssh    # reload config without dropping connections (if supported)
sudo systemctl enable ssh    # start automatically at every boot
sudo systemctl disable ssh   # don't start at boot
systemctl is-enabled ssh     # check the boot setting
systemctl is-active  ssh     # check the running state
```

Quick reference for the commands you'll use every day:

| Command | What it does |
|---------|--------------|
| `systemctl status NAME` | Is it running? Show state + recent logs |
| `systemctl start NAME` | Start the service **now** |
| `systemctl stop NAME` | Stop it now |
| `systemctl restart NAME` | Stop then start (apply config changes) |
| `systemctl reload NAME` | Reload config without a full restart |
| `systemctl enable NAME` | Start automatically **at boot** |
| `systemctl enable --now NAME` | Enable **and** start, in one command |
| `systemctl disable NAME` | Don't start at boot |
| `journalctl -u NAME -f` | Follow the service's live logs |

> [!IMPORTANT]
> **`start` and `enable` are different things — this confuses everyone at first.**
> `start` runs the service **right now** (but it won't come back after a reboot).
> `enable` makes it start **automatically at boot** (but doesn't start it now).
> For a real service you usually want both, which is why there's a shortcut:
> `sudo systemctl enable --now nginx` does both in one command.

List and explore units:

```bash
systemctl list-units --type=service          # running services
systemctl list-units --type=service --all    # including stopped ones
systemctl --failed                            # services that crashed — start here when debugging
```

## Part 7 — Build your own systemd service

This is the skill that makes you dangerous (in a good way). Let's turn a plain
script into a managed, auto-restarting, boot-starting service — exactly how you'd
run a custom app in production. Do this on your practice machine.

**1. Create a tiny program** that just writes a heartbeat every few seconds:

```bash
sudo tee /usr/local/bin/heartbeat.sh > /dev/null <<'EOF'
#!/bin/bash
while true; do
  echo "heartbeat at $(date '+%H:%M:%S')"
  sleep 5
done
EOF
sudo chmod +x /usr/local/bin/heartbeat.sh
```

**2. Describe it as a service** in a unit file:

```bash
sudo tee /etc/systemd/system/heartbeat.service > /dev/null <<'EOF'
[Unit]
Description=Heartbeat demo service
After=network.target

[Service]
ExecStart=/usr/local/bin/heartbeat.sh
Restart=on-failure
User=nobody

[Install]
WantedBy=multi-user.target
EOF
```

A quick tour of that unit file: **[Unit]** holds metadata and ordering (`After=`);
**[Service]** says what to run (`ExecStart=`), how to recover (`Restart=on-failure`)
and which user to run as (least privilege — Day 3!); **[Install]** says when it
should auto-start (`multi-user.target` ≈ "normal boot").

**3. Tell systemd about it, then start and enable it:**

```bash
sudo systemctl daemon-reload          # re-read unit files after adding/editing one
sudo systemctl enable --now heartbeat # start now AND on every boot
systemctl status heartbeat            # should say "active (running)" — press q
```

> [!WARNING]
> Whenever you create or edit a unit file in `/etc/systemd/system/`, you **must**
> run `sudo systemctl daemon-reload` before systemd sees the change. Forgetting
> this — then wondering why your edit "did nothing" — is the single most common
> systemd mistake.

## Part 8 — Read the logs with journalctl

systemd captures everything your service prints (stdout/stderr) into the
**journal**. `journalctl` reads it — this is where you'll live when debugging.

```bash
journalctl -u heartbeat            # all logs for our service (q to quit)
journalctl -u heartbeat -f         # FOLLOW live, like tail -f (Ctrl+C to stop)
journalctl -u heartbeat --since "10 min ago"
journalctl -u nginx -p err         # only error-priority messages
journalctl -b                      # logs since the last boot
```

Run `journalctl -u heartbeat -f` and watch your heartbeats appear every 5
seconds. **That feedback loop — change something, watch the logs — is the heart
of operating services.** When clean up:

```bash
sudo systemctl disable --now heartbeat     # stop and remove from boot
sudo rm /etc/systemd/system/heartbeat.service /usr/local/bin/heartbeat.sh
sudo systemctl daemon-reload
```

## Hands-on lab: from runaway process to managed service

```bash
# PART A — processes
# 1. Start a long background task and find it
sleep 1000 &
jobs -l
ps aux | grep "[s]leep 1000"      # the [s] trick hides grep itself from results

# 2. Watch the system live, then quit with q
top        # press 'q'

# 3. Stop the task politely, then confirm it's gone
kill %1                            # %1 = job number 1; or use the PID
jobs

# PART B — your own service (uses sudo; see Part 7 for the file contents)
# 4. Create heartbeat.sh and heartbeat.service (copy from Part 7)
# 5. Enable + start it, then verify
sudo systemctl daemon-reload
sudo systemctl enable --now heartbeat
systemctl is-active heartbeat      # -> active

# 6. Read its live logs for ~15 seconds, then Ctrl+C
journalctl -u heartbeat -f

# 7. Prove auto-restart: kill the script and watch systemd bring it back
sudo systemctl status heartbeat    # note the main PID, press q
sudo kill <that-PID>
sleep 2
systemctl is-active heartbeat      # still active — systemd restarted it!

# 8. Clean up (Part 7 cleanup commands)
```

If step 7 shows the service still `active` after you killed it, you've just
witnessed the core value of a service manager: **self-healing processes.** That's
why we run things as services instead of `command &`.

## For Windows people: the same concepts

Windows has the identical ideas under different names. Processes live in **Task
Manager**; long-running services are **Windows Services**, managed by the Service
Control Manager; logs go to the **Event Viewer**. In PowerShell:

```powershell
# ps / top            -> processes
Get-Process | Sort-Object CPU -Descending | Select-Object -First 10
Stop-Process -Name notepad            # like kill by name

# systemctl            -> Windows services
Get-Service                            # list services
Get-Service -Name W32Time             # status of one
Start-Service  W32Time                # systemctl start
Stop-Service   W32Time                # systemctl stop
Restart-Service W32Time               # systemctl restart
Set-Service -Name W32Time -StartupType Automatic   # ~ systemctl enable

# journalctl           -> Event Viewer / Get-WinEvent
Get-WinEvent -LogName System -MaxEvents 20
```

> [!NOTE]
> Concept map: Linux **process** ≈ Windows **process**; **systemd service** ≈
> **Windows Service**; **systemctl** ≈ **Start/Stop/Restart-Service**; **enable**
> ≈ **StartupType Automatic**; **journalctl** ≈ **Event Viewer / Get-WinEvent**.
> Same operational thinking on both platforms.

## Common mistakes to avoid

- **`kill -9` as the first move.** Try a normal `kill` (SIGTERM) first; escalate
  only if stuck.
- **Confusing `start` with `enable`.** `start` = now; `enable` = at boot. Use
  `enable --now` for both.
- **Editing a unit file and forgetting `daemon-reload`.** systemd won't see your
  change until you reload.
- **Running apps with `command &`** and expecting them to survive logout/reboot.
  Make a service.
- **Ignoring `df -h`.** A full disk causes baffling failures; check it early.
- **Killing the wrong PID.** Confirm with `ps`/`systemctl status` before you kill.

## Recap — what you learned today

- A **process** is a running program with a PID and an owner; see them with
  **ps** and the live **top**/**htop**.
- Run jobs in the **background** (`&`, `Ctrl+Z`, `bg`, `fg`, `jobs`).
- Stop processes with **signals**: `kill` (SIGTERM) first, `kill -9` (SIGKILL)
  only as a last resort; `pkill`/`killall` by name.
- Check health with **uptime**, **free -h**, **df -h**, **du -sh**, load average.
- **systemd** runs services; control them with **systemctl**
  (`start/stop/restart/enable/status`), and remember **`enable --now`**.
- You can **write your own service** with a unit file + `daemon-reload`.
- Read service logs with **journalctl** (`-u`, `-f`, `--since`, `-p err`, `-b`).

## Homework (15–20 minutes)

1. Run `top` (or `htop`) and identify the process using the most CPU and the most
   memory on your machine.
2. Start `sleep 500 &`, find its PID with `pgrep sleep`, then stop it with a plain
   `kill`.
3. Run `df -h` and `free -h`; write down how much disk and memory are free.
4. Pick a real service on your system (e.g. `ssh` or `cron`) and run
   `systemctl status`, `is-enabled` and `is-active` on it.
5. Recreate the `heartbeat` service from Part 7, follow its logs with
   `journalctl -u heartbeat -f`, then remove it cleanly.
6. Bonus: edit the unit to `Restart=always`, run `daemon-reload` + `restart`, and
   confirm with `systemctl show heartbeat -p Restart`.

## Common questions

**What's the difference between a process and a service?**
A service is just a process that's *managed by systemd* — started at boot,
restarted on failure, with its logs collected. All services are processes; not
all processes are services.

**When should I make something a systemd service?**
Any time it needs to run continuously, survive reboots, restart on crash, or
start automatically — web servers, databases, your own apps. For one-off tasks,
just run them; for scheduled tasks, you'll use timers/cron (coming up).

**Why does `systemctl status` show logs?**
systemd integrates the service manager and the log system (the journal), so the
status view conveniently includes the most recent log lines. Use `journalctl`
for the full history.

**Is `kill -9` ever the right call?**
Yes — when a process is genuinely hung and ignores SIGTERM. It's the emergency
brake, not the normal brake.

## What's next — Day 5

On **Day 5** we install and run real software: **package management**
(`apt update/upgrade/install/remove`, how repositories work) and then we put
Days 1–4 together to **set up your first real web server with Nginx** — install
it, manage it as a service, serve a page, and read its logs. This is where the
roadmap starts producing things other people can actually visit.

Outstanding work — you can now run, inspect and heal the services that a server
exists to provide. Rebuild the heartbeat service from memory before Day 5.
