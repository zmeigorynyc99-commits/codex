---
title: "Windows Server & AD — Group Policy"
slug: "winserver-group-policy"
track: "windows-server-ad"
trackName: "Windows Server & Active Directory"
module: "Active Directory"
order: 704
level: "Advanced"
difficulty: "Advanced"
distribution: "Windows"
category: "Windows Administration"
tags: [group-policy, gpo, active-directory, lsdou, gpresult, advanced]
cover: "/covers/curriculum/windows-server-ad.svg"
estMinutes: 55
status: "published"
summary: "Configure thousands of users and computers centrally. What GPOs control, linking to sites/domains/OUs, the processing order (LSDOU) and inheritance, enforcement and security filtering, and troubleshooting with gpupdate and gpresult — the enterprise scale-up of configuration management."
seoTitle: "Windows Server & AD 4: Group Policy (GPOs, LSDOU, gpresult)"
seoDescription: "Advanced Windows: Group Policy Objects, linking to OUs, LSDOU processing order, inheritance/enforcement, security filtering, and gpupdate/gpresult troubleshooting. Lab + assessment."
---

**Group Policy** is how a Windows enterprise enforces configuration on thousands of
machines and users from one place — password rules, security settings, drive mappings,
software, desktop lockdowns, and far more. It's one of AD's most powerful features and
a frequent source of "why is this setting applied?" confusion. This **Advanced**
lesson makes Group Policy clear: what GPOs do, **how they're linked and processed**
(the all-important **LSDOU** order and inheritance), how to scope them precisely, and
how to **troubleshoot** with `gpresult`.

## Learning objectives

By the end of this lesson you will be able to:

- Explain what a **GPO** controls (Computer vs User configuration).
- **Link** GPOs to sites, domains, and OUs.
- Apply the **LSDOU** processing order and inheritance rules.
- Use **Enforced**, **Block Inheritance**, and **security filtering**.
- Troubleshoot with **`gpupdate`** and **`gpresult`**.

## Part 1 — What a GPO is

A **Group Policy Object (GPO)** is a collection of settings, edited in the **Group
Policy Management Console** (`gpmc.msc`) and the GP editor. Each GPO has two halves:

- **Computer Configuration** — applies to **computers** (at boot and refresh),
  regardless of who logs in. E.g. password policy, services, firewall, security
  options.
- **User Configuration** — applies to **users** (at logon and refresh), wherever they
  log in. E.g. drive maps, desktop/Start settings, app restrictions.

Settings are **Policies** (enforced, greyed-out in the UI, reverted if the GPO is
removed) or **Preferences** (set initial values the user can change). Policy refresh
happens at **boot/logon** and roughly **every 90 minutes** in the background.

```powershell
Get-GPO -All | Select-Object DisplayName, GpoStatus, ModificationTime    # list GPOs
Get-GPOReport -Name "Default Domain Policy" -ReportType Html -Path .\ddp.html
```

## Part 2 — Linking and scope

A GPO does nothing until it's **linked** to a container. GPOs link at three levels:

- **Site** — rarely used (physical/AD site).
- **Domain** — applies to everything in the domain (e.g. the **Default Domain Policy**
  with the password policy).
- **OU** — the workhorse: link a GPO to an OU and it applies to the users/computers in
  that OU (and child OUs).

```powershell
New-GPO -Name "Staff Desktop Lockdown" |
  New-GPLink -Target "OU=Staff,DC=botera,DC=local"
Get-GPInheritance -Target "OU=Staff,DC=botera,DC=local"   # what applies here
```

> [!TIP]
> **OU links are where most real Group Policy lives.** Because GPOs apply to the
> objects in the linked OU, your **OU design (Lesson 702) directly shapes policy
> targeting** — put computers/users in OUs that match the policies they should get.
> Keep the **Default Domain Policy** for domain-wide essentials (password/account
> policy) and use **separate, well-named GPOs linked to OUs** for everything else, so
> the policy set is readable.

## Part 3 — Processing order: LSDOU

When multiple GPOs apply, they process in a specific order, and **later overrides
earlier** for conflicting settings. The order is **LSDOU**:

```text
Local  →  Site  →  Domain  →  OU (parent → child)
(weakest)                              (strongest, wins conflicts)
```

