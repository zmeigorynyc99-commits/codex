---
title: "PowerShell — Cmdlets, Providers & Help"
slug: "powershell-cmdlets-providers-and-help"
track: "powershell"
trackName: "PowerShell"
module: "PowerShell Foundations"
order: 802
level: "Beginner"
difficulty: "Beginner"
distribution: "Cross-platform"
category: "Shell & Scripting"
tags: [powershell, cmdlets, providers, help, discovery, beginner]
cover: "/covers/curriculum/powershell.svg"
estMinutes: 45
status: "published"
summary: "Become self-sufficient in PowerShell. Master the discovery toolkit — Get-Command, Get-Help, Get-Member — read cmdlet parameters and examples, understand parameter binding and aliases, and use providers that expose the filesystem, registry, environment and more as navigable drives."
seoTitle: "PowerShell 2: Cmdlets, Providers & the Help System"
seoDescription: "Beginner PowerShell: Get-Command/Get-Help/Get-Member, reading parameters and examples, aliases, and providers (FileSystem, Registry, Env) as PSDrives. Lab + assessment."
---

The fastest way to learn PowerShell is to learn how to **learn PowerShell** — its
built-in discovery system is excellent. This lesson makes you self-sufficient:
**`Get-Command`** to find cmdlets, **`Get-Help`** to read them, **`Get-Member`** to
inspect objects, plus how to read **parameters**, use **aliases**, and navigate
**providers** (the filesystem, registry, environment variables, and more — all exposed
as drives you browse with the same cmdlets).

## Learning objectives

By the end of this lesson you will be able to:

- Discover cmdlets with **`Get-Command`**.
- Read documentation and examples with **`Get-Help`** (and update help).
- Read a cmdlet's **parameters** and use **named/positional** arguments.
- Use and find **aliases**.
- Navigate **providers** (FileSystem, Registry, Env, …) as **PSDrives**.

## Part 1 — Get-Command: find things

```powershell
Get-Command                          # every command available
Get-Command -Noun Service            # by noun
Get-Command -Verb Get -Noun *event*  # verb + wildcard noun
Get-Command *network*                # fuzzy search
Get-Command Get-Process | Format-List Name, ModuleName, CommandType
```

`Get-Command` is `apropos`/`which` for PowerShell — it finds cmdlets, functions,
aliases and external programs, and tells you which **module** provides each. When you
think "there must be a command for this," start here.

## Part 2 — Get-Help: read the manual

```powershell
Get-Help Get-Service                 # synopsis, syntax, parameters
Get-Help Get-Service -Examples       # examples (start here — fastest to learn)
Get-Help Get-Service -Full           # everything
Get-Help Get-Service -Parameter Name # detail on one parameter
Get-Help about_Pipelines             # conceptual "about_" topics
Update-Help                          # download the latest help (run once, admin)
```

> [!TIP]
> **`Get-Help <cmdlet> -Examples`** is the single most useful learning command — real
> invocations you can copy and adapt, far faster than reading full syntax. Run
> **`Update-Help`** once so help is complete. And the **`about_*`** topics
> (`Get-Help about_*` to list them) explain language concepts (pipelines, operators,
> scopes) — PowerShell's equivalent of in-depth manual sections.

## Part 3 — Reading parameters

A cmdlet's **syntax** shows its parameters:

```text
Get-ChildItem [[-Path] <string[]>] [-Filter <string>] [-Recurse] [-File] ...
```

- **`[-Path]`** in brackets = the parameter name is **optional** (can be positional).
- **`<string[]>`** = the type it expects (here, an array of strings).
- A switch like **`-Recurse`** takes no value — its presence means "on."
- Brackets around the whole thing `[-Filter <string>]` = the parameter is optional.

```powershell
Get-ChildItem -Path C:\ -Filter *.log -Recurse     # named parameters (clear)
Get-ChildItem C:\ *.log -Recurse                    # positional (Path, Filter)
Get-Process -Name pwsh, code                        # array argument
```

