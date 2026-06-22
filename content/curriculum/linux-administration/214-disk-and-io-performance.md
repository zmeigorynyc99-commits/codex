---
title: "Linux Administration — Disk & I/O Performance"
slug: "linux-admin-disk-and-io-performance"
track: "linux-administration"
trackName: "Linux System Administration"
module: "Performance & Tuning"
order: 214
level: "Advanced"
difficulty: "Advanced"
distribution: "General Linux"
category: "Linux Administration"
tags: [linux, performance, disk, io, iostat, iotop, latency, advanced]
cover: "/covers/curriculum/linux-administration.svg"
estMinutes: 60
status: "published"
summary: "Diagnose the bottleneck that CPU and memory tools can't see. Measure per-disk utilization, latency and throughput with iostat, find which process is doing the I/O with iotop and pidstat -d, and tell a latency problem from a throughput problem — the distinction that decides the fix."
seoTitle: "Linux Administration 14: Disk & I/O Performance (iostat, iotop)"
seoDescription: "Advanced Linux: read iostat (%util, await, aqu-sz), find I/O-heavy processes with iotop/pidstat -d, and separate latency from throughput problems. Hands-on lab + assessment."
---

When a server is slow because of **storage**, the CPU and memory tools look almost
fine — and people waste hours on the wrong resource. This **Advanced** lesson makes
disk I/O visible: per-device **utilization, latency and throughput** with `iostat`,
finding the **process** responsible with `iotop`/`pidstat -d`, and the crucial
distinction between a **latency** problem (each I/O is slow) and a **throughput**
problem (too much I/O) — because they have different fixes. Storage is the silent
bottleneck of databases, backups and busy web servers.

## Learning objectives

By the end of this lesson you will be able to:

- Read **`iostat -x`** — `%util`, `await`, `aqu-sz`, r/s, w/s, throughput.
- Spot I/O **saturation** and high **latency**.
- Find the **process** causing I/O with `iotop` and `pidstat -d`.
- Distinguish **latency-bound** from **throughput-bound** problems.
- Recognize when storage (not CPU/RAM) is the constraint.

## Part 1 — iostat: the per-disk truth

Install `sysstat`, then watch real intervals (ignore the first sample — it's since
boot):

```bash
sudo apt install -y sysstat
iostat -xz 1 5          # -x extended stats, -z hide idle devices, 1s intervals
```

The columns that matter, per device:

| Column | Meaning |
|--------|---------|
| `r/s`, `w/s` | read / write **operations** per second (IOPS) |
| `rkB/s`, `wkB/s` | read / write **throughput** (bandwidth) |
| `r_await`, `w_await`, `await` | **average latency** per I/O in **milliseconds** |
| `aqu-sz` | average **queue depth** (saturation) |
| `%util` | fraction of time the device was busy |

Rules of thumb:

- **`%util` near 100** → the device is **saturated** (busy almost all the time).
  On a single spinning disk that's a real ceiling; on SSDs/RAID/NVMe `%util` is less
  meaningful (they handle parallel I/O), so lean on **`await`** and **`aqu-sz`**.
- **High `await`** (e.g. tens of ms on SSD, or >20–30 ms sustained) → each I/O is
  **slow** — a **latency** problem.
- **High `aqu-sz`** with high throughput → lots of I/O **queuing** — a **throughput/
  saturation** problem.

> [!IMPORTANT]
> On SSDs and cloud volumes, **`%util` can read 100% while the disk has plenty of
> headroom**, because it measures "time at least one I/O was in flight," not true
> capacity. Trust **`await` (latency)** and **`aqu-sz` (queue depth)** there. Many
> false "disk is maxed" conclusions come from reading `%util` on devices that do
> parallel I/O.

## Part 2 — Latency vs throughput (the deciding distinction)

Two very different problems, two different fixes:

- **Latency-bound**: each individual I/O takes a long time (`await` high), even at
  modest IOPS/throughput. Causes: slow media, a failing disk, a noisy neighbor on
  cloud storage, fsync-heavy workloads, network storage round-trips. Fixes: faster/
  closer storage, reduce sync frequency, fix the disk, change the access pattern.
