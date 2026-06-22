---
title: "Linux Fundamentals — Finding Files with find, locate & xargs"
slug: "linux-fundamentals-finding-files"
track: "linux-fundamentals"
trackName: "Linux Fundamentals"
module: "Text & Help"
order: 111
level: "Intermediate"
difficulty: "Intermediate"
distribution: "General Linux"
category: "Linux Fundamentals"
tags: [linux, find, locate, xargs, search, intermediate]
cover: "/covers/curriculum/linux-fundamentals.svg"
estMinutes: 55
status: "published"
summary: "Locate any file on the system by name, type, size, age or owner with find, get instant name lookups with locate, and act on the results in bulk — safely — with xargs and find -exec. The last lesson of the Text & Help module."
seoTitle: "Linux Fundamentals 11: find, locate & xargs for File Search"
seoDescription: "Intermediate Linux: find files by name/type/size/time/owner, instant lookups with locate, and bulk actions with xargs and find -exec (safely). Lab + assessment."
---

You can find text *inside* files (grep) and reshape it (sed/awk). This lesson finds
the **files themselves** — anywhere in the tree, by any attribute. `find` is the
deep, powerful search; `locate` is the instant name lookup; and `xargs` /
`find -exec` let you *act* on what you find, in bulk. Together they handle "where is
that file?" and "do X to every file like this" — daily admin questions. This
completes **Module 2**.

## Learning objectives

By the end of this lesson you will be able to:

- Search by **name**, **type**, **size**, **time** and **owner** with `find`.
- Use **`locate`** for instant filename lookups (and know its caveat).
- Run actions on results with **`find -exec`** and **`xargs`**.
- Do bulk operations **safely** (preview first, handle spaces with `-print0`).

## Part 1 — `find`: the basics

`find` searches a directory tree. The form is `find WHERE CRITERIA [ACTION]`:

```bash
find . -name "*.txt"             # *.txt under the current directory (recursively)
find /etc -name "*.conf"         # all .conf files under /etc
find . -iname "readme*"          # -iname = case-insensitive name match
find /var/log -name "*.log"      # logs under /var/log
```

