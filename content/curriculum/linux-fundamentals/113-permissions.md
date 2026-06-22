---
title: "Linux Fundamentals — Permissions: rwx, chmod, chown & umask"
slug: "linux-fundamentals-permissions"
track: "linux-fundamentals"
trackName: "Linux Fundamentals"
module: "Users, Permissions & Processes"
order: 113
level: "Intermediate"
difficulty: "Intermediate"
distribution: "General Linux"
category: "Linux Fundamentals"
tags: [linux, permissions, chmod, chown, umask, rwx, security, intermediate]
cover: "/covers/curriculum/linux-fundamentals.svg"
estMinutes: 65
status: "published"
summary: "The Linux permission model, demystified for good. Read rwx for user/group/other, set permissions with chmod in both symbolic and octal form, change ownership with chown and chgrp, understand how directory permissions differ, and control defaults with umask."
seoTitle: "Linux Fundamentals 13: Permissions, chmod (Octal & Symbolic), chown"
seoDescription: "Intermediate Linux: master rwx permissions for user/group/other, chmod symbolic and octal (755/644), chown/chgrp, directory permissions, and umask. Lab + assessment."
---

This is one of the most important lessons in the entire track. Linux protects every
file with a compact **permission** model — who can read it, change it, or run it.
Once it clicks, the cryptic `-rwxr-xr--` from `ls -l` reads like plain English, and
you can confidently lock down or open up anything. Permission mistakes are also a
top cause of both **outages** ("permission denied") and **security holes**
("world-writable secrets"), so this knowledge pays off daily.

## Learning objectives

By the end of this lesson you will be able to:

- Read the **`rwx`** permissions for **user / group / other** from `ls -l`.
- Translate between **symbolic** and **octal** (e.g. `rwxr-xr-x` ↔ `755`).
- Set permissions with **`chmod`** both ways.
- Change ownership with **`chown`** and **`chgrp`**.
- Explain how **`rwx` differs on directories**.
- Predict and set default permissions with **`umask`**.

## Part 1 — Reading permissions

Recall `ls -l` from Lesson 102. The first column is the permission string:

```text
-rwxr-xr--  1  alice  devs  ...  deploy.sh
```

Break the ten characters into one + three groups of three:

```text
  -    rwx     r-x     r--
 type  user    group   other
```

- **Character 1** — the **type**: `-` file, `d` directory, `l` symlink.
- **Characters 2–4** — what the **owning user** can do.
- **Characters 5–7** — what the **owning group** can do.
- **Characters 8–10** — what **everyone else** ("other") can do.

Each trio is **r**(read), **w**(write), **x**(execute), in that fixed order; a `-`
means that permission is absent. So `rwxr-xr--` means: owner can read/write/execute,
group can read/execute, others can only read.

| Symbol | On a file | On a directory |
|--------|-----------|----------------|
| **r** | read the contents | list the names inside (`ls`) |
| **w** | modify the contents | create/delete/rename entries inside |
| **x** | run it as a program | **enter** it (`cd`) and access items by name |

## Part 2 — Octal: the three-digit shorthand

Each permission has a value: **r = 4, w = 2, x = 1**. Add them per trio to get one
digit (0–7):

| rwx | Sum | Octal | Meaning |
|-----|-----|-------|---------|
| `rwx` | 4+2+1 | **7** | read, write, execute |
| `rw-` | 4+2 | **6** | read, write |
| `r-x` | 4+1 | **5** | read, execute |
| `r--` | 4 | **4** | read only |
| `---` | 0 | **0** | nothing |

So three trios become three digits. The two you'll use constantly:

- **`755`** = `rwxr-xr-x` — owner full, everyone else read+execute. **Programs,
  scripts, and directories.**
- **`644`** = `rw-r--r--` — owner read+write, everyone else read-only. **Normal
  data files.**
- **`600`** = `rw-------` — owner only. **Secrets** (SSH private keys, password
  files).
- **`700`** = `rwx------` — owner only, including execute/enter. **Private
  directories** like `~/.ssh`.

