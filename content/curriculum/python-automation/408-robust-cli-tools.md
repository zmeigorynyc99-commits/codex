---
title: "Python for Automation — Robust CLI Tools"
slug: "python-robust-cli-tools"
track: "python-automation"
trackName: "Python for Automation"
module: "Shipping Python Tools"
order: 408
level: "Advanced"
difficulty: "Advanced"
distribution: "Cross-platform"
category: "Shell & Scripting"
tags: [python, argparse, logging, cli, error-handling, advanced]
cover: "/covers/curriculum/python-automation.svg"
estMinutes: 60
status: "published"
summary: "Turn scripts into tools teammates can trust. Parse arguments and generate help with argparse, produce proper output with the logging module, handle errors and exit codes cleanly, use the if __name__ == '__main__' entry point, and structure a maintainable CLI."
seoTitle: "Python for Automation 8: Robust CLI Tools (argparse, logging)"
seoDescription: "Advanced Python: build CLI tools with argparse (args, options, help), the logging module, structured error handling and exit codes, and the __main__ entry point. Lab + assessment."
---

This is the capstone of the Python track: taking everything — data, files,
subprocess, APIs — and packaging it into a **real command-line tool** that's a
pleasure to use and safe to run unattended. That means proper argument parsing with
`--help`, real **logging** instead of scattered `print`s, structured **error
handling** and exit codes, and a clean entry point. These are the touches that
separate a personal script from a tool your team adopts.

## Learning objectives

By the end of this lesson you will be able to:

- Parse arguments and auto-generate help with **`argparse`**.
- Add positional args, options, flags, defaults and types.
- Produce leveled output with the **`logging`** module.
- Handle errors and return meaningful **exit codes**.
- Use the **`if __name__ == "__main__"`** entry point and `main()` pattern.

## Part 1 — argparse: arguments and help for free

`argparse` (standard library) turns argument handling into a declaration and gives
you `--help`, validation, and error messages automatically:

```python
import argparse

parser = argparse.ArgumentParser(description="Back up a directory.")
parser.add_argument("source", help="directory to back up")              # positional
parser.add_argument("-d", "--dest", default="/backups", help="destination")  # option
parser.add_argument("-n", "--keep", type=int, default=5, help="backups to keep")
parser.add_argument("-v", "--verbose", action="store_true", help="verbose output")  # flag
parser.add_argument("--dry-run", action="store_true", help="don't actually do it")

args = parser.parse_args()
print(args.source, args.dest, args.keep, args.verbose, args.dry_run)
```

```bash
python3 backup.py /etc --dest /mnt/bak -n 10 -v
python3 backup.py --help        # auto-generated usage + descriptions
python3 backup.py               # error: the following arguments are required: source
```

`type=int` converts and validates; `action="store_true"` makes a boolean flag;
`default=` and `choices=[...]` add safety. You get a professional `--help` and clear
errors with zero extra code.

> [!TIP]
> Reach for **`argparse`** the moment a script takes more than one argument. Compared
> with hand-parsing `sys.argv`, it gives you `--help`, type conversion, defaults,
> required/optional handling and friendly error messages for free — and users
> instantly know how to use the tool. (For very complex CLIs, `click` and `typer` are
> popular third-party alternatives, but `argparse` needs no install.)

## Part 2 — Logging instead of print

`print` is fine for output a user wants; for a tool's **diagnostics** use the
**`logging`** module — it adds timestamps, levels, and lets the user control verbosity:

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
)
log = logging.getLogger(__name__)

log.debug("detailed trace")        # hidden unless level=DEBUG
log.info("starting backup")        # normal progress
log.warning("disk 80%% full")
log.error("backup failed")         # something went wrong
log.critical("data loss imminent")
```

Wire verbosity to a flag:

```python
level = logging.DEBUG if args.verbose else logging.INFO
logging.basicConfig(level=level, format="%(asctime)s %(levelname)s %(message)s")
```

> [!IMPORTANT]
> Use **`logging`**, not `print`, for a tool's operational messages. It timestamps
> everything, supports levels (so `-v` shows debug detail and the default stays
> clean), can write to files or syslog, and goes to **stderr** by default — keeping
> stdout free for actual data output. A tool whose noise you can dial up/down and
> whose logs are timestamped is one you can actually operate.

## Part 3 — Error handling and exit codes

Fail clearly, with specific exit codes (like the Bash robustness lesson):

```python
import sys, logging
log = logging.getLogger(__name__)

EXIT_OK, EXIT_USAGE, EXIT_NOINPUT, EXIT_FAIL = 0, 2, 3, 1

