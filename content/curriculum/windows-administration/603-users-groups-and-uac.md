---
title: "Windows Administration — Users, Groups & UAC"
slug: "windows-admin-users-groups-and-uac"
track: "windows-administration"
trackName: "Windows Administration"
module: "Identity & Access"
order: 603
level: "Intermediate"
difficulty: "Intermediate"
distribution: "Windows"
category: "Windows Administration"
tags: [windows, users, groups, uac, sid, security, intermediate]
cover: "/covers/curriculum/windows-administration.svg"
estMinutes: 50
status: "published"
summary: "Windows identity and privilege, mapped to what you know from Linux. Local users and groups, SIDs, the Administrators group, built-in accounts, and User Account Control — the Windows take on least privilege and elevation, managed with PowerShell."
seoTitle: "Windows Administration 3: Users, Groups, SIDs & UAC"
seoDescription: "Intermediate Windows: local users and groups, SIDs, the Administrators group, built-in accounts, and User Account Control (UAC) — managed with PowerShell. Lab + assessment."
---

Windows security, like Linux, is built on **identity** (who you are) and **privilege**
(what you may do). This lesson maps Linux's users/groups/`sudo` model onto Windows:
**local users and groups**, the **SID** (the real identifier behind every name), the
**Administrators** group, built-in accounts, and **User Account Control (UAC)** — the
mechanism that makes you *elevate* deliberately instead of running as full admin all
the time. You'll manage it all with PowerShell.

## Learning objectives

By the end of this lesson you will be able to:

- Manage **local users** and **groups** with PowerShell.
- Explain **SIDs** and why names are just labels.
- Describe the **Administrators** group and built-in accounts.
- Explain **UAC** and the split-token / elevation model.
- Apply **least privilege** on Windows.

## Part 1 — Local users and groups

Windows has **local accounts** (stored on the machine, in the SAM database) and, in
domains, **domain accounts** (Active Directory — the next track). Manage local ones
with the `*-LocalUser` / `*-LocalGroup` cmdlets:

```powershell
Get-LocalUser                          # all local users (like reading /etc/passwd)
Get-LocalGroup                         # all local groups (like /etc/group)
Get-LocalGroupMember -Group Administrators   # who's an admin

# Create / modify / remove a user
New-LocalUser -Name "alex" -Description "Alex" -NoPassword   # (or prompt for a password)
Set-LocalUser -Name "alex" -Password (Read-Host -AsSecureString "Password")
Disable-LocalUser -Name "alex"
Remove-LocalUser -Name "alex"

# Group membership (the privilege lever)
Add-LocalGroupMember    -Group "Administrators" -Member "alex"
Remove-LocalGroupMember -Group "Administrators" -Member "alex"
```

The concepts map cleanly: a **user** is an identity; a **group** grants capabilities;
you give someone admin rights by adding them to the **Administrators** group (the
Windows equivalent of the `sudo`/`wheel` group).

## Part 2 — SIDs: the identity behind the name

Behind every user and group is a **SID** (Security Identifier) — a unique string like
`S-1-5-21-...`. Windows tracks permissions by **SID**, not name; the friendly name is
just a label. This is why a deleted-and-recreated account with the same name **loses
its old permissions** (new SID), and why some built-in identities are referenced by
**well-known SIDs**.

```powershell
Get-LocalUser alex | Select-Object Name, SID
whoami /user                           # your account's SID
whoami /groups                         # the groups (and SIDs) in your token
```

Well-known SIDs to recognize: the built-in **Administrator** ends in `-500`; the
**Administrators** group is `S-1-5-32-544`; **SYSTEM** is `S-1-5-18` (the most
privileged service account — like a super-root for services).

> [!IMPORTANT]
> **Permissions are tied to the SID, not the name.** Renaming a user keeps their
> access (same SID); deleting and recreating a same-named account does **not** (new
> SID) — its files/permissions become orphaned. When you see a raw `S-1-5-...` in an
> ACL where a name should be, it's a SID that can't be resolved (e.g. a deleted
> account or a different machine/domain).

