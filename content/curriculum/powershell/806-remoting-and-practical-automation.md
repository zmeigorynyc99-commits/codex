---
title: "PowerShell — Remoting & Practical Automation"
slug: "powershell-remoting-and-practical-automation"
track: "powershell"
trackName: "PowerShell"
module: "PowerShell Foundations"
order: 806
level: "Intermediate"
difficulty: "Intermediate"
distribution: "Cross-platform"
category: "Shell & Scripting"
tags: [powershell, remoting, invoke-command, automation, credentials, reporting]
cover: "/covers/curriculum/powershell.svg"
estMinutes: 65
status: "published"
summary: "Put it all together: PowerShell remoting with Enter-PSSession and Invoke-Command, fan-out across many hosts, parallel execution, handling credentials safely, and building real automation that collects data from fleets of machines and produces CSV/JSON reports."
seoTitle: "PowerShell 6: Remoting & Practical Automation"
seoDescription: "PowerShell remoting (Enter-PSSession, Invoke-Command), fan-out to many hosts, ForEach-Object -Parallel, credentials, and CSV/JSON reporting. Capstone lab + assessment."
---

This capstone ties the track together. **Remoting** lets one PowerShell session run
commands on dozens or hundreds of machines and bring **objects** back — the payoff of the
object pipeline at fleet scale. You'll learn `Enter-PSSession` and `Invoke-Command`,
reusable **sessions**, **parallel** execution, **credential** handling, and how to turn
results into **CSV/JSON reports** — the everyday work of an admin or SRE.

## Learning objectives

By the end of this lesson you will be able to:

- Open interactive remote sessions with **`Enter-PSSession`**.
- Run commands on one or many hosts with **`Invoke-Command`** (fan-out).
- Reuse connections with **`New-PSSession`** and run in **parallel**.
- Handle **credentials** safely (`Get-Credential`, never plaintext).
- Build automation that **collects objects from many hosts → CSV/JSON report**.

## Part 1 — What remoting is

PowerShell remoting runs commands on remote machines over **WinRM** (Windows) or **SSH**
(cross-platform, PS 7+) and returns **deserialized objects** — not text:

```powershell
# Interactive: drop into a remote shell
Enter-PSSession -ComputerName web01
Enter-PSSession -HostName web01 -UserName deploy        # over SSH (PS 7+)
# ... you're now "on" web01 ...
Exit-PSSession

# One-shot command on a remote host
Invoke-Command -ComputerName web01 -ScriptBlock { Get-Process | Sort CPU -Desc | Select -First 3 }
```

Because objects come back (lightly "deserialized"), you can `Sort`/`Where`/`Select` the
results **locally** exactly as if they were generated on your machine.