def main(args):
    src = args.source
    import os
    if not os.path.isdir(src):
        log.error("source is not a directory: %s", src)
        return EXIT_NOINPUT
    try:
        do_backup(src, args.dest)
    except PermissionError as e:
        log.error("permission denied: %s", e)
        return EXIT_FAIL
    except Exception as e:                  # last-resort catch-all
        log.exception("unexpected error")   # logs the full traceback
        return EXIT_FAIL
    log.info("done")
    return EXIT_OK
```

Catch **specific** exceptions where you can act on them; let truly unexpected ones
surface (or log them with `log.exception` for the traceback). Return distinct codes
so cron/CI can tell *why* it failed.

## Part 4 — The entry point pattern

The standard structure makes a file both runnable **and** importable (for testing):

```python
#!/usr/bin/env python3
"""backup.py — timestamped directory backups."""
import argparse, logging, sys

def parse_args(argv=None):
    p = argparse.ArgumentParser(description="Back up a directory.")
    p.add_argument("source")
    p.add_argument("-d", "--dest", default="/backups")
    p.add_argument("-v", "--verbose", action="store_true")
    return p.parse_args(argv)

def main(argv=None):
    args = parse_args(argv)
    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
    )
    # ... do the work, return an exit code ...
    return 0

if __name__ == "__main__":          # runs only when executed, not when imported
    sys.exit(main())                # main() returns the exit code
```

> [!IMPORTANT]
> **`if __name__ == "__main__": sys.exit(main())`** is the idiomatic Python entry
> point. It means the file runs as a script *and* can be imported by tests without
> executing `main()`, and `sys.exit(main())` turns your function's return value into
> the process exit code. Keep logic in functions (`main(argv)`, helpers) so it's
> testable — not at module top level.

## Part 5 — Putting it together (a real tool)

A small, complete CLI that ties the track together:

```python
#!/usr/bin/env python3
"""svc-check — report whether services are active."""
import argparse, logging, subprocess, sys

log = logging.getLogger("svc-check")

def is_active(service, timeout=5):
    try:
        r = subprocess.run(["systemctl", "is-active", service],
                           capture_output=True, text=True, timeout=timeout)
        return r.stdout.strip() == "active"
    except (FileNotFoundError, subprocess.TimeoutExpired) as e:
        log.error("could not check %s: %s", service, e)
        return False

def main(argv=None):
    p = argparse.ArgumentParser(description="Check that services are active.")
    p.add_argument("services", nargs="+", help="service names to check")
    p.add_argument("-v", "--verbose", action="store_true")
    args = p.parse_args(argv)
    logging.basicConfig(level=logging.DEBUG if args.verbose else logging.INFO,
                        format="%(levelname)s %(message)s")

    failed = []
    for svc in args.services:
        ok = is_active(svc)
        log.info("%s: %s", svc, "active" if ok else "NOT active")
        if not ok:
            failed.append(svc)
    return 0 if not failed else 1      # non-zero if any service is down

if __name__ == "__main__":
    sys.exit(main())
```
```bash
python3 svc-check.py ssh nginx -v ; echo "exit=$?"
python3 svc-check.py --help
```

This tool has help, logging, a timeout, error handling, a meaningful exit code, and
a testable `main()` — production-quality, and built entirely from the track's
lessons.

## Hands-on lab

```bash
mkdir -p ~/cli-lab && cd ~/cli-lab
cat > svc-check.py <<'EOF'
#!/usr/bin/env python3
"""Check that services are active."""
import argparse, logging, subprocess, sys
log = logging.getLogger("svc-check")

def is_active(service):
    try:
        r = subprocess.run(["systemctl", "is-active", service],
                           capture_output=True, text=True, timeout=5)
        return r.stdout.strip() == "active"
    except (FileNotFoundError, subprocess.TimeoutExpired) as e:
        log.error("check failed for %s: %s", service, e); return False

def main(argv=None):
    p = argparse.ArgumentParser(description="Check services are active.")
    p.add_argument("services", nargs="+")
    p.add_argument("-v", "--verbose", action="store_true")
    args = p.parse_args(argv)
    logging.basicConfig(level=logging.DEBUG if args.verbose else logging.INFO,
                        format="%(levelname)s %(message)s")
    down = [s for s in args.services if (log.info("checking %s", s) or not is_active(s))]
    for s in args.services:
        log.info("%s: %s", s, "active" if is_active(s) else "NOT active")
    return 0 if not down else 1

if __name__ == "__main__":
    sys.exit(main())
EOF
chmod +x svc-check.py

