---
title: "Linux Fundamentals — Text Editors Survival (nano & vim)"
slug: "linux-fundamentals-text-editors-survival"
track: "linux-fundamentals"
trackName: "Linux Fundamentals"
module: "Users, Permissions & Processes"
order: 118
level: "Beginner"
difficulty: "Beginner"
distribution: "General Linux"
category: "Linux Fundamentals"
tags: [linux, nano, vim, editor, config, beginner]
cover: "/covers/curriculum/linux-fundamentals.svg"
estMinutes: 50
status: "published"
summary: "Edit files confidently on any server. Master nano for quick friendly edits, learn the survival subset of vim — including how to actually quit it — so you're never stuck on a minimal box without nano, and pick up the safe habits for editing system config files."
seoTitle: "Linux Fundamentals 18: nano & vim Survival (How to Quit vim)"
seoDescription: "Beginner Linux: edit files with nano, and the vim survival subset — modes, insert, save and quit (yes, how to exit vim) — plus safe habits for editing config files. Lab + assessment."
---

You've been creating and changing files throughout this track, but always
indirectly (`echo >`, `sed`). Real work means **editing files directly** — tweaking
a config in `/etc`, fixing a script, writing a unit file. This lesson makes you
comfortable with the two editors you'll meet everywhere: **`nano`** (easy, great for
99% of quick edits) and **`vim`** (everywhere, including stripped-down servers where
nothing else is installed). We'll also defuse the internet's favourite joke — *how
do you exit vim?* — so you're never trapped.

## Learning objectives

By the end of this lesson you will be able to:

- Open, edit, save and exit files in **`nano`** confidently.
- Understand vim's **modal** design (normal vs insert mode).
- Do the **vim survival subset**: open, insert text, save, and **quit** (including
  without saving).
- Edit **system config files** safely with `sudo` and backups.
- Choose the right editor for the situation.

## Part 1 — nano: the friendly editor

`nano` is the editor to reach for when you just want to change a file without
ceremony. Open a file (it's created if it doesn't exist):

```bash
nano notes.txt
sudo nano /etc/hosts        # editing a system file needs sudo
```

You're immediately in a normal text editor — type to insert, arrow keys to move. The
**bottom bar shows the commands**, where **`^`** means the **Ctrl** key:

| Keys | Action |
|------|--------|
| **Ctrl+O** | **Write Out** (save). Press Enter to confirm the filename. |
| **Ctrl+X** | **Exit** (it offers to save if there are unsaved changes). |
| **Ctrl+K** | Cut the current line |
| **Ctrl+U** | Paste (uncut) |
| **Ctrl+W** | Search ("Where is") |
| **Ctrl+\\** | Search and replace |
| **Ctrl+G** | Help |

The everyday flow is just: type your changes → **Ctrl+O**, Enter (save) → **Ctrl+X**
(exit). That's all you need for the vast majority of edits.

> [!TIP]
> nano shows its key bindings at the bottom **all the time**, so you never have to
> remember them — read the bar. `nano -l file` adds line numbers; `nano -w file`
> disables line-wrapping (useful for config files where wrapping would be
> misleading).

## Part 2 — Why vim is different: modes

`vim` (and its older form `vi`) is on **every** Unix-like system, including minimal
containers and rescue environments where nano isn't installed — so you must be able
to survive in it. Its design surprises beginners: vim is **modal**. The keyboard
does different things depending on the **mode** you're in.

The two modes that matter:

- **Normal mode** (the default when vim opens) — keys are **commands**, not text.
  Pressing `d` deletes, `:` starts a command — typing here does *not* insert
  characters. This is why beginners feel "nothing I type appears."
- **Insert mode** — now you type text normally, like any editor.

You switch **Normal → Insert** by pressing `i`, and **Insert → Normal** by pressing
**Esc**. That single fact — `i` to type, `Esc` to stop — unlocks vim.

> [!IMPORTANT]
> If you open vim and "can't type" or random things happen, **you're in Normal
> mode**. Press **`i`** to enter Insert mode and type normally; press **Esc** to go
> back to Normal mode to save or quit. When in doubt about which mode you're in,
> press **Esc** — it always returns you to Normal mode, your safe home base.

