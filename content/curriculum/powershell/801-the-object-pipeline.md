---
title: "PowerShell — The Object Pipeline"
slug: "powershell-the-object-pipeline"
track: "powershell"
trackName: "PowerShell"
module: "PowerShell Foundations"
order: 801
level: "Beginner"
difficulty: "Beginner"
distribution: "Cross-platform"
category: "Shell & Scripting"
tags: [powershell, pipeline, objects, cmdlets, beginner]
cover: "/covers/curriculum/powershell.svg"
estMinutes: 50
status: "published"
summary: "What makes PowerShell different from every Unix shell: it passes objects, not text. Understand the object pipeline, why that eliminates fragile text parsing, the Verb-Noun cmdlet model, and the core pattern Get-/Where-Object/Sort-Object/Select-Object that powers everything."
seoTitle: "PowerShell 1: The Object Pipeline (objects, not text)"
seoDescription: "Beginner PowerShell: the object pipeline vs Bash text, Verb-Noun cmdlets, and the Get/Where-Object/Sort-Object/Select-Object pattern. Hands-on lab and assessment."
---

PowerShell looks like a shell, but its defining idea sets it apart from Bash and every
Unix shell: **it passes objects through the pipeline, not text**. Where Bash hands the
next command a stream of characters you must parse (`awk`, `cut`, `grep`), PowerShell
hands the next command **structured objects with named properties** you can filter and
sort directly. Grasp this one idea and PowerShell goes from "weird verbose syntax" to
"remarkably powerful." This track teaches PowerShell as a real cross-platform
automation language (it runs on Windows, Linux, and macOS as `pwsh`).

## Learning objectives

By the end of this lesson you will be able to:

- Explain the **object pipeline** and why it beats text parsing.
- Read the **Verb-Noun** cmdlet naming model.
- Inspect an object's **properties** with `Get-Member`.
- Use the core pattern: **`Get-*` | `Where-Object` | `Sort-Object` | `Select-Object`**.
- Run PowerShell on any platform (`pwsh`).

## Part 1 — Objects, not text

Run a command and you appear to get text — but it's really **objects** being formatted
for display:

```powershell
Get-Process                    # looks like a table...
Get-Process | Get-Member       # ...but each item is a System.Diagnostics.Process OBJECT
```

The difference is everything. In Bash, to get the memory of the top process you parse
columns: `ps aux --sort=-%mem | head -1 | awk '{print $6}'` — fragile if spacing
changes. In PowerShell you ask for the **property**:

```powershell
Get-Process | Sort-Object WS -Descending | Select-Object -First 1 -ExpandProperty WS
```

No parsing, no column counting — you reference `WS` (working set) by name. When data
has real structure (numbers are numbers, dates are dates), you filter and compute on it
directly.

> [!IMPORTANT]
> **PowerShell pipes objects; Bash pipes text.** This is the single most important
> thing to internalize. It means you **never parse output** to extract a field — you
> access a **property** (`.Name`, `.CPU`, `.Length`). It also means comparisons are
> type-aware: `Where-Object Length -gt 1MB` compares real numbers, not strings. Stop
> reaching for `awk`/`cut` reflexes; reach for **properties**.

## Part 2 — The Verb-Noun model

Every cmdlet is named **`Verb-Noun`**: `Get-Process`, `Stop-Service`, `New-Item`,
`Set-Location`, `Remove-Item`. The verbs are a controlled vocabulary (Get, Set, New,
Remove, Start, Stop, Add, Out, …), so commands are **predictable and discoverable**:

```powershell
Get-Verb | Select-Object -First 10        # the approved verbs
Get-Command -Noun Service                 # all cmdlets that act on services
Get-Command -Verb Get -Noun *network*     # discover by verb + noun
```

Because of this consistency, if you know a noun (`Service`) you can guess the cmdlets
(`Get-Service`, `Start-Service`, `Stop-Service`, `Restart-Service`, `Set-Service`).
Many Unix command names exist as **aliases** (`ls`, `cat`, `ps`, `cd`) that map to the
real cmdlets, easing the transition.

## Part 3 — Inspecting objects with Get-Member

Since everything is an object, the key discovery cmdlet is **`Get-Member`** — it shows
an object's **properties** (data) and **methods** (actions):

```powershell
Get-Process | Get-Member                       # everything a Process has
Get-Process | Get-Member -MemberType Property   # just the data fields
Get-Item .  | Get-Member -MemberType Method      # actions a file/dir object can do
```

`Get-Member` answers "what can I get from this / do with this?" — the equivalent of
reading a man page for the *data*, not the command. Whenever you're unsure what to
filter or select on, pipe to `Get-Member`.

## Part 4 — The core pattern

The pattern you'll use more than any other: **get** objects, **filter** them, **sort**
them, **select** what you want:

```powershell
Get-Process |
  Where-Object { $_.CPU -gt 10 } |          # FILTER: keep objects matching a condition
  Sort-Object CPU -Descending |             # SORT by a property
  Select-Object -First 5 Name, Id, CPU      # SELECT properties (and limit count)
```

- **`Where-Object`** filters by a condition. `$_` (or `$PSItem`) is "the current
  object." Simplified syntax also works: `Where-Object CPU -gt 10`.
- **`Sort-Object`** orders by one or more properties (`-Descending` for reverse).
- **`Select-Object`** picks **properties** (a projection) and can `-First`/`-Last N`,
  `-Unique`, or `-ExpandProperty` to get a raw value.

```powershell
Get-ChildItem -File | Where-Object Length -gt 1MB | Sort-Object Length -Descending |
  Select-Object Name, @{Name='MB';Expression={[math]::Round($_.Length/1MB,1)}}
```

