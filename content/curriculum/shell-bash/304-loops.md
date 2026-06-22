---
title: "Shell & Bash Scripting — Loops"
slug: "bash-loops"
track: "shell-bash"
trackName: "Shell & Bash Scripting"
module: "Bash Foundations"
order: 304
level: "Beginner"
difficulty: "Beginner"
distribution: "General Linux"
category: "Shell & Scripting"
tags: [bash, loops, for, while, read, scripting, beginner]
cover: "/covers/curriculum/shell-bash.svg"
estMinutes: 50
status: "published"
summary: "Do work over and over, correctly. Iterate over files and lists with for, repeat while a condition holds with while and until, read a file line by line the safe way, generate sequences and ranges, and control flow with break and continue."
seoTitle: "Bash Scripting 4: Loops (for, while, read line by line)"
seoDescription: "Beginner Bash: for loops over files/lists, while/until loops, reading files line by line safely with while read, ranges with seq and {1..n}, break and continue. Lab + assessment."
---

Decisions (Lesson 303) plus **repetition** is where automation earns its keep:
process every file in a folder, retry until something succeeds, read a list of
servers and act on each. This lesson covers Bash's loops — `for`, `while`, `until` —
and, crucially, the **safe** way to loop over files and read input line by line,
because the naive forms have real bugs around spaces and word-splitting.

## Learning objectives

By the end of this lesson you will be able to:

- Loop over files and lists with **`for`** (the safe glob form).
- Repeat with **`while`** and **`until`** based on a condition.
- Read a file **line by line** safely with `while read`.
- Generate sequences with **`{1..n}`** and `seq`.
- Control loops with **`break`** and **`continue`**.

## Part 1 — for loops

`for` iterates over a list of items, binding each to a variable:

```bash
for fruit in apple banana cherry; do
    echo "fruit: $fruit"
done

for i in 1 2 3; do echo "step $i"; done
```

The most useful form loops over **files** via a glob — and you must **quote the
variable** inside:

```bash
for file in *.log; do
    echo "Processing $file"
    gzip "$file"            # quoted! handles names with spaces
done

for dir in /etc /var /usr; do
    echo "$dir has $(ls "$dir" | wc -l) entries"
done
```

> [!IMPORTANT]
> **Loop over a glob (`for f in *.log`), never over `$(ls)`.** Parsing `ls` output
> breaks on filenames with spaces or newlines and is a classic anti-pattern. The
> glob form gives you real filenames safely. One subtlety: if a glob matches
> nothing, Bash leaves it literal (`*.log`); guard with `[[ -e "$file" ]]` or set
> `shopt -s nullglob` so a no-match loop simply doesn't run.

## Part 2 — Ranges and sequences

```bash
for i in {1..5}; do echo "$i"; done          # 1 2 3 4 5 (brace expansion)
for i in {0..20..5}; do echo "$i"; done       # 0 5 10 15 20 (step of 5)
for i in $(seq 1 5); do echo "$i"; done       # seq command (works with variables)
end=4; for i in $(seq 1 "$end"); do echo "$i"; done   # variable bound

# C-style for (good when you need arithmetic control)
for (( i=0; i<5; i++ )); do echo "i=$i"; done
```

Use **`{1..5}`** for fixed literal ranges (it's a brace expansion, so it can't use
variables), and **`seq`** or the **C-style** form when bounds come from variables.

## Part 3 — while and until

`while` repeats **as long as** a condition is true; `until` repeats **until** it
becomes true:

```bash
# Count with a condition
i=1
while [[ "$i" -le 5 ]]; do
    echo "i = $i"
    (( i++ ))
done

# Retry until a service responds (with a cap)
tries=0
until curl -fsS http://localhost:8080/health >/dev/null 2>&1; do
    (( tries++ >= 10 )) && { echo "gave up after $tries"; exit 1; }
    echo "waiting for service... ($tries)"
    sleep 2
done
echo "service is up"
```

`while`/`until` shine for **waiting**, **retrying**, and **reading input** — anything
where you don't know the count in advance.

## Part 4 — Reading a file line by line (safely)

The correct idiom is **`while read`** with the file redirected in:

```bash
while IFS= read -r line; do
    echo "got: $line"
done < servers.txt
```

- **`IFS=`** prevents leading/trailing whitespace from being trimmed.
- **`-r`** stops backslashes being interpreted.
- **`< file`** feeds the file into the loop's stdin.

```bash
# Process a list of hosts
while IFS= read -r host; do
    [[ -z "$host" || "$host" == \#* ]] && continue   # skip blanks and comments
    echo "pinging $host..."
    ping -c1 -W1 "$host" >/dev/null 2>&1 && echo "  up" || echo "  down"
done < hosts.txt
```

> [!IMPORTANT]
> **`while IFS= read -r line; do ... done < file`** is the canonical, safe way to
> read lines — it preserves whitespace and backslashes and handles arbitrary
> content. Avoid `for line in $(cat file)` — it word-splits on spaces (breaking
> multi-word lines) and globs. This one idiom is worth memorizing exactly.

## Part 5 — break and continue

```bash
# break: leave the loop early
for f in *.log; do
    [[ -e "$f" ]] || break          # no logs at all -> stop
    grep -q FATAL "$f" && { echo "FATAL in $f"; break; }
done

# continue: skip to the next iteration
for f in *; do
    [[ -d "$f" ]] && continue       # skip directories
    echo "file: $f"
done
```

