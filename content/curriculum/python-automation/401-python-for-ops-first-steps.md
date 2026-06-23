---
title: "Python for Automation — First Steps for Operators"
slug: "python-ops-first-steps"
track: "python-automation"
trackName: "Python for Automation"
module: "Python Foundations"
order: 401
level: "Beginner"
difficulty: "Beginner"
distribution: "Cross-platform"
category: "Shell & Scripting"
tags: [python, automation, scripting, beginner, ops]
cover: "/covers/curriculum/python-automation.svg"
estMinutes: 50
status: "published"
summary: "Why and when an operator reaches for Python over Bash, and how to run it. Check your interpreter, use the REPL to explore, write and run a real .py script with a shebang, read input and arguments, and understand indentation — the foundation for ops tooling."
seoTitle: "Python for Automation 1: First Steps (python3, REPL, scripts)"
seoDescription: "Beginner Python for ops: python3 vs python, the REPL, writing and running a .py script with a shebang, sys.argv, input, and significant indentation. Lab + assessment."
---

You can already automate with Bash. **Python** is the next tool in your belt — and
the right one when logic gets complex, you're parsing structured data (JSON, CSV,
APIs), or a script grows beyond what Bash handles gracefully. Most operators, SREs
and DevOps engineers use **both**: Bash to glue commands, Python for real programs.
This track teaches Python the way ops people actually use it. This first lesson gets
you running code and writing your first script.

## Learning objectives

By the end of this lesson you will be able to:

- Decide when **Python** fits better than Bash.
- Confirm your interpreter (**`python3`**) and use the **REPL**.
- Write and run a real **`.py` script** (with a shebang).
- Read **arguments** (`sys.argv`) and **input**.
- Understand Python's **significant indentation**.

## Part 1 — Bash or Python?

A practical rule of thumb:

- **Bash** — gluing commands together, quick file operations, running other
  programs, simple loops over files. The shell *is* the program.
- **Python** — non-trivial logic and data structures, parsing JSON/CSV/XML, talking
  to HTTP APIs, anything you'd struggle to read in Bash, or code you want to test.

You'll move fluidly between them. Python is installed nearly everywhere as
**`python3`** and reads clearly, which is why it dominates ops tooling.

```bash
python3 --version            # confirm it's installed (3.x)
which python3
```

> [!NOTE]
> On modern systems the command is **`python3`** (plain `python` may be missing or,
> on old systems, mean Python 2). This track is Python **3** throughout. If `python3`
> is absent: `sudo apt install -y python3` (Debian/Ubuntu) or it ships with most
> distros and with Windows (from python.org or the Store).

## Part 2 — The REPL: explore interactively

The **REPL** (Read-Eval-Print Loop) runs code line by line — perfect for trying
things out:

```bash
python3
```
```python
>>> 2 + 3 * 4
14
>>> name = "botera"
>>> print(f"Hello, {name}")       # f-string: embeds variables in text
Hello, botera
>>> len("networking")
10
>>> import os
>>> os.getcwd()                   # explore standard library interactively
'/home/you'
>>> exit()                        # or press Ctrl+D
```

Use the REPL constantly to check syntax, test an expression, or read a function's
help (`help(len)`). It's the fastest way to learn.

## Part 3 — Your first script

Put code in a `.py` file and run it:

```python
#!/usr/bin/env python3
"""hello.py — my first Python script."""
import platform

print("Hello from Python!")
print(f"Running Python {platform.python_version()} on {platform.system()}")
```

```bash
python3 hello.py            # the usual way to run a script
# or make it directly executable (Linux/macOS):
chmod +x hello.py
./hello.py                  # uses the shebang #!/usr/bin/env python3
```

`print()` is a **function** (always parentheses). The `"""..."""` at the top is a
**docstring** — documentation for the file. `import` pulls in a module from Python's
large standard library (`platform` here).

## Part 4 — Arguments and input

Read command-line arguments from **`sys.argv`** (a list; `argv[0]` is the script
name):

```python
#!/usr/bin/env python3
import sys

if len(sys.argv) < 2:
    print(f"Usage: {sys.argv[0]} NAME", file=sys.stderr)
    sys.exit(1)               # non-zero exit = failure (like Bash)

name = sys.argv[1]
print(f"Hello, {name}!")
```

```bash
python3 greet.py Alex        # Hello, Alex!
python3 greet.py             # prints usage to stderr, exits 1
```

For interactive prompts use **`input()`** (it returns a string):

```python
answer = input("Proceed? [y/N] ")
print("you said:", answer)
```

> [!IMPORTANT]
> `sys.exit(0)` is success, non-zero is failure — exactly like Bash exit codes, so
> Python scripts plug straight into cron, systemd timers and CI. Print errors to
> **`sys.stderr`** (`file=sys.stderr`) so they don't pollute stdout that a caller
> might capture — the same stdout/stderr discipline you learned for shell scripts.

## Part 5 — Indentation is syntax

Python has no `{}` or `fi`/`done`. **Indentation defines blocks** — consistent
spaces (4 by convention) group code:

```python
import os

path = "/etc/hosts"
if os.path.exists(path):
    print("exists")          # this line belongs to the if (indented)
    size = os.path.getsize(path)
    print(f"size: {size} bytes")
else:
    print("missing")
print("done")                # NOT indented -> runs regardless
```

