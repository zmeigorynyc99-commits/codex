---
title: "Shell & Bash Scripting — Functions & Arguments"
slug: "bash-functions-and-arguments"
track: "shell-bash"
trackName: "Shell & Bash Scripting"
module: "Structured Scripts"
order: 305
level: "Intermediate"
difficulty: "Intermediate"
distribution: "General Linux"
category: "Shell & Scripting"
tags: [bash, functions, arguments, getopts, scripting, intermediate]
cover: "/covers/curriculum/shell-bash.svg"
estMinutes: 55
status: "published"
summary: "Turn a wall of commands into clean, reusable tooling. Write functions with local variables, pass and validate arguments, return status and output, handle your script's own command-line arguments and options with getopts, and build a usage/help message."
seoTitle: "Bash Scripting 5: Functions, Arguments & getopts"
seoDescription: "Intermediate Bash: define functions with local vars, pass arguments ($1/$@/$#), return status vs output, parse script options with getopts, and write usage/help. Lab + assessment."
---

As scripts grow past a few lines they become hard to read and harder to change. The
fix is **structure**: break logic into **functions**, pass them **arguments**, and
handle your *script's own* command-line arguments and options cleanly. This is the
lesson that takes you from "a list of commands" to "a small, maintainable tool" with
a real `--help`, validated inputs, and reusable building blocks.

## Learning objectives

By the end of this lesson you will be able to:

- Define and call **functions**, using **`local`** variables.
- Pass and read function **arguments** (`$1`, `$@`, `$#`).
- Return **status** (exit code) vs **output** from a function.
- Handle a **script's** arguments and write a **usage** message.
- Parse **options/flags** with **`getopts`**.

## Part 1 — Functions

```bash
#!/usr/bin/env bash

greet() {
    echo "Hello, $1!"          # $1 is the function's first argument
}

log() {                        # a reusable timestamped logger
    echo "[$(date +%T)] $*"    # $* / $@ = all the function's arguments
}

greet "Alex"
log "starting backup"
```

Define with `name() { ... }`; call with just `name args`. Inside a function, the
positional parameters `$1`, `$2`, `$@`, `$#` refer to the **function's** arguments,
not the script's.

> [!IMPORTANT]
> **Declare function variables with `local`.** Without it, a variable inside a
> function is **global** and silently overwrites one of the same name elsewhere — a
> nasty, hard-to-find class of bug as scripts grow. `local src="$1"` keeps it
> scoped to the function. Make `local` a habit for every variable you create inside
> a function.

## Part 2 — Arguments, status, and output

A function communicates two ways: its **exit status** (for `if`/`&&`) and its
**stdout** (captured with command substitution):

```bash
# Status: return 0 for success, non-zero for failure
is_root() {
    [[ "$EUID" -eq 0 ]]        # the test's result becomes the function's status
}
if is_root; then echo "running as root"; fi

# Output: print to stdout, capture with $( )
timestamp() {
    date +%Y%m%d-%H%M%S
}
name="backup-$(timestamp).tar.gz"

# Validate arguments inside a function
backup_dir() {
    local src="$1" dest="$2"
    [[ -d "$src" ]] || { echo "not a dir: $src" >&2; return 1; }
    tar -czf "$dest" -C "$(dirname "$src")" "$(basename "$src")"
}
backup_dir /etc /tmp/etc.tgz || echo "backup failed"
```

> [!TIP]
> Keep the channels separate: **`return N`** for success/failure that callers test
> with `if`, and **`echo`/`printf`** for data the caller captures with `$( )`. Send
> error/diagnostic messages to **stderr** (`>&2`) so they don't pollute the value a
> caller is capturing. Bash functions can't "return" a string — they print it.

## Part 3 — Your script's own arguments

The same positional parameters apply at the **script** level:

```bash
#!/usr/bin/env bash
echo "script name: $0"
echo "first arg:   $1"
echo "all args:    $@"
echo "arg count:   $#"
shift                          # drop $1; $2 becomes $1, etc.
echo "after shift, first: $1"
```

Validate required arguments early, with a clear **usage** message:

```bash
#!/usr/bin/env bash
usage() {
    echo "Usage: $0 SOURCE_DIR DEST_DIR" >&2
    exit 1
}
[[ $# -eq 2 ]] || usage        # need exactly two arguments
src="$1" dest="$2"
```

## Part 4 — Options with getopts

For real tools you want **flags** (`-v`, `-o file`, `--help`). Bash's built-in
**`getopts`** parses short options cleanly:

```bash
#!/usr/bin/env bash
verbose=0
output=""

usage() { echo "Usage: $0 [-v] [-o FILE] NAME" >&2; exit 1; }

while getopts ":vo:h" opt; do
    case "$opt" in
        v) verbose=1 ;;
        o) output="$OPTARG" ;;     # ':' after o means it takes a value
        h) usage ;;
        \?) echo "unknown option: -$OPTARG" >&2; usage ;;
        :)  echo "option -$OPTARG needs a value" >&2; usage ;;
    esac
done
shift $(( OPTIND - 1 ))             # drop the parsed options; positionals remain

name="${1:?name required}"
echo "name=$name verbose=$verbose output=${output:-<stdout>}"
```

The optstring `":vo:h"`: a leading `:` enables custom error handling, a letter is a
flag, a letter followed by `:` takes a value (in `$OPTARG`). After the loop,
`shift $((OPTIND-1))` leaves only the positional arguments. (For long options like
`--help`, parse manually or use a small `case` on `"$1"` in a loop.)

