---
title: "Linux Administration — CPU & Memory Analysis"
slug: "linux-admin-cpu-and-memory-analysis"
track: "linux-administration"
trackName: "Linux System Administration"
module: "Performance & Tuning"
order: 213
level: "Advanced"
difficulty: "Advanced"
distribution: "General Linux"
category: "Linux Administration"
tags: [linux, performance, cpu, memory, oom, vmstat, pidstat, advanced]
cover: "/covers/curriculum/linux-administration.svg"
estMinutes: 60
status: "published"
summary: "Pinpoint CPU and memory problems precisely. Find the process and thread burning CPU with top, pidstat and mpstat; read free correctly (cache is not 'used'); diagnose swap thrashing and the OOM killer; and tell a real memory leak from healthy caching."
seoTitle: "Linux Administration 13: CPU & Memory Analysis (free, OOM, pidstat)"
seoDescription: "Advanced Linux: find CPU hogs with pidstat/top/mpstat, read free correctly (buff/cache vs used), diagnose swap thrashing and the OOM killer, and spot memory leaks. Lab + assessment."
---

CPU and memory are the two bottlenecks you'll meet most. This **Advanced** lesson
makes you precise with both: not just "CPU is high" but *which process, which
thread, user or system time*; not just "memory is full" but *is that real usage or
healthy cache, is it swapping, did the OOM killer strike*. Reading `free` correctly
alone will save you from the most common false alarm in Linux operations — panicking
that "RAM is full" when the kernel is simply using free memory as cache.

## Learning objectives

By the end of this lesson you will be able to:

- Localize CPU usage to a **process and thread**, split **user vs system** time.
- Read **`free`** correctly: `used` vs `buff/cache` vs `available`.
- Detect **swap thrashing** and read `vmstat` memory columns.
- Understand and investigate the **OOM killer**.
- Distinguish a **memory leak** from normal cache growth.

## Part 1 — Finding the CPU culprit

Start broad, then narrow:

```bash
top                         # press P (sort by CPU), 1 (per-core), then watch
htop                        # friendlier; F6 to sort, tree view with t
mpstat -P ALL 1 3           # per-CPU: is ONE core hot (single-threaded) or all?
pidstat 1 3                 # per-process CPU over intervals (better than top snapshot)
pidstat -t -p <PID> 1 3     # per-THREAD breakdown of one process
ps -eo pid,ppid,pcpu,pmem,comm --sort=-pcpu | head
```

Two distinctions that guide the fix:

- **One core at 100% vs all cores busy.** A single hot core means a
  **single-threaded** hotspot (the app can't use more cores — scaling out or
  optimizing the hot path helps, not adding CPUs). All cores busy means genuine CPU
  demand.
- **User vs system (`%usr` vs `%sys`) time.** High **user** = the application's own
  code. High **system** = kernel work (syscalls, context switches, interrupts) —
  often excessive I/O, too many small syscalls, or network packet handling.

```bash
vmstat 1 5                  # 'us' (user), 'sy' (system), 'id' (idle), 'wa' (io wait)
mpstat -P ALL 1 3           # %usr, %sys, %iowait, %idle per core
```

> [!TIP]
> `top` is a snapshot that can mislead on bursty workloads; **`pidstat 1 N`**
> averages over real intervals and attributes CPU per process reliably — it's the
> better tool for "which process is actually using the CPU over time." Use `pidstat
> -t` to go down to threads when one process dominates but you need to know *where*
> inside it.

## Part 2 — Reading `free` correctly (the big one)

```bash
free -h
#               total        used        free      shared  buff/cache   available
# Mem:           15Gi       3.2Gi       0.4Gi       0.2Gi        11Gi        11Gi
# Swap:         2.0Gi          0B       2.0Gi
```

The columns that matter:

- **used** — memory actually in use by processes.
- **buff/cache** — memory the kernel uses for **disk caching**. This is **good** —
  it speeds up I/O and is **instantly reclaimable** when a process needs RAM.
- **available** — the realistic "how much can a new process get" figure, **the one
  to watch**. It already accounts for reclaimable cache.

