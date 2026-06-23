---
title: "Python for Automation — Files & Text Processing"
slug: "python-files-and-text-processing"
track: "python-automation"
trackName: "Python for Automation"
module: "Working with the System"
order: 404
level: "Intermediate"
difficulty: "Intermediate"
distribution: "Cross-platform"
category: "Shell & Scripting"
tags: [python, files, text, pathlib, parsing, intermediate]
cover: "/covers/curriculum/python-automation.svg"
estMinutes: 55
status: "published"
summary: "Ops scripts live on files. Read and write them the safe way with the with-statement, iterate lines memory-efficiently, parse and filter text and CSV, and handle paths cleanly with pathlib — replacing many cat/grep/sed pipelines with clear, testable Python."
seoTitle: "Python for Automation 4: Files, Text Processing & pathlib"
seoDescription: "Intermediate Python: open files with with, read/iterate lines, write safely, parse logs and CSV, and use pathlib for paths and globbing. Hands-on lab and assessment."
---

Configuration, logs, reports, data — almost every ops task touches **files**. This
lesson makes you fluent at reading, writing and parsing them in Python: the
essential **`with`** pattern that closes files automatically, memory-efficient line
iteration for big logs, simple parsing, and the modern **`pathlib`** for paths and
file discovery. Many of your one-off `grep`/`awk` pipelines become readable,
reusable Python here.

## Learning objectives

By the end of this lesson you will be able to:

- Open files safely with the **`with`** statement.
- **Read** whole files, lines, and iterate large files efficiently.
- **Write** and append files.
- **Parse and filter** text (logs, CSV) into data structures.
- Handle paths and discover files with **`pathlib`**.

## Part 1 — Reading files with `with`

```python
with open("/etc/hostname") as f:        # 'with' auto-closes the file, even on error
    content = f.read()                  # the whole file as one string
print(content.strip())

with open("data.txt") as f:
    lines = f.readlines()               # a list of lines (each keeps its \n)

# The memory-efficient, idiomatic way for big files — iterate line by line:
with open("/var/log/syslog") as f:
    for line in f:                      # reads one line at a time, low memory
        line = line.rstrip("\n")
        if "ERROR" in line:
            print(line)
```

> [!IMPORTANT]
> **Always use `with open(...) as f:`.** It guarantees the file is closed when the
> block ends — even if an exception occurs — preventing leaked file descriptors (the
> "too many open files" problem from the limits lesson). And to read a large log,
> **iterate the file object** (`for line in f`) rather than `f.read()`/`readlines()`,
> which load the entire file into memory and can OOM on multi-GB logs.

## Part 2 — Writing and appending

```python
with open("report.txt", "w") as f:      # "w" = write (TRUNCATES/overwrites!)
    f.write("Report\n")                 # write does NOT add newlines for you
    f.write("=" * 6 + "\n")
    print("generated at", "...", file=f)  # print() can write to a file too

with open("audit.log", "a") as f:       # "a" = append (adds to the end)
    f.write("event happened\n")

# Write a list of lines
rows = ["web01,up", "db01,down"]
with open("hosts.csv", "w") as f:
    f.write("\n".join(rows) + "\n")
```

File modes mirror shell redirection: **`"w"`** overwrites (like `>`), **`"a"`**
appends (like `>>`), **`"r"`** reads (default). `f.write()` writes exactly what you
give it — **you add the `\n`** yourself.

> [!IMPORTANT]
> **`"w"` overwrites the file with no warning** — just like Bash's `>`. Use **`"a"`**
> when you mean to add to a file. When generating an important file, write to a temp
> file and rename it into place (atomic write) so a crash mid-write doesn't leave a
> half-written, corrupt file.

## Part 3 — Parsing text into data

Combine file iteration with the string and dict skills from earlier lessons:

```python
# Count log levels in a file
counts = {}
with open("app.log") as f:
    for line in f:
        parts = line.split()
        if parts:
            level = parts[0]
            counts[level] = counts.get(level, 0) + 1
print(counts)

# Parse a colon-delimited file (like /etc/passwd) into dicts
users = []
with open("/etc/passwd") as f:
    for line in f:
        if line.startswith("#") or not line.strip():
            continue
        fields = line.rstrip("\n").split(":")
        users.append({"name": fields[0], "uid": int(fields[2]), "shell": fields[6]})
real = [u for u in users if u["uid"] >= 1000]
```

For real **CSV** (quoting, commas in fields), use the standard-library `csv` module
rather than naive `split(",")`:

```python
import csv
with open("hosts.csv") as f:
    for row in csv.reader(f):
        print(row)                      # row is a list of fields
    # or csv.DictReader(f) to get dicts keyed by the header row
```

## Part 4 — Paths with pathlib

`pathlib` is the modern, cross-platform way to handle paths — cleaner than string
concatenation or the old `os.path`:

```python
from pathlib import Path

p = Path("/var/log/nginx/access.log")
p.name          # 'access.log'      (basename)
p.stem          # 'access'          (name without final suffix)
p.suffix        # '.log'            (extension)
p.parent        # PosixPath('/var/log/nginx')   (dirname)
p.exists(), p.is_file(), p.is_dir()
p.stat().st_size                        # size in bytes

home = Path.home()
config = home / ".config" / "app.conf"  # join paths with / (overloaded operator)

# Read/write directly:
text = Path("/etc/hostname").read_text().strip()
Path("out.txt").write_text("hello\n")

# Discover files (glob):
for log in Path("/var/log").glob("*.log"):
    print(log, log.stat().st_size)
for py in Path(".").rglob("*.py"):       # recursive
    print(py)
```

