---
title: "Linux Fundamentals — The Terminal and Your First Commands"
slug: "linux-fundamentals-terminal-and-first-commands"
track: "linux-fundamentals"
trackName: "Linux Fundamentals"
module: "First Steps"
order: 102
level: "Beginner"
difficulty: "Beginner"
distribution: "Ubuntu"
category: "Linux Fundamentals"
tags: [linux, beginner, terminal, ls, history, tab-completion, bash]
cover: "/covers/curriculum/linux-fundamentals.svg"
estMinutes: 55
status: "published"
summary: "Master the moment-to-moment mechanics of the terminal: how a command is structured, listing files with ls and its essential options, tab-completion and command history (the two habits that make you fast), and the keyboard shortcuts professionals use all day."
seoTitle: "Linux Fundamentals 2: The Terminal, ls, Tab-completion & History"
seoDescription: "Beginner Linux terminal skills: command anatomy, ls options, tab-completion, command history, and keyboard shortcuts — with a hands-on lab and graded assessment."
---

In Lesson 101 you opened a shell and ran your first commands. This lesson turns
that from a novelty into a **skill**. We slow right down and master the everyday
mechanics of the terminal — the things you'll do thousands of times — so they
become automatic. Get these habits early and every later lesson is easier.

The two habits in Part 4 (**tab-completion** and **history**) are, no
exaggeration, the difference between someone who looks slow and painful at a
terminal and someone who looks fluent. We'll drill them.

## Learning objectives

By the end of this lesson you will be able to:

- Break any command into its three parts: **command**, **options**, **arguments**.
- List directory contents with **`ls`** and its most useful options (`-l`, `-a`,
  `-h`, `-t`, `-R`).
- Read a long listing (`ls -l`) field by field.
- Use **tab-completion** to type faster and avoid typos.
- Recall and reuse past commands with **history** and the arrow keys.
- Use the core **terminal keyboard shortcuts**.

## Part 1 — The anatomy of a command

Almost every command follows the same shape:

```text
command   [options]        [arguments]
  ls        -l               /etc
```

- **Command** — the program to run (`ls`).
- **Options** (or *flags*) — switches that change behaviour, usually starting with
  a dash. Short options are a single letter (`-l`); long options are words
  (`--all`). Many short options can be **combined**: `ls -l -a` = `ls -la`.
- **Arguments** — what the command should act on (a file, a directory, some text).