> [!IMPORTANT]
> **A near-zero `free` value is normal and healthy** — Linux deliberately uses
> spare RAM as disk cache ("free memory is wasted memory"). Don't panic at low
> `free`; look at **`available`**. You're only memory-constrained when `available`
> is low **and** the system is **swapping**. The classic false alarm — "we're out
> of memory, add more!" — comes from reading `free` instead of `available`.

## Part 3 — Swapping and the vmstat memory columns

Swap is a pressure valve (Lesson 204). A little idle swap usage is fine; **active,
continuous swapping ("thrashing") is the problem** — it means the working set
exceeds RAM and the system is paging to slow disk constantly.

```bash
vmstat 1 5
#  r  b   swpd   free   buff  cache   si   so    bi    bo ...
```

Watch **`si`** (swap-in) and **`so`** (swap-out): sustained non-zero values mean
active swapping. Combined with high `wa` (I/O wait) and a sluggish system, that's
memory pressure, not a disk problem per se.

```bash
free -h                     # is 'available' low and 'Swap used' rising?
vmstat 1                    # si/so consistently > 0 => thrashing
```

## Part 4 — The OOM killer

When memory (RAM + swap) is truly exhausted, the kernel's **Out-Of-Memory killer**
picks a process and kills it to save the system. The victim "just disappears,"
which is baffling until you know to look:

```bash
dmesg | grep -i -E 'killed process|out of memory|oom'
journalctl -k | grep -i oom
# Example: "Out of memory: Killed process 2345 (java) total-vm:..., anon-rss:..."
```

The OOM killer scores processes (the `oom_score`); you can bias it per process
(`/proc/<pid>/oom_score_adj`), but the real fixes are: **add RAM, fix the leak, cap
the process** (systemd `MemoryMax=`/cgroups), or **reduce the workload**.

> [!IMPORTANT]
> "The service mysteriously restarted / vanished overnight" is frequently the **OOM
> killer**. Always check `dmesg`/`journalctl -k` for OOM lines after an unexplained
> process death. A single memory-hungry job can get an **important** service killed
> instead of itself, which is why capping memory per service (cgroups) on shared
> boxes matters.

## Part 5 — Leak vs healthy cache

Memory **growing over time** isn't automatically a leak:

- **Healthy cache growth**: `buff/cache` rises, `available` stays reasonable, no
  swapping — the kernel is just caching files. Reclaimed automatically under
  pressure.
- **A real leak**: a *specific process's* RSS (`pidstat -r`, `ps -o rss`, or `top`
  `RES`) climbs steadily and never drops, eventually forcing swap/OOM.

```bash
pidstat -r 1 5                          # per-process memory (RSS) over time
ps -eo pid,rss,comm --sort=-rss | head  # top RSS consumers right now
# Watch a suspect over minutes; a leak's RSS only goes up.
```

Confirm a leak by trending a single process's RSS over time; restart it as a
stopgap, and fix the application (the leak is almost always in the app, not the
kernel).

## Hands-on lab

```bash
sudo apt install -y sysstat procps

# 1. CPU: create a single-threaded hot core and localize it
yes > /dev/null &
mpstat -P ALL 1 3                  # one core ~100% usr
pidstat 1 3 | sort -k8 -nr | head  # 'yes' is the culprit
kill %1; pkill yes

# 2. user vs system time: generate syscall-heavy load
( for i in $(seq 1 200000); do true; done ) &   # cheap; or: dd if=/dev/zero of=/dev/null
vmstat 1 3                          # observe us vs sy
wait 2>/dev/null

# 3. Read memory correctly
free -h                             # note 'available' vs 'free' vs 'buff/cache'
vmstat 1 3                          # si/so should be ~0 on a healthy box

# 4. Inspect for past OOM events (likely none on a lab box — that's fine)
dmesg | grep -i oom || echo "no OOM events recorded"

# 5. Top memory consumers
ps -eo pid,rss,pmem,comm --sort=-rss | head
pidstat -r 1 3 | head
```

## Exercises

1. Use `pidstat 1 3` to find the top CPU process on your system and state whether
   the load is on one core or spread across cores (use `mpstat -P ALL`).
2. From `free -h`, identify `used`, `buff/cache`, and `available`, and explain in
   one sentence why a low `free` value can still be healthy.
3. Run `vmstat 1 5` and confirm whether the system is swapping (which columns did
   you read?).