> [!TIP]
> **`Get-* | Where-Object | Sort-Object | Select-Object`** is the PowerShell equivalent
> of `command | grep | sort | cut` — but operating on properties, not text columns.
> Learn this four-step rhythm and you can answer most "find me the X that match Y,
> sorted by Z" questions in one readable line. `$_` = the current pipeline object;
> reach for it constantly.

## Part 5 — Running PowerShell anywhere

Modern **PowerShell 7+** is cross-platform and open source — the command is **`pwsh`**:

```bash
# Linux/macOS: install PowerShell (e.g. via package manager), then:
pwsh                    # start an interactive PowerShell session
pwsh -c "Get-Process | Sort-Object CPU -Desc | Select -First 3 Name, CPU"
```

So the object-pipeline skills transfer beyond Windows — you can use PowerShell for
cross-platform automation, and many tools (Azure, AWS, Kubernetes) ship PowerShell
modules. (`powershell.exe` is the older Windows-only 5.1; `pwsh` is the modern one.)

## Hands-on lab

```powershell
# 1. Prove it's objects
Get-Process | Get-Member -MemberType Property | Select-Object -First 8 Name
Get-Process | Select-Object -First 1 | Format-List Name, Id, CPU, WS

# 2. Discover commands by verb/noun
Get-Command -Noun Process
Get-Verb | Select-Object Verb -First 12

# 3. The core pattern: top 5 processes by memory, computed in MB
Get-Process | Sort-Object WS -Descending |
  Select-Object -First 5 Name, Id, @{N='MB';E={[math]::Round($_.WS/1MB,1)}}

# 4. Filter with $_ and with simplified syntax (same result)
Get-Service | Where-Object { $_.Status -eq 'Running' } | Measure-Object
Get-Service | Where-Object Status -eq Running | Select-Object -First 5 Name, Status

# 5. Files over 1 KB, largest first
Get-ChildItem -File | Where-Object Length -gt 1KB |
  Sort-Object Length -Descending | Select-Object Name, Length -First 5

# 6. Compare to "the Bash way" (parsing) — feel the difference
# Get-Process | Sort WS -Desc | Select -First 1 -ExpandProperty Name
```

## Exercises

1. Pipe `Get-Process` to `Get-Member` and list five **properties** you could filter or
   sort on.
2. Use `Get-Command` to discover all cmdlets with the noun `Service`.
3. Build a one-liner: the 5 largest files in the current directory, showing name and
   size in MB, largest first.
4. Show all running services, then only those whose name starts with a letter you
   choose, using `Where-Object`.
5. Explain, with an example, why accessing a `.Property` is better than parsing text
   output.

## Troubleshooting

- **"It returned text, how do I get one field?"** — it's an object. *Fix:* pipe to
  `Get-Member` to find the property, then `Select-Object -ExpandProperty Prop`.
- **`Where-Object` returns nothing** — wrong property name or type. *Fix:* check the
  exact property with `Get-Member`; ensure comparisons match the type (numbers vs
  strings).
- **A cmdlet "doesn't exist"** — wrong name or module not loaded. *Fix:* `Get-Command
  *keyword*`; import the module.
- **`$_` is empty** — used outside a pipeline/script block. *Fix:* `$_` only exists
  inside `Where-Object`/`ForEach-Object` blocks.
- **Output truncated/`...`** — default table formatting. *Fix:* `Format-List` (`fl`)
  for all properties, or `Select-Object` the ones you want.

Reproduce the objects-vs-text point: `(Get-Process | Sort WS -Desc | Select -First 1).Name`
returns the top memory process's name directly — no `awk`/column-counting needed.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Run the practical items.

1. What does the PowerShell pipeline pass, and how does that differ from Bash?
2. Why does that eliminate text parsing?
3. What naming pattern do cmdlets follow, and why is it useful?
4. Which cmdlet shows an object's properties and methods?
5. Name the four cmdlets in the core filter/sort/select pattern.
6. What does `$_` represent?
7. What does `Select-Object -ExpandProperty` do?
8. What command runs cross-platform PowerShell?
9. **Practical:** top 5 processes by memory with size in MB.
10. **Practical:** all running services, filtered by a name prefix.

## Solutions & validation

1. **Objects** (structured, with properties); Bash passes **text** you must parse.
2. You access a **named property** instead of extracting a column from text.
3. **Verb-Noun** (e.g. `Get-Service`) — predictable and **discoverable**
   (`Get-Command -Noun ...`).
4. `Get-Member`.
5. `Get-*`, `Where-Object`, `Sort-Object`, `Select-Object`.
6. The **current pipeline object** (inside `Where-Object`/`ForEach-Object`).
7. Returns the **raw value** of a single property instead of an object wrapping it.
8. `pwsh` (PowerShell 7+).
9. **Validation:** `Get-Process | Sort-Object WS -Descending | Select -First 5 Name,
   @{N='MB';E={[math]::Round($_.WS/1MB,1)}}`.
10. **Validation:** `Get-Service | Where-Object Status -eq Running | Where Name -like
    'a*'`.

> [!TIP]
> Train yourself to think **"what property do I want?"** instead of "how do I parse
> this?" Pipe to `Get-Member` whenever unsure, and lean on the
> Get/Where/Sort/Select rhythm. That mental shift is 80% of becoming fluent in
> PowerShell.

## What's next

Next: **Lesson 802 — Cmdlets, Providers & Help.** Going deeper on the engine: how
`Get-Help` and `Get-Command` make you self-sufficient, the **providers** that expose
the filesystem, registry, environment and more as navigable drives, and how to read
cmdlet parameters and find examples — the discovery toolkit for the whole language.
