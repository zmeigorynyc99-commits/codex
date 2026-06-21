==================================================================
HOW TO ADD THIS TUTORIAL (admin area)
------------------------------------------------------------------
1. Sign in at  https://botera.md/admin/login
2. Click  "New tutorial"
3. Copy each field below into the matching box.
4. Paste everything under "CONTENT (MARKDOWN)" into the big
   "Content (Markdown)" editor. Use "Show preview" to check it.
5. Set Status = Published (or Draft first), then Save.
   Tip: set the Publication date one day after Day 2 so the series
   stays in order on the tutorials page.
==================================================================

TITLE:
Linux to DevOps Roadmap — Day 3: Users, Groups, Permissions & sudo

URL SLUG:
linux-to-devops-day-3-users-groups-permissions-sudo

SUMMARY:
Day 3 of the Linux-to-DevOps roadmap. Master the Linux permission model: read
those rwx strings, set permissions with chmod, change ownership with chown,
manage users and groups, and use sudo safely. Hands-on multi-user lab plus
Windows ACL parallels. About one hour.

CATEGORY:
Getting Started

TAGS:
linux, devops, roadmap, permissions, users, groups, sudo, chmod, chown, security, beginner

DIFFICULTY:
Beginner

DISTRIBUTION:
General Linux

AUTHOR:
botera

COVER IMAGE (paste this URL into the "Cover image" box):
https://botera.md/covers/linux-devops-day-3.svg

SEO TITLE:
Linux to DevOps — Day 3: Permissions, Users & sudo (Beginner)

SEO DESCRIPTION:
Day 3 of the Linux-to-DevOps roadmap: read rwx permissions, use chmod and chown,
manage users and groups, and run sudo safely. Hands-on, ~1 hour.

------------------------------------------------------------------
CONTENT (MARKDOWN) — paste everything below this line
------------------------------------------------------------------

Welcome to **Day 3** of the **Linux to DevOps Roadmap**. So far you can move
around the system (Day 1) and read, edit and search text (Day 2). Today we cover
the topic that underpins all of Linux security and is the source of more
"why won't this work?!" moments than anything else: **permissions and users**.

Linux was built from the ground up to be a **multi-user** system. Every file is
owned by someone, every process runs as someone, and the kernel constantly asks
one question: *"Is this user allowed to do that?"* Once you truly understand how
that question is answered, a huge amount of Linux stops being mysterious — failed
deploys, "permission denied" errors, insecure servers and locked-out accounts all
become things you can reason about and fix.

> [!NOTE]
> About an hour including the lab. Some steps create real users and need admin
> rights — do them in your practice VM or a throwaway cloud server, exactly the
> kind of safe sandbox we set up on Day 1.

## Today's mission

By the end of this hour you'll be able to:

- Explain what a **user**, a **group** and **root** are.
- Read the `-rwxr-xr--` permission string from `ls -l` instantly.
- Change permissions with **chmod** (both symbolic and numeric forms).
- Change ownership with **chown** and **chgrp**.
- Create and manage **users and groups**.
- Use **sudo** to perform admin tasks **safely** — and understand why you should
  never just "log in as root".

## Part 1 — Users, groups and root

Three identities matter:

- A **user** is an account that owns files and runs programs. Each has a numeric
  **UID** (user ID). Your normal account is a regular user.
- A **group** is a named collection of users, with a numeric **GID**. Groups let
  you grant the same access to several people at once (e.g. a `developers`
  group).
- **root** (UID 0) is the **superuser** — the administrator who can do absolutely
  anything, bypassing all permission checks. With great power comes great
  ability to wreck the system, which is why we use it sparingly.

The system stores accounts in plain text files (told you — everything is text):

```bash
cat /etc/passwd      # one line per user account
cat /etc/group       # one line per group
```

A line in `/etc/passwd` looks like `alex:x:1000:1000:Alex:/home/alex:/bin/bash`
— that's username, a placeholder for the password (the real hash lives in the
protected `/etc/shadow`), UID, primary GID, a comment, the home directory, and
the login shell.

Find out who you are and which groups you belong to:

```bash
whoami        # your username
id            # your UID, primary GID and all your groups
groups        # just the group names you're in
```

## Part 2 — Reading permissions from `ls -l`

Run a long listing and look at the first column:

```bash
ls -l /etc/hostname
# -rw-r--r-- 1 root root 9 Jan 10 12:00 /etc/hostname
```

