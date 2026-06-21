==================================================================
HOW TO ADD THIS TUTORIAL (admin area)
------------------------------------------------------------------
1. Sign in at  https://botera.md/admin/login
2. Click  "New tutorial"
3. Copy each field below into the matching box.
4. Paste everything under "CONTENT (MARKDOWN)" into the big
   "Content (Markdown)" editor. Use "Show preview" to check it.
5. Set Status = Published (or save as Draft first), then Save.
   Tip: set the Publication date one day after Day 1 so the series
   reads in order on the tutorials page.
==================================================================

TITLE:
Linux to DevOps Roadmap — Day 2: Editing, Searching & Piping Text Like a Pro

URL SLUG:
linux-to-devops-day-2-text-editing-grep-pipes

SUMMARY:
Day 2 of the Linux-to-DevOps roadmap. Edit files with nano and vim, search
anything with grep, and combine commands using pipes and redirection — the core
skills that turn a handful of commands into real power. About one hour, with
hands-on log analysis and Windows/PowerShell parallels.

CATEGORY:
Getting Started

TAGS:
linux, devops, roadmap, nano, vim, grep, pipes, redirection, bash, powershell, beginner

DIFFICULTY:
Beginner

DISTRIBUTION:
General Linux

AUTHOR:
botera

SEO TITLE:
Linux to DevOps — Day 2: nano, vim, grep & Pipes (Beginner)

SEO DESCRIPTION:
Day 2 of the Linux-to-DevOps roadmap: edit files with nano and vim, search with
grep, and chain commands with pipes and redirection. Hands-on, ~1 hour.

------------------------------------------------------------------
CONTENT (MARKDOWN) — paste everything below this line
------------------------------------------------------------------

Welcome back to the **Linux to DevOps Roadmap**. In **Day 1** you set up a Linux
lab and learned to move around the filesystem and manage files. Today we level
up to the skill that separates someone who *uses* Linux from someone who
*commands* it: **working with text**.

Here's a secret that took me years to fully appreciate as a sysadmin and DevOps
engineer: **almost everything in Linux is a text file.** Your web server's
configuration, your firewall rules, your application logs, your automation
scripts — all plain text. Master reading, editing and searching text from the
terminal and you can operate any Linux system on earth, even one with no mouse
and no graphical interface, over a tiny SSH connection.

> [!NOTE]
> Like Day 1, this is about an hour including the exercises. Keep your
> `~/devops-lab` folder from yesterday — we'll build on it. And remember: *type
> the commands yourself.* Muscle memory is the goal.

## Today's mission

By the end of this hour you will be able to:

- Edit any file from the terminal with **nano** (easy) and **vim** (everywhere).
- Understand **standard streams** and **redirect** output to files.
- Chain commands together with **pipes** (`|`).
- Search inside files and across whole directories with **grep**.
- Build real one-line pipelines that analyse a log file and answer questions.

These four ideas — editors, redirection, pipes and grep — are the backbone of
everyday DevOps work.

## Part 1 — Editing files in the terminal

Servers rarely have a graphical editor. You change configuration by opening a
text file *in the terminal*, editing it, and saving. There are two editors you
must know: **nano** (friendly) and **vim** (universal).

### nano — the friendly editor

`nano` is the easiest place to start. Open (or create) a file:

```bash
cd ~/devops-lab
nano hello.conf
```

You're now inside nano. Type some text:

```text
# My first config file
app_name = botera
environment = learning
```

The shortcuts you need are listed at the bottom of the screen, where `^` means
the **Ctrl** key:

- **Ctrl + O** then **Enter** — save (the manual calls it "Write Out").
- **Ctrl + X** — exit.
- **Ctrl + W** — search for text (then type and press Enter).
- **Ctrl + K** — cut the current line; **Ctrl + U** — paste it.

Save with **Ctrl + O**, Enter, then exit with **Ctrl + X**. Confirm your file:

```bash
cat hello.conf
```

That's nano. For 90% of quick edits on a server, nano is all you need.

### vim — the editor that's on every server