> [!TIP]
> Prefer **`pathlib`** (`Path`) over string paths and `os.path.join`. The `/`
> operator for joining, methods like `.name`/`.parent`/`.glob()`, and one-liners like
> `Path(x).read_text()` make file code shorter and correct across Linux/Windows. It's
> the modern standard for anything path-related.

## Hands-on lab

```bash
mkdir -p ~/pyfile-lab && cd ~/pyfile-lab
python3 - <<'EOF'
from pathlib import Path

# 1. Write a file, then read it back two ways
Path("data.txt").write_text("INFO start\nERROR boom\nINFO done\nWARN slow\n")
print("--- whole file ---")
print(Path("data.txt").read_text(), end="")

print("--- line by line, filtered ---")
with open("data.txt") as f:
    for line in f:
        if "ERROR" in line:
            print("  ", line.strip())

# 2. Parse + count levels
counts = {}
with open("data.txt") as f:
    for line in f:
        lvl = line.split()[0]
        counts[lvl] = counts.get(lvl, 0) + 1
print("counts:", counts)

# 3. Append
with open("data.txt", "a") as f:
    f.write("INFO appended\n")
print("lines now:", len(Path("data.txt").read_text().splitlines()))

# 4. pathlib facts + glob
p = Path("data.txt")
print(p.name, p.stem, p.suffix, p.stat().st_size, "bytes")
print("txt files here:", [str(x) for x in Path(".").glob("*.txt")])

# 5. Parse /etc/passwd into real-user dicts
users = []
for line in Path("/etc/passwd").read_text().splitlines():
    if not line or line.startswith("#"): continue
    fld = line.split(":")
    users.append({"name": fld[0], "uid": int(fld[2])})
print("real users:", [u["name"] for u in users if u["uid"] >= 1000][:5])
EOF
cd ~ && rm -r ~/pyfile-lab
```

## Exercises

1. Write a script that reads a log file and prints only the lines containing
   "ERROR", using `with` and line iteration.
2. Count the occurrences of each log level (first word per line) into a dict and
   print it.
3. Generate a `report.txt` with a header and several lines using `"w"`, then append
   a footer with `"a"`.
4. Use `pathlib` to print the name, stem, suffix, parent and size of a given file.
5. Use `Path.glob` to list all `*.conf` files under `/etc` (top level) with their
   sizes.

## Troubleshooting

- **`FileNotFoundError`** — wrong path or relative-path assumption. *Fix:* check the
  path; use absolute paths or `Path(...).exists()` before opening; mind the working
  directory.
- **File left open / "too many open files"** — not using `with`. *Fix:* always
  `with open(...) as f:`.
- **Big log ate all the memory** — `f.read()`/`readlines()` on a huge file. *Fix:*
  iterate `for line in f:`.
- **Lost the file's contents** — opened with `"w"` (truncates). *Fix:* use `"a"` to
  append, or write-then-rename for atomic updates.
- **CSV split wrong on quoted commas** — naive `split(",")`. *Fix:* use the `csv`
  module.

Reproduce the memory point conceptually: `for line in f` processes a 10 GB log fine;
`f.read()` tries to load all 10 GB into RAM — same task, very different footprint.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Run the practical items.

1. Why use the `with` statement to open files?
2. How do you read a large file without loading it all into memory?
3. What do file modes `"r"`, `"w"`, and `"a"` do?
4. Does `f.write()` add newlines for you?
5. How do you safely generate an important file without risking a half-written file?
6. When should you use the `csv` module instead of `split(",")`?
7. Give the `pathlib` ways to get a file's name, parent, and size.
8. How do you find all `*.log` files in a directory with `pathlib`?
9. **Practical:** print only ERROR lines from a log. Code shape?
10. **Practical:** count log levels into a dict.

## Solutions & validation

1. It **auto-closes** the file (even on error), preventing leaked descriptors.
2. **Iterate** the file object: `for line in f:` (one line at a time).
3. `"r"` read (default), `"w"` overwrite/create, `"a"` append.
4. **No** — you add `\n` yourself.
5. Write to a **temp file and rename** it into place (atomic), or write fully before
   replacing the original.
6. When fields may contain quoted commas/newlines — the `csv` module parses them
   correctly.
7. `p.name`, `p.parent`, `p.stat().st_size` (`Path` from `pathlib`).
8. `Path(dir).glob("*.log")` (or `.rglob` for recursive).
9. **Validation:** `with open(path) as f: for line in f: if "ERROR" in line: print(line.strip())`.
10. **Validation:** `counts[line.split()[0]] = counts.get(line.split()[0], 0) + 1`.

> [!TIP]
> The pattern `with open(path) as f: for line in f:` plus a dict for tallying covers
> a huge share of log/config processing — safely, on files of any size. Reach for
> `pathlib` for everything path-related and your file code stays clean and portable.

## What's next

Next: **Lesson 405 — Running Commands with subprocess.** Python's superpower for ops:
calling other programs (`systemctl`, `ip`, `df`, your own scripts), capturing their
output and exit codes, handling failures, and doing it **safely** without shell-
injection — the bridge between Python logic and the system commands you already know.
