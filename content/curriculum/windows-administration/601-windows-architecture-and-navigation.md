---
title: "Windows Administration — The OS Model & Getting Around"
slug: "windows-admin-os-model-and-navigation"
track: "windows-administration"
trackName: "Windows Administration"
module: "Windows Foundations"
order: 601
level: "Beginner"
difficulty: "Beginner"
distribution: "Windows"
category: "Windows Administration"
tags: [windows, architecture, powershell, cmd, navigation, beginner]
cover: "/covers/curriculum/windows-administration.svg"
estMinutes: 50
status: "published"
summary: "Cross from Linux to Windows with the right mental model. Understand the Windows OS architecture (kernel, services, the registry), the management tools (Settings, MMC, cmd, and PowerShell), how the file system and drives differ from Linux, and the Linux-to-Windows command translations."
seoTitle: "Windows Administration 1: OS Model, PowerShell & Navigation"
seoDescription: "Beginner Windows for Linux admins: the Windows architecture, cmd vs PowerShell, drives and the file system, and Linux-to-Windows command equivalents. Lab + assessment."
---

You've built deep Linux skills — now you'll add **Windows**, because real
environments are mixed and a complete admin works in both. This track teaches
Windows the way an operator needs it, **PowerShell-first**, constantly mapping back
to the Linux concepts you already know. This first lesson gives you the mental
model: how Windows is structured, the tools you'll manage it with, how its file
system and drives differ from Linux, and a translation table so your existing
muscle memory transfers.

## Learning objectives

By the end of this lesson you will be able to:

- Describe the **Windows architecture** (kernel, services, the registry) at a high
  level and contrast it with Linux.
- Choose the right **management tool**: Settings, **MMC** consoles, **cmd**,
  **PowerShell**.
- Navigate the **file system** and understand **drive letters** vs Linux paths.
- Translate everyday **Linux commands to Windows/PowerShell** equivalents.
- Run **PowerShell** as Administrator and read its object output.

## Part 1 — The Windows architecture at a glance

Windows, like Linux, separates a privileged **kernel** from **user-mode** programs,
but the surrounding ecosystem differs:

- **Kernel & drivers** — the core (`ntoskrnl`) managing memory, processes, and
  hardware, much like the Linux kernel.
- **Services** — long-running background processes (the equivalent of Linux
  daemons/systemd units), managed by the **Service Control Manager**.
- **The Registry** — a central hierarchical **database** of configuration for the OS
  and applications. This is the big conceptual difference: where Linux scatters
  config across text files in `/etc`, Windows centralizes most of it in the registry
  (Lesson 602).
- **GUI-first, but scriptable** — Windows grew up graphical, but modern
  administration is done with **PowerShell** (objects, not text), which is what
  you'll focus on.

> [!IMPORTANT]
> The single biggest mental shift from Linux: **configuration lives in the Registry,
> not in text files**. There's no `/etc` to `grep` and edit; instead a structured
> database you query and modify with `regedit`, `reg`, or PowerShell. And where Linux
> "everything is a file," Windows leans on **objects** — PowerShell passes structured
> objects between commands, not lines of text. Internalize those two differences and
> Windows stops feeling alien.

## Part 2 — The management tools

You'll meet several layers of tooling; pick the right one:

| Tool | What it's for | Linux analog |
|------|---------------|--------------|
| **Settings** / Control Panel | GUI for end-user & basic config | GNOME Settings |
| **MMC** consoles (`.msc`) | Focused admin GUIs (services.msc, eventvwr.msc, devmgmt.msc) | various GUI tools |
| **cmd** (Command Prompt) | Legacy command line (batch, simple commands) | a minimal shell |
| **PowerShell** | Modern, object-oriented automation shell | **Bash** (but objects) |
| **Windows Terminal** | A tabbed host for cmd/PowerShell/WSL | a terminal emulator |

```powershell
# Open common MMC consoles from a run/PowerShell prompt:
services.msc       # services
eventvwr.msc       # Event Viewer (logs)
compmgmt.msc       # Computer Management (users, disks, services in one)
taskmgr            # Task Manager
```

> [!TIP]
> Learn the **`.msc` console names** — typing `services.msc`, `eventvwr.msc`,
> `compmgmt.msc`, `gpedit.msc`, `diskmgmt.msc` (Win+R or in a shell) jumps straight
> to the right tool, far faster than clicking through menus. And install **Windows
> Terminal** for a tabbed, modern experience hosting PowerShell, cmd, and WSL (your
> Linux) side by side.

## Part 3 — The file system and drives

Windows organizes storage very differently from Linux's single tree:

- **Drive letters** — storage appears as `C:\`, `D:\`, etc. (each volume gets a
  letter), instead of Linux's one tree under `/` with mount points. `C:` is usually
  the system drive.
- **Backslashes** — paths use `\` (`C:\Windows\System32`) where Linux uses `/`.
  (PowerShell tolerates `/` too.)
- **Key locations**: `C:\Windows` (the OS), `C:\Windows\System32` (system binaries),
  `C:\Program Files` (apps), `C:\Users\<name>` (home directories), `%APPDATA%` (per-
  user app config — the closest thing to dotfiles).
- **Environment variables** use `%NAME%` in cmd and `$env:NAME` in PowerShell (e.g.
  `%USERPROFILE%` / `$env:USERPROFILE` ≈ `$HOME`).
- **Case-insensitive** file names (unlike Linux's case-sensitive).

```powershell
Get-Location              # where am I (like pwd)
Set-Location C:\Windows   # cd
Get-ChildItem             # list (like ls)  -- alias: ls, dir
Get-ChildItem -Force      # include hidden/system items (like ls -a)
$env:USERPROFILE          # your home directory path
Get-PSDrive               # all drives/providers
```

## Part 4 — Linux → Windows/PowerShell translation

Your Linux reflexes mostly transfer; only the command names change. PowerShell even
**aliases** many Linux names:

| Task | Linux | PowerShell (cmdlet) | alias |
|------|-------|---------------------|-------|
| Print working dir | `pwd` | `Get-Location` | `pwd` |
| List files | `ls` | `Get-ChildItem` | `ls`, `dir` |
| Change dir | `cd` | `Set-Location` | `cd` |
| Show file | `cat` | `Get-Content` | `cat`, `type` |
| Copy | `cp` | `Copy-Item` | `cp`, `copy` |
| Move/rename | `mv` | `Move-Item` | `mv`, `move` |
| Delete | `rm` | `Remove-Item` | `rm`, `del` |
| Make dir | `mkdir` | `New-Item -ItemType Directory` | `mkdir`, `md` |
| Find text | `grep` | `Select-String` | `sls` |
| Processes | `ps` | `Get-Process` | `ps`, `gps` |
| Kill process | `kill` | `Stop-Process` | `kill` |
| Services | `systemctl` | `Get-Service` / `*-Service` | — |
| Environment | `env` | `Get-ChildItem env:` | — |
| Download | `curl/wget` | `Invoke-WebRequest` | `curl`, `iwr` |

> [!IMPORTANT]
> PowerShell cmdlets follow a strict **Verb-Noun** pattern (`Get-Service`,
> `Stop-Process`, `New-Item`) — once you know the verbs (Get, Set, New, Remove,
> Start, Stop) and the nouns, you can **guess** commands and discover them with
> `Get-Command *service*`. And critically, cmdlets output **objects**, not text:
> `Get-Process | Where-Object CPU -gt 10 | Sort-Object CPU` filters and sorts on
> real properties — no fragile text parsing like `ps | grep | awk`.

## Part 5 — Running PowerShell (and as Administrator)

```powershell
# Find and learn commands (your self-sufficiency tools, like man/--help)
Get-Command *service*            # discover cmdlets by keyword
Get-Help Get-Service -Examples   # documentation with examples
Get-Service | Get-Member         # what PROPERTIES/methods an object has