> [!IMPORTANT]
> Remoting returns **objects**, not screen-scraped text — the whole reason the object
> pipeline scales. Results gain a **`PSComputerName`** property so you know which host
> each object came from. Deserialized objects are **snapshots** (their live methods
> generally don't run locally), but their **properties** are all there for filtering and
> reporting.

## Part 2 — Fan-out to many hosts

The power move: pass **many** computer names; `Invoke-Command` runs them **in parallel**
and tags each result with its source host:

```powershell
$servers = 'web01','web02','db01'
Invoke-Command -ComputerName $servers -ScriptBlock {
    [pscustomobject]@{
        Host    = $env:COMPUTERNAME
        Uptime  = (Get-Date) - (Get-CimInstance Win32_OperatingSystem).LastBootUpTime
        FreeGB  = [math]::Round((Get-PSDrive C).Free/1GB,1)
    }
} | Sort-Object FreeGB | Format-Table Host, FreeGB, Uptime

# Pull names from a file
$servers = Get-Content ./hosts.txt
Invoke-Command -ComputerName $servers -ScriptBlock { Get-Service Spooler } |
    Select-Object PSComputerName, Status
```

`Invoke-Command` fans out concurrently (throttled by `-ThrottleLimit`, default 32), so
querying 100 hosts is nearly as fast as querying one.

## Part 3 — Reusable sessions

For multiple round-trips to the same hosts, create **persistent sessions** so you don't
reconnect each time:

```powershell
$sessions = New-PSSession -ComputerName $servers
Invoke-Command -Session $sessions { $svc = Get-Service }     # state persists per session
Invoke-Command -Session $sessions { $svc.Count }             # same session remembers $svc
Copy-Item ./patch.ps1 -ToSession $sessions[0] -Destination C:\temp\
Remove-PSSession $sessions                                    # always clean up
```

## Part 4 — Parallelism (local fan-out)

For local work against many targets (APIs, pings, files), PS 7's
**`ForEach-Object -Parallel`** runs script blocks concurrently:

```powershell
$urls = 'https://a.io','https://b.io','https://c.io'
$urls | ForEach-Object -Parallel {
    [pscustomobject]@{ Url=$_; Code=(Invoke-WebRequest $_ -Method Head).StatusCode }
} -ThrottleLimit 10

# Note: inside -Parallel, use $using:var to read outer variables
$timeout = 5
$urls | ForEach-Object -Parallel { Invoke-WebRequest $_ -TimeoutSec $using:timeout } -ThrottleLimit 5
```

> [!TIP]
> Use **`Invoke-Command`** for running on **remote** hosts (it parallelizes for you), and
> **`ForEach-Object -Parallel`** for **local** concurrent work (web calls, file crunching).
> Inside `-Parallel`, the runspaces are isolated — reference outer variables with
> **`$using:name`**. Set a sane **`-ThrottleLimit`** so you don't overwhelm targets or
> your own machine.

## Part 5 — Credentials, safely

Never hard-code passwords. Prompt for or store credentials securely:

```powershell
$cred = Get-Credential                    # secure prompt -> [PSCredential]
Invoke-Command -ComputerName web01 -Credential $cred -ScriptBlock { whoami }

# Save a secret encrypted (user+machine scoped on Windows / SecretManagement cross-plat)
Install-Module Microsoft.PowerShell.SecretManagement, Microsoft.PowerShell.SecretStore
Set-Secret -Name DeployCred -Secret $cred
$cred = Get-Secret -Name DeployCred       # retrieve later, no plaintext on disk
```

> [!IMPORTANT]
> **Never put passwords in scripts.** Use **`Get-Credential`** for interactive prompts and
> the **SecretManagement/SecretStore** modules (or a vault like Azure Key Vault / HashiCorp
> Vault) for unattended jobs. `ConvertTo-SecureString … -AsPlainText` in a committed script
> is a credential leak. A `[PSCredential]` keeps the password as a `SecureString`, not bare
> text.

## Hands-on lab — capstone: fleet report to CSV/JSON

```powershell
# Build a health report across a fleet and export it.
$servers = 'localhost'          # replace with your hosts / Get-Content ./hosts.txt
$cred    = $null                # or Get-Credential for remote

$report = Invoke-Command -ComputerName $servers -Credential $cred -ScriptBlock {
    $os = Get-CimInstance Win32_OperatingSystem -ErrorAction SilentlyContinue
    [pscustomobject]@{
        Host      = $env:COMPUTERNAME
        Collected = Get-Date
        FreeMemMB = if ($os) { [math]::Round($os.FreePhysicalMemory/1KB) } else { $null }
        Procs     = (Get-Process).Count
        TopCpu    = (Get-Process | Sort CPU -Desc | Select -First 1 -Expand Name)
    }
} -ErrorAction SilentlyContinue

$report | Sort-Object FreeMemMB |
    Tee-Object -Variable out |
    Format-Table -Auto

$report | Export-Csv  ./fleet-report.csv  -NoTypeInformation
$report | ConvertTo-Json | Set-Content ./fleet-report.json
"Wrote $($report.Count) rows to fleet-report.csv / .json"
```

This is the whole track in one script: **objects** from many hosts, the
**Get/Where/Sort/Select** pattern, a **function-grade** script block, **error handling**,
and a **report**. On a Linux-only box you can adapt the script block to `uptime`,
`free`, `df` parsed into a `[pscustomobject]` and run it via `ForEach-Object -Parallel`.

## Exercises

1. Use `Invoke-Command` against `localhost` (or two hosts) to return a `[pscustomobject]`
   with hostname, process count, and free disk — then sort by free disk.
2. Create a persistent session, set a variable in it, and read it back in a second
   `Invoke-Command` to prove state persists.
3. Use `ForEach-Object -Parallel` to HEAD-request several URLs and collect status codes,
   reading a timeout via `$using:`.
4. Prompt for a credential with `Get-Credential` and pass it to a remote command (explain
   why you never store the password in the script).
5. Build the capstone report for at least one host and export both **CSV** and **JSON**.

## Troubleshooting

- **"Cannot connect / WinRM"** — remoting not enabled. *Fix (Windows):*
  `Enable-PSRemoting -Force` on the target; ensure the host is trusted/in the same domain
  or `TrustedHosts` is set.
- **SSH remoting fails (PS7)** — SSH/`Subsystem powershell` not configured. *Fix:* install
  PowerShell + configure the SSH subsystem on the target.
- **Methods don't work on returned objects** — they're **deserialized** snapshots. *Fix:*
  use properties, or run the method **inside** the remote `-ScriptBlock`.
- **`$using:` not recognized** — only valid inside remote/`-Parallel` blocks. *Fix:* pass
  data via `-ArgumentList`/`$using:` correctly.
- **Slow against many hosts** — serial or low throttle. *Fix:* `Invoke-Command`'s built-in
  fan-out / raise `-ThrottleLimit` sensibly.
- **Leaked credential** — plaintext password in script. *Fix:* `Get-Credential` /
  SecretManagement.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Run the practical items.

1. What does remoting send back, and over what transports?
2. Difference between `Enter-PSSession` and `Invoke-Command`?
3. How does `Invoke-Command` behave when given many computer names?
4. Why use `New-PSSession` instead of repeated `-ComputerName` calls?
5. When do you use `ForEach-Object -Parallel` vs `Invoke-Command`?
6. Inside `-Parallel`, how do you reference an outer variable?
7. How should credentials be supplied for unattended automation?
8. Why might a method on a returned object not run locally?
9. **Practical:** fan-out a `[pscustomobject]` collector across host(s) and sort it.
10. **Practical:** export a result set to both CSV and JSON.

## Solutions & validation

1. **Deserialized objects**; over **WinRM** or **SSH** (PS 7+).
2. `Enter-PSSession` = **interactive** remote shell; `Invoke-Command` = run a script block
   (one-shot/fan-out) and return objects.
3. It runs them **in parallel** (throttled) and tags results with `PSComputerName`.
4. Reuses the connection and **keeps state** across multiple calls (faster, stateful).
5. `-Parallel` for **local** concurrent work; `Invoke-Command` for **remote** execution.
6. **`$using:variableName`**.
7. Via **`Get-Credential`** / **SecretManagement**/vault — never plaintext in the script.
8. Returned objects are **deserialized snapshots**; run the method inside the remote
   block.
9. **Validation:** see capstone — `Invoke-Command … { [pscustomobject]@{…} } | Sort …`.
10. **Validation:** `… | Export-Csv r.csv -NoTypeInformation` and `… | ConvertTo-Json | Set-Content r.json`.

> [!TIP]
> You've completed PowerShell foundations: **objects, not text** → **discovery** →
> **variables/operators/collections** → **flow & functions** → **scripts/modules/errors**
> → **remoting & reporting**. The throughline is the object pipeline — it's what makes a
> one-host one-liner scale to a **fleet report** without changing how you think. From
> here, automate something real you do by hand each week, package it as a module, and add
> error handling and a report.

## What's next

You've finished the **PowerShell** track. Next up in the roadmap is **Security
Fundamentals** — the CIA triad, authentication vs authorization, cryptography basics,
network and system hardening, logging/monitoring, vulnerability management and incident
response — the concepts every infrastructure professional must own.