So a setting in a GPO linked to the **deepest OU** beats a conflicting one at the
domain level — **the closest GPO to the object wins**. Within a single OU with
multiple linked GPOs, **link order** decides (lower link-order number = higher
priority).

> [!IMPORTANT]
> **LSDOU, and "closest wins."** Local first, then Site, Domain, and OUs from parent to
> child — with each later stage **overriding** conflicts from earlier ones. This is the
> single most important Group Policy rule: when two GPOs disagree, the one linked
> **nearest the object** (deepest OU, then link order) takes effect. Most "why is this
> setting what it is?" puzzles are answered by walking LSDOU.

## Part 4 — Enforced, Block Inheritance, and filtering

Three controls bend the default flow — use them sparingly:

- **Enforced** (on a link) — this GPO's settings **cannot be overridden** by GPOs
  later in LSDOU (it wins even against deeper OUs) and **can't be blocked**. Use for
  non-negotiable settings (e.g. security baselines).
- **Block Inheritance** (on an OU) — stops GPOs from **higher** levels (domain/parent
  OUs) from applying to this OU. (An **Enforced** GPO still applies despite a block.)
- **Security filtering** — by default a GPO applies to **Authenticated Users**; you can
  scope it to specific **users/groups/computers** so only they receive it. **WMI
  filters** can target by attributes (e.g. only laptops).

```powershell
Set-GPLink -Name "Security Baseline" -Target "OU=Servers,DC=botera,DC=local" -Enforced Yes
# Security filtering: apply a GPO only to a group
Set-GPPermission -Name "Staff Desktop Lockdown" -TargetName "Authenticated Users" -TargetType Group -PermissionLevel None
Set-GPPermission -Name "Staff Desktop Lockdown" -TargetName "Staff" -TargetType Group -PermissionLevel GpoApply
```

> [!IMPORTANT]
> **Use Enforced/Block Inheritance sparingly** — they're exactly what makes Group
> Policy hard to reason about. Every override and block is a special case that future
> admins (and `gpresult`) must untangle. Prefer a **clean OU + link design** where the
> default LSDOU flow produces the right result; reserve Enforced for true must-apply
> baselines and Block Inheritance for genuinely isolated OUs.

## Part 5 — Troubleshooting: gpupdate and gpresult

When policy isn't what you expect, two tools tell the truth:

```powershell
gpupdate /force                 # re-apply policy now (don't wait for the 90-min cycle)
gpresult /r                     # SUMMARY: which GPOs applied/denied to user+computer
gpresult /h report.html         # full HTML report (the Resultant Set of Policy)
gpresult /scope computer /v     # verbose, computer settings only
```

`gpresult` shows the **Resultant Set of Policy (RSoP)** — exactly which GPOs were
**applied**, which were **filtered out** (and why), and the **winning** value for a
setting. It answers "why did/didn't this apply to this user on this machine?"
definitively. The **Group Policy Modeling/Results** wizard in GPMC does the same with a
GUI.

## Hands-on lab

> Use a lab domain. Create test GPOs/OUs you can delete; don't edit the Default Domain
> Policy.

```powershell
Import-Module GroupPolicy, ActiveDirectory

# 1. List GPOs and see what applies to an OU
Get-GPO -All | Select-Object DisplayName, GpoStatus | Sort-Object DisplayName
Get-GPInheritance -Target "OU=Staff,DC=botera,DC=local"   # adjust OU to your lab

# 2. Create and link a test GPO to a test OU
New-ADOrganizationalUnit -Name "GPLab" -Path "DC=botera,DC=local" -ProtectedFromAccidentalDeletion $false -ErrorAction SilentlyContinue
$g = New-GPO -Name "Lab Test Policy"
New-GPLink -Name "Lab Test Policy" -Target "OU=GPLab,DC=botera,DC=local"
Get-GPInheritance -Target "OU=GPLab,DC=botera,DC=local"

# 3. Set a simple registry-based policy value (demo) and report it
Set-GPRegistryValue -Name "Lab Test Policy" -Key "HKCU\Software\BoteraLab" -ValueName "Enabled" -Type DWord -Value 1
Get-GPOReport -Name "Lab Test Policy" -ReportType Html -Path "$env:TEMP\labgpo.html"

# 4. Troubleshooting tools (run on a client in the OU)
gpupdate /force
gpresult /r
# gpresult /h "$env:TEMP\rsop.html"

# 5. Clean up
Remove-GPLink -Name "Lab Test Policy" -Target "OU=GPLab,DC=botera,DC=local"
Remove-GPO -Name "Lab Test Policy"
Remove-ADOrganizationalUnit "OU=GPLab,DC=botera,DC=local" -Recursive -Confirm:$false
```

