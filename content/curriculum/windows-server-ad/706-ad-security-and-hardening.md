---
title: "Windows Server & AD — AD Security & Hardening"
slug: "winserver-ad-security-and-hardening"
track: "windows-server-ad"
trackName: "Windows Server & Active Directory"
module: "Securing & Operating AD"
order: 706
level: "Senior"
difficulty: "Senior"
distribution: "Windows"
category: "Windows Administration"
tags: [active-directory, security, hardening, tiering, backup, senior]
cover: "/covers/curriculum/windows-server-ad.svg"
estMinutes: 60
status: "published"
summary: "Protect the directory that protects everything else. Password and account-lockout policy, controlling privileged groups and the admin-tiering model, securing domain controllers, auditing, and — critically — backing up and recovering Active Directory, including the Directory Services Restore Mode and tombstone reanimation."
seoTitle: "Windows Server & AD 6: Active Directory Security, Hardening & Backup"
seoDescription: "Senior Windows: AD password/lockout policy, privileged-group control, admin tiering, DC hardening, auditing, and AD backup/recovery (DSRM, authoritative restore). Lab + assessment."
---

Active Directory is the **keys to the kingdom** — compromise it and an attacker owns
every machine and account. This **Senior** capstone covers protecting it: strong
**password/account policy**, tight control of **privileged groups** and the **admin-
tiering** model, **hardening domain controllers**, **auditing**, and — the part too
many neglect — **backing up and recovering AD**. Securing the directory that
authenticates everything is one of the highest-impact responsibilities in any Windows
environment. It completes the Windows Server & AD track.

## Learning objectives

By the end of this lesson you will be able to:

- Configure **password** and **account-lockout** policy (and fine-grained policies).
- Control **privileged groups** (Domain/Enterprise Admins) and apply **tiering**.
- **Harden** domain controllers and admin practices.
- Enable **auditing** of key directory events.
- **Back up** and **recover** Active Directory (DSRM, authoritative restore).

## Part 1 — Password and account policy

The domain's **password policy** (in the **Default Domain Policy**, Computer
Configuration) sets the baseline for all accounts:

- **Minimum length** and **complexity** (and avoid forced frequent expiry per modern
  guidance — long passphrases + breach detection over 30-day rotation).
- **Account lockout** — lock after N bad attempts for a duration, to blunt brute force
  (the AD equivalent of fail2ban).

```powershell
Get-ADDefaultDomainPasswordPolicy
# Fine-Grained Password Policies (PSOs) let you set STRONGER policy for specific groups
New-ADFineGrainedPasswordPolicy -Name "AdminPSO" -Precedence 10 -MinPasswordLength 16 `
  -ComplexityEnabled $true -LockoutThreshold 5
