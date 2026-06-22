---
title: "Linux Fundamentals — Users, Groups & Identity"
slug: "linux-fundamentals-users-and-groups"
track: "linux-fundamentals"
trackName: "Linux Fundamentals"
module: "Users, Permissions & Processes"
order: 112
level: "Intermediate"
difficulty: "Intermediate"
distribution: "Ubuntu"
category: "Linux Fundamentals"
tags: [linux, users, groups, passwd, useradd, identity, intermediate]
cover: "/covers/curriculum/linux-fundamentals.svg"
estMinutes: 55
status: "published"
summary: "Who is who on a Linux system. Understand users, groups, UIDs and GIDs, read /etc/passwd and /etc/group, see your own identity with id, and create, modify and remove accounts with useradd, usermod, passwd and the safer adduser — the foundation of the permission model."
seoTitle: "Linux Fundamentals 12: Users, Groups, UIDs & /etc/passwd"
seoDescription: "Intermediate Linux: users vs groups, UID/GID, reading /etc/passwd & /etc/group, the id command, and managing accounts with useradd/usermod/passwd. Lab + assessment."
---

Linux is a **multi-user** system to its core: every file is owned by someone, every
process runs as someone, and the whole security model rests on *who you are*. Before
you can understand permissions (next lesson), you need to understand **identity** —
users, groups, and the numbers behind them. This lesson is the foundation the entire
permission and security model is built on.

## Learning objectives

By the end of this lesson you will be able to:

- Explain **users** and **groups**, and **UID**/**GID** numbers.
- Read **`/etc/passwd`** and **`/etc/group`** field by field.
- Inspect your own identity with **`id`**, **`whoami`**, **`groups`**.
- Distinguish **root**, **system** accounts, and **regular** users.
- Create, modify and delete accounts with **`useradd`/`adduser`**, **`usermod`**,
  **`passwd`**, **`userdel`**.

## Part 1 — Users and groups, conceptually

A **user** is an identity that can own files and run processes. A **group** is a
named collection of users, used to share access — instead of granting permission to
ten people one by one, you grant it to a group and add the people to it.

Behind the friendly names, Linux uses **numbers**:

- Every user has a **UID** (User ID). `root` is always **UID 0**.
- Every group has a **GID** (Group ID).

Names are for humans; the kernel works in numbers. Three tiers of accounts exist:

- **root (UID 0)** — the superuser; can do anything. Untouchable by permissions.
- **System/service accounts (low UIDs, e.g. 1–999)** — own services and files (like
  `www-data` for the web server). They usually can't log in.
- **Regular users (UID ≥ 1000 on Debian/Ubuntu)** — real people; the ones you
  create.

```bash
id                 # your full identity: uid, gid, and all your groups
whoami             # just your username
groups             # the groups you belong to
id alice           # someone else's identity (if they exist)
```

## Part 2 — `/etc/passwd`: the user database

Despite the name, `/etc/passwd` holds **account info, not passwords**. It's plain
text — one line per user, seven colon-separated fields:

```text
alice:x:1000:1000:Alice Smith:/home/alice:/bin/bash
  1    2   3    4       5          6           7
```

| # | Field | Example | Meaning |
|---|-------|---------|---------|
| 1 | Username | `alice` | login name |
| 2 | Password | `x` | `x` = stored in `/etc/shadow` (not here) |
| 3 | UID | `1000` | user ID number |
| 4 | GID | `1000` | primary group ID |
| 5 | GECOS | `Alice Smith` | full name / comment |
| 6 | Home | `/home/alice` | home directory |
| 7 | Shell | `/bin/bash` | login shell (`/usr/sbin/nologin` = can't log in) |

```bash
cat /etc/passwd                       # the whole database
grep "^alice:" /etc/passwd            # one user (Lesson 108 grep!)
cut -d: -f1 /etc/passwd | sort        # just the usernames (Lesson 109 cut!)
awk -F: '$3>=1000 && $7~/sh$/ {print $1}' /etc/passwd   # real human accounts
```

> [!NOTE]
> The actual password **hashes** live in **`/etc/shadow`**, readable only by root
> — which is why `/etc/passwd` can be world-readable safely. Field 2 being `x`
> means "look in shadow." You'll rarely edit either by hand; the tools in Part 4 do
> it for you.

## Part 3 — `/etc/group`: the group database

Same idea, for groups — one line each, four fields:

```text
sudo:x:27:alice,bob
 1   2  3    4
```

| # | Field | Meaning |
|---|-------|---------|
| 1 | Group name | e.g. `sudo` |
| 2 | Password | almost always `x` (unused) |
| 3 | GID | group ID number |
| 4 | Members | comma-separated supplementary members |

Every user has **one primary group** (field 4 of their passwd line) and can be a
**supplementary member** of many others (field 4 here). Membership in groups like
**`sudo`** (admin rights) or **`docker`** is how you grant capabilities.

```bash
cat /etc/group | grep sudo            # who's in the sudo group?
getent group sudo                     # the robust way (works with LDAP/AD too)
groups alice                          # alice's groups
```

> [!TIP]
> Prefer **`getent passwd`** / **`getent group`** over `cat /etc/passwd` in real
> environments: `getent` also consults network directories (LDAP, Active
> Directory), so it shows the *complete* picture, not just local accounts. On a
> standalone box they're equivalent.

## Part 4 — Creating and managing accounts

Two families exist. **`useradd`** is the low-level, scriptable tool (same on all
distros); **`adduser`** is a friendly Debian/Ubuntu wrapper that prompts you and
sets sensible defaults. All of these need **root** (use `sudo`).

```bash
# Create a user (Debian/Ubuntu friendly way — interactive, makes home + sets shell)
sudo adduser alice

# Create a user the portable low-level way
sudo useradd -m -s /bin/bash alice    # -m makes the home dir, -s sets the shell

# Set or change a password
sudo passwd alice                     # prompts for the new password
passwd                                # change YOUR OWN password (no sudo)

# Modify an existing user
sudo usermod -aG sudo alice           # ADD alice to the 'sudo' group (-aG = append)
sudo usermod -s /usr/sbin/nologin bob # change a shell (e.g. disable login)
sudo usermod -L alice                 # lock the account; -U to unlock

# Groups
sudo groupadd developers              # create a group
sudo usermod -aG developers alice     # add alice to it
sudo gpasswd -d alice developers      # remove alice from it

# Delete
sudo userdel bob                      # remove the user (keeps their home)
sudo userdel -r bob                   # remove the user AND their home directory
```

> [!IMPORTANT]
> When adding someone to a group, **always use `usermod -aG` (append)**. Plain
> `usermod -G developers alice` **replaces** all of alice's supplementary groups
> with just `developers`, silently removing her from `sudo`, `docker`, etc. The
> missing `-a` has locked many an admin out of their own privileges. `-aG` =
> *append to Groups*.

Group changes take effect on the **next login** (or `newgrp`), so after adding
yourself to `docker` or `sudo`, log out and back in.

## Hands-on lab

Do this on a practice VM where creating/removing users is safe.

```bash
# 1. Inspect identity
id
groups
id root                               # note root is uid=0

# 2. Read the databases with your text skills
awk -F: '{print $1, $3, $7}' /etc/passwd | column -t | head
getent group sudo

# 3. Create a user and a group (needs sudo)
sudo useradd -m -s /bin/bash tester
sudo passwd tester                    # set a password
id tester                             # uid, gid, groups

# 4. Group membership (note -aG!)
sudo groupadd labteam
sudo usermod -aG labteam tester
id tester                             # labteam now appears

# 5. Lock, then remove cleanly
sudo usermod -L tester                # locked
sudo userdel -r tester                # remove user + home
sudo groupdel labteam
grep "^tester:" /etc/passwd || echo "tester is gone"
```

## Exercises

1. Print your UID, primary GID, and all supplementary groups using a single
   command.
2. From `/etc/passwd`, list the usernames of all "real" human accounts (UID ≥ 1000,
   excluding the `nobody` account at 65534).
3. Show every member of the `sudo` group two different ways.
4. Create a user `demo` with a home directory and bash shell, set a password, then
   add them to a new group `students` **without** removing any existing groups.
5. Remove the `demo` user **and** their home directory, then prove they're gone.

## Troubleshooting

- **"I added myself to the `docker`/`sudo` group but it didn't work"** — group
  changes apply at **next login**. *Fix:* log out and back in (or `newgrp docker`).
- **`usermod -G` removed me from other groups** — you omitted `-a`. *Fix:* always
  `usermod -aG`; re-add the lost groups (`sudo usermod -aG sudo,docker you`).
- **`useradd` created a user with no home / wrong shell** — `useradd` is minimal by
  default. *Fix:* use `-m` (make home) and `-s /bin/bash` (set shell), or use
  `adduser` which does both.
- **Can't see network users in `/etc/passwd`** — they're in a directory service.
  *Fix:* use `getent passwd` / `id username` instead of reading the file.
- **`userdel` left files owned by a now-missing UID** — you deleted the user but not
  their files. *Fix:* `userdel -r` to remove the home, and `find / -uid <olduid>`
  to locate stray files.

Reproduce the `-aG` lesson safely on a test user: create `t1`, add to two groups
with `-aG`, then deliberately run `usermod -G one t1` and watch `id t1` lose the
other group — then fix it.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Run the practical items on
a VM.

1. What's the difference between a user and a group?
2. What is root's UID? What UID range typically marks regular human users on
   Ubuntu?
3. Name three fields of an `/etc/passwd` line and what they hold.
4. Where are password hashes actually stored, and why isn't that `/etc/passwd`?
5. What's the difference between a primary group and a supplementary group?
6. Why must you use `usermod -aG` rather than `usermod -G`?
7. Which command shows your complete identity (UID, GID, groups)?
8. How do you remove a user along with their home directory?
9. **Practical:** list usernames with UID ≥ 1000 from `/etc/passwd`. Command?
10. **Practical:** show the members of the `sudo` group. Command?

## Solutions & validation

1. A **user** is a single identity that owns files/processes; a **group** is a named
   collection of users used to **share** access.
2. root is **UID 0**; regular users are typically **UID ≥ 1000** on Debian/Ubuntu.
3. Any three of: username (1), UID (3), GID (4), GECOS/full name (5), home (6),
   shell (7) — with their meanings.
4. In **`/etc/shadow`**, readable only by root; keeping hashes out of the
   world-readable `/etc/passwd` protects them.
5. The **primary** group (in the passwd line) owns new files you create by default;
   **supplementary** groups grant additional access and are listed in `/etc/group`.
6. `-aG` **appends**; plain `-G` **replaces** all supplementary groups, dropping you
   from any you don't relist.
7. `id`.
8. `sudo userdel -r username`.
9. **Validation:** `awk -F: '$3>=1000 {print $1}' /etc/passwd` (or `cut`+filter)
   lists the accounts.
10. **Validation:** `getent group sudo` (or `grep ^sudo: /etc/group`) shows the
    member list.

> [!TIP]
> Identity is the bedrock of Linux security. With users and groups clear, the next
> lesson — **permissions** — will finally make `-rw-r--r--` read like plain English.

## What's next

Next: **Lesson 113 — Permissions (rwx, chmod, chown, umask).** Now that you know
*who* users and groups are, you'll learn exactly *what they can do* to each file:
the read/write/execute model, reading and setting permissions with `chmod` (symbolic
and octal), changing ownership with `chown`, and how `umask` decides the defaults.
This is one of the most important lessons in the track.
