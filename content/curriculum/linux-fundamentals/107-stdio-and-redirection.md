---
title: "Linux Fundamentals — Standard I/O and Redirection"
slug: "linux-fundamentals-stdio-and-redirection"
track: "linux-fundamentals"
trackName: "Linux Fundamentals"
module: "Text & Help"
order: 107
level: "Beginner"
difficulty: "Beginner"
distribution: "General Linux"
category: "Linux Fundamentals"
tags: [linux, beginner, redirection, pipe, stdout, stderr, tee]
cover: "/covers/curriculum/linux-fundamentals.svg"
estMinutes: 55
status: "published"
summary: "The idea that makes Linux composable. Learn the three standard streams (stdin, stdout, stderr), capture output to files with > and >>, separate and merge errors with 2> and 2>&1, discard with /dev/null, split with tee, and chain commands with the pipe."
seoTitle: "Linux Fundamentals 7: Redirection, Pipes, stdout/stderr & tee"
seoDescription: "Beginner Linux: master stdin/stdout/stderr, redirect with > >> 2> 2>&1, discard via /dev/null, split with tee, and chain commands with pipes. Hands-on lab + assessment."
---

This is one of the most important lessons in the whole track. The Linux philosophy
is "small tools that do one thing well, combined freely." The glue that combines
them is **redirection** and **pipes** — controlling where a command's input comes
from and where its output goes. Master this and a handful of simple commands become
a limitless toolkit.

## Learning objectives

By the end of this lesson you will be able to:

- Describe the three standard streams: **stdin (0)**, **stdout (1)**, **stderr
  (2)**.
- Redirect output to files with **`>`** (overwrite) and **`>>`** (append).
- Redirect and merge errors with **`2>`** and **`2>&1`**.
- Discard output with **`/dev/null`**.
- Split output to screen *and* file with **`tee`**.
- Connect commands with the **pipe `|`** and feed input with **`<`**.

## Part 1 — The three streams

Every program automatically gets three "channels" when it runs:

| Stream | Number | Default | Purpose |
|--------|--------|---------|---------|
| **stdin** | 0 | keyboard | where input comes **in** |
| **stdout** | 1 | terminal | normal output goes **out** |
| **stderr** | 2 | terminal | **error** messages go out |

The key insight: **normal output and error messages are separate channels**, even
though both show up on your screen by default. That separation is what lets you,
say, save results to a file while still seeing errors — or vice versa. The numbers
(0, 1, 2) are called *file descriptors*; you'll use 1 and 2 explicitly below.

## Part 2 — Redirecting output to a file: `>` and `>>`

```bash
echo "hello" > greeting.txt      # write stdout to a file (CREATES or OVERWRITES)
echo "world" >> greeting.txt     # APPEND stdout to the file (adds to the end)
cat greeting.txt                 # hello / world
ls -l /etc > listing.txt         # capture a command's output into a file
```

> [!IMPORTANT]
> **`>` overwrites without warning** — it truncates the file to empty first, then
> writes. `echo hi > important.txt` destroys whatever `important.txt` held. Use
> **`>>`** when you mean to **add** to a file. This single distinction prevents a
> lot of lost data; internalise it now.

## Part 3 — Redirecting errors: `2>` and `2>&1`

Because stderr is a separate channel (2), you redirect it with `2>`:

```bash
ls /nope 2> errors.txt           # send ONLY error messages to the file
ls /etc /nope > out.txt 2> err.txt   # results to out.txt, errors to err.txt
```

To send **both** streams to the same place, redirect stdout to the file, then point
stderr at "wherever stdout is going" with `2>&1`:

```bash
command > everything.txt 2>&1    # stdout AND stderr into one file
command >> log.txt 2>&1          # ...appended
```

Order matters: `2>&1` must come **after** the `> file`, because it means "make 2 go
to the same place 1 is going *right now*." Modern Bash also offers the shorthand
`&>`:

```bash
command &> everything.txt        # Bash shortcut for > file 2>&1
```

## Part 4 — `/dev/null`: the black hole

`/dev/null` is a special file that **discards everything** written to it. Redirect
output you don't care about:

```bash
command 2> /dev/null             # run quietly, hiding error messages
command > /dev/null 2>&1         # hide ALL output (you only care if it succeeded)
noisy-script.sh > /dev/null      # keep errors visible, drop normal chatter
```

This is everywhere in scripts and cron jobs, where you want a command to run but
don't want its output cluttering logs or mailboxes.

## Part 5 — `tee`: screen *and* file

Sometimes you want to **see** output *and* save it. A plain `>` hides it in the
file. `tee` writes to both:

```bash
ls -l /etc | tee listing.txt           # show on screen AND save to listing.txt
command | tee -a log.txt               # -a appends instead of overwriting
sudo command | tee /etc/somefile       # handy: tee can write where the pipe's
                                       # left side lacks permission via sudo
```

> [!TIP]
> `tee` is named after a T-pipe in plumbing — it splits one stream into two. The
> `sudo ... | tee` pattern is the idiomatic way to write to a root-owned file,
> because `sudo command > /etc/file` doesn't work (the `>` is done by your shell,
> not by sudo). You saw this in earlier server lessons; now you know why.

## Part 6 — The pipe `|`: the big one

A **pipe** connects one command's **stdout** to the next command's **stdin**, so
data flows through a chain. This is the heart of Linux power:

```bash
ls /etc | less                   # page through a long listing
ls /etc | wc -l                  # COUNT items in /etc (list -> count)
cat /var/log/syslog | grep error # lines containing "error" (you'll love grep next)
ls -l | sort -k5 -n | tail -3    # three largest files by size column
history | grep ssh | tail        # your recent ssh commands
```

Read a pipeline left to right as a factory line: each command does one
transformation and hands the result to the next. You can chain as many as you like.
Input redirection `<` does the reverse — feeds a file *into* a command's stdin:

```bash
sort < names.txt                 # feed the file in as stdin
wc -l < /etc/passwd              # count lines by piping the file in
```

(Most tools also accept a filename directly, e.g. `sort names.txt`; `<` matters
most when a command only reads stdin.)

## Hands-on lab

```bash
mkdir -p ~/redir-lab && cd ~/redir-lab

# 1. Overwrite vs append
echo "line 1" > file.txt
echo "line 2" >> file.txt
echo "OOPS"   > file.txt        # watch this overwrite everything
cat file.txt                    # only "OOPS" remains — the lesson of >

# 2. Separate normal output from errors
ls /etc /does-not-exist > out.txt 2> err.txt
echo "--- stdout ---"; cat out.txt | head
echo "--- stderr ---"; cat err.txt

# 3. Merge both, then discard both
ls /etc /nope > all.txt 2>&1; tail -3 all.txt
ls /nope > /dev/null 2>&1; echo "exit code was $?"   # silent; $? shows success/fail

# 4. See AND save with tee
ls -l /etc | tee etc-listing.txt | wc -l   # screen via tee, count via pipe

# 5. Pipes: build a small pipeline
ls /etc | sort | head -5         # first 5 names alphabetically
ls /etc | wc -l                  # how many entries

# 6. Clean up
cd ~ && rm -r ~/redir-lab
```

## Exercises

1. Append the current date to a file `~/journal.txt` three times (using `date` and
   `>>`), then show the file. Why didn't the earlier entries disappear?
2. Run a command that produces an error, sending **only** the error to
   `errors.log` while letting normal output reach the screen.
3. Run any command and capture **both** stdout and stderr into a single file
   `combined.log`.
4. Count how many entries are in `/usr/bin` using a pipe into `wc -l`.
5. Use `tee` to save `ls -l /etc` to a file **and** pipe it onward to count the
   lines, in one command.

## Troubleshooting

- **"My file is empty / I lost my data"** — you used `>` where you meant `>>`, and
  it truncated the file. *Fix:* use `>>` to append; keep backups of important files.
- **`bash: /etc/file: Permission denied` even with sudo** — `sudo cmd > /etc/file`
  fails because **your shell** opens the file (as you), not sudo. *Fix:* `cmd |
  sudo tee /etc/file > /dev/null`.
- **Errors still appear after `> file`** — `>` only redirects **stdout**; errors go
  on stderr. *Fix:* add `2>&1` (after the `>`), or use `&>`.
- **`2>&1 > file` doesn't merge** — order is wrong. stderr was pointed at the
  terminal *before* stdout was redirected. *Fix:* put `2>&1` **after** `> file`.

Reproduce the order bug: `ls /nope 2>&1 > /dev/null` still prints the error (stderr
went to the terminal first), whereas `ls /nope > /dev/null 2>&1` is silent.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Run the practical items.

1. Name the three standard streams and their numbers.
2. What's the difference between `>` and `>>`?
3. How do you redirect only error messages to a file?
4. What does `2>&1` mean, and why must it come after `> file`?
5. What is `/dev/null` for?
6. What does `tee` do that `>` doesn't?
7. In plain words, what does a pipe `|` connect?
8. Why does `sudo cmd > /etc/file` fail, and what's the fix?
9. **Practical:** count the entries in `/etc` using a pipe. What command and what
   number?
10. **Practical:** run a failing command silently (no output at all) and then print
    its exit code. What did you run?

## Solutions & validation

1. **stdin (0)**, **stdout (1)**, **stderr (2)**.
2. `>` **overwrites** (truncates then writes); `>>` **appends** to the end.
3. `command 2> file`.
4. It redirects **stderr to wherever stdout currently points**; it must follow
   `> file` so that "stdout" already means the file when stderr is pointed at it.
5. A **discard sink** — anything written to it is thrown away (used to silence
   unwanted output).
6. `tee` writes to **both** the screen (stdout) **and** a file at once; `>` only
   writes to the file.
7. The **stdout of the left command to the stdin of the right command**.
8. The **shell** (running as you) opens the redirection target, not `sudo`; fix
   with `cmd | sudo tee /etc/file`.
9. **Validation:** `ls /etc | wc -l` prints a count (any positive integer).
10. **Validation:** `somebadcommand > /dev/null 2>&1; echo $?` — prints a non-zero
    exit code with no other output.

> [!TIP]
> Redirection + pipes are the grammar of the shell. The next three lessons (grep,
> text processing, sed/awk) are all about commands you'll *pipe together* — so this
> foundation pays off immediately and forever.

## What's next

Next: **Lesson 108 — Finding Text with grep.** Armed with pipes, you'll learn the
single most useful text tool on the system: `grep`, which finds lines matching a
pattern. We'll cover its essential flags and a gentle introduction to regular
expressions — the pattern language that turns searching into a superpower.
