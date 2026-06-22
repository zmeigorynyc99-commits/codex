---
title: "Shell & Bash Scripting — Variables, Quoting & Expansion"
slug: "bash-variables-quoting-and-expansion"
track: "shell-bash"
trackName: "Shell & Bash Scripting"
module: "Bash Foundations"
order: 302
level: "Beginner"
difficulty: "Beginner"
distribution: "General Linux"
category: "Shell & Scripting"
tags: [bash, variables, quoting, expansion, scripting, beginner]
cover: "/covers/curriculum/shell-bash.svg"
estMinutes: 55
status: "published"
summary: "The most important safety skill in Bash. Master variables and the critical difference between single and double quotes, why unquoted variables cause real bugs and data loss, plus the everyday expansions: braces, defaults, command and arithmetic substitution."
seoTitle: "Bash Scripting 2: Variables, Quoting (single vs double) & Expansion"
seoDescription: "Beginner Bash: variables, single vs double quotes, why to always quote variables, ${var} braces, default values, command and arithmetic substitution. Lab + assessment."
---

If you learn one thing in this whole track, learn to **quote your variables**. More
Bash bugs — and more accidental data loss — come from missing quotes than from
anything else. This lesson makes variables and quoting second nature, then adds the
everyday **expansions** that make scripts flexible: braces, default values, command
substitution and arithmetic. It's the difference between scripts that work only on
your tidy test data and scripts that survive filenames with spaces, empty values,
and the messy real world.

## Learning objectives

By the end of this lesson you will be able to:

- Define and use **variables** correctly (no spaces around `=`).
- Explain the difference between **single** and **double** quotes.
- Quote variables to avoid **word-splitting** and **globbing** bugs.
- Use **`${var}`** braces and **default-value** expansions.
- Use **command** `$( )` and **arithmetic** `$(( ))` substitution.

## Part 1 — Variables

```bash
name="botera"             # NO spaces around = (name = "x" is wrong!)
count=5
greeting="Hello, $name"   # variables expand inside double quotes
echo "$greeting"          # Hello, botera
echo "${name}_backup"     # braces separate the name from adjoining text
```

Rules that bite beginners:

- **No spaces** around `=`. `x = 5` tries to run a command `x`.
- Reference a variable with **`$name`** or **`${name}`**; assign with just `name=`.
- Variables are **strings** by default (even `count=5` is the string "5"); for math
  you use `$(( ))` (Part 5).

Make a variable available to **child processes** (other commands) with `export`:

```bash
export EDITOR=nano        # now programs this script launches can see EDITOR
```

## Part 2 — Single vs double quotes (the core distinction)

```bash
name="botera"
echo "Hello $name"        # double quotes: EXPANDS  -> Hello botera
echo 'Hello $name'        # single quotes: LITERAL  -> Hello $name
```

- **Double quotes `"..."`** preserve the text as one unit **but still expand**
  `$variables`, `$(commands)`, and `$((math))`. This is what you want **almost
  always**.
- **Single quotes `'...'`** are fully literal — **nothing** is expanded. Use them
  for fixed strings, regex/patterns, or anything with `$` you want kept literally.

```bash
echo "Path is $HOME"      # Path is /home/you
echo 'Path is $HOME'      # Path is $HOME
echo "Cost: \$5"          # backslash escapes a literal $ inside double quotes
```

## Part 3 — Why unquoted variables are dangerous

When you write `$var` **without** quotes, Bash does two risky things to the value:
**word-splitting** (splits it on spaces/tabs/newlines) and **globbing** (expands
`*`, `?`). With ordinary values you may never notice — until a value contains a
space or a wildcard:

```bash
file="My Report.txt"
rm $file                  # BUG: runs `rm My Report.txt` — TWO files, neither exists
rm "$file"               # correct: removes the single file "My Report.txt"

pattern="*"
echo $pattern             # expands to every filename in the directory!
echo "$pattern"           # prints a literal *
```

> [!IMPORTANT]
> **Always quote your variables: `"$var"`, `"$@"`, `"${arr[@]}"`.** The unquoted
> form is the single biggest source of Bash bugs and the cause of real disasters
> (the infamous `rm -rf "$DIR/"` where `$DIR` was empty deletes `/`). The habit:
> if you're not 100% sure you *want* splitting/globbing, quote it. You almost never
> want them.

The rare time you *don't* quote is when you deliberately want splitting (e.g.
turning a space-separated list into words) — and even then, arrays (Lesson 306) are
usually safer.

## Part 4 — Braces and default values

`${ }` does more than separate names. The everyday parameter expansions:

```bash
name="botera"
echo "${name}"                 # same as $name
echo "${name}_v2"             # disambiguate from following text

echo "${greeting:-Hello}"     # use "Hello" IF greeting is unset/empty (default)
echo "${count:=10}"           # default AND assign it if unset
echo "${must:?value required}"  # ERROR and exit if 'must' is unset (great for required args)
echo "${#name}"               # length of the value (6)
```

The **`:-` default** is invaluable for optional config and arguments:

```bash
dir="${1:-/var/log}"          # use $1 if given, else default to /var/log
port="${PORT:-8080}"          # env var or default
```

(You'll see much more parameter-expansion power — substrings, search/replace — in
Lesson 308.)

## Part 5 — Command and arithmetic substitution

```bash
today="$(date +%F)"           # command substitution: capture output
echo "Backup-$today.tar.gz"

count=$(( 2 + 3 * 4 ))        # arithmetic: count = 14
total=$(( count + 1 ))
echo "Total: $total"
(( count > 10 )) && echo "big"   # arithmetic test
i=0; (( i++ )); echo "$i"     # 1
```

