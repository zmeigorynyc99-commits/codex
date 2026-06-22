---
title: "Linux Fundamentals — What Linux Is and How to Reach a Shell"
slug: "linux-fundamentals-what-is-linux-and-the-shell"
track: "linux-fundamentals"
trackName: "Linux Fundamentals"
module: "First Steps"
order: 101
level: "Beginner"
difficulty: "Beginner"
distribution: "General Linux"
category: "Linux Fundamentals"
tags: [linux, beginner, shell, terminal, kernel, getting-started]
cover: "/covers/curriculum/linux-fundamentals.svg"
estMinutes: 50
status: "published"
summary: "The very first step on the road to Linux. Understand what an operating system, the kernel, and the shell actually are, why Linux runs most of the world's servers, and exactly how to get a real terminal in front of you — on a VM, WSL, the cloud, or a live USB."
seoTitle: "Linux Fundamentals 1: What Linux Is & How to Get a Shell"
seoDescription: "Absolute-beginner Linux: what the kernel, distribution and shell are, and four concrete ways to open a real Linux terminal to practise in. Hands-on, with an assessment."
---

Welcome to **Linux Fundamentals**, the first track of the botera curriculum and
the foundation everything else is built on. This very first lesson assumes **zero**
prior knowledge. We won't hand-wave or skip "obvious" things — if you've never
opened a terminal in your life, you are in exactly the right place.

By the end of this lesson you'll understand what Linux actually *is* (in plain
language), why it matters for the career you're building, and — most importantly —
you'll have a **real Linux shell open in front of you**, ready for the rest of the
track. Nothing here is theory for its own sake; everything sets up the hands-on
work to come.

## Learning objectives

By the end of this lesson you will be able to:

- Explain, in your own words, what an **operating system**, the **kernel**, a
  **distribution**, and the **shell** are, and how they relate.
- Describe **why Linux is everywhere** — servers, cloud, containers, phones.
- Choose a practice environment and **open a working Linux terminal**.
- Run your first three commands and read their output with confidence.
- Recognise the **shell prompt** and know when the system is waiting for you.

## Part 1 — What is an operating system?

When you turn on a computer, the hardware itself — the processor, memory, disk,
network card — knows nothing about files, programs, or the internet. Something has
to sit between that raw hardware and the programs you want to run, sharing the
hardware out fairly and safely. That something is the **operating system (OS)**.

The OS is the master program that:

- **Starts when the machine boots** and runs until it shuts down.
- **Manages the hardware** — memory, CPU time, disks, network, devices.
- **Runs your programs** (called *processes*) and stops them stepping on each
  other.
- **Provides a filesystem** so data has names and folders instead of raw disk
  sectors.

Windows and macOS are operating systems you may already know. **Linux** is another
one — and it's the one that runs the overwhelming majority of the servers,
clouds, and containers that power the internet.

## Part 2 — Kernel, distribution, and the "Linux" name

Here's the part that confuses almost every beginner, cleared up once:

- The **kernel** is the actual core of the OS — the program that talks to the
  hardware. Strictly speaking, *"Linux"* is the kernel, created by Linus Torvalds
  in 1991 and still developed by thousands of people today.
- A **distribution** ("distro") is the kernel **plus** everything else you need to
  have a usable system: a shell, basic commands, a package manager, system
  services, and often a desktop. Ubuntu, Debian, Fedora, CentOS/Rocky, and Arch
  are all distributions. They share the same kernel but bundle different software
  and make different choices.

> [!NOTE]
> Think of it like a car. The **kernel** is the engine. A **distribution** is the
> whole car built around that engine — Ubuntu and Fedora are different cars with
> the same kind of engine. Learn to drive one and you can drive them all; only the
> dashboard layout changes. In this curriculum we mostly use **Ubuntu/Debian**
> commands and call out the differences for other distros as we go.

Linux is **open source** and **free**: anyone can read, modify, and share it. That
single fact is why it became the default for servers — no licence fees, total
control, and a colossal community.

## Part 3 — The shell: how you actually talk to Linux

On a phone or a desktop you tap icons. On servers there's usually **no graphical
desktop at all** — and even when there is one, professionals do almost everything
by **typing commands**. The program that reads your typed commands and runs them
is called the **shell**.