## Part 3 — The vim survival subset (this is the lesson)

You do **not** need to learn all of vim today. You need to reliably do five things.
Memorise this exact sequence:

```text
1. Open:            vim file.txt
2. Start typing:    press  i        (now in Insert mode)
3. Stop typing:     press  Esc      (back to Normal mode)
4. Save:            type   :w   then Enter
5. Quit:            type   :q   then Enter
```

The commands that start with `:` are typed in Normal mode (press **Esc** first if
unsure). The essential ones:

| In Normal mode, type | Does |
|----------------------|------|
| `:w` Enter | **write** (save) |
| `:q` Enter | **quit** (only if no unsaved changes) |
| `:wq` Enter | **save and quit** (the common combo) |
| `:q!` Enter | **quit WITHOUT saving** — discard changes |
| `:x` Enter | save (if changed) and quit |

**So: how do you exit vim?** Press **Esc**, then type **`:q!`** and Enter to bail
out discarding changes, or **`:wq`** and Enter to save and leave. That's the answer
to the famous question — and now you'll never be stuck.

A few more genuinely useful Normal-mode keys, once you're comfortable:

```text
dd     delete the current line
u      undo            Ctrl+r   redo
/text  search for "text" (n = next match)
G      jump to end of file     gg   jump to top
x      delete one character    yy   copy a line   p   paste
```

## Part 4 — Editing system config files safely

Most real editing is in `/etc`, which needs `sudo` and a little care:

```bash
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak   # 1. BACK UP first
sudo nano /etc/ssh/sshd_config                          # 2. edit
sudo sshd -t                                            # 3. TEST the config (if the
                                                        #    service offers a test)
sudo systemctl reload ssh                               # 4. apply (Lesson 116)
```

Safe habits for config edits:

- **Back up before editing** a critical file (`cp file file.bak`) — instant undo.
- **Use the right tool with sudo**: `sudo nano /etc/...` (the `sudo` must be on the
  editor, not a redirect).
- **Validate before applying** when the service has a checker (`nginx -t`, `sshd
  -t`, `visudo` for sudoers).
- **Keep a second session open** when editing something that controls your access
  (SSH, sudoers, the firewall) — exactly as in the hardening lessons.

> [!IMPORTANT]
> Some files have **dedicated safe editors** — never edit them raw. Use **`visudo`**
> for `/etc/sudoers` (Lesson 114) and **`crontab -e`** for cron jobs; both validate
> syntax before saving and prevent the lockouts a plain editor can cause.

## Hands-on lab

```bash
mkdir -p ~/editor-lab && cd ~/editor-lab

# 1. nano: create, edit, save, exit
nano hello.txt
#    type a few lines, then: Ctrl+O, Enter (save), Ctrl+X (exit)
cat hello.txt                 # confirm your text is there

# 2. vim survival drill — do this slowly and deliberately
vim drill.txt
#    press i           -> Insert mode
#    type: "vim is survivable"
#    press Esc         -> Normal mode
#    type: :wq  Enter  -> save and quit
cat drill.txt

# 3. The "quit without saving" escape hatch
vim drill.txt
#    press i, type some garbage you DON'T want
#    press Esc, then type: :q!  Enter   -> discards your garbage
cat drill.txt                 # unchanged — proof :q! discarded the edit

# 4. Safe system-config pattern (read-only practice copy)
cp /etc/hosts ./hosts.copy
nano hosts.copy               # add a comment line at the top, save, exit
diff /etc/hosts ./hosts.copy  # see exactly what you changed

# 5. Clean up
cd ~ && rm -r ~/editor-lab
```

## Exercises

1. In nano, create a file with three lines, save it, reopen it, delete the middle
   line with `Ctrl+K`, and save again.
2. In vim, open a new file, enter Insert mode, type two lines, return to Normal mode,
   and save-and-quit. Write down the exact keys you pressed in order.
