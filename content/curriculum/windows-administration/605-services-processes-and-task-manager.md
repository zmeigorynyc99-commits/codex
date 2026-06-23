---
title: "Windows Administration — Services, Processes & Task Manager"
slug: "windows-admin-services-processes-task-manager"
track: "windows-administration"
trackName: "Windows Administration"
module: "Operating Windows"
order: 605
level: "Intermediate"
difficulty: "Intermediate"
distribution: "Windows"
category: "Windows Administration"
tags: [windows, services, processes, task-manager, performance, intermediate]
cover: "/covers/curriculum/windows-administration.svg"
estMinutes: 50
status: "published"
summary: "Keep a Windows system healthy. Control services (the Windows daemons) with the Services console, sc and PowerShell; inspect processes and resource use; use Task Manager and Resource Monitor; and manage startup programs — the Windows counterpart to systemd, ps and top."
seoTitle: "Windows Administration 5: Services, Processes & Task Manager"
seoDescription: "Intermediate Windows: manage services with Get/Start/Stop-Service and sc, inspect processes, use Task Manager/Resource Monitor, and control startup — the systemd/ps/top analog. Lab + assessment."
---

A running Windows box is the same problem as a running Linux box: which **services**
are running, which **processes** are eating resources, and what starts at boot? This
lesson maps your systemd/`ps`/`top` skills to Windows: managing **services** with
PowerShell and the Services console, inspecting **processes** and performance with
Task Manager and Resource Monitor, and controlling **startup programs** — the daily
"is this machine healthy?" toolkit.

## Learning objectives

By the end of this lesson you will be able to:

- View and control **services** (start/stop/startup type) with PowerShell, `sc`,
  and `services.msc`.
- Inspect **processes** and resource use with PowerShell and Task Manager.
- Use **Resource Monitor** and basic performance views.
- Manage **startup programs**.
- Map these to systemd/`ps`/`top`.

## Part 1 — Services

Windows **services** are background programs (the equivalent of Linux daemons),
managed by the Service Control Manager. PowerShell and `sc.exe` drive them:

```powershell
Get-Service                              # all services and their status
Get-Service -Name "W32Time"              # one service (Windows Time)
Get-Service | Where-Object Status -eq "Running" | Select-Object -First 10

Start-Service  -Name "W32Time"           # start  (like systemctl start)
Stop-Service   -Name "Spooler"           # stop
Restart-Service -Name "Spooler"          # restart

# Startup type (Automatic / Manual / Disabled) — like enable/disable
Set-Service -Name "Spooler" -StartupType Disabled
Get-Service Spooler | Select-Object Name, Status, StartType
```

```cmd
:: sc.exe — classic, scriptable
sc query W32Time
sc config Spooler start= disabled
sc stop Spooler
```

The concepts map directly: **Status** (Running/Stopped) ≈ active/inactive;
**StartupType** (Automatic/Manual/Disabled) ≈ enabled/disabled at boot.
`services.msc` is the GUI (shows description, dependencies, the **log-on account**).

