---
title: "PowerShell — Control Flow & Functions"
slug: "powershell-control-flow-and-functions"
track: "powershell"
trackName: "PowerShell"
module: "PowerShell Foundations"
order: 804
level: "Beginner"
difficulty: "Intermediate"
distribution: "Cross-platform"
category: "Shell & Scripting"
tags: [powershell, control-flow, loops, switch, functions, parameters]
cover: "/covers/curriculum/powershell.svg"
estMinutes: 60
status: "published"
summary: "Turn data into logic and one-liners into reusable tools: if/elseif/else, the powerful switch statement, every loop (foreach, for, while, do), and functions with typed parameters, defaults, mandatory/validated input, and pipeline binding — including splatting for clean calls."
seoTitle: "PowerShell 4: Control Flow, Loops & Functions"
seoDescription: "PowerShell if/switch, foreach/for/while/do loops, and functions with param blocks, defaults, validation, and pipeline input. Hands-on lab, exercises, assessment."
---

So far you've worked with single expressions. Real automation needs **decisions** and
**repetition**, and reusable **functions** so you don't copy-paste logic. This lesson
covers `if/elseif/else`, the surprisingly powerful **`switch`**, the full **loop**
family (`foreach`, `for`, `while`, `do`), and **functions** — from a trivial wrapper to
a proper tool with typed parameters, defaults, validation, and **pipeline input**.

## Learning objectives

By the end of this lesson you will be able to:

- Branch with **`if/elseif/else`** and the **`switch`** statement (including `-Wildcard`/
  `-Regex`).
- Loop with **`foreach`**, **`for`**, **`while`**, **`do..while`/`do..until`**.
- Write **functions** with a `param()` block, **types**, **defaults**, and `return`.
- Make parameters **`[Mandatory]`** and **validated**; accept **pipeline input**.
- Call functions cleanly with **splatting**.

## Part 1 — Conditionals

```powershell
$cpu = 87
if ($cpu -ge 90)      { 'critical' }
elseif ($cpu -ge 75)  { 'warning'  }
else                  { 'ok'       }

# Ternary (PowerShell 7+)
$state = $cpu -ge 90 ? 'critical' : 'ok'

# switch — cleaner than long if/elseif chains
switch ($env:OS) {
  'Windows_NT' { 'Windows'; break }
  default      { 'Unix-like' }
}

# switch with wildcard / regex / multiple matches
switch -Wildcard ($file) {
  '*.log' { 'log file' }
  '*.gz'  { 'compressed' }
}
switch -Regex ('HTTP 503') {
  '5\d\d' { 'server error' }
  '4\d\d' { 'client error' }
}
```

> [!TIP]
> Use **`switch`** instead of long `if/elseif` ladders, and remember it has superpowers:
> `-Wildcard`, `-Regex`, and the ability to **fall through** (without `break` it tests
> every case) and to **iterate a collection** (`switch ($array) { … }` runs the cases for
> each element). For one-line either/or, the **ternary `? :`** (PS 7+) is concise.

## Part 2 — Loops

```powershell
# foreach: iterate a collection (most common)
foreach ($svc in Get-Service) { if ($svc.Status -eq 'Running') { $svc.Name } }

# for: counter-based
for ($i = 1; $i -le 5; $i++) { "attempt $i" }

# while: pre-condition
$n = 10
while ($n -gt 0) { $n--; }

# do..while / do..until: run at least once
do { $reply = Read-Host 'continue? (y/n)' } until ($reply -eq 'n')

# Pipeline ForEach-Object (% ) vs foreach statement
1..3 | ForEach-Object { $_ * $_ }        # streams, per-object
$squares = foreach ($x in 1..3) { $x*$x } # statement, collects to a variable

# break / continue work in loops
foreach ($x in 1..10) { if ($x -eq 5) { break }; $x }
```

