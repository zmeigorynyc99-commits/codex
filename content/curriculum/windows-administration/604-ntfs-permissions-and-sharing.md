---
title: "Windows Administration — NTFS Permissions & File Sharing"
slug: "windows-admin-ntfs-permissions-and-sharing"
track: "windows-administration"
trackName: "Windows Administration"
module: "Identity & Access"
order: 604
level: "Intermediate"
difficulty: "Intermediate"
distribution: "Windows"
category: "Windows Administration"
tags: [windows, ntfs, permissions, acl, sharing, intermediate]
cover: "/covers/curriculum/windows-administration.svg"
estMinutes: 55
status: "published"
summary: "How Windows controls access to files and folders. NTFS ACLs and the standard rights, allow vs deny, inheritance, the crucial difference between share and NTFS permissions and how they combine, ownership, and computing effective access — the Windows counterpart to rwx/chmod/chown."
seoTitle: "Windows Administration 4: NTFS Permissions, ACLs & Sharing"
seoDescription: "Intermediate Windows: NTFS ACLs and standard rights, allow/deny, inheritance, share vs NTFS permissions and how they combine, ownership, and effective access. Lab + assessment."
---

Linux protects files with `rwx` for owner/group/other; **Windows uses ACLs** — lists
of permission entries that are far more granular. This lesson covers **NTFS
permissions**: the standard rights, **allow vs deny**, **inheritance**, ownership, and
the often-confused interaction between **share permissions** and **NTFS permissions**
when accessing files over the network. Getting this right is the difference between
"403/Access Denied" tickets and a correctly secured file server.

## Learning objectives

By the end of this lesson you will be able to:

- Read an **NTFS ACL** and the standard permission levels.
- Apply **allow** and **deny**, and know which wins.
- Understand **inheritance** and how to break it.
- Distinguish **share** vs **NTFS** permissions and how they **combine**.
- Reason about **effective access** and ownership.

## Part 1 — NTFS permissions and ACLs

Every file and folder on an **NTFS** volume has an **ACL** (Access Control List): a
list of **ACEs** (Access Control Entries), each granting or denying a **principal**
(user/group, by SID) a set of **rights**. The standard, grouped permission levels:

| Level | Lets you… |
|-------|-----------|
| **Read** | view contents and properties |
| **Read & Execute** | read + run programs / traverse folders |
| **Write** | create/modify files |
| **Modify** | read, write, **and delete** |
| **Full Control** | everything, including changing **permissions** and ownership |

```powershell
Get-Acl C:\Data | Format-List                 # the ACL of a folder
(Get-Acl C:\Data).Access | Format-Table IdentityReference, FileSystemRights, AccessControlType, IsInherited
icacls C:\Data                                # the classic, scriptable view
```

Compared with Linux's three identities × `rwx`, NTFS lets you grant **any user/group
any combination of rights** — much finer-grained, but also easier to over-complicate.

## Part 2 — Allow, deny, and precedence

ACEs are either **Allow** or **Deny**. The rules:

- Permissions are **cumulative** — a user gets the **union** of all Allow entries
  that apply to them and their groups.
- **Deny overrides Allow** — an explicit Deny beats any Allow.
- **Explicit beats inherited** — a permission set directly on the object overrides one
  inherited from a parent.

