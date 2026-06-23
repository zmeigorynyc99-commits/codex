---
title: "Python for Automation — Running Commands with subprocess"
slug: "python-subprocess-running-commands"
track: "python-automation"
trackName: "Python for Automation"
module: "Working with the System"
order: 405
level: "Intermediate"
difficulty: "Intermediate"
distribution: "Cross-platform"
category: "Shell & Scripting"
tags: [python, subprocess, commands, automation, security, intermediate]
cover: "/covers/curriculum/python-automation.svg"
estMinutes: 55
status: "published"
summary: "Python's superpower for ops: call other programs safely. Run commands with subprocess.run, capture output and exit codes, handle failures with check and try/except, set timeouts — and avoid shell-injection by passing argument lists instead of shell strings."
seoTitle: "Python for Automation 5: subprocess (run commands safely)"
seoDescription: "Intermediate Python: subprocess.run with argument lists, capture_output, check=True, returncode, timeouts, and why to avoid shell=True (injection). Hands-on lab and assessment."
---

The reason Python is so powerful for ops is that it can **drive the commands you
already know** — `systemctl`, `ip`, `df`, `git`, your own scripts — while adding real
logic, data structures and error handling around them. The tool is **`subprocess`**.
This lesson teaches the safe, modern way to run commands, capture their output and
exit codes, react to failures, and — critically — avoid the **shell-injection**
trap that turns a convenient script into a security hole.

## Learning objectives

By the end of this lesson you will be able to:

- Run a command with **`subprocess.run`** and read its result.
- Capture **stdout/stderr** and the **exit code**.
- Handle failures with **`check=True`** and `try/except`.
- Set **timeouts** and feed **input**.
- Avoid **shell injection** by passing argument **lists**, not shell strings.

## Part 1 — subprocess.run: the basics

```python
import subprocess

# Pass the command as a LIST of arguments (the safe, recommended form)
result = subprocess.run(["echo", "hello"], capture_output=True, text=True)
print(result.stdout)        # 'hello\n'
print(result.returncode)    # 0

# A real example: check a service
result = subprocess.run(
    ["systemctl", "is-active", "nginx"],
    capture_output=True, text=True,
)
print("active?", result.stdout.strip(), "| code:", result.returncode)
```

The `result` object (`CompletedProcess`) gives you **`.stdout`**, **`.stderr`**,
**`.returncode`**, and `.args`. **`capture_output=True`** collects output (otherwise
it goes to the terminal); **`text=True`** decodes bytes to strings (without it you
get `bytes`).

## Part 2 — Argument lists vs shell strings (security)

```python
# GOOD: a list — arguments are passed directly, no shell interpretation
subprocess.run(["ls", "-l", user_dir])

# DANGEROUS: shell=True with a string built from input
subprocess.run(f"ls -l {user_dir}", shell=True)   # if user_dir = "; rm -rf ~" ...
```

> [!IMPORTANT]
> **Pass commands as a list and avoid `shell=True`.** With a list, arguments
> (including ones with spaces or special characters) go straight to the program —
> the shell never interprets them, so there's **no injection risk** and no quoting
> headaches. `shell=True` with a string built from any external value (a filename, an
> argument, API data) is a classic command-injection vulnerability. Only use
> `shell=True` for trusted, fixed strings where you genuinely need shell features
> (pipes, globs) — and even then, prefer doing the piping in Python.

## Part 3 — Handling failures

By default `run` does **not** raise on a non-zero exit — you check `returncode`
yourself, or ask it to raise:

```python
# Option A: check the return code
r = subprocess.run(["ping", "-c1", "-W1", "1.1.1.1"], capture_output=True, text=True)
if r.returncode == 0:
    print("reachable")
else:
    print("unreachable:", r.stderr.strip())

# Option B: check=True raises CalledProcessError on failure (fail-fast)
try:
    subprocess.run(["systemctl", "restart", "nginx"], check=True,
                   capture_output=True, text=True)
    print("restarted")
except subprocess.CalledProcessError as e:
    print(f"failed (code {e.returncode}): {e.stderr}")

# A missing command raises FileNotFoundError
try:
    subprocess.run(["nonexistent-cmd"], capture_output=True)
except FileNotFoundError:
    print("command not found")
```