You type a line like `ls`, press **Enter**, the shell figures out what you meant,
runs the right program, and shows you the result. Then it waits for your next
command. That back-and-forth happens inside a **terminal** (the window) running a
**shell** (the command interpreter). The most common shell on Linux is **Bash**
("Bourne Again SHell"); another popular one is **Zsh**. They're very similar; we
use Bash.

Why type instead of click? Because typed commands are:

- **Precise** — exactly one meaning, no ambiguity.
- **Fast** — one line can do what dozens of clicks would.
- **Repeatable & automatable** — you can save commands in a file and run them
  again (that's *scripting*, later in this track).
- **Remote-friendly** — you can drive a server on the other side of the planet
  over a tiny text connection.

This is the single most important skill in the whole curriculum, and you'll get
hours of practice. It feels alien for about a week, then it feels like a
superpower.

## Part 4 — Get a real Linux shell (pick one)

You can't learn to swim from the side of the pool. Choose **one** of these and get
a terminal open. Any of them works for the entire Linux track.

**Option A — Windows users: WSL (easiest if you're on Windows).**
Windows Subsystem for Linux runs a real Ubuntu inside Windows.

```powershell
# In PowerShell as Administrator, then restart when asked:
wsl --install
# After reboot it installs Ubuntu and asks you to create a username + password.
# Launch "Ubuntu" from the Start menu to get a shell.
```

**Option B — A virtual machine (great isolated sandbox).**
Install [VirtualBox](https://www.virtualbox.org) (free), download the **Ubuntu
Desktop** ISO, and create a VM. You get a full Linux you can break and rebuild
safely. Open the **Terminal** app inside it.

**Option C — A cloud server (most realistic).**
A small VPS (DigitalOcean, Hetzner, AWS Lightsail — often a few dollars a month)
gives you a real internet-facing Linux server. You connect to it with **SSH**
(covered properly later in the curriculum):

```bash
ssh username@your-server-ip
```

**Option D — macOS users.**
macOS isn't Linux, but its terminal is close enough for the early lessons. Open
**Terminal.app**. For a true Linux environment, use Option B or C. (Many commands
are identical; we'll note where macOS differs.)

> [!TIP]
> If you just want to *look* before installing anything, free in-browser sandboxes
> exist, but they reset and limit you. For real learning, set up Option A, B, or C
> now — having your *own* environment you can break and fix is where the learning
> actually happens.

## Part 5 — Your first three commands

With a terminal open, you'll see a **prompt** — something like:

```text
learner@ubuntu:~$
```

Read it left to right: your **username** (`learner`), an `@`, the **hostname** of
the machine (`ubuntu`), a colon, your **current location** (`~`, which means your
home folder), and a `$` that means "I'm ready — type a command." That `$` is the
shell saying *your turn*.

Type each of these, pressing **Enter** after each:

```bash
whoami      # prints the username you're logged in as
```
```bash
pwd         # "print working directory" — where you currently are
```
```bash
date        # the system's current date and time
```

You just ran three programs and read their output. Two more worth knowing
immediately:

```bash
clear       # clears the screen (or press Ctrl+L)
echo Hello, Linux   # prints whatever you type after it
```

> [!IMPORTANT]
> Linux is **case-sensitive**. `whoami`, `Whoami`, and `WHOAMI` are three
> different things — only the first exists. If a command "isn't found", check your
> capitalisation and spelling first. This trips up every beginner exactly once.

If a command seems to "hang" (nothing happens, no prompt returns), the program may
be waiting or running. Press **Ctrl+C** to cancel and get your prompt back — your
most-used safety key.

## Hands-on lab

Open your terminal and work through this. Type each command yourself (don't copy-
paste everything — your fingers need to learn it):

```bash
# 1. Who and where am I?
whoami
hostname            # the machine's name
pwd                 # your current directory

# 2. What time does the system think it is?
date

# 3. Make the shell talk back to you
echo "I am learning Linux"

# 4. Find out which shell you're using
echo "$SHELL"       # e.g. /bin/bash

# 5. See a little system information
uname -a            # kernel name, version, architecture — proof you're on Linux

# 6. Clear the clutter
clear
```

Now confirm you can read the prompt: look at it and say out loud who you are, what
machine you're on, and what folder you're in. If your prompt shows `~`, you're in
your home directory.

## Exercises

Do these without copying the lab above. Struggle a little first — that's the point.

1. Display the current date and time, then display **just the year** by reading
   `date`'s help (you'll learn `--help` properly next lessons, but try
   `date --help` and look for a format option).
2. Print your username **and** your machine's hostname on two separate lines using
   two `echo`-style commands (hint: `whoami` and `hostname`).
3. Use `echo` to print the sentence: `Bash is my shell` — but make the word `Bash`
   come from a command, not typed literally. (Hint: command substitution with
   `$(...)`, e.g. `echo "$(...) is my shell"` — try `basename "$SHELL"` inside.)
4. Run a command, then press the **Up arrow**. What happens? Press it twice. This
   is your command **history** — you'll lean on it constantly.
5. Type `slooss` (a nonsense command) and read the exact error message. Memorise
   what "command not found" looks like.

## Troubleshooting

A break/fix drill — these are the real situations you'll hit in week one:

- **"command not found"** — You typed a command the system doesn't have or
  misspelled one. *Fix:* check spelling and **case**; confirm the tool is
  installed. Reproduce it deliberately with `dat` instead of `date` so you
  recognise the message instantly.
- **The terminal is "stuck"** — no `$` prompt comes back after a command. *Fix:*
  press **Ctrl+C** to interrupt. If that fails, the program may expect input;
  try **Ctrl+D** (end of input) or **q** (many viewers quit on `q`).
- **A weird `>` prompt appears** and nothing you type runs. *Fix:* you opened a
  quote and never closed it (e.g. `echo "hello` with no closing `"`). The shell is
  waiting for the rest. Press **Ctrl+C** to bail out and retype the command with
  balanced quotes.

Deliberately trigger the third one: run `echo "hello` (no closing quote), observe
the `>` continuation prompt, then recover with **Ctrl+C**.

## Assessment

Answer these to confirm you've absorbed the lesson. **Passing requirement: at
least 7 of the 9 correct (≈78%), AND you must have a working Linux shell open** —
the practical half is non-negotiable for this track.

1. In one sentence, what is the difference between the **kernel** and a
   **distribution**?
2. What does the **shell** do?
3. Name the shell most commonly used on Linux.
4. What command prints your current directory?
5. What command prints the username you're logged in as?
6. Is Linux case-sensitive? What does that mean in practice?
7. Which key combination cancels a running command and returns your prompt?
8. In the prompt `learner@web01:~$`, what do `learner`, `web01`, and `~`
   represent?
9. **Practical:** open a terminal and run `whoami`, `pwd`, and `uname -a`. Did each
   produce output without an error?

## Solutions & validation

1. The **kernel** is the core program that talks to the hardware (this is "Linux"
   proper); a **distribution** is the kernel *plus* the shell, commands, package
   manager and services that make a complete, usable system (Ubuntu, Fedora…).
2. The shell **reads the commands you type, runs the matching programs, and shows
   you the results**, then waits for the next command.
3. **Bash** (Zsh is a common alternative).
4. `pwd` (print working directory).
5. `whoami`.
6. **Yes.** Capitalisation matters: `Date` ≠ `date`, and only the lowercase one
   exists, so the wrong case gives "command not found".
7. **Ctrl+C**.
8. `learner` = your **username**, `web01` = the machine's **hostname**, `~` = your
   **home directory** (current location).
9. **Validation:** `whoami` prints your username; `pwd` prints a path like
   `/home/learner`; `uname -a` prints a line containing `Linux`. If all three
   returned output with no "command not found", you pass the practical — your
   environment is ready for the rest of the track.

> [!TIP]
> Keep this terminal handy — the next lesson, **The Terminal and Your First
> Commands**, builds directly on it, going deep on the everyday commands
> (`ls`, `history`, tab-completion) you'll use thousands of times.

## What's next

Next up: **Lesson 102 — The Terminal and Your First Commands.** We slow right down
and master the moment-to-moment mechanics of the terminal: listing things with
`ls` and its most useful options, tab-completion (the habit that makes you fast),
command history, and reading output without fear. Small skills, enormous payoff.
