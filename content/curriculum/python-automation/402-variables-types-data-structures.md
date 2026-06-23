---
title: "Python for Automation — Variables, Types & Data Structures"
slug: "python-variables-types-data-structures"
track: "python-automation"
trackName: "Python for Automation"
module: "Python Foundations"
order: 402
level: "Beginner"
difficulty: "Beginner"
distribution: "Cross-platform"
category: "Shell & Scripting"
tags: [python, types, lists, dicts, data-structures, beginner]
cover: "/covers/curriculum/python-automation.svg"
estMinutes: 55
status: "published"
summary: "The building blocks of real tools. Master strings, numbers and booleans, f-strings, and the two workhorse collections — lists and dicts — that hold parsed data and config, plus sets and tuples and the everyday operations you'll use in every ops script."
seoTitle: "Python for Automation 2: Types, Lists & Dicts for Ops"
seoDescription: "Beginner Python: strings/numbers/booleans, f-strings, lists, dicts (key/value), sets and tuples with the operations ops scripts use most. Hands-on lab and assessment."
---

Tools manipulate **data** — lines from a log, fields from a config, a list of
servers, a JSON response. This lesson covers Python's core data types and the two
collections you'll use constantly: **lists** (ordered sequences) and **dicts**
(key/value maps). Get comfortable here and the rest of the track — files, APIs,
parsing — is mostly applying these in context.

## Learning objectives

By the end of this lesson you will be able to:

- Use the basic types: **str, int, float, bool**, and `None`.
- Format text with **f-strings** and use key **string methods**.
- Build and operate on **lists** and **dicts**.
- Use **sets** and **tuples** where they fit.
- Iterate collections cleanly.

## Part 1 — Basic types

```python
name = "botera"          # str
count = 5                # int
load = 1.5               # float
active = True            # bool (True / False — capitalized!)
missing = None           # the "no value" object

type(count)              # <class 'int'>
int("42"), str(42), float("1.5")   # convert between types
```

Python is **dynamically typed** (no type declarations) but **strongly typed** (it
won't silently add a string to a number — `"3" + 4` is an error; convert first).
Unlike Bash where everything is a string, Python numbers really are numbers:

```python
3 + 4                    # 7 (real arithmetic, including floats and //, %, **)
7 // 2, 7 % 2, 2 ** 10   # 3, 1, 1024
```

## Part 2 — Strings and f-strings

```python
s = "Linux Networking"
len(s)                   # 16
s.lower(); s.upper()     # 'linux networking' / 'LINUX NETWORKING'
s.split()                # ['Linux', 'Networking']  (split on whitespace)
"a,b,c".split(",")       # ['a', 'b', 'c']
",".join(["a", "b"])     # 'a,b'  (join a list into a string)
"  trim  ".strip()       # 'trim'
s.replace("Linux", "GNU")
s.startswith("Linux"), "work" in s   # True, True
```

**f-strings** are the modern way to build text — embed expressions in `{ }`:

```python
host, cpu = "web01", 87.5
print(f"{host}: CPU {cpu}%")              # web01: CPU 87.5%
print(f"{cpu:.0f}%")                      # 88%  (format spec: 0 decimals)
print(f"{host:>10}|")                     # right-align in 10 cols
```

## Part 3 — Lists (ordered sequences)

```python
servers = ["web01", "web02", "db01"]
servers[0]               # 'web01' (0-indexed)
servers[-1]              # 'db01'  (negative = from the end)
servers[1:3]             # ['web02', 'db01']  (slice)
len(servers)             # 3

servers.append("cache01")        # add to the end
servers.insert(0, "lb01")        # insert at index
servers.remove("db01")           # remove by value
popped = servers.pop()           # remove & return the last
"web01" in servers               # True
sorted([3, 1, 2])                # [1, 2, 3] (returns a new sorted list)
servers.sort()                   # sort in place
```

Iterate, and build new lists concisely with a **list comprehension**:

```python
for s in servers:
    print(s)

upper = [s.upper() for s in servers]              # transform each
web = [s for s in servers if s.startswith("web")] # filter
```

> [!TIP]
> **List comprehensions** (`[expr for x in items if cond]`) are the Pythonic way to
> transform/filter a list in one readable line — the equivalent of a `for`-loop that
> appends. They're everywhere in real code; learn to read and write them early.

## Part 4 — Dicts (key/value maps)

Dicts are the most important structure for ops — parsed JSON, config, lookups, and
counters are all dicts:

```python
server = {"name": "web01", "cpu": 87.5, "up": True}
server["name"]                  # 'web01'
server["region"] = "eu"         # add/update a key
server.get("port", 80)          # value or a DEFAULT if the key is missing (no error)
"cpu" in server                 # True
del server["up"]                # remove a key
list(server.keys())             # ['name', 'cpu', 'region']
list(server.values())
server.items()                  # key/value pairs

for key, value in server.items():
    print(f"{key} = {value}")
```

> [!IMPORTANT]
> Use **`d.get(key, default)`** instead of `d[key]` when a key might be missing —
> `d[key]` raises `KeyError` and can crash your script, while `.get()` returns a safe
> default. This is the dict equivalent of Bash's `${var:-default}` and prevents a
> whole class of "it worked until the data was slightly different" failures.

## Part 5 — Sets and tuples

```python
# Set: unordered, UNIQUE elements — great for de-duplication and membership
ips = {"10.0.0.1", "10.0.0.2", "10.0.0.1"}     # -> {'10.0.0.1', '10.0.0.2'}
"10.0.0.1" in ips                               # fast membership test
set([1, 2, 2, 3])                               # {1, 2, 3} (dedupe a list)
a, b = {1, 2, 3}, {2, 3, 4}
a & b, a | b, a - b                             # intersection, union, difference

# Tuple: an ordered, IMMUTABLE sequence — fixed records, multiple return values
point = (10, 20)
host, port = ("web01", 443)                     # unpacking
```

Use a **set** to dedupe or test membership, and a **tuple** for fixed groupings you
won't change (coordinates, a host/port pair, returning several values from a
function).

