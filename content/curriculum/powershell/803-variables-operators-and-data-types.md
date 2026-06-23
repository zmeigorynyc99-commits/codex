---
title: "PowerShell — Variables, Operators & Data Types"
slug: "powershell-variables-operators-and-data-types"
track: "powershell"
trackName: "PowerShell"
module: "PowerShell Foundations"
order: 803
level: "Beginner"
difficulty: "Beginner"
distribution: "Cross-platform"
category: "Shell & Scripting"
tags: [powershell, variables, operators, arrays, hashtables, beginner]
cover: "/covers/curriculum/powershell.svg"
estMinutes: 55
status: "published"
summary: "The building blocks of every PowerShell script: variables and types, string interpolation and here-strings, the comparison/logical operators (-eq, -gt, -match, -like), and the two collections you will use constantly — arrays and hashtables — for holding and shaping data."
seoTitle: "PowerShell 3: Variables, Operators, Arrays & Hashtables"
seoDescription: "Beginner PowerShell: variables and types, string interpolation, -eq/-gt/-match/-like operators, arrays and hashtables. Hands-on lab, exercises and assessment."
---

You can pipe objects all day, but real scripts need to **hold** values, **compare**
them, and **collect** them. This lesson covers PowerShell's data fundamentals:
**variables** and their types, **string interpolation** and here-strings, the family of
**operators** (`-eq`, `-gt`, `-match`, `-like`, `-and`/`-or`), and the two collections
you reach for constantly — **arrays** (ordered lists) and **hashtables** (key/value
maps). These are the nouns and verbs of every script you'll write.

## Learning objectives

By the end of this lesson you will be able to:

- Declare **variables** and understand their **types** (and how to cast).
- Build strings with **interpolation**, here-strings, and the format operator `-f`.
- Use **comparison** (`-eq`, `-gt`, `-like`, `-match`), **logical** (`-and`, `-or`,
  `-not`), and **type/contains** operators.
- Create and manipulate **arrays**.
- Create and look up values in **hashtables**.

## Part 1 — Variables and types

Variables start with `$`. PowerShell is **dynamically typed** but values have **real
.NET types** — and you can pin a type:

```powershell
$name = 'Ada'                 # string
$count = 42                   # int
$pi = 3.14159                 # double
$ok = $true                   # boolean
[int]$port = '8080'           # cast/constrain: stored as the int 8080
$name.GetType().Name          # String  -- everything is a typed object

$x = Read-Host 'Enter a number'   # ALWAYS a string from input...
[int]$x = Read-Host 'Number'      # ...cast it if you need to do math
```

Some variables are **automatic** (set by PowerShell): `$_`/`$PSItem` (current pipeline
object), `$true`/`$false`/`$null`, `$args`, `$PSVersionTable`, `$Error`, `$PWD`.

> [!IMPORTANT]
> Input is **text**. `Read-Host`, file contents, and command-line args arrive as
> **strings** — `'2' + '2'` is `'22'`, not `4`. **Cast** when you need a number
> (`[int]`, `[double]`, `[datetime]`). Constraining a variable's type (`[int]$port = …`)
> also makes it **reject** bad assignments later, catching bugs early.

## Part 2 — Strings: interpolation and here-strings

```powershell
$user = 'Ada'
'Hello $user'                 # SINGLE quotes = literal:  Hello $user
"Hello $user"                 # DOUBLE quotes = expand:   Hello Ada
"Path: $($env:HOME)/logs"     # $( ) evaluates an expression inside a string
"2 + 2 = $(2 + 2)"            # subexpression: 2 + 2 = 4

# Here-string for multi-line / quotes-heavy text
$report = @"
User:  $user
When:  $(Get-Date -Format 'yyyy-MM-dd')
"@

# Format operator -f (like printf)
'{0,-10} {1,6:N2}' -f 'cpu', 12.3     # left/right alignment + number format
```

Single quotes are literal; **double quotes interpolate** `$variables` and `$( )`
subexpressions. Use `$($obj.Property)` inside strings to expand a property (plain
`"$obj.Property"` would stringify `$obj` then append `.Property`).

