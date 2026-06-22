---
title: "Shell & Bash Scripting — Parameter Expansion & String Manipulation"
slug: "bash-parameter-expansion-and-strings"
track: "shell-bash"
trackName: "Shell & Bash Scripting"
module: "Structured Scripts"
order: 308
level: "Advanced"
difficulty: "Advanced"
distribution: "General Linux"
category: "Shell & Scripting"
tags: [bash, parameter-expansion, strings, text, scripting, advanced]
cover: "/covers/curriculum/shell-bash.svg"
estMinutes: 55
status: "published"
summary: "Do real text work without spawning sed/awk for every task. Master Bash's built-in parameter expansions: substrings, length, search-and-replace, prefix/suffix removal for filenames and paths, default and required values, and case conversion — faster, cleaner scripts."
seoTitle: "Bash Scripting 8: Parameter Expansion & String Manipulation"
seoDescription: "Advanced Bash: built-in ${} expansions — substrings, length, replace, prefix/suffix trim for paths/filenames, defaults, case conversion — without sed/awk. Lab + assessment."
---

You can already do text work by piping to `sed`, `awk` and `cut` (the Linux
Fundamentals track) — but for many common tasks, Bash's **built-in parameter
expansions** are faster, cleaner, and need no external process. Trimming a file
extension, swapping a path prefix, providing a default, lowercasing input — all done
inside `${ }`. This **Advanced** lesson completes the Bash foundations by making you
fluent with these, so your scripts manipulate strings and filenames elegantly. It
closes the Shell & Bash Scripting track.

## Learning objectives

By the end of this lesson you will be able to:

- Get **length** and **substrings** with `${#var}` and `${var:off:len}`.
- **Search and replace** within a variable (`${var/old/new}`).
- **Strip prefixes/suffixes** (`#`, `##`, `%`, `%%`) for paths and filenames.
- Use **default/alternate/required** expansions in context.
- Do **case conversion** (`${var^^}`, `${var,,}`).

## Part 1 — Length and substrings

```bash
s="botera.md"
echo "${#s}"           # length: 9
echo "${s:0:6}"        # substring from offset 0, length 6 -> "botera"
echo "${s:7}"          # from offset 7 to end -> "md"
echo "${s: -2}"        # last 2 chars (note the space) -> "md"
echo "${s:0:-3}"       # all but the last 3 -> "botera"
```

`${var:offset:length}` slices like most languages (0-indexed). A negative offset
counts from the end (mind the leading space to avoid clashing with `:-` defaults).

## Part 2 — Search and replace

```bash
path="/var/log/app.log"
echo "${path/log/LOG}"     # replace FIRST match -> /var/LOG/app.log
echo "${path//o/0}"        # replace ALL matches -> /var/l0g/app.l0g
echo "${path/.log/.txt}"   # change an extension by replacement
echo "${path/#\/var/\/srv}"  # replace only at the START (#)
echo "${path/%.log/.gz}"     # replace only at the END (%)

name="  trimme  "
echo "[${name// /}]"       # remove all spaces -> [trimme]
```

`${var/old/new}` replaces the first occurrence; `${var//old/new}` replaces all. The
patterns are **globs** (not regex), so `*` and `?` work as wildcards.

## Part 3 — Prefix/suffix removal (the filename workhorse)

This is the most useful family in practice — perfect for paths and filenames:

```bash
file="/home/alex/report.tar.gz"

echo "${file##*/}"     # remove longest leading */  -> "report.tar.gz"  (basename)
echo "${file%/*}"      # remove shortest trailing /* -> "/home/alex"     (dirname)
echo "${file%.gz}"     # remove ".gz" suffix         -> "report.tar"
echo "${file%.*}"      # remove shortest .*          -> "report.tar"
echo "${file%%.*}"     # remove longest .*           -> "report" ... but careful (see note)
echo "${file##*.}"     # remove longest *.           -> "gz" (the extension)
```

Remember the symbols by position and greed:

- **`#`** trims from the **front** (think: `#` is at the start of a comment line).
- **`%`** trims from the **back** (think: `%` is on the right of `100%`).
- **Single** (`#`/`%`) = **shortest** match; **double** (`##`/`%%`) = **longest**.