# 1. Auto-generated help
python3 svc-check.py --help

# 2. Required-arg error (exit non-zero, friendly message)
python3 svc-check.py; echo "exit=$?"

# 3. Run it; observe logging + exit code
python3 svc-check.py ssh cron -v; echo "exit=$?"

cd ~ && rm -r ~/cli-lab
```

## Exercises

1. Build an `argparse` parser with a positional `path`, an `--output FILE` option
   (default `report.txt`), an integer `--limit` (default 10), and a `--verbose` flag;
   print the parsed values and show `--help`.
2. Replace `print` diagnostics in a script with `logging`, wiring `--verbose` to
   switch between INFO and DEBUG levels.
3. Add structured error handling that returns distinct exit codes for "bad usage",
   "missing input", and "operation failed", and verify each with `echo $?`.
4. Refactor a flat script into `parse_args(argv)`, `main(argv)`, and the
   `if __name__ == "__main__": sys.exit(main())` entry point.
5. Write a small complete CLI tool (e.g., disk-usage reporter or service checker)
   that has help, logging, a timeout on any subprocess, and a meaningful exit code.

## Troubleshooting

- **Users don't know how to run the tool** — no `--help`. *Fix:* use `argparse`; it
  generates help and usage automatically.
- **`print` output clutters piped data** — diagnostics on stdout. *Fix:* use
  `logging` (stderr by default) for messages; reserve stdout/`print` for actual data.
- **Can't import the script for testing** — logic runs at module top level. *Fix:*
  put it in `main()`/functions under `if __name__ == "__main__":`.
- **Exit code is always 0** — you didn't return/`sys.exit` a code. *Fix:* `return`
  codes from `main()` and `sys.exit(main())`.
- **A crash dumps a traceback at users** — unhandled exception. *Fix:* catch specific
  exceptions where you can act; `log.exception(...)` and return a failure code for the
  rest.

Reproduce the help win: define two `argparse` arguments, run with `--help`, and see a
full usage/description page you never wrote — versus hand-parsing `sys.argv` with no
help at all.

## Assessment

**Passing requirement: at least 9 of 11 correct (≈82%) — the capstone.** Run the
practical items.

1. What does `argparse` give you beyond hand-parsing `sys.argv`?
2. How do you add a positional argument, an option with a default, and a boolean
   flag?
3. How do you make an argument an integer with validation?
4. Why use `logging` instead of `print` for a tool's messages?
5. How do you wire `--verbose` to the logging level?
6. How do you return meaningful exit codes from a tool?
7. What does `if __name__ == "__main__":` do, and why structure code in `main()`?
8. How do you turn `main()`'s return value into the process exit code?
9. How should unexpected vs expected errors be handled?
10. **Practical:** build an argparse CLI with a positional, an option, and a flag,
    and show `--help`.
11. **Practical:** make a tool exit non-zero when a checked service is down.

## Solutions & validation

1. Auto-generated **`--help`/usage**, type conversion, defaults, required/optional
   handling, and friendly error messages.
2. `add_argument("name")`; `add_argument("--opt", default=...)`;
   `add_argument("--flag", action="store_true")`.
3. `add_argument("--n", type=int)` (argparse converts and validates).
4. `logging` adds **levels and timestamps**, goes to **stderr**, supports verbosity
   control and file/syslog output — keeping stdout clean for data.
5. `level = logging.DEBUG if args.verbose else logging.INFO` in `basicConfig`.
6. `return`/`sys.exit` distinct non-zero codes from `main()` for each failure class.
7. It runs the block **only when executed directly** (not on import); `main()` keeps
   logic **testable** and importable.
8. `sys.exit(main())`.
9. Catch **specific** exceptions you can act on; **log/return failure** (or surface a
   traceback via `log.exception`) for truly unexpected ones.
10. **Validation:** a parser with `add_argument` for each; `--help` prints usage.
11. **Validation:** the svc-check tool returns `1` (and `echo $?` shows it) when a
    service isn't active.

> [!TIP]
> 🎉 That completes the **Python for Automation** track. With foundations, system
> interaction (files, subprocess, APIs), packaging (venv/pip) and polished CLI tools,
> you can build the kind of reliable automation that real platform and SRE teams run
> — and it plugs straight into the cron/timers, Git and CI you're learning elsewhere.

## What's next

The roadmap continues into the tooling that orchestrates everything you can now
script: **Git & Version Control** to track and collaborate on it, then **Docker &
Containers**, **CI/CD**, and **Infrastructure as Code**. Your Bash and Python skills
become the automation those systems run — the heart of modern DevOps and SRE work.