`foreach` (the statement) iterates an existing collection; `ForEach-Object` (the cmdlet,
alias `%`) processes the **pipeline** object-by-object — use the cmdlet when streaming,
the statement when you already have a collection or want to assign the result.

## Part 3 — Functions: the basics

```powershell
function Get-DiskFreePct {
    param(
        [string]$Path = '/'
    )
    $d = Get-PSDrive -Name ($Path.TrimStart('/').Substring(0,1)) -ErrorAction SilentlyContinue
    # ... compute ...
    return 42
}

Get-DiskFreePct                 # uses default
Get-DiskFreePct -Path '/var'    # named argument
```

Functions are named **`Verb-Noun`** like cmdlets. The `param()` block declares inputs;
give them **types** and **defaults**. `return` exits and emits a value — but note: in
PowerShell **any uncaptured output becomes the return value**, so a stray expression
will leak into the output.

> [!IMPORTANT]
> A function returns **everything that isn't captured or suppressed**, not just what's
> after `return`. If a line like `$list.Add($x)` prints to the pipeline, it pollutes your
> output. Suppress noise with `| Out-Null`, `[void](...)`, or `$null = …`. Treat
> `return` as "stop here," not "the only thing I output."

## Part 4 — Parameters: mandatory, validated, pipeline

```powershell
function Restart-AppPool {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory, ValueFromPipeline)]
        [ValidateNotNullOrEmpty()]
        [string]$Name,

        [ValidateSet('Stop','Start','Restart')]
        [string]$Action = 'Restart',

        [ValidateRange(1,60)]
        [int]$TimeoutSec = 30
    )
    process {
        Write-Verbose "$Action pool '$Name' (timeout ${TimeoutSec}s)"
        # ... do work for each piped $Name ...
    }
}

'web','api' | Restart-AppPool -Action Restart -Verbose
```

- **`[Parameter(Mandatory)]`** — prompts if omitted.
- **`ValueFromPipeline`** + a **`process {}`** block — the function runs once **per piped
  object** (this is how you write pipeline-aware tools).
- **Validation attributes**: `ValidateSet`, `ValidateRange`, `ValidatePattern`,
  `ValidateNotNullOrEmpty` — reject bad input *before* your code runs.
- **`[CmdletBinding()]`** gives you `-Verbose`, `-Debug`, `-ErrorAction` for free.

## Part 5 — Splatting

Passing many parameters? Bundle them in a **hashtable** and **splat** with `@`:

```powershell
$params = @{
    Path        = '/var/log'
    Filter      = '*.log'
    Recurse     = $true
    ErrorAction = 'SilentlyContinue'
}
Get-ChildItem @params           # note @params, not $params

# Splatting keeps long calls readable and lets you build args conditionally
if ($deep) { $params.Recurse = $true }
```

> [!TIP]
> **Splatting** (`@hashtable`) is the cure for unreadable, ten-parameter one-liners and
> for building arguments **conditionally** at runtime. Use `@params` (the `@` sigil) in
> the call, even though the variable is `$params`. It's also the cleanest way to pass the
> same options to several cmdlets.

## Hands-on lab

```powershell
# 1. switch with regex to classify HTTP codes
function Get-HttpClass {
    param([Parameter(Mandatory)][int]$Code)
    switch -Regex ("$Code") {
        '^2\d\d' { 'success' }
        '^3\d\d' { 'redirect' }
        '^4\d\d' { 'client-error' }
        '^5\d\d' { 'server-error' }
        default  { 'unknown' }
    }
}
200,301,404,503 | ForEach-Object { '{0} -> {1}' -f $_, (Get-HttpClass $_) }

# 2. A pipeline-aware, validated function
function ConvertTo-Upper {
    [CmdletBinding()]
    param([Parameter(Mandatory,ValueFromPipeline)][string]$Text)
    process { $Text.ToUpper() }
}
'alpha','beta' | ConvertTo-Upper

# 3. Loops: retry with backoff
for ($i=1; $i -le 3; $i++) {
    Write-Host "try $i"; Start-Sleep -Milliseconds (200*$i)
}

# 4. Splatting
$gc = @{ Path='.'; Filter='*.md'; Recurse=$true; ErrorAction='SilentlyContinue' }
(Get-ChildItem @gc).Count

# 5. Validation rejects bad input (expect an error)
function Set-Level { param([ValidateSet('low','med','high')][string]$L) "level=$L" }
Set-Level -L med
# Set-Level -L extreme   # <-- errors: not in the ValidateSet
```

