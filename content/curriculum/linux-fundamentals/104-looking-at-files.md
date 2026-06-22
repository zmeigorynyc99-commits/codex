---
title: "Linux Fundamentals — Looking at Files"
slug: "linux-fundamentals-looking-at-files"
track: "linux-fundamentals"
trackName: "Linux Fundamentals"
module: "First Steps"
order: 104
level: "Beginner"
difficulty: "Beginner"
distribution: "General Linux"
category: "Linux Fundamentals"
tags: [linux, beginner, cat, less, head, tail, wc, files]
cover: "/covers/curriculum/linux-fundamentals.svg"
estMinutes: 50
status: "published"
summary: "Read what's inside files like a pro: cat for short files, less for paging through big ones (and how to actually quit it), head and tail for the top and bottom, tail -f for live logs, wc to count, and file to find out what something really is."
seoTitle: "Linux Fundamentals 4: Reading Files with cat, less, head & tail"
seoDescription: "Beginner Linux: view files with cat, page big files with less, peek with head/tail, follow live logs with tail -f, count with wc — hands-on lab and graded assessment."
---

You can navigate the tree and list directories. Now the obvious next question:
*what's inside these files?* On Linux, an enormous amount of the system is plain
**text** — configuration in `/etc`, logs in `/var/log`, scripts, data — so reading
files is a daily, hourly activity. This lesson gives you the right tool for each
situation, and rescues you from the classic beginner trap of getting **stuck
inside `less`** with no idea how to get out.

## Learning objectives

By the end of this lesson you will be able to:

- Print a file with **`cat`** and know when *not* to.
- Page through large files with **`less`** — scroll, search, and **quit**.
- Peek at the top or bottom with **`head`** and **`tail`**.
- Watch a file grow in real time with **`tail -f`** (reading live logs).
- Count lines, words and bytes with **`wc`**.
- Identify what a file actually is with **`file`**.

## Part 1 — `cat`: print a whole file

`cat` prints a file's contents straight to the screen:

```bash
cat /etc/hostname          # tiny file: your machine's name
cat /etc/os-release        # which distro & version you're on
cat notes.txt
```

`cat` can also join (con**cat**enate) several files, and number lines:

```bash
cat file1 file2            # print both, one after the other
cat -n script.sh           # print with line numbers
```

> [!IMPORTANT]
> `cat` dumps the **entire** file at once. On a short file that's perfect. On a
> 100,000-line log it floods your screen and you can't read any of it. **Rule of
> thumb: `cat` for small files, `less` for big ones.** If you're not sure how big a
> file is, use `less` — it handles any size gracefully.

## Part 2 — `less`: page through anything

`less` opens a file in a scrollable viewer — it loads instantly even on huge files
because it doesn't read the whole thing up front:

```bash
less /var/log/syslog
less /etc/services
```

Inside `less`, these keys drive it:

| Key | Action |
|-----|--------|
| **Space** / **f** | Forward one screen |
| **b** | Back one screen |
| **↓ / ↑** | Down / up one line |
| **g** / **G** | Jump to the **start** / **end** of the file |
| **/text** | **Search** forward for `text` (then **n** = next, **N** = previous) |
| **?text** | Search backward |
| **q** | **Quit** — get back to your shell |

> [!IMPORTANT]
> **To get out of `less`, press `q`.** This is the #1 "I'm trapped in the terminal"
> moment for every beginner — you open a file, the screen fills, and Ctrl+C does
> nothing useful. The escape hatch is the single key **`q`** (for *quit*).
> Memorise it now and you'll never panic. (The `man` help system you'll meet
> later uses `less` too, so the same `q` quits it.)

## Part 3 — `head` and `tail`: the top and the bottom

Often you only want the **beginning** or the **end** of a file — not all of it.

```bash
head file.txt          # first 10 lines (default)
head -n 20 file.txt    # first 20 lines
tail file.txt          # last 10 lines
tail -n 50 file.txt    # last 50 lines
```

`tail` is a log-reader's best friend, because the **newest** log entries are at the
**end** of the file. And its star feature — **follow mode**:

```bash
tail -f /var/log/syslog      # print new lines AS they are written (live!)
```

`tail -f` keeps running and shows each new line the moment it appears — exactly how
you watch a server while it's doing something. Press **Ctrl+C** to stop following
and return to your prompt.

> [!TIP]
> Combine `head` and `tail` to grab a slice from the middle conceptually, but the
> everyday wins are simple: `tail -n 100 /var/log/syslog` to see what *just*
> happened, and `tail -f` to watch live. You'll run these two more than almost any
> other commands as an admin.

## Part 4 — `wc`: count things; `file`: identify things

**`wc`** ("word count") measures a file:

```bash
wc file.txt            # lines  words  bytes  filename
wc -l file.txt         # just the LINE count (very common)
wc -w essay.txt        # just words
```

`wc -l` answers "how many lines?" — how many entries in a list, how many log lines,
how many users in a file. You'll pipe other commands into `wc -l` constantly later.

**`file`** tells you what a file *actually* is, regardless of its name:

```bash
file /etc/hostname     # ASCII text
file /bin/ls           # ELF executable (a program)
file photo.jpg         # JPEG image data
file mystery           # don't cat an unknown file blindly — check it first
```

> [!IMPORTANT]
> Never `cat` a file you can't identify — printing a **binary** file (a program, an
> image) spews control characters that can scramble your terminal so even your
> typing looks like garbage. *Check first* with `file`. If your terminal does get
> scrambled, run `reset` (even if you can't see what you're typing) and press
> Enter to restore it.

## Hands-on lab

```bash
# 1. Small files: cat is perfect
cat /etc/hostname
cat /etc/os-release

# 2. Big/structured file: use less. Practise the keys, then press q to quit.
less /etc/services
#   inside less:  Space (down)  b (up)  /tcp (search)  n (next)  G (end)  g (top)  q (quit)

# 3. Top and bottom
head -n 5 /etc/services
tail -n 5 /etc/services

# 4. Live follow (needs something writing logs). Open it, wait a few seconds,
#    then Ctrl+C to stop. On a quiet machine you may see nothing — that's fine.
sudo tail -f /var/log/syslog       # Ctrl+C to stop
#   (No /var/log/syslog? Try: journalctl -f   then Ctrl+C)

# 5. Count
wc -l /etc/services                # how many lines?
wc /etc/passwd                     # lines, words, bytes

# 6. Identify before you open
file /etc/hostname
file /bin/ls
```

## Exercises

1. Show the **first 3** and the **last 3** lines of `/etc/services` using two
   commands.
2. How many lines are in `/etc/passwd`? (Each line is roughly one user account.)
   Use the right `wc` option.
3. Open `/etc/services` in `less`, search for `https`, jump to the **end** of the
   file, then quit — all with keystrokes, no retyping.
4. Use `file` on three different things: a text config in `/etc`, a program in
   `/bin`, and your own `~/.bashrc`. Note how their types differ.
5. Start `tail -f` on a log (or `journalctl -f`), watch for a moment, and stop it
   cleanly. Which key stopped it?

## Troubleshooting

- **"I'm stuck — the file filled my screen and I can't type."** You're inside
  `less` (or `man`). *Fix:* press **`q`**.
- **Your terminal shows garbage / your keystrokes look corrupted.** You `cat`'d a
  **binary** file. *Fix:* type `reset` and press Enter (even if you can't see it),
  which restores the terminal. Next time, `file` it first.
- **`cat: /var/log/syslog: Permission denied`** — some logs are readable only by
  root. *Fix:* prefix with `sudo` (`sudo tail /var/log/syslog`), or use
  `journalctl` which respects your group membership.
- **`tail -f` "isn't showing anything."** The file just isn't being written to
  right now — that's normal on an idle machine, not an error. *Fix:* generate
  activity (e.g. log in from another session) or follow a busier source like
  `journalctl -f`.

Reproduce the first case deliberately: run `less /etc/services`, confirm you're
"trapped", then escape with **`q`** so the fix is muscle memory.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Run the practical items.

1. When should you use `cat` versus `less`?
2. Which single key quits `less` (and `man`)?
3. Inside `less`, how do you search for the word `error`?
4. What does `head -n 20 file` show?
5. Why is `tail` especially useful for logs?
6. What does `tail -f` do, and how do you stop it?
7. Which `wc` option prints only the line count?
8. What does `file` tell you, and why check it before `cat`?
9. **Practical:** print the last 5 lines of `/etc/services`. Which command?
10. **Practical:** count the lines in `/etc/passwd`. How many are there on your
    system, and what command gave you the number?

## Solutions & validation

1. `cat` for **small** files (prints everything at once); `less` for **large** or
   unknown-size files (pages through without flooding the screen).
2. **`q`**.
3. Type **`/error`** then Enter; **`n`** jumps to the next match.
4. The **first 20 lines** of the file.
5. Because the **newest** entries are at the **end** of a log file, which is exactly
   what `tail` shows.
6. It **follows** the file, printing new lines live as they're written; stop it with
   **Ctrl+C**.
7. **`-l`** (`wc -l`).
8. `file` reports the file's **actual type** (text, executable, image…). Checking
   first avoids `cat`-ing a **binary** and scrambling your terminal.
9. **Validation:** `tail -n 5 /etc/services` prints exactly five lines.
10. **Validation:** `wc -l /etc/passwd` prints a number followed by the filename;
    that number is your account count. Any positive number with no error passes.

> [!TIP]
> You now have a complete reading toolkit. Pair it with the navigation from Lesson
> 103 and you can explore any Linux system safely: `cd` to a directory, `ls -ltr`
> to find the newest file, `file` to check it, then `less` or `tail` to read it.

## What's next

Next: **Lesson 105 — Creating and Managing Files & Directories.** You've read the
system; now you'll start changing it. You'll create directories with `mkdir`, make
empty files with `touch`, and copy, move, rename and delete with `cp`, `mv` and
`rm` — including the safety habits that stop `rm` from ruining your day.
