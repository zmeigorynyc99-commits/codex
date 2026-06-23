---
title: "Windows Server & AD — Managing Users, Groups & Computers"
slug: "winserver-managing-ad-users-groups-computers"
track: "windows-server-ad"
trackName: "Windows Server & Active Directory"
module: "Active Directory"
order: 703
level: "Intermediate"
difficulty: "Intermediate"
distribution: "Windows"
category: "Windows Administration"
tags: [active-directory, users, groups, computers, powershell, intermediate]
cover: "/covers/curriculum/windows-server-ad.svg"
estMinutes: 55
status: "published"
summary: "The daily AD work. Create and manage users, the group scopes (Domain Local, Global, Universal) and the AGDLP strategy, join computers to the domain, and do it all efficiently — including bulk operations — with the ActiveDirectory PowerShell module."
seoTitle: "Windows Server & AD 3: Manage AD Users, Groups (AGDLP) & Computers"
seoDescription: "Intermediate Windows: manage AD users, group scopes (Domain Local/Global/Universal), the AGDLP strategy, computer/domain join, and bulk ops with the AD PowerShell module. Lab + assessment."
---

With the AD model in hand, this lesson is the **daily craft**: creating and managing
**users**, getting **groups** right (the scopes and the **AGDLP** strategy that keeps
permissions sane at scale), and joining **computers** to the domain. The professional
tool is the **ActiveDirectory PowerShell module** — it turns repetitive console
clicking into fast, repeatable, **bulk** operations.

## Learning objectives

By the end of this lesson you will be able to:

- Create and manage **AD users** with PowerShell and ADUC.
- Explain **group types** and **scopes** (Domain Local, Global, Universal).
- Apply the **AGDLP** strategy for assigning permissions.
- Join **computers** to the domain.
- Perform **bulk** user/group operations.

## Part 1 — Managing users

The GUI is **Active Directory Users and Computers** (`dsa.msc`, ADUC); the scalable
way is the **ActiveDirectory** PowerShell module (`Import-Module ActiveDirectory`):

```powershell
# Create a user (in a specific OU), enabled, with a password
$pw = Read-Host -AsSecureString "Password"
New-ADUser -Name "Alex Smith" -GivenName Alex -Surname Smith `
  -SamAccountName "asmith" -UserPrincipalName "asmith@botera.local" `
  -Path "OU=Engineering,OU=Staff,DC=botera,DC=local" `
  -AccountPassword $pw -Enabled $true -ChangePasswordAtLogon $true

# Find and inspect
Get-ADUser -Identity asmith -Properties Department, MemberOf, LastLogonDate
Get-ADUser -Filter "Department -eq 'Engineering'" | Select-Object Name, SamAccountName

# Modify, reset password, enable/disable, move, remove
Set-ADUser asmith -Department "Engineering" -Title "Engineer"
Set-ADAccountPassword asmith -Reset -NewPassword (Read-Host -AsSecureString "New")
Disable-ADAccount asmith ; Enable-ADAccount asmith
Move-ADObject (Get-ADUser asmith).DistinguishedName -TargetPath "OU=Sales,OU=Staff,DC=botera,DC=local"
Remove-ADUser asmith
```

`SamAccountName` is the classic logon name (`DOMAIN\asmith`); `UserPrincipalName`
(`asmith@botera.local`) is the modern email-style logon. `-Path` puts the user in the
right **OU** (Lesson 702) so policy and delegation apply.

## Part 2 — Group types and scopes

AD groups have a **type** and a **scope**:

- **Type**: **Security** groups (used to assign **permissions** — what you almost
  always want) vs **Distribution** groups (email lists only, no permissions).
- **Scope** controls **where members can come from** and **where the group can be
  used**:

| Scope | Members can be from | Can be used (granted permissions) | Use for |
|-------|--------------------|-----------------------------------|---------|
| **Global** | the **same domain** | **anywhere in the forest** | grouping **users by role** (e.g. "Engineering") |
| **Domain Local** | **anywhere** (any domain/forest) | only in **its own domain** | granting **access to a resource** |
| **Universal** | **anywhere in the forest** | anywhere in the forest | cross-domain grouping (uses the global catalog) |

```powershell
New-ADGroup -Name "Engineering" -GroupScope Global -GroupCategory Security -Path "OU=Staff,DC=botera,DC=local"
New-ADGroup -Name "RES_FileShare_Modify" -GroupScope DomainLocal -GroupCategory Security -Path "OU=Groups,DC=botera,DC=local"
Add-ADGroupMember -Identity "Engineering" -Members asmith
Get-ADGroupMember -Identity "Engineering"
```

## Part 3 — AGDLP: the permission strategy

How do scopes fit together? The Microsoft best practice is **AGDLP**:

```text
Accounts → Global groups → Domain Local groups → Permissions
   (A)         (G)              (DL)                 (P)
