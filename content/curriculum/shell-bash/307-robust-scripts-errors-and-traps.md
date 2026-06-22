---
title: "Shell & Bash Scripting — Robust Scripts: Errors, Traps & Exit Codes"
slug: "bash-robust-scripts-errors-and-traps"
track: "shell-bash"
trackName: "Shell & Bash Scripting"
module: "Structured Scripts"
order: 307
level: "Advanced"
difficulty: "Advanced"
distribution: "General Linux"
category: "Shell & Scripting"
tags: [bash, error-handling, traps, set-euo-pipefail, shellcheck, advanced]
cover: "/covers/curriculum/shell-bash.svg"
estMinutes: 60
status: "published"
summary: "Turn scripts that 'work on my machine' into ones you can schedule and trust. Use set -euo pipefail to fail loudly, trap signals to clean up, return meaningful exit codes, guard destructive actions, and lint with ShellCheck — the discipline of production-grade Bash."
seoTitle: "Bash Scripting 7: set -euo pipefail, traps, exit codes & ShellCheck"
seoDescription: "Advanced Bash: robust scripts with set -euo pipefail, trap for cleanup, meaningful exit codes, error handling patterns, mktemp, and ShellCheck linting. Lab + assessment."
---

A script that runs fine when you watch it can fail silently and **corrupt data** at
3 a.m. — unless you build it to fail **loudly and safely**. This **Advanced** lesson
is the discipline that separates throwaway scripts from production tooling:
`set -euo pipefail` to stop on the first error, **traps** to clean up no matter how
the script exits, meaningful **exit codes**, defensive patterns around destructive
actions, and **ShellCheck** to catch bugs before they run. Master this and you can
schedule your scripts (cron/timers) and trust them unattended.

## Learning objectives

By the end of this lesson you will be able to:

- Use **`set -euo pipefail`** and explain each flag.
- **Trap** EXIT/ERR/signals to guarantee **cleanup**.
- Return and document meaningful **exit codes**.
- Apply defensive patterns: `mktemp`, guarding `rm`, checking before acting.
- Lint scripts with **ShellCheck** and trace with `set -x`.

## Part 1 — The safe-Bash header

Start every serious script with:

```bash
#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'        # optional: safer word-splitting (split on newline/tab, not space)
```

What each flag does:

- **`-e`** (errexit) — exit immediately if any command fails (non-zero), instead of
  blindly continuing.
- **`-u`** (nounset) — treat use of an **unset variable** as an error (catches typos
  like `$fil` instead of `$file`).
- **`-o pipefail`** — a pipeline fails if **any** stage fails, not just the last
  (without it, `false | true` "succeeds").

```bash
# Without the header, this charges ahead after a failure:
cd /nonexistent     # fails, but plain bash keeps going...
rm -rf ./*          # ...and now you're deleting the WRONG directory's contents

# With `set -e`, the script stops at the failed cd — disaster averted.
```

> [!IMPORTANT]
> **`set -euo pipefail` turns silent, dangerous failures into loud, safe stops.** It
> is the single highest-value habit in Bash. Caveats to know: under `-e`, a command
> you *expect* might fail should be written `cmd || true` (so it doesn't abort the
> script), and conditions in `if`/`while`/`&&`/`||` are exempt from `-e` (so testing
> still works). Under `-u`, use defaults (`"${VAR:-}"`) for variables that may be
> unset. These small adjustments are well worth the safety.

## Part 2 — Traps: guaranteed cleanup

A **trap** runs a command when the script receives a signal or exits — perfect for
cleaning up temp files and locks **no matter how** the script ends (success, error,
or Ctrl+C):

```bash
#!/usr/bin/env bash
set -euo pipefail

workdir="$(mktemp -d)"                      # safe temp directory
cleanup() {
    rm -rf "$workdir"                       # always runs (see trap below)
}
trap cleanup EXIT                           # run cleanup whenever the script exits

# ... do work in "$workdir"; if anything fails, cleanup still runs ...
echo "working in $workdir"
```

Common traps:

```bash
trap cleanup EXIT                 # on any exit (the workhorse)
trap 'echo "interrupted"; exit 130' INT TERM   # Ctrl+C / kill: tidy + exit
trap 'echo "error on line $LINENO" >&2' ERR    # report where a command failed
```

> [!TIP]
> **`trap cleanup EXIT` plus `mktemp`** is the canonical pattern for any script that
> makes temp files. Because EXIT fires on success, error *and* signal, your temp
> data is never left behind — even if the script dies halfway. Always create temp
> files with `mktemp`/`mktemp -d` (unique, safe permissions), never a fixed
> `/tmp/myscript` name (predictable, race-prone, collides between runs).