## Part 3 — Built-in accounts and groups

Windows ships with special identities you must know:

- **Administrator** (`-500`) — the built-in superuser (often disabled by default on
  modern Windows; you use a normal admin account instead).
- **Guest** — minimal access, normally disabled (leave it disabled).
- **SYSTEM** (`LocalSystem`) — the account services run as; **more** privileged than
  Administrator locally. You don't log in as SYSTEM; services use it.
- **Administrators** group — full control of the machine.
- **Users** group — standard, limited rights (where normal accounts live).
- Service accounts: **LocalService**, **NetworkService** — limited accounts for
  services that need less than SYSTEM.

> [!TIP]
> On Windows, the most privileged context is **SYSTEM** (what services run as), not
> "Administrator." That's why a compromised service is so dangerous, and why running
> services under **least-privilege** accounts (LocalService/NetworkService or managed
> service accounts) matters — the same principle as not running Linux daemons as root.

## Part 4 — UAC: elevation and the split token

**User Account Control (UAC)** is Windows' answer to "don't run as admin all the
time." Even when you're in the Administrators group, your normal processes run with a
**standard-user token**; admin actions trigger a **UAC prompt** that elevates *that
action* with the admin token. It's conceptually the Windows **`sudo`**.

- A program runs **non-elevated** by default. Right-click → **Run as administrator**
  (or a UAC prompt) elevates it.
- Admins have a **split token**: standard for everyday work, admin available on
  demand — so a stray click or malware doesn't automatically have admin power.
- "Access is denied" on a system change usually means **the process isn't elevated**.

```powershell
# Am I running elevated? (the IsInRole check from Lesson 601)
([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()
  ).IsInRole([Security.Principal.WindowsBuiltinRole]::Administrator)

# Launch an elevated PowerShell (triggers UAC):
Start-Process powershell -Verb RunAs
```

> [!IMPORTANT]
> **Don't disable UAC** — it's the speed-bump that keeps an admin account from
> silently doing destructive/malicious things without your say-so, exactly like
> requiring `sudo`. Run as a **standard user** for daily work and **elevate
> deliberately** for admin tasks. Disabling UAC (a common bad "fix" for nagging
> prompts) removes a core defense and makes every running program admin-capable.

## Part 5 — Least privilege on Windows

The same discipline as Linux, Windows vocabulary:

- Give people **standard (Users) accounts**; add to **Administrators** only those who
  genuinely need it (and ideally a *separate* admin account, not their daily one).
- Run services under **least-privilege** accounts, not SYSTEM, where possible.
- Keep **Guest** and the built-in **Administrator** disabled.
- Audit membership: `Get-LocalGroupMember Administrators` regularly.

```powershell
# Audit: who has admin on this box?
Get-LocalGroupMember -Group "Administrators"
# Is the built-in Administrator disabled (good)?
Get-LocalUser -Name "Administrator" | Select-Object Name, Enabled
```

## Hands-on lab

> Use a Windows VM where you can create/remove accounts safely.

```powershell
# 1. Inspect identity and privilege
Get-LocalUser | Select-Object Name, Enabled
Get-LocalGroupMember -Group "Administrators"
whoami /user; whoami /groups | Select-Object -First 5

# 2. Create a standard user, then grant and revoke admin
$pw = ConvertTo-SecureString "P@ssw0rd-Lab!" -AsPlainText -Force
New-LocalUser -Name "labuser" -Password $pw -Description "lab" -PasswordNeverExpires
Get-LocalUser labuser | Select-Object Name, SID, Enabled
Add-LocalGroupMember    -Group "Administrators" -Member "labuser"
Get-LocalGroupMember Administrators | Where-Object Name -like "*labuser*"
Remove-LocalGroupMember -Group "Administrators" -Member "labuser"

# 3. SIDs: yours and the built-ins
whoami /user
Get-LocalUser "Administrator" | Select-Object Name, SID, Enabled    # note -500, likely disabled

# 4. UAC: check elevation
([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()
  ).IsInRole([Security.Principal.WindowsBuiltinRole]::Administrator)

# 5. Clean up
Remove-LocalUser -Name "labuser"
```