```

- Put **A**ccounts (users) into **G**lobal groups by **role** (e.g. `Engineering`).
- Put those Global groups into **D**omain **L**ocal groups created **per resource**
  (e.g. `RES_ProjectShare_Modify`).
- Grant the **P**ermission on the resource to the **Domain Local** group.

So: `asmith` → `Engineering` (Global) → `RES_ProjectShare_Modify` (Domain Local) →
**Modify** on the share's NTFS ACL.

> [!IMPORTANT]
> **AGDLP keeps permissions maintainable at scale.** You grant resource permissions to
> **role-based Global groups via resource Domain Local groups** — never to individual
> users on the ACL. To give someone access, you add them to a role group; to change
> what a role can do, you adjust one Domain Local group's permission. This is the AD
> embodiment of the "use groups, not per-user permissions" rule you learned for both
> Linux and NTFS — and it's a classic exam/interview topic.

## Part 4 — Joining computers to the domain

A computer must **join the domain** to be managed by it (Group Policy, domain logons).
Joining creates a **computer account** in AD (with its own SID/password, in a chosen
OU):

```powershell
# On the client (needs domain admin or delegated rights), then reboot:
Add-Computer -DomainName "botera.local" -OUPath "OU=Workstations,DC=botera,DC=local" -Restart -Credential (Get-Credential)

# On the server side: see/pre-create/manage computer accounts
Get-ADComputer -Filter * | Select-Object Name, DistinguishedName, Enabled
New-ADComputer -Name "WS-042" -Path "OU=Workstations,DC=botera,DC=local"   # pre-stage
```

Once joined, users log in with **domain** credentials on that machine, and **Group
Policy** (Lesson 704) applies based on the OU the computer sits in.

> [!TIP]
> **Pre-staging** computer accounts (creating them in the right OU before the machine
> joins) lets the correct Group Policy and delegation apply from the first boot, and
> lets you delegate domain-join rights without handing out broad admin. Placing
> computers in the **right OU** is what makes "this laptop gets the staff policy, that
> server gets the server policy" work.

## Part 5 — Bulk operations

The real payoff of PowerShell: do hundreds of operations from a CSV or filter:

```powershell
# Bulk-create users from a CSV (columns: Name, Sam, OU, Dept)
Import-Csv users.csv | ForEach-Object {
    New-ADUser -Name $_.Name -SamAccountName $_.Sam `
      -UserPrincipalName "$($_.Sam)@botera.local" -Path $_.OU `
      -Department $_.Dept -Enabled $true `
      -AccountPassword (ConvertTo-SecureString "Temp-P@ss1!" -AsPlainText -Force) `
      -ChangePasswordAtLogon $true
}

# Bulk membership / reporting
Get-ADUser -Filter "Department -eq 'Sales'" | Add-ADGroupMember -Identity "Sales" -Members { $_ }
Get-ADUser -Filter * -Properties LastLogonDate |
  Where-Object { $_.LastLogonDate -lt (Get-Date).AddDays(-90) } |
  Select-Object Name, LastLogonDate         # find stale accounts to disable
```

> [!TIP]
> Bulk-from-CSV is how onboarding/offboarding is really done — HR exports a sheet, a
> script creates the accounts in the right OUs and groups. And reporting filters
> (`Get-ADUser -Filter ... | Where LastLogonDate`) surface **stale accounts** to
> disable — a security and hygiene win. This is exactly the automation mindset from
> the Bash/Python tracks, applied to AD.

## Hands-on lab

> Use a lab domain (a DC VM). All changes are in a test OU you can delete.

```powershell
Import-Module ActiveDirectory

# 1. Create a test OU, a global role group, and a domain-local resource group
New-ADOrganizationalUnit -Name "LabTest" -Path "DC=botera,DC=local" -ProtectedFromAccidentalDeletion $false -ErrorAction SilentlyContinue
New-ADGroup -Name "Lab-Engineering" -GroupScope Global -GroupCategory Security -Path "OU=LabTest,DC=botera,DC=local"
New-ADGroup -Name "RES_Lab_Modify"  -GroupScope DomainLocal -GroupCategory Security -Path "OU=LabTest,DC=botera,DC=local"

# 2. Create a user and apply AGDLP nesting
$pw = ConvertTo-SecureString "Temp-P@ss1!" -AsPlainText -Force
New-ADUser -Name "Lab User1" -SamAccountName "labuser1" -Path "OU=LabTest,DC=botera,DC=local" -AccountPassword $pw -Enabled $true
Add-ADGroupMember -Identity "Lab-Engineering" -Members "labuser1"        # A -> G
Add-ADGroupMember -Identity "RES_Lab_Modify"  -Members "Lab-Engineering" # G -> DL
Get-ADGroupMember "RES_Lab_Modify"; Get-ADGroupMember "Lab-Engineering"

