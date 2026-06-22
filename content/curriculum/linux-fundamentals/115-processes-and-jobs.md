---
title: "Linux Fundamentals — Processes & Jobs"
slug: "linux-fundamentals-processes-and-jobs"
track: "linux-fundamentals"
trackName: "Linux Fundamentals"
module: "Users, Permissions & Processes"
order: 115
level: "Intermediate"
difficulty: "Intermediate"
distribution: "General Linux"
category: "Linux Fundamentals"
tags: [linux, processes, ps, top, kill, signals, jobs, intermediate]
cover: "/covers/curriculum/linux-fundamentals.svg"
estMinutes: 60
status: "published"
summary: "See and control everything running on a Linux system. List processes with ps, watch live with top and htop, understand PIDs and parent/child relationships, send signals with kill (TERM vs KILL), and manage background jobs with &, jobs, fg, bg and nohup."
seoTitle: "Linux Fundamentals 15: Processes, ps, top, kill & Signals"
seoDescription: "Intermediate Linux: list processes with ps, monitor with top/htop, PIDs, signals and kill (TERM vs KILL), plus background jobs with &, jobs, fg/bg and nohup. Lab + assessment."
---

Everything running on a Linux machine is a **process** — your shell, the web server,
the database, the very command you just typed. Being able to *see* what's running,
understand how much it's using, and *control* it (pause, background, or stop it) is
core to keeping a system healthy. When a server is slow or a program is stuck, this
lesson is what you'll reach for.

## Learning objectives

By the end of this lesson you will be able to:

- Explain what a **process**, a **PID**, and a **parent/child** relationship are.
- List processes with **`ps`** and find specific ones.
- Monitor live resource use with **`top`** and **`htop`**.
- Send **signals** with **`kill`** (and `pkill`/`killall`), knowing **TERM vs
  KILL**.
- Run and manage **background jobs**: `&`, `jobs`, `fg`, `bg`, `Ctrl+Z`, `nohup`.

## Part 1 — Processes and PIDs

A **process** is a running instance of a program. Each one has a unique **PID**
(Process ID), a number the system uses to refer to it. Processes form a tree:
every process has a **parent** (the process that started it), tracked as the
**PPID**. The very first process, **`init`/`systemd`**, has **PID 1** and is the
ancestor of everything.

```bash
echo $$            # the PID of your current shell
ps -p $$           # details about your shell process
pstree -p | head   # the process tree, with PIDs (install psmisc if missing)
```

Each process also has an **owner** (a user — Lesson 112), which determines what it's
allowed to do and **who may stop it**: you can signal your own processes; only root
can signal anyone's.

## Part 2 — `ps`: list processes

`ps` takes a snapshot of processes. The two forms you'll actually use:

```bash
ps aux             # EVERY process on the system, with owner & resource use
ps -ef             # every process, parent PIDs shown (PPID) — different style
ps aux | grep nginx   # find a specific program's processes
```

Reading `ps aux` columns (the important ones):

| Column | Meaning |
|--------|---------|
| USER | owner of the process |
| PID | process ID |
| %CPU / %MEM | share of CPU / memory it's using |
| STAT | state: `R` running, `S` sleeping, `Z` zombie, `D` uninterruptible |
| START / TIME | when it started / CPU time consumed |
| COMMAND | the command line that's running |

```bash
ps aux --sort=-%mem | head     # top memory consumers (Lesson 109 skills pay off)
ps aux --sort=-%cpu | head     # top CPU consumers
pgrep -a sshd                  # PIDs (and command) of processes named sshd
```

> [!TIP]
> `ps aux | grep name` includes the grep command itself in the results. Avoid that
> with `pgrep name` (purpose-built), or the trick `grep "[n]ame"` — the bracket
> matches `name` but the literal text `[n]ame` doesn't match itself.

## Part 3 — `top` and `htop`: live monitoring

`ps` is a snapshot; **`top`** updates continuously, showing the busiest processes in
real time — your first stop when a machine is slow:

```bash
top                # live view; press q to quit
```

Inside `top`: **q** quit, **P** sort by CPU, **M** sort by memory, **k** then a PID
to kill, **1** to show each CPU core. The header shows **load average** (roughly,
how many processes are waiting to run) and memory usage.

