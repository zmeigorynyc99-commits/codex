---
title: "Python for Automation — Control Flow & Functions"
slug: "python-control-flow-and-functions"
track: "python-automation"
trackName: "Python for Automation"
module: "Python Foundations"
order: 403
level: "Beginner"
difficulty: "Beginner"
distribution: "Cross-platform"
category: "Shell & Scripting"
tags: [python, control-flow, functions, loops, beginner]
cover: "/covers/curriculum/python-automation.svg"
estMinutes: 55
status: "published"
summary: "Make Python decide and repeat, then organize logic into reusable functions. Master if/elif/else, for and while loops with range and enumerate, break/continue, and functions with parameters, defaults, keyword arguments and return values — the structure of real tooling."
seoTitle: "Python for Automation 3: if/for/while & Functions"
seoDescription: "Beginner Python: if/elif/else, for loops with range/enumerate, while loops, break/continue, and functions with parameters, defaults, *args/**kwargs and returns. Lab + assessment."
---

Data (Lesson 402) plus **logic** is where programs come alive: decide based on
values, repeat over collections, and package reusable behavior into **functions**.
This lesson covers Python's control flow and function syntax — clean, readable, and
the backbone of every tool you'll build in this track.

## Learning objectives

By the end of this lesson you will be able to:

- Branch with **`if`/`elif`/`else`** and truthiness.
- Loop with **`for`** (over collections, `range`, `enumerate`) and **`while`**.
- Control loops with **`break`**, **`continue`**, and loop `else`.
- Define **functions** with parameters, **defaults** and **return** values.
- Use **keyword arguments** and a glimpse of `*args`/`**kwargs`.

## Part 1 — if / elif / else

```python
cpu = 92
if cpu > 90:
    print("critical")
elif cpu > 70:
    print("warning")
else:
    print("ok")
```

Conditions use comparisons (`==, !=, <, >, <=, >=`) and the words **`and`**, **`or`**,
**`not`** (not `&&`/`||`). Python also has **truthiness**: empty things are falsy.

```python
items = []
if items:                    # empty list is falsy -> this is skipped
    print("has items")
if not items:
    print("empty")           # runs
name = ""
if name:                     # empty string is falsy
    ...
# Falsy: 0, 0.0, "", [], {}, (), set(), None, False. Everything else is truthy.
```

> [!TIP]
> Prefer `if items:` over `if len(items) > 0:` and `if value is None:` over
> `if value == None:`. Pythonic truthiness checks are cleaner and idiomatic. Use
> **`is`/`is not`** specifically for `None` (identity), and `==` for value equality.

## Part 2 — for loops

`for` iterates over any collection — and you rarely need indices:

```python
for server in ["web01", "db01"]:
    print(server)

for key, value in {"cpu": 90, "mem": 60}.items():
    print(f"{key}={value}")

for i in range(5):           # 0,1,2,3,4
    print(i)
for i in range(1, 6):        # 1..5
    ...
for i in range(0, 20, 5):    # 0,5,10,15 (start, stop, step)
    ...

# Index AND value together — the Pythonic way:
for index, server in enumerate(["web01", "db01"], start=1):
    print(f"{index}: {server}")
```

> [!IMPORTANT]
> Don't loop with `for i in range(len(items)): items[i]` — that's a non-Pythonic
> habit from other languages. Iterate the collection **directly** (`for x in
> items`), and use **`enumerate(items)`** when you genuinely need the index too. It's
> shorter, clearer, and avoids off-by-one errors.

## Part 3 — while, break, continue

```python
tries = 0
while tries < 5:
    if check_service():
        break                # leave the loop early
    tries += 1               # Python has no ++, use += 1
    time.sleep(2)

for line in lines:
    if not line.strip() or line.startswith("#"):
        continue             # skip blanks/comments, go to next iteration
    process(line)
```