3. Open any existing throwaway file in vim, make an edit you **don't** want to keep,
   and exit discarding it. Which command did that?
4. Demonstrate the safe config-edit pattern on a **copy** of `/etc/hosts`: back it
   up, edit it, and `diff` to show the change.
5. Which two files should you edit with `visudo` and `crontab -e` instead of a plain
   editor, and why?

## Troubleshooting

- **"I'm stuck in vim and can't type / can't get out."** You're in Normal mode.
  *Fix:* press **Esc**, then `:q!` Enter (discard) or `:wq` Enter (save). Esc is
  always your way back.
- **vim says `E37: No write since last change`** on `:q` — you have unsaved changes.
  *Fix:* `:wq` to save and quit, or `:q!` to quit and discard.
- **`nano: command not found` on a minimal server** — nano isn't installed. *Fix:*
  use **vim/vi** (always present), or `sudo apt install -y nano` if you have network
  + permissions.
- **Edited a system file but the change had no effect** — you edited a copy, or
  forgot to reload the service. *Fix:* confirm the path; `sudo systemctl reload`/
  `restart` the relevant service (Lesson 116).
- **`Permission denied` saving a file in `/etc`** — you opened the editor without
  `sudo`. *Fix:* `sudo nano /etc/...`. (In vim you can also `:w !sudo tee % >/dev/null`
  as an escape hatch.)

Reproduce the vim "trapped" feeling on purpose with a throwaway file, then practise
escaping with `:q!` until it's automatic — that muscle memory removes the fear.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Run the practical items.

1. In nano, which keys save and which exit?
2. What does it mean that vim is "modal," and what are the two key modes?
3. How do you switch from Normal mode to Insert mode? From Insert back to Normal?
4. In vim, how do you **save and quit**? How do you **quit without saving**?
5. Why does it feel like "you can't type" when vim first opens?
6. What's the single safest key to press in vim when you're unsure of your mode?
7. Name two safety habits for editing a critical system config file.
8. Which special editors should you use for sudoers and crontab, and why?
9. **Practical:** create and save a file in vim. List the exact keystrokes.
10. **Practical:** edit a copy of `/etc/hosts` and show your change with `diff`.
    Commands?

## Solutions & validation

1. **Ctrl+O** saves (write out), **Ctrl+X** exits.
2. Modal means keys behave differently per mode; the two key modes are **Normal**
   (keys are commands) and **Insert** (keys type text).
3. `i` enters Insert mode; **Esc** returns to Normal mode.
4. Save and quit: **`:wq`** (Enter); quit without saving: **`:q!`** (Enter).
5. vim opens in **Normal mode**, where letters are commands rather than text, so
   typing doesn't insert characters until you press `i`.
6. **Esc** — it always returns you to Normal mode.
7. Any two of: **back up first** (`cp file file.bak`); **validate** before applying
   (`nginx -t`, `sshd -t`); **keep a second session open** for access-critical
   files; use the dedicated safe editor where one exists.
8. **`visudo`** for `/etc/sudoers` and **`crontab -e`** for cron; both **validate
   syntax** before saving and prevent the lockouts a raw edit can cause.
9. **Validation:** `vim f.txt` → `i` → type → `Esc` → `:wq` Enter; `cat f.txt` shows
   the text.
10. **Validation:** `cp /etc/hosts h.copy`, edit `h.copy`, `diff /etc/hosts h.copy`
    prints the difference.

> [!TIP]
> nano for comfort, vim for ubiquity. You don't need vim mastery — the survival
> subset (`i`, Esc, `:wq`, `:q!`) means no server can ever trap you. Learn more vim
> later if you like; you're already unblocked everywhere.

## What's next

🎉 **That completes the Linux Fundamentals track!** From "what is a shell" to
navigating, reading and editing files, wielding text tools, and administering users,
permissions, processes, services and packages — you can now genuinely operate a
Linux system. Next, the **Linux System Administration** track builds on this to run
real production servers: deeper user management, storage and LVM, networking
configuration, scheduling, logging at scale, performance and tuning — the road
toward RHCSA/LPIC and professional sysadmin work.
