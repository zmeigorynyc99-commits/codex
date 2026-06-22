---
title: "Shell & Bash Scripting — Arrays & Associative Arrays"
slug: "bash-arrays-and-associative-arrays"
track: "shell-bash"
trackName: "Shell & Bash Scripting"
module: "Structured Scripts"
order: 306
level: "Intermediate"
difficulty: "Intermediate"
distribution: "General Linux"
category: "Shell & Scripting"
tags: [bash, arrays, associative-arrays, data, scripting, intermediate]
cover: "/covers/curriculum/shell-bash.svg"
estMinutes: 50
status: "published"
summary: "Handle collections properly instead of faking them with space-separated strings. Use indexed arrays for lists and associative arrays (maps) for key/value data, iterate them safely with the quoted [@] form, build arrays from command output, and avoid the classic word-splitting traps."
seoTitle: "Bash Scripting 6: Arrays & Associative Arrays (maps)"
seoDescription: "Intermediate Bash: indexed arrays and associative arrays, safe iteration with \"${arr[@]}\", building arrays from output with mapfile, length and keys, and command arrays. Lab + assessment."
---

Real scripts handle **collections**: a list of servers to deploy to, a set of
packages to install, key/value configuration. Beginners fake these with
space-separated strings — which breaks the moment a value contains a space. Bash has
proper **arrays** (ordered lists) and **associative arrays** (maps/dictionaries);
using them correctly makes scripts robust and readable. This lesson shows the right
patterns and the quoting that keeps them safe.

## Learning objectives

By the end of this lesson you will be able to:

- Create and index **arrays**, and read length and all elements.
- Iterate arrays **safely** with `"${arr[@]}"`.
- Build arrays from **command output** (`mapfile`/`readarray`).
- Use **associative arrays** (key/value maps) and iterate keys.
- Use a **command array** to build a command safely.

## Part 1 — Indexed arrays

```bash
servers=(web01 web02 db01)        # create an array
echo "${servers[0]}"              # first element: web01 (0-indexed)
echo "${servers[2]}"              # db01
echo "${#servers[@]}"             # length: 3
echo "${servers[@]}"              # all elements
servers+=(cache01)                # append
servers[1]="web02b"               # set/replace by index
unset 'servers[0]'                # remove an element (leaves a gap in indices)
```

> [!IMPORTANT]
> **`"${servers[@]}"`** (quoted, `@`) expands to each element as a **separate, intact
> word** — this is what you want for iteration and passing to commands. `"${servers[*]}"`
> (star) joins everything into **one** string. Unquoted `${servers[@]}` word-splits
> and globs each element (the same danger as unquoted variables). Reflex: iterate and
> pass with **`"${arr[@]}"`**.

## Part 2 — Iterating arrays safely

```bash
servers=("web 01" "db 01" "cache")    # note: elements WITH spaces
for s in "${servers[@]}"; do          # quoted [@] keeps each element whole
    echo "deploying to [$s]"
done

# Index + value together
for i in "${!servers[@]}"; do          # ${!arr[@]} = the indices/keys
    echo "$i -> ${servers[$i]}"
done
```

Compare to the broken `for s in ${servers[@]}` (unquoted), which would split
`"web 01"` into `web` and `01`. The quoted form is the only correct one for arbitrary
values.

## Part 3 — Building arrays from output

To turn command output (one item per line) into an array, use **`mapfile`** (a.k.a.
`readarray`) — it handles spaces correctly, unlike `arr=($(cmd))`:

```bash
mapfile -t files < <(find . -maxdepth 1 -type f)   # -t strips trailing newlines
echo "found ${#files[@]} files"
for f in "${files[@]}"; do echo "  $f"; done

# Split a delimited string into an array
IFS=',' read -r -a parts <<< "a,b,c,d"
echo "${parts[1]}"        # b
```

> [!TIP]
> Prefer **`mapfile -t arr < <(command)`** over **`arr=($(command))`**. The latter
> word-splits and globs the command's output (breaking on spaces and expanding `*`);
> `mapfile` reads it line by line, safely. The `< <(...)` is **process substitution**
> — it feeds a command's output where a file is expected.

## Part 4 — Associative arrays (maps)

For **key/value** data, declare an associative array with `declare -A` (Bash 4+):

```bash
declare -A color
color[apple]="red"
color[banana]="yellow"
color["dragon fruit"]="pink"     # keys can contain spaces (quote them)

echo "${color[apple]}"           # red
echo "${#color[@]}"              # number of entries: 3

# Iterate keys and values
for fruit in "${!color[@]}"; do   # ${!map[@]} = the KEYS
    echo "$fruit is ${color[$fruit]}"
done

# Membership test
if [[ -v color[apple] ]]; then echo "have apple"; fi
[[ -n "${color[grape]:-}" ]] || echo "no grape"
```

Associative arrays are perfect for counters, lookups, and config:

```bash
declare -A count
for word in apple banana apple cherry apple; do
    (( count[$word]++ ))         # tally occurrences
done
for w in "${!count[@]}"; do echo "$w: ${count[$w]}"; done
```

## Part 5 — Command arrays (build commands safely)

When a command's arguments are dynamic (some optional), build them in an **array** so
quoting stays correct:

```bash
cmd=(rsync -a)
[[ "$verbose" == 1 ]] && cmd+=(-v)
[[ -n "$exclude" ]] && cmd+=(--exclude "$exclude")
cmd+=("$src" "$dest")
"${cmd[@]}"                       # run it — each element stays a separate argument
```

This avoids the trap of building a command in a **string** and having `eval`/word-
splitting mangle paths with spaces. A command array is the clean, safe way to
assemble dynamic command lines.

## Hands-on lab

```bash
mkdir -p ~/arr-lab && cd ~/arr-lab
touch "a file.txt" b.txt c.log

# 1. Indexed array basics
fruits=(apple banana cherry)
echo "count=${#fruits[@]} first=${fruits[0]} all=${fruits[*]}"
fruits+=(date); echo "after append: ${fruits[*]}"

# 2. Safe iteration with spaces
items=("a file.txt" "b.txt")
for i in "${items[@]}"; do echo "[$i]"; done       # each stays whole

# 3. Build an array from output the SAFE way
mapfile -t files < <(find . -maxdepth 1 -type f -printf '%f\n')
echo "files: ${#files[@]}"; for f in "${files[@]}"; do echo "  $f"; done

# 4. Split a CSV line
IFS=',' read -r -a parts <<< "one,two,three"
echo "middle=${parts[1]}"

# 5. Associative array as a counter
declare -A tally
for w in red blue red green red blue; do (( tally[$w]++ )); done
for k in "${!tally[@]}"; do echo "$k = ${tally[$k]}"; done

# 6. Command array
cmd=(ls -l); [[ -d /etc ]] && cmd+=(/etc)
"${cmd[@]}" | head -2

cd ~ && rm -r ~/arr-lab
```

## Exercises

1. Create an indexed array of three hostnames (one containing a space), print its
   length, and iterate it safely so the spaced element stays intact.
2. Build an array of the regular files in `/etc` using `mapfile` and print how many
   there are.
3. Split the string `name=botera;role=admin;tier=2` on `;` into an array and print
   each element.
4. Create an associative array mapping three usernames to UIDs, then iterate keys to
   print `user -> uid`.
5. Use an associative array to count the occurrences of words in a short list, then
   print each word with its count.

## Troubleshooting

- **Array element with a space split into two** — unquoted expansion. *Fix:* iterate/
  pass with `"${arr[@]}"`.
- **`arr=($(cmd))` broke on spaces / expanded `*`** — word-splitting + globbing.
  *Fix:* `mapfile -t arr < <(cmd)`.
- **`declare -A` "command not found" / treated as indexed** — old Bash, or you used
  `declare -a`. *Fix:* Bash 4+; use `declare -A` for maps (check `bash --version`).
- **`"${arr[*]}"` joined everything into one string** — that's `*`'s job. *Fix:* use
  `[@]` for separate elements.
- **Key with spaces failed** — unquoted key. *Fix:* quote it: `map["my key"]=...`.

Reproduce the safety point: `a=("x y" z); for e in ${a[@]}; do echo "[$e]"; done`
prints three lines (split!); quoting `"${a[@]}"` prints two — the elements intact.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Run the practical items.

1. How do you create an indexed array and read its length?
2. What's the difference between `"${arr[@]}"` and `"${arr[*]}"`?
3. Why is unquoted `${arr[@]}` dangerous?
4. How do you safely build an array from command output?
5. How do you declare an associative array, and what version of Bash is needed?
6. How do you iterate the **keys** of an associative array?
7. What does `IFS=',' read -r -a arr <<< "$str"` do?
8. Why build dynamic commands as an array instead of a string?
9. **Practical:** iterate an array containing a spaced element without splitting it.
10. **Practical:** count words with an associative array.

## Solutions & validation

1. `arr=(a b c)`; length `"${#arr[@]}"`.
2. `[@]` expands to **separate words** (correct for iteration/passing); `[*]` joins
   into **one** string.
3. It **word-splits and globs** each element (spaces break, `*` expands) — same risk
   as unquoted variables.
4. `mapfile -t arr < <(command)` (reads line by line, no splitting/globbing).
5. `declare -A name`; requires **Bash 4+**.
6. `for k in "${!arr[@]}"; do ...; done`.
7. **Splits** `$str` on `,` into the array `arr` (here-string fed to `read -a`).
8. So each argument stays a **separate, correctly-quoted** word — avoiding word-
   splitting/`eval` traps with spaces.
9. **Validation:** `a=("x y" z); for e in "${a[@]}"; do echo "[$e]"; done` → two
   lines.
10. **Validation:** `declare -A c; for w in a b a; do (( c[$w]++ )); done` → `a=2
    b=1`.

> [!TIP]
> Whenever you catch yourself storing a list in a space-separated string, reach for
> an **array** instead — and iterate with **`"${arr[@]}"`**. Use **associative
> arrays** for any key/value lookup or counting. These two structures eliminate a
> whole category of fragile string-parsing code.

## What's next

Next: **Lesson 307 — Robust Scripts: Errors, Traps & Exit Codes.** The capstone of
safe scripting: `set -euo pipefail`, trapping signals for cleanup, meaningful exit
codes, defensive patterns, and ShellCheck — everything that turns a script that
"works on my machine" into one you can schedule and trust in production.