`.` means "here"; give any path to search elsewhere. `-name` matches the filename
(quote the pattern so the shell doesn't expand `*` itself). With no action, `find`
just **prints** what it found.

## Part 2 — Search by type, size, time, owner

This is where `find` outclasses everything else — it filters on file *metadata*:

```bash
# By type
find . -type f                   # files only
find . -type d                   # directories only
find . -type l                   # symbolic links only

# By size
find . -type f -size +100M       # larger than 100 MB
find . -type f -size -10k        # smaller than 10 KB
find /var -size +1G              # big space hogs under /var

# By modification time
find . -mtime -7                 # modified in the last 7 days
find . -mtime +30                # NOT modified in over 30 days (stale files)
find /tmp -type f -mmin -60      # changed in the last 60 minutes

# By owner / permissions
find /home -user alice           # files owned by alice
find . -type f -perm 0777        # world-writable files (a security check)
```

Combine criteria — they AND together by default:

```bash
find /var/log -type f -name "*.log" -size +10M -mtime +7
# files, ending .log, over 10MB, untouched for a week — classic cleanup target
```

> [!TIP]
> The size and time filters make `find` a real operations tool: "what's filling my
> disk?" → `find / -type f -size +500M 2>/dev/null`; "what changed recently?" →
> `find /etc -mtime -1`. The `2>/dev/null` hides permission-denied noise from
> directories you can't read.

## Part 3 — `locate`: instant lookups

`find` walks the disk live, which is thorough but can be slow on huge trees.
`locate` instead consults a **pre-built database** of filenames — nearly instant:

```bash
locate sshd_config               # every path containing this name
locate -i readme                 # case-insensitive
locate "*.service" | head        # systemd unit files
```

```bash
sudo apt install -y mlocate      # if 'locate' is missing (Debian/Ubuntu)
sudo updatedb                    # refresh the database manually
```

> [!IMPORTANT]
> `locate` reads a database that updates (typically) once a day via cron, so it
> **won't know about files created since the last `updatedb`** — and may list files
> that were deleted. Use `locate` for things that have existed a while (system
> files); use `find` when you need **live, accurate** results or metadata filters.

## Part 4 — Acting on results: `-exec` and `xargs`

Finding is half the job; often you want to *do* something to each result.

**`find -exec`** runs a command per match. `{}` is the filename; the command ends
with `\;`:

```bash
find . -name "*.tmp" -exec rm {} \;          # delete each .tmp (see safety note!)
find . -name "*.sh" -exec chmod +x {} \;     # make all scripts executable
find /var/log -name "*.log" -exec ls -lh {} \;
find . -name "*.conf" -exec grep -l "Listen" {} \;   # which confs mention Listen
```

**`xargs`** takes a list on stdin and builds command lines from it — often faster
because it batches many arguments into one invocation:

```bash
find . -name "*.log" | xargs ls -lh          # ls all the logs at once
find . -name "*.tmp" | xargs rm              # delete them (safety note below!)
grep -rl "TODO" . | xargs wc -l              # count lines in every file with a TODO
```

> [!IMPORTANT]
> **Filenames with spaces break naive `xargs`** (and can cause it to act on the
> wrong files). The safe idiom pairs `find -print0` with `xargs -0`, which separate
> entries by a null byte instead of whitespace:
>
> ```bash
> find . -name "*.tmp" -print0 | xargs -0 rm
> ```
>
> And **always preview destructive bulk actions first**: replace the action with
> `ls` or `echo` (`find ... -exec echo rm {} \;`) to see exactly what *would*
> happen before you let it delete anything.

## Part 5 — Putting it together safely

The professional pattern for any bulk change is **find → review → act**:

```bash
# 1. FIND and REVIEW (no changes yet)
find . -type f -name "*.bak"                 # look at the list

# 2. Count it, sanity-check the number
find . -type f -name "*.bak" | wc -l

# 3. Only now ACT — with the null-safe idiom
find . -type f -name "*.bak" -print0 | xargs -0 rm
```

That three-step habit — especially the "review before act" — is what keeps a
powerful tool from becoming a disaster. You'll apply the same discipline to every
bulk operation for the rest of your career.

## Hands-on lab

```bash
mkdir -p ~/find-lab/{a,b,c} && cd ~/find-lab
touch a/one.txt b/two.log c/three.txt b/big.log
dd if=/dev/zero of=b/big.log bs=1M count=5 2>/dev/null   # make a 5MB file

# 1. By name and type
find . -name "*.txt"
find . -type d                 # the directories you created
find . -type f -name "*.log"

# 2. By size and time
find . -type f -size +1M       # finds b/big.log
find . -type f -mmin -10       # everything you just made

# 3. -exec: show details of each log
find . -name "*.log" -exec ls -lh {} \;

# 4. xargs with the SAFE null idiom — preview, then act
find . -name "*.txt" -print0 | xargs -0 ls -l     # preview with ls
# (imagine rm here — we only ls, to stay safe in the lab)

# 5. locate (may need updatedb first)
sudo updatedb 2>/dev/null; locate find-lab | head

# 6. Clean up
cd ~ && rm -r ~/find-lab
```

## Exercises

1. Find every `.conf` file under `/etc` (case-insensitive) and count how many there
   are.
2. Find all files under your home directory modified in the last 24 hours.
3. Find files larger than 10 MB under `/var` (hide permission errors with
   `2>/dev/null`).
4. Use `find -exec` to run `grep -l "PermitRoot" {}` on every file in
   `/etc/ssh/` — which file matches?
5. Create a few `.tmp` files, **preview** what a bulk delete would hit using
   `find ... -print0 | xargs -0 echo rm`, then actually delete them with the
   null-safe idiom.

## Troubleshooting

- **`find` prints lots of "Permission denied"** — you're crossing directories you
  can't read. *Fix:* append `2>/dev/null` to hide those errors, or run with `sudo`.
- **`locate` can't find a file you just made** — its database is stale. *Fix:*
  `sudo updatedb`, or use `find` for live results.
- **`find -name "*.txt"` matches nothing but you know they exist** — the shell
  expanded `*.txt` before `find` saw it. *Fix:* **quote** the pattern: `-name
  "*.txt"`.
- **`xargs` did the wrong thing on files with spaces** — whitespace splitting. *Fix:*
  `find -print0 | xargs -0 ...`.
- **A bulk delete removed too much** — you didn't preview. *Fix going forward:*
  always run the `find`/`echo` preview first and check the count.

Reproduce the quoting bug in an empty dir: `find . -name *.txt` (unquoted) errors or
misbehaves if a `.txt` exists in the current dir; `find . -name "*.txt"` works.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Run the practical items.

1. What is the general form of a `find` command?
2. How do you find only directories? Only regular files?
3. Write a `find` that matches files over 100 MB.
4. How do you find files modified in the last 3 days?
5. What's the key difference between `find` and `locate`?
6. What do `{}` and `\;` mean in `find -exec`?
7. Why use `find -print0 | xargs -0`, and when does it matter?
8. What's the safe habit before running a bulk delete?
9. **Practical:** count the `.conf` files under `/etc`. Command and rough number?
10. **Practical:** find files in your home dir changed in the last day. Command?

## Solutions & validation

1. `find WHERE CRITERIA [ACTION]` (e.g. `find /etc -name "*.conf"`).
2. Directories: `find . -type d`; regular files: `find . -type f`.
3. `find . -type f -size +100M`.
4. `find . -mtime -3`.
5. `find` searches the disk **live** (accurate, supports metadata filters but
   slower); `locate` reads a **pre-built name database** (instant but possibly
   stale, name-only).
6. `{}` is replaced by each matched **filename**; `\;` **terminates** the `-exec`
   command.
7. They separate entries by a **null byte**, so filenames containing **spaces or
   newlines** are handled correctly; it matters whenever names aren't "simple."
8. **Preview** it first — swap the action for `ls`/`echo` and check the list and
   count before deleting.
9. **Validation:** `find /etc -iname "*.conf" 2>/dev/null | wc -l` prints a positive
   integer.
10. **Validation:** `find ~ -type f -mtime -1` lists recently changed files (or
    prints nothing if none — still correct).

> [!TIP]
> `grep` (text in files), the `sort | uniq -c` pattern (tallying), and `find`
> (files by attribute) are three of the most reused skills in all of operations.
> You now have all three — that's a genuinely capable text-and-search toolkit.

## What's next

That completes **Module 2: Text & Help**. You can now teach yourself any command,
wire tools together with pipes and redirection, and search and reshape both text
and files. Next, **Module 3: Users, Permissions & Processes** takes you from
"operating files" to "administering a system" — accounts, the permission model,
`sudo`, processes and services, and package management — the core of real Linux
administration.
