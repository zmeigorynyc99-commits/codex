---
title: "Linux Fundamentals — Finding Text with grep"
slug: "linux-fundamentals-finding-text-with-grep"
track: "linux-fundamentals"
trackName: "Linux Fundamentals"
module: "Text & Help"
order: 108
level: "Intermediate"
difficulty: "Intermediate"
distribution: "General Linux"
category: "Linux Fundamentals"
tags: [linux, grep, regex, search, text, intermediate]
cover: "/covers/curriculum/linux-fundamentals.svg"
estMinutes: 55
status: "published"
summary: "grep finds the needle in the haystack. Learn to search files and pipelines, the flags you'll use daily (-i, -n, -r, -v, -c, -w, -A/-B/-C), and a practical introduction to regular expressions so you can match patterns, not just fixed strings."
seoTitle: "Linux Fundamentals 8: grep & Regular Expressions, Practically"
seoDescription: "Intermediate Linux: search text with grep — essential flags (-i -n -r -v -A -B -C), word/whole-line matching, and practical regex with anchors and classes. Lab + assessment."
---

`grep` is the tool you'll reach for more than almost any other. It searches text
for lines matching a pattern and prints them. Configs, logs, source code, command
output — whenever you need to find *something* inside a lot of text, `grep` is the
answer. This lesson makes you genuinely fluent with it, including a practical
on-ramp to **regular expressions** (regex), the pattern language that makes search
powerful.

## Learning objectives

By the end of this lesson you will be able to:

- Search files and **pipelines** with `grep`.
- Use the daily flags: `-i`, `-n`, `-r`, `-v`, `-c`, `-w`, `-o`, `-l`.
- Show **context** around matches with `-A`, `-B`, `-C`.
- Write **basic regular expressions**: anchors, character classes, quantifiers.
- Use `grep -E` (extended regex) for alternation and grouping.

## Part 1 — Basic grep

```bash
grep "root" /etc/passwd          # lines in the file containing "root"
grep "Listen" /etc/ssh/sshd_config
ls /etc | grep conf              # filter a pipeline: names containing "conf"
history | grep ssh               # your past ssh commands
```

The form is `grep PATTERN [FILE...]`, or `... | grep PATTERN` in a pipe. Quote the
pattern (`"..."`) — it saves you from the shell mangling spaces and special
characters.

## Part 2 — The flags you'll use every day

```bash
grep -i "error" app.log          # -i: case-INSENSITIVE (Error, ERROR, error)
grep -n "TODO" script.sh         # -n: show line NUMBERS
grep -r "api_key" .              # -r: RECURSIVE — search every file under a dir
grep -v "debug" app.log          # -v: INVERT — lines that do NOT match
grep -c "404" access.log         # -c: COUNT matching lines (not print them)
grep -w "cat" file               # -w: whole WORD only (not "category", "concat")
grep -l "password" *.conf        # -l: just the FILE NAMES that contain a match
grep -o "[0-9]\+" file           # -o: print ONLY the matched part, not the line
```

Combine them freely — they stack:

```bash
grep -rin "timeout" /etc         # recursive + case-insensitive + line numbers
grep -rl "TODO" src/             # which files under src/ have a TODO?
```

> [!TIP]
> `grep -v` (invert) is quietly one of the most useful: `grep -v "^#" file` strips
> comment lines, and `... | grep -v grep` removes grep's own line when searching
> process lists. "Show me everything *except*…" is a daily need.

## Part 3 — Context around matches: `-A`, `-B`, `-C`

When a matching line alone isn't enough, show its neighbours:

```bash
grep -A 3 "ERROR" app.log        # the match plus 3 lines AFTER
grep -B 2 "ERROR" app.log        # the match plus 2 lines BEFORE
grep -C 2 "ERROR" app.log        # 2 lines of context on BOTH sides
```

This is indispensable for logs, where the lines around an error explain what
happened. `grep -C 3 "Traceback" app.log` shows each crash in context.

## Part 4 — Regular expressions, practically

A **regular expression** is a pattern that describes a *set* of strings, not one
fixed string. `grep` matches regex by default. Start with these building blocks:

| Pattern | Matches |
|---------|---------|
| `.` | any single character |
| `^` | start of the line |
| `$` | end of the line |
| `[abc]` | any one of a, b, c |
| `[0-9]` | any digit; `[a-z]` any lowercase letter |
| `[^0-9]` | any character that is **not** a digit |
| `*` | zero or more of the preceding item |

Examples that show why this matters:

```bash
grep "^root" /etc/passwd         # lines that START with "root"
grep "bash$" /etc/passwd         # lines that END with "bash" (users with bash)
grep "^#" file                   # comment lines (start with #)
grep "^$" file                   # empty lines
grep "[0-9]" file                # lines containing any digit
grep "^[0-9]" file               # lines that start with a digit
grep "colou*r" file              # "color" OR "colour" (u zero-or-more)
```

### Extended regex: `grep -E`

For **one or more** (`+`), **optional** (`?`), **alternation** (`|`) and
**grouping** (`( )`), use `grep -E` (extended regex) so you don't need backslashes:

```bash
grep -E "error|warning|critical" app.log    # any of these three words
grep -E "^[0-9]+$" file                      # lines that are ONLY digits
grep -E "colou?r" file                       # color or colour (u optional)
grep -E "(GET|POST) /api" access.log         # GET or POST requests to /api
```

> [!IMPORTANT]
> In **basic** grep, `+`, `?`, `|`, `(` `)` are literal characters; you'd have to
> write `\+`, `\?`, `\|`. With **`grep -E`** (extended) they become operators and
> you write them plainly. When a regex "doesn't work," nine times out of ten you
> wanted `-E`. Many people just always use `grep -E`.

## Hands-on lab

```bash
# Use real system files — no setup needed.

# 1. Basic searches
grep "root" /etc/passwd
grep -n "nologin" /etc/passwd | head     # with line numbers

# 2. Case-insensitive + count
grep -ic "server" /etc/services

# 3. Invert: non-comment, non-empty lines of a config
grep -v "^#" /etc/ssh/sshd_config | grep -v "^$"

# 4. Recursive search across /etc (you'll need sudo for some files)
sudo grep -rl "PermitRootLogin" /etc/ssh

# 5. Context around a keyword
grep -C 1 "tcp" /etc/services | head

# 6. Regex: anchors and classes
grep "^root" /etc/passwd                 # starts with root
grep "bash$" /etc/passwd                 # ends with bash
grep -E "^(daemon|bin|sys):" /etc/passwd # alternation with -E

# 7. Extract just the matched part
grep -oE "[0-9]+/(tcp|udp)" /etc/services | head
```

## Exercises

1. Print every line in `/etc/passwd` for a user whose shell is `/bin/bash` (ends in
   `bash`). Which regex anchor did you use?
2. Count, case-insensitively, how many lines in `/etc/services` mention `http`.
3. Show `/etc/ssh/sshd_config` with all comment lines and blank lines removed (two
   greps, or one clever one).
4. Using `grep -E`, find lines in `/etc/services` for either `ssh` or `https`.
5. From `/etc/services`, extract just the port/protocol tokens like `443/tcp`
   (matched part only).

## Troubleshooting

- **Regex "doesn't work" with `+`, `?`, `|`, `()`** — you're in basic mode where
  those are literal. *Fix:* add `-E` (extended regex).
- **`grep` matches too much** — your pattern is a substring. *Fix:* anchor it (`^`,
  `$`) or use `-w` for whole words. E.g. `grep -w "cat"` won't match "category".
- **`grep: /path: Is a directory`** — you searched a directory without `-r`. *Fix:*
  add `-r` (recursive).
- **Searching processes shows the grep itself** — `ps aux | grep nginx` includes
  the grep line. *Fix:* `ps aux | grep -v grep | grep nginx`, or `grep "[n]ginx"`.
- **Permission denied while recursing** — some files need root. *Fix:* prefix
  `sudo`, or accept the skipped lines.

Reproduce the `-E` gotcha: `grep "a|b" file` looks for the literal `a|b`, while
`grep -E "a|b" file` finds lines with `a` or `b`.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Run the practical items.

1. What does plain `grep PATTERN FILE` print?
2. Which flag makes the search case-insensitive? Which inverts the match?
3. How do you search every file under a directory recursively?
4. What do `^` and `$` mean in a regex?
5. What does `[0-9]` match? What does `[^0-9]` match?
6. When do you need `grep -E`, and what does it enable?
7. How do you show 3 lines of context after each match?
8. How would you match the whole word `log` but not `login` or `catalog`?
9. **Practical:** count case-insensitively the `http` lines in `/etc/services`.
   What number and command?
10. **Practical:** print `/etc/passwd` lines that start with `root`. Command?

## Solutions & validation

1. Every **line that contains** the pattern.
2. `-i` is case-insensitive; `-v` inverts (prints non-matching lines).
3. `grep -r PATTERN DIR`.
4. `^` anchors to the **start** of the line; `$` to the **end**.
5. `[0-9]` matches **any single digit**; `[^0-9]` matches **any single non-digit**.
6. When using `+ ? | ( )` as operators; `-E` (extended regex) makes them work
   without backslashes, enabling one-or-more, optional, alternation and grouping.
7. `grep -A 3 PATTERN`.
8. `grep -w "log"` (whole-word match).
9. **Validation:** `grep -ic http /etc/services` prints a positive integer.
10. **Validation:** `grep "^root" /etc/passwd` prints the root line(s).

> [!TIP]
> grep + pipes is a search engine for your whole system. Whenever you think "where
> is that setting / where did that error happen," the answer usually starts with
> `grep -rin`.

## What's next

Next: **Lesson 109 — Text Processing Pipelines.** grep *finds* lines; now you'll
*transform* them. You'll combine `cut`, `sort`, `uniq`, `tr`, and `wc` into
pipelines that slice columns, sort and de-duplicate data, and answer real questions
like "what are the top 10 IPs in this log?" — the everyday data work of operations.