# 3. Inspect, modify, and report
Get-ADUser labuser1 -Properties MemberOf | Select-Object Name, DistinguishedName, MemberOf
Set-ADUser labuser1 -Department "Engineering" -Title "Engineer"

# 4. Computers
Get-ADComputer -Filter * -ResultSetSize 5 | Select-Object Name, Enabled

# 5. Clean up the lab
Remove-ADUser labuser1 -Confirm:$false
Remove-ADGroup "Lab-Engineering" -Confirm:$false
Remove-ADGroup "RES_Lab_Modify"  -Confirm:$false
Remove-ADOrganizationalUnit "OU=LabTest,DC=botera,DC=local" -Recursive -Confirm:$false
```

## Exercises

1. Create an AD user in a specific OU with a UPN, forced to change password at logon,
   then find them by department filter.
2. Create a **Global** "role" group and a **Domain Local** "resource" group; nest the
   Global into the Domain Local (the G→DL step of AGDLP).
3. Explain AGDLP in your own words and why permissions are never granted to individual
   users directly.
4. Show how you'd join a computer to the domain and place it in the Workstations OU.
5. Write a one-liner that finds users who haven't logged on in 90+ days (stale
   accounts).

## Troubleshooting

- **`New-ADUser`/`Get-AD*` not found** — module not loaded. *Fix:* `Import-Module
  ActiveDirectory` (install RSAT-AD-PowerShell).
- **"Access denied" creating objects** — insufficient rights in that OU. *Fix:* use a
  delegated/admin account; check OU delegation.
- **Can't add a Global group to another domain's resource** — scope rules. *Fix:* use
  **Domain Local** (or **Universal**) groups to grant cross-domain resource access
  (follow AGDLP).
- **Computer joined but no policy applies** — wrong OU, or replication/GP latency.
  *Fix:* place the computer in the correct OU; `gpupdate /force`; verify replication.
- **Password set fails policy** — domain password policy. *Fix:* meet complexity/length
  requirements (Lesson 706).

Reproduce AGDLP: add a user to a **Global** group, the Global group to a **Domain
Local** group, and (conceptually) grant the Domain Local group access to a resource —
then changing the user's access is just group membership, never an ACL edit.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).**

1. Which cmdlet creates an AD user, and what do SamAccountName and UPN represent?
2. What's the difference between a Security and a Distribution group?
3. Describe the three group scopes and a use for each.
4. What does AGDLP stand for, and what does each step do?
5. Why never grant resource permissions to individual users?
6. What happens when a computer joins the domain, and why does its OU matter?
7. Why pre-stage computer accounts?
8. How would you bulk-create users, and how do you find stale accounts?
9. **Practical:** create a user in an OU and add them to a group.
10. **Practical:** list AD computers.

## Solutions & validation

1. `New-ADUser`; **SamAccountName** = classic `DOMAIN\user` logon, **UPN** = email-
   style `user@domain` logon.
2. **Security** groups assign **permissions**; **Distribution** groups are email-only
   (no permissions).
3. **Global** (members from same domain, usable forest-wide — group users by role);
   **Domain Local** (members from anywhere, usable in its domain — grant resource
   access); **Universal** (forest-wide members and use).
4. **A**ccounts → **G**lobal → **D**omain **L**ocal → **P**ermission: users into role
   Global groups, those into resource Domain Local groups, permission granted to the
   Domain Local group.
5. It's unmaintainable at scale; group-based assignment means access changes are just
   **membership** changes.
6. A **computer account** is created (managed by the domain); its **OU** determines
   which **Group Policy** and delegation apply.
7. So the correct **GPO/delegation** applies from first boot and domain-join rights can
   be delegated narrowly.
8. **Import-Csv | ForEach New-ADUser**; find stale via `Get-ADUser -Properties
   LastLogonDate | Where LastLogonDate -lt (Get-Date).AddDays(-90)`.
9. **Validation:** `New-ADUser ... -Path "OU=..."` then `Add-ADGroupMember`.
10. **Validation:** `Get-ADComputer -Filter *`.

> [!TIP]
> Daily AD = **users in the right OU**, **groups via AGDLP** (role Global → resource
> Domain Local → permission), **computers in the right OU**, and **PowerShell for bulk
> and reporting**. Master that and you administer thousands of objects as easily as a
> handful.

## What's next

Next: **Lesson 704 — Group Policy.** How you configure thousands of users and computers
centrally: GPOs and what they control, linking to sites/domains/OUs, processing order
(**LSDOU**) and inheritance, security filtering, and `gpupdate`/`gpresult` — the
enterprise scale-up of the configuration management you've practiced by hand.