Everything is separated by **spaces**. That's why filenames with spaces are
awkward (we'll handle them with quoting later). Read commands left to right: *run
this program, with these switches, on these things.*

## Part 2 — `ls`: list what's there

`ls` lists the contents of a directory. On its own it lists where you are:

```bash
ls
```

Its options are the ones you'll use most in all of Linux:

```bash
ls -l      # long format: one item per line with details (permissions, size, date)
ls -a      # all: include hidden files (names starting with a dot, like .bashrc)
ls -h      # human-readable sizes (1.5K, 23M) — combine with -l
ls -lh     # the everyday combo: detailed + readable sizes
ls -t      # sort by modification time, newest first
ls -ltr    # long, by time, reversed -> newest at the BOTTOM (great for logs)
ls -R      # recursive: this directory and everything inside it
ls /etc    # list a specific directory instead of the current one
```

> [!TIP]
> `ls -ltr` is a professional reflex: in a folder of log files it puts the
> **most recently changed file last**, right above your prompt where it's easiest
> to see. Burn this one into your fingers.

### Reading a long listing

`ls -l` looks intimidating until someone decodes it once. Here's a line:

```text
-rw-r--r--  1  alex  staff   2048  Jun 22 09:15  notes.txt
```

| Field | Value | Meaning |
|-------|-------|---------|
| Type + permissions | `-rw-r--r--` | First char: `-` file, `d` directory, `l` link. The rest is permissions (a whole lesson later). |
| Link count | `1` | Number of hard links. |
| Owner | `alex` | The user who owns it. |
| Group | `staff` | The owning group. |
| Size | `2048` | Size in bytes (use `-h` for `2.0K`). |
| Date | `Jun 22 09:15` | Last modification time. |
| Name | `notes.txt` | The filename. |

You don't need to memorise this now — just know **where each piece lives** so the
output stops being a wall of symbols.

## Part 3 — Hidden files and colours

Files whose names begin with a dot (`.bashrc`, `.ssh`, `.config`) are **hidden** —
`ls` skips them unless you add `-a`. They're not secret; the dot is just a
convention for "configuration, keep it out of the way."

```bash
ls -a       # reveals .bashrc, .profile, . and ..
```

Two special entries always show with `-a`:

- `.` means **this directory**.
- `..` means **the parent directory** (one level up).

You'll use `.` and `..` constantly for navigation in the next lesson. Most distros
also **colourise** `ls`: directories in blue, executables in green, links in cyan.
That colouring comes from `ls --color=auto` (usually pre-set for you).

## Part 4 — The two habits that make you fast

**Tab-completion.** Start typing a command or filename and press **Tab**. The shell
finishes it for you if there's only one match, or shows the options if there are
several.

```bash
# Type:  ls Doc   then press Tab  -> completes to  ls Documents/
# Type:  cd /et   then press Tab  -> completes to  cd /etc/
# Press Tab twice on an ambiguous prefix to list all matches.
```

Tab-completion isn't just faster — it **prevents typos** (you can't misspell a name
the shell typed for you) and confirms a file exists (if Tab won't complete it, it
isn't there). Use it for *every* path and filename. Professionals press Tab more
than almost any other key.

**Command history.** The shell remembers what you've run.

```bash
history              # numbered list of past commands
history | tail -20   # the last 20
!42                  # re-run command number 42 from the list
!!                   # re-run the very last command (great with sudo: sudo !!)
```

And the keys you'll use even more:

- **Up / Down arrows** — step through previous commands.
- **Ctrl+R** — *reverse search*: start typing and it finds the last command
  containing those letters. Press Ctrl+R again to go further back, Enter to run,
  or arrow keys to edit. This is the power-user way to recall a long command.

## Part 5 — Essential keyboard shortcuts

These work on the command line itself (Bash uses Emacs-style keys by default):

| Keys | Action |
|------|--------|
| **Ctrl+C** | Cancel the current command / abort what you're typing |
| **Ctrl+L** | Clear the screen (same as `clear`) |
| **Ctrl+A** / **Ctrl+E** | Jump to start / end of the line |
| **Ctrl+U** / **Ctrl+K** | Delete to start / to end of the line |
| **Ctrl+W** | Delete the word before the cursor |
| **Ctrl+R** | Reverse-search history |
| **Ctrl+D** | End of input / log out of the shell |
| **Tab** | Auto-complete |

> [!IMPORTANT]
> **Ctrl+C** (cancel) and **Ctrl+D** (end of input) do different things and beginners
> mix them up. Ctrl+C says "stop this command." Ctrl+D says "I have no more input"
> — at an empty prompt that **logs you out**, which can be a surprise. If a terminal
> suddenly closes, you probably pressed Ctrl+D.

## Hands-on lab

```bash
# 1. Plain list, then the detailed views
ls
ls -l
ls -la
ls -lh

# 2. Sort by time, newest at the bottom (watch the order change)
ls -ltr /etc

# 3. Practise reading a long listing: pick any line from `ls -l /etc`
#    and name the owner, the size, and the filename out loud.
ls -l /etc | head

# 4. Tab-completion drill (type, don't paste; press Tab where shown):
#    cd /v<Tab>     -> /var/
#    cd /var/lo<Tab> -> /var/log/
#    ls -l /var/log/sys<Tab>
cd /var/log
ls -lh

# 5. History drill
history | tail -10        # see what you just did
!!                        # re-run the last command
# Now press Ctrl+R, type "ls", and watch it find your last ls command.

# 6. Line-editing drill: type a long wrong command, then fix it with
#    Ctrl+A (start), Ctrl+E (end), Ctrl+W (delete a word), Ctrl+U (clear line).
echo this is a deliberately long line to edit
cd ~     # go back home
```

## Exercises

1. List everything in `/etc`, including hidden files, in human-readable long
   format, sorted so the newest file is at the **bottom**. (One combined command.)
2. Using only **tab-completion**, navigate to `/usr/share/` and list it. Notice how
   Tab confirms each directory exists as you go.
3. Run five different commands, then use `history` to print them and re-run the
   third one **by its number** (`!N`).
4. Use **Ctrl+R** to find and re-run the `ls -ltr /etc` command from the lab
   without retyping it.
5. From `ls -l /etc`, find the **largest** file shown on the first screen. (Hint:
   `ls -lhS /etc | head` — what does `-S` do? Verify with the next lesson's help
   skills, or reason it out.)

## Troubleshooting

- **`ls: cannot access 'foo': No such file or directory`** — the name you gave
  doesn't exist *in the directory you're in*. *Fix:* run plain `ls` to see what's
  actually there, and use **Tab** to complete real names (if Tab won't complete it,
  it isn't there). Check capitalisation.
- **Tab-completion "does nothing"** — usually means there's **no match** (the file
  isn't there or you mistyped the prefix), or there are **several** matches (press
  Tab twice to list them). It's information, not a bug.
- **Your terminal window vanished** — you likely pressed **Ctrl+D** at an empty
  prompt, which logs out the shell. Reopen the terminal; it's harmless.
- **A file you know exists doesn't show in `ls`** — it's probably **hidden** (name
  starts with `.`). *Fix:* add `-a`.

Reproduce the hidden-file case on purpose: run `ls` in your home directory, then
`ls -a`, and spot the `.bashrc` and `.profile` that appeared.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Several answers are
practical — actually run them.

1. Name the three parts of a command and give an example of each.
2. Write a single `ls` command that shows hidden files in long, human-readable
   form.
3. What does `ls -ltr` do, and why is it useful for logs?
4. In `ls -l` output, which field comes right before the filename?
5. What do `.` and `..` mean?
6. What key completes a half-typed filename, and name one benefit beyond speed.
7. How do you reverse-search your command history?
8. What's the difference between **Ctrl+C** and **Ctrl+D**?
9. **Practical:** show the newest-modified file in `/etc` on the last line of the
   output. Which command did you use?
10. **Practical:** re-run your previous command two different ways.

## Solutions & validation

1. **Command** (the program, e.g. `ls`), **options/flags** (switches, e.g. `-l`),
   **arguments** (what it acts on, e.g. `/etc`).
2. `ls -lah` (or `ls -alh`, `ls -la -h`). Order of letters doesn't matter.
3. Long listing, sorted by modification **t**ime, **r**eversed → newest at the
   **bottom**, right above your prompt — ideal for spotting the latest log.
4. The **date/time** (last modification time).
5. `.` = the current directory; `..` = the parent directory (one level up).
6. **Tab**. Beyond speed, it **prevents typos** and confirms the name exists.
7. **Ctrl+R**, then start typing part of the command.
8. **Ctrl+C** cancels the current command; **Ctrl+D** signals end-of-input and, at
   an empty prompt, logs you out of the shell.
9. **Validation:** `ls -ltr /etc` — the last line printed is the most recently
   modified entry. (`ls -lt /etc | head` shows the same file at the top.)
10. **Validation:** any two of — press **Up** then Enter; type `!!`; use **Ctrl+R**;
    or `!N` with the number from `history`.

> [!TIP]
> Spend ten extra minutes today just pressing **Tab** and **Ctrl+R** until they're
> reflexes. That muscle memory pays off in every single lesson that follows.

## What's next

Next: **Lesson 103 — The Filesystem Hierarchy and Navigating It.** Now that you can
list and read directories, you'll learn how the whole Linux filesystem is laid out
(`/`, `/etc`, `/home`, `/var` and friends), the crucial difference between
**absolute and relative paths**, and how to move around confidently with `cd`,
`.`, `..` and `~`.