> [!TIP]
> Use **`check=True`** when a failure should stop the script (the subprocess
> equivalent of `set -e`), wrapped in `try/except subprocess.CalledProcessError` so
> you can log a clear message. Use the **manual `returncode` check** when a non-zero
> exit is an expected outcome you want to branch on (like `ping` failing). Pick based
> on whether failure is "abort" or "information."

## Part 4 — Timeouts and input

```python
# Timeout: don't hang forever on a stuck command
try:
    r = subprocess.run(["curl", "-s", url], capture_output=True, text=True, timeout=10)
except subprocess.TimeoutExpired:
    print("command timed out")

# Feed stdin to a command
r = subprocess.run(["grep", "ERROR"], input="INFO a\nERROR b\n",
                   capture_output=True, text=True)
print(r.stdout)             # 'ERROR b\n'

# Convenience wrappers
out = subprocess.check_output(["hostname"], text=True).strip()   # output or raise
ok = subprocess.run(["test", "-d", "/etc"]).returncode == 0       # just the status
```

> [!IMPORTANT]
> **Always set a `timeout`** on commands that talk to the network or could hang
> (curl, ssh, database calls). A subprocess with no timeout can freeze your whole
> automation indefinitely — exactly the kind of silent failure that pages someone at
> 3 a.m. Catch `TimeoutExpired` and decide: retry, skip, or fail.

## Part 5 — A practical pattern

Wrap command-running in a small helper that returns clean results:

```python
import subprocess

def run(cmd, timeout=30):
    """Run a command (list), return (ok, stdout, stderr)."""
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        return r.returncode == 0, r.stdout.strip(), r.stderr.strip()
    except FileNotFoundError:
        return False, "", f"command not found: {cmd[0]}"
    except subprocess.TimeoutExpired:
        return False, "", f"timed out after {timeout}s"

ok, out, err = run(["systemctl", "is-active", "ssh"])
print("ssh active" if ok else f"ssh not active: {out or err}")
```

This is the kind of reusable building block real ops tools are made of — it never
crashes on a missing command or a hang, and callers get a simple, testable result.

## Hands-on lab

```bash
python3 - <<'EOF'
import subprocess

# 1. Capture output and exit code (argument LIST)
r = subprocess.run(["uname", "-a"], capture_output=True, text=True)
print("out:", r.stdout.strip())
print("code:", r.returncode)

# 2. Branch on exit code (expected failure)
r = subprocess.run(["ping", "-c1", "-W1", "1.1.1.1"], capture_output=True, text=True)
print("internet:", "up" if r.returncode == 0 else "down")

# 3. check=True with exception handling
try:
    subprocess.run(["ls", "/nonexistent"], check=True, capture_output=True, text=True)
except subprocess.CalledProcessError as e:
    print(f"ls failed (code {e.returncode}): {e.stderr.strip()}")

# 4. Feed input + capture (no shell)
r = subprocess.run(["grep", "ERROR"], input="INFO a\nERROR b\nWARN c\n",
                   capture_output=True, text=True)
print("grep found:", r.stdout.strip())

# 5. Missing command + timeout safety
def run(cmd, timeout=10):
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        return r.returncode == 0, r.stdout.strip(), r.stderr.strip()
    except FileNotFoundError:
        return False, "", f"not found: {cmd[0]}"
    except subprocess.TimeoutExpired:
        return False, "", "timed out"

for cmd in (["hostname"], ["definitely-not-a-real-command"]):
    ok, out, err = run(cmd)
    print(cmd[0], "->", out if ok else f"ERR: {err}")
EOF
```

## Exercises

1. Run `df -h /` with subprocess, capture the output as text, and print the usage
   line.
2. Check whether a service (e.g. `ssh`) is active by inspecting the `returncode` of
   `systemctl is-active`, and print "up"/"down".