- **Throughput-bound**: the device is moving as much data/IOPS as it can (`aqu-sz`
  high, throughput at the device's ceiling). Causes: genuinely too much I/O — a
  backup, a full-table scan, log spam, a runaway job. Fixes: reduce/throttle the
  I/O, add capacity/IOPS, cache, batch, or schedule heavy jobs off-peak.

```bash
# Latency signal:   high await, modest r/s+w/s
# Throughput signal: high aqu-sz, r/s+w/s or kB/s at the device's limit
iostat -xz 1
```

Pair this with the system view: high **`%iowait`** in `top`/`vmstat` (`wa`) and a
load average inflated by `D`-state (uninterruptible) processes both point at I/O —
exactly the "high load, idle CPU" case from Lesson 212.

## Part 3 — Which process is doing the I/O?

`iostat` tells you *which device*; now find *which process*:

```bash
sudo iotop -o                 # live per-process I/O; -o = only show active I/O
sudo iotop -aoP               # accumulated, only active, processes (not threads)
pidstat -d 1 5                # per-process disk read/write KB/s over intervals
sudo apt install -y iotop     # if missing
```

For a stuck system, find processes in **uninterruptible sleep** (`D` state) — they're
blocked on I/O:

```bash
ps -eo pid,stat,comm,wchan | awk '$2 ~ /D/'   # D-state = waiting on I/O
```

> [!TIP]
> `pidstat -d` is scriptable and doesn't need a TTY like `iotop`, making it ideal
> for capturing "who's hammering the disk" during an incident or in a cron-driven
> snapshot. `iotop` is the friendlier live view. Use `iotop -o` so idle processes
> don't clutter the screen.

## Part 4 — Common I/O culprits and quick wins

Frequent real-world causes and first moves:

- **A backup/rsync/`dd` job** saturating the disk at the wrong time → schedule
  off-peak, `ionice -c3` (idle I/O class), or throttle (`rsync --bwlimit`).
- **Database doing full scans / missing indexes** → an app/query fix, not a Linux
  one; `iostat` just reveals it.
- **Log spam / debug logging** filling and churning the disk → reduce log level,
  fix logrotate (Lesson 210).
- **Swapping** masquerading as disk load → it's really a **memory** problem
  (Lesson 213); fix RAM, not the disk.
- **A dying disk** → rising `await` + I/O errors in `dmesg`; replace it.

```bash
ionice -c3 -p <PID>          # demote a job to idle I/O priority
dmesg | grep -iE 'i/o error|ata|nvme'   # hardware I/O errors
```

> [!IMPORTANT]
> Confirm storage is the bottleneck **before** "fixing" it. A server that's slow
> from swapping shows disk activity but the cure is **RAM**; a server slow from a
> single CPU-bound query shows little I/O. The method from Lesson 212 (walk the USE
> table) keeps you from upgrading disks that were never the problem.

## Hands-on lab

```bash
sudo apt install -y sysstat iotop

# 1. Baseline: what do idle disks look like?
iostat -xz 1 3                       # note await and %util near zero when idle
lsblk                                # remember which device is which (Lesson 201)

# 2. Generate write I/O and watch the signals (use a scratch file; clean up)
( dd if=/dev/zero of=/tmp/io-lab.bin bs=1M count=2048 oflag=direct 2>/dev/null & )
iostat -xz 1 4                       # watch w/s, wkB/s, await, aqu-sz, %util climb
sudo iotop -o -b -n 3 2>/dev/null | head -20   # batch iotop: dd is the writer
pidstat -d 1 3                       # dd's write KB/s
wait 2>/dev/null; rm -f /tmp/io-lab.bin

# 3. Correlate with the system view
vmstat 1 3                           # 'wa' (io wait) and 'b' (blocked) rise under I/O

# 4. Find D-state (I/O-blocked) processes, if any
ps -eo pid,stat,comm | awk '$2 ~ /D/' || echo "(none right now)"

# 5. Errors check
dmesg | grep -iE 'i/o error|nvme|ata' || echo "no disk errors logged"
```

## Exercises

1. Run `iostat -xz 1 5` on an idle box and record a baseline for `await`, `aqu-sz`
   and `%util` per device.
2. Generate write load with `dd` to a scratch file and identify, with two different
   tools, which process is responsible. Clean up the file.
3. From a given `iostat` line, decide whether the problem is latency-bound or
   throughput-bound, and justify it from the columns.
4. Explain why `%util` near 100% on an NVMe/cloud volume may not mean "saturated,"
   and which columns you'd trust instead.
5. Describe two common I/O culprits and a concrete first action for each.

## Troubleshooting

- **High load, idle CPU** — I/O-bound (D-state processes). *Fix:* `iostat -x` for
  the busy device, `iotop`/`pidstat -d` for the process; check `await`.
- **`%util` 100% but storage "should be fast"** — SSD/cloud parallel I/O. *Fix:*
  judge by `await` and `aqu-sz`, not `%util`.
- **Disk slow only at certain times** — a scheduled job (backup/cron). *Fix:*
  correlate with `cron`/timers; reschedule, `ionice`, or throttle.
- **Rising `await` + errors in dmesg** — failing disk. *Fix:* check SMART, replace;
  ensure backups/RAID.
- **"Disk" load that's actually swapping** — `vmstat si/so > 0`. *Fix:* it's a
  **memory** problem (Lesson 213); add RAM/fix the leak.

Reproduce latency-vs-throughput intuition: `dd ... oflag=direct` pushes throughput
(watch `wkB/s`/`aqu-sz`); an fsync-heavy workload (many tiny synced writes) pushes
`await` instead — same disk, different signature, different fix.

## Assessment

**Passing requirement: at least 9 of 11 correct (≈82%).** Run the practical items.

1. Which command shows per-device latency, queue depth and utilization?
2. What do `await` and `aqu-sz` represent?
3. Why is `%util` unreliable on SSDs/cloud volumes, and what do you use instead?
4. Define latency-bound vs throughput-bound and give a signal for each.
5. Which two tools find the **process** doing I/O?
6. What does a `D` process state mean?
7. How does an I/O bottleneck show up at the system level (load/CPU)?
8. Give a first action for a backup job saturating the disk.
9. Why must you confirm I/O is the bottleneck before upgrading storage?
10. **Practical:** generate write I/O and name the writing process via two tools.
11. **Practical:** from `iostat`, state whether a device is latency- or
    throughput-bound for a sample you capture.

## Solutions & validation

1. `iostat -x` (e.g. `iostat -xz 1`).
2. `await` = average **latency per I/O** (ms); `aqu-sz` = average **queue depth**
   (saturation).
3. SSD/cloud devices do **parallel I/O**, so `%util` (time ≥1 I/O in flight) can be
   100% with headroom; trust **`await`** and **`aqu-sz`**.
4. **Latency-bound** = each I/O slow (high `await`, modest IOPS); **throughput-
   bound** = device at its data/IOPS ceiling (high `aqu-sz`, high kB/s).
5. **`iotop`** and **`pidstat -d`**.
6. **Uninterruptible sleep** — the process is blocked waiting on I/O.
7. **High `%iowait`/`wa`** and a **load average inflated by D-state** processes with
   otherwise idle CPU.
8. Reschedule off-peak, **`ionice -c3`**, or throttle (e.g. `rsync --bwlimit`).
9. Because swapping or a CPU-bound query can *look* like disk load; upgrading
   storage that wasn't the bottleneck wastes money and fixes nothing.
10. **Validation:** `dd ... of=/tmp/io-lab.bin` then `iotop -o`/`pidstat -d` show
    `dd` as the writer.
11. **Validation:** high `await` + modest r/s/w/s ⇒ latency-bound; high `aqu-sz` +
    throughput at ceiling ⇒ throughput-bound.

> [!TIP]
> "iostat for the device, iotop/pidstat -d for the process, await vs aqu-sz for the
> kind of problem." That trio turns invisible storage bottlenecks into a precise,
> defensible diagnosis — and stops you upgrading the wrong thing.

## What's next

Next: **Lesson 215 — Kernel Tuning: sysctl & Limits.** With diagnosis mastered, you
turn to safe tuning: kernel parameters via `sysctl` and `/etc/sysctl.d`, per-process
and system **ulimits** (open files, processes), and systemd resource limits — the
knobs that fix "too many open files," connection ceilings, and resource exhaustion,
and complete the Linux Administration track.
