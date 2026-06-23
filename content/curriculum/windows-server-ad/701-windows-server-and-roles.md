---
title: "Windows Server & AD — Windows Server & Roles"
slug: "winserver-windows-server-and-roles"
track: "windows-server-ad"
trackName: "Windows Server & Active Directory"
module: "Windows Server"
order: 701
level: "Intermediate"
difficulty: "Intermediate"
distribution: "Windows"
category: "Windows Administration"
tags: [windows-server, roles, features, server-manager, server-core, intermediate]
cover: "/covers/curriculum/windows-server-ad.svg"
estMinutes: 50
status: "published"
summary: "Step up from single machines to the enterprise. How Windows Server differs from desktop Windows, editions and licensing basics, roles vs features, installing and managing them with Server Manager and PowerShell, Server Core vs Desktop Experience, and remote management."
seoTitle: "Windows Server & AD 1: Windows Server, Roles & Features"
seoDescription: "Intermediate Windows Server: editions, roles vs features, Server Manager and Install-WindowsFeature, Server Core vs Desktop Experience, and remote management. Lab + assessment."
---

You can administer a single Windows machine — now you'll learn the platform that runs
the enterprise: **Windows Server**. This track covers Server fundamentals and
**Active Directory**, the identity system that ties an organization's machines and
users together. This first lesson orients you: how Server differs from the desktop,
the **roles and features** model that turns a base OS into a domain controller, web
server or file server, and the tools (**Server Manager**, **PowerShell**) and install
options (**Server Core** vs Desktop Experience) you'll use.

## Learning objectives

By the end of this lesson you will be able to:

- Explain how **Windows Server** differs from desktop Windows.
- Distinguish **roles** from **features**.
- Install/remove roles with **Server Manager** and **PowerShell**.
- Choose between **Server Core** and **Desktop Experience**.
- Manage servers **remotely**.

## Part 1 — Windows Server vs desktop Windows

Windows Server shares the same kernel and many tools as Windows 10/11, but it's built
to be a **server**:

- **Roles & scale** — designed to host services (AD, DNS, DHCP, IIS, file shares) for
  many clients, with no per-device client limits.
- **Stability over features** — long support lifecycles; fewer consumer apps; updates
  managed for predictability.
- **Management at scale** — Server Manager, PowerShell remoting, and (in domains)
  Group Policy manage many servers centrally.
- **Editions** — commonly **Standard** (most workloads) and **Datacenter** (high
  virtualization/advanced features); licensing is typically **per physical core**.
  (Don't get bogged down in licensing now — know it's core-based.)

You administer it the same PowerShell-first way you learned in the Windows
Administration track; the difference is **what** it runs and that it's usually a
**domain controller or member server**, not a personal machine.

## Part 2 — Roles vs features

This distinction is fundamental:

- A **role** is a **primary function** the server provides to the network — e.g.
  **Active Directory Domain Services (AD DS)**, **DNS Server**, **DHCP Server**, **Web
  Server (IIS)**, **File and Storage Services**, **Hyper-V**.
- A **feature** is a **supporting capability** that augments the server or a role —
  e.g. **.NET Framework**, **Failover Clustering**, **Windows Backup**, **SMB tools**,
  the **GUI management consoles** (RSAT).

A server becomes a "domain controller" by **installing the AD DS role** (then
promoting it); a "web server" by installing the **IIS role**. Features are the extras
those roles or admins need.

```powershell
Get-WindowsFeature | Where-Object Installed                 # what's installed
Get-WindowsFeature | Where-Object Name -like "*DNS*"        # search by name
```

## Part 3 — Installing roles: Server Manager and PowerShell

**Server Manager** is the GUI dashboard: "Add Roles and Features" wizard, server
status, and event/role summaries. But for repeatability, **PowerShell** is the
professional path:

```powershell
# Install a role/feature (and its management tools)
Install-WindowsFeature -Name DNS -IncludeManagementTools
Install-WindowsFeature -Name AD-Domain-Services -IncludeManagementTools
Install-WindowsFeature -Name Web-Server -IncludeManagementTools

# Verify, then remove if needed
Get-WindowsFeature -Name DNS
Uninstall-WindowsFeature -Name Web-Server
```

> [!TIP]
> Always add **`-IncludeManagementTools`** when installing a role — otherwise you get
> the role's service but not the consoles/cmdlets to manage it. And prefer
> **PowerShell** (`Install-WindowsFeature`) over the GUI wizard for anything you'll
> repeat or document: it's scriptable, reviewable, and the basis of automated server
> builds (and later, configuration-as-code with DSC/Ansible).

## Part 4 — Server Core vs Desktop Experience

At install you choose an interface option:

- **Desktop Experience** — the full GUI (desktop, Server Manager, consoles). Easier
  to learn; larger footprint and attack surface.
- **Server Core** — **no desktop GUI**; managed via PowerShell, remote tools, and a
  minimal command line. Smaller footprint, **fewer updates/reboots**, smaller attack
  surface — the **recommended** default for production infrastructure roles.

```powershell
# On Server Core you manage locally with PowerShell and remotely with RSAT/Windows
# Admin Center. sconfig provides a basic menu for initial setup.
```

> [!IMPORTANT]
> **Server Core is preferred for production** — less to patch, fewer reboots, smaller
> attack surface — exactly the "minimal install" philosophy of a hardened Linux
> server (no desktop on a server). You manage it **remotely** (RSAT consoles, Windows
> Admin Center, PowerShell remoting) rather than logging into a GUI. Use Desktop
> Experience for learning or roles that genuinely need a local GUI.

## Part 5 — Remote management

You rarely sit at a server's console. Manage from your workstation:

- **RSAT** (Remote Server Administration Tools) — the management consoles (ADUC, DNS,
  DHCP, etc.) installed on your admin machine, pointed at remote servers.