That `-rw-r--r--` is the heart of today's lesson. It has **10 characters**, which
break into four parts:

```text
-     rw-      r--      r--
^     ^        ^        ^
type  owner    group    others
```

- **Character 1** is the **type**: `-` a regular file, `d` a directory, `l` a
  symbolic link.
- **Characters 2–4** are what the **owner** (the user who owns the file) can do.
- **Characters 5–7** are what members of the file's **group** can do.
- **Characters 8–10** are what **everyone else** ("others") can do.

Within each set of three, the letters always appear in the same order and mean:

| Letter | On a file | On a directory |
|--------|-----------|----------------|
| `r` (read) | view the contents | list the names inside it |
| `w` (write) | change the contents | create/delete files inside it |
| `x` (execute) | run it as a program | **enter** it (`cd` into it) |

A `-` in a slot means that permission is **not** granted. So `-rw-r--r--` reads
as: *a regular file; the owner can read and write; the group can read; others
can read.* No one can execute it.

> [!IMPORTANT]
> On **directories**, `x` does not mean "run" — it means "may I traverse into
> this directory?" A folder with `r` but not `x` lets you see the names inside
> but not actually `cd` in or access the files. This trips up almost every
> beginner at least once.

## Part 3 — Numeric (octal) permissions

Typing `rwx` triplets gets tedious, so Linux also represents permissions as
**numbers**. Each permission has a value:

- read `r` = **4**
- write `w` = **2**
- execute `x` = **1**

Add them up for each of the three groups (owner, group, others). For example:

| Symbolic | Owner | Group | Others | Number |
|----------|-------|-------|--------|--------|
| `rwxr-xr-x` | 4+2+1=7 | 4+0+1=5 | 4+0+1=5 | **755** |
| `rw-r--r--` | 4+2+0=6 | 4+0+0=4 | 4+0+0=4 | **644** |
| `rw-------` | 4+2+0=6 | 0 | 0 | **600** |
| `rwx------` | 7 | 0 | 0 | **700** |

You'll memorise a few by heart through use:

- **755** — programs and directories: owner full control, everyone can read/enter.
- **644** — normal files: owner can edit, everyone can read.
- **600** — private files (like SSH keys): only the owner can read/write.
- **700** — private directories: only the owner can enter.

## Part 4 — Changing permissions with chmod

`chmod` ("change mode") sets permissions. It accepts both the symbolic and
numeric forms.

```bash
cd ~/devops-lab
echo 'echo "hello from a script"' > script.sh
ls -l script.sh        # probably -rw-r--r-- (can't run it yet)

# Symbolic: who (u=owner, g=group, o=others, a=all) +/- permission
chmod u+x script.sh    # add execute for the owner
./script.sh            # now it runs

chmod go-r notes.txt 2>/dev/null   # remove read for group and others
chmod a+r notes.txt 2>/dev/null    # add read for everyone

# Numeric: set all three groups at once
chmod 644 notes.txt    # rw-r--r--
chmod 600 secret.txt 2>/dev/null   # rw------- (private)
chmod 755 script.sh    # rwxr-xr-x
```

Add `-R` to apply recursively to a directory and everything in it — powerful, and
easy to misuse:

```bash
chmod -R 755 my-website/
```

> [!WARNING]
> Never "fix" a permission problem with `chmod -R 777`. `777` means *everyone can
> read, write and execute everything* — it switches security **off** and is a
> classic way to get a server compromised. If something is "permission denied",
> the right fix is to set the correct **owner** and the **minimum** permissions
> needed, not to open it to the whole world.

## Part 5 — Changing ownership with chown and chgrp

Permissions decide what the owner/group/others can do; **ownership** decides who
the owner and group actually *are*. Changing ownership needs admin rights
(`sudo`), because it's a security-sensitive action.

```bash
# chown user:group  file
sudo chown alex:developers report.txt    # set owner to alex, group to developers
sudo chown alex report.txt               # change only the owner
sudo chgrp developers report.txt         # change only the group
sudo chown -R www-data:www-data /var/www # recursively (e.g. web files)
```

The combination of `chown` (who owns it) and `chmod` (what they can do) gives you
complete, precise control over access. In real DevOps this is everyday work:
making sure your web server's user (`www-data` on Ubuntu) owns the web files, or
that a deploy user can write to an app directory.

