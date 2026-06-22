---
title: "Linux Fundamentals — sudo & Privilege"
slug: "linux-fundamentals-sudo-and-privilege"
track: "linux-fundamentals"
trackName: "Linux Fundamentals"
module: "Users, Permissions & Processes"
order: 114
level: "Intermediate"
difficulty: "Intermediate"
distribution: "Ubuntu"
category: "Linux Fundamentals"
tags: [linux, sudo, su, sudoers, root, security, intermediate]
cover: "/covers/curriculum/linux-fundamentals.svg"
estMinutes: 50
status: "published"
summary: "Run as root the right way. Understand what sudo really does, how it differs from su and a root login, where its rules live (/etc/sudoers and visudo), how to grant scoped privileges, and the least-privilege habits that keep a system safe and auditable."
seoTitle: "Linux Fundamentals 14: sudo vs su, sudoers & Least Privilege"
seoDescription: "Intermediate Linux: how sudo grants temporary root, sudo vs su, editing /etc/sudoers safely with visudo, scoped rules, and least-privilege habits. Lab + assessment."
---

You've typed `sudo` dozens of times by now. This lesson makes you understand it —
properly. `sudo` is how you do administrative work **safely**: temporary,
per-command root access that's logged and scoped, instead of living as the
all-powerful root user. Getting privilege right is both a daily convenience and a
core security skill; misusing it is how systems get wrecked or breached.

## Learning objectives

By the end of this lesson you will be able to:

- Explain what **`sudo`** does and why it's safer than logging in as root.
- Distinguish **`sudo`**, **`su`**, and a direct **root login**.
- Read and safely edit the **`/etc/sudoers`** policy with **`visudo`**.
- Grant **scoped** privileges (specific commands, no password) sensibly.
- Apply **least-privilege** habits and read the **sudo audit log**.

## Part 1 — What sudo actually does

**`sudo`** ("superuser do") runs a **single command** as another user — by default
**root** — after checking that you're allowed to and that you are who you say
(your own password). Then it drops back to your normal, unprivileged self.

```bash
sudo apt update                  # run this one command as root
sudo systemctl restart nginx     # restart a service as root
sudo ls /root                    # peek into root's home (normally forbidden)
```

Why this beats being root all the time:

- **Least privilege** — you run as a normal user and only elevate for the specific
  action that needs it, so a typo or a malicious script has far less power.
- **Auditing** — every `sudo` command is **logged** (who ran what, when). A shared
  root login is anonymous; `sudo` is accountable.
- **No root password sharing** — admins use *their own* passwords; you can grant or
  revoke access per person by group membership.

On Ubuntu, the first user you create is added to the **`sudo`** group, which is
what grants them this power (recall groups from Lesson 112). On Fedora/RHEL the
equivalent group is **`wheel`**.

```bash
groups                           # do you see 'sudo' (or 'wheel')? then you can sudo
sudo whoami                      # prints 'root' — proof the command ran as root
```

> [!TIP]
> `sudo` remembers your authentication for a few minutes (per terminal), so you
> won't be asked every single command. `sudo -k` forgets it immediately, and
> `sudo -v` refreshes the timer. And the classic: **`sudo !!`** re-runs your
> *previous* command with sudo — perfect for the "Permission denied… oh right"
> moment.

## Part 2 — sudo vs su vs root login

Three ways to get root power exist; they are **not** the same:

| Method | What it does | When |
|--------|--------------|------|
| **`sudo cmd`** | Run **one** command as root, using **your** password; logged. | The everyday, recommended way. |
| **`sudo -i`** / **`sudo -s`** | Open a **root shell** via sudo (your password); still logged. | A series of root commands. |
| **`su -`** | Switch to the root user fully, using **root's** password. | Systems where root login is enabled (less common now). |
| **Direct root login** | Log in as root at the console/SSH. | Strongly discouraged; often disabled. |

```bash
sudo -i                          # become root (root shell); type 'exit' to leave
su - alice                       # switch to user alice (needs alice's password)
su -                             # switch to root (needs ROOT's password)
```