## Part 3 — Operators

PowerShell uses **dash-word** comparison operators (not `>`/`==`, which mean
redirection/other things):

```powershell
5 -eq 5            # equal          -> True
5 -ne 3            # not equal      -> True
5 -gt 3 ; 5 -ge 5  # greater / greater-or-equal
3 -lt 5 ; 3 -le 3  # less / less-or-equal

'PowerShell' -like 'Power*'      # wildcard match      -> True
'error 500' -match '\d+'         # regex match         -> True (sets $matches)
'a,b,c' -split ','               # -> a b c (array)
'a','b','c' -join '-'            # -> a-b-c

1,2,3 -contains 2                # collection contains value -> True
2 -in 1,2,3                      # value in collection       -> True

($x -gt 0) -and ($x -lt 10)      # logical AND
($a -eq 1) -or ($b -eq 2)        # logical OR
-not $ok ; !$ok                  # negation

# Case sensitivity: prefix with c (-ceq, -clike, -cmatch); i = explicit insensitive
'ABC' -ceq 'abc'                 # -> False
```

> [!TIP]
> Comparisons are **case-insensitive by default** (`'ABC' -eq 'abc'` is True) — prefix
> with **`c`** for case-sensitive (`-ceq`, `-cmatch`). When a comparison operator is
> applied to an **array**, it acts as a **filter** and returns the matching elements:
> `1,2,3,4 -gt 2` returns `3,4`. That's a handy quick filter without `Where-Object`.

## Part 4 — Arrays

Ordered lists, zero-indexed:

```powershell
$nums = 1, 2, 3, 4, 5
$nums = @(1, 2, 3)               # @() is explicit array syntax
$empty = @()
$nums[0]                          # 1   (first)
$nums[-1]                         # last element
$nums[1..3]                       # slice: elements 1,2,3
$nums.Count                       # length
$nums += 6                        # "append" (builds a NEW array — fine for small sets)
$nums -contains 3                 # membership test
$nums | ForEach-Object { $_ * 2 } # transform each

$mixed = 'a', 1, $true            # arrays can hold mixed types
foreach ($n in $nums) { "n=$n" }  # iterate
```

> [!IMPORTANT]
> `$array += $item` does **not** grow the array in place — it **creates a new array**
> and copies everything. Fine for small loops; for thousands of items use a
> **`[System.Collections.Generic.List[object]]`** and `.Add()`, or just **collect from
> the pipeline** (`$result = Get-Thing | Where …`), which is idiomatic and fast.

## Part 5 — Hashtables

Key/value maps — the workhorse for structured data, lookups, and `-f`/splatting:

```powershell
$user = @{ Name = 'Ada'; Role = 'admin'; Id = 42 }
$user['Name']                     # Ada
$user.Role                        # admin (dot access works too)
$user.Email = 'ada@x.io'          # add a key
$user.Remove('Id')                # remove a key
$user.Keys ; $user.Values         # enumerate
$user.ContainsKey('Role')         # True

# Iterate
foreach ($k in $user.Keys) { "$k = $($user[$k])" }
$user.GetEnumerator() | Sort-Object Name | ForEach-Object { "$($_.Key): $($_.Value)" }

# Ordered hashtable preserves insertion order (great for building objects/CSV rows)
$row = [ordered]@{ Time = Get-Date; Host = $env:COMPUTERNAME; Status = 'OK' }
[pscustomobject]$row              # turn a hashtable into a real object
```

> [!TIP]
> A hashtable cast to **`[pscustomobject]`** becomes a first-class object with named
> properties — perfect for building rows to `Export-Csv` or `ConvertTo-Json`. Use
> **`[ordered]@{}`** when key order matters (reports, CSV columns). Hashtables also power
> **splatting** (passing a bundle of parameters to a cmdlet) — you'll meet that in the
> functions lesson.

## Hands-on lab

