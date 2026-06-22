---
title: "Shell & Bash Scripting — Your First Script"
slug: "bash-your-first-script"
track: "shell-bash"
trackName: "Shell & Bash Scripting"
module: "Bash Foundations"
order: 301
level: "Beginner"
difficulty: "Beginner"
distribution: "General Linux"
category: "Shell & Scripting"
tags: [bash, scripting, shebang, beginner, automation]
cover: "/covers/curriculum/shell-bash.svg"
estMinutes: 45
status: "published"
summary: "Cross from running commands to writing them down. Create your first executable Bash script with a shebang and chmod +x, run it correctly, capture command output with command substitution, and read input — the foundation for all automation that follows."
seoTitle: "Bash Scripting 1: Your First Script (shebang, chmod +x)"
seoDescription: "Beginner Bash: write and run your first script with a shebang and execute permission, command substitution, reading input, and exit codes. Hands-on lab and assessment."
---

Welcome to **Shell & Bash Scripting** — the track that turns you from someone who
*runs* commands into someone who *automates* them. A script is just a file of
commands you can run again, share, schedule, and trust. This first lesson is
deliberately small and concrete: by the end you'll have written, made executable,
and run a real script, and you'll understand the few mechanics (shebang, execute
bit, how the shell finds and runs your file) that every later lesson builds on.

## Learning objectives

By the end of this lesson you will be able to:

- Create a script with a **shebang** and make it **executable** (`chmod +x`).
- Run a script three ways and explain the difference.
- Capture a command's output with **command substitution** `$( )`.
- Read keyboard input with **`read`**.
- Return and check an **exit code**.

## Part 1 — The anatomy of a script

A script is a plain text file. Create one with any editor (Lesson 118):

```bash
nano hello.sh
```
```bash
#!/usr/bin/env bash
echo "Hello from my first script!"
echo "Today is $(date)"
echo "I am $(whoami) on $(hostname)"
```

Two things make this a runnable program:

1. The first line `#!/usr/bin/env bash` — the **shebang** — tells the kernel which
   interpreter to run the file with. `env bash` finds Bash wherever it's installed
   (more portable than a hard-coded `/bin/bash`).
2. The **execute permission** (Lesson 113):

```bash
chmod +x hello.sh
./hello.sh
```

> [!IMPORTANT]
> The `./` in `./hello.sh` matters: it means "run the file **in this directory**."
> The shell only searches your `PATH` for bare command names, and `.` (your current
> directory) is **not** on `PATH` (a security feature). So your own scripts need
> `./` — or move them into a `PATH` directory like `~/bin` or `/usr/local/bin`.

## Part 2 — Three ways to run a script (and which to use)

```bash
./hello.sh           # execute directly — needs shebang + execute bit (the normal way)
bash hello.sh        # run with bash explicitly — no execute bit needed, ignores shebang
source hello.sh      # run IN the current shell (a.k.a. `. hello.sh`) — see warning
```

- **`./script`** is what you'll use day to day.
- **`bash script`** is handy when a file isn't executable or you want a specific
  interpreter.
- **`source script`** runs the commands in your **current** shell, so any variables
  or `cd` it does persist after it finishes — used for config/env files, not normal
  scripts.

> [!TIP]
> Use `source` (or `.`) only when you *want* a script to change your current shell —
> e.g. `source ~/.bashrc` or a project's `env.sh`. For everything else, `./script`
> in a subshell keeps the script's changes (like `cd`) from leaking into your
> session.

## Part 3 — Command substitution: capture output

`$(command)` runs a command and substitutes its **output** into the line — the most
useful single feature in scripting:

```bash
#!/usr/bin/env bash
now="$(date +%F)"                 # today's date, e.g. 2026-06-22
files="$(ls | wc -l)"             # number of items in the current directory
echo "On $now there are $files items here."
echo "Kernel: $(uname -r)"
```

Always wrap substitutions in **double quotes** (`"$(...)"`) so spaces and newlines
in the output don't break your command (more on quoting in Lesson 302). The older
backtick form `` `command` `` does the same thing but nests poorly and is harder to
read — prefer `$( )`.

## Part 4 — Reading input

Make a script interactive with **`read`**:

```bash
#!/usr/bin/env bash
read -r -p "What's your name? " name
echo "Hello, $name!"

read -r -p "Proceed? [y/N] " answer
echo "You said: $answer"
```

`-p` shows a prompt; **`-r`** stops backslashes being mangled (always use it).
`read` is great for quick interactive scripts; for unattended automation you'll use
**arguments** instead (Lesson 305).

## Part 5 — Exit codes (a first taste)

Every command (and script) returns an **exit code**: **`0` = success**, non-zero =
failure. The shell, schedulers (cron/timers), CI and `&&`/`||` all rely on it:

```bash
#!/usr/bin/env bash
echo "doing work..."
exit 0                 # explicitly report success
```
```bash
./hello.sh
echo $?                # $? = the exit code of the last command (0 here)
true;  echo $?         # 0
false; echo $?         # 1
ls /nope 2>/dev/null; echo $?   # non-zero (failure)
```