> [!WARNING]
> Be extremely careful with **recursive `chown` on system paths**. A command like
> `sudo chown -R alex /` would hand your whole system to one user and can render
> it unbootable. Always double-check the target path before running a recursive
> ownership change — and never aim it at `/`, `/etc`, `/usr` and friends.

## Part 6 — sudo and root, done safely

You rarely need to *become* root. Instead you run individual admin commands with
**sudo** ("superuser do"), which:

1. checks that you're allowed (your user must be in the `sudo` group on Ubuntu),
2. asks for **your** password (not root's), and
3. runs that one command with root privileges, logging it.

```bash
sudo apt update                 # run one command as root
sudo systemctl restart nginx    # restart a service (more on services in Day 4)
sudo -i                         # start an interactive root shell (use sparingly)
exit                            # leave the root shell
```

> [!IMPORTANT]
> **Do not log in directly as root, and don't live in a root shell.** Using your
> own account with `sudo` per-command gives you an audit trail (who did what),
> protects you from typos running as the all-powerful user, and is the universal
> professional convention. On a fresh server, the very first hardening step is to
> create a normal user, add it to `sudo`, and disable direct root login.

Who is allowed to use sudo is defined in `/etc/sudoers`. **Never edit that file
with a normal editor** — a syntax error can lock everyone out of admin access.
Always use `visudo`, which checks the file before saving:

```bash
sudo visudo
```

## Part 7 — Creating and managing users and groups

On Debian/Ubuntu, the friendly, interactive tools are `adduser` and `addgroup`
(the lower-level `useradd`/`groupadd` exist too and are common in scripts):

```bash
sudo adduser deploy                 # create a user 'deploy' (prompts for details)
sudo addgroup webteam               # create a group 'webteam'
sudo usermod -aG webteam deploy     # add 'deploy' to the 'webteam' group
sudo usermod -aG sudo deploy        # grant 'deploy' admin rights (Ubuntu)
groups deploy                       # verify the groups
sudo passwd deploy                  # set or reset the password
sudo deluser deploy                 # remove the user (add --remove-home to wipe its home)
```

> [!WARNING]
> When adding someone to a group, **always include the `-a` (append)** in
> `usermod -aG`. Without `-a`, `usermod -G` **replaces** all of the user's
> secondary groups with just the one you listed — which can quietly remove them
> from `sudo` and other important groups. The phrase to memorise is "**a**dd with
> "**a**"".

## A real-world example: SSH key permissions

Here's where today's lesson pays off immediately. SSH (which you'll use to log in
to every server) **refuses to work** if your key files are too open — a security
feature. The correct permissions are:

```bash
chmod 700 ~/.ssh                      # the directory: only you can enter it
chmod 600 ~/.ssh/authorized_keys      # your keys: only you can read/write
chmod 600 ~/.ssh/id_ed25519           # a private key must be private (600)
chmod 644 ~/.ssh/id_ed25519.pub       # a public key can be world-readable
```

If you've ever seen *"Permissions are too open … this private key will be
ignored"*, this is the fix. You now understand exactly why.

## Hands-on lab: a shared team folder

Let's model a common real task: a folder that a whole team can collaborate in.
Run this on your practice machine (it uses `sudo`).

```bash
# 1. Create a team group and two users
sudo addgroup webteam
sudo adduser --disabled-password --gecos "" alice
sudo adduser --disabled-password --gecos "" bob
sudo usermod -aG webteam alice
sudo usermod -aG webteam bob

# 2. Create a shared directory owned by the group
sudo mkdir -p /srv/webteam
sudo chown root:webteam /srv/webteam
sudo chmod 2775 /srv/webteam     # 775 + setgid (the leading 2)

# 3. Inspect what you built
ls -ld /srv/webteam
# drwxrwsr-x ... root webteam ...   <- note the 's' in the group slot

# 4. Prove it works: become alice and create a file
sudo -u alice touch /srv/webteam/from-alice.txt
ls -l /srv/webteam
# the new file's GROUP is 'webteam', inherited automatically
```

What's the magic leading `2` in `chmod 2775`? That's **setgid** on the directory.
It makes every new file created inside automatically belong to the directory's
group (`webteam`) instead of the creator's personal group — so the whole team can
always read and edit each other's files. This exact pattern is how shared project
and web directories are set up on real servers. Clean it up when done:

```bash
sudo rm -rf /srv/webteam
sudo deluser --remove-home alice
sudo deluser --remove-home bob
sudo delgroup webteam
```

## For Windows people: the same idea, different tools

Windows has the same "who can do what" model, implemented as **ACLs (Access
Control Lists)** on the NTFS filesystem — richer than Unix rwx, but the goal is
identical. The admin account is **Administrator**, and **UAC** (the "Do you want
to allow this app to make changes?" prompt) is the Windows equivalent of `sudo`.

```powershell
# View permissions on a file/folder (like ls -l for the ACL)
Get-Acl C:\app | Format-List

# Grant a user read & execute (icacls is the command-line ACL tool)
icacls C:\app /grant "DOMAIN\deploy:(RX)"

# Run a single command as another/admin user (sudo-like)
Start-Process powershell -Verb RunAs        # elevate (triggers UAC)
runas /user:Administrator cmd               # run as a specific account
```

> [!NOTE]
> Concept map: Unix **owner/group/others + rwx** ≈ Windows **ACL entries +
> read/write/execute/full-control**; **root** ≈ **Administrator**; **sudo** ≈
> **UAC / Run as administrator**. Different syntax, same security thinking —
> grant the **least privilege** needed, never "full control to everyone".

## Common mistakes to avoid

- **`chmod -R 777` to "make it work".** It disables security. Fix ownership and
  use the least permissions instead.
- **Recursive `chown` on the wrong path** (especially `/`). Always re-read the
  target before pressing Enter.
- **`usermod -G` without `-a`**, which wipes a user's other groups.
- **Living as root** or logging in as root over SSH. Use a normal user + `sudo`.
- **Editing `/etc/sudoers` directly.** Use `sudo visudo` so mistakes can't lock
  you out.
- **Forgetting directory `x`.** If users can't `cd` into a folder, it likely
  lacks execute permission.

## Recap — what you learned today

- Linux is multi-user: every file has an **owner** and a **group**; **root** is
  the all-powerful superuser.
- Read `-rwxr-xr--` as type + owner/group/others, each with **r(4) w(2) x(1)**.
- On directories, `x` means "can enter".
- Set permissions with **chmod** (symbolic `u+x` or numeric `755`/`644`/`600`).
- Set ownership with **chown user:group** and **chgrp**.
- Manage accounts with **adduser**, **addgroup** and **usermod -aG**.
- Use **sudo** per command; never live as root; edit sudoers only with `visudo`.
- Windows expresses the same model with **NTFS ACLs**, **Administrator** and
  **UAC**.

## Homework (15–20 minutes)

1. In `~/devops-lab`, create a file and use `chmod` to make it `640`. Verify with
   `ls -l` and explain out loud what each character means.
2. Make a script file executable with the **symbolic** form (`chmod u+x`), run
   it, then remove execute with `chmod u-x` and watch it fail.
3. Convert these to numeric in your head, then check with chmod + `ls -l`:
   `rwxr-x---`, `rw-rw-r--`, `r--------`.
4. Look at `ls -l /usr/bin/passwd` and notice the unusual `s` permission — search
   the web for "setuid" and write one sentence on what it does.
5. (On a VM) create a user, add them to a new group with `usermod -aG`, and
   confirm with `groups`.
6. Set your `~/.ssh` directory to `700` and any `authorized_keys` to `600`.

## Common questions

**What's the difference between a user's "primary" and "secondary" groups?**
Your primary group is the one new files you create are assigned to by default;
secondary groups are extra memberships that grant additional access. `id` shows
both.

**When do I need sudo vs not?**
You need `sudo` to touch things you don't own — system files in `/etc`,
installing packages, managing services, other users' files. Your own files in
your home directory don't need it.

**Is `chmod 777` ever okay?**
Almost never on anything that matters. It's occasionally used on a throwaway temp
folder, but in production it's a red flag. Prefer correct ownership + least
privilege.

**What's `www-data`?**
On Debian/Ubuntu it's the unprivileged user the web server runs as. Making your
web files owned by `www-data` (and not world-writable) is standard practice — a
preview of the server work coming later in the roadmap.

## What's next — Day 4

On **Day 4** we bring the system to life: **processes and services**. You'll see
what's running with `ps` and `top`, stop runaway programs with `kill`, and —
crucially for DevOps — manage long-running services with **systemd** (`systemctl
start/stop/status/enable`) and read their logs with **journalctl**. That's how
you run web servers, databases and your own apps as reliable background services.

Brilliant progress — you now understand the Linux security model that most users
never learn. Redo the shared-folder lab from memory before you move on.