Add-ADFineGrainedPasswordPolicySubject "AdminPSO" -Subjects "Domain Admins"
```

> [!IMPORTANT]
> One password policy is domain-wide via the Default Domain Policy, but
> **Fine-Grained Password Policies (PSOs)** let you require **stronger** passwords for
> **privileged** accounts (e.g. 16+ char for Domain Admins) than for regular users.
> Combined with **account lockout**, this is your first line against credential
> attacks. Don't weaken the default policy to please users; raise the bar for admins.

## Part 2 — Privileged groups and tiering

The most dangerous groups in AD:

- **Domain Admins** — full control of the domain.
- **Enterprise Admins** — full control of the **forest** (even more dangerous).
- **Schema Admins**, **Administrators**, **Backup Operators**, etc.

The core discipline: **minimize membership** and **separate duties**:

- Keep **Domain/Enterprise Admins membership tiny** and audited; remove standing
  members you don't need (Enterprise Admins should usually be **empty** except when
  needed).
- Admins use **separate privileged accounts** for admin work — never their daily-driver
  account, and never browse the web/read email from a privileged account.
- **Admin Tiering** (Tier 0/1/2): **Tier 0** = identity/DCs (the crown jewels), **Tier
  1** = servers, **Tier 2** = workstations. **Credentials never flow downward to up** —
  a Tier 0 admin never logs into a Tier 2 workstation (where credentials could be
  stolen), preventing an attacker who owns a workstation from harvesting domain-admin
  credentials.

> [!IMPORTANT]
> **Credential theft is the #1 path to domain compromise.** An attacker who lands on a
> workstation tries to harvest cached/privileged credentials and escalate to Domain
> Admin. **Tiering** stops this: privileged credentials are **never used on lower-tier
> machines**, so they can't be stolen there. Practically: separate admin accounts,
> Privileged Access Workstations for Tier 0, no internet/email from admin accounts, and
> as few standing Domain/Enterprise Admins as possible. This single principle blocks
> most real-world AD attacks.

## Part 3 — Hardening domain controllers

DCs are **Tier 0** — protect them accordingly:

- **Physical/virtual security** — a stolen DC (or its disk/VM) is the whole domain.
  Encrypt, restrict access.
- **Minimal footprint** — DCs should run **only** AD/DNS roles (use **Server Core**);
  no extra software, no browsing, no general-purpose use.
- **Patch promptly** — DCs are the highest-value target.
- **Restrict logon** — only Tier 0 admins log on to DCs; deny everyone else via policy.
- **Disable legacy/insecure protocols** (e.g. SMBv1, NTLMv1 where possible; prefer
  Kerberos).
- **Secure the built-in Administrator / use LAPS** for local admin passwords on member
  machines so they're unique and rotated.

```powershell
Get-ADGroupMember "Domain Admins" | Select-Object Name        # audit who has the keys
Get-ADGroupMember "Enterprise Admins"
```

## Part 4 — Auditing

You can't detect what you don't log. Enable **audit policy** (via GPO, Advanced Audit
Policy) for the events that matter, and review them (forward to a SIEM ideally):

- **Logon/logoff** — successful and **failed** logons (4624/4625), Kerberos.
- **Account management** — user/group creation, deletion, membership changes
  (4720/4726/4732/4756).
- **Directory service changes** — modifications to AD objects.
- **Privilege use** — sensitive privilege assignments.

```powershell
# Review on a DC: recent account-management and failed-logon events (Lesson 606 skills)
Get-WinEvent -FilterHashtable @{ LogName='Security'; Id=4625 } -MaxEvents 20
Get-WinEvent -FilterHashtable @{ LogName='Security'; Id=4728,4732,4756 } -MaxEvents 20  # added to a group
```

> [!TIP]
> Audit **privileged-group changes** especially: an unexpected addition to **Domain
> Admins** (event 4728/4756) is exactly what you want to catch fast. Forward Security
> logs from DCs to a central **SIEM** (the central-logging idea from Lesson 210) so a
> compromised DC can't simply erase the evidence locally. Detection + central logs turn
> "we were breached months ago" into "we caught it in hours."

## Part 5 — Backup and recovery of AD

AD is too important to lose, and replication won't save you from a **logical** disaster
(a mass deletion replicates to every DC). You need real backups:

- **System State backup** (Windows Server Backup) of a DC includes AD, SYSVOL, and the
  registry — back up DCs regularly and test restores.
- **Directory Services Restore Mode (DSRM)** — a special boot mode (with its own DSRM
  admin password) for offline AD repair/restore.
- **Authoritative restore** — after restoring from backup, mark restored objects
  **authoritative** (`ntdsutil`) so they **replicate back out** to other DCs (overriding
  the deletion). A non-authoritative restore would just get re-deleted by replication.
- **AD Recycle Bin** — when enabled, lets you **undelete** objects with their
  attributes intact (far easier than tombstone reanimation), within the deleted-object
  lifetime.

```powershell
# Enable the AD Recycle Bin (forest feature; irreversible — do it deliberately)
Enable-ADOptionalFeature 'Recycle Bin Feature' -Scope ForestOrConfigurationSet -Target (Get-ADForest).Name
# Restore a deleted user from the Recycle Bin
Get-ADObject -Filter 'Deleted -eq $true -and Name -like "*Alex*"' -IncludeDeletedObjects |
  Restore-ADObject
```

> [!IMPORTANT]
> **Replication is not backup.** If someone deletes an OU full of users, that deletion
> **replicates to every DC** — your "redundant" DCs all agree the objects are gone. Real
> protection is **System State backups + the AD Recycle Bin**, and knowing the
> **authoritative restore** procedure for the worst case. Enable the **AD Recycle Bin**
> now (it's free and turns accidental deletions into a one-line `Restore-ADObject`), and
> **test a restore** before you need it — an untested backup is a guess.

## Hands-on lab

> Use a lab domain you can safely modify. Don't run authoritative restores against
> production.

```powershell
Import-Module ActiveDirectory

# 1. Review the password policy and privileged-group membership
Get-ADDefaultDomainPasswordPolicy | Select-Object MinPasswordLength, ComplexityEnabled, LockoutThreshold, LockoutDuration
Get-ADGroupMember "Domain Admins"     | Select-Object Name, objectClass
Get-ADGroupMember "Enterprise Admins" | Select-Object Name, objectClass   # ideally empty

# 2. Create a Fine-Grained Password Policy for admins (stronger)
New-ADFineGrainedPasswordPolicy -Name "LabAdminPSO" -Precedence 50 -MinPasswordLength 16 -ComplexityEnabled $true -LockoutThreshold 5 -ErrorAction SilentlyContinue
Get-ADFineGrainedPasswordPolicy -Filter * | Select-Object Name, MinPasswordLength, LockoutThreshold

# 3. Audit: recent privileged-group changes and failed logons (on a DC)
Get-WinEvent -FilterHashtable @{ LogName='Security'; Id=4625 } -MaxEvents 10 -ErrorAction SilentlyContinue
Get-WinEvent -FilterHashtable @{ LogName='Security'; Id=4728,4756 } -MaxEvents 10 -ErrorAction SilentlyContinue

# 4. AD Recycle Bin: is it enabled? (a key recoverability feature)
Get-ADOptionalFeature 'Recycle Bin Feature' | Select-Object Name, EnabledScopes