Return non-zero from your scripts when they can't do their job — it's how anything
that calls them knows. You'll build full error handling in Lesson 307.

## Hands-on lab

```bash
mkdir -p ~/bash-lab && cd ~/bash-lab

# 1. Write, make executable, run
cat > hello.sh <<'EOF'
#!/usr/bin/env bash
echo "Hello from my first script!"
echo "Date: $(date +%F)  Host: $(hostname)  User: $(whoami)"
EOF
chmod +x hello.sh
./hello.sh

# 2. The three run methods
bash hello.sh            # works without the execute bit
./hello.sh               # the normal way
# source would run it in your shell — fine here since it only echoes
source hello.sh

# 3. Command substitution into variables
cat > info.sh <<'EOF'
#!/usr/bin/env bash
when="$(date +%F)"
count="$(ls | wc -l)"
echo "On $when this directory has $count entries."
EOF
chmod +x info.sh && ./info.sh

# 4. Interactive input
cat > greet.sh <<'EOF'
#!/usr/bin/env bash
read -r -p "Your name: " name
echo "Welcome, $name."
EOF
chmod +x greet.sh && ./greet.sh

# 5. Exit codes
./hello.sh; echo "exit code: $?"
false;      echo "exit code: $?"

# 6. Clean up
cd ~ && rm -r ~/bash-lab
```

## Exercises

1. Write `sysinfo.sh` that prints the hostname, kernel version, current date, and
   the number of files in `/etc`, each on a labeled line using command
   substitution.
2. Make it executable and run it with `./`; then run the same file with `bash` and
   note that it still works without the execute bit.
3. Add a `read` prompt asking for a directory, then print how many files that
   directory contains (`$(ls "$dir" | wc -l)`).
4. Demonstrate the difference between running a script with `./` and with `source`
   by having the script `cd /tmp` and observing where your shell ends up after.
5. Make a script `exit 3` and show how to read that exit code after running it.

## Troubleshooting

- **`./script: Permission denied`** — missing execute bit. *Fix:* `chmod +x
  script`, or run it with `bash script`.
- **`command not found` for your own script** — you typed `script` without `./`.
  *Fix:* `./script` (current dir isn't on `PATH`), or put it in `~/bin`.
- **`bad interpreter: /usr/bin/env: No such file`** — wrong shebang or CRLF line
  endings (edited on Windows). *Fix:* ensure the first line is exactly
  `#!/usr/bin/env bash`; convert line endings (`sed -i 's/\r$//' script`).
- **A `cd` in my script didn't change my shell** — `./script` runs in a **subshell**.
  *Fix:* that's correct and usually desired; use `source` only if you want it to
  affect your shell.
- **Output broke on a filename with spaces** — unquoted substitution. *Fix:* quote
  it: `"$(...)"` (full coverage in Lesson 302).

Reproduce the `./` lesson: create `hi.sh`, try `hi.sh` (command not found), then
`./hi.sh` (works) — proving the current directory isn't searched.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Run the practical items.

1. What is a shebang and what does `#!/usr/bin/env bash` do?
2. What two things make a file runnable as `./script`?
3. Why must you type `./script` rather than just `script`?
4. What does `$(command)` do?
5. When would you `source` a script instead of running it with `./`?
6. What does `read -r -p` do, and why the `-r`?
7. What does an exit code of 0 mean? Non-zero?
8. How do you see the exit code of the last command?
9. **Practical:** write and run a script that prints today's date via command
   substitution. Commands?
10. **Practical:** show that a script's `exit 3` is visible to the caller.

## Solutions & validation

1. The first line `#!...` naming the **interpreter**; `#!/usr/bin/env bash` runs the
   file with **Bash, found via `env`** on `PATH` (portable).
2. A **shebang** line and the **execute permission** (`chmod +x`).
3. The current directory `.` is **not on `PATH`** (security), so bare names aren't
   found there; `./` gives an explicit path.
4. Runs the command and **substitutes its output** into the line.
5. When you want it to affect your **current shell** (variables, `cd`, env files).
6. Reads a line of input with a **prompt** (`-p`); **`-r`** prevents backslash
   mangling.
7. **0 = success**; **non-zero = failure**.
8. `echo $?`.
9. **Validation:** a script with `echo "$(date +%F)"`, `chmod +x`, `./script` prints
   the date.
10. **Validation:** `./script; echo $?` prints `3`.

> [!TIP]
> Three habits start here and never leave: a proper **shebang**, **`chmod +x`**, and
> **quoting** command substitutions. Get them automatic now and every script you
> write for the rest of your career starts on solid ground.

## What's next

Next: **Lesson 302 — Variables, Quoting & Expansion.** The single most important
safety skill in Bash. You'll learn how variables work, the critical difference
between single and double quotes, why unquoted variables are dangerous, and the
expansions (`${var}`, defaults, command and arithmetic substitution) that make
scripts both powerful and safe.
