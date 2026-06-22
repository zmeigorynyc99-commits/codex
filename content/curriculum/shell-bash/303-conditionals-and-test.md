---
title: "Shell & Bash Scripting — Conditionals & Test"
slug: "bash-conditionals-and-test"
track: "shell-bash"
trackName: "Shell & Bash Scripting"
module: "Bash Foundations"
order: 303
level: "Beginner"
difficulty: "Beginner"
distribution: "General Linux"
category: "Shell & Scripting"
tags: [bash, conditionals, if, test, case, scripting, beginner]
cover: "/covers/curriculum/shell-bash.svg"
estMinutes: 50
status: "published"
summary: "Make scripts decide. Master if/elif/else and the modern [[ ... ]] test command, file and string and numeric tests, combining conditions with && and ||, branching on a command's success, and the clean case statement for multi-way choices."
seoTitle: "Bash Scripting 3: Conditionals, [[ ]] Test & case"
seoDescription: "Beginner Bash: if/elif/else, the [[ ]] test command, file/string/numeric tests, combining conditions, branching on exit codes, and case statements. Lab + assessment."
---

A script that always does the same thing is just a list of commands. The power comes
from **deciding** — run the backup *only if* the directory exists, restart the
service *only if* it's down, warn *if* the disk is filling. This lesson gives you
Bash's decision tools: the `if` statement, the modern `[[ ... ]]` test, the file/
string/number tests you'll use constantly, and the tidy `case` statement for
multi-way branching.

## Learning objectives

By the end of this lesson you will be able to:

- Write **`if`/`elif`/`else`** blocks correctly.
- Use the **`[[ ... ]]`** test for files, strings and numbers.
- Combine conditions with **`&&`**, **`||`** and **`!`**.
- Branch on a **command's exit code** (not just on tests).
- Use **`case`** for clean multi-way branching.

## Part 1 — if / elif / else

```bash
#!/usr/bin/env bash
file="/etc/hosts"

if [[ -f "$file" ]]; then
    echo "$file is a regular file"
elif [[ -d "$file" ]]; then
    echo "$file is a directory"
else
    echo "$file is missing or something else"
fi
```

The shape is `if CONDITION; then ... fi`. The `; then` (or `then` on its own line)
and the closing **`fi`** are required. `elif` and `else` are optional. Mind the
spaces: `[[` and `]]` must have spaces around them and around the operators.

## Part 2 — The `[[ ... ]]` test

`[[ ... ]]` is Bash's built-in test command — prefer it over the older `[ ... ]`
(which is a program with sharp edges around quoting and `<`/`>`). The tests you'll
use most:

```bash
# Files
[[ -e "$p" ]]    # exists (any type)
[[ -f "$p" ]]    # is a regular file
[[ -d "$p" ]]    # is a directory
[[ -r "$p" ]]    # is readable     -w writable   -x executable
[[ -s "$p" ]]    # exists and is non-empty
[[ -L "$p" ]]    # is a symlink

# Strings
[[ -z "$s" ]]            # empty
[[ -n "$s" ]]            # non-empty
[[ "$a" == "$b" ]]       # equal
[[ "$a" != "$b" ]]       # not equal
[[ "$s" == prefix* ]]    # pattern match (glob) — note: RIGHT side unquoted
[[ "$s" =~ ^[0-9]+$ ]]   # regex match (=~), e.g. "is all digits"

# Numbers (note the -gt style, NOT > )
[[ "$n" -eq 5 ]]   # equal        -ne not equal
[[ "$n" -gt 5 ]]   # greater than  -lt less than
[[ "$n" -ge 5 ]]   # >=            -le <=
```

> [!IMPORTANT]
> **Use `[[ ]]` (not `[ ]`)**, and use **`-gt`/`-lt`** for numeric comparisons, not
> `>`/`<` (those mean redirection or string comparison). Mixing them is a classic
> bug: `[[ "$n" > 5 ]]` does a *string* comparison ("10" < "9"!), while `[[ "$n"
> -gt 5 ]]` does the *numeric* one you meant. Quote string operands; the right side
> of `==` is a **pattern** so quote it if you want a literal match.