```bash
base="${file##*/}"     # report.tar.gz
name="${base%%.*}"     # report   (strip everything from the first dot)
ext="${base##*.}"      # gz       (everything after the last dot)
stem="${base%.*}"      # report.tar (strip just the last extension)
```

> [!TIP]
> `${path##*/}` (basename) and `${path%/*}` (dirname) replace calls to the
> `basename`/`dirname` commands with **no subprocess** — handy in loops over many
> files. For double-extension files like `.tar.gz`, choose `%`/`%%` deliberately:
> `%.*` strips one extension, `%%.*` strips from the first dot (which removes
> *all* dotted parts).

## Part 4 — Defaults, alternates, required (in context)

You met defaults in Lesson 302; here they are in their full family:

```bash
echo "${name:-default}"    # use 'default' if name is unset/empty (don't assign)
echo "${name:=default}"    # use AND assign 'default' if unset/empty
echo "${name:+set}"        # use 'set' ONLY if name IS non-empty (alternate)
echo "${name:?required}"   # error+exit if unset/empty (enforce required input)
```

`:+` (alternate value) is the lesser-known gem — useful for conditional flags:

```bash
verbose=1
flags="${verbose:+--verbose}"     # flags = "--verbose" only when verbose is set
run --quiet ${flags:+$flags}
```

## Part 5 — Case conversion and assembling values

```bash
s="Botera"
echo "${s^^}"      # ALL UPPER -> BOTERA
echo "${s,,}"      # all lower -> botera
echo "${s^}"       # first char upper
echo "${s,}"       # first char lower

# Putting it together: normalize and build a safe filename
title="My Report 2026"
slug="${title,,}"            # lower
slug="${slug// /-}"          # spaces -> dashes
echo "$slug"                 # my-report-2026
echo "backup-$(date +%F)-${slug}.tar.gz"
```

These build clean identifiers, normalize user input, and assemble filenames — all
without a single pipe to an external tool.

> [!IMPORTANT]
> Reach for parameter expansion **first** for simple, single-value string work — it's
> faster (no subprocess) and clearer than piping to `sed`/`awk`, and it can't be
> tripped up by spaces the way unquoted command output can. Save `sed`/`awk`/`cut`
> for **streams** (many lines/records) and genuinely complex transformations. Knowing
> which tool fits is itself a senior skill.

## Hands-on lab

```bash
mkdir -p ~/str-lab && cd ~/str-lab

# 1. Length and substrings
s="botera.md"
echo "len=${#s} first6=${s:0:6} last2=${s: -2}"

# 2. Replace
p="/var/log/app.log"
echo "${p//o/0}"          # all o -> 0
echo "${p/.log/.txt}"     # change extension

# 3. The filename workhorse
for f in /home/alex/report.tar.gz ./notes.md data; do
  echo "path=$f base=${f##*/} dir=${f%/*} stem=${f##*/}; ext=${f##*.}"
done
file="archive.tar.gz"
echo "name=${file%%.*}  one-ext-off=${file%.*}  ext=${file##*.}"

# 4. Defaults / alternate / required
unset NAME
echo "default: ${NAME:-anonymous}"
NAME="alex"; echo "alternate: ${NAME:+known-user}"

# 5. Case + slug building
title="My Great Post"
slug="${title,,}"; slug="${slug// /-}"
echo "slug=$slug  upper=${title^^}"

# 6. basename/dirname with NO subprocess (compare)
p="/etc/nginx/nginx.conf"
echo "pe-base=${p##*/}  cmd-base=$(basename "$p")"
echo "pe-dir=${p%/*}    cmd-dir=$(dirname "$p")"

cd ~ && rm -r ~/str-lab
```

## Exercises

1. Given `file="/srv/data/backup.sql.gz"`, extract: the basename, the directory, the
   extension (`gz`), and the name with **all** extensions stripped — using only
   parameter expansion.
2. Replace every `/` in a path with `_` to make a flat filename.
3. Lowercase a title and turn spaces into dashes to build a slug, with no external
   commands.