`while` repeats while a condition holds; `break` exits a loop; `continue` skips to
the next iteration. (Bonus: a loop can have an `else` clause that runs only if the
loop **didn't** `break` — handy for search-and-report-not-found.)

## Part 4 — Functions

```python
def greet(name):
    """Return a greeting (docstring describes what it does)."""
    return f"Hello, {name}!"

message = greet("Alex")          # call it; capture the return value
print(message)

def is_healthy(cpu, mem):
    return cpu < 90 and mem < 90  # returns a bool
```

Functions take **parameters**, can **return** a value (or `None` if no `return`), and
should have a **docstring**. Define before you call. Multiple return values come back
as a tuple:

```python
def stats(numbers):
    return min(numbers), max(numbers), sum(numbers) / len(numbers)

low, high, avg = stats([3, 7, 2, 8])   # unpack the tuple
```

## Part 5 — Defaults, keyword args, and *args/**kwargs

```python
def backup(src, dest="/backups", compress=True):   # defaults
    print(f"{src} -> {dest} (compress={compress})")

backup("/etc")                                  # uses defaults
backup("/etc", "/mnt/bak")                      # positional
backup("/etc", compress=False)                  # keyword arg (clear and safe)

# Accept any number of arguments:
def log(*args, **kwargs):
    print("positional:", args)      # a tuple
    print("keyword:", kwargs)       # a dict
log("a", "b", level="error")
```

> [!TIP]
> **Keyword arguments** (`compress=False`) make calls self-documenting and order-
> independent — far clearer than a string of positional values whose meaning you
> have to remember. Default parameters keep simple calls short while allowing
> customization. One gotcha: never use a **mutable default** (`def f(x=[])`); use
> `def f(x=None): x = x or []` instead, because a mutable default is shared across
> calls.

## Hands-on lab

```bash
python3 - <<'EOF'
# 1. Branching + truthiness
def classify(cpu):
    if cpu > 90: return "critical"
    elif cpu > 70: return "warning"
    return "ok"
for c in (95, 80, 40):
    print(c, "->", classify(c))

items = []
print("empty!" if not items else "has items")

# 2. for with range and enumerate
for i in range(1, 4):
    print("range", i)
for idx, host in enumerate(["web01", "db01"], start=1):
    print(f"{idx}: {host}")

# 3. while + break/continue
n, total = 0, 0
while n < 10:
    n += 1
    if n % 2: continue       # skip odds
    total += n
print("sum of evens 1..10:", total)

# 4. Functions: return, multiple returns, defaults, keywords
def stats(nums):
    return min(nums), max(nums), sum(nums)/len(nums)
lo, hi, avg = stats([3, 7, 2, 8])
print(f"min={lo} max={hi} avg={avg:.1f}")

def deploy(app, env="staging", dry_run=False):
    return f"deploy {app} to {env} (dry_run={dry_run})"
print(deploy("api"))
print(deploy("api", env="prod", dry_run=True))
EOF
```

## Exercises

1. Write `classify_disk(percent)` returning "ok"/"warning"/"full" using `if/elif/
   else`, and test it on several values.
2. Loop over a list of hostnames with `enumerate` and print `1: host`, `2: host`,
   etc.
3. Write a `while` loop that sums the even numbers from 1 to 20 using `continue`.
4. Write `average(numbers)` that returns the mean, and a function returning min, max,
   and average as a tuple you unpack.
5. Write `notify(message, level="info", urgent=False)` and call it three ways: with
   defaults, with a keyword arg, and with all positional.

## Troubleshooting

- **`IndentationError`** — block body not indented consistently. *Fix:* 4 spaces.
- **`SyntaxError` on `if x = 5`** — `=` is assignment; comparison is `==`. *Fix:*
  `if x == 5:`.
- **Function "returns None"** — you forgot `return` (or returned nothing). *Fix:*
  add an explicit `return value`.
- **`NameError: name 'foo' is not defined`** — used before defined, or a typo.
  *Fix:* define functions/variables before use; check spelling.
- **Default argument "remembers" across calls** — mutable default. *Fix:* use
  `def f(x=None): x = x or []`.

Reproduce the truthiness idiom: `if []:` is skipped while `if [0]:` runs — empty
collections are falsy, non-empty are truthy, regardless of contents.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Run the practical items.

1. What words does Python use for "and/or/not", and how do you compare equality?
2. What is truthiness — name three falsy values.
3. How do you loop with an index the Pythonic way?
4. What's the difference between `range(5)` and `range(1, 6)`?
5. How do `break` and `continue` differ?
6. How do you define a function that returns a value, and how do you capture it?
7. What are keyword arguments and why prefer them for clarity?
8. What's the danger of a mutable default argument?
9. **Practical:** write and call a function returning min/max/avg of a list.
10. **Practical:** loop a list printing `index: value` starting at 1.

## Solutions & validation

1. `and`, `or`, `not`; equality with `==` (and `is` for `None`).
2. Values that evaluate as false in a condition; three of: `0`, `""`, `[]`, `{}`,
   `None`, `False`.
3. With **`enumerate(items)`** (optionally `start=1`), not `range(len(...))`.
4. `range(5)` = 0–4; `range(1, 6)` = 1–5 (stop is exclusive).
5. `break` exits the loop entirely; `continue` skips to the next iteration.
6. `def f(...): return value`; capture with `x = f(...)`.
7. Named arguments at the call site (`compress=False`) — self-documenting and order-
   independent.
8. It's **shared across calls** (created once), causing surprising state buildup;
   use `None` + assign inside.
9. **Validation:** `def stats(n): return min(n),max(n),sum(n)/len(n)`; `lo,hi,avg =
   stats([...])`.
10. **Validation:** `for i, v in enumerate(lst, 1): print(f"{i}: {v}")`.

> [!TIP]
> Idiomatic Python — direct iteration, `enumerate`, truthiness, small functions with
> docstrings and keyword args — reads almost like prose. Writing it the Pythonic way
> from the start makes your tools easier for you and others to maintain.

## What's next

Next: **Lesson 404 — Files & Text Processing.** Ops scripts live on files — configs,
logs, data. You'll open and read/write files the safe way (`with`), iterate lines,
parse and filter text, and handle paths with `pathlib` — replacing many `cat`/`grep`/
`sed` pipelines with clear, testable Python.