Use **`$(( ))`** for integer math (Bash doesn't do floats — use `awk`/`bc` for
those). Combine everything safely with double quotes:

```bash
name="web01"
echo "Deploying $name at $(date +%T) (build #$(( BUILD + 1 )))"
```

## Hands-on lab

```bash
mkdir -p ~/quote-lab && cd ~/quote-lab

# 1. Variables and the = gotcha
name="botera"; count=5
echo "name=$name count=$count len=${#name}"
# x = 5    # (try it: "command not found" — spaces around = are wrong)

# 2. Single vs double quotes
echo "Home is $HOME"
echo 'Home is $HOME'

# 3. The quoting danger, demonstrated SAFELY
touch "My File.txt"
f="My File.txt"
echo "unquoted sees:"; for w in $f; do echo "  [$w]"; done   # two words!
echo "quoted sees:";   for w in "$f"; do echo "  [$w]"; done # one item
rm "$f"

# 4. Globbing surprise
touch a.txt b.txt; pattern="*.txt"
echo "unquoted: $(echo $pattern)"     # expands to filenames
echo "quoted:   $(echo "$pattern")"   # literal *.txt
rm a.txt b.txt

# 5. Defaults and required values
dir="${1:-/etc}"; echo "Listing $dir:"; ls "$dir" | head -3
port="${PORT:-8080}"; echo "port=$port"

# 6. Arithmetic
n=7; echo "double=$(( n * 2 )) inc=$(( n + 1 ))"
(( n > 5 )) && echo "n is greater than 5"

cd ~ && rm -r ~/quote-lab
```

## Exercises

1. Create a variable holding a filename **with a space**, then show that `ls $var`
   misbehaves but `ls "$var"` works.
2. Print the same string twice — once with `$HOME` expanded (double quotes) and once
   literal (single quotes).
3. Write a line that uses a default value: a variable `dir` that is `$1` if provided,
   otherwise `/var/log`, then list it.
4. Use arithmetic substitution to compute and print `(price * quantity)` for two
   variables.
5. Use `${var:?message}` to make a script exit with an error when a required variable
   is unset, and demonstrate it.

## Troubleshooting

- **Script breaks on filenames with spaces** — unquoted variable. *Fix:* `"$var"`
  everywhere.
- **A variable "turned into a list of files"** — its value had `*`/`?` and was
  unquoted (globbing). *Fix:* quote it.
- **`x = 5: command not found`** — spaces around `=`. *Fix:* `x=5`.
- **`$var` printed literally** — you used **single** quotes. *Fix:* double quotes to
  expand.
- **Empty variable caused a destructive command to hit the wrong path** — unset/empty
  value. *Fix:* quote **and** guard with `${var:?}` / `set -u` (Lesson 307).

Reproduce the splitting bug: `f="a b"; for w in $f; do echo "$w"; done` prints two
lines; quoting `"$f"` prints one — the whole lesson in four lines.

## Assessment

**Passing requirement: at least 9 of 11 correct (≈82%) — quoting is foundational.**

1. How do you assign a variable, and what's the rule about spaces?
2. What's the difference between single and double quotes?
3. Name the two dangerous things Bash does to an unquoted variable.
4. Why is `rm $file` risky but `rm "$file"` safe?
5. What does `${name}_v2` solve that `$name_v2` doesn't?
6. What does `${dir:-/var/log}` do?
7. What does `${must:?required}` do?
8. How do you do integer arithmetic, and what's the limitation?
9. When is it correct to leave a variable unquoted?
10. **Practical:** show that an unquoted variable with a space splits but a quoted
    one doesn't.
11. **Practical:** compute `n*2` with arithmetic substitution.

## Solutions & validation

1. `name=value` with **no spaces** around `=`.
2. **Double** quotes preserve the text as one unit but **expand** `$var`/`$(...)`/
   `$(())`; **single** quotes are fully **literal**.
3. **Word-splitting** (on whitespace) and **globbing** (`*`, `?`).
4. Unquoted, a value with spaces splits into multiple arguments (wrong files);
   `"$file"` keeps it as one argument.
5. The braces separate the variable name from following characters, so `_v2` isn't
   treated as part of the name (`$name_v2` looks for a variable `name_v2`).
6. Expands to `$dir` if set/non-empty, else the **default** `/var/log`.
7. Expands `must` if set, else prints the message to stderr and **exits with an
   error** — enforcing a required value.
8. `$(( ... ))`; it's **integer only** (no floats — use `awk`/`bc`).
9. Only when you **deliberately want** word-splitting/globbing (and even then arrays
   are usually safer).
10. **Validation:** `f="a b"; printf '[%s]\n' $f` (two lines) vs `printf '[%s]\n'
    "$f"` (one line).
11. **Validation:** `n=7; echo $(( n * 2 ))` prints `14`.

> [!TIP]
> "Quote everything unless you have a specific reason not to" is the rule that
> prevents the majority of Bash bugs. Pair it with **ShellCheck** (Lesson 307),
> which flags unquoted variables automatically, and you'll catch these before they
> ever run.

## What's next

Next: **Lesson 303 — Conditionals & Test.** Now that values are safe, your scripts
can start **making decisions**: `if`/`elif`/`else`, the `[[ ... ]]` test command,
file and string tests, combining conditions, and the cleaner `case` statement for
multi-way branching.