## Exercises

1. List all GPOs and show which ones are linked to a given OU (`Get-GPInheritance`).
2. Create a test GPO and link it to a test OU; confirm the link with PowerShell.
3. Explain the LSDOU order and, given a conflict between a domain GPO and a deep-OU
   GPO, state which value wins and why.
4. Describe what **Enforced** and **Block Inheritance** do, and why to use them
   sparingly.
5. On a client, run `gpresult /r` and identify which GPOs applied and any that were
   filtered out.

## Troubleshooting

- **A setting isn't applying** — wrong scope/link, LSDOU override, filtering, or not
  refreshed. *Fix:* `gpupdate /force`; `gpresult /r` to see applied/denied GPOs and the
  winner; check the OU link and security filtering.
- **An unexpected setting IS applied** — a higher/closer GPO. *Fix:* walk **LSDOU**;
  `gpresult /h` shows the winning GPO for the setting.
- **A GPO is ignored despite a link** — security filtering excludes the user/computer,
  or a WMI filter doesn't match. *Fix:* check `Set-GPPermission`/WMI filter; add the
  principal to the filter.
- **Block Inheritance hid a required policy** — *Fix:* mark the required GPO link
  **Enforced** (it applies despite blocks), or remove the block.
- **Policy applies slowly** — 90-min cycle. *Fix:* `gpupdate /force` for immediate;
  reboot/re-logon applies boot/logon-time policies.

Reproduce LSDOU: link a GPO setting "X=1" at the domain and "X=2" on a deep OU, run
`gpresult` on an object in that OU — **X=2 wins** (closest), proving the order.

## Assessment

**Passing requirement: at least 9 of 11 correct (≈82%) — this is an Advanced lesson.**

1. What two halves does a GPO have, and when does each apply?
2. What does it mean to "link" a GPO, and at which three levels?
3. State the LSDOU processing order and which wins a conflict.
4. Within one OU with multiple GPOs, what breaks the tie?
5. What does **Enforced** do? What does **Block Inheritance** do?
6. What is security filtering, and what's the default?
7. Which command forces a policy refresh? Which shows the resultant set?
8. Why use Enforced/Block Inheritance sparingly?
9. What's a "Policy" vs a "Preference"?
10. **Practical:** show which GPOs apply to an OU.
11. **Practical:** run a resultant-set report on a client.

## Solutions & validation

1. **Computer Configuration** (applies to computers at boot/refresh) and **User
   Configuration** (applies to users at logon/refresh).
2. Associating a GPO with a container so it applies; levels: **Site, Domain, OU**.
3. **Local → Site → Domain → OU (parent→child)**; later (closer) overrides — the GPO
   **nearest the object** wins.
4. **Link order** (lower number = higher priority).
5. **Enforced** = can't be overridden by later GPOs or blocked; **Block Inheritance** =
   stops higher-level GPOs from applying to that OU.
6. Scoping a GPO to specific **users/groups/computers**; default is **Authenticated
   Users** (everyone).
7. `gpupdate /force` refreshes; `gpresult` (`/r` or `/h`) shows the **RSoP**.
8. They create special cases that make policy hard to reason about/troubleshoot.
9. **Policy** = enforced/managed (reverts if removed); **Preference** = sets an initial
   value the user can change.
10. **Validation:** `Get-GPInheritance -Target "OU=..."`.
11. **Validation:** `gpresult /h report.html` (or `/r`).

> [!TIP]
> Group Policy mastery = **clean OU design + clear, well-named GPOs + LSDOU ("closest
> wins") + `gpresult` to verify.** Resist Enforced/Block Inheritance unless truly
> needed, and let `gpresult` end every "why is this set?" debate with the actual
> resultant policy.

## What's next

Next: **Lesson 705 — DNS & DHCP on Windows Server.** The network services AD depends
on: **AD-integrated DNS** (zones, the SRV records that locate domain controllers,
secure dynamic updates) and **DHCP** (scopes, reservations, options) on Windows Server —
tying the networking track's concepts to the Windows infrastructure that runs them.