## Exercises

1. List all local users and which are enabled, and show the current members of the
   Administrators group.
2. Create a standard local user, display its SID, then add it to Administrators and
   remove it again.
3. Find your own SID and the SID of the built-in Administrators group; identify the
   `-500` and `S-1-5-32-544` well-known SIDs.
4. Explain, with a SID example, why deleting and recreating a same-named account loses
   its permissions.
5. Check whether your current PowerShell session is elevated, then describe what UAC
   is doing for an admin account (split token).

## Troubleshooting

- **"Access is denied" on a system change** — not elevated. *Fix:* run the tool/
  PowerShell **as administrator** (UAC).
- **A user has admin but "can't" do admin things** — their process isn't elevated, or
  UAC is filtering the token. *Fix:* elevate the specific action.
- **An ACL shows a raw `S-1-5-...`** — an unresolved SID (deleted account or foreign
  machine/domain). *Fix:* identify/replace the principal.
- **Recreated account lost access to its files** — new SID. *Fix:* restore from backup
  or re-grant permissions to the new account; avoid delete-recreate for active
  accounts.
- **Someone disabled UAC to stop prompts** — security hole. *Fix:* re-enable UAC;
  address the underlying app needing elevation properly.

Reproduce the SID lesson: `Get-LocalUser <name> | Select SID`, delete and recreate the
user with the same name, and observe a **different** SID — proving names are just
labels over SIDs.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Run the practical items on a
VM.

1. Which cmdlets manage local users and groups?
2. How do you give a user administrative rights on a machine?
3. What is a SID, and why does Windows use it instead of the name?
4. What's special about the SYSTEM account?
5. Name two built-in accounts/groups and their purpose.
6. What is UAC, and how does the split-token model work for admins?
7. What's the Linux analog of UAC elevation?
8. Why shouldn't you disable UAC?
9. **Practical:** show the members of the Administrators group.
10. **Practical:** display your account's SID.

## Solutions & validation

1. `*-LocalUser` and `*-LocalGroup`/`*-LocalGroupMember` cmdlets.
2. Add them to the **Administrators** group (`Add-LocalGroupMember -Group
   Administrators -Member <user>`).
3. A **Security Identifier** uniquely identifying a principal; Windows tracks
   permissions by **SID**, with the name as a changeable label.
4. It's the account **services run as** — locally **more privileged** than
   Administrator (a "super-root" for services).
5. Any two: **Administrator** (built-in superuser, `-500`), **Guest** (minimal,
   disabled), **Administrators** group (full control), **Users** group (standard),
   **SYSTEM/LocalService/NetworkService** (service accounts).
6. **User Account Control** — admins run with a **standard token** by default and
   **elevate** specific actions via a UAC prompt (the admin token), so admin power
   isn't always active.
7. **`sudo`** (deliberate, per-action elevation).
8. It removes a core defense — every program would run admin-capable, like always
   running as root.
9. **Validation:** `Get-LocalGroupMember -Group Administrators`.
10. **Validation:** `whoami /user` (shows your SID).

> [!TIP]
> Same security philosophy, Windows words: **standard accounts for daily work,
> Administrators only when needed, elevate via UAC, least-privilege service
> accounts, and remember permissions follow the SID.** Your Linux least-privilege
> instincts apply directly.

## What's next

Next: **Lesson 604 — NTFS Permissions & File Sharing.** How Windows controls access to
files and folders: NTFS ACLs (allow/deny, the standard rights), inheritance, the
difference between **share** and **NTFS** permissions, and how effective access is
computed — the Windows counterpart to `rwx`/`chmod`/`chown`.
