---
title: "Windows Administration — The Windows Registry"
slug: "windows-admin-the-windows-registry"
track: "windows-administration"
trackName: "Windows Administration"
module: "Windows Foundations"
order: 602
level: "Intermediate"
difficulty: "Intermediate"
distribution: "Windows"
category: "Windows Administration"
tags: [windows, registry, regedit, configuration, intermediate]
cover: "/covers/curriculum/windows-administration.svg"
estMinutes: 50
status: "published"
summary: "Master the configuration database at the heart of Windows. Understand the registry's hive structure (HKLM, HKCU and friends), keys, values and data types, edit safely with regedit, reg and PowerShell, always export a backup first, and know the keys admins actually touch."
seoTitle: "Windows Administration 2: The Registry (hives, regedit, reg, PowerShell)"
seoDescription: "Intermediate Windows: the registry hive structure (HKLM/HKCU), keys/values/types, editing safely with regedit/reg/PowerShell, backing up, and common admin keys. Lab + assessment."
---

If `/etc` is where you tune Linux, the **Registry** is where you tune Windows. It's a
single hierarchical database holding most OS and application configuration — and
because it's so central, editing it carelessly can break the system, while editing it
skillfully lets you configure things no GUI exposes. This lesson demystifies the
registry: its structure, how to read and edit it safely with `regedit`, `reg`, and
PowerShell, and the discipline of **always backing up before you change**.

## Learning objectives

By the end of this lesson you will be able to:

- Explain the registry's **hive** structure and the root keys (HKLM, HKCU…).
- Read **keys**, **values**, and value **data types**.
- Navigate and edit with **regedit**, **`reg`**, and **PowerShell**.
- **Export/back up** a key before changing it, and restore.
- Recognize common, useful registry locations.

## Part 1 — Structure: hives, keys, values

The registry is a tree, much like a filesystem:

- **Keys** are like folders (they contain subkeys and values).
- **Values** are like files — each has a **name**, a **type**, and **data**.
- A **hive** is a top-level branch backed by a file on disk.

The five **root keys** (with their common abbreviations):

| Root key | Abbrev | Holds |
|----------|--------|-------|
| `HKEY_LOCAL_MACHINE` | **HKLM** | machine-wide settings (OS, services, installed software, hardware) |
| `HKEY_CURRENT_USER` | **HKCU** | the **logged-in user's** settings |
| `HKEY_USERS` | HKU | all loaded user profiles (HKCU is a view into one) |
| `HKEY_CLASSES_ROOT` | HKCR | file associations & COM (a merged view) |
| `HKEY_CURRENT_CONFIG` | HKCC | current hardware profile |

The two you'll use 95% of the time are **HKLM** (system/all users) and **HKCU**
(current user). Knowing *which* you need is half the battle.