## Hands-on lab

```bash
python3 - <<'EOF'
# 1. Types and conversion
print(type(5), type(5.0), type("5"), type(True))
print(int("42") + 8, "concat" + "!", f"{3.14159:.2f}")

# 2. Strings
s = "web01,web02,db01"
hosts = s.split(",")
print(hosts, len(hosts), "-".join(hosts))
print([h.upper() for h in hosts if h.startswith("web")])

# 3. Lists
nums = [5, 3, 9, 1]
nums.append(7); nums.sort()
print(nums, nums[0], nums[-1], nums[1:3], sum(nums), max(nums))

# 4. Dicts (the ops workhorse)
server = {"name": "web01", "cpu": 87.5}
server["region"] = "eu"
print(server["name"], server.get("port", 80))
for k, v in server.items():
    print(f"  {k}: {v}")

# 5. Sets and tuples
seen = set()
for ip in ["a", "b", "a", "c", "b"]:
    seen.add(ip)
print("unique:", sorted(seen))
host, port = ("api", 443)
print(f"{host}:{port}")

# 6. A tiny real task: count log levels
lines = ["INFO x", "ERROR y", "INFO z", "WARN q", "ERROR r"]
counts = {}
for line in lines:
    level = line.split()[0]
    counts[level] = counts.get(level, 0) + 1
print(counts)            # {'INFO': 2, 'ERROR': 2, 'WARN': 1}
EOF
```

## Exercises

1. Given the string `"alice:1001:admin"`, split it on `:` into a list and print the
   username, UID (as an int), and role.
2. Build a list of squares of 1–10 using a list comprehension, then filter it to
   only the even squares.
3. Create a dict describing a server (name, ip, cpu), add a `region` key, and safely
   read a possibly-missing `port` key with a default of 22.
4. De-duplicate a list of repeated IP strings using a set and print them sorted.
5. Count how many times each word appears in a short list using a dict and
   `.get(word, 0) + 1`.

## Troubleshooting

- **`TypeError: can only concatenate str ... to str`** — mixing types. *Fix:*
  convert (`str(n)`, `int(s)`) or use an f-string.
- **`KeyError`** — accessed a missing dict key with `[]`. *Fix:* use
  `d.get(key, default)` or check `key in d`.
- **`IndexError: list index out of range`** — index past the end. *Fix:* check
  `len()`; remember it's 0-indexed and `[-1]` is the last.
- **A list/dict "changed unexpectedly elsewhere"** — they're **mutable** and passed
  by reference. *Fix:* copy with `list(x)` / `dict(x)` / `x.copy()` when you need an
  independent version.
- **Set/dict "lost its order"** — sets are unordered (dicts keep insertion order in
  modern Python). *Fix:* `sorted()` a set when you need order.

Reproduce the KeyError lesson: `d = {"a": 1}; d["b"]` raises `KeyError`, while
`d.get("b", 0)` safely returns `0`.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Run the practical items.

1. Name Python's basic types and how to convert between str and int.
2. What is an f-string and how do you format a float to 2 decimals?
3. How do you index the last element of a list and take a slice?
4. What's a list comprehension, and write one that uppercases a list.
5. Why use `d.get(key, default)` instead of `d[key]`?
6. How do you iterate a dict's keys and values together?
7. What is a set best for, and a tuple?
8. How do lists/dicts behave when assigned to another variable (mutability)?
9. **Practical:** count occurrences of items in a list using a dict.
10. **Practical:** de-duplicate a list with a set and print it sorted.

## Solutions & validation

1. **str, int, float, bool** (and `None`); convert with `int("5")` / `str(5)`.
2. A string with embedded `{expressions}`; `f"{x:.2f}"` for 2 decimals.
3. `lst[-1]` for the last; `lst[1:3]` for a slice (start inclusive, stop exclusive).
4. `[expr for x in items if cond]`; e.g. `[s.upper() for s in lst]`.
5. `[]` raises **KeyError** on a missing key; `.get()` returns a safe **default**.
6. `for k, v in d.items(): ...`.
7. A **set** for uniqueness/fast membership/dedupe; a **tuple** for fixed,
   immutable groupings or multiple return values.
8. They're **mutable** and shared by reference; copy (`.copy()`/`list()`/`dict()`)
   for an independent version.
9. **Validation:** `counts[x] = counts.get(x, 0) + 1` in a loop.
10. **Validation:** `sorted(set(lst))`.

> [!TIP]
> Dicts and lists are 90% of ops data handling — parsed JSON is dicts and lists all
> the way down. Master `.get()`, comprehensions, and iterating `.items()`, and you
> can manipulate almost any data a tool throws at you.

## What's next

Next: **Lesson 403 — Control Flow & Functions.** You'll combine these data types
with decisions and repetition (`if`, `for`, `while`), and package logic into
reusable **functions** with parameters, defaults and return values — the structure
that turns snippets into maintainable tools.