`vim` (or its older sibling `vi`) is installed on virtually every Unix system,
including minimal containers and rescue environments where nano isn't present.
It's intimidating at first because it's **modal** — it has different modes for
typing versus running commands — but a handful of keystrokes will carry you.

Open a file:

```bash
vim notes.txt
```

You start in **Normal mode**, where keys are commands, not text. The survival
kit:

| Goal | Keys |
|------|------|
| Switch to typing (Insert mode) | press `i` |
| Stop typing (back to Normal mode) | press `Esc` |
| Save | `Esc` then type `:w` and Enter |
| Save and quit | `Esc` then `:wq` and Enter |
| Quit **without** saving | `Esc` then `:q!` and Enter |
| Move around (Normal mode) | arrow keys, or `h` `j` `k` `l` |
| Go to top / bottom | `gg` / `G` |
| Delete the current line | `dd` |
| Undo / redo | `u` / `Ctrl + r` |

> [!IMPORTANT]
> The most famous beginner question in computing is "how do I exit vim?" Here is
> the answer, burn it into memory: **press `Esc`, then type `:q!` and Enter** to
> quit without saving, or **`:wq`** to save and quit. If you ever feel lost in
> vim, hit `Esc` a few times first — that always returns you to Normal mode.

Practice the loop now: open `vim notes.txt`, press `i`, type a sentence, press
`Esc`, type `:wq`, Enter. Then `cat notes.txt` to confirm. Do it three times
until it feels automatic. You don't need to be a vim wizard — you need to be able
to make a quick edit on any server and get out cleanly.

> [!TIP]
> **Which editor should I use?** Use nano for everyday edits while you're
> learning. Learn just enough vim to survive, because one day you'll be on a
> stripped-down server or inside a container where nano isn't installed — and
> vim always is.

## Part 2 — Standard streams and redirection

Every command on Linux has three "channels", called **standard streams**:

- **stdin** (standard input) — where a command reads input from (your keyboard
  by default).
- **stdout** (standard output) — where normal results go (your screen by
  default).
- **stderr** (standard error) — where error messages go (also your screen by
  default, but kept separate so you can handle errors on their own).

The magic of the shell is that you can **redirect** these channels. Instead of
printing to the screen, send output to a file:

```bash
cd ~/devops-lab
echo "first line" > out.txt     # >  creates/overwrites the file
echo "second line" >> out.txt    # >> appends to the file
cat out.txt
```

> [!WARNING]
> `>` **overwrites** the target file without asking — any existing contents are
> lost instantly. When you mean to add to a file, use `>>` (append). Mixing these
> up is a classic way to wipe a config file. When in doubt, `cat` the file first.

Redirect errors separately. `2>` redirects stderr (stream number 2):

```bash
ls /does-not-exist 2> errors.txt   # the error goes to the file, not the screen
cat errors.txt
ls /etc /nope > out.txt 2>&1        # send BOTH stdout and stderr to one file
```

A special destination, `/dev/null`, is the system's "black hole" — anything sent
there is discarded. It's how you silence output you don't care about:

```bash
ls /etc 2> /dev/null    # run quietly: throw away any error messages
```

## Part 3 — Pipes: connect commands together

A **pipe** (`|`) takes the **stdout of one command and feeds it as the stdin of
the next**. This is the Unix superpower: small, single-purpose tools combined
into exactly the result you need.

```bash
ls /etc | wc -l            # count how many entries are in /etc
ls -l /etc | head -n 5     # show only the first 5 lines of a long listing
cat /etc/passwd | wc -l    # how many user accounts exist on this system
```

Read a pipeline left to right as a sentence: *"list /etc, then count the lines."*
You can chain as many as you like, each stage transforming the stream a little
more. We'll build serious pipelines in Part 5.

## Part 4 — grep: find anything, anywhere

`grep` searches text for lines that match a pattern. It is, without exaggeration,
one of the most-used tools in a DevOps engineer's day — for finding a setting in
a config or an error in a 100,000-line log.

Basic search in a file:

```bash
grep "root" /etc/passwd        # lines containing "root"
```

The flags you'll use constantly:

| Flag | Meaning |
|------|---------|
| `-i` | Case-insensitive (`Error`, `error`, `ERROR` all match) |
| `-n` | Show the line number of each match |
| `-r` | Recursive — search every file under a directory |
| `-c` | Count matching lines instead of printing them |
| `-v` | Invert — show lines that do **not** match |
| `-w` | Match whole words only |
| `-E` | Extended regular expressions (for `|`, `+`, `()` patterns) |
| `-A 3` / `-B 3` / `-C 3` | Show 3 lines After / Before / around each match |

Real examples you'll actually run:

```bash
grep -i "error" /var/log/syslog            # find errors, any capitalisation
grep -rn "listen" /etc/nginx/              # where is "listen" set, with line numbers
grep -c "Failed password" /var/log/auth.log 2>/dev/null   # count failed logins
grep -v "^#" /etc/ssh/sshd_config | grep -v "^$"          # config without comments/blank lines
```

That last line is a pro habit: `grep -v "^#"` removes comment lines (those
starting with `#`) and `grep -v "^$"` removes blank lines, leaving only the
settings that are actually active. The `^` means "start of line" — your first
taste of a **regular expression**, the pattern language grep speaks. We'll go
deeper into regex later in the roadmap.

> [!TIP]
> Combine grep with a pipe to search the *output* of any command, not just
> files: `ps aux | grep nginx` finds the running nginx processes. You'll do this
> dozens of times a day.

## Part 5 — The power combos (this is where it clicks)

Now we connect everything. A few more small tools make pipelines sing:

- `sort` — sort lines (`-n` numeric, `-r` reverse).
- `uniq -c` — collapse duplicate adjacent lines and **count** them (always sort
  first).
- `cut` — pull out columns/fields.
- `wc -l` — count lines.

The classic "top offenders" pipeline — *which IPs hit my server most?* —
combines them:

```bash
# Pretend access log: "IP - timestamp - path"
cat access.log | cut -d' ' -f1 | sort | uniq -c | sort -rn | head
```

Read it as a sentence: *take the log, cut out the first field (the IP), sort the
IPs together, count each unique one, sort those counts highest-first, show the
top.* That single line is the kind of thing engineers reach for every day to
answer "what's happening on this server right now?"

## Hands-on lab: analyse a web access log

Let's make this real. You'll create a small fake access log and then interrogate
it like an on-call engineer investigating a traffic spike.

```bash
cd ~/devops-lab
mkdir -p day2 && cd day2

# 1. Build a sample access log (each line: IP STATUS PATH)
cat > access.log <<'LOG'
203.0.113.5 200 /index.html
198.51.100.9 404 /missing
203.0.113.5 200 /about
203.0.113.5 500 /checkout
10.0.0.7 200 /index.html
198.51.100.9 404 /also-missing
203.0.113.5 200 /index.html
10.0.0.7 200 /pricing
198.51.100.9 200 /index.html
203.0.113.5 404 /old-link
LOG

# 2. How many requests in total?
wc -l access.log

# 3. How many errors (status 4xx or 5xx)? -E enables the pattern with |
grep -E " (4|5)[0-9][0-9] " access.log | wc -l

# 4. Which IP is most active? (the top-offenders pipeline)
cut -d' ' -f1 access.log | sort | uniq -c | sort -rn

# 5. Show only the 404s, with line numbers
grep -n " 404 " access.log

# 6. Which paths were requested, each listed once?
cut -d' ' -f3 access.log | sort | uniq

# 7. Save a report of just the errors to a file for a colleague
grep -E " (4|5)[0-9][0-9] " access.log > errors-report.txt
cat errors-report.txt
```

If step 4 shows `203.0.113.5` as the busiest IP and step 3 reports the right
number of errors, congratulations — **you just did real log analysis**, the
same way professionals triage incidents. Tomorrow's servers, containers and
CI logs all yield to exactly these techniques.

## For Windows people: the same ideas in PowerShell

You asked about Windows too — good, because real environments are mixed. The
beautiful thing is that **the concepts transfer directly**. PowerShell also has
pipes and redirection; only the command names change.

