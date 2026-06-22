==================================================================
HOW TO ADD THIS TUTORIAL (admin area)
------------------------------------------------------------------
1. Sign in at  https://botera.md/admin/login
2. Click  "New tutorial"
3. Copy each field below into the matching box.
4. Paste everything under "CONTENT (MARKDOWN)" into the big
   "Content (Markdown)" editor. Use "Show preview" to check it.
5. Set Status = Published (or Draft first), then Save.
   Tip: set the Publication date one day after Day 7.
==================================================================

TITLE:
Linux to DevOps Roadmap — Day 8: Bash Scripting — Automate Your Work

URL SLUG:
linux-to-devops-day-8-bash-scripting

SUMMARY:
Day 8 of the Linux-to-DevOps roadmap. Turn the commands you type by hand into
reusable scripts: variables, quoting, if-tests, loops, functions, arguments and
exit codes — plus the "safe Bash" header every professional uses. Build a real
backup script from scratch. About one hour, hands-on, with other-distro and
Windows notes.

CATEGORY:
Getting Started

TAGS:
linux, devops, roadmap, bash, scripting, automation, shell, functions, cron, beginner

DIFFICULTY:
Beginner

DISTRIBUTION:
Ubuntu

AUTHOR:
botera

COVER IMAGE (paste this URL into the "Cover image" box):
https://botera.md/covers/linux-devops-day-8.svg

SEO TITLE:
Linux to DevOps — Day 8: Bash Scripting for Beginners (Automate Your Work)

SEO DESCRIPTION:
Day 8 of the Linux-to-DevOps roadmap: write your first Bash scripts — variables,
if-tests, loops, functions, arguments, exit codes, and a real backup script. ~1 hour.

------------------------------------------------------------------
CONTENT (MARKDOWN) — paste everything below this line
------------------------------------------------------------------

Welcome to **Day 8** of the **Linux to DevOps Roadmap** — and a genuine turning
point. For seven days you've *run* commands. Today you learn to *automate* them.
**Bash scripting** is how you bottle a sequence of commands into a file you can run
again and again, hand to a teammate, or schedule to run at 3 a.m. while you sleep.
This is the literal heart of DevOps: if you do something twice, you script it.

By the end of the hour you'll have written a real, parameterised backup script
with error handling — the same shape as scripts running on production servers
everywhere.

> [!NOTE]
> About an hour with the lab. Everything works on your practice machine — no root
> needed for most of it. Keep your `~/devops-lab` directory handy and save your
> scripts there. You'll reuse them on Day 9 when we schedule them.

## Today's mission

- Write and run your first **script** with a shebang and execute permission.
- Use **variables**, **command substitution**, and safe **quoting**.
- Make decisions with **`if`** and **test** (`[[ ... ]]`).
- Repeat work with **`for`** and **`while`** loops.
- Read **arguments** (`$1`, `$@`) and return **exit codes**.
- Organise code into **functions**.
- Adopt the **"safe Bash" header** that prevents silent disasters.

## Part 1 — Your first script

A script is just a text file of commands. Create one:

```bash
nano hello.sh
```

```bash
#!/usr/bin/env bash
echo "Hello from my first script!"
echo "Today is $(date)"
echo "I am $(whoami) on $(hostname)"
```

Two things make it runnable:

1. The first line, `#!/usr/bin/env bash` — the **shebang** — tells Linux which
   interpreter to use.
2. **Execute permission** (your Day 3 skills):

```bash
chmod +x hello.sh
./hello.sh            # run it — the ./ means "in this directory"
```

That `$(date)` is **command substitution**: Bash runs the command inside `$( )`
and drops its output right into the line. It's one of the most useful things in
all of scripting.

## Part 2 — Variables and quoting

Store values in **variables** — no spaces around the `=`:

```bash
#!/usr/bin/env bash
name="botera"
count=5
today="$(date +%F)"          # %F = YYYY-MM-DD

echo "Project: $name"
echo "Backups to keep: $count"
echo "Date stamp: $today"
echo "Archive name: ${name}_${today}.tar.gz"    # braces separate the var from text
```

> [!IMPORTANT]
> **Always quote your variables**: `"$name"`, not `$name`. Without quotes, a value
> containing spaces (like a filename `My File.txt`) breaks into multiple
> arguments and your script misbehaves — or worse, does something destructive.
> Quoting `"$variable"` is the single most important habit in safe Bash. Make it
> automatic.

## Part 3 — Making decisions with if

Scripts get useful when they react to conditions. The modern test syntax is
`[[ ... ]]`:

```bash
#!/usr/bin/env bash
file="/etc/nginx/nginx.conf"

if [[ -f "$file" ]]; then
    echo "$file exists — good."
else
    echo "$file is missing!"
fi
```

Common tests you'll use constantly:

| Test | True when… |
|------|-----------|
| `[[ -f "$p" ]]` | `$p` is a file |
| `[[ -d "$p" ]]` | `$p` is a directory |
| `[[ -z "$s" ]]` | string `$s` is empty |
| `[[ -n "$s" ]]` | string `$s` is non-empty |
| `[[ "$a" == "$b" ]]` | strings are equal |
| `[[ "$n" -gt 10 ]]` | number `$n` is greater than 10 |

You can also branch on whether a command **succeeded**, using its exit code
directly:

```bash
if systemctl is-active --quiet nginx; then
    echo "nginx is running"
else
    echo "nginx is DOWN — restarting"
    sudo systemctl restart nginx
fi
```

## Part 4 — Loops

**`for`** loops repeat over a list — perfect for processing files:

```bash
#!/usr/bin/env bash
for file in *.log; do
    echo "Compressing $file ..."
    gzip "$file"
done

for i in 1 2 3; do
    echo "Attempt $i"
done

for user in alex sam jordan; do
    echo "Creating home for $user"
done
```

**`while`** loops run as long as a condition holds — great for reading a file line
by line:

```bash
#!/usr/bin/env bash
while read -r line; do
    echo "Got: $line"
done < servers.txt          # feed the file into the loop
```

> [!TIP]
> `read -r` (with `-r`) stops backslashes being mangled — always use it. And to
> loop over command output safely, prefer `while read` over `for` when lines may
> contain spaces. For simple lists, `for` is perfectly fine and very readable.

## Part 5 — Arguments and exit codes

Real scripts take **arguments** so they're reusable. Inside a script:

- `$1`, `$2`, … are the first, second, … arguments.
- `$@` is all of them; `$#` is how many there are.
- `$0` is the script's own name.

```bash
#!/usr/bin/env bash
# greet.sh — usage: ./greet.sh NAME
if [[ $# -lt 1 ]]; then
    echo "Usage: $0 NAME" >&2     # >&2 sends this to "standard error"
    exit 1                        # non-zero exit = failure
fi

name="$1"
echo "Hello, $name!"
exit 0                            # zero exit = success
```

```bash
./greet.sh Alex        # Hello, Alex!
./greet.sh             # prints usage, exits with code 1
echo $?                # $? shows the exit code of the last command
```

**Exit codes** are how scripts (and tools like cron, CI and `&&`) know whether
something worked: **`0` means success, anything else means failure**. Always
`exit 1` (or another non-zero) when your script can't do its job — Day 9's
scheduler and every CI system depend on it.

## Part 6 — Functions

When a script grows, group related steps into **functions**:

```bash
#!/usr/bin/env bash

log() {                          # a reusable timestamped logger
    echo "[$(date +%T)] $*"
}

backup_dir() {                   # $1 = source, $2 = destination
    local src="$1" dest="$2"     # 'local' keeps these inside the function
    log "Backing up $src -> $dest"
    tar -czf "$dest" "$src"
}

log "Starting"
backup_dir /etc /tmp/etc-backup.tar.gz
log "Done"
```