> [!IMPORTANT]
> Prefer **`sudo`** (and `sudo -i` when you need a root shell) over `su` and over
> root logins. With `sudo`, each admin uses their own password and every action is
> attributable; on modern servers the root account often has **no password set and
> SSH root login disabled** specifically to force this safer path (you configured
> exactly that in the hardening lesson).

## Part 3 — Where the rules live: sudoers and visudo

`sudo`'s policy is the file **`/etc/sudoers`** (plus drop-in files in
`/etc/sudoers.d/`). **Never edit it with a normal editor** — a syntax error there
can lock everyone out of sudo. Always use **`visudo`**, which checks the syntax
before saving:

```bash
sudo visudo                      # edit /etc/sudoers safely (validates on save)
sudo visudo -f /etc/sudoers.d/deploy   # edit a drop-in file safely
```

A sudoers rule reads `who  where = (as-whom)  what`:

```text
# user   host = (run-as)      commands
alice    ALL  = (ALL:ALL)     ALL                 # alice may run anything as anyone
%sudo    ALL  = (ALL:ALL)     ALL                 # the 'sudo' GROUP (% = group) -> all
deploy   ALL  = (root)        /usr/bin/systemctl restart nginx   # ONE command only
backup   ALL  = (root) NOPASSWD: /usr/local/bin/backup.sh        # no password prompt
```

- A leading **`%`** means a **group** (`%sudo`, `%wheel`).
- **`NOPASSWD:`** lets a specific command run without a password — useful for
  automation, but scope it tightly.
- Listing **specific commands** instead of `ALL` is how you grant *just enough*
  power (e.g. let a deploy user restart one service and nothing else).

> [!IMPORTANT]
> Keep a **second root-capable session open** the first time you edit sudoers, just
> like editing SSH config. If `visudo` ever reports a syntax error, **do not save
> past it** — fix it. A broken `/etc/sudoers` can remove everyone's ability to use
> `sudo`, and recovering requires booting to single-user/recovery mode.

## Part 4 — Least privilege in practice

Grant the **minimum** needed:

- Add trusted admins to the **`sudo`**/`wheel` group rather than writing per-user
  rules.
- For service/automation accounts, grant **specific commands** with `NOPASSWD`,
  not blanket `ALL`. A CI user that only needs to reload nginx should be able to do
  *only* that.
- Avoid `NOPASSWD: ALL` for humans — it removes the speed-bump that stops a hijacked
  terminal from trivially owning the box.
- Review who has sudo regularly: `getent group sudo` and the files in
  `/etc/sudoers.d/`.

Every elevation is recorded. Read the audit trail:

```bash
sudo journalctl _COMM=sudo --since today      # today's sudo activity (systemd)
sudo grep sudo /var/log/auth.log | tail        # Debian/Ubuntu auth log
```

These lines show **who** ran **what** as root and **when** — invaluable during
incident response, and a big reason `sudo` beats anonymous root.

## Hands-on lab

Use a practice VM. Some steps deliberately *fail* to teach the boundaries.

```bash
# 1. Confirm your privilege
groups                            # look for 'sudo' or 'wheel'
sudo whoami                       # -> root
sudo -k                           # forget cached auth; next sudo re-prompts

# 2. Watch least privilege: create a limited user and a scoped rule
sudo useradd -m -s /bin/bash deploy
echo 'deploy ALL=(root) NOPASSWD: /usr/bin/systemctl restart nginx' \
  | sudo tee /etc/sudoers.d/deploy
sudo visudo -cf /etc/sudoers.d/deploy   # -c just CHECKS the file is valid

# 3. Test the boundary (as deploy)
sudo -u deploy sudo -n systemctl restart nginx   # allowed (if nginx exists)
sudo -u deploy sudo -n systemctl restart ssh     # DENIED — not in the rule

# 4. Read the audit trail of your own sudo usage
sudo journalctl _COMM=sudo --since "10 min ago" | tail

# 5. Clean up
sudo rm /etc/sudoers.d/deploy
sudo userdel -r deploy
```