## Exercises

1. Write `Get-HttpClass` (above) and extend it to also label `1xx` as `info`.
2. Convert an `if/elseif/else` chain that maps CPU% → status into a `switch`.
3. Write a `for` loop that retries an action up to N times with increasing delay.
4. Write a function `Get-Square` with a **mandatory**, **validated** `[int]` parameter
   that accepts **pipeline** input and returns the square.
5. Take a `Get-ChildItem` call with 4+ parameters and rewrite it using **splatting**,
   adding one parameter conditionally.

## Troubleshooting

- **Function returns extra junk** — uncaptured output leaks. *Fix:* `$null = …`,
  `| Out-Null`, or `[void]`.
- **Pipeline input ignored** — missing `ValueFromPipeline` and/or a `process {}` block.
  *Fix:* add both.
- **`switch` runs multiple cases** — no `break`; it falls through by design. *Fix:* add
  `break` if you want one match.
- **`-Verbose` does nothing** — function lacks `[CmdletBinding()]`. *Fix:* add it.
- **Splat passed literally** — used `$params`. *Fix:* call with `@params`.
- **Mandatory param prompts unexpectedly** — you omitted it. *Fix:* pass it, or remove
  `Mandatory`.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Run the practical items.

1. When would you choose `switch` over `if/elseif`? Name one `switch` superpower.
2. Difference between the `foreach` **statement** and `ForEach-Object`?
3. Which loop guarantees the body runs at least once?
4. How does a function return a value, and what's the gotcha?
5. How do you make a parameter mandatory? Restrict it to a set of values?
6. What two things make a function process **pipeline** input per item?
7. What does `[CmdletBinding()]` give you?
8. What is splatting and why use it?
9. **Practical:** write a validated, pipeline-aware function and pipe two values in.
10. **Practical:** rewrite a multi-parameter cmdlet call using splatting.

## Solutions & validation

1. For many discrete cases / pattern matching; superpowers: `-Wildcard`, `-Regex`,
   fall-through, iterate a collection.
2. The **statement** iterates an existing collection (and can assign its result);
   **`ForEach-Object`** streams the **pipeline** object-by-object.
3. `do { } while/until` .
4. `return value` (or any uncaptured output); gotcha: **all** uncaptured output is
   returned — suppress noise.
5. `[Parameter(Mandatory)]`; `[ValidateSet('a','b')]`.
6. `ValueFromPipeline` on the parameter **and** a `process {}` block.
7. Common parameters: `-Verbose`, `-Debug`, `-ErrorAction`, etc.
8. Passing a **hashtable of parameters** via `@params` — readable, reusable, conditional.
9. **Validation:** `'a','b' | ConvertTo-Upper` (see lab).
10. **Validation:** `Get-ChildItem @gc` (see lab).

> [!TIP]
> The leap from "PowerShell user" to "PowerShell author" is the **advanced function**:
> `[CmdletBinding()]`, typed/validated `param()`, and a `process {}` block for pipeline
> input. Build tools that look and behave like native cmdlets, and the rest of the
> ecosystem (pipelines, `-Verbose`, splatting) just works with them.

## What's next

Next: **Lesson 805 — Scripts, Modules & Error Handling.** Package your functions into
**scripts** and **modules** you can reuse and share, and handle failure properly with
`try/catch/finally`, `$ErrorActionPreference`, terminating vs non-terminating errors, and
`throw` — so your automation fails safely and tells you why.