`break` exits the loop entirely; `continue` skips the rest of the current iteration
and moves on. In nested loops, `break 2` / `continue 2` act on the **outer** loop.

## Hands-on lab

```bash
mkdir -p ~/loop-lab && cd ~/loop-lab
touch a.log b.log notes.txt
printf 'web01\nweb02\n\n# comment\ndb01\n' > hosts.txt

# 1. for over a glob (safe), quoting the variable
for f in *.log; do echo "log: $f"; done

# 2. Ranges
for i in {1..3}; do echo "brace $i"; done
end=3; for i in $(seq 1 "$end"); do echo "seq $i"; done
for (( i=0; i<3; i++ )); do echo "cstyle $i"; done

# 3. while with a counter
i=1; while [[ "$i" -le 3 ]]; do echo "count $i"; (( i++ )); done

# 4. Read a file line by line, skipping blanks/comments
while IFS= read -r host; do
  [[ -z "$host" || "$host" == \#* ]] && continue
  echo "host: $host"
done < hosts.txt

# 5. break / continue
for f in *; do
  [[ -d "$f" ]] && continue
  case "$f" in *.log) echo "skip log $f"; continue ;; esac
  echo "process $f"
done

cd ~ && rm -r ~/loop-lab
```

## Exercises

1. Loop over all `*.txt` files in a directory and print each filename and its line
   count (`wc -l`), quoting the variable.
2. Print the numbers 1–10 three different ways: `{1..10}`, `seq`, and a C-style
   `for`.
3. Write a `while` loop that counts down from 5 to 1, then prints "liftoff".
4. Read a file of hostnames line by line with the safe `while IFS= read -r` idiom,
   skipping blank lines and `#` comments.
5. Loop over a directory's entries and use `continue` to skip subdirectories, and
   `break` to stop at the first file named `STOP`.

## Troubleshooting

- **Loop misbehaves on filenames with spaces** — unquoted variable or looping over
  `$(ls)`. *Fix:* `for f in *.ext; do ... "$f" ...; done`.
- **Glob loop runs once with a literal `*.log`** — nothing matched. *Fix:* guard
  with `[[ -e "$f" ]] || continue`, or `shopt -s nullglob`.
- **Reading a file mangles whitespace/backslashes** — missing `IFS=` and/or `-r`.
  *Fix:* `while IFS= read -r line; do ... done < file`.
- **Counter loop never ends** — you forgot to increment (`(( i++ ))`). *Fix:* update
  the loop variable inside the body.
- **`{1..$n}` didn't expand** — brace expansion can't use variables. *Fix:* use
  `seq 1 "$n"` or a C-style `for`.

Reproduce the read pitfall: `for l in $(cat hosts.txt); do echo "[$l]"; done` splits
multi-word/space content; `while IFS= read -r l; do echo "[$l]"; done < hosts.txt`
preserves each line intact.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Run the practical items.

1. Write a `for` loop over all `*.conf` files that prints each name.
2. Why loop over a glob instead of `$(ls)`?
3. How do you handle a glob that matches nothing?
4. What's the difference between `while` and `until`?
5. Give the canonical safe idiom for reading a file line by line.
6. Why are `IFS=` and `-r` important in that idiom?
7. How do you generate 1–10 when the upper bound is in a variable?
8. What do `break` and `continue` do (and `break 2`)?
9. **Practical:** print each `*.txt` file with its line count. Loop?
10. **Practical:** read a hosts file, skipping blanks and comments. Loop?

## Solutions & validation

1. `for f in *.conf; do echo "$f"; done`.
2. The glob yields **real filenames** safely; parsing `ls` **word-splits** on spaces/
   newlines and globs — a bug source.
3. Guard with `[[ -e "$f" ]] || continue`, or enable `shopt -s nullglob` so the loop
   skips entirely.
4. `while` runs **while** the condition is true; `until` runs **until** it becomes
   true (i.e. while it's false).
5. `while IFS= read -r line; do ... done < file`.
6. `IFS=` preserves leading/trailing whitespace; `-r` preserves backslashes — so
   lines are read exactly.
7. `seq 1 "$n"` or `for (( i=1; i<=n; i++ ))` (brace `{1..$n}` won't expand a
   variable).
8. `break` exits the loop; `continue` skips to the next iteration; `break 2` exits
   the **outer** of two nested loops.
9. **Validation:** `for f in *.txt; do echo "$f $(wc -l < "$f")"; done`.
10. **Validation:** `while IFS= read -r h; do [[ -z "$h" || "$h" == \#* ]] && continue;
    echo "$h"; done < hosts.txt`.

> [!TIP]
> Two idioms carry most real scripts: **`for f in *glob`** (quote `"$f"`) and
> **`while IFS= read -r line; do ... done < file`**. Burn those into your fingers and
> you'll iterate over files and input correctly every time.

## What's next

Next: **Lesson 305 — Functions & Arguments.** As scripts grow you'll organize them
into reusable **functions**, pass them **arguments** (`$1`, `$@`), return results and
status, and handle your script's own command-line arguments — the structure that
turns a wall of commands into clean, maintainable tooling.
