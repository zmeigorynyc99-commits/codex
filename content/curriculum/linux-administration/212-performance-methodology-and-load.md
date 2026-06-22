---
title: "Linux Administration — Performance Methodology & Load"
slug: "linux-admin-performance-methodology-and-load"
track: "linux-administration"
trackName: "Linux System Administration"
module: "Performance & Tuning"
order: 212
level: "Advanced"
difficulty: "Advanced"
distribution: "General Linux"
category: "Linux Administration"
tags: [linux, performance, load-average, use-method, troubleshooting, advanced]
cover: "/covers/curriculum/linux-administration.svg"
estMinutes: 60
status: "published"
summary: "Turn 'the server feels slow' into a precise diagnosis. Read load average correctly (it is not CPU %), apply a repeatable performance method (the USE method and a 60-second triage), and identify which resource — CPU, memory, disk or network — is the real bottleneck before you touch anything."
seoTitle: "Linux Administration 12: Performance Method, Load Average & USE"
seoDescription: "Advanced Linux: what load average really means, a 60-second performance triage, and the USE method to find the bottleneck across CPU, memory, disk and network. Lab + assessment."
---

"The server is slow" is the vaguest, most common ticket you'll ever get — and the
engineers who fix it fast don't guess, they **measure with a method**. This
**Advanced** lesson gives you that method: how to read **load average** correctly
(it confuses almost everyone), a **60-second triage** that narrows any slowdown to
a resource, and the **USE method** for systematic analysis. The next three lessons
drill into CPU/memory, disk I/O, and tuning; this one teaches you where to *start*
so you don't waste an hour on the wrong resource.

## Learning objectives

By the end of this lesson you will be able to:

- Interpret **load average** correctly (and why it isn't "CPU percent").
- Run a fast, repeatable **60-second performance triage**.
- Apply the **USE method** (Utilization, Saturation, Errors) to find bottlenecks.
- Decide **which resource** (CPU, memory, disk, network) is the constraint.
- Avoid the classic mistakes of premature or misdirected tuning.

## Part 1 — Load average, correctly

`uptime` and the top line of `top` show three load-average numbers:

```bash
uptime
# 11:00:00 up 10 days, 3:42, 2 users, load average: 4.10, 2.30, 1.05
```

The three numbers are the average number of processes **wanting to run** over the
last **1, 5 and 15 minutes**. "Wanting to run" includes processes **running on a
CPU** *and* processes **waiting** for a CPU — and, on Linux specifically, processes
in **uninterruptible sleep** (usually waiting on disk I/O). So load average is a
measure of **demand**, not utilization.

Interpret it **relative to your CPU count**:

```bash
nproc                       # number of logical CPUs, e.g. 4
```

- Load ≈ `nproc` → the machine is **fully busy** but not necessarily overloaded.
- Load **well above** `nproc` → processes are **queuing**; things feel slow.
- Compare the three numbers for **trend**: `4.10, 2.30, 1.05` means load is
  **rising** (recent > older); `1.05, 2.30, 4.10` means it's **falling**.

> [!IMPORTANT]
> **Load average is not CPU percentage.** A load of 8 on an 8-core box can be 100%
> CPU-bound *or* mostly processes stuck waiting on a slow disk (uninterruptible
> sleep inflates load with near-zero CPU use). Always pair load with *what* the
> processes are doing — a high load with idle CPUs points at **I/O or locking**,
> not a CPU shortage. This single misunderstanding sends people tuning the wrong
> thing constantly.

## Part 2 — The 60-second triage

Before deep-diving, run a quick sweep to form a hypothesis. A practical sequence
(install `sysstat` for `vmstat`/`mpstat`/`iostat`, `procps` for the rest):

```bash
uptime                      # 1. load + trend
dmesg | tail               # 2. recent kernel errors (OOM kills, disk errors)
vmstat 1 5                  # 3. CPU/run-queue/swap/IO over 5 seconds
free -h                     # 4. memory + swap pressure
mpstat -P ALL 1 3           # 5. per-CPU usage (one hot core? all busy?)
pidstat 1 3                 # 6. per-process CPU over time
iostat -xz 1 3              # 7. per-disk utilization & latency
ss -s                       # 8. socket summary (connection storms)
top                         # 9. the live overview, sorted by CPU/mem
```

Read it as a funnel: load tells you *how bad*, `dmesg` flags hard errors, `vmstat`
splits CPU vs I/O vs swap, `free` rules in/out memory, then `mpstat`/`pidstat`/
`iostat` localize it to a CPU, a process, or a disk. In a minute you usually know
the **resource** and often the **process**.

> [!TIP]
> Memorize the funnel, not every flag. The goal of the 60-second sweep is a
> **hypothesis** ("it's disk I/O on this volume" / "one process is pegging a
> core"), which you then confirm with the focused tools in the next lessons. Acting
> without this step is how people restart the wrong service at 3 a.m.

## Part 3 — The USE method

For each **resource**, check three things — **U**tilization, **S**aturation,
**E**rrors:

| Resource | Utilization | Saturation | Errors |
|----------|-------------|------------|--------|
| **CPU** | % busy (`mpstat`, `top`) | run-queue length / load > cores (`vmstat r`) | (rare) |
| **Memory** | used vs total (`free`) | swapping / OOM kills (`vmstat si/so`, `dmesg`) | OOM, ECC |
| **Disk** | %util (`iostat -x`) | I/O wait, queue depth (`iostat aqu-sz`, `vmstat b`) | I/O errors (`dmesg`) |
| **Network** | bandwidth (`sar -n DEV`) | drops/retransmits (`ss -s`, `nstat`) | errors/drops (`ip -s link`) |

The discipline: **walk every resource** rather than fixating on the first thing you
see. Utilization says "how busy," saturation says "is work queuing/being denied"
(the real pain signal), and errors catch faults that masquerade as slowness. A
resource with high **saturation** is almost always your bottleneck.

## Part 4 — Which resource is it?

Quick decision rules from the triage:

- **High load + high CPU% (user/sys), low I/O wait** → **CPU-bound**. Find the
  process (`pidstat`, `top`), then the code/config (Lesson 213).
- **High load + high I/O wait (`vmstat wa`, `iostat %util` near 100)** →
  **disk-bound**. Find the busy device and the process doing I/O (Lesson 214).
- **Swapping (`vmstat si/so` > 0, `free` shows swap growing) or OOM kills in
  `dmesg`** → **memory-bound**. Find the memory hog or a leak (Lesson 213).
- **Drops/retransmits/conn storms (`ss -s`, `ip -s link`)** → **network-bound**
  (or an app connection problem) — back to the networking lessons.

> [!IMPORTANT]
> Fix the **bottleneck**, not the symptom. Adding CPU to a disk-bound server does
> nothing; raising file-descriptor limits won't help a CPU-pegged service. The
> whole point of the method is to spend your effort on the one resource that's
> actually saturated. Re-measure after a change to confirm you moved the needle —
> performance work without before/after numbers is guesswork.

## Hands-on lab

```bash
sudo apt install -y sysstat procps      # vmstat, mpstat, pidstat, iostat, sar

# 1. Read load against CPU count and trend
uptime; nproc

# 2. The 60-second funnel (run on an idle box first to learn the baseline)
vmstat 1 5
free -h
mpstat -P ALL 1 3
iostat -xz 1 3
ss -s

# 3. Create a CPU bottleneck and watch the signals change
( yes > /dev/null & yes > /dev/null & )    # two CPU burners
uptime                                      # load climbs
mpstat -P ALL 1 3                           # cores near 100% user
pidstat 1 3 | sort -k8 -nr | head           # 'yes' tops CPU
kill %1 %2 2>/dev/null; pkill yes           # stop the burners

# 4. Create memory pressure (small, safe) and observe swap signals
free -h
vmstat 1 3                                   # watch si/so columns

# 5. Errors check
dmesg | tail
```

## Exercises

1. On your box, report `nproc` and the 1/5/15 load averages, and state whether load
   is rising or falling and whether the machine is over its CPU count.
2. Run the 60-second triage on an idle system and write down a **baseline** for
   each tool (what "normal" looks like) — you can't spot abnormal without it.
3. Generate a CPU load with `yes`, then use `mpstat` and `pidstat` to prove it's
   CPU-bound and identify the offending process. Clean up.
4. For each resource (CPU, memory, disk, network), name one command that shows its
   **saturation** signal.
5. Given "load average 16 on a 4-CPU box but `top` shows CPUs ~10% busy," explain
   the most likely cause and which tool you'd check next.

## Troubleshooting

- **High load but CPUs look idle** — processes in **uninterruptible sleep** (disk/
  NFS/lock). *Fix:* check `vmstat` `wa`/`b`, `iostat -x %util`, and `ps -eo
  state,cmd | grep '^D'` for the stuck processes.
- **`top` CPU% looks fine but app is slow** — bottleneck elsewhere (I/O, memory,
  network, locks). *Fix:* walk the USE table; don't stop at CPU.
- **Tuned something, no improvement** — wrong resource, or no baseline to compare.
  *Fix:* identify the **saturated** resource first; measure before/after.
- **`vmstat`/`iostat` not found** — install `sysstat`.
- **Numbers spike then settle** — you read the **first** sample (since boot).
  *Fix:* ignore the first line of `vmstat`/`iostat`; use subsequent intervals.

Reproduce the load-vs-CPU lesson: start `yes` burners (CPU-bound, load≈CPU%), then
imagine a `dd`-to-disk load (I/O-bound, high load with idle CPU) — the same load
number, two completely different fixes.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Run the practical items.

1. What does load average actually measure, over what time windows?
2. Why is load average not the same as CPU utilization?
3. How do you interpret load relative to the number of CPUs?
4. List the USE method's three checks and what each tells you.
5. Which USE signal most reliably indicates the bottleneck, and why?
6. Give the resource diagnosis for: high load + high I/O wait.
7. Give the resource diagnosis for: swapping + OOM kills in dmesg.
8. Why must you re-measure after a tuning change?
9. **Practical:** show your load and CPU count, and state if the box is overloaded.
10. **Practical:** create a CPU load and prove which process is responsible.

## Solutions & validation

1. The **average number of processes wanting to run** (running + waiting for CPU,
   plus uninterruptible-sleep on Linux) over **1, 5, and 15 minutes**.
2. It counts **demand** including processes **waiting** (notably on disk I/O), so
   high load can occur with idle CPUs; CPU% measures actual processor busy time.
3. Compare to `nproc`: ≈ cores = fully busy; **well above** cores = queuing/
   overloaded; below = spare capacity. Trend via the 1/5/15 ordering.
4. **Utilization** (how busy), **Saturation** (is work queuing/denied),
   **Errors** (faults). Saturation is the pain signal.
5. **Saturation** — it directly indicates work is **queuing or being refused**,
   which is what users feel as slowness.
6. **Disk-bound** (I/O is the bottleneck).
7. **Memory-bound** (out of RAM; investigate the hog/leak).
8. To confirm you fixed the **actual bottleneck** and didn't just move it; perf
   work needs before/after numbers.
9. **Validation:** `uptime` + `nproc`; overloaded if load ≫ nproc.
10. **Validation:** `yes >/dev/null &` (×N), then `pidstat 1 3` / `top` shows `yes`
    topping CPU; `mpstat` shows cores near 100% user.

> [!TIP]
> "Load tells you how bad; the funnel tells you which resource; USE confirms it;
> then fix the saturated one and re-measure." Internalize that loop and slow-server
> tickets become a calm, five-minute diagnosis instead of a guessing game.

## What's next

Next: **Lesson 213 — CPU & Memory Analysis.** You'll drill into the two most common
bottlenecks: finding the process and thread burning CPU (`top`, `pidstat`,
`mpstat`), and diagnosing memory pressure — caches vs real usage in `free`, swap
thrashing, and the **OOM killer** — so you can pinpoint and fix CPU and RAM problems
precisely.