**`htop`** is a friendlier, colourful version with scrolling, mouse support and easy
killing — install it; most admins prefer it:

```bash
sudo apt install -y htop
htop               # arrow keys to select, F9 to kill, F10/q to quit
```

> [!NOTE]
> **Load average** (the three numbers in `top`/`uptime`) is the average number of
> processes wanting the CPU over 1, 5 and 15 minutes. As a rough guide, compare it
> to your CPU core count (`nproc`): a load of 4.0 on a 4-core box is "fully busy";
> much higher and things are queuing. The 5- and 15-minute figures show the trend.

## Part 4 — Signals and `kill`

You control processes by sending them **signals**. Despite the name, `kill` sends
*any* signal, not just lethal ones:

```bash
kill PID           # send the default TERM (15): "please shut down cleanly"
kill -15 PID       # the same — SIGTERM, graceful
kill -9 PID        # SIGKILL: forcefully terminate, cannot be ignored (last resort)
kill -HUP PID      # SIGHUP (1): often "reload your config" for daemons
```

The two signals to know:

- **SIGTERM (15)** — the **polite** default. Asks the process to clean up and exit.
  Always try this first.
- **SIGKILL (9)** — the **forceful** one. The kernel destroys the process
  immediately; it gets no chance to clean up (possibly leaving temp files or
  corrupt state). Use **only** when TERM fails.

By name instead of PID:

```bash
pkill firefox      # signal processes matching a name
killall nginx      # signal ALL processes with this exact name
pkill -9 -u bob    # force-kill everything owned by user bob (root)
```

> [!IMPORTANT]
> **Reach for `kill` (TERM) first; resort to `kill -9` only if it won't die.**
> SIGKILL gives the program no chance to flush data or release resources, which can
> corrupt files or leave locks behind. A database force-killed mid-write is exactly
> how you get a painful recovery. Polite first, forceful last.

## Part 5 — Background jobs

A long command normally **occupies** your terminal until it finishes. You can move
work to the **background** and keep using the shell.

```bash
long-task                  # runs in the FOREGROUND, blocking your prompt
long-task &                # the & runs it in the BACKGROUND; prompt returns
sleep 300 &                # example: a 5-minute timer in the background
jobs                       # list background/stopped jobs in THIS shell
fg %1                      # bring job 1 back to the FOREGROUND
bg %1                      # resume a stopped job in the BACKGROUND
```

The **Ctrl+Z** / `bg` combo rescues a job you started in the foreground:

```bash
# You started something long without '&'. Press Ctrl+Z to SUSPEND it,
# then send it to the background:
# (Ctrl+Z)
bg                         # it resumes, now in the background; prompt is free
```

Background jobs still **die when you log out**, because they belong to your shell
session. To survive logout, use **`nohup`** (or, better for real services, a
systemd unit — next lesson):

```bash
nohup long-task &          # keep running after logout; output -> nohup.out
nohup ./backup.sh > backup.log 2>&1 &   # detached, with your own log
disown                     # detach the most recent job from the shell entirely
```

> [!TIP]
> For anything that must *truly* keep running (a server, a worker), don't rely on
> `nohup` — run it as a **systemd service** (Lesson 116) so it starts on boot,
> restarts on failure, and is logged. `nohup`/`&` are for ad-hoc, short-lived
> background tasks. For long interactive sessions over SSH, `tmux`/`screen` are the
> professional choice.

## Hands-on lab

```bash
# 1. Identify your shell and the process tree
echo "my shell PID is $$"
ps -p $$
ps aux | head -3                  # the header + first couple of processes

# 2. Find resource hogs
ps aux --sort=-%mem | head -5     # top 5 by memory
ps aux --sort=-%cpu | head -5     # top 5 by CPU

# 3. Live view (quit with q)
top                               # press M (mem), P (cpu), then q

# 4. Background a job, inspect it, foreground it, stop it
sleep 600 &                       # background timer
jobs                              # see it as [1]
fg %1                             # bring it forward...
# ...now press Ctrl+Z to suspend, then:
bg                                # resume in background
kill %1                           # politely stop the job
jobs                              # gone

# 5. Signals on a real (disposable) process
sleep 1000 &
SLEEP_PID=$!                      # $! = PID of the last background job
kill "$SLEEP_PID"                 # TERM it
ps -p "$SLEEP_PID" || echo "it's gone"

# 6. nohup survives logout (creates nohup.out)
nohup sleep 5 >/dev/null 2>&1 &
jobs
```