4. Use a default expansion to make a variable fall back to a value when unset, and a
   `:+` alternate to emit a flag only when a variable is set.
5. Reimplement `basename` and `dirname` for a given path using `${}` and verify they
   match the real commands' output.

## Troubleshooting

- **`${var: -2}` didn't work / clashed with default** — a negative offset needs a
  **space** (`${var: -2}`) or parentheses (`${var:(-2)}`) to differ from `:-`.
- **`%%.*` stripped too much** — it's **greedy** from the first dot; use `%.*` to
  remove just the last extension (matters for `.tar.gz`).
- **Replacement didn't match** — `${var/old/new}` patterns are **globs**, not regex.
  *Fix:* use glob wildcards (`*`, `?`), or `sed` for regex.
- **Case conversion did nothing** — old Bash (`^^`/`,,` need Bash 4+). *Fix:* check
  `bash --version`; fall back to `tr '[:lower:]' '[:upper:]'`.
- **Subprocess in a hot loop is slow** — replace `basename`/`dirname`/`sed` calls
  with `${path##*/}` / `${path%/*}` / `${var/.../...}` for single-value work.

Reproduce the greedy-match pitfall: `f="a.tar.gz"; echo "${f%%.*}"` → `a` (lost
both extensions), while `echo "${f%.*}"` → `a.tar` (only the last) — choose based on
intent.

## Assessment

**Passing requirement: at least 9 of 11 correct (≈82%).** Run the practical items.

1. How do you get a string's length and a substring?
2. What's the difference between `${var/old/new}` and `${var//old/new}`?
3. Which expansion strips from the **front**, and which from the **back**?
4. What's the difference between single (`#`/`%`) and double (`##`/`%%`)?
5. Give the parameter-expansion equivalents of `basename` and `dirname`.
6. How do you extract a file's extension, and the name without it?
7. What does `${var:+value}` do (vs `${var:-value}`)?
8. How do you upper/lower-case a string in Bash 4+?
9. When should you prefer parameter expansion over `sed`/`awk`?
10. **Practical:** from `/srv/x/report.tar.gz`, extract base, dir, and extension.
11. **Practical:** build a slug from "Hello World" (lowercase, dashes).

## Solutions & validation

1. `${#var}` for length; `${var:offset:length}` for a substring.
2. `/` replaces the **first** match; `//` replaces **all** matches.
3. **`#`** strips from the front; **`%`** strips from the back.
4. Single = **shortest** match; double = **longest** match.
5. basename: `${path##*/}`; dirname: `${path%/*}`.
6. Extension: `${file##*.}`; name without the last extension: `${file%.*}` (or
   `${file%%.*}` to strip from the first dot).
7. `:+` yields the **alternate** value only when the variable **is** set/non-empty;
   `:-` yields a **default** only when it's **unset**/empty.
8. `${var^^}` (upper), `${var,,}` (lower) — Bash 4+.
9. For **single-value** string/filename work (faster, no subprocess, space-safe);
   use `sed`/`awk` for **streams** and complex/regex transforms.
10. **Validation:** `f=/srv/x/report.tar.gz` → base `${f##*/}`=report.tar.gz,
    dir `${f%/*}`=/srv/x, ext `${f##*.}`=gz.
11. **Validation:** `t="Hello World"; s="${t,,}"; echo "${s// /-}"` → `hello-world`.

> [!TIP]
> 🎉 That completes the **Shell & Bash Scripting** track. With foundations, structure,
> robustness and string mastery, you can write the kind of reliable automation that
> real operations and DevOps run on — and you're ready for the tools that orchestrate
> it (Git, CI/CD, Ansible, containers) in the tracks ahead.

## What's next

The curriculum continues into the **DevOps half** of the roadmap. With solid Linux
administration and Bash automation behind you, the next tracks — **Git & Version
Control**, **Docker & Containers**, **CI/CD**, **Infrastructure as Code** and
**Configuration Management** — turn individual skills into repeatable, collaborative
delivery. Everything you've automated by hand becomes code that ships itself.
