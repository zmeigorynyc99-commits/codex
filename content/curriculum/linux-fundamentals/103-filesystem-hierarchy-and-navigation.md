---
title: "Linux Fundamentals — The Filesystem Hierarchy and Navigating It"
slug: "linux-fundamentals-filesystem-hierarchy-and-navigation"
track: "linux-fundamentals"
trackName: "Linux Fundamentals"
module: "First Steps"
order: 103
level: "Beginner"
difficulty: "Beginner"
distribution: "General Linux"
category: "Linux Fundamentals"
tags: [linux, beginner, filesystem, cd, paths, navigation, fhs]
cover: "/covers/curriculum/linux-fundamentals.svg"
estMinutes: 55
status: "published"
summary: "Linux puts everything in one big tree starting at /. Learn the standard layout (etc, home, var, usr, bin and friends), the all-important difference between absolute and relative paths, and how to move around with confidence using cd, ., .., ~ and -."
seoTitle: "Linux Fundamentals 3: The Filesystem & Navigating with cd"
seoDescription: "Beginner Linux: the Filesystem Hierarchy Standard, absolute vs relative paths, and navigating with cd, ., .., ~ and pushd — hands-on lab and graded assessment."
---

In the last lesson you learned to *list* directories. Now you'll learn to *move
between* them with total confidence — and to understand the map you're moving
across. Linux organises **everything** into a single tree that starts at one place
called the **root**, written `/`. Once that tree makes sense, the system stops
feeling like a maze.

The single most valuable idea in this lesson is the difference between an
**absolute path** and a **relative path**. Beginners who don't grasp it get "lost"
constantly; once it clicks, you never get lost again.

## Learning objectives

By the end of this lesson you will be able to:

- Describe the Linux filesystem as a single tree rooted at `/`.
- Recognise the purpose of the most important top-level directories.
- Tell an **absolute path** from a **relative path** and write both.
- Navigate with **`cd`**, using `.`, `..`, `~`, `-`, and tab-completion.
- Always know where you are with **`pwd`** and never feel lost again.

## Part 1 — One tree, rooted at `/`