4. Search the kernel log for any OOM-killer events and explain what the OOM killer
   does and when it fires.
5. Describe how you'd distinguish a memory leak in a specific service from normal
   disk-cache growth, with the exact command you'd watch.

## Troubleshooting

- **"RAM is full!" panic** — you read `free`, not `available`, and the cache is
  doing its job. *Fix:* check **`available`**; only worry if it's low **and**
  swapping.
- **One core pegged, others idle** — a single-threaded hotspot. *Fix:* the app
  can't use more cores; optimize the hot path or scale out — don't add CPUs.
- **High `%sys` time** — excessive syscalls/context switches/interrupts. *Fix:*
  look at I/O patterns, network packet rates, and busy-loops; `pidstat -w` for
  context switches.
- **Service vanished overnight** — likely OOM-killed. *Fix:* `dmesg | grep -i oom`;
  add RAM, fix the leak, or cap memory (`MemoryMax=` / cgroups).
- **Memory grows forever** — confirm it's one process's RSS (`pidstat -r`), not
  cache. A persistently rising RSS = leak; restart as stopgap, fix the app.

Reproduce the cache misconception: note `free -h` shows little `free` but lots of
`available`; copy a large file (`cat bigfile > /dev/null`) and watch `buff/cache`
grow with no harm — proving cache ≠ shortage.

## Assessment

**Passing requirement: at least 9 of 11 correct (≈82%).** Run the practical items.

1. Which tool best attributes CPU to a process over time, and why over `top`?
2. What does one core at 100% (others idle) tell you about the workload?
3. What's the difference between high `%usr` and high `%sys` CPU time?
4. In `free`, what are `used`, `buff/cache`, and `available`?
5. Why can a near-zero `free` value be perfectly healthy?
6. Which `vmstat` columns indicate active swapping?
7. What does the OOM killer do, and where do you find evidence of it?
8. How do you distinguish a memory leak from healthy cache growth?
9. Name two real fixes for repeated OOM kills.
10. **Practical:** show your top memory consumers by RSS. Command?
11. **Practical:** prove a CPU load is one specific process. Commands?

## Solutions & validation

1. **`pidstat 1 N`** — it averages over real intervals and attributes per process,
   vs `top`'s misleading single snapshot on bursty loads.
2. The hotspot is **single-threaded**; it can't use more cores, so adding CPUs
   won't help — optimize or scale out.
3. **`%usr`** is the application's own code; **`%sys`** is kernel work (syscalls,
   context switches, interrupts), often from heavy I/O or networking.
4. `used` = process memory in use; `buff/cache` = reclaimable disk cache;
   `available` = realistic free memory for new work (accounts for reclaimable
   cache).
5. Linux uses spare RAM as **disk cache** that's instantly reclaimable, so low
   `free` with healthy `available` and no swapping is fine.
6. **`si`** (swap-in) and **`so`** (swap-out) — sustained non-zero = thrashing.
7. It **kills a process** to relieve true memory exhaustion; evidence in `dmesg` /
   `journalctl -k` (OOM lines).
8. A **leak** shows a single process's **RSS** rising steadily and never dropping
   (`pidstat -r`/`ps -o rss`); cache growth is in `buff/cache` and is reclaimable.
9. Any two: **add RAM**, **fix the application leak**, **cap memory per service**
   (`MemoryMax=`/cgroups), **reduce workload**, adjust `oom_score_adj` to protect
   key services.
10. **Validation:** `ps -eo pid,rss,comm --sort=-rss | head` (or `pidstat -r`).
11. **Validation:** `yes >/dev/null &` then `pidstat 1 3` / `mpstat -P ALL` shows
    the process and the hot core.

> [!TIP]
> Two reflexes worth keeping: read **`available`** (not `free`) for memory, and use
> **`pidstat`** (not a single `top` glance) for CPU attribution. They prevent the
> two most common misdiagnoses in the whole performance domain.

## What's next

Next: **Lesson 214 — Disk & I/O Performance.** When the bottleneck is storage, CPU
and memory tools won't show it. You'll measure per-disk utilization, latency and
throughput with `iostat`, find which process is doing the I/O with `iotop`/`pidstat
-d`, and tell a latency problem from a throughput problem — the difference that
decides the fix.
