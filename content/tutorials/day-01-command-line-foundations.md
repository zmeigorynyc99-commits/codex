==================================================================
HOW TO ADD THIS TUTORIAL (admin area)
------------------------------------------------------------------
1. Sign in at  https://botera.md/admin/login
2. Click  "New tutorial"
3. Copy each field below into the matching box.
4. Paste everything under "CONTENT (MARKDOWN)" into the big
   "Content (Markdown)" editor. Use "Show preview" to check it.
5. Set Status = Published (or save as Draft first), then Save.
==================================================================

TITLE:
Linux to DevOps Roadmap — Day 1: Your First Hour on the Command Line

URL SLUG:
linux-to-devops-day-1-command-line-foundations

SUMMARY:
Day 1 of the Linux-to-DevOps roadmap. Set up a real practice environment, then
master the terminal, the Linux filesystem and the essential commands — with
hands-on exercises you actually run. About one hour, beginner-friendly.

CATEGORY:
Getting Started

TAGS:
linux, devops, roadmap, command-line, bash, beginner, terminal

DIFFICULTY:
Beginner

DISTRIBUTION:
General Linux

AUTHOR:
botera

COVER IMAGE (paste this URL into the "Cover image" box):
https://botera.md/covers/linux-devops-day-1.svg

SEO TITLE:
Linux to DevOps — Day 1: Command Line Foundations (Beginner)

SEO DESCRIPTION:
Start your Linux-to-DevOps journey. Day 1: set up Linux, learn the terminal,
the filesystem and the core commands with practical exercises. ~1 hour.

------------------------------------------------------------------
CONTENT (MARKDOWN) — paste everything below this line
------------------------------------------------------------------

Welcome to **Day 1** of the **Linux to DevOps Roadmap** — a hands-on series that
takes you from "I've never used a terminal" to "I can build, automate and run
production systems like a DevOps engineer."

I've spent years as a Linux administrator and DevOps engineer, and I'm going to
teach you the same way I'd onboard a junior on my team: a little theory, then
your hands on the keyboard. Every lesson is about **one hour** — short enough to
do daily, long enough to make real progress. Read, then *type every command
yourself*. You don't learn Linux by watching; you learn it by doing.

> [!NOTE]
> Reading time is roughly one hour including the exercises. Don't rush. If you
> only get halfway today, that's fine — finish tomorrow, then continue.

## The roadmap: where this series is going

DevOps is the practice of building, shipping and running software reliably and
automatically. **Linux is the foundation of all of it** — servers, containers,
CI/CD runners and the cloud almost all run Linux. So we start there and build up.

Here's the journey. Each phase is several daily lessons:

| Phase | What you'll learn | Outcome |
|-------|-------------------|---------|
| 1. Linux foundations | Terminal, files, permissions, processes, text tools | Comfortable on any Linux box |
| 2. System administration | Users, packages, services (systemd), storage, logs | Run and troubleshoot a server |
| 3. Networking & security | IP, DNS, SSH, firewalls, TLS, hardening | Secure a public server |
| 4. Shell scripting & automation | Bash scripts, cron, idempotency | Automate repetitive work |
| 5. Web & data services | Nginx, databases, backups | Host real applications |
| 6. Version control | Git and collaboration workflows | Work like a team |
| 7. Containers | Docker images, volumes, networks, Compose | Package and run anything |
| 8. CI/CD | Pipelines, testing, automated deploys | Ship safely and often |
| 9. Infrastructure as Code | Provisioning and config management | Reproducible infrastructure |
| 10. Observability & cloud | Monitoring, logging, metrics, a cloud provider | Operate production systems |

Today is the very first step of Phase 1. By the end of this hour you'll have a
working Linux environment and real command-line muscle memory.

## What you'll be able to do after today

- Open a terminal and understand what the shell actually is.
- Read the prompt and know "where" you are in the system.
- Navigate the Linux filesystem confidently.
- Create, copy, move, view and delete files and folders.
- Get help for any command without searching the web.
- Avoid the classic beginner mistakes that delete the wrong thing.

Let's go.

## Step 1 — Get a Linux environment to practice on

You need a *real* Linux to type into. Pick **one** of these — any of them works
for the whole series. If you're not sure, choose the one that matches your
situation.