## Part 3 — Combining conditions

```bash
# Inside [[ ]]: use && (and), || (or), ! (not)
if [[ -f "$f" && -r "$f" ]]; then echo "exists and readable"; fi
if [[ "$x" == "a" || "$x" == "b" ]]; then echo "a or b"; fi
if [[ ! -d "$d" ]]; then echo "not a directory"; fi

# Between whole commands: && and || chain on success/failure
mkdir -p /tmp/lab && cd /tmp/lab        # cd only if mkdir succeeded
ping -c1 host >/dev/null || echo "host unreachable"
```

`&&` runs the next thing only if the previous **succeeded** (exit 0); `||` runs it
only if the previous **failed**. Inside `[[ ]]` they combine *conditions*; between
commands they combine *commands* based on exit codes.

## Part 4 — Branching on a command's exit code

`if` doesn't need `[[ ]]` at all — it tests the **exit code** of any command. This
is often cleaner than parsing output:

```bash
if systemctl is-active --quiet nginx; then
    echo "nginx is running"
else
    echo "nginx is DOWN — restarting"
    sudo systemctl restart nginx
fi

if grep -q "ERROR" /var/log/app.log; then
    echo "errors found"
fi

if ping -c1 -W1 1.1.1.1 >/dev/null 2>&1; then echo "online"; else echo "offline"; fi
```

`grep -q`, `systemctl is-active --quiet`, and friends are designed for this — they
return success/failure and stay silent. Remember: **0 means success/true** in the
shell (the opposite of many programming languages).

## Part 5 — case: clean multi-way branching

When you're comparing one value against many patterns, `case` is far cleaner than a
ladder of `elif`:

```bash
#!/usr/bin/env bash
read -r -p "Action [start|stop|restart]: " action
case "$action" in
    start)            echo "starting...";   ;;
    stop)             echo "stopping...";   ;;
    restart|reload)   echo "restarting..."; ;;   # multiple patterns with |
    "")               echo "no action given"; ;;
    *)                echo "unknown: $action"; exit 1 ;;   # default
esac
```

Each branch is `pattern) commands ;;`. Patterns are **globs** (`*.txt`, `[0-9]*`,
`a|b`), `*` is the catch-all default, and `esac` ends the block. `case` is the
idiomatic way to handle subcommands and menu choices.

## Hands-on lab

```bash
mkdir -p ~/cond-lab && cd ~/cond-lab

# 1. File tests
touch data.txt
if [[ -f data.txt && -r data.txt ]]; then echo "data.txt is a readable file"; fi
if [[ ! -d data.txt ]]; then echo "and it is not a directory"; fi

# 2. String tests
name="botera"
[[ -n "$name" ]] && echo "name is set"
[[ "$name" == bot* ]] && echo "starts with bot"
[[ "12345" =~ ^[0-9]+$ ]] && echo "all digits"

# 3. Numeric tests (the -gt style)
n=12
if [[ "$n" -gt 10 ]]; then echo "$n is greater than 10"; fi
# Contrast (bug): [[ "$n" > 10 ]] would compare as STRINGS

# 4. Branch on a command's exit code
if grep -q root /etc/passwd; then echo "root user exists"; fi
if systemctl is-active --quiet ssh 2>/dev/null; then echo "ssh up"; else echo "ssh not active"; fi

# 5. case statement
for action in start stop reload bogus ""; do
  case "$action" in
    start)          echo "[$action] -> starting" ;;
    stop)           echo "[$action] -> stopping" ;;
    restart|reload) echo "[$action] -> restarting" ;;
    "")             echo "[empty] -> nothing to do" ;;
    *)              echo "[$action] -> UNKNOWN" ;;
  esac
done

cd ~ && rm -r ~/cond-lab
```

