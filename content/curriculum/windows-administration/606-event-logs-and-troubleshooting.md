---
title: "Windows Administration — Event Logs & Troubleshooting"
slug: "windows-admin-event-logs-and-troubleshooting"
track: "windows-administration"
trackName: "Windows Administration"
module: "Operating Windows"
order: 606
level: "Intermediate"
difficulty: "Intermediate"
distribution: "Windows"
category: "Windows Administration"
tags: [windows, event-log, event-viewer, troubleshooting, get-winevent, intermediate]
cover: "/covers/curriculum/windows-administration.svg"
estMinutes: 50
status: "published"
summary: "Where Windows records what happened. The Event Viewer and its logs (System, Application, Security), reading and filtering events with PowerShell (Get-WinEvent), event IDs and levels, and a practical troubleshooting workflow — the Windows counterpart to journalctl and /var/log."
seoTitle: "Windows Administration 6: Event Logs, Event Viewer & Get-WinEvent"
seoDescription: "Intermediate Windows: the Event Viewer logs (System/Application/Security), filtering with Get-WinEvent, event IDs and levels, and a troubleshooting workflow — the journalctl analog. Lab + assessment."
---

When something goes wrong on Windows, the **Event Log** holds the answer — it's the
journalctl/`/var/log` of Windows. This lesson teaches you to read it efficiently:
the **Event Viewer** and its main logs, filtering events with PowerShell's
**`Get-WinEvent`**, understanding **event IDs** and **levels**, and a repeatable
troubleshooting workflow. Reading logs well is the difference between guessing and
diagnosing, on any OS — this is the Windows version of that skill, and it completes
the Windows Administration track.

## Learning objectives

By the end of this lesson you will be able to:

- Navigate the **Event Viewer** and the main logs.
- Read and **filter** events with **`Get-WinEvent`** (and `Get-EventLog`).
- Interpret **levels** and **event IDs**.
- Investigate **security** events (logons, account changes).
- Apply a **troubleshooting workflow** using events.

## Part 1 — The Event Viewer and its logs

**Event Viewer** (`eventvwr.msc`) organizes events into logs. The classic **Windows
Logs**:

| Log | Records |
|-----|---------|
| **System** | OS & driver events — service start/stop, hardware, boot |
| **Application** | events from installed applications |
| **Security** | audit events — logons, privilege use, account/policy changes |
| **Setup** | installation/servicing |
| **Forwarded Events** | events collected from other machines |

Beyond these, **Applications and Services Logs** hold per-component logs (e.g.
PowerShell, Windows Defender, specific roles). Each event has a **source**, an **event
ID**, a **level**, a **timestamp**, and a description.

## Part 2 — Levels and event IDs

Events have a **level** (severity), much like syslog priorities:

| Level | Meaning |
|-------|---------|
| **Critical** | severe failure (e.g. unexpected shutdown) |
| **Error** | a failure (something didn't work) |
| **Warning** | a potential problem |
| **Information** | normal operation (success, status) |
| **Verbose** | detailed trace |

And an **event ID** — a number identifying the *kind* of event from a given source.
Event IDs are gold: they're consistent and searchable. A few worth knowing:

```text
6005 / 6006   System: Event Log service started / stopped (≈ boot / clean shutdown)
6008          System: previous shutdown was UNEXPECTED (crash/power loss)
7000 / 7036   System: a service failed to start / changed state
4624 / 4625   Security: successful / FAILED logon
4720 / 4726   Security: a user account was created / deleted
1000          Application: an application crash (with the faulting module)
```

> [!TIP]
> **Search by event ID** — pairing a source with an ID (e.g. "Event ID 4625 security
> failed logon") is the fastest way to find what an event means and how to fix it.
> `6008` (unexpected shutdown) instantly tells you a box crashed rather than rebooting
> cleanly; `4625` storms reveal a brute-force attempt. Learn the handful above and
> you'll diagnose common issues at a glance.

## Part 3 — Reading logs with PowerShell

The GUI is fine for browsing; **`Get-WinEvent`** is the powerful, scriptable way (it
reads both classic and modern logs):

```powershell
# Recent System events
Get-WinEvent -LogName System -MaxEvents 20 |
  Select-Object TimeCreated, Id, LevelDisplayName, ProviderName, Message | Format-Table -Wrap

# Filter efficiently with a hashtable (fast — filters at the source)
Get-WinEvent -FilterHashtable @{ LogName='System'; Level=2; StartTime=(Get-Date).AddDays(-1) }
#   Level: 1=Critical 2=Error 3=Warning 4=Information

# Errors and worse in the last hour
Get-WinEvent -FilterHashtable @{ LogName='System'; Level=1,2; StartTime=(Get-Date).AddHours(-1) }

# A specific event ID (failed logons)
Get-WinEvent -FilterHashtable @{ LogName='Security'; Id=4625 } -MaxEvents 10

# Service state changes
Get-WinEvent -FilterHashtable @{ LogName='System'; Id=7036 } -MaxEvents 10 |
  Select-Object TimeCreated, Message
```

```powershell
# The older Get-EventLog (classic logs only) — simpler syntax, still common
Get-EventLog -LogName System -EntryType Error -Newest 10
```

> [!IMPORTANT]
> Prefer **`Get-WinEvent -FilterHashtable`** over piping everything to
> `Where-Object`. The hashtable filters at the **log provider** (efficient, even on
> huge logs), whereas `Get-WinEvent -LogName System | Where-Object ...` reads
> *everything* into memory first and is painfully slow. This is the Windows analog of
> `journalctl -p err --since` filtering at the source rather than `journalctl | grep`.

## Part 4 — Security events and auditing

The **Security** log (requires admin to read) records who did what — invaluable for
incident response (and a key reason to ship logs centrally):

```powershell
# Failed logons (brute force / wrong passwords) — last 20
Get-WinEvent -FilterHashtable @{ LogName='Security'; Id=4625 } -MaxEvents 20 |
  Select-Object TimeCreated, @{n='Account';e={$_.Properties[5].Value}}

# Successful logons
Get-WinEvent -FilterHashtable @{ LogName='Security'; Id=4624 } -MaxEvents 10

# Account management: created (4720) / deleted (4726) / added to a group (4732)
Get-WinEvent -FilterHashtable @{ LogName='Security'; Id=4720,4726,4732 } -MaxEvents 10
```

A burst of **4625** from one source = a password-guessing attempt (the Windows
equivalent of reading `auth.log` for SSH failures). **4720/4726/4732** track account
and privilege changes — exactly what you review after a suspected compromise.

## Part 5 — A troubleshooting workflow

Use events methodically (the same layered, evidence-based mindset as Linux):

1. **Reproduce/note the time** of the problem.
2. **Start with System** (OS/service issues) or **Application** (app crashes) around
   that time, filtered to **Error/Critical**.
3. **Read the event** — source, event ID, and the description (which often names the
   exact cause/module).
4. **Search the event ID + source** for known fixes.
5. **Correlate** across logs (e.g. a service 7000 error in System + an Application
   1000 crash) to build the timeline.
6. For security concerns, check the **Security** log (4625/4624/4720…).

```powershell
# "What went wrong in the last hour?" one-liner
Get-WinEvent -FilterHashtable @{ LogName='System','Application'; Level=1,2;
  StartTime=(Get-Date).AddHours(-1) } |
  Sort-Object TimeCreated | Select-Object TimeCreated, Id, ProviderName, LevelDisplayName
```

## Hands-on lab

```powershell
# 1. Browse recent System events
Get-WinEvent -LogName System -MaxEvents 15 |
  Select-Object TimeCreated, Id, LevelDisplayName, ProviderName | Format-Table

# 2. Efficient filtering: errors in the last day
Get-WinEvent -FilterHashtable @{ LogName='System'; Level=2; StartTime=(Get-Date).AddDays(-1) } |
  Select-Object TimeCreated, Id, ProviderName, Message | Format-Table -Wrap

# 3. Boot/shutdown story (clean vs unexpected)
Get-WinEvent -FilterHashtable @{ LogName='System'; Id=6005,6006,6008 } -MaxEvents 10 |
  Select-Object TimeCreated, Id, Message

# 4. Service state changes
Get-WinEvent -FilterHashtable @{ LogName='System'; Id=7036 } -MaxEvents 8 |
  Select-Object TimeCreated, Message

# 5. Security: failed logons (needs admin)
Get-WinEvent -FilterHashtable @{ LogName='Security'; Id=4625 } -MaxEvents 10 -ErrorAction SilentlyContinue |
  Select-Object TimeCreated, Message

# 6. The "last hour, errors only" cross-log query
Get-WinEvent -FilterHashtable @{ LogName='System','Application'; Level=1,2;
  StartTime=(Get-Date).AddHours(-1) } -ErrorAction SilentlyContinue |
  Select-Object TimeCreated, Id, ProviderName | Format-Table
# Compare with the GUI: eventvwr.msc
```

## Exercises

1. Show the 15 most recent System events with their time, ID, level, and source.
2. Use `Get-WinEvent -FilterHashtable` to list only **Error** events from the last 24
   hours, and explain why this is faster than `Where-Object`.
3. Find the last boot and the last shutdown (event IDs 6005/6006), and check whether
   any shutdown was **unexpected** (6008).
4. List recent service state-change events (7036) and identify a service that stopped.
5. (Admin) Show recent failed logons (4625) and describe how a burst of them would
   indicate an attack.

## Troubleshooting

- **Don't know why a service failed** — *Fix:* filter **System** for Error around the
  time and the service's source (7000/7031/7034); read the description.
- **App crashed** — *Fix:* **Application** log, Error/Critical, event ID **1000**; the
  faulting module is named in the event.
- **Box rebooted on its own** — *Fix:* check **6008** (unexpected shutdown) and the
  events just before it (driver/hardware/critical) to find the cause.
- **`Get-WinEvent` is slow / huge output** — you filtered with `Where-Object`. *Fix:*
  use **`-FilterHashtable`** to filter at the source.
- **Can't read the Security log** — needs elevation. *Fix:* run PowerShell **as
  administrator**.

Reproduce efficient filtering: compare `Get-WinEvent -LogName System | Where-Object
Level -eq 2` (slow, reads all) with `Get-WinEvent -FilterHashtable @{LogName='System';
Level=2}` (fast, filtered at source) — same result, very different speed.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Run the practical items.

1. What is the Event Log the Windows equivalent of?
2. Name the three main Windows Logs and what each records.
3. What is an event ID, and why is it useful?
4. List the event levels from most to least severe.
5. Which cmdlet reads events, and how do you filter efficiently?
6. What do event IDs 6008, 4625, and 7036 indicate?
7. Why prefer `-FilterHashtable` over `Where-Object`?
8. Where do you look for who logged on or changed an account?
9. **Practical:** show the last 10 System errors from the past day.
10. **Practical:** check whether the last shutdown was unexpected.

## Solutions & validation

1. Linux's **`journalctl` / `/var/log`** (the system's record of what happened).
2. **System** (OS/drivers/services), **Application** (apps), **Security** (logons/
   audit).
3. A number identifying the **kind** of event from a source; it's consistent and
   **searchable**, so it pinpoints meaning/fixes.
4. **Critical → Error → Warning → Information → Verbose.**
5. **`Get-WinEvent`**; filter efficiently with **`-FilterHashtable`** (LogName/Level/
   Id/StartTime).
6. **6008** = unexpected shutdown (crash); **4625** = failed logon; **7036** = a
   service changed state.
7. `-FilterHashtable` filters at the **provider** (fast, even on huge logs);
   `Where-Object` reads everything into memory first (slow).
8. The **Security** log (4624/4625 logons, 4720/4726/4732 account changes) — needs
   admin.
9. **Validation:** `Get-WinEvent -FilterHashtable @{LogName='System';Level=2;
   StartTime=(Get-Date).AddDays(-1)} -MaxEvents 10`.
10. **Validation:** `Get-WinEvent -FilterHashtable @{LogName='System';Id=6008}` —
    any results mean an unexpected shutdown occurred.

> [!TIP]
> 🎉 That completes the **Windows Administration** track. You can navigate the OS
> model, the registry, identity/UAC, NTFS permissions, services/processes, and the
> event logs — a working Windows-admin foundation that mirrors your Linux skills and
> sets up the Windows Server & Active Directory track next.

## What's next

Next track: **Windows Server & Active Directory.** You'll move from single machines to
the enterprise — Windows Server roles, the **Active Directory** domain model (domains,
forests, OUs, domain controllers), managing users/groups/computers at scale, **Group
Policy**, and the core network services (DNS/DHCP) that AD depends on.
