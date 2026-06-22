---
title: "Linux Fundamentals — sed & awk Essentials"
slug: "linux-fundamentals-sed-and-awk-essentials"
track: "linux-fundamentals"
trackName: "Linux Fundamentals"
module: "Text & Help"
order: 110
level: "Intermediate"
difficulty: "Intermediate"
distribution: "General Linux"
category: "Linux Fundamentals"
tags: [linux, sed, awk, text, regex, intermediate]
cover: "/covers/curriculum/linux-fundamentals.svg"
estMinutes: 60
status: "published"
summary: "The two power tools that finish your text toolkit. Use sed for stream find-and-replace and line editing, and just enough awk to pick fields from messy space-aligned data, filter by condition, and do quick sums and averages — without writing a whole program."
seoTitle: "Linux Fundamentals 10: sed & awk Essentials for Admins"
seoDescription: "Intermediate Linux: practical sed (substitute, delete, in-place) and awk (fields, conditions, sums) for everyday text editing and log analysis. Hands-on lab + assessment."
---

`cut`, `sort` and `uniq` handle clean, simple data. For everything else there are
two legendary tools: **`sed`** (the stream editor) and **`awk`** (a tiny
text-processing language). They have a reputation for being arcane, but you only
need a small, high-value slice of each to handle the vast majority of real tasks.
That practical slice is exactly what this lesson delivers — no computer-science
detour.

## Learning objectives

By the end of this lesson you will be able to:

- Do find-and-replace in a stream with **`sed 's/old/new/'`** (and `g`, `i`).
- Delete and print specific lines with **`sed`**.
- Edit files **in place** with `sed -i` (and back them up).
- Pick fields from space-aligned data with **`awk '{print $N}'`**.
- Filter rows by condition and compute **sums/averages** with `awk`.

## Part 1 — `sed`: substitute (the 90% use case)

By far the most common `sed` job is **find-and-replace**:

```bash
sed 's/old/new/' file            # replace the FIRST "old" on each line with "new"
sed 's/old/new/g' file           # g = GLOBAL: replace ALL occurrences on each line
sed 's/old/new/gi' file          # g + i = global, case-insensitive
echo "hello world" | sed 's/world/there/'   # -> hello there
```

The syntax is `s/PATTERN/REPLACEMENT/FLAGS`. The `/` is just a delimiter — if your
text contains slashes (like paths), pick another delimiter to stay readable:

```bash
sed 's#/usr/local#/opt#' file    # using # so the slashes in paths don't clash
```

`sed` reads a stream and writes the result to stdout; the original file is
**untouched** unless you ask otherwise (Part 3). So you can experiment safely.

## Part 2 — `sed`: print and delete lines

`sed` can address specific lines by number or pattern:

```bash
sed -n '5p' file                 # print ONLY line 5 (-n silences default printing)
sed -n '5,10p' file              # print lines 5 through 10
sed '2d' file                    # delete line 2 (print the rest)
sed '/^#/d' file                 # delete all COMMENT lines (start with #)
sed '/^$/d' file                 # delete all blank lines
sed '1d' file                    # drop the first line (e.g. a CSV header)
```

Combine substitution with an address to act only on matching lines:

```bash
sed '/ERROR/s/^/>> /' app.log    # prefix ">> " only to lines containing ERROR
```

## Part 3 — Editing files in place: `sed -i`

By default `sed` prints to stdout. To **change the file itself**, add `-i`. Always
keep a backup while learning by giving `-i` a suffix:

```bash
sed -i.bak 's/foo/bar/g' config.txt   # edit in place, saving config.txt.bak first
sed -i 's/foo/bar/g' config.txt       # edit in place with NO backup (be sure!)
```