> [!IMPORTANT]
> **Be consistent with indentation** — use **4 spaces**, never mix tabs and spaces
> (Python raises `TabError`/`IndentationError`). Configure your editor to insert
> spaces for the Tab key. Inconsistent indentation is the #1 beginner error, and
> unlike Bash, it's a hard syntax error, not just a style issue.

## Hands-on lab

```bash
mkdir -p ~/py-lab && cd ~/py-lab
python3 --version

# 1. REPL exploration
python3 - <<'EOF'
print(2**10)                 # 1024
print(f"{'ops':>6}")         # right-justify in 6 cols
import os; print(os.getcwd())
EOF

# 2. A real script with a docstring
cat > hello.py <<'EOF'
#!/usr/bin/env python3
"""Print interpreter info."""
import platform
print("Hello from Python!")
print(f"Python {platform.python_version()} on {platform.system()}")
EOF
chmod +x hello.py
python3 hello.py
./hello.py

# 3. Arguments + usage + exit code
cat > greet.py <<'EOF'
#!/usr/bin/env python3
import sys
if len(sys.argv) < 2:
    print(f"Usage: {sys.argv[0]} NAME", file=sys.stderr)
    sys.exit(1)
print(f"Hello, {sys.argv[1]}!")
EOF
python3 greet.py Alex; echo "exit=$?"
python3 greet.py;      echo "exit=$?"

# 4. Indentation (and an intentional error to see the message)
cat > cond.py <<'EOF'
import os
p = "/etc/hostname"
if os.path.exists(p):
    print("exists:", os.path.getsize(p), "bytes")
else:
    print("missing")
EOF
python3 cond.py

cd ~ && rm -r ~/py-lab
```

## Exercises

1. Confirm your Python version, then in the REPL compute `2**16`, the length of a
   string, and your current working directory via `os.getcwd()`.
2. Write `sysinfo.py` that prints the Python version, the OS (`platform.system()`),
   and the hostname (`platform.node()`), each on a labeled line.
3. Make the script executable with a shebang and run it both with `python3 file` and
   `./file`.
4. Write a script that requires one argument (a name) and prints a greeting, exiting
   with code 1 and a usage message to stderr when missing.
5. Trigger an `IndentationError` on purpose (mis-indent a line), read the message,
   then fix it.

## Troubleshooting

- **`python3: command not found`** — not installed or not on PATH. *Fix:* install
  `python3`; on Windows use `py` or the Store/python.org build.
- **`python` runs Python 2 (or is missing)** — use **`python3`** explicitly.
- **`IndentationError` / `TabError`** — inconsistent indentation or mixed tabs and
  spaces. *Fix:* use **4 spaces** everywhere; set your editor to spaces.
- **`SyntaxError: ... print`** — that's Python-2 `print` style. *Fix:* `print(...)`
  with parentheses (Python 3).
- **`./script.py: Permission denied`** — missing execute bit / shebang. *Fix:*
  `chmod +x` and ensure `#!/usr/bin/env python3` is the first line.

Reproduce the indentation rule: write an `if` with its body **not** indented — Python
raises `IndentationError: expected an indented block`, unlike Bash which has no such
rule.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Run the practical items.

1. When would you choose Python over Bash?
2. What command runs Python 3, and how do you check the version?
3. What is the REPL good for?
4. How do you run a `.py` script two different ways?
5. Where do command-line arguments live, and what is `argv[0]`?
6. How does Python define code blocks (no braces)?
7. Why use 4 spaces and never mix tabs/spaces?
8. How do exit codes and stderr work in Python, and why does that matter for ops?
9. **Practical:** print the Python version from a script. Code?
10. **Practical:** make a script require one argument and exit 1 with usage if
    missing.

## Solutions & validation

1. For **complex logic, data structures, parsing structured data (JSON/CSV/APIs)**,
   or code you want readable/testable.
2. **`python3`**; `python3 --version`.
3. **Interactively** trying expressions/syntax and exploring modules/`help()`.
4. `python3 script.py`, or `chmod +x` + `./script.py` (via the shebang).
5. In **`sys.argv`** (a list); **`argv[0]`** is the script name.
6. By **indentation** (consistent spaces), not braces or keywords.
7. Python treats indentation as **syntax**; mixing tabs/spaces raises errors and 4
   spaces is the universal convention.
8. `sys.exit(N)` sets the exit code (0 success), and errors go to `sys.stderr` —
   so scripts integrate with cron/timers/CI and pipelines cleanly.
9. **Validation:** `import platform; print(platform.python_version())`.
10. **Validation:** `if len(sys.argv) < 2: print('Usage...', file=sys.stderr);
    sys.exit(1)`.

> [!TIP]
> Keep the REPL open while you learn — testing a line there before putting it in a
> script is the fastest feedback loop in programming, and it builds the intuition
> that makes the rest of this track quick.

## What's next

Next: **Lesson 402 — Variables, Types & Data Structures.** The building blocks for
real tools: strings, numbers and booleans; the workhorse collections **lists** and
**dicts** (perfect for config and parsed data); plus sets and tuples — and the
operations on each that you'll use in every ops script.