```powershell
# 1. Variables and casting
$a = '10'; $b = '5'
"$a + $b string  = $($a + $b)"          # 105 (concatenation)
"$a + $b numeric = $([int]$a + [int]$b)" # 15

# 2. Strings
$svc = 'nginx'
"Service $svc on $(hostname) at $(Get-Date -Format HH:mm)"
'{0,-8}{1,5}' -f $svc, 200

# 3. Operators as filters
1..10 -gt 6                               # 7 8 9 10
'web01','db02','web03' -like 'web*'       # web01 web03
'HTTP 404 not found' -match '\b(\d{3})\b'; $matches[1]   # 404

# 4. Arrays
$ports = 22, 80, 443
$ports += 8080
"count=$($ports.Count) last=$($ports[-1])"
$ports | ForEach-Object { "port $_" }

# 5. Hashtables -> object -> JSON
$h = [ordered]@{ host = $env:COMPUTERNAME; up = $true; load = 0.7 }
[pscustomobject]$h | ConvertTo-Json
```

## Exercises

1. Read a number with `Read-Host`, cast it, and print its square. Show why the cast is
   necessary.
2. Build a one-line status string using interpolation **and** a `$( )` subexpression.
3. Use an array comparison (`-gt` or `-like`) to filter a list **without**
   `Where-Object`.
4. Given `$nums = 5,2,9,1`, print the count, the largest (`Sort-Object`/`Measure-Object`
   or `-Descending`), and the last element.
5. Build a hashtable describing a server (name, ip, role), convert it to a
   `[pscustomobject]`, and export a single-row CSV.

## Troubleshooting

- **`'2' + '2'` gives `22`** — string concatenation. *Fix:* cast to `[int]` first.
- **`"$obj.Name"` prints the object then `.Name`** — *Fix:* use `"$($obj.Name)"`.
- **`$var` not expanding** — you used **single** quotes. *Fix:* double quotes for
  interpolation.
- **`>` "doesn't compare"** — `>` is **redirection**. *Fix:* use `-gt`/`-lt`/`-eq`.
- **`$arr += …` slow for big data** — copies each time. *Fix:* a `List[object]` or
  collect from the pipeline.
- **Hashtable key access returns nothing** — wrong key name/case is fine, but check
  `ContainsKey`. *Fix:* `$h.Keys` to see actual keys.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Run the practical items.

1. How do you force a value to be an integer?
2. What's the difference between single and double quotes?
3. How do you expand a property *inside* a string?
4. Which operator tests equality, and how do you make it case-sensitive?
5. What does `1,2,3,4 -gt 2` return, and why?
6. How do you get the last element of an array? Its length?
7. Why can `$array += $x` be slow at scale, and what's the alternative?
8. How do you create a hashtable and read one value two different ways?
9. **Practical:** turn a hashtable into a CSV row.
10. **Practical:** filter a string array with `-like` (no `Where-Object`).

## Solutions & validation

1. Cast: `[int]$x` (or `[int]$x = Read-Host`).
2. Single = **literal**; double = **interpolates** `$vars` and `$( )`.
3. `"$($obj.Name)"`.
4. `-eq`; case-sensitive is **`-ceq`**.
5. `3,4` — applied to an array, a comparison **filters** and returns matching elements.
6. `$arr[-1]`; length `$arr.Count`.
7. It **builds a new array** each time (O(n²)); use a `List[object]`/`.Add()` or collect
   from the pipeline.
8. `$h = @{ Name='Ada' }`; read via `$h['Name']` or `$h.Name`.
9. **Validation:** `[pscustomobject]$h | Export-Csv out.csv -NoTypeInformation`.
10. **Validation:** `'web01','db02' -like 'web*'`.

> [!TIP]
> Master four things and the language opens up: **cast input to the right type**,
> **interpolate with `$( )`**, **use `-operators` for comparisons**, and **store
> structured data in hashtables → `[pscustomobject]`**. Almost every script is variables
> + operators + a collection, wired through the pipeline you already know.

## What's next

Next: **Lesson 804 — Control Flow & Functions.** Turn data into logic: `if/elseif/else`,
`switch`, the loop family (`foreach`, `for`, `while`, `do`), and **functions** with
parameters, defaults, and pipeline input — the step from one-liners to reusable tools.