> [!IMPORTANT]
> **Deny wins, but use it sparingly.** Because an explicit Deny overrides every Allow,
> a single Deny on a broad group (like `Users` or `Everyone`) can lock out people you
> didn't intend, and such problems are hard to trace. The cleaner model is to grant
> access by **adding Allow entries to the right groups** and simply **not granting**
> access otherwise — reserve Deny for genuine exceptions ("everyone in this group
> *except* contractors"). This mirrors good firewall design: allow what's needed,
> default-deny by absence.

## Part 3 — Inheritance

By default, a folder's permissions **flow down** to the files and subfolders inside
it (inheritance) — set permissions once on a top folder and everything beneath
inherits them. You can:

- **Inherit** (default) — children get the parent's permissions (`IsInherited = True`).
- **Break inheritance** — stop inheriting, optionally **copying** the current
  permissions or starting blank, to set unique permissions on a subtree.

```powershell
# View whether entries are inherited
(Get-Acl C:\Data).Access | Select-Object IdentityReference, FileSystemRights, IsInherited

# icacls: grant, with inheritance to files+subfolders
icacls C:\Data /grant "Engineering:(OI)(CI)M"     # OI=object inherit, CI=container inherit, M=Modify
icacls C:\Data\Secret /inheritance:r              # remove inheritance (r), keep nothing inherited
icacls C:\Data\Secret /grant "Managers:(OI)(CI)F" # then grant explicitly
```

> [!TIP]
> Design permissions **top-down with groups and inheritance**: grant a *group* the
> right level on a *parent folder* and let it inherit. Break inheritance only where a
> subtree genuinely needs different access. Assigning permissions to **individual
> users** on **deep folders** creates an unmaintainable tangle — the Windows version
> of scattering `chmod`s everywhere instead of using groups.

## Part 4 — Share vs NTFS permissions (the classic confusion)

When a folder is accessed **over the network** (a shared folder, `\\server\share`),
**two** permission sets apply:

- **Share permissions** — apply only to **network** access to the share (Full/
  Change/Read). They don't affect local logon access.
- **NTFS permissions** — apply **always** (local and network), at the file-system
  level.

When both apply (network access), the **most restrictive of the two wins** — the
effective access is the **intersection**.

```text
Share = Read , NTFS = Full Control   -> effective over network = READ
Share = Full , NTFS = Read           -> effective over network = READ
Local access (no share involved)     -> only NTFS applies
```

> [!IMPORTANT]
> The standard best practice: set **share permissions** permissively (e.g.
> `Authenticated Users = Full Control` or `Change`) and control real access with
> **NTFS permissions**. Why? NTFS is finer-grained, applies **both** locally and over
> the network, and inherits cleanly — so managing access in **one** place (NTFS)
> avoids the maddening "I have Full on the share but can't write" puzzles caused by
> two overlapping systems. Remember: **over the network, the more restrictive of
> share vs NTFS wins.**

## Part 5 — Ownership and effective access

Every object has an **owner** (a SID). The owner can **always change permissions** on
the object, even if their ACL access was removed — which is how an admin recovers a
folder no one can access (**take ownership**, then re-grant).

```powershell
(Get-Acl C:\Data).Owner                    # who owns it
takeown /F C:\Data /R                       # take ownership (admin) — recovery tool
icacls C:\Data /reset /T                    # reset to inherited defaults (use carefully)
```

**Effective access** = combine all applicable Allow entries (for the user and their
groups), subtract any Deny, then (for network access) intersect with share
permissions. Windows even has an **Effective Access** tab (folder → Properties →
Security → Advanced) to compute it for a given user — invaluable for "why can/can't
this person access this?"

## Hands-on lab

> Use a Windows VM. We work in `C:\Lab` to avoid touching real data.

```powershell
# 1. Create a folder and look at its ACL
New-Item -ItemType Directory C:\Lab -Force | Out-Null
"secret" | Out-File C:\Lab\file.txt
Get-Acl C:\Lab | Format-List
(Get-Acl C:\Lab).Access | Format-Table IdentityReference, FileSystemRights, AccessControlType, IsInherited

# 2. Grant a group Modify with inheritance, then read it back (icacls)
icacls C:\Lab /grant "Users:(OI)(CI)M"
icacls C:\Lab

# 3. Break inheritance on a subfolder and set unique access
New-Item -ItemType Directory C:\Lab\Private -Force | Out-Null
icacls C:\Lab\Private /inheritance:r
icacls C:\Lab\Private /grant "Administrators:(OI)(CI)F"
icacls C:\Lab\Private

# 4. Ownership and reset
(Get-Acl C:\Lab).Owner
# takeown /F C:\Lab\Private /R    # (recovery demo)
icacls C:\Lab\Private /reset /T

# 5. (Optional) create a share and observe share-vs-NTFS (admin)
# New-SmbShare -Name "LabShare" -Path "C:\Lab" -ChangeAccess "Users"
# Get-SmbShareAccess -Name "LabShare"
# Remove-SmbShare -Name "LabShare" -Force

# 6. Clean up
Remove-Item C:\Lab -Recurse -Force
```

## Exercises

1. Create a folder and display its ACL, listing each entry's identity, rights,
   allow/deny, and whether it's inherited.
2. Grant a group **Modify** on the folder with inheritance to files and subfolders
   using `icacls`, and verify.
3. Create a subfolder, **break inheritance**, and give only Administrators Full
   Control; confirm the subfolder no longer inherits.
4. Explain, with an example, what happens when share permissions = Read but NTFS =
   Full Control for a user accessing over the network.
5. Describe how an admin recovers access to a folder whose ACL excludes everyone
   (ownership), and the command involved.

## Troubleshooting

- **"Access Denied" over the network but fine locally** — **share** permissions are
  more restrictive than NTFS. *Fix:* loosen the share (manage access via NTFS);
  remember the intersection rule.
- **A user can't access despite an Allow** — an explicit **Deny** (often on a group
  they're in) is overriding it. *Fix:* find and remove the Deny; prefer Allow-by-
  group.
- **Subfolder won't take unique permissions** — inheritance is on. *Fix:* break
  inheritance (`icacls ... /inheritance:r`) then grant explicitly.
- **No one (even admins) can access a folder** — ACL excludes everyone. *Fix:* an
  admin **takes ownership** (`takeown`) and re-grants.
- **Permissions are a tangled mess** — per-user entries on deep folders. *Fix:*
  redesign around **groups + inheritance** from a parent.

Reproduce the share-vs-NTFS rule conceptually: share=Read + NTFS=Full → effective
**Read** over the network; the more restrictive layer wins, which is why best practice
keeps the share open and controls access with NTFS.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Run the practical items.

1. What is an NTFS ACL made of, and how is a principal identified?
2. Name the standard NTFS permission levels and what Full Control adds.
3. How do multiple Allow entries combine, and what beats them?
4. What is inheritance, and how do you break it?
5. What's the difference between share and NTFS permissions?
6. When both apply (network access), which wins?
7. What's the recommended best practice for share vs NTFS permissions, and why?
8. How does an owner/admin recover an inaccessible folder?
9. **Practical:** display a folder's ACL with inheritance status.
10. **Practical:** grant a group Modify with inheritance via `icacls`.

## Solutions & validation

1. A list of **ACEs**, each allowing/denying a **principal (by SID)** a set of rights.
2. Read, Read & Execute, Write, Modify, **Full Control** — Full adds changing
   **permissions** and **ownership** (and delete).
3. Allow entries are **cumulative** (union); an explicit **Deny** overrides Allow, and
   **explicit** beats **inherited**.
4. Permissions **flowing from a parent** to children; break it with `icacls ...
   /inheritance:r` (or the Advanced Security dialog).
5. **Share** permissions apply only to **network** access to a shared folder; **NTFS**
   permissions apply **always** (local and network), at the file-system level.
6. The **more restrictive** of the two (the intersection).
7. Keep **share** permissive and control access with **NTFS** — NTFS is finer,
   applies everywhere, and inherits, so access is managed in **one** place.
8. The owner can always change permissions; an admin **takes ownership** (`takeown`)
   and re-grants access.
9. **Validation:** `(Get-Acl C:\Lab).Access | ft IdentityReference, FileSystemRights,
   IsInherited`.
10. **Validation:** `icacls C:\Lab /grant "Users:(OI)(CI)M"`.

> [!TIP]
> The Windows access rules in one breath: **ACLs of Allow/Deny ACEs by group;
> cumulative Allow, Deny wins, explicit over inherited; design top-down with
> inheritance; over the network, the stricter of share/NTFS applies — so manage
> access with NTFS.** That handles the vast majority of file-permission work.

## What's next

Next: **Lesson 605 — Services, Processes & Task Manager.** Keeping a Windows system
healthy: viewing and controlling **services** (the Windows daemons) with the Services
console and PowerShell, inspecting **processes** and resource use, using Task Manager
and Resource Monitor, and startup management — the Windows counterpart to systemd,
`ps` and `top`.