### Option A — A cloud server (closest to real DevOps)
Rent a small VPS (1 GB RAM is plenty) running **Ubuntu 22.04 or 24.04 LTS**.
You'll connect to it with SSH — exactly how engineers work with servers. We'll
cover SSH properly later; for now your provider gives you a web console too.

### Option B — A virtual machine on your computer (free, safe sandbox)
Install [VirtualBox](https://www.virtualbox.org/) and the **Ubuntu Desktop** or
**Ubuntu Server** ISO. A VM is isolated, so you can break things and just
rebuild. Give it 2 CPUs and 2–4 GB RAM.

### Option C — Windows users: WSL2 (fastest to start)
On Windows 10/11, open PowerShell **as Administrator** and run:

```powershell
wsl --install -d Ubuntu
```

Reboot if asked, then launch "Ubuntu" from the Start menu. You now have a real
Linux shell inside Windows.

### Option D — macOS users
macOS is Unix-like, so the Terminal app already understands most of today's
commands. To get a Linux that matches the series exactly, install
[Multipass](https://multipass.run/) and run `multipass launch --name lab` then
`multipass shell lab`.

> [!TIP]
> Whichever you pick, the commands in this series target **Ubuntu/Debian**. If
> you use a different distribution (Fedora, Arch, CentOS) the ideas are identical
> — only the package manager command differs, which we'll flag when it matters.

When you can see a prompt that ends in `$` and type into it, you're ready.

## Step 2 — Meet the shell and read your prompt

The black window is a **terminal**. The program inside it that reads your
commands is the **shell** — on Ubuntu that's **Bash**. You type a command, press
Enter, the shell runs it and prints the result.

Type your first command and press Enter:

```bash
whoami
```

It prints your username. Now look at the prompt itself. A typical Ubuntu prompt
looks like this:

```text
alex@web-01:~$
```

Read it left to right:

- `alex` — the **user** you are logged in as.
- `web-01` — the **hostname** (the machine's name).
- `~` — your **current location**; `~` is shorthand for your home directory.
- `$` — you are a normal user. A `#` here would mean you are **root** (the all-
  powerful administrator). Seeing `#` should always make you slow down.

Three commands tell you who and where you are:

```bash
whoami
hostname
pwd
```

`pwd` means *print working directory* — it shows the full path of where you
currently are, e.g. `/home/alex`.

## Step 3 — Understand the filesystem (the map)

Linux organises everything as one big tree that starts at `/`, called the
**root** of the filesystem. There are no "C:" or "D:" drives — everything hangs
off `/`. These are the directories you'll meet constantly:

| Path | What lives there |
|------|------------------|
| `/` | The root of everything |
| `/home` | Normal users' personal folders (`/home/alex`) |
| `/root` | The root user's home |
| `/etc` | System **configuration** files (text files you'll edit a lot) |
| `/var` | Variable data — **logs** (`/var/log`), spools, caches |
| `/tmp` | Temporary files, wiped on reboot |
| `/usr` | Installed programs and their files |
| `/bin`, `/sbin` | Essential commands |
| `/opt` | Optional / third-party software |
| `/dev` | Devices (disks, terminals) represented as files |
| `/proc`, `/sys` | Live kernel and process information |

You don't need to memorise this — you'll learn it by visiting these folders over
the next weeks. For today, just know that **configuration is in `/etc`** and
**logs are in `/var/log`**. That single fact already makes you more useful.

## Step 4 — Navigate: pwd, ls, cd

Three commands do all your moving around: `pwd` (where am I), `ls` (what's here)
and `cd` (go somewhere).

```bash
pwd
ls
```

`ls` lists the current directory. It becomes far more useful with **options**
(also called flags), which start with `-`:

```bash
ls -l      # long format: permissions, owner, size, date
ls -a      # all, including hidden files (names starting with a dot)
ls -lh     # long format with human-readable sizes (KB/MB)
ls -la /etc
```

Now move around with `cd` (*change directory*):

```bash
cd /etc        # go to an absolute path (starts with /)
pwd
ls
cd /var/log
ls
cd ~           # go home (~ is your home directory)
cd             # cd with no argument also goes home
```

### Absolute vs relative paths — the concept beginners trip on

- An **absolute path** starts at root: `/var/log/syslog`. It works from anywhere.
- A **relative path** starts from where you are now: `log/syslog` (only works if
  you're in `/var`).

Two special shortcuts you'll use forever:

- `.` means "the current directory".
- `..` means "the directory above (the parent)".

Try it:

```bash
cd /var/log
cd ..          # now in /var
pwd
cd ../etc      # up to /, then into etc  ->  /etc
pwd
```

> [!TIP]
> Press the **Tab** key to auto-complete file and directory names. Type `cd /et`
> then Tab and the shell finishes `/etc/` for you. Tab completion prevents typos
> and is the single biggest speed boost for beginners. Use it constantly.

## Step 5 — Create and organise: mkdir, touch, cp, mv

Let's make things. Go home and create a workspace:

```bash
cd ~
mkdir devops-lab
cd devops-lab
mkdir day1
cd day1
```

`mkdir` makes a directory. Add `-p` to create nested folders in one go:

```bash
mkdir -p project/src project/docs
```

Create empty files with `touch`:

```bash
touch notes.txt server.conf
ls -l
```

Copy with `cp` and move/rename with `mv`:

```bash
cp notes.txt notes-backup.txt        # copy a file
cp -r project project-copy           # -r copies a folder and its contents
mv server.conf nginx.conf            # rename (move within the same folder)
mv nginx.conf project/               # move a file into the project folder
ls -R                                # list everything recursively
```

Notice the pattern: `cp SOURCE DESTINATION` and `mv SOURCE DESTINATION`. The same
verb renames *and* moves — moving to the same folder with a new name is a rename.

## Step 6 — Look inside files: cat, less, head, tail, wc

You'll read text files constantly (configs and logs are just text). First put
some text into a file:

```bash
echo "line one" > notes.txt          # > writes (overwrites) the file
echo "line two" >> notes.txt         # >> appends a new line
cat notes.txt                        # print the whole file
```

For small files use `cat`. For big ones, use `less` (a scrollable pager):

```bash
less /etc/services
```

Inside `less`: arrow keys or PageUp/PageDown to scroll, `/word` to search, and
**`q` to quit**. Remember `q` — that's how you get out.

Peek at the start or end of a file, and count its size:

```bash
head -n 5 /etc/services    # first 5 lines
tail -n 5 /etc/services    # last 5 lines
wc -l /etc/services        # count the number of lines
```

`tail` is a DevOps favourite. `tail -f /var/log/syslog` *follows* a log live as
new lines appear — you'll use it to watch what a server is doing in real time
(press Ctrl+C to stop).

## Step 7 — Get help without leaving the terminal

You will never memorise every option, and you don't need to. Every real Linux
system can teach you:

```bash
man ls          # the full manual for ls (press q to quit)
ls --help       # a shorter summary, scrolls past quickly
```

`man` (manual) pages are the authoritative reference. To find a command when you
only know the topic:

```bash
apropos "copy files"
```

Optionally install `tldr`, which shows short, example-first help — much friendlier
than `man` when you just want the common usage:

```bash
sudo apt update
sudo apt install -y tldr
tldr tar
```

> [!NOTE]
> `sudo` runs a command as the administrator (root). Ubuntu asks for your
> password the first time. We'll cover users, `sudo` and permissions properly in
> an upcoming lesson — for now, just know `sudo` means "do this as admin".

## Step 8 — Delete safely (read this twice)

`rm` removes files. `rmdir` removes an *empty* directory. To remove a folder and
everything in it, people use `rm -r`. This is where beginners get burned.

```bash
cd ~/devops-lab/day1
rm notes-backup.txt        # remove a single file
rm -r project-copy         # remove a folder and its contents
```

> [!DANGER]
> The command below is the single most destructive mistake in Linux. **Never run
> it.** It tries to erase the entire system, starting from root, with no undo.
>
> ```bash
> rm -rf /
> ```
>
> There is no recycle bin on the command line. When `rm` deletes something, it is
> gone. Three habits will protect you for the rest of your career:
> 1. **Look before you leap** — run `ls` on a path before you `rm -r` it.
> 2. **Never combine `-rf` with a path you didn't double-check**, especially one
>    with a variable or a leading `/`.
> 3. Prefer moving unwanted files to a temp folder first; delete later when sure.

## Step 9 — Quality-of-life shortcuts

These small things make you fast and are used by every professional:

- **Tab** — auto-complete commands, files and paths (use it always).
- **Up / Down arrows** — scroll through your previous commands.
- **Ctrl + C** — cancel the command that's currently running.
- **Ctrl + L** (or `clear`) — clear the screen.
- **`history`** — show the commands you've run; `!42` re-runs command number 42.
- **Ctrl + R** — search your history (type a few letters of a past command).

```bash
history | tail -n 20
clear
```

## Hands-on lab: build a mini server layout

Let's put it all together. You'll recreate a simplified version of how a real
server is organised. Type each step; don't copy-paste blindly — the goal is for
your fingers to learn it.

```bash
# 1. Start fresh in a project folder
cd ~/devops-lab
mkdir -p lab/{etc,var/log,www,backups}
cd lab

# 2. Look at what you built
ls -R

# 3. Create a pretend config file and write to it
echo "server_name botera.md;" > etc/site.conf
echo "listen 80;"            >> etc/site.conf
cat etc/site.conf

# 4. Create a pretend log and add some lines
echo "$(date) - server started" > var/log/app.log
echo "$(date) - request from a visitor" >> var/log/app.log

# 5. Inspect the log like an admin would
tail -n 5 var/log/app.log
wc -l var/log/app.log

# 6. Back up the config, then prove the backup exists
cp etc/site.conf backups/site.conf.bak
ls -lh backups

# 7. Rename the active config and confirm
mv etc/site.conf etc/site.conf.active
ls etc
```

If `ls -R` shows your `etc`, `var/log`, `www` and `backups` folders with the
files you created, **you've successfully used every skill from today.** That
directory tree mirrors how real services keep config in `/etc` and logs in
`/var/log`.

## Common beginner mistakes (and the fixes)

- **"command not found"** — a typo, or the tool isn't installed. Check spelling;
  install with `sudo apt install <name>`.
- **"Permission denied"** — you're trying to touch something you don't own. Some
  actions need `sudo`. We'll demystify permissions soon.
- **Stuck in a full-screen program** (like `man` or `less`) — press **`q`**.
- **Stuck with a frozen command** — press **Ctrl + C**.
- **Spaces in names** break commands; wrap names in quotes: `mkdir "my folder"`.
- **Pasting blindly** from the internet — read what a command does *before* you
  run it, especially anything with `sudo` or `rm`.

## Recap — what you learned today

- A terminal runs a **shell** (Bash); you type commands, it runs them.
- The prompt tells you the user, host and where you are; `#` means root.
- Linux is one tree from `/`; **config lives in `/etc`, logs in `/var/log`**.
- Navigate with `pwd`, `ls`, `cd`; understand absolute vs relative paths and
  `.` / `..`.
- Manage files with `mkdir`, `touch`, `cp`, `mv`, and **carefully** `rm`.
- Read files with `cat`, `less`, `head`, `tail`, `wc`.
- Get help with `man`, `--help`, `apropos` and `tldr`.
- Tab completion, arrow keys, Ctrl+C and Ctrl+L make you fast.

## Homework (15 minutes)

1. Create `~/devops-lab/homework` and, inside it, this structure using a single
   `mkdir -p`: `app/config`, `app/logs`, `app/data`.
2. Put the line `version=1` into `app/config/app.conf`.
3. Append three "log" lines to `app/logs/app.log` using `>>` and `date`.
4. Copy the whole `app` folder to `app-backup`.
5. Use `man` to discover what `ls -t` does, then run it in `app/logs`.
6. Bonus: run `history` and screenshot the commands you used today.

If you can do the homework without looking back at the lesson, you're ready for
Day 2.

## Common questions

**Do I need to be good at programming to learn DevOps?**
No. You need to be comfortable on the command line (that's what we're building)
and willing to learn scripting later. We start from zero.

**Mac, Windows or Linux on my own laptop — does it matter?**
Use whatever you have; set up one of the environments in Step 1. The series
targets Ubuntu/Debian, which is what most servers run.

**Why type commands instead of using a graphical file manager?**
Because servers usually have **no graphical interface**, and because the command
line is scriptable — which is the whole point of automation and DevOps.

**How long until I can call myself "DevOps"?**
If you do roughly one lesson a day and the exercises, you'll have strong,
employable fundamentals across the whole roadmap in a few months. Consistency
beats intensity.

## What's next — Day 2

In **Day 2** we go deeper into working with text and files like a pro: viewing
and editing files with **nano** and **vim**, searching inside files with
**grep**, and connecting commands together with **pipes** (`|`) and redirection
— the techniques that turn a handful of commands into real power. Bring your
`devops-lab` folder; we'll keep building on it.

See you tomorrow. Now go type everything again from memory — that's where the
learning sticks.