# 5. Demonstrate recoverability in a lab: delete a test user, then restore it
New-ADUser -Name "LabDelMe" -SamAccountName "labdelme" -Path "DC=botera,DC=local" -Enabled $false -ErrorAction SilentlyContinue
Remove-ADUser "labdelme" -Confirm:$false
Get-ADObject -Filter 'Deleted -eq $true -and Name -like "*LabDelMe*"' -IncludeDeletedObjects | Restore-ADObject -ErrorAction SilentlyContinue
Get-ADUser "labdelme" -ErrorAction SilentlyContinue   # back (if Recycle Bin is enabled)
Remove-ADUser "labdelme" -Confirm:$false -ErrorAction SilentlyContinue

# 6. Clean up the lab PSO
Remove-ADFineGrainedPasswordPolicy "LabAdminPSO" -Confirm:$false -ErrorAction SilentlyContinue
```

## Exercises

1. Review the default domain password and lockout policy and state two ways you'd
   strengthen protection for admin accounts.
2. List the members of Domain Admins and Enterprise Admins, and explain why Enterprise
   Admins is usually kept empty.
3. Explain the admin-tiering model and how it prevents credential theft from escalating.
4. Name four hardening measures for domain controllers.
5. Explain why "replication is not backup," and describe how you'd recover from a mass
   accidental deletion (Recycle Bin and/or authoritative restore).

## Troubleshooting

- **Brute-force / password-spray against accounts** — *Fix:* account **lockout** policy,
  **stronger admin PSOs**, and monitor **4625** bursts; consider smart lockout/MFA.
- **Too many standing Domain Admins** — large attack surface. *Fix:* remove unneeded
  members; use **separate admin accounts** and just-in-time access; empty Enterprise
  Admins when idle.
- **A workstation compromise led to domain takeover** — credential theft across tiers.
  *Fix:* implement **tiering** (no privileged logon on lower-tier machines), PAWs, LAPS.
- **Accidental mass deletion** — *Fix:* **AD Recycle Bin** (`Restore-ADObject`) if
  enabled, else **authoritative restore** from a System State backup; enable the Recycle
  Bin now to prevent the next one.
- **Can't restore — no backups** — *Fix:* there's no shortcut; institute regular
  **System State** backups of DCs and **test restores**.

Reproduce recoverability: in a lab, delete a test user and `Restore-ADObject` it from
the Recycle Bin — a one-line recovery that proves why enabling the Recycle Bin (and
testing it) matters before a real incident.

## Assessment

**Passing requirement: at least 9 of 11 correct (≈82%) — the capstone.**

1. Where is the domain password policy set, and what do Fine-Grained Password Policies
   add?
2. What is account lockout, and what attack does it blunt?
3. Why is Enterprise Admins more dangerous than Domain Admins?
4. What is admin tiering, and what attack does it prevent?
5. Give four ways to harden a domain controller.
6. Why use separate admin accounts and never browse/email from them?
7. Which audit events reveal privileged-group changes and failed logons?
8. Why is "replication is not backup" true for AD?
9. What is an authoritative restore, and what does the AD Recycle Bin do?
10. **Practical:** show Domain Admins membership and the password policy.
11. **Practical:** demonstrate restoring a deleted object (lab).

## Solutions & validation

1. The **Default Domain Policy** (domain-wide); **PSOs** apply **stronger** policy to
   specific groups (e.g. admins).
2. Locking an account after N failed attempts for a period; blunts **brute-force/
   password-guessing**.
3. It controls the **entire forest** (all domains), not just one domain.
4. Tier 0/1/2 separation where **privileged credentials are never used on lower-tier
   machines**, preventing **credential theft** from escalating to domain compromise.
5. Any four: **Server Core/minimal roles, prompt patching, restrict logon to Tier 0,
   physical/VM security, disable legacy protocols (SMBv1/NTLMv1), LAPS for local admin**.
6. To **limit credential exposure** — a daily account that browses/email is far more
   likely to be phished/compromised; admin power should be isolated.
7. **4728/4732/4756** (added to a group) and **4625** (failed logon).
8. A **logical deletion replicates** to all DCs, so redundant DCs don't protect against
   accidental/malicious deletion — you need real backups.
9. **Authoritative restore** marks restored objects so they **replicate back out**
   (overriding the deletion); the **AD Recycle Bin** lets you **undelete** objects with
   attributes intact via `Restore-ADObject`.
10. **Validation:** `Get-ADGroupMember "Domain Admins"` and
    `Get-ADDefaultDomainPasswordPolicy`.
11. **Validation:** delete a lab user, then `Get-ADObject -IncludeDeletedObjects ... |
    Restore-ADObject` brings it back.

> [!TIP]
> 🎉 That completes the **Windows Server & Active Directory** track. You can stand up
> Server roles, build and manage a domain, target configuration with Group Policy, run
> the DNS/DHCP that AD depends on, and **secure and recover** the directory itself — the
> core skill set for enterprise Windows and the AZ-800/801 certifications.

## What's next

The roadmap continues with the cross-platform automation shell that ties Windows and
beyond together — **PowerShell** as a full scripting language — and then the DevOps and
cloud tracks (Git, Docker, Kubernetes, CI/CD, IaC, cloud). Your AD and Windows Server
skills become things you can automate, secure, and integrate into modern pipelines.