> [!IMPORTANT]
> A service's **log-on account** matters for security and for troubleshooting "access
> denied" failures: services run as **LocalSystem** (most privileged),
> **LocalService**/**NetworkService** (limited), or a specific account. If a service
> can't access a file/network resource, check **which account it runs as** (in
> `services.msc` → Properties → Log On) — the same least-privilege thinking as not
> running Linux daemons as root.

## Part 2 — Processes

```powershell
Get-Process                              # all processes (like ps)
Get-Process -Name "chrome"               # by name
Get-Process | Sort-Object CPU -Descending | Select-Object -First 5 Name, Id, CPU, WS
Get-Process | Sort-Object WS  -Descending | Select-Object -First 5 Name, Id, WS  # by memory (working set)

Stop-Process -Name "notepad"             # kill by name (like kill/pkill)
Stop-Process -Id 1234 -Force             # force-kill by PID

# Which process owns a port? (ties to networking)
Get-NetTCPConnection -State Listen | Select-Object LocalPort, OwningProcess | Sort-Object LocalPort
Get-Process -Id (Get-NetTCPConnection -LocalPort 443).OwningProcess
```

`WS` (working set) is the process's physical memory — the column to sort by for
memory hogs. As in Linux, prefer a **graceful** stop and reserve `-Force` for stuck
processes. `tasklist` and `taskkill` are the classic cmd equivalents.

## Part 3 — Task Manager and Resource Monitor

The GUI tools you'll use constantly (and that map to `top`/`htop`):

- **Task Manager** (`taskmgr`, or Ctrl+Shift+Esc) — live **Processes** (CPU/memory/
  disk/network per app), **Performance** (overall CPU/RAM/disk/network graphs),
  **Startup** (boot programs + their impact), **Services**, and **Users**. End a
  stuck task here.
- **Resource Monitor** (`resmon`) — deeper, per-process detail on **CPU, Memory,
  Disk, and Network**, including which process is doing disk I/O or holding a network
  connection — the closest thing to combining `iotop`/`ss`/`top`.
- **Performance Monitor** (`perfmon`) — historical counters for serious analysis.

```powershell
# A quick health snapshot from PowerShell
Get-CimInstance Win32_OperatingSystem |
  Select-Object @{n='FreeRAM(GB)';e={[math]::Round($_.FreePhysicalMemory/1MB,1)}},
                @{n='TotalRAM(GB)';e={[math]::Round($_.TotalVisibleMemorySize/1MB,1)}}
Get-Counter '\Processor(_Total)\% Processor Time'    # current CPU %
```

> [!TIP]
> The Windows performance triage mirrors Lesson 212: **Task Manager → Performance**
> for the overall picture (is it CPU, memory, disk, or network?), then **Resource
> Monitor** to find the **process** responsible (e.g. which app is pegging the disk).
> Same method — "which resource is saturated, then which process" — just different
> tools.

## Part 4 — Startup programs

Slow boots and bloat often come from too many **startup** programs. Manage them:

- **Task Manager → Startup** — enable/disable per-app, with a "startup impact"
  rating.
- **Registry `...\Run` keys** (Lesson 602) and the **Startup folder**
  (`shell:startup`).
- Scheduled Tasks set to run at logon (Task Scheduler — the Windows cron, covered with
  scheduling concepts).

```powershell
# What auto-starts? (CIM view + the Run keys)
Get-CimInstance Win32_StartupCommand | Select-Object Name, Command, Location
Get-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Run' 2>$null
Get-ItemProperty 'HKLM:\Software\Microsoft\Windows\CurrentVersion\Run' 2>$null
```

> [!TIP]
> Auditing startup items is both a **performance** task (fewer boot programs = faster
> login) and a **security** task (malware persists via Run keys / startup tasks). The
> `Win32_StartupCommand` view plus the two `Run` keys gives a fast "what launches on
> this machine?" answer — the Windows analog of auditing enabled systemd units and
> cron jobs.

## Hands-on lab

```powershell
# 1. Services: inspect, change startup type, restart (use the Print Spooler safely)
Get-Service | Where-Object Status -eq Running | Measure-Object   # how many running
Get-Service Spooler | Select-Object Name, Status, StartType
Restart-Service Spooler
# Set-Service Spooler -StartupType Manual   # (change, then set back to Automatic)

# 2. Find a service's log-on account (security)
Get-CimInstance Win32_Service -Filter "Name='Spooler'" |
  Select-Object Name, StartName, State, StartMode

# 3. Processes: top CPU and memory consumers
Get-Process | Sort-Object CPU -Descending | Select-Object -First 5 Name, Id, CPU
Get-Process | Sort-Object WS  -Descending | Select-Object -First 5 Name, Id, WS

# 4. Which process owns a listening port
Get-NetTCPConnection -State Listen |
  Select-Object LocalAddress, LocalPort, OwningProcess | Sort-Object LocalPort | Select-Object -First 8

# 5. Startup programs
Get-CimInstance Win32_StartupCommand | Select-Object Name, Location

# 6. Quick health snapshot
Get-Counter '\Processor(_Total)\% Processor Time'
# Open the GUIs to compare: taskmgr , resmon
```

## Exercises

1. List how many services are Running vs Stopped, and show the startup type of three
   services.
2. Change a non-critical service's startup type (e.g. Print Spooler) to Manual and
   back to Automatic, verifying each change.
3. Find which account a chosen service runs as (`StartName`) and explain why it
   matters.
4. Show the top 5 processes by memory (working set) and by CPU, then stop a harmless
   one you started (e.g. Notepad).
5. List the machine's startup programs and identify where each is configured (Run
   key, startup folder, or scheduled task).

## Troubleshooting

- **A service won't start** — dependency, permissions, or a config/path error. *Fix:*
  `Get-Service` for status; check **Event Viewer** (next lesson) for the error; verify
  the **log-on account** and dependencies in `services.msc`.
- **High CPU/disk, machine sluggish** — find the resource then the process. *Fix:*
  **Task Manager → Performance** (which resource), **Resource Monitor** (which
  process); end or fix it.
- **"Access denied" from a service** — its log-on account lacks rights. *Fix:* grant
  the account access, or run the service under a more appropriate account (least
  privilege).
- **Slow boot/login** — too many startup programs. *Fix:* disable unneeded ones in
  Task Manager → Startup; audit the Run keys.
- **Stuck process won't close** — *Fix:* `Stop-Process -Force` / End task; if it's a
  service, stop the service rather than the process.

Reproduce the port→process link: `Get-Process -Id (Get-NetTCPConnection -LocalPort
443 -State Listen).OwningProcess` names the process listening on 443 — the Windows
equivalent of `ss -tulpn` + the owning PID.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Run the practical items.

1. What are Windows services, and which cmdlets manage them?
2. How does "startup type" map to Linux enable/disable?
3. Why does a service's log-on account matter?
4. Which cmdlet lists processes, and how do you sort by memory?
5. What does Task Manager's Performance tab tell you vs Resource Monitor?
6. How do you find which process owns a listening port?
7. Where do startup programs come from (name two sources)?
8. Why audit startup items (two reasons)?
9. **Practical:** restart a service and show its status.
10. **Practical:** show the top processes by CPU.

## Solutions & validation

1. Background programs (Linux-daemon analog); `Get-Service`, `Start/Stop/Restart/Set-
   Service` (and `sc.exe`).
2. **StartupType Automatic/Manual/Disabled** ≈ enabled/disabled at boot.
3. It's the **security context** the service runs as (SYSTEM vs limited vs specific
   account) — determines its privileges and explains access-denied failures.
4. `Get-Process`; sort by **`WS`** (working set) for memory.
5. **Performance** shows overall CPU/RAM/disk/network (which resource); **Resource
   Monitor** shows per-**process** detail (which process).
6. `Get-NetTCPConnection -State Listen` → `OwningProcess` → `Get-Process -Id`.
7. Any two: **Run keys** (HKLM/HKCU), the **Startup folder**, **scheduled tasks**,
   service auto-start.
8. **Performance** (faster boot) and **security** (malware persistence).
9. **Validation:** `Restart-Service Spooler; Get-Service Spooler | Select Status`.
10. **Validation:** `Get-Process | Sort-Object CPU -Descending | Select -First 5`.

> [!TIP]
> Same operational loop, Windows tools: **services (Get/Start/Stop/Set-Service,
> services.msc), processes (Get-Process, Task Manager), resources (Performance tab →
> Resource Monitor), startup (Task Manager → Startup + Run keys).** Your Linux
> "what's running and what's eating resources?" instincts apply directly.

## What's next

Next: **Lesson 606 — Event Logs & Troubleshooting.** Where Windows records what
happened: the **Event Viewer** and its logs (System, Application, Security), reading
and filtering events with PowerShell (`Get-WinEvent`), event IDs and levels, and a
practical troubleshooting workflow — the Windows counterpart to `journalctl` and
`/var/log`.