`local` keeps a function's variables from leaking into the rest of the script —
use it for every variable inside a function. `$*` (and `$@`) inside a function
refer to *that function's* arguments, just like in the main script.

## Part 7 — The "safe Bash" header

Bash, by default, keeps going after errors and treats typos in variable names as
empty strings — a recipe for silent disasters (the infamous `rm -rf "$DIR/"` where
`$DIR` was never set). Professionals start serious scripts with this header:

```bash
#!/usr/bin/env bash
set -euo pipefail
# -e  : exit immediately if any command fails
# -u  : treat the use of an unset variable as an error
# -o pipefail : a pipeline fails if ANY part of it fails (not just the last)
```

> [!IMPORTANT]
> `set -euo pipefail` turns silent, dangerous failures into loud, safe ones. It's
> the difference between a script that stops the moment something's wrong and one
> that blindly charges ahead and corrupts your data. Put it at the top of every
> script you'd run unattended. (For quick throwaway one-liners it's optional — but
> the habit is worth forming.)

Pair it with **ShellCheck**, a linter that catches Bash mistakes before they bite:

```bash
sudo apt install -y shellcheck
shellcheck backup.sh           # reports quoting bugs, typos, and bad patterns
```

## Hands-on lab: build a real backup script

Let's combine everything into a parameterised, safe backup script — the kind you'd
actually deploy (and schedule on Day 9).

```bash
nano backup.sh
```

```bash
#!/usr/bin/env bash
set -euo pipefail

# backup.sh — archive a directory with a timestamped name.
# Usage: ./backup.sh SOURCE_DIR DEST_DIR

log() { echo "[$(date +'%F %T')] $*"; }

# --- validate arguments ---
if [[ $# -ne 2 ]]; then
    echo "Usage: $0 SOURCE_DIR DEST_DIR" >&2
    exit 1
fi

src="$1"
dest_dir="$2"

if [[ ! -d "$src" ]]; then
    log "ERROR: source '$src' is not a directory"
    exit 1
fi

mkdir -p "$dest_dir"

# --- build a timestamped archive name ---
stamp="$(date +%Y%m%d-%H%M%S)"
base="$(basename "$src")"
archive="${dest_dir}/${base}-${stamp}.tar.gz"

# --- do the backup ---
log "Backing up '$src' -> '$archive'"
tar -czf "$archive" -C "$(dirname "$src")" "$base"
log "Created $(du -h "$archive" | cut -f1) archive: $archive"

# --- keep only the 5 most recent backups of this source ---
log "Pruning old backups (keeping 5 newest)"
ls -1t "${dest_dir}/${base}"-*.tar.gz 2>/dev/null | tail -n +6 | while read -r old; do
    log "Removing old backup: $old"
    rm -f "$old"
done

log "Backup complete."
```

Run it:

```bash
chmod +x backup.sh
shellcheck backup.sh                 # should report no issues
./backup.sh /etc ~/backups           # back up /etc into ~/backups
./backup.sh /etc ~/backups           # run again — note the new timestamp
ls -lh ~/backups                     # see your archives
./backup.sh /does/not/exist ~/backups   # see the error handling + exit 1
echo $?                              # confirms it exited non-zero on failure
```

If you can run it repeatedly, it timestamps each archive, keeps only the five
newest, and **fails cleanly** on bad input — you've written a production-quality
script. On **Day 9** you'll schedule exactly this to run automatically.

## For Windows people

Windows automation uses **PowerShell**, which is more object-oriented than Bash but
shares every concept:

```powershell
# variables, if, loops, functions, arguments
$name = "botera"
if (Test-Path "C:\inetpub") { "exists" } else { "missing" }
foreach ($f in Get-ChildItem *.log) { Compress-Archive $f "$($f).zip" }

function Backup-Dir($Src, $Dest) {
    Compress-Archive -Path $Src -DestinationPath $Dest -Force
}
# Scripts are .ps1 files; exit codes via 'exit 1'; $args holds arguments.
```