# Object output you can filter and shape
Get-Process | Sort-Object CPU -Descending | Select-Object -First 5 Name, CPU
```

Many admin actions need elevation. Launch an **elevated** ("Run as administrator")
PowerShell — the Windows equivalent of `sudo` is **UAC elevation** (Lesson 603):

```powershell
# Check if the current session is elevated:
([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()
  ).IsInRole([Security.Principal.WindowsBuiltinRole]::Administrator)
```

> [!TIP]
> **`Get-Command`, `Get-Help`, and `Get-Member`** are the PowerShell equivalents of
> `apropos`, `man`, and "what can this thing do?" — your discovery toolkit. When you
> don't know a command, `Get-Command *keyword*`; when you don't know its options,
> `Get-Help name -Examples`; when you don't know an object's properties,
> `... | Get-Member`. With those three you can teach yourself anything in PowerShell.

## Hands-on lab

> Run on a Windows machine or VM (Windows 10/11 or Server). Open **PowerShell**.

```powershell
# 1. Orient yourself
Get-Location
Get-ChildItem C:\
$env:USERPROFILE; $env:COMPUTERNAME
Get-PSDrive | Select-Object Name, Root | Format-Table

# 2. Navigate like Linux (aliases work)
Set-Location C:\Windows\System32
ls *.exe | Select-Object -First 5
cd $env:USERPROFILE

# 3. Discover and learn a command
Get-Command *process*
Get-Help Get-Process -Examples | Select-Object -First 1
Get-Process | Get-Member -MemberType Property | Select-Object -First 8

# 4. Objects, not text: filter and sort on real properties
Get-Process | Where-Object { $_.CPU -gt 1 } |
  Sort-Object CPU -Descending | Select-Object -First 5 Name, Id, CPU

# 5. Open the key MMC consoles (note the names)
# services.msc ; eventvwr.msc ; compmgmt.msc ; taskmgr

# 6. Translate a Linux one-liner: "grep" a file
"hello`nERROR here`nok" | Out-File demo.txt
Select-String -Path demo.txt -Pattern "ERROR"
Remove-Item demo.txt
```

## Exercises

1. Print your current location, your home directory path (`$env:USERPROFILE`), and
   list the contents of `C:\` including hidden items.
2. Use `Get-PSDrive` to list all drives and identify the system drive.
3. Find the PowerShell cmdlet for working with services using `Get-Command`, then
   read its examples with `Get-Help`.
4. Use object filtering (`Where-Object`/`Sort-Object`/`Select-Object`) to show the
   top 5 processes by CPU — no text parsing.
5. Write the Windows/PowerShell equivalents for these Linux commands: `pwd`, `ls
   -a`, `cat file`, `grep x file`, `ps`, `cp a b`.

## Troubleshooting

- **"command not found" for a Linux command** — you're in cmd, or it has no alias.
  *Fix:* use the cmdlet (`Get-ChildItem`), or check aliases with `Get-Alias`.
- **Access denied changing system settings** — not elevated. *Fix:* run PowerShell
  **as Administrator** (UAC), Lesson 603.
- **A script won't run (`execution policy`)** — Windows blocks unsigned scripts by
  default. *Fix:* `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` (understand
  the implication first).
- **Backslash/forward-slash confusion** — Windows uses `\`; PowerShell accepts `/`
  too. *Fix:* prefer `Join-Path` for building paths.
- **Looking for a config file that doesn't exist** — it's likely in the **Registry**,
  not a text file (Lesson 602).

Reproduce the "objects not text" point: `Get-Process | Sort-Object WS -Descending |
Select -First 3 Name, WS` sorts by a real memory property — try doing the equivalent
by parsing `ps` text and feel the difference.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Run the practical items on
Windows.

1. Where does Windows centralize configuration, unlike Linux's `/etc`?
2. What is the Windows equivalent of Linux daemons, and what manages them?
3. Name three `.msc` consoles and what each opens.
4. How does Windows storage differ from the Linux single tree?
5. Give the PowerShell cmdlets for: list files, show a file, find text, list
   processes.
6. What naming pattern do cmdlets follow, and why is that useful?
7. What's the key difference between PowerShell output and Bash output?
8. Which three cmdlets are your discovery/help toolkit?
9. **Practical:** show the top 5 processes by CPU using object filtering.
10. **Practical:** find and read help for the service-related cmdlets.

## Solutions & validation

1. The **Registry** (a central hierarchical configuration database).
2. **Services**, managed by the **Service Control Manager**.
3. Any three: `services.msc` (services), `eventvwr.msc` (Event Viewer),
   `compmgmt.msc` (Computer Management), `taskmgr`, `diskmgmt.msc`, `gpedit.msc`.
4. Windows uses **drive letters** (`C:\`, `D:\`) per volume with `\` separators;
   Linux has **one tree** under `/` with mount points and `/`.
5. `Get-ChildItem`, `Get-Content`, `Select-String`, `Get-Process`.
6. **Verb-Noun** (e.g. `Get-Service`); it's predictable and discoverable
   (`Get-Command *noun*`).
7. PowerShell passes **structured objects** (filter/sort on properties); Bash passes
   **text** (which you parse).
8. `Get-Command`, `Get-Help`, `Get-Member`.
9. **Validation:** `Get-Process | Sort-Object CPU -Descending | Select-Object -First
   5 Name, CPU`.
10. **Validation:** `Get-Command *service*`; `Get-Help Get-Service -Examples`.

> [!TIP]
> Bring your Linux discipline with you: discover commands (`Get-Command`), read help
> (`Get-Help`), and inspect objects (`Get-Member`). The verbs/nouns and the
> objects-not-text model are 80% of "thinking in PowerShell" — the rest is just
> vocabulary.

## What's next

Next: **Lesson 602 — The Windows Registry.** The configuration database at the heart
of Windows: its hive structure (HKLM, HKCU…), keys and values, editing safely with
`regedit` and PowerShell, exporting/backing up before changes, and the common keys
admins actually touch — the Windows analog to mastering `/etc`.