> [!IMPORTANT]
> **HKLM = machine-wide (affects all users, needs admin); HKCU = just the current
> user.** Many "this setting works for me but not other accounts" puzzles come from
> editing HKCU when you meant HKLM (or vice versa). If a change should apply to
> everyone on the machine, it belongs under **HKLM** (and you'll need elevation); if
> it's per-user, **HKCU**.

## Part 2 — Value types

Each value has a **data type** — these come up when you create or script values:

| Type | Meaning | Example use |
|------|---------|-------------|
| **REG_SZ** | a string | a path, a name |
| **REG_DWORD** | a 32-bit number | on/off flags (0/1), settings |
| **REG_QWORD** | a 64-bit number | large numbers |
| **REG_BINARY** | raw binary | opaque blobs |
| **REG_MULTI_SZ** | multiple strings | lists |
| **REG_EXPAND_SZ** | string with env vars | `%SystemRoot%\...` |

Most admin settings are **REG_DWORD** (a `0`/`1` toggle) or **REG_SZ** (a string).
Using the wrong type for a value is a common reason a registry tweak "does nothing."

## Part 3 — regedit, reg, and PowerShell

**`regedit`** is the GUI editor (Win+R → `regedit`). It's fine for browsing and
one-off edits. For repeatability and scripting, use **`reg`** (cmd) or **PowerShell**
(which exposes the registry as a drive).

```powershell
# PowerShell: the registry is a PSDrive (HKLM:, HKCU:)
Get-ChildItem 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion' | Select-Object -First 5
Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion' |
  Select-Object ProductName, CurrentBuild, DisplayVersion

# Read a single value
Get-ItemPropertyValue 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion' -Name ProductName

# Create/modify a value (admin for HKLM)
New-Item   -Path 'HKCU:\Software\BoteraLab' -Force | Out-Null
New-ItemProperty -Path 'HKCU:\Software\BoteraLab' -Name 'Enabled' -Value 1 -PropertyType DWord -Force
Set-ItemProperty -Path 'HKCU:\Software\BoteraLab' -Name 'Enabled' -Value 0

# Remove
Remove-Item 'HKCU:\Software\BoteraLab' -Recurse
```

```cmd
:: reg.exe (cmd) — scriptable, classic
reg query "HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion" /v ProductName
reg add   "HKCU\Software\BoteraLab" /v Enabled /t REG_DWORD /d 1 /f
reg delete "HKCU\Software\BoteraLab" /f
```

> [!TIP]
> In PowerShell, `HKLM:` and `HKCU:` are **drives** — you navigate them with the same
> `Get-ChildItem`/`Get-ItemProperty`/`Set-ItemProperty` cmdlets you use for files.
> That consistency (everything is a provider) means your file skills transfer to the
> registry. For automation and documentation, prefer **`reg`**/PowerShell over the
> GUI — they're repeatable and reviewable.

## Part 4 — Back up before you change (always)

The registry has **no undo**, and a bad value can prevent boot. So **export the key
first**:

```powershell
# PowerShell / reg: export a key to a .reg file before editing
reg export "HKCU\Software\BoteraLab" "$env:USERPROFILE\BoteraLab-backup.reg" /y
# ...make your change...
# Restore if needed:
reg import "$env:USERPROFILE\BoteraLab-backup.reg"
```

In `regedit`: right-click the key → **Export** (saves a `.reg` file); double-click a
`.reg` to import. For system-wide safety, a **System Restore point** or a full backup
protects against a change that breaks boot.

> [!IMPORTANT]
> **Never edit the registry without exporting the key (or a restore point) first.** A
> single wrong value under HKLM can make Windows unbootable, and there's no recycle
> bin. The professional rhythm: **export → change → test → keep the backup until
> you're sure**. Treat HKLM edits with the same caution you'd give `rm -rf` in Linux.

## Part 5 — Useful registry locations

Keys admins genuinely touch (browse, don't blindly change):

```text
HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion     # OS version/build info
HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Run    # programs that auto-start (all users)
HKCU\Software\Microsoft\Windows\CurrentVersion\Run    # auto-start (current user)
HKLM\SYSTEM\CurrentControlSet\Services                # service configuration
HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall   # installed programs
HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment  # system env vars
```

> [!TIP]
> The **`...\Run` keys** are a top stop for two tasks: finding what launches at login
> (performance/startup cleanup) and **malware investigation** (persistence often
> lives here). Listing both the HKLM and HKCU `Run` keys is a quick "what auto-starts
> on this machine?" check — the Windows analog to auditing systemd-enabled services
> and cron jobs.

## Hands-on lab

> Use a Windows VM. We confine edits to **HKCU** (per-user, low risk) and always back
> up first.

```powershell
# 1. Read system info from the registry
Get-ItemProperty 'HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion' |
  Select-Object ProductName, DisplayVersion, CurrentBuild

# 2. Browse a key (auto-start programs for this user)
Get-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run' 2>$null

# 3. Create a safe test key under HKCU — but EXPORT first if it existed
reg export "HKCU\Software\BoteraLab" "$env:TEMP\BoteraLab.reg" /y 2>$null
New-Item 'HKCU:\Software\BoteraLab' -Force | Out-Null
New-ItemProperty 'HKCU:\Software\BoteraLab' -Name 'Mode' -Value 'test' -PropertyType String -Force | Out-Null
New-ItemProperty 'HKCU:\Software\BoteraLab' -Name 'Enabled' -Value 1 -PropertyType DWord -Force | Out-Null

# 4. Read your values back (note the types)
Get-ItemProperty 'HKCU:\Software\BoteraLab' | Select-Object Mode, Enabled

# 5. Modify, then clean up entirely
Set-ItemProperty 'HKCU:\Software\BoteraLab' -Name 'Enabled' -Value 0
Remove-Item 'HKCU:\Software\BoteraLab' -Recurse

# 6. Compare reg.exe vs PowerShell for the same read
reg query "HKLM\SOFTWARE\Microsoft\Windows NT\CurrentVersion" /v ProductName
```

## Exercises

1. Read the OS `ProductName`, `DisplayVersion`, and build number from
   `HKLM\...\Windows NT\CurrentVersion` with both PowerShell and `reg query`.
2. List the auto-start programs from both the HKLM and HKCU `...\Run` keys and explain
   the difference between them.
3. Create a test key under `HKCU:\Software\YourName` with one `REG_SZ` and one
   `REG_DWORD` value, read them back, then delete the key.
4. Export a key to a `.reg` file before editing it, then describe how you'd restore
   it.
5. Explain when a setting belongs under HKLM vs HKCU, with an example of each.

## Troubleshooting

- **A registry tweak "did nothing"** — wrong **type** (e.g. string where a DWORD was
  needed), wrong **hive** (HKCU vs HKLM), or it requires a sign-out/reboot. *Fix:*
  match the documented type/path; re-login or restart.
- **Access denied editing a key** — it's under HKLM (or protected). *Fix:* run
  elevated; some keys need ownership/permission changes (do cautiously).
- **System broke after an edit** — no backup. *Fix:* restore from the exported `.reg`
  or a System Restore point; **always export first** going forward.
- **Change applies to you but not other users** — you edited HKCU. *Fix:* put
  machine-wide settings under HKLM.
- **Can't find a config "file"** — Windows config is in the registry, not text. *Fix:*
  search the registry (`regedit` → Find), or the docs for the key path.

Reproduce the type gotcha: create a value as `REG_SZ` where the app expects
`REG_DWORD` (1) — the feature stays off; recreate it as DWORD `1` and it works,
proving type matters.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Run the practical items.

1. What is the registry, and what's its Linux analog?
2. Name the five root keys; which two do you use most and what does each scope?
3. Distinguish keys from values; what does a value have?
4. Name three common value types and a use for each.
5. How do you read/write the registry from PowerShell?
6. What must you always do before editing a key, and why?
7. Where do auto-start programs live, and why do admins check it?
8. When does a setting belong under HKLM vs HKCU?
9. **Practical:** read the OS ProductName from the registry.
10. **Practical:** create and then delete a test value under HKCU (after exporting).

## Solutions & validation

1. A central **hierarchical configuration database** for the OS/apps; analogous to
   Linux's text config under **`/etc`** (but centralized).
2. HKLM, HKCU, HKU, HKCR, HKCC; most-used: **HKLM** (machine-wide/all users) and
   **HKCU** (current user).
3. **Keys** are containers (like folders); **values** hold data and have a **name,
   type, and data**.
4. Any three: **REG_SZ** (string), **REG_DWORD** (32-bit number/flag), **REG_BINARY**,
   **REG_MULTI_SZ**, **REG_EXPAND_SZ** — with a fitting use.
5. Via the `HKLM:`/`HKCU:` **PSDrives** with `Get/Set/New/Remove-ItemProperty`
   (or `reg query/add/delete`).
6. **Export the key (or make a restore point)** — the registry has no undo and a bad
   value can break boot.
7. The `...\CurrentVersion\Run` keys (HKLM and HKCU); to audit startup items and
   investigate **malware persistence**.
8. **HKLM** for machine-wide/all-users settings (needs admin); **HKCU** for per-user.
9. **Validation:** `Get-ItemPropertyValue 'HKLM:\SOFTWARE\Microsoft\Windows NT\
   CurrentVersion' -Name ProductName`.
10. **Validation:** `New-Item`/`New-ItemProperty` under `HKCU:\Software\...` then
    `Remove-Item ... -Recurse` (with a prior `reg export`).

> [!TIP]
> Treat the registry like production config: **know HKLM vs HKCU, match the value
> type, and export before you edit.** Those three habits let you confidently tune
> Windows in ways the GUI never exposes — and recover instantly if a change goes
> wrong.

## What's next

Next: **Lesson 603 — Users, Groups & UAC.** Windows identity and privilege: local
users and groups, **SIDs**, the Administrators group, and **User Account Control** —
the Windows take on the least-privilege and elevation model you know from Linux's
users, groups and `sudo`.
