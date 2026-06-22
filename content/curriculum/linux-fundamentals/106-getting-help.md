---
title: "Linux Fundamentals — Getting Help: man, --help, apropos & friends"
slug: "linux-fundamentals-getting-help"
track: "linux-fundamentals"
trackName: "Linux Fundamentals"
module: "Text & Help"
order: 106
level: "Beginner"
difficulty: "Beginner"
distribution: "General Linux"
category: "Linux Fundamentals"
tags: [linux, beginner, man, help, apropos, documentation]
cover: "/covers/curriculum/linux-fundamentals.svg"
estMinutes: 45
status: "published"
summary: "Never be stuck again: read manual pages with man, get quick syntax with --help, discover commands you don't know with apropos, understand man sections, and tell what a command really is with type and which. The self-sufficiency lesson."
seoTitle: "Linux Fundamentals 6: man, --help, apropos & Reading the Docs"
seoDescription: "Beginner Linux: master the built-in help system — man pages and their sections, --help, apropos, whatis, type and which — so you can teach yourself anything. Lab + assessment."
---

Every great Linux user has the same secret: they don't memorise everything, they
**look it up fast**. The system documents itself, thoroughly, offline, on every
machine. This lesson teaches you to read that documentation fluently — which makes
you self-sufficient. From here on, when you hit a command you don't know, you won't
be stuck; you'll know exactly how to find the answer.

## Learning objectives

By the end of this lesson you will be able to:

- Read a **manual page** with `man` and navigate it (it uses `less` — Lesson 104).
- Get fast usage with **`--help`** and understand the **synopsis** notation.
- **Discover** commands by keyword with **`apropos`** and **`whatis`**.
- Understand **man sections** (why there's `printf(1)` and `printf(3)`).
- Identify what a command is with **`type`**, **`which`**, and **`help`**.

## Part 1 — `man`: the manual

`man` ("manual") opens the reference page for a command:

```bash
man ls
man cp
man man          # the manual page about man itself
```

It opens in `less`, so all of Lesson 104 applies: **Space** pages down, **/word**
searches, **q** quits. Every man page follows the same structure — learn it once:

- **NAME** — the command and a one-line description.
- **SYNOPSIS** — how to call it (the usage pattern).
- **DESCRIPTION** — what it does, in detail.
- **OPTIONS** — every flag explained.
- **EXAMPLES** — sample invocations (scroll here first; press **G** for the end,
  examples are often near the bottom).
- **SEE ALSO** — related commands.

### Reading the SYNOPSIS

The synopsis uses a consistent notation. For `ls`:

```text
ls [OPTION]... [FILE]...
```

- **`[ ]`** means **optional**.
- **`...`** means "you can repeat this."
- Words in **CAPS** or `<angle>` are placeholders **you** replace.
- Anything **not** bracketed is **required**, typed literally.

So `ls [OPTION]... [FILE]...` reads: "run `ls`, optionally with any number of
options, optionally followed by any number of files." That notation appears in
`--help` output and documentation everywhere — knowing it is a real unlock.

## Part 2 — `--help`: the quick reference

Most commands accept `--help` for a concise summary printed straight to the
terminal (no pager):

```bash
ls --help
cp --help
date --help        # find the +FORMAT options here
```

`--help` is faster than `man` when you just need to remember a flag. Reach for
`--help` for a quick reminder, `man` for the full story. (A few commands use `-h`
instead, and a rare one uses neither — then `man` is your fallback.)

> [!TIP]
> Pipe long help through a pager or `grep`: `ls --help | less`, or jump straight
> to what you want with `ls --help | grep -i sort`. You'll learn `grep` properly in
> Lesson 108 — this is a taste of how the tools combine.

## Part 3 — Discovering commands you don't know

The hardest problem is when you don't even know the command's name. `apropos`
searches the manual's one-line descriptions by keyword:

```bash
apropos copy          # commands whose description mentions "copy"
apropos "list dir"    # phrases work too
apropos -s 1 compress # limit to section 1 (user commands)
```

`whatis` is the reverse — the one-liner for a name you *do* know:

```bash
whatis ls cp mv       # one-line description of each
```

> [!NOTE]
> `apropos` and `whatis` read a pre-built index. On a fresh minimal system they
> may say "nothing appropriate" until the index exists — build it once with
> `sudo mandb`. On normal installs it's already there.

## Part 4 — Man sections (the number in parentheses)

You'll see references like `printf(1)` and `printf(3)`. The number is the **manual
section**, because the same name can mean different things:

| Section | Contains | Example |
|---------|----------|---------|
| 1 | User commands | `ls(1)`, `printf(1)` |
| 5 | File formats / config files | `crontab(5)`, `passwd(5)` |
| 8 | System administration commands | `mount(8)`, `useradd(8)` |
| 2 / 3 | System calls / library functions (programming) | `open(2)`, `printf(3)` |

Ask for a specific section by number:

```bash
man 5 crontab     # the crontab FILE FORMAT (not the command, which is man 1 crontab)
man 1 printf      # the shell command printf
man -k passwd     # -k is the same as apropos: every passwd-related page
```

This matters constantly as an admin: `man 5 sshd_config` documents the SSH config
*file*, while `man 8 sshd` documents the *daemon*. Same family, different sections.

## Part 5 — What *is* this command? `type`, `which`, `help`

When a command behaves oddly, find out what it actually is:

```bash
type ls           # ls is aliased to `ls --color=auto`   (reveals aliases!)
type cd            # cd is a shell builtin
type python3      # python3 is /usr/bin/python3          (an external program)
which python3     # just the path to the executable
type -a ls        # ALL meanings of ls (alias AND the /bin/ls behind it)
```

Some commands aren't files at all — they're **built into the shell** (`cd`, `pwd`,
`echo`). Those are documented by the shell's own `help`, not `man`:

```bash
help cd           # help for a Bash builtin
help              # list all builtins
man bash          # the giant page documenting Bash itself
```

> [!IMPORTANT]
> If `man cd` says "No manual entry for cd", that's not a broken system — `cd` is a
> **shell builtin**, so its help lives in `help cd` (or `man bash`), not in its own
> man page. Knowing whether something is a builtin, an alias, or a program
> (via `type`) explains a whole class of confusing behaviour.

## Hands-on lab

```bash
# 1. Open and navigate a man page
man ls
#   inside: press /sort  Enter (search), n (next match), G (end, examples), q (quit)

# 2. Quick reference vs full manual
date --help | head -20
man date            # find the FORMAT section, then q

# 3. Discover a command from a concept
apropos "change password"
whatis passwd

# 4. Sections in action
man 5 crontab       # the FILE FORMAT (q to quit)
whatis -s 1 crontab # the command's one-liner

# 5. Identify commands
type ls
type cd
type -a echo        # note: echo is BOTH a builtin and /usr/bin/echo
which cp
help cd | head
```

## Exercises

1. Use `man` to find the `ls` option that appends a `/` to directory names. (Search
   inside the page.) What is it?
2. Without using `man`, find the `date` format string that prints only the
   four-digit year. (Hint: `date --help`.)
3. You want to compress files but can't recall the command. Use `apropos` to find
   at least two compression-related commands.
4. Show the difference between `man 1 crontab` and `man 5 crontab` in one sentence
   each.
5. Run `type -a echo`. Explain why two results appear.

## Troubleshooting

- **"No manual entry for X"** — X may be a **shell builtin** (try `help X` or
  `man bash`), or its package isn't installed (install it, or check spelling).
- **`apropos: nothing appropriate`** — the man index isn't built. *Fix:* `sudo
  mandb`, then retry.
- **`--help` floods the screen** — page it: `cmd --help | less` (q to quit), or
  filter: `cmd --help | grep -i keyword`.
- **A command behaves unexpectedly** (e.g. `ls` has colours you didn't ask for) —
  it's probably an **alias**. *Fix:* `type ls` reveals it; run the real binary with
  a leading backslash: `\ls`.

Reproduce the builtin case: run `man cd` (fails), then `help cd` (works) — proof
that builtins document themselves differently.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Run the practical items.

1. Which command opens the full manual page for `cp`?
2. In a SYNOPSIS, what do `[ ]` and `...` mean?
3. When would you use `--help` instead of `man`?
4. Which command finds commands by a keyword in their descriptions?
5. What does the number in `crontab(5)` tell you?
6. How do you read the manual for the crontab **file format** specifically?
7. Which command tells you whether `cd` is a builtin, an alias, or a program?
8. Where is the help for a shell builtin like `cd` documented?
9. **Practical:** find, via `man` or `--help`, the `ls` flag that sorts by file
   size. What is it?
10. **Practical:** run `type -a ls` on your system. What does it report?

## Solutions & validation

1. `man cp`.
2. `[ ]` = optional; `...` = the preceding item may be repeated.
3. When you want a **quick** flag reminder rather than the full, paged manual.
4. `apropos` (equivalently `man -k`).
5. It's the **manual section** — section 5 means a **file format / config file**
   (as opposed to section 1, the user command).
6. `man 5 crontab`.
7. `type` (e.g. `type cd`); `type -a` shows all meanings.
8. In the shell's own help: `help cd` (or `man bash`).
9. **Validation:** `-S` (`ls -lS` sorts largest-first) — found under OPTIONS in
   `man ls` or `ls --help | grep -i size`.
10. **Validation:** typically `ls is aliased to 'ls --color=auto'` **and** `ls is
    /usr/bin/ls` — an alias sitting in front of the real binary.

> [!TIP]
> Self-sufficiency unlocked. For the rest of this curriculum, whenever you meet an
> unfamiliar flag, resist asking — open `man` or `--help` first. That habit is what
> separates people who *use* Linux from people who *know* Linux.

## What's next

Next: **Lesson 107 — Standard I/O and Redirection.** You'll learn where command
output actually goes (stdout vs stderr), how to capture it into files with `>` and
`>>`, separate or merge errors with `2>` and `2>&1`, throw output away with
`/dev/null`, and connect commands together with the **pipe** `|` — the idea that
makes the Linux toolset infinitely composable.