- **PowerShell Remoting** — run commands/sessions on remote servers (the Windows
  `ssh` equivalent), over **WinRM**:
  ```powershell
  Enter-PSSession -ComputerName SRV01            # interactive remote session
  Invoke-Command -ComputerName SRV01,SRV02 -ScriptBlock { Get-Service DNS }   # fan-out
  ```
  (Windows Server also supports **OpenSSH** now, so `ssh` works too.)
- **Windows Admin Center** — a modern browser-based console for managing many servers.

> [!TIP]
> **PowerShell Remoting** (`Invoke-Command -ComputerName ...`) is the workhorse for
> managing fleets — run one command across many servers at once, just like a parallel
> SSH loop in Linux. Combined with **Server Core** (no local GUI) and RSAT consoles on
> your desk, this is how real environments are administered: centrally, scriptably,
> without RDP-ing into each box.

## Hands-on lab

> Use a Windows Server VM (an evaluation ISO works). Some steps need a fresh lab box.

```powershell
# 1. What roles/features are installed?
Get-WindowsFeature | Where-Object Installed | Select-Object Name, DisplayName | Format-Table

# 2. Search for roles you'll use later
Get-WindowsFeature | Where-Object Name -match 'AD-Domain|DNS|DHCP|Web-Server' |
  Select-Object Name, DisplayName, Installed

# 3. Install a role WITH its tools (DNS is safe/standalone for a lab)
Install-WindowsFeature -Name DNS -IncludeManagementTools
Get-WindowsFeature -Name DNS

# 4. Remote management basics (if you have a second box / WinRM enabled)
# Invoke-Command -ComputerName SRV01 -ScriptBlock { Get-WindowsFeature | ? Installed | select Name }
# Enter-PSSession -ComputerName SRV01   # exit with: Exit-PSSession

# 5. Clean up the lab role
Uninstall-WindowsFeature -Name DNS
```

## Exercises

1. List all installed roles and features on your server, and separately search for the
   AD DS, DNS, DHCP, and IIS features.
2. Install the **DNS** role with its management tools using PowerShell, verify it's
   installed, then uninstall it.
3. Explain the difference between a **role** and a **feature**, with two examples of
   each.
4. Compare **Server Core** and **Desktop Experience**: list two advantages of Server
   Core for production.
5. Describe two ways to manage a remote Windows Server and give the cmdlet for running
   a command on multiple servers at once.

## Troubleshooting

- **Installed a role but can't manage it** — missing tools. *Fix:* reinstall with
  `-IncludeManagementTools` (or add the RSAT feature).
- **A role install wants a reboot** — some do (e.g. after AD DS promotion). *Fix:* plan
  a maintenance window; `Install-WindowsFeature -Restart` where appropriate.
- **Can't remotely manage a server** — WinRM not enabled / firewall. *Fix:*
  `Enable-PSRemoting` on the target; allow WinRM through the firewall; ensure name
  resolution.
- **GUI not available on Server Core** — by design. *Fix:* manage with PowerShell/RSAT/
  Windows Admin Center remotely.
- **Licensing confusion** — *Fix:* know it's typically **per-core**, Standard vs
  Datacenter; consult the specifics when actually purchasing.

Reproduce role discovery: `Get-WindowsFeature | ? Name -like '*AD*'` lists the AD-
related roles/features (AD DS, AD CS, AD LDS…), showing how a base server becomes a
domain controller by **adding the AD DS role**.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).**

1. How does Windows Server differ from desktop Windows?
2. What's the difference between a role and a feature?
3. Give two examples of roles and two of features.
4. Which cmdlet installs a role, and why add `-IncludeManagementTools`?
5. What is Server Core, and why is it preferred for production?
6. Name two remote-management options for Windows Server.
7. Which cmdlet runs a command on several servers at once?
8. What makes a base server into a domain controller?
9. **Practical:** list installed roles/features.
10. **Practical:** install and then remove the DNS role.

## Solutions & validation

1. It's built to **host services for many clients** (roles, scale, stability, central
   management) rather than be a personal machine.
2. A **role** is a primary server **function** (AD DS, DNS, IIS); a **feature** is a
   **supporting capability** (.NET, Failover Clustering, backup, RSAT tools).
3. Roles: any two of AD DS, DNS, DHCP, IIS, Hyper-V, File Services; features: any two
   of .NET, Failover Clustering, Windows Backup, RSAT.
4. `Install-WindowsFeature`; `-IncludeManagementTools` adds the **consoles/cmdlets** to
   manage the role.
5. A **GUI-less** install managed remotely/by PowerShell — **smaller footprint, fewer
   updates/reboots, smaller attack surface** for production.
6. Any two: **RSAT** consoles, **PowerShell Remoting** (WinRM), **Windows Admin
   Center**, **RDP**, OpenSSH.
7. `Invoke-Command -ComputerName ...`.
8. Installing the **AD DS role** and **promoting** the server to a domain controller.
9. **Validation:** `Get-WindowsFeature | Where-Object Installed`.
10. **Validation:** `Install-WindowsFeature DNS -IncludeManagementTools` then
    `Uninstall-WindowsFeature DNS`.

> [!TIP]
> Think of Windows Server as a **base OS you compose with roles**: install AD DS → a
> domain controller; DNS/DHCP → network services; IIS → web. Do it with **PowerShell**
> for repeatability, run **Server Core** in production, and manage **remotely**. That
> mindset scales from one server to a data center.

## What's next

Next: **Lesson 702 — Active Directory Concepts.** The heart of the Windows enterprise:
what AD is, the domain model (domains, trees, forests), **organizational units**,
**domain controllers**, the global catalog and replication — the directory that
centralizes identity and policy for every machine and user in an organization.