## Part 3 — Meaningful exit codes

Return **specific** non-zero codes so callers (and you) can distinguish failures:

```bash
#!/usr/bin/env bash
set -euo pipefail

readonly E_USAGE=2 E_NOINPUT=3 E_FAIL=4

[[ $# -eq 1 ]] || { echo "Usage: $0 FILE" >&2; exit "$E_USAGE"; }
[[ -r "$1" ]]  || { echo "cannot read: $1" >&2; exit "$E_NOINPUT"; }

process "$1" || exit "$E_FAIL"
exit 0
```

Conventions: **`0`** success; **`1`** general error; **`2`** usage/syntax error;
higher numbers for your own categories; **`130`** = terminated by Ctrl+C (128+SIGINT).
Document them in a comment or `--help`. Cron, CI and orchestration all branch on
these.

## Part 4 — Defensive patterns

```bash
# Guard a destructive action with a confirmed, non-empty path
target="${1:?target required}"            # -u + :? ensures it's set
[[ -d "$target" ]] || { echo "not a dir" >&2; exit 1; }
rm -rf -- "${target:?}"/*                 # :? aborts if target is somehow empty

# Preview before bulk-deleting (Lesson 111 habit)
find "$target" -name '*.tmp' -print       # look first
# find "$target" -name '*.tmp' -delete    # ...then act

# Require a command exists before using it
command -v jq >/dev/null || { echo "jq is required" >&2; exit 1; }

# Single-instance lock so two copies don't run at once
exec 9>/tmp/myscript.lock
flock -n 9 || { echo "already running" >&2; exit 1; }
```

> [!IMPORTANT]
> Combine `set -u`, the `${var:?}` guard, and a **path check** before any `rm -rf`.
> The classic catastrophe — `rm -rf "$DIR/"` when `$DIR` is unset — is prevented by
> `set -u` (unset is an error) and `${DIR:?}` (empty aborts). Treat every destructive
> command as if it will someday run with an empty variable, because eventually one
> will.

## Part 5 — ShellCheck and debugging

**ShellCheck** is a linter that catches the majority of Bash bugs (unquoted
variables, misused `[ ]`, useless `cat`, subtle quoting issues) *before* they run —
use it on every script:

```bash
sudo apt install -y shellcheck
shellcheck myscript.sh           # reports issues with explanations and fix hints
```

Trace execution when something's wrong:

```bash
bash -x myscript.sh              # print each command as it runs
set -x; ...; set +x              # trace just a section inside the script
PS4='+ ${BASH_SOURCE}:${LINENO}: '   # nicer trace prefix (line numbers)
```

> [!TIP]
> Make **ShellCheck part of your workflow** (editor plugin or a CI step). It turns
> code review for an entire class of Bash mistakes into something automatic, and its
> explanations teach you the *why*. A script that's `set -euo pipefail` + trap-cleaned
> + ShellCheck-clean is genuinely production-grade.

## Hands-on lab

```bash
mkdir -p ~/robust-lab && cd ~/robust-lab

# 1. Build a robust script with header, trap, mktemp, exit codes
cat > backup.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

readonly E_USAGE=2 E_NOSRC=3
usage() { echo "Usage: $0 SRC_DIR" >&2; exit "$E_USAGE"; }
[[ $# -eq 1 ]] || usage
src="$1"
[[ -d "$src" ]] || { echo "not a dir: $src" >&2; exit "$E_NOSRC"; }

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT          # cleanup on ANY exit

stamp="$(date +%Y%m%d-%H%M%S)"
archive="$work/$(basename "$src")-$stamp.tar.gz"
tar -czf "$archive" -C "$(dirname "$src")" "$(basename "$src")"
echo "built $(du -h "$archive" | cut -f1) archive"
cp "$archive" .                     # keep a copy in CWD before cleanup wipes $work
echo "saved $(basename "$archive")"
EOF
chmod +x backup.sh

# 2. Run it well and badly; observe exit codes
./backup.sh /etc; echo "exit=$?"
./backup.sh;       echo "exit=$?"     # usage error -> 2
./backup.sh /nope; echo "exit=$?"     # no src -> 3
ls *.tar.gz

# 3. set -e demonstration (and the || true escape)
( set -e; false; echo "this never prints" ) || echo "stopped at the failure"
( set -e; false || true; echo "this DOES print" )

# 4. trap on Ctrl+C (start, then press Ctrl+C)
# ( trap 'echo "cleaning up"; exit 130' INT; echo "sleeping (Ctrl+C me)"; sleep 30 )

# 5. Lint it
shellcheck backup.sh && echo "shellcheck: clean" || echo "see shellcheck notes"

cd ~ && rm -r ~/robust-lab
```