> [!IMPORTANT]
> Prefer **named parameters** (`-Path C:\`) over positional ones in scripts — they're
> self-documenting and immune to argument-order changes. Tab-completion completes
> parameter **names and even values**, so you rarely type them fully. And PowerShell
> **binds by type**: a parameter expecting `[string[]]` accepts one value or an array,
> which is why `Get-Process -Name a, b` just works.

## Part 4 — Aliases

Aliases are short names for cmdlets (and Unix-name compatibility):

```powershell
Get-Alias                            # all aliases
Get-Alias ls                         # ls -> Get-ChildItem
Get-Alias -Definition Get-ChildItem  # all aliases FOR a cmdlet (ls, dir, gci)
```

Common ones: `ls`/`dir`/`gci` → `Get-ChildItem`, `cat`/`gc` → `Get-Content`, `?` →
`Where-Object`, `%` → `ForEach-Object`, `select` → `Select-Object`, `sort` →
`Sort-Object`. Aliases are great **interactively**; in **scripts**, write the **full
cmdlet names** for readability and portability.

## Part 5 — Providers and PSDrives

PowerShell exposes many data stores as **providers**, each navigable as a **drive**
with the *same* cmdlets you use for files (`Get-ChildItem`, `Get-Item`, `Set-Location`):

```powershell
Get-PSProvider                       # FileSystem, Registry, Environment, Alias, ...
Get-PSDrive                          # the drives (C:, Env:, HKLM:, Alias:, Function:)

# Filesystem
Get-ChildItem C:\Users
# Environment variables as a drive
Get-ChildItem Env:                   # all env vars
$env:PATH                            # one env var
# Registry (Windows) as a drive
Get-ChildItem HKLM:\SOFTWARE | Select-Object -First 3
# Aliases / functions as drives
Get-ChildItem Alias: | Select-Object -First 5
```

> [!TIP]
> The **provider model** is why PowerShell feels consistent: the registry, environment
> variables, certificate store, and filesystem are all just **drives** you browse with
> `Get-ChildItem`/`Get-Item`/`Set-Location`. Learn the file cmdlets once and they work
> everywhere — `Get-ChildItem Env:` lists environment variables exactly like listing a
> folder. This is the spiritual cousin of Linux's "everything is a file."

## Hands-on lab

```powershell
# 1. Discover
Get-Command -Noun *item*
Get-Command *service* | Select-Object Name, ModuleName

# 2. Learn a cmdlet from its examples
Get-Help Get-ChildItem -Examples | Select-Object -First 1
Get-Help Get-ChildItem -Parameter Recurse

# 3. Named vs positional vs array params
Get-ChildItem -Path . -Filter *.md
Get-Process -Name pwsh, code -ErrorAction SilentlyContinue | Select Name, Id

# 4. Aliases
Get-Alias ? , % , gci, cat
Get-Alias -Definition Get-Content

# 5. Providers as drives
Get-PSProvider | Select-Object Name
Get-ChildItem Env: | Sort-Object Name | Select-Object -First 8 Name, Value
$env:USERNAME ?? $env:USER
# (Windows) Get-ChildItem HKCU:\Software | Select-Object -First 5 Name
```

## Exercises

1. Use `Get-Command` to find every cmdlet that works with "item", and identify which
   module they come from.
2. Read the **examples** for `Copy-Item` and write one that copies a folder
   recursively.
3. From the syntax of `Get-ChildItem`, explain what `[-Path]`, `<string[]>`, and
   `-Recurse` mean.
4. Find the cmdlet that `?` and `%` are aliases for, and the aliases for
   `Get-ChildItem`.
5. List your environment variables via the `Env:` drive and read one specific value.

## Troubleshooting

- **"I don't know the command"** — *Fix:* `Get-Command *keyword*`.
- **"I don't know the options"** — *Fix:* `Get-Help <cmd> -Examples` / `-Full`.
- **Help is sparse/missing** — *Fix:* `Update-Help` (admin, once).
- **A script using `?`/`%`/`ls` is unclear to others** — aliases. *Fix:* use full
  cmdlet names in scripts.
- **Wrong argument bound** — relied on positional order. *Fix:* use **named**
  parameters; tab-complete them.

Reproduce the provider idea: `Get-ChildItem Env:` and `Get-ChildItem C:\` both use the
same cmdlet on different providers — proving the consistent drive model.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Run the practical items.

1. Which cmdlet discovers commands, and how do you search by noun?
2. What's the fastest `Get-Help` switch for learning a cmdlet?
3. What do `about_*` help topics cover?
4. In syntax, what do brackets and `<string[]>` indicate?
5. Why prefer named parameters in scripts?
6. What is an alias, and where should you avoid them?
7. What is a provider, and name three.
8. How do you list environment variables using a provider?
9. **Practical:** read examples for a cmdlet of your choice.
10. **Practical:** list aliases for `Get-ChildItem`.

## Solutions & validation

1. `Get-Command`; `Get-Command -Noun <noun>`.
2. **`-Examples`**.
3. **Conceptual language topics** (pipelines, operators, scopes, etc.).
4. Brackets = **optional/positional**; `<string[]>` = expects a **string array** (type).
5. They're **self-documenting** and immune to argument-order changes.
6. A **short name** for a cmdlet; avoid in **scripts** (use full names).
7. A data store exposed as a **drive** navigable with file cmdlets; e.g. FileSystem,
   Registry, Environment, Alias, Function, Certificate.
8. `Get-ChildItem Env:` (or `$env:NAME` for one).
9. **Validation:** `Get-Help <cmd> -Examples`.
10. **Validation:** `Get-Alias -Definition Get-ChildItem` (ls, dir, gci).

> [!TIP]
> Three cmdlets make you self-sufficient forever: **`Get-Command`** (find it),
> **`Get-Help -Examples`** (use it), **`Get-Member`** (inspect what it returns). With
> those plus the provider model, you can explore and learn any corner of PowerShell on
> your own.

## What's next

Next: **Lesson 803 — Variables, Operators & Data Types.** The building blocks: typed
variables, strings and string interpolation, the comparison/logical operators
(`-eq`, `-gt`, `-match`), and the two collections you'll use constantly — **arrays**
and **hashtables** — for holding and shaping data in your scripts.
