---
title: "PowerShell — Scripts, Modules & Error Handling"
slug: "powershell-scripts-modules-and-error-handling"
track: "powershell"
trackName: "PowerShell"
module: "PowerShell Foundations"
order: 805
level: "Intermediate"
difficulty: "Intermediate"
distribution: "Cross-platform"
category: "Shell & Scripting"
tags: [powershell, scripts, modules, error-handling, try-catch, execution-policy]
cover: "/covers/curriculum/powershell.svg"
estMinutes: 60
status: "published"
summary: "Package and harden your automation: turn functions into reusable .ps1 scripts and .psm1 modules, understand execution policy and script signing, and handle failure properly with try/catch/finally, terminating vs non-terminating errors, $ErrorActionPreference, throw and Write-Error."
seoTitle: "PowerShell 5: Scripts, Modules & Robust Error Handling"
seoDescription: "PowerShell scripts and modules, execution policy, try/catch/finally, terminating vs non-terminating errors, $ErrorActionPreference, throw. Lab and assessment."
---

A one-liner that works once is a trick; a **script** or **module** that runs reliably,
unattended, and fails *loudly when it should* is automation. This lesson packages your
functions into reusable **`.ps1` scripts** and **`.psm1` modules**, covers **execution
policy** (why scripts may be blocked and how to run them safely), and — crucially —
teaches **error handling**: `try/catch/finally`, the difference between **terminating**
and **non-terminating** errors, `$ErrorActionPreference`, and `throw`/`Write-Error`.

## Learning objectives

By the end of this lesson you will be able to:

- Write and run a **`.ps1` script** with parameters and `#requires`.
- Understand **execution policy** and run scripts safely.
- Build a **module** (`.psm1` + manifest) and `Import-Module` it.
- Distinguish **terminating** vs **non-terminating** errors.
- Handle errors with **`try/catch/finally`**, `$ErrorActionPreference`, `-ErrorAction`,
  `throw`, and `$Error`.

## Part 1 — Scripts (.ps1)

A script is a text file of PowerShell. Put a `param()` block **first** to accept
arguments:

```powershell
#requires -Version 7.0
[CmdletBinding()]
param(
    [Parameter(Mandatory)][string]$Path,
    [int]$Days = 7
)

$cutoff = (Get-Date).AddDays(-$Days)
Get-ChildItem $Path -File |
    Where-Object LastWriteTime -lt $cutoff |
    Select-Object Name, LastWriteTime
```

```powershell
./Get-OldFiles.ps1 -Path /var/log -Days 30
pwsh -File ./Get-OldFiles.ps1 -Path /var/log     # from any shell / cron / Task Scheduler
```

`#requires` enforces version/modules/admin before running. Dot-sourcing (`. ./tools.ps1`)
loads a script's functions into your **current** session instead of running it.

## Part 2 — Execution policy

On Windows, scripts may be blocked by **execution policy** (a safety speed-bump, *not* a
security boundary):

```powershell
Get-ExecutionPolicy -List
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned   # common, sensible default
# RemoteSigned: local scripts run; downloaded scripts need a signature
# Run a single script without changing policy:
pwsh -ExecutionPolicy Bypass -File ./deploy.ps1
```

Policies: `Restricted` (none), `RemoteSigned` (local OK, downloaded must be signed),
`AllSigned` (all must be signed), `Bypass` (no checks). On Linux/macOS execution policy
is effectively unrestricted.

> [!IMPORTANT]
> Execution policy is **not a security boundary** — anyone can paste script contents or
> use `-Bypass`. It prevents *accidental* double-click execution. **`RemoteSigned`** at
> `CurrentUser` scope is the practical default. For real trust, **sign** scripts
> (`Set-AuthenticodeSignature`) and use `AllSigned`. Never tell users to set `Bypass`
> globally as a "fix."

## Part 3 — Modules (.psm1)

A module groups related functions for reuse and sharing. Minimal module:

```powershell
# MyTools.psm1
function Get-DiskFreePct { <# ... #> }
function Clear-OldLogs   { <# ... #> }
Export-ModuleMember -Function Get-DiskFreePct, Clear-OldLogs
```