3. Use `check=True` with a command that fails, catch `CalledProcessError`, and print
   its `returncode` and `stderr`.
4. Pipe text into `sort` via subprocess's `input=` and capture the sorted result —
   without using a shell pipe.
5. Write the `run(cmd, timeout=...)` helper that returns `(ok, stdout, stderr)` and
   handles missing commands and timeouts; test it with a real and a fake command.

## Troubleshooting

- **Output is `bytes`, not `str`** — missing `text=True`. *Fix:* add `text=True`
  (or `encoding="utf-8"`).
- **`.stdout` is empty / went to the terminal** — no `capture_output=True`. *Fix:*
  add it to collect the output.
- **A command failed but the script kept going** — `run` doesn't raise by default.
  *Fix:* use `check=True` (and catch `CalledProcessError`) or test `returncode`.
- **`FileNotFoundError`** — the program isn't installed/on PATH, or you passed a
  whole string as one "command". *Fix:* pass a **list**; verify the binary exists.
- **Script hung forever** — no timeout on a network/blocking command. *Fix:* add
  `timeout=` and handle `TimeoutExpired`.
- **Weird injection / wrong behavior with `shell=True`** — the shell interpreted your
  string. *Fix:* drop `shell=True`; pass an argument list.

Reproduce the safety point: `subprocess.run(["echo", "a; rm x"])` prints the literal
`a; rm x` (no shell), whereas `shell=True` with that string would try to run `rm` —
proving why lists are safe.

## Assessment

**Passing requirement: at least 9 of 11 correct (≈82%).** Run the practical items.

1. Which function runs a command, and how do you capture its output as text?
2. What attributes does the result object give you?
3. Why pass a command as a list instead of a shell string?
4. When is `shell=True` acceptable, and what's the risk otherwise?
5. Does `run` raise on a non-zero exit by default? How do you make it?
6. Which exceptions do `check=True`, a missing command, and a hang raise?
7. Why set a `timeout`, and what do you catch?
8. How do you feed stdin to a command without a shell pipe?
9. Give the subprocess equivalent of Bash's `set -e` behavior for one command.
10. **Practical:** capture `uname -a` output and exit code.
11. **Practical:** branch on whether a service is active via `returncode`.

## Solutions & validation

1. `subprocess.run(cmd_list, capture_output=True, text=True)`.
2. `.stdout`, `.stderr`, `.returncode` (and `.args`).
3. Arguments go **directly** to the program — no shell interpretation, so **no
   injection** and no quoting issues.
4. Only for **trusted, fixed** strings needing shell features; otherwise it's a
   command-**injection** risk with external input.
5. **No**; pass **`check=True`** (raises `CalledProcessError`) or test `returncode`.
6. `check=True` → `CalledProcessError`; missing command → `FileNotFoundError`; hang
   → `TimeoutExpired`.
7. To avoid hanging forever on network/blocking commands; catch
   **`subprocess.TimeoutExpired`**.
8. Pass **`input="..."`** to `run` with `text=True`.
9. `subprocess.run(cmd, check=True)` (raises on failure).
10. **Validation:** `r = subprocess.run(["uname","-a"], capture_output=True,
    text=True)` → `r.stdout`, `r.returncode`.
11. **Validation:** `subprocess.run(["systemctl","is-active","ssh"]).returncode == 0`.

> [!TIP]
> The golden rules: **argument lists (not shell strings)**, **always a timeout** on
> anything that can hang, and **decide explicitly** how to handle failure
> (`check=True` to abort vs `returncode` to branch). Those three habits make
> command-driving in Python both safe and reliable.

## What's next

Next: **Lesson 406 — JSON, APIs & HTTP.** Modern infrastructure speaks JSON over
HTTP — cloud APIs, container registries, monitoring, webhooks. You'll parse and
produce JSON, call REST APIs with the standard library (and `requests`), handle
status codes and errors, and authenticate — turning Python into a client for the
whole ecosystem.