## Exercises

1. Show that `sudo whoami` prints `root` while plain `whoami` prints you. Explain
   the difference in one sentence.
2. Use `sudo -k` then run a `sudo` command and confirm you're re-prompted for your
   password.
3. Explain, in a table or list, the difference between `sudo cmd`, `sudo -i`, and
   `su -`.
4. Write a sudoers line that lets the group `webops` restart **only** nginx as
   root, without a password.
5. Find the last five `sudo` invocations on your system from the audit log.

## Troubleshooting

- **"user is not in the sudoers file. This incident will be reported."** — your
  account lacks sudo rights. *Fix:* have an existing admin run `sudo usermod -aG
  sudo youruser`; log out and back in.
- **You edited `/etc/sudoers` directly and broke sudo** — *Fix:* boot to recovery/
  single-user mode (root shell) and repair the file; **going forward, always use
  `visudo`**, which would have refused to save the error.
- **A `NOPASSWD` rule still asks for a password** — another rule overrides it, or the
  command path doesn't match exactly. *Fix:* the command in the rule must match the
  invoked path; check ordering (last match wins) with `sudo -l`.
- **`sudo` works but the redirection fails** (`sudo echo x > /etc/file`) — the shell
  does the `>` as **you**. *Fix:* `echo x | sudo tee /etc/file` (Lesson 107).
- **Not sure what you're allowed to do** — run **`sudo -l`** to list your permitted
  commands.

Reproduce the scoping idea: with the lab's `deploy` rule, `sudo -n systemctl restart
ssh` is denied while restarting nginx is allowed — least privilege in action.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Run the practical items on
a VM.

1. In one sentence, what does `sudo` do?
2. Give two reasons `sudo` is safer than logging in as root.
3. Which group grants sudo on Ubuntu? On Fedora/RHEL?
4. How does `sudo cmd` differ from `su -`?
5. Why must you edit sudoers with `visudo` rather than a normal editor?
6. What does a leading `%` mean in a sudoers rule?
7. What does `NOPASSWD:` do, and when is it appropriate?
8. Which command lists what you're allowed to run with sudo?
9. **Practical:** prove a command ran as root. What did you run and see?
10. **Practical:** show today's sudo activity from the audit log. Command?

## Solutions & validation

1. It runs a **single command as another user (root by default)** after checking
   you're authorised, then returns you to your normal privileges.
2. Any two of: **least privilege** (you're root only for that command); **auditing**
   (each use is logged/attributable); **no shared root password** (admins use their
   own, revocable via group membership).
3. Ubuntu: the **`sudo`** group; Fedora/RHEL: the **`wheel`** group.
4. `sudo cmd` runs **one** command as root using **your** password and is logged;
   `su -` switches you **fully** into the root account using **root's** password.
5. `visudo` **validates the syntax before saving**, preventing a typo from locking
   everyone out of sudo.
6. It denotes a **group** (e.g. `%sudo`) rather than an individual user.
7. It lets the listed command run **without a password prompt**; appropriate for
   tightly-scoped automation/service commands, not blanket human access.
8. `sudo -l`.
9. **Validation:** `sudo whoami` prints `root` (while `whoami` prints your name).
10. **Validation:** `sudo journalctl _COMM=sudo --since today` (or `grep sudo
    /var/log/auth.log`) lists who ran what.

> [!TIP]
> "Be yourself, elevate deliberately." Living as a normal user and reaching for
> `sudo` only when needed — with scoped rules for automation — is exactly how
> professional teams run servers. You now understand the mechanism behind that
> discipline.

## What's next

Next: **Lesson 115 — Processes & Jobs.** You'll shift from files and identity to
*running programs*: how to see what's running with `ps` and `top`/`htop`, stop
misbehaving processes with `kill` and signals, run things in the background, and
keep a job alive after you log out. Essential skills for keeping a server healthy.