> [!TIP]
> You only need to memorise a handful: **644** (files), **755** (scripts &
> directories), **600**/**700** (private). Almost everything else is a variation.
> When unsure, ask "should *other* people read this?" — if not, the last digit is
> 0.

## Part 3 — `chmod`: set permissions

`chmod` ("change mode") sets permissions, in **octal** or **symbolic** form.

**Octal** — set all three trios at once:

```bash
chmod 755 deploy.sh        # rwxr-xr-x
chmod 644 notes.txt        # rw-r--r--
chmod 600 ~/.ssh/id_ed25519  # rw------- (private key — must be this!)
chmod 700 ~/.ssh           # rwx------ (the .ssh directory)
chmod -R 755 /var/www      # -R = recursive, apply to a whole tree
```

**Symbolic** — adjust specific bits without recomputing the whole number. Targets:
`u` (user), `g` (group), `o` (other), `a` (all); operators: `+` add, `-` remove,
`=` set exactly:

```bash
chmod +x script.sh         # add execute for everyone (make a script runnable)
chmod u+x script.sh        # add execute for the owner only
chmod g-w file             # remove write from the group
chmod o-rwx secret.txt     # remove ALL access for others
chmod u=rw,go=r file       # owner rw; group and other r (= sets exactly)
chmod a+r public.html      # everyone can read
```

> [!IMPORTANT]
> A script you wrote won't run with `./script.sh` until it has the **execute** bit:
> `chmod +x script.sh`. "Permission denied" when running your own script almost
> always means the missing `x`. Conversely, **SSH refuses keys that are too open** —
> a private key must be `600` and `~/.ssh` must be `700`, or `ssh` ignores them
> (you saw this in the networking lessons; now you know exactly why).

## Part 4 — `chown` and `chgrp`: change ownership

Permissions say what the owner/group/other can do; **ownership** says *who* the
owner and group are. Changing ownership needs **root** (`sudo`):

```bash
sudo chown alice file.txt          # change the owning USER to alice
sudo chown alice:devs file.txt     # change user to alice AND group to devs
sudo chgrp devs file.txt           # change only the GROUP
sudo chown -R www-data:www-data /var/www   # recursive: whole web tree to the web user
```

The pattern `chown user:group` is the everyday form. Recursive `-R` is how you fix
ownership of an entire directory tree after copying files around as the wrong user.

## Part 5 — `umask`: the default permissions

When you create a file, where do its starting permissions come from? A base
(`666` for files, `777` for directories) **minus** the **`umask`**. The umask is a
mask of bits to *remove*:

```bash
umask                      # show current mask, e.g. 0022
umask -S                   # show it symbolically, e.g. u=rwx,g=rx,o=rx
```

With the common umask `022`: new **files** become `666 - 022 = 644` (`rw-r--r--`),
new **directories** become `777 - 022 = 755` (`rwxr-xr-x`). That's why fresh files
are readable by all but writable only by you.

```bash
umask 077                  # stricter: new files 600, dirs 700 (private by default)
# put it in ~/.bashrc to make it permanent for your session
```

> [!NOTE]
> New files never get the **execute** bit from the base `666`, which is why you must
> explicitly `chmod +x` scripts — Linux won't make data executable by accident, a
> sensible safety default. A `077` umask is a good choice on shared servers where
> you want everything private unless you deliberately open it.

## Hands-on lab

```bash
mkdir -p ~/perm-lab && cd ~/perm-lab

# 1. Watch defaults appear, and read them
umask
touch datafile; mkdir adir
ls -ld datafile adir            # note 644 for the file, 755 for the dir

# 2. Make a script and run it (it FAILS until +x)
printf '#!/usr/bin/env bash\necho "it runs!"\n' > script.sh
./script.sh                     # Permission denied
chmod +x script.sh
./script.sh                     # now it works
ls -l script.sh                 # see the x bits

# 3. Octal vs symbolic — reach the same result two ways
chmod 600 datafile; ls -l datafile     # rw-------
chmod u=rw,go= datafile; ls -l datafile # identical

# 4. Lock down a private dir (the .ssh pattern)
mkdir secret; chmod 700 secret; ls -ld secret

# 5. Ownership (needs sudo + an existing user; safe to read even if it errors)
sudo chown root:root datafile 2>/dev/null && ls -l datafile
sudo chown "$USER":"$(id -gn)" datafile  # give it back to yourself

# 6. Try a stricter umask in this shell
umask 077; touch private.txt; ls -l private.txt   # now 600 by default

# 7. Clean up
cd ~ && rm -r ~/perm-lab
```

## Exercises

1. Translate by hand: what octal is `rw-r-----`? What symbolic string is `750`?
2. Create a file and set it to `640` two ways — once with octal, once with symbolic
   `chmod`.
3. Make a shell script executable for the owner and group but not others. Show the
   resulting `ls -l`.
4. Create a directory that only you can enter and list (no group/other access).
   Which octal did you use?
5. With `umask 027` set, create a new file and directory and predict their
   permissions before checking with `ls -l`. Did you predict correctly?

## Troubleshooting

- **"Permission denied" running your own script** — missing execute bit. *Fix:*
  `chmod +x script.sh`, then `./script.sh`.
- **SSH still asks for a password / ignores your key** — key or `~/.ssh` too open.
  *Fix:* `chmod 700 ~/.ssh && chmod 600 ~/.ssh/id_ed25519`.
- **Web server returns 403 Forbidden** — the web user can't read the files or
  **enter** a parent directory (needs `x` on every directory in the path). *Fix:*
  ensure dirs are `755` and files `644`, owned appropriately (`chown -R
  www-data:www-data`).
- **`chmod` "didn't change" a file you don't own** — only the **owner or root** can
  change a file's mode. *Fix:* use `sudo`, or have the owner do it.
- **A file is unexpectedly world-writable (`-rw-rw-rw-`)** — a too-loose umask or a
  bad `chmod 666/777`. *Fix:* `chmod 644` (or `640`), and never `chmod 777` to "make
  it work" — that's a security hole, not a fix.

Reproduce the directory-`x` rule: `chmod 644 somedir` (read but not enter), then try
`cd somedir` (fails) and `ls somedir` (can list names but not stat them); restore
with `chmod 755 somedir`.

## Assessment

**Passing requirement: at least 9 of 11 correct (≈82%).** This lesson is
foundational, so the bar is a little higher. Run the practical items.

1. In `-rwxr-x---`, what can the owner, group, and others each do?
2. What are the numeric values of r, w, and x?
3. Convert `rwxr-xr-x` to octal, and `640` to symbolic.
4. What do `755` and `644` mean, and what is each typically used for?
5. What does `x` allow on a **directory** (as opposed to a file)?
6. Give the symbolic `chmod` to add execute for the owner only.
7. What's the difference between `chmod` and `chown`?
8. With umask `022`, what permissions does a new file get? A new directory?
9. Why must SSH private keys be `600`?
10. **Practical:** make a script runnable and execute it. Which two commands?
11. **Practical:** set a file to `600` and verify with `ls -l`. What does the string
    show?

## Solutions & validation

1. Owner: read/write/execute; group: read/execute; others: **nothing**.
2. **r = 4, w = 2, x = 1.**
3. `rwxr-xr-x` = **755**; `640` = **`rw-r-----`**.
4. **755** = `rwxr-xr-x` (owner full, others read+execute) — scripts/programs and
   directories; **644** = `rw-r--r--` (owner read/write, others read) — normal data
   files.
5. `x` lets you **enter** the directory (`cd`) and access items inside by name;
   without it you can't traverse it even if you can read its listing.
6. `chmod u+x file`.
7. `chmod` changes **permissions** (what may be done); `chown` changes **ownership**
   (who the owner/group are).
8. New file → **644** (`666-022`); new directory → **755** (`777-022`).
9. SSH treats an over-readable private key as compromised and **ignores it**; `600`
   (owner-only) is required for the key to be used.
10. **Validation:** `chmod +x script.sh` then `./script.sh` prints its output.
11. **Validation:** `chmod 600 file` → `ls -l` shows `-rw-------`.

> [!TIP]
> Permissions tie identity (Lesson 112) to action. Almost every "it won't work" or
> "that's exposed" problem on a server traces back to these bits. Knowing them cold
> is a senior-level habit you now have.

## What's next

Next: **Lesson 114 — sudo & Privilege.** You've seen `sudo` throughout; now you'll
understand it properly — how it grants temporary root, the difference between `sudo`
and `su`, where its rules live (`/etc/sudoers` and `visudo`), and the
least-privilege habits that keep a system both usable and safe.
