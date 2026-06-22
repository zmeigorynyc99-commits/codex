---
title: "Linux Fundamentals — Creating and Managing Files & Directories"
slug: "linux-fundamentals-managing-files-and-directories"
track: "linux-fundamentals"
trackName: "Linux Fundamentals"
module: "First Steps"
order: 105
level: "Beginner"
difficulty: "Beginner"
distribution: "General Linux"
category: "Linux Fundamentals"
tags: [linux, beginner, mkdir, touch, cp, mv, rm, files]
cover: "/covers/curriculum/linux-fundamentals.svg"
estMinutes: 55
status: "published"
summary: "Start changing the system safely: create directories with mkdir -p, make files with touch, copy with cp -r, move and rename with mv, and delete with rm — plus the professional safety habits that stop rm from ruining your day."
seoTitle: "Linux Fundamentals 5: mkdir, touch, cp, mv & rm Safely"
seoDescription: "Beginner Linux: create, copy, move, rename and delete files and directories with mkdir, touch, cp, mv and rm — with the safety habits pros use. Lab + assessment."
---

So far you've explored a Linux system without changing it. Now you start *creating*
— making directories, files, copies, and learning to move, rename and delete
things. These five commands (`mkdir`, `touch`, `cp`, `mv`, `rm`) are the bread and
butter of every day at a terminal.

One of them, `rm`, is also the command most capable of ruining your day. So we'll
treat deletion with the respect it deserves and build the habits that keep
professionals out of trouble. There is **no recycle bin** on the Linux command
line — when something is removed, it's gone. Read the `rm` parts carefully.

## Learning objectives

By the end of this lesson you will be able to:

- Create directories — including nested ones — with **`mkdir`** and `-p`.
- Create empty files (and update timestamps) with **`touch`**.
- Copy files and directories with **`cp`** (and `-r`).
- Move and **rename** with **`mv`** (they're the same command).
- Delete with **`rm`** / **`rmdir`**, and apply the safety habits that prevent
  disasters.

## Part 1 — `mkdir`: make directories

```bash
mkdir projects              # make one directory here
mkdir reports archive       # make several at once
mkdir -p site/css/themes    # -p makes the WHOLE chain, creating parents as needed
```

Without `-p`, `mkdir site/css/themes` fails if `site` or `site/css` doesn't already
exist ("No such file or directory"). With **`-p`**, it creates every missing level
and — bonus — doesn't complain if the directory already exists. `-p` is the option
you'll almost always want.

```bash
mkdir -p ~/devops-lab/{day1,day2,day3}   # brace expansion: three dirs in one go
ls ~/devops-lab
```

## Part 2 — `touch`: make empty files (and update times)

```bash
touch notes.txt             # create an empty file (if it doesn't exist)
touch a.txt b.txt c.txt     # several at once
```

If the file **already exists**, `touch` doesn't erase it — it just updates its
"last modified" timestamp to now. That's occasionally useful, but day to day you'll
use `touch` to **create empty placeholder files** quickly.

## Part 3 — `cp`: copy

`cp SOURCE DESTINATION` copies a file:

```bash
cp notes.txt notes.bak          # copy to a new name (a backup in the same folder)
cp notes.txt ~/backups/         # copy into another directory, same name
cp a.txt b.txt ~/backups/       # copy several files into a directory
```

To copy a **directory**, you must add **`-r`** (recursive — include everything
inside):

```bash
cp -r site/ site-backup/        # copy the whole directory tree
```

Two safety options worth knowing immediately:

```bash
cp -i notes.txt notes.bak       # -i: ask before overwriting an existing file
cp -v a.txt ~/backups/          # -v: verbose — show what it's doing
```

> [!IMPORTANT]
> By default `cp` **silently overwrites** the destination if it already exists —
> no warning. When copying onto something that might exist, use **`-i`**
> (interactive) so it asks first. Quietly clobbering a file you meant to keep is a
> classic, avoidable mistake.

## Part 4 — `mv`: move and rename

Here's a thing that surprises beginners: **moving and renaming are the same
operation**. `mv` does both.

```bash
mv old.txt new.txt              # RENAME (same directory, new name)
mv notes.txt ~/documents/       # MOVE (into another directory, same name)
mv report.txt ~/archive/2024.txt  # move AND rename in one step
mv site/ website/               # rename a directory (no -r needed for mv)
```

Unlike `cp`, `mv` needs **no `-r`** for directories — moving a directory just
relabels where it lives. The same overwrite caution applies:

```bash
mv -i a.txt b.txt               # ask before overwriting b.txt
```

> [!TIP]
> "Rename" doesn't exist as its own command on Linux — it's just `mv` with the
> source and destination in the same directory. Once that clicks, `mv` is simple:
> *take this thing, and make its new full path be that.*

## Part 5 — `rm` and `rmdir`: delete (carefully)

```bash
rm file.txt                 # delete a file — permanently, no recycle bin
rm a.txt b.txt              # delete several
rmdir emptydir              # delete an EMPTY directory only
rm -r olddir/               # delete a directory AND everything inside it
```

There is **no undo**. `rm` doesn't move things to a trash can; it removes them. So
adopt these habits now, while the stakes are low:

```bash
rm -i important.txt         # -i: confirm each deletion (great while learning)
ls olddir/                  # LOOK before you delete a directory
rm -r olddir/               # ...then delete, knowing what was in it
```

> [!IMPORTANT]
> Never run `rm -rf` casually, and treat the combination of `rm -r` with a path
> that starts at `/` or uses `*` as a loaded weapon. The infamous disaster is
> `rm -rf /` (or `rm -rf $VAR/` where `$VAR` is empty). **Safety habits:** prefer
> `rm -i` while learning; always `ls` a directory before `rm -r`; never put a
> wildcard (`*`) next to `rm` without first running the same pattern through `ls`
> to see exactly what it matches. The renderer flags dangerous commands for a
> reason — respect the warning.

To preview what a wildcard will hit, test it with `ls` first — *every time*:

```bash
ls *.tmp                    # SHOW what *.tmp matches
rm *.tmp                    # only now, having seen the list, delete them
```

## Hands-on lab

Do this entirely inside a throwaway practice directory so nothing important is ever
at risk:

```bash
# 0. Work in a safe sandbox
mkdir -p ~/file-lab && cd ~/file-lab

# 1. Create structure and files
mkdir -p project/{src,docs}
touch project/src/main.sh project/docs/readme.txt
ls -R project

# 2. Copy: a file and a whole directory
cp project/docs/readme.txt project/docs/readme.bak
cp -r project project-backup
ls project/docs
ls project-backup

# 3. Rename and move
mv project/src/main.sh project/src/app.sh        # rename
mv project/docs/readme.bak project/              # move up one level
ls -R project

# 4. Safe deletion: look, then remove
ls project-backup            # LOOK first
rm -r project-backup         # then delete the copy
rm project/readme.bak

# 5. Wildcard safety drill: show, then remove
touch t1.tmp t2.tmp keep.txt
ls *.tmp                     # confirm exactly what matches (t1.tmp t2.tmp)
rm *.tmp                     # delete only those; keep.txt survives
ls

# 6. Tidy up the whole sandbox
cd ~ && rm -r ~/file-lab
```

## Exercises

1. In a fresh `~/ex-lab`, create this tree in **one** `mkdir` command:
   `site/`, `site/css/`, `site/js/`, `site/img/`.
2. Create three empty files inside `site/`: `index.html`, `about.html`,
   `style.css`. Then **move** `style.css` into `site/css/`.
3. Make a backup copy of the entire `site/` directory called `site-backup/`.
4. Rename `about.html` to `contact.html` without leaving `~/ex-lab`.
5. Practise safe deletion: create `a.log b.log notes.txt`, use `ls *.log` to
   preview, then delete only the `.log` files, leaving `notes.txt`. Finally remove
   the whole `~/ex-lab` sandbox.

## Troubleshooting

- **`mkdir: cannot create directory 'a/b/c': No such file or directory`** — the
  parent directories don't exist. *Fix:* add **`-p`** to create the whole chain.
- **`cp: -r not specified; omitting directory 'site'`** — you tried to copy a
  directory without `-r`. *Fix:* `cp -r site site-backup`.
- **`rmdir: failed to remove 'dir': Directory not empty`** — `rmdir` only removes
  **empty** directories. *Fix:* either empty it first, or use `rm -r dir` after
  `ls`-ing it to confirm the contents.
- **You overwrote a file by accident with `cp`/`mv`** — there's no undo, and this
  is exactly why we use **`-i`**. *Fix going forward:* alias or habitually use
  `cp -i` / `mv -i`, and keep backups (a whole later lesson).
- **A wildcard deleted more than you meant** — `*` matched files you forgot about.
  *Fix going forward:* **always** run the pattern through `ls` before `rm`.

Reproduce the `rmdir` case: `mkdir full && touch full/x`, then `rmdir full`
(fails), then `ls full` (see why), then `rm -r full` (succeeds).

## Assessment

**Passing requirement: at least 8 of 10 correct (80%), AND your sandbox practice
must run cleanly.** Deletion safety is graded — getting the *habits* right matters
as much as the answers.

1. What does `mkdir -p a/b/c` do that plain `mkdir a/b/c` doesn't?
2. What two things can `touch` do?
3. Why does copying a **directory** need `-r` but moving one doesn't?
4. Which single command both **renames** and **moves**?
5. What does `cp`/`mv` do by default if the destination already exists, and which
   option makes it ask first?
6. Which command deletes an **empty** directory, and which deletes a directory with
   contents?
7. Is there an undo/recycle bin for `rm` on the command line?
8. Name two safety habits for using `rm`.
9. **Practical:** create `~/t/one/two` in one command, then delete the whole `~/t`
   tree. Which two commands did you use?
10. **Practical:** given `a.tmp b.tmp keep.txt`, delete only the `.tmp` files. What
    did you run *before* the `rm` to stay safe?

## Solutions & validation

1. `-p` creates **all missing parent directories** in the chain (and doesn't error
   if the target already exists); plain `mkdir` fails unless every parent already
   exists.
2. Create an **empty file**, or, if the file exists, **update its modification
   timestamp**.
3. A directory contains other files/dirs, so copying must **recurse** into it
   (`-r`); moving just **relinks** where the directory lives, so nothing needs to
   be copied recursively.
4. **`mv`**.
5. It **silently overwrites** the destination; **`-i`** (interactive) makes it
   prompt first.
6. **`rmdir`** removes an empty directory; **`rm -r`** removes a directory and
   everything in it.
7. **No.** Removal is permanent on the command line.
8. Any two of: use **`rm -i`** while learning; **`ls` a directory before `rm -r`**;
   **preview wildcards with `ls` before `rm`**; keep backups; never run `rm -rf`
   casually or against `/`.
9. **Validation:** `mkdir -p ~/t/one/two` then `rm -r ~/t`. After the second
   command, `ls ~/t` reports "No such file or directory" — success.
10. **Validation:** `ls *.tmp` (to preview the matches), **then** `rm *.tmp`. `ls`
    afterwards still shows `keep.txt`.

> [!TIP]
> You've now completed the core "operate a Linux system" loop: navigate, read,
> and modify files safely. This is genuinely the foundation senior engineers use
> all day — everything else builds on it.

## What's next

That completes **Module 1: First Steps** of the Linux Fundamentals track. Next up
the track continues into **Module 2: Working with Text & Help** — getting help
properly (`man`, `--help`, `apropos`), then the text-processing power tools
(`grep`, pipes, redirection) that turn the terminal into a data workshop. You're
no longer a beginner staring at a black screen — you can drive this system.