Windows has multiple drives (`C:\`, `D:\`). Linux has **one unified tree**. The
very top is the **root directory**, written as a single forward slash: `/`.
Everything — programs, your files, configuration, even hardware devices and
plugged-in USB sticks — hangs somewhere under `/`.

```text
/
├── bin    → essential commands (ls, cp, cat ...)
├── boot   → the kernel and boot loader
├── dev    → devices (disks, terminals) as special files
├── etc    → system-wide configuration files (text!)
├── home   → users' personal directories (/home/alex)
├── lib    → shared libraries needed by programs
├── media  → removable media (USB, CDs) mount here
├── mnt    → temporary mount points
├── opt    → optional / third-party software
├── proc   → live kernel & process info (virtual)
├── root   → the root *user's* home (not the same as /)
├── sbin   → system admin commands
├── srv    → data served by the system (web, ftp)
├── tmp    → temporary files (cleared on reboot)
├── usr    → user programs & data (the bulk of the OS)
└── var    → variable data: logs, mail, caches, databases
```

This layout is a published standard (the **Filesystem Hierarchy Standard**, FHS),
which is why distros look broadly the same. You don't need to memorise all of it
today — but learn these five, because you'll live in them:

- **`/etc`** — configuration. Nearly everything you tune as an admin is a text file
  in `/etc` (`/etc/ssh/sshd_config`, `/etc/hosts`, …).
- **`/home`** — your stuff. Your personal directory is `/home/<you>`.
- **`/var`** — things that change, especially **`/var/log`** (logs you'll read
  constantly).
- **`/usr`** — the installed software (e.g. `/usr/bin` holds most commands).
- **`/tmp`** — scratch space anyone can write to; wiped on reboot.

> [!NOTE]
> `/root` is **not** the same as `/`. `/` is the top of the whole tree; `/root` is
> the home directory of the **root user** (the administrator). Different things
> that sound alike — keep them straight.

## Part 2 — Absolute vs relative paths

A **path** is the address of a file or directory. There are two kinds, and this is
the heart of the lesson.

An **absolute path** starts from the root `/` and spells out the full route. It is
unambiguous — it means the same thing no matter where you currently are:

```text
/home/alex/projects/report.txt
/etc/ssh/sshd_config
/var/log/syslog
```

A **relative path** starts from **where you are right now** (your *working
directory*). It does **not** begin with `/`:

```text
projects/report.txt     # the projects folder inside the current directory
report.txt              # a file in the current directory
../report.txt           # report.txt in the PARENT directory
./script.sh             # script.sh in the current directory (the ./ is explicit)
```

The rule, stated once: **if it starts with `/`, it's absolute (from the root); if
it doesn't, it's relative (from here).** A useful test — *"would this path still be
correct if I were standing in a different directory?"* If yes, it's absolute. If
it depends on where you are, it's relative.

Three navigation shortcuts you'll use in every path:

- **`.`** — the current directory.
- **`..`** — the parent directory (go up one). Stack them: `../..` goes up two.
- **`~`** — your home directory (`~` = `/home/<you>`). `~/notes` = your home's
  `notes`.

## Part 3 — `cd`: change directory

`cd` ("change directory") moves you around. It takes a path — absolute or relative:

```bash
cd /etc            # absolute: go straight to /etc from anywhere
cd /var/log        # absolute
cd projects        # relative: into 'projects' inside where you are
cd ..              # up one level
cd ../..           # up two levels
cd ~               # home directory (also just: cd  with no argument)
cd                 # same as cd ~  -> home
cd -               # jump back to the PREVIOUS directory you were in (a toggle)
```

After every move, prove where you landed:

```bash
pwd                # print working directory — your ground truth
```

> [!TIP]
> `cd -` is a hidden gem: it flips you between the last two directories, like
> alt-tab for folders. Editing a config in `/etc/nginx` and checking logs in
> `/var/log`? `cd -` bounces between them instantly.

Combine `cd` with **tab-completion** (Lesson 102): type `cd /et`, press **Tab**,
get `/etc/`. This is how professionals navigate — Tab confirms each step exists, so
you never `cd` into a typo.

## Part 4 — Building and reading paths fluently

Put the pieces together. Suppose `pwd` shows `/home/alex`:

| You type | You end up in | Why |
|----------|---------------|-----|
| `cd projects` | `/home/alex/projects` | relative, down one |
| `cd ..` | `/home/alex` | up to the parent |
| `cd ../bob` | `/home/bob` | up, then into a sibling |
| `cd /etc` | `/etc` | absolute, ignores where you were |
| `cd ~` | `/home/alex` | home shortcut |
| `cd -` | wherever you were before | previous-directory toggle |

Read an unfamiliar path the same way every time: start at the left. `/var/log/nginx`
= from root → into `var` → into `log` → into `nginx`. A path is just directions
through the tree.

## Hands-on lab

```bash
# 1. Anchor yourself
pwd                      # where am I? (probably /home/<you>)

# 2. Tour the big landmarks with ABSOLUTE paths
cd /etc && pwd && ls | head
cd /var/log && pwd && ls -ltr | tail
cd /usr/bin && pwd && ls | head

# 3. Now move with RELATIVE paths and the shortcuts
cd ~                     # home
mkdir -p practice/a/b/c  # make a nested set to walk (mkdir is next lesson)
cd practice/a/b/c && pwd # down three, relatively
cd ../..                 # up two -> practice/a
pwd
cd -                     # toggle back to .../a/b/c
pwd

# 4. Prove absolute vs relative are different things
cd /etc
ls hosts                 # relative: 'hosts' here -> works (it's /etc/hosts)
ls /etc/hosts            # absolute: same file, spelled fully
cd ~
ls hosts                 # relative from home: FAILS (no 'hosts' in your home)
ls /etc/hosts            # absolute: still works from anywhere

# 5. Clean up the practice tree
cd ~ && rm -r practice
```

Notice step 4 carefully: `ls hosts` succeeds in `/etc` and fails in `~`, but
`ls /etc/hosts` works from **both**. That *is* the absolute-vs-relative lesson in
two lines.

## Exercises

1. From your home directory, reach `/var/log` using an **absolute** path, then
   return home using the shortest command possible.
2. Create the nested directory `lab/one/two` in your home (`mkdir -p lab/one/two`),
   `cd` into `two`, and return to `lab` using **only** `..`.
3. While inside `/usr/share`, list the contents of `/etc` **without** leaving
   `/usr/share` (hint: give `ls` an absolute path).
4. Use `cd -` to bounce between `/etc` and `/var/log` three times, running `pwd`
   each time to confirm.
5. Write, on paper, whether each path is absolute or relative:
   `~/notes`, `/tmp`, `../report`, `etc/hosts`, `./run.sh`.

## Troubleshooting

- **`cd: no such file or directory`** — the path doesn't exist *from where you
  are*. *Fix:* run `pwd` to confirm your location, `ls` to see real names, and use
  **Tab** to complete. Remember a relative path is judged from your current spot.
- **"It worked yesterday from my home folder but not now"** — you used a **relative**
  path from a different directory. *Fix:* use an **absolute** path (starts with `/`)
  when you need it to work regardless of location.
- **`cd /etc/hosts` fails with "Not a directory"** — `cd` only changes into
  **directories**; `/etc/hosts` is a file. *Fix:* `cd` to the directory
  (`/etc`) and `ls` the file, or open the file with a viewer (next lesson).
- **You feel completely lost** — you never are. *Fix:* `cd ~` returns home from
  anywhere; `pwd` always tells you exactly where you stand.

Reproduce the second case: from `/etc`, run `ls hosts` (works), then `cd ~` and run
`ls hosts` again (fails) — the relative path moved with you.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Practical items must
actually run.

1. What is the root directory, and what symbol represents it?
2. Which top-level directory holds system **configuration** files?
3. Which directory holds **logs**, and what's its full path for the system log
   folder?
4. State the one-sentence rule for telling absolute from relative paths.
5. What do `.`, `..`, and `~` mean?
6. What does `cd -` do?
7. If `pwd` is `/home/alex` and you run `cd ../bob`, where are you?
8. Give an absolute and a relative path that could both refer to the same file.
9. **Practical:** go to `/var/log`, then home, then back to `/var/log` using one
   command. Which command returned you?
10. **Practical:** from your home directory, list `/etc` without `cd`-ing there.

## Solutions & validation

1. The **root directory**, the top of the whole tree, represented by `/`.
2. **`/etc`**.
3. **`/var`** holds variable data; the system log folder is **`/var/log`**.
4. **If a path starts with `/` it's absolute (measured from the root); otherwise
   it's relative (measured from your current directory).**
5. `.` = current directory, `..` = parent directory, `~` = your home directory.
6. It switches you back to the **previous** directory you were in (a toggle).
7. `/home/bob` (up to `/home`, then into `bob`).
8. Example: standing in `/etc`, `hosts` (relative) and `/etc/hosts` (absolute)
   refer to the same file.
9. **Validation:** `cd -` (after going `/var/log` → `cd ~`, `cd -` returns you to
   `/var/log`; `pwd` confirms).
10. **Validation:** `ls /etc` — an absolute argument lists `/etc` no matter where
    you are.

> [!TIP]
> Make `pwd` a habit: glance at it whenever a path-based command surprises you.
> Nine times out of ten the "bug" is simply that you were standing somewhere you
> didn't expect.

## What's next

Next: **Lesson 104 — Looking at Files.** You can now find your way to any file in
the tree — so let's read what's inside them. You'll meet `cat`, `less`, `head`,
`tail`, `wc` and `file`: the tools to view, page through, peek at, and measure
files, which you'll use every day when reading configs and logs.