## Exercises

1. Add `set -euo pipefail` to a script and demonstrate that an unset variable
   (`echo "$typo"`) now aborts it.
2. Write a script that creates a temp dir with `mktemp -d` and uses
   `trap cleanup EXIT` so the dir is removed even if the script errors midway
   (prove it by forcing an error).
3. Give a script three distinct exit codes (usage, missing input, failure) and show
   `echo $?` for each path.
4. Guard an `rm -rf` so it cannot run with an empty/unset variable, and explain which
   features protect it.
5. Run ShellCheck on a deliberately sloppy script (unquoted variable, `[ ]` misuse)
   and fix every finding.

## Troubleshooting

- **`set -e` exits on a command I expected to fail** — append `|| true`, or test it
  in an `if`/`&&` (which are exempt). *Fix:* `grep -q x file || true`.
- **`set -u` aborts on a legitimately-optional variable** — *Fix:* default it:
  `"${VAR:-}"`.
- **`pipefail` hides which stage failed** — *Fix:* check `${PIPESTATUS[@]}` for per-
  stage codes, or restructure the pipeline.
- **Temp files left behind after a crash** — no EXIT trap. *Fix:* `mktemp` +
  `trap cleanup EXIT`.
- **Script "works for me" but breaks elsewhere** — unquoted vars, missing checks.
  *Fix:* `set -euo pipefail` + **ShellCheck** catches most of it.

Reproduce the errexit save: a script that does `cd /nonexistent && rm -rf ./*` —
without `set -e` (and without `&&`) the `rm` runs in the wrong place; with `set -e`
the failed `cd` aborts before any deletion.

## Assessment

**Passing requirement: at least 9 of 11 correct (≈82%) — this is the safety
capstone.** Run the practical items.

1. What does each part of `set -euo pipefail` do?
2. How do you let a single command fail without aborting under `set -e`?
3. What does `set -u` protect against, and how do you allow an optional variable?
4. What is a trap, and why is `trap cleanup EXIT` so useful?
5. Why create temp files with `mktemp` instead of a fixed name?
6. What exit codes conventionally mean success, usage error, and Ctrl+C?
7. How do you guard `rm -rf` against an empty/unset path?
8. What does ShellCheck do, and when should you run it?
9. How do you trace a script's execution?
10. **Practical:** show that an unset variable aborts a `set -u` script.
11. **Practical:** prove a trap cleans up after a forced mid-script error.

## Solutions & validation

1. `-e` exit on any command failure; `-u` error on unset variables; `-o pipefail`
   fail a pipeline if any stage fails.
2. Append **`|| true`** (or test it inside `if`/`&&`, which are exempt from `-e`).
3. Use of an **unset variable** (typos); allow optional ones with `"${VAR:-}"`.
4. A command run on a signal/exit; **`trap cleanup EXIT`** guarantees cleanup on
   success, error, **and** interruption.
5. `mktemp` gives a **unique, safe-permission** name; fixed names are predictable,
   race-prone, and collide between runs.
6. **0** success, **2** usage/syntax error, **130** terminated by Ctrl+C.
7. `set -u` + **`${path:?}`** (abort if empty) plus an explicit `[[ -d "$path" ]]`
   check before the `rm`.
8. A **linter** that catches Bash bugs (quoting, `[ ]` misuse, etc.) **before
   runtime**; run it on every script (editor/CI).
9. `bash -x script` or `set -x`/`set +x` around a section (optionally a nicer `PS4`).
10. **Validation:** `set -u; echo "$undefined"` → "unbound variable", non-zero exit.
11. **Validation:** a script with `mktemp -d` + `trap 'rm -rf "$d"' EXIT` that then
    `false`s — the temp dir is gone afterward.

> [!TIP]
> The production-Bash checklist: **shebang + `set -euo pipefail`**, **`mktemp` +
> `trap cleanup EXIT`**, **validated inputs + meaningful exit codes**, **guarded
> destructive actions**, **ShellCheck-clean**. A script that ticks these is one you
> can schedule and walk away from.

## What's next

Next: **Lesson 308 — Parameter Expansion & String Manipulation.** The final
foundations lesson: do real text work *without* spawning `sed`/`awk` for every task —
slicing substrings, default/replace/trim operations, prefix/suffix removal (great for
filenames and paths), and case conversion, all with Bash's built-in `${ }` expansions.
