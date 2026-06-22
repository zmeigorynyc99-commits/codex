---
title: "Linux Fundamentals — Text Processing Pipelines (cut, sort, uniq, tr)"
slug: "linux-fundamentals-text-processing-pipelines"
track: "linux-fundamentals"
trackName: "Linux Fundamentals"
module: "Text & Help"
order: 109
level: "Intermediate"
difficulty: "Intermediate"
distribution: "General Linux"
category: "Linux Fundamentals"
tags: [linux, cut, sort, uniq, tr, pipeline, intermediate]
cover: "/covers/curriculum/linux-fundamentals.svg"
estMinutes: 55
status: "published"
summary: "Turn the terminal into a data workshop. Combine cut, sort, uniq, tr and wc into pipelines that slice columns out of files, sort and count unique values, and answer real questions like 'top 10 IPs in this log' — the bread-and-butter data work of operations."
seoTitle: "Linux Fundamentals 9: cut, sort, uniq, tr — Text Pipelines"
seoDescription: "Intermediate Linux: build text pipelines with cut, sort, uniq -c, tr and wc to slice columns and rank values (e.g. top IPs in a log). Hands-on lab + assessment."
---

grep finds lines; this lesson **transforms** them. You'll meet the classic
text-processing tools — `cut`, `sort`, `uniq`, `tr` — and, more importantly, learn
to **chain them with pipes** into pipelines that answer real questions. The famous
"top 10 IP addresses hitting my server" one-liner is just these tools in a row.
This is the everyday data work of every admin, SRE and security analyst.

## Learning objectives

By the end of this lesson you will be able to:

- Extract columns/fields with **`cut`** (and choose a delimiter).
- Order data with **`sort`** (alphabetical, numeric, reverse, by column).
- Collapse and **count** duplicates with **`uniq -c`** (and why `sort` comes
  first).
- Translate or delete characters with **`tr`**.
- Compose these into **pipelines** that produce rankings and summaries.

## Part 1 — `cut`: slice out columns

Data is often columns separated by a delimiter. `cut` extracts the fields you want:

```bash
cut -d: -f1 /etc/passwd          # -d: delimiter is ':' , -f1 = first field (usernames)
cut -d: -f1,7 /etc/passwd        # fields 1 and 7 (username and shell)
cut -d, -f2 data.csv             # second column of a CSV
echo "a-b-c-d" | cut -d- -f3     # -> c
cut -c1-10 file.txt              # by CHARACTER position: columns 1–10 of each line
```

`-d` sets the delimiter (default is Tab), `-f` picks fields by number, `-c` picks
by character position. `cut` is simple and fast for clean, single-character
delimiters.

> [!NOTE]
> `cut` splits on a **single** character and treats each one as a separator, so it
> struggles with data aligned by **multiple/variable spaces** (like `ls -l` or
> `ps` output). For space-aligned columns, `awk` (next lesson) is the right tool.
> Use `cut` for clean delimiters like `:` in `/etc/passwd` or `,` in CSVs.

## Part 2 — `sort`: put things in order

```bash
sort names.txt                   # alphabetical (ascending)
sort -r names.txt                # reverse
sort -n numbers.txt              # NUMERIC (so 10 comes after 9, not after 1)
sort -nr numbers.txt             # numeric, largest first
sort -u names.txt                # sort AND remove duplicates (unique)
sort -k2 data.txt                # sort by the 2nd whitespace-separated column
sort -t: -k3 -n /etc/passwd      # by 3rd field, numeric, ':'-delimited (by UID)
```

> [!IMPORTANT]
> **`sort` (alphabetical) and `sort -n` (numeric) are different**, and mixing them
> up is a classic bug. Alphabetically, `"10"` sorts **before** `"9"` (because `1` <
> `9` as characters). For numbers — sizes, ports, counts — you almost always want
> **`-n`**. Reach for `-nr` to rank biggest-first.

## Part 3 — `uniq`: collapse and count duplicates

`uniq` removes **adjacent** duplicate lines — which is why you almost always
**`sort` first**:

```bash
sort file.txt | uniq             # de-duplicate (sort groups identical lines)
sort file.txt | uniq -c          # COUNT each unique line (prefixes the count)
sort file.txt | uniq -d          # show only lines that ARE duplicated
sort file.txt | uniq -u          # show only lines that appear exactly once
```

The **`sort | uniq -c`** combination is the workhorse: it tallies how many times
each distinct value appears. Add `sort -nr` to rank them:

```bash
sort file.txt | uniq -c | sort -nr      # most-frequent values first
```

> [!IMPORTANT]
> `uniq` only collapses **consecutive** identical lines. `uniq` *without* a
> preceding `sort` will miss duplicates that aren't next to each other. The reflex
> is **`sort | uniq`** (or `sort -u`), always.

## Part 4 — `tr`: translate or delete characters

`tr` ("translate") substitutes or deletes characters from stdin:

```bash
echo "hello" | tr 'a-z' 'A-Z'    # -> HELLO (lowercase to uppercase)
echo "a,b,c" | tr ',' '\n'       # turn commas into newlines (one item per line)
cat file | tr -d ' '             # -d: DELETE all spaces
cat file | tr -s ' '             # -s: SQUEEZE repeats (collapse multiple spaces to one)
tr -d '\r' < dosfile.txt > unixfile.txt   # strip Windows carriage returns
```

`tr` only works on **stdin** (it has no filename argument), so you pipe or redirect
into it. `tr -s ' '` is handy for normalising messy whitespace before `cut`.

## Part 5 — Building real pipelines