> [!IMPORTANT]
> Always provide a **`usage`/help** message and **validate inputs** before doing
> work — a tool that fails clearly ("Usage: ...") beats one that charges ahead with
> missing arguments and corrupts something. Pair this with `set -euo pipefail`
> (Lesson 307) for tools you can trust.

## Hands-on lab

```bash
mkdir -p ~/func-lab && cd ~/func-lab

# 1. Functions with local vars and a logger
cat > tool.sh <<'EOF'
#!/usr/bin/env bash
log() { echo "[$(date +%T)] $*"; }
add() { local a="$1" b="$2"; echo $(( a + b )); }      # output via echo
is_even() { (( $1 % 2 == 0 )); }                       # status via return

log "starting"
sum="$(add 3 4)"; log "3+4 = $sum"
if is_even 10; then log "10 is even"; fi
log "done"
EOF
chmod +x tool.sh && ./tool.sh

# 2. Script arguments + usage validation
cat > need2.sh <<'EOF'
#!/usr/bin/env bash
usage() { echo "Usage: $0 SRC DEST" >&2; exit 1; }
[[ $# -eq 2 ]] || usage
echo "SRC=$1 DEST=$2 (count=$#)"
EOF
chmod +x need2.sh
./need2.sh /etc /tmp/x       # ok
./need2.sh /etc              # prints usage, exits 1
echo "exit: $?"

# 3. getopts flags
cat > opt.sh <<'EOF'
#!/usr/bin/env bash
v=0; out=""
while getopts ":vo:h" o; do case "$o" in
  v) v=1;; o) out="$OPTARG";; h) echo "Usage: $0 [-v] [-o F] NAME"; exit 0;;
  \?) echo "bad opt -$OPTARG" >&2; exit 1;; :) echo "-$OPTARG needs value" >&2; exit 1;;
esac; done
shift $((OPTIND-1))
echo "name=${1:?name required} verbose=$v out=${out:-<stdout>}"
EOF
chmod +x opt.sh
./opt.sh -v -o result.txt myapp
./opt.sh myapp

cd ~ && rm -r ~/func-lab
```

## Exercises

1. Write a function `max a b` that prints the larger of two numbers (output via
   `echo`) and use command substitution to capture it.
2. Write a function `require_dir DIR` that returns success if the directory exists
   and prints an error to **stderr** and returns 1 otherwise; use it with `||`.
3. Add a `local` variable inside a function and prove (by reusing the same name
   outside) that it doesn't leak to the rest of the script.
4. Write a script that requires exactly one argument and prints a clear usage
   message (exit 1) when called with none.
5. Use `getopts` to accept `-n NAME` (required) and `-q` (quiet flag), validate that
   `-n` was given, and print the parsed values.

## Troubleshooting

- **A function changed a variable I use elsewhere** — missing `local`. *Fix:*
  declare function variables with `local`.
- **"Returning" a string didn't work** — Bash `return` only sets an **exit code**.
  *Fix:* `echo`/`printf` the value and capture with `$( )`.
- **Error messages ended up in my captured value** — diagnostics went to stdout.
  *Fix:* send them to **stderr** (`>&2`).
- **`getopts` ignored my flags after a positional arg** — options must come **before**
  positionals, or you parsed in the wrong order. *Fix:* put flags first; `shift
  $((OPTIND-1))` after the loop.
- **`$1` inside a function isn't the script's `$1`** — that's by design (function
  args). *Fix:* pass what you need into the function explicitly.

Reproduce the `local` lesson: set `name=outer`; a function that does `name=inner`
**without** `local` changes the outer value; with `local name=inner` it doesn't.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Run the practical items.

1. How do you define and call a function in Bash?
2. Why declare function variables with `local`?
3. How does a function return **status** vs **output**?
4. Why can't a function "return" a string, and what do you do instead?
5. Where should error/diagnostic messages go, and why?
6. What do `$0`, `$@`, and `$#` mean at the script level?
7. What does `getopts` do, and what is `$OPTARG`?
8. What does `shift $((OPTIND-1))` accomplish?
9. **Practical:** write a function that adds two numbers and capture its result.
10. **Practical:** validate that a script got exactly one argument, else print usage.

## Solutions & validation

1. `name() { ...; }` to define; `name args` to call.
2. Without `local`, variables are **global** and can overwrite same-named variables
   elsewhere (subtle bugs); `local` scopes them to the function.
3. **Status** via `return N` (or the last command's exit code), tested with `if`/
   `&&`; **output** via `echo`/`printf`, captured with `$( )`.
4. `return` only sets a numeric **exit code**; to pass data you **print** it and
   capture it.
5. To **stderr** (`>&2`), so they don't pollute the stdout value a caller captures.
6. `$0` = script name; `$@` = all arguments; `$#` = argument count.
7. Parses short **options**; the value of an option that takes an argument is in
   **`$OPTARG`**.
8. Removes the parsed options from the positional parameters, leaving only the
   positional arguments.
9. **Validation:** `add(){ echo $(( $1 + $2 )); }; r="$(add 3 4)"` → `r=7`.
10. **Validation:** `[[ $# -eq 1 ]] || { echo "Usage: $0 ARG" >&2; exit 1; }`.

> [!TIP]
> Structure pays compounding interest: small functions with `local` vars, status vs
> output kept separate, inputs validated, and a real `usage`. Your future self
> (and teammates) can read, test and change such scripts — the hallmark of tooling
> that lasts.

## What's next

Next: **Lesson 306 — Arrays & Associative Arrays.** To handle *collections* —
lists of servers, sets of options, key/value config — you'll use indexed arrays and
Bash's associative arrays (maps), iterate them safely, and avoid the pitfalls that
come from faking lists with space-separated strings.