## Exercises

1. Write a script that takes a path in `$1` and prints whether it's a file, a
   directory, a symlink, or doesn't exist (use `if`/`elif`/`else`).
2. Write a numeric check that prints "low / medium / high" for a number based on
   thresholds, using the correct `-lt`/`-gt` operators.
3. Use a single `if` to act only if a service is **not** active (combine `!` with
   `systemctl is-active --quiet`).
4. Use `[[ =~ ]]` to validate that a variable looks like an IPv4-ish string (four
   dot-separated number groups) — a rough regex is fine.
5. Write a `case` statement that maps `start|stop|status|restart` to messages and
   rejects anything else with `exit 1`.

## Troubleshooting

- **`[: missing ']'` or weird errors** — spacing or `[ ]` quirks. *Fix:* use
  `[[ ... ]]` with spaces around brackets and operators.
- **Numeric comparison gives wrong result** — you used `>`/`<` (string compare).
  *Fix:* `-gt`/`-lt`/`-ge`/`-le`/`-eq`/`-ne`.
- **Pattern match `==` not matching** — you quoted the **right** side, making it
  literal. *Fix:* leave the glob unquoted (`[[ "$s" == pre* ]]`); quote it only for
  a literal match.
- **`if [[ ... ]]` always true/false unexpectedly** — empty unquoted variable.
  *Fix:* quote operands (`"$var"`).
- **`case` falls through / no match** — missing `;;`, or pattern is too specific.
  *Fix:* end each branch with `;;`; add a `*)` default.

Reproduce the numeric bug: `n=9; [[ "$n" > 10 ]] && echo yes` prints `yes` (string
compare!), while `[[ "$n" -gt 10 ]]` correctly prints nothing.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Run the practical items.

1. What are the required keywords that open and close an `if` block?
2. Why prefer `[[ ]]` over `[ ]`?
3. Which operators do numeric comparisons (give "greater than")?
4. What's the difference between `==` with a quoted vs unquoted right side?
5. How do you test that a string matches a regex?
6. How does `if` work without `[[ ]]` (branching on a command)?
7. In the shell, which exit code means "true"?
8. When is `case` better than `if`/`elif`, and how does each branch end?
9. **Practical:** branch on whether a service is active. Show the construct.
10. **Practical:** show the difference between numeric and string comparison of "9"
    and "10".

## Solutions & validation

1. `if` (with `then`) opens; **`fi`** closes.
2. `[[ ]]` is a Bash builtin with safer quoting, pattern (`==`) and regex (`=~`)
   support, and `&&`/`||` inside; `[ ]` is an external-style command with sharp
   edges.
3. `-gt`, `-lt`, `-ge`, `-le`, `-eq`, `-ne` (greater-than = `-gt`).
4. Unquoted right side of `==` is a **glob pattern**; quoted is a **literal** string.
5. `[[ "$s" =~ regex ]]`.
6. `if COMMAND; then ...` tests the command's **exit code** (0 = run the `then`
   branch).
7. **0** (success).
8. When matching one value against **many patterns**; each branch ends with `;;`.
9. **Validation:** `if systemctl is-active --quiet nginx; then ... else ... fi`.
10. **Validation:** `[[ "9" -gt "10" ]]` is false (numeric), `[[ "9" > "10" ]]` is
    true (string) — proving the difference.

> [!TIP]
> Two reflexes prevent most conditional bugs: **`[[ ]]` with `-gt`/`-lt` for
> numbers**, and **branch on exit codes** (`grep -q`, `is-active --quiet`) instead
> of parsing output. Clean, correct, and readable.

## What's next

Next: **Lesson 304 — Loops.** Decisions plus repetition is where automation gets
real. You'll iterate over files and lists with `for`, repeat while a condition holds
with `while`, read files line by line safely, and control loops with `break` and
`continue`.