> [!IMPORTANT]
> **`sed -i` rewrites the file with no undo.** This is enormously useful for
> scripted config changes (it's how automation tools tweak files), but test your
> substitution **without** `-i` first to see the result, then add `-i.bak` so you
> have a backup. "Test, then in-place with a backup" is the safe professional
> rhythm.

## Part 4 — `awk`: fields made easy

`awk`'s superpower is splitting each line into **fields** automatically on
whitespace, accessible as `$1`, `$2`, … (`$0` is the whole line, `NF` is the number
of fields). This handles the space-aligned data that defeats `cut`:

```bash
awk '{print $1}' access.log          # the first field of every line
awk '{print $1, $9}' access.log      # fields 1 and 9, space-separated
ps aux | awk '{print $2, $11}'       # PID and command from ps (variable spacing!)
df -h | awk '{print $5, $6}'         # use% and mountpoint
awk '{print $NF}' file               # the LAST field, whatever its number
```

Choose a different field separator with `-F` (so awk also does `cut`'s job, better):

```bash
awk -F: '{print $1}' /etc/passwd     # usernames (split on ':')
awk -F: '{print $1, $7}' /etc/passwd # username and shell
```

## Part 5 — `awk`: filter and calculate

`awk` runs a block for lines matching a **condition** (a pattern or comparison):

```bash
awk '$3 > 1000' /etc/passwd                       # lines where field 3 (UID) > 1000
awk -F: '$3 >= 1000 {print $1}' /etc/passwd       # names of "real" users (UID>=1000)
awk '/ERROR/ {print $0}' app.log                  # lines matching ERROR (like grep)
awk 'NF == 0' file                                # blank lines (zero fields)
df -h | awk '$5+0 > 80 {print $6, $5}'            # mounts over 80% full
```

And it can **accumulate** across lines — sums, counts, averages:

```bash
# Total of the numbers in column 1
awk '{sum += $1} END {print sum}' numbers.txt

# Average request size (column 10 of a log)
awk '{sum += $10; n++} END {print sum/n}' access.log

# Count lines (like wc -l) and print a labelled total
awk 'END {print NR, "lines"}' file
```

`END {}` runs once after all lines; `NR` is the running line number / final count.
That's enough `awk` to handle a huge share of real reporting tasks.

> [!TIP]
> Rule of thumb: reach for **`grep`** to *find* lines, **`sed`** to *edit* lines,
> and **`awk`** to work with *columns* or do *arithmetic*. Most pipelines use them
> together: `grep` to narrow down, `awk` to pull a field, `sort | uniq -c` to tally.

## Hands-on lab

```bash
mkdir -p ~/sa-lab && cd ~/sa-lab
printf 'name age city\nalice 30 paris\nbob 25 berlin\ncarol 41 rome\n' > people.txt

# 1. sed substitution (stream only — file unchanged)
sed 's/paris/PARIS/' people.txt
cat people.txt                       # original still intact

# 2. sed delete the header line, and blank/comment lines on a config
sed '1d' people.txt                  # drop header
sed '/^#/d' /etc/ssh/sshd_config | sed '/^$/d' | head

# 3. sed in place WITH a backup, then confirm the backup exists
sed -i.bak 's/rome/ROME/' people.txt
cat people.txt; echo "---"; cat people.txt.bak | grep rome

# 4. awk fields and a filter
awk '{print $1, $2}' people.txt      # name and age
awk 'NR>1 && $2 > 28 {print $1}' people.txt   # names older than 28 (skip header)

# 5. awk arithmetic: average age
awk 'NR>1 {sum+=$2; n++} END {print "avg age:", sum/n}' people.txt

# 6. Real system data: real users (UID >= 1000)
awk -F: '$3 >= 1000 && $3 < 65534 {print $1, $3}' /etc/passwd

# 7. Clean up
cd ~ && rm -r ~/sa-lab
```

## Exercises

1. Use `sed` to replace every occurrence of `localhost` with `127.0.0.1` in a test
   file — first as a stream (preview), then in place with a backup.
2. Strip all comment (`#…`) and blank lines from `/etc/ssh/sshd_config` using
   `sed`, leaving only active settings.
3. With `awk`, print just the usernames and shells from `/etc/passwd` (split on
   `:`).
4. With `awk`, list the names of accounts whose UID is 1000 or greater.
5. Given a file of numbers (one per line), use `awk` to print their **sum** and
   **average** in one command.

## Troubleshooting

- **`sed` replaced only the first match on each line** — add the **`g`** flag:
  `s/old/new/g`.
- **`sed: -e expression... unknown option to 's'`** — your pattern/replacement
  contains the delimiter `/` (e.g. a path). *Fix:* use a different delimiter:
  `s#/a#/b#`.
- **`sed -i` changed the file and I want it back** — there's no undo. *Fix going
  forward:* always use `-i.bak` and test without `-i` first; restore from the
  `.bak`.
- **`awk` prints the wrong field** — default split is on whitespace; your data uses
  another separator. *Fix:* set `-F` (e.g. `-F:` or `-F,`).
- **`awk` arithmetic gives 0 or blank** — you included a header row, or the field
  isn't numeric. *Fix:* skip the header with `NR>1`, and force numeric context with
  `$5+0` if needed.

Reproduce the `g` flag lesson: `echo "a a a" | sed 's/a/b/'` gives `b a a`, while
`echo "a a a" | sed 's/a/b/g'` gives `b b b`.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Run the practical items.

1. Write the `sed` command to replace **all** `cat` with `dog` on each line of
   `file`.
2. What does the `g` flag do in a `sed` substitution? What about `i`?
3. How do you delete all blank lines with `sed`?
4. What does `sed -i` do, and what's the safe habit when using it?
5. In `awk`, what are `$1`, `$0`, and `NF`?
6. How do you tell `awk` to split on `:` instead of whitespace?
7. Write an `awk` condition that prints lines whose 3rd field exceeds 1000.
8. Which tool is best for: finding lines, editing lines, working with columns?
9. **Practical:** print usernames and shells from `/etc/passwd` with `awk`.
   Command?
10. **Practical:** sum a column of numbers with `awk`. Command shape?

## Solutions & validation

1. `sed 's/cat/dog/g' file`.
2. `g` replaces **all** occurrences on each line (not just the first); `i` makes the
   match **case-insensitive**.
3. `sed '/^$/d' file`.
4. It edits the file **in place** (rewrites it). Safe habit: test without `-i`
   first, then use **`-i.bak`** to keep a backup.
5. `$1` = first field; `$0` = the whole line; `NF` = the number of fields on the
   line.
6. With **`-F:`** (e.g. `awk -F: '{print $1}'`).
7. `awk '$3 > 1000'` (optionally `{print}` / `{print $1}`).
8. `grep` to **find** lines, `sed` to **edit** lines, `awk` for **columns/math**.
9. **Validation:** `awk -F: '{print $1, $7}' /etc/passwd` prints two columns.
10. **Validation:** `awk '{sum+=$1} END {print sum}' file` prints a single total.

> [!TIP]
> You don't need to "learn all of sed and awk" — this practical slice covers the
> overwhelming majority of real-world use. Deepen it later if you wish, but you can
> already do serious text work today.

## What's next

Next: **Lesson 111 — Finding Files (find, locate, xargs).** You've mastered finding
and shaping text *inside* files; now you'll find the **files themselves** anywhere
on the system by name, type, size, time or owner with `find`, do it instantly with
`locate`, and act on the results in bulk with `xargs`. That completes Module 2.