```powershell
# grep            ->  Select-String
Select-String -Pattern "error" -Path .\app.log

# ls | wc -l      ->  count items
Get-ChildItem C:\Windows | Measure-Object | Select-Object -ExpandProperty Count

# cut + sort + uniq -c  ->  Group-Object
Get-Content .\access.log | ForEach-Object { ($_ -split ' ')[0] } |
  Group-Object | Sort-Object Count -Descending

# redirect output to a file (same > and >> as bash)
"hello" > out.txt
"world" >> out.txt
```

> [!NOTE]
> A key difference: Bash pipes pass **text**, while PowerShell pipes pass
> **objects** (rich data with properties). Both are powerful. In DevOps you'll
> often use both — Linux for most servers and containers, PowerShell for Windows
> hosts and some cloud tooling. The thinking ("compose small commands into a
> pipeline") is identical.

## Common mistakes to avoid

- **Clobbering a file with `>`** when you meant `>>`. Append unless you truly
  want to replace.
- **Forgetting to `sort` before `uniq -c`.** `uniq` only collapses *adjacent*
  duplicates, so you must sort first or the counts will be wrong.
- **Quoting grep patterns.** Always wrap patterns in quotes — `grep "not found"`
  — so spaces and special characters are handled correctly.
- **Editing a system file without a backup.** Before changing anything in
  `/etc`, copy it first: `sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak`.
- **Panicking in vim.** `Esc` then `:q!` always gets you out without saving.

## Recap — what you learned today

- Edit files in the terminal with **nano** (Ctrl+O save, Ctrl+X exit) and
  survive **vim** (`i` to type, `Esc`, `:wq` to save and quit).
- Commands have **stdin/stdout/stderr**; redirect with `>`, `>>`, `2>`, `2>&1`
  and silence with `/dev/null`.
- **Pipes** (`|`) feed one command's output into the next.
- **grep** finds matching lines in files (`-i -n -r -v -c -E -A/-B/-C`).
- Combine `cut | sort | uniq -c | sort -rn` to analyse logs and find top items.
- The same compose-small-tools thinking applies in **PowerShell** on Windows.

## Homework (15–20 minutes)

1. Create `~/devops-lab/day2/practice.log` with 8–10 lines, each like
   `USER ACTION RESULT` (e.g. `alex login success`, `sam login fail`).
2. Use `grep` to print only the `fail` lines, with line numbers.
3. Count how many actions each **user** performed using
   `cut | sort | uniq -c | sort -rn`.
4. Save just the failures to `failures.txt` using `>`.
5. Open `practice.log` in **vim**, add one more line, save with `:wq`, and
   confirm with `cat`.
6. Bonus: pipe `ps aux` into `grep` to find a process by name on your system.

If you can do all six without scrolling back, you're ready for Day 3.

## Common questions

**Should I learn vim or nano?**
Both, in that order of effort: nano for comfort now, just-enough vim so you're
never stuck on a server that doesn't have nano. You do not need to master vim to
be a great engineer — you need to make a quick edit and exit cleanly.

**What's the difference between `>` and `|`?**
`>` sends output to a **file**; `|` sends output to **another command**. You'll
often use both in one line: `grep error app.log | sort > sorted-errors.txt`.

**Is grep the same as the search in a code editor?**
Same idea, but grep works anywhere — over files, directories, and the live
output of other commands — with no GUI. That's why it's indispensable on servers.

**Do these skills really matter for DevOps, or just sysadmin?**
They are foundational to both. Reading logs, grepping for errors and piping data
are daily tasks when you operate pipelines, containers and cloud systems.

## What's next — Day 3

In **Day 3** we move from files to *people and power*: **users, groups,
permissions, ownership and `sudo`**. You'll learn to read those cryptic
`-rwxr-xr--` strings from `ls -l`, control exactly who can read, write and
execute each file, and use administrator privileges safely — the bedrock of
Linux security. Keep your `devops-lab` handy.

Great work today. Now close this page and redo the log-analysis lab from memory —
that's the rep that makes it stick.