## Exercises

1. Print the PID of your current shell, then show that process with `ps`.
2. Show the five processes using the most memory on your system.
3. Start `sleep 500 &`, capture its PID, then terminate it with the **polite**
   signal. Verify it's gone.
4. Start a foreground `sleep 999`, suspend it with Ctrl+Z, resume it in the
   background, then kill it by job number.
5. Explain in your own words when you'd use `kill -9` instead of `kill`, and why
   it's a last resort.

## Troubleshooting

- **A process won't die with `kill PID`** — it's ignoring TERM or stuck. *Fix:*
  escalate to `kill -9 PID` (SIGKILL). If even that "fails," it may be in
  uninterruptible `D` state (waiting on I/O) — investigate the disk/mount, not the
  signal.
- **`kill: (PID) - Operation not permitted`** — you don't own that process. *Fix:*
  use `sudo kill PID` (you can only signal your own processes otherwise).
- **My background job died when I logged out** — `&` alone doesn't survive logout.
  *Fix:* `nohup ... &` (or a systemd service / `tmux`).
- **`ps aux | grep x` shows the grep line too** — *Fix:* use `pgrep x` or
  `grep "[x]"`.
- **Server is slow but I can't tell why** — *Fix:* `top`/`htop`, sort by CPU (P)
  and memory (M); check the **load average** against `nproc`.

Reproduce TERM-vs-KILL: `sleep 1000 &`, then `kill %1` (dies politely); start
another and try `kill -9 %1` to feel the difference (immediate, no cleanup).

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Run the practical items.

1. What is a process, and what is a PID?
2. Which process has PID 1, and what's special about it?
3. What does `ps aux` show? Name three useful columns.
4. How do `top` and `ps` differ?
5. What's the difference between SIGTERM (15) and SIGKILL (9)?
6. Why try `kill` before `kill -9`?
7. What does appending `&` to a command do?
8. How do you keep a background job running after you log out?
9. **Practical:** find the top memory-using processes. Command?
10. **Practical:** start `sleep 300 &`, then terminate it politely. Which commands?

## Solutions & validation

1. A **process** is a running instance of a program; a **PID** is its unique
   numeric identifier.
2. **`init`/`systemd`** has **PID 1**; it's the first process started at boot and
   the ancestor of all others.
3. Every process with owner and resource use; three of: USER, PID, %CPU, %MEM,
   STAT, TIME, COMMAND.
4. `ps` is a **one-time snapshot**; `top` **updates live** and sorts by resource use
   in real time.
5. **TERM** politely asks the process to clean up and exit (and can be handled/
   ignored); **KILL** forcibly destroys it immediately with no cleanup and cannot be
   caught.
6. TERM lets the program **shut down cleanly** (flush data, release locks); KILL can
   leave **corruption** behind, so it's a last resort.
7. Runs the command in the **background**, returning your shell prompt immediately.
8. `nohup command &` (or run it as a systemd service / inside `tmux`).
9. **Validation:** `ps aux --sort=-%mem | head` lists the heaviest processes.
10. **Validation:** `sleep 300 &` then `kill %1` (or `kill $!`); `jobs`/`ps` shows
    it gone.

> [!TIP]
> Seeing and steering processes is half of "is this server healthy?" The other half
> — making programs run reliably as managed **services** — is the very next lesson,
> where `&` and `nohup` give way to the real tool: systemd.

## What's next

Next: **Lesson 116 — systemd & Services.** Background jobs are fine for ad-hoc work,
but real software runs as **services** managed by systemd: started on boot,
restarted on failure, and logged centrally. You'll learn `systemctl` to start,
stop, enable and inspect services, and `journalctl` to read their logs — the daily
control panel of a modern Linux server.