> [!NOTE]
> Concept map: a Bash **`.sh`** ≈ a PowerShell **`.ps1`**; **`$1`/`$@`** ≈
> **`$args`**; **`if [[ ]]`** ≈ **`if ()`**; **`for ... do`** ≈ **`foreach`**;
> **functions** and **exit codes** are the same idea on both. Cross-platform tip:
> Bash also runs on Windows via **WSL** and **Git Bash**, so your `.sh` scripts
> work there too. In DevOps you'll write Bash for Linux servers far more often.

## Common mistakes to avoid

- **Spaces around `=`** — `name = "x"` is wrong; it must be `name="x"`.
- **Unquoted variables** — always `"$var"`; unquoted values break on spaces.
- **Forgetting `chmod +x`** — or run it with `bash script.sh` instead of `./`.
- **No shebang** — without `#!/usr/bin/env bash` the wrong shell may run it.
- **Ignoring exit codes** — return non-zero on failure or schedulers/CI think it
  succeeded.
- **Skipping `set -euo pipefail`** on unattended scripts — silent failures corrupt
  data.
- **Not testing with ShellCheck** — it catches most beginner bugs for free.

## Recap — what you learned today

- A script is commands in a file with a **shebang** and **`chmod +x`**.
- **Variables** (quoted!), **command substitution** `$( )`, and string building.
- **`if`/`[[ ]]`** for decisions; **`for`/`while`** for loops.
- **Arguments** (`$1`, `$@`, `$#`) and **exit codes** (`0` = success).
- **Functions** with `local` variables to organise code.
- **`set -euo pipefail`** + **ShellCheck** make scripts safe and reliable.

## Homework (20–25 minutes)

1. Write `sysinfo.sh` that prints hostname, uptime, disk usage of `/`, and free
   memory, each with a label.
2. Add `set -euo pipefail` and a `log()` function to it.
3. Write `check-service.sh SERVICE` that reports whether a systemd service is
   active and restarts it if not (using an `if` on `systemctl is-active`).
4. Extend the lab `backup.sh` to also print the total size of all backups at the
   end.
5. Run `shellcheck` on every script you wrote and fix what it flags.
6. Make one script take an argument and validate it, printing a usage message and
   `exit 1` when it's missing.

## Common questions

**Bash or Python for scripting?**
Use **Bash** for gluing together commands and system tasks (the bulk of server
automation). Reach for **Python** when logic gets complex, you need data
structures, or you're parsing structured data. Most DevOps engineers use both;
start with Bash because it's everywhere by default.

**`sh` or `bash`?**
Write `#!/usr/bin/env bash` and use Bash features freely. Plain `sh` (`dash` on
Ubuntu) is more limited and lacks `[[ ]]`, arrays, and more. Only target `sh` when
you specifically need maximum portability.

**Why `#!/usr/bin/env bash` and not `#!/bin/bash`?**
`env` finds Bash wherever it's installed on the system (it isn't always
`/bin/bash`, e.g. on some BSD/macOS setups). It's the more portable habit.

**How do I debug a script?**
Run it with `bash -x script.sh` to trace every line as it executes, or add `set
-x` inside the script around the tricky part. Combined with ShellCheck, you'll
find most bugs fast.

## What's next — Day 9

You can write scripts — now let's make them run **on a schedule, without you**. On
**Day 9** we cover **scheduling, backups and log management**: **cron** and modern
**systemd timers** to run jobs automatically, real **backup strategies** with
`tar` and `rsync` (we'll schedule today's `backup.sh`), and **`logrotate`** to stop
logs from eating your disk. It's where scripting becomes hands-off automation.

Brilliant work — automation is the skill that defines a DevOps engineer. Rebuild
`backup.sh` from a blank file before moving on; typing it cements every concept.