Now combine everything. These are patterns you'll genuinely use:

```bash
# How many user accounts have a real login shell (bash)?
grep "bash$" /etc/passwd | wc -l

# List all login shells in use, with a count of each, most common first
cut -d: -f7 /etc/passwd | sort | uniq -c | sort -nr

# Top 10 IP addresses in a web access log (the classic)
cut -d' ' -f1 access.log | sort | uniq -c | sort -nr | head -10

# Unique HTTP status codes seen, ranked by frequency
awk '{print $9}' access.log | sort | uniq -c | sort -nr   # (awk previews next lesson)

# Alphabetical, de-duplicated list of usernames
cut -d: -f1 /etc/passwd | sort -u
```

Read each pipeline left to right: extract a column → sort → count uniques → rank.
That four-step shape answers an enormous range of "how many / which are most
common" questions.

## Hands-on lab

```bash
mkdir -p ~/text-lab && cd ~/text-lab

# Build a small data file to play with
printf 'apple\nbanana\napple\ncherry\nbanana\napple\n' > fruit.txt

# 1. Count each unique fruit, ranked
sort fruit.txt | uniq -c | sort -nr

# 2. Just the unique names, alphabetical
sort -u fruit.txt

# 3. cut on a real file: every login shell on the system
cut -d: -f7 /etc/passwd | sort | uniq -c | sort -nr

# 4. tr: uppercase the fruit, and turn a CSV line into lines
tr 'a-z' 'A-Z' < fruit.txt
echo "red,green,blue" | tr ',' '\n'

# 5. A realistic pipeline on /etc/passwd: UIDs sorted numerically
cut -d: -f3 /etc/passwd | sort -n | tail -5     # the five highest UIDs

# 6. Clean up
cd ~ && rm -r ~/text-lab
```

## Exercises

1. From `/etc/passwd`, produce an alphabetical, duplicate-free list of all login
   shells in use (field 7).
2. Count how many accounts use each shell, showing the most common first.
3. Make a file with several repeated lines (some non-adjacent). Show that `uniq`
   alone misses some, but `sort | uniq` catches all.
4. Take the CSV string `one,two,three,four` and print each word on its own line
   using `tr`.
5. Find the five highest user IDs (UIDs) on your system (field 3 of `/etc/passwd`),
   numerically. Why does `-n` matter here?

## Troubleshooting

- **Numbers sort in a weird order (`1, 10, 2, 20, 3`)** — you used alphabetical
  sort. *Fix:* `sort -n`.
- **`uniq` left duplicates behind** — they weren't adjacent. *Fix:* `sort` first:
  `sort | uniq` (or `sort -u`).
- **`cut` returns the whole line / wrong field** — wrong delimiter. *Fix:* set `-d`
  to the actual separator (`:` for passwd, `,` for CSV). For space-aligned data,
  switch to `awk`.
- **`tr` "ignores" my file argument** — `tr` reads **stdin only**. *Fix:* pipe or
  redirect: `tr ... < file` or `cat file | tr ...`.
- **Counts look doubled / odd whitespace** — inconsistent spacing. *Fix:* normalise
  first with `tr -s ' '` or use `awk`.

Reproduce the uniq pitfall: `printf 'a\nb\na\n' | uniq` prints all three lines
(no adjacent dupes), but `printf 'a\nb\na\n' | sort | uniq` prints just `a` and `b`.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Run the practical items.

1. What does `cut -d: -f1 /etc/passwd` print?
2. What's the difference between `sort` and `sort -n`?
3. Why must you usually `sort` before `uniq`?
4. What does `uniq -c` add to its output?
5. Write the general pipeline shape for "rank values by frequency."
6. What does `tr 'a-z' 'A-Z'` do? What does `tr -d` do?
7. Why does `tr` need a pipe or `<` rather than a filename?
8. When should you prefer `awk` over `cut`?
9. **Practical:** list each login shell with its count, most common first.
   Command?
10. **Practical:** from a file of repeated words, output the unique words
    alphabetically. Command?

## Solutions & validation

1. The **first colon-separated field** of every line — the **usernames**.
2. `sort` orders **alphabetically** (so "10" < "9"); `sort -n` orders
   **numerically** (so 9 < 10).
3. `uniq` only removes **adjacent** duplicates; sorting brings identical lines
   together so all duplicates are caught.
4. A **count** of how many times each line occurred, printed before the line.
5. `... | sort | uniq -c | sort -nr` (extract → sort → count uniques → rank).
6. Uppercases letters (translates the `a-z` set to `A-Z`); `tr -d` **deletes** the
   given characters.
7. `tr` reads only **stdin**; it has no filename argument.
8. When columns are separated by **multiple/variable spaces** (e.g. `ls -l`, `ps`)
   rather than a single clean delimiter.
9. **Validation:** `cut -d: -f7 /etc/passwd | sort | uniq -c | sort -nr` lists
   shells with counts, highest first.
10. **Validation:** `sort -u file` (or `sort file | uniq`) prints each word once,
    in order.

> [!TIP]
> The extract → sort → uniq -c → sort -nr pattern is one of the highest-value
> one-liners in operations and security. Keep it in your back pocket; you'll use it
> on logs, configs and command output for the rest of your career.

## What's next

Next: **Lesson 110 — sed & awk Essentials.** `cut` and friends handle clean
columns; `sed` and `awk` handle everything else. You'll learn `sed` for
find-and-replace and line editing in streams, and just enough `awk` to pick fields
from messy, space-aligned data and do quick calculations — the two tools that round
out your text-processing toolkit.