```powershell
Import-Module ./MyTools.psm1          # load explicitly
Get-Command -Module MyTools           # see what it exports
# Put it under a path in $env:PSModulePath to auto-discover by name:
$env:PSModulePath -split [IO.Path]::PathSeparator
```

Add a **manifest** (`.psd1`, via `New-ModuleManifest`) for version, author, dependencies,
and which functions to export — required to publish to the **PowerShell Gallery**
(`Install-Module`/`Publish-Module`).

> [!TIP]
> Promote a script to a **module** once you reuse its functions across scripts. A module
> in a `$env:PSModulePath` folder is auto-discovered: typing the function name loads it on
> demand. Use `Export-ModuleMember` (or the manifest's `FunctionsToExport`) to expose
> only your **public** functions and keep helpers private.

## Part 4 — Terminating vs non-terminating errors

This distinction trips everyone up. Most cmdlet errors are **non-terminating** — they
write an error but **keep going**, and **`try/catch` does NOT catch them** unless you
escalate:

```powershell
# Non-terminating: loop continues, catch would NOT fire
Get-Item /nope, /etc/hostname            # errors on /nope, still returns /etc/hostname

# Escalate to terminating so catch works:
Get-Item /nope -ErrorAction Stop         # now it throws -> catchable

# Global escalation for a block/script:
$ErrorActionPreference = 'Stop'
```

- **Terminating** errors (a `throw`, a .NET exception, or `-ErrorAction Stop`) stop
  execution and are caught by `catch`.
- **Non-terminating** errors call `Write-Error`, append to `$Error`, and continue.
- **`-ErrorAction Stop`** (per cmdlet) or **`$ErrorActionPreference='Stop'`** (scope-wide)
  turns non-terminating into terminating so you can `try/catch` them.

## Part 5 — try / catch / finally

```powershell
try {
    $content = Get-Content $Path -ErrorAction Stop
    $data    = $content | ConvertFrom-Json -ErrorAction Stop
    Write-Output $data.name
}
catch [System.IO.FileNotFoundException] {
    Write-Warning "Missing file: $Path"          # specific exception type
}
catch {
    Write-Error "Failed: $($_.Exception.Message)"  # $_ is the ErrorRecord
    throw                                          # re-throw to caller if fatal
}
finally {
    'cleanup runs whether or not we failed' | Write-Verbose
}
```

- `catch [Type]` handles a **specific** exception; a bare `catch` is the fallback.
- Inside `catch`, **`$_`** (the `ErrorRecord`) has `.Exception.Message`,
  `.ScriptStackTrace`, `.CategoryInfo`.
- **`finally`** always runs — close files, release locks, restore state.
- **`throw 'msg'`** raises a terminating error; **`Write-Error`** writes a
  non-terminating one. `$Error[0]` is the most recent error.

> [!IMPORTANT]
> The #1 error-handling bug: wrapping a cmdlet in `try/catch` and being surprised it
> **doesn't catch**. Cmdlet errors are **non-terminating** by default. Add
> **`-ErrorAction Stop`** (or set `$ErrorActionPreference='Stop'`) to make them
> catchable. Catch **specific** exception types where you can, use `finally` for cleanup,
> and `throw` to propagate failures that should stop the caller.

## Hands-on lab

```powershell
# 1. A small script with params and #requires  (save as Test-Url.ps1)
#requires -Version 7.0
[CmdletBinding()]
param([Parameter(Mandatory)][string]$Url, [int]$TimeoutSec = 5)
try {
    $r = Invoke-WebRequest $Url -TimeoutSec $TimeoutSec -ErrorAction Stop
    [pscustomobject]@{ Url=$Url; Status=$r.StatusCode; OK=$true }
}
catch {
    [pscustomobject]@{ Url=$Url; Status=$_.Exception.Message; OK=$false }
}
finally { Write-Verbose "checked $Url" }

# 2. Prove non-terminating vs terminating
Get-Item /nope, /etc/hostname            # continues despite error
try { Get-Item /nope } catch { 'caught? no' }            # NOT caught
try { Get-Item /nope -EA Stop } catch { 'caught! yes' }  # caught

# 3. Inspect the last error
try { 1/0 } catch { $_.Exception.GetType().Name; $_.Exception.Message }
$Error[0]

# 4. A tiny module
@'
function Get-Greeting { param([string]$Name='world') "hello, $Name" }
Export-ModuleMember -Function Get-Greeting
'@ | Set-Content ./Greet.psm1
Import-Module ./Greet.psm1 -Force
Get-Greeting -Name Ada
Get-Command -Module Greet
```

## Exercises

1. Write a `.ps1` that takes a mandatory `-Path` and an optional `-Days`, with
   `#requires -Version 7.0`, and lists files older than N days.
2. Demonstrate a cmdlet error that `try/catch` **misses**, then fix it so it's caught.
3. Write a `try/catch/finally` that handles a specific exception type and always prints a
   cleanup line.
4. Turn two related functions into a `Greet.psm1` module, export them, import it, and
   confirm with `Get-Command -Module`.
5. Explain in one or two sentences why execution policy is not a security boundary, and
   give the recommended setting.

## Troubleshooting

- **`try/catch` doesn't catch** — non-terminating error. *Fix:* `-ErrorAction Stop` or
  `$ErrorActionPreference='Stop'`.
- **"running scripts is disabled"** (Windows) — execution policy. *Fix:*
  `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`, or `pwsh -File … -ExecutionPolicy Bypass` for one run.
- **Module functions not visible** — not exported / not imported. *Fix:*
  `Export-ModuleMember` + `Import-Module -Force`.
- **Script "runs" but does nothing** — you ran it instead of dot-sourcing its functions.
  *Fix:* `. ./tools.ps1` to load functions.
- **Swallowed errors** — bare `catch {}` with no rethrow. *Fix:* log `$_` and `throw`
  when fatal.
- **`$ErrorActionPreference` leaks** — set globally. *Fix:* prefer per-cmdlet
  `-ErrorAction`, or save/restore the preference.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Run the practical items.

1. How does a script accept parameters, and what does `#requires` do?
2. What is execution policy, and is it a security boundary?
3. Which execution policy is the sensible per-user default?
4. What's the difference between a `.ps1` script and a `.psm1` module?
5. Terminating vs non-terminating errors — which does `try/catch` catch by default?
6. How do you make a non-terminating cmdlet error catchable?
7. What runs in a `finally` block, and when?
8. Difference between `throw` and `Write-Error`?
9. **Practical:** show a cmdlet error being caught only after adding `-ErrorAction Stop`.
10. **Practical:** build, import, and call a one-function module.

## Solutions & validation

1. A `param()` block at the top; `#requires` enforces version/modules/admin before
   running.
2. A speed-bump preventing accidental script execution — **not** a security boundary.
3. **`RemoteSigned`** (CurrentUser scope).
4. `.ps1` is a runnable script; `.psm1` is a **module** of reusable functions you import.
5. **Terminating** errors are caught; non-terminating ones are **not** (by default).
6. `-ErrorAction Stop` (or `$ErrorActionPreference='Stop'`).
7. Cleanup code that runs **always**, success or failure.
8. `throw` = **terminating**; `Write-Error` = **non-terminating**.
9. **Validation:** `try { Get-Item /nope -EA Stop } catch { 'caught' }`.
10. **Validation:** `Import-Module ./Greet.psm1 -Force; Get-Greeting`.

> [!TIP]
> Robust automation has three habits: **`-ErrorAction Stop` + `try/catch`** around the
> risky parts, **`finally`** for cleanup, and **`throw`** to fail loudly when continuing
> would be wrong. Package the working logic into a **module** so it's reusable and
> testable. Silent failure is the enemy — make your scripts say *what* failed and *why*.

## What's next

Next: **Lesson 806 — Remoting & Practical Automation.** Reach across machines with
PowerShell **remoting** (`Enter-PSSession`, `Invoke-Command`), run commands in parallel,
work with credentials safely, and tie everything together into real automation:
collecting data from many hosts and producing CSV/JSON reports.
