---
title: "Linux Administration — Swap, Disk Usage & 'Disk Full' Troubleshooting"
slug: "linux-admin-swap-disk-usage-troubleshooting"
track: "linux-administration"
trackName: "Linux System Administration"
module: "Storage & Filesystems Ops"
order: 204
level: "Intermediate"
difficulty: "Intermediate"
distribution: "General Linux"
category: "Linux Administration"
tags: [linux, swap, df, du, disk-full, inodes, troubleshooting, intermediate]
cover: "/covers/curriculum/linux-administration.svg"
estMinutes: 60
status: "published"
summary: "Manage memory overflow and never fear a full disk again. Configure swap (file and partition), measure usage precisely with df and du, and run the methodical 'No space left on device' playbook — including the sneaky causes that fool even experienced admins: inode exhaustion and deleted-but-still-open files."
seoTitle: "Linux Administration 4: Swap, df/du & Fixing a Full Disk"
seoDescription: "Intermediate Linux: configure swap, measure with df and du, and the full 'disk full' playbook including inode exhaustion and deleted-but-open files (lsof). Lab + assessment."
---

A full disk is one of the most common ways a Linux server falls over — and one of
the most satisfying to fix once you know the method. This lesson rounds out the
storage module with two practical skills: managing **swap** (the system's
memory-overflow space) and a complete, repeatable **playbook for "No space left on
device,"** including the sneaky causes — **inode exhaustion** and
**deleted-but-still-open files** — that leave even experienced admins staring at a
`df` that "doesn't add up."

## Learning objectives

By the end of this lesson you will be able to:

- Explain what **swap** is and check it with `free` and `swapon`.
- Add a **swap file** (and understand swap partitions) and set **swappiness**.
- Measure usage accurately with **`df`** (free space) and **`du`** (what's using it).
- Diagnose **inode exhaustion** with `df -i`.
- Find **deleted-but-open** files holding space with `lsof`.
- Run a methodical **"disk full" playbook**.

## Part 1 — Swap: memory overflow

**Swap** is disk space the kernel uses as overflow when **RAM** fills: inactive
memory pages are moved to swap to free RAM for active work. It's a safety valve, not
a substitute for RAM (disk is far slower), but running out of memory with no swap can
trigger the **OOM killer**, which abruptly kills processes.

```bash
free -h                          # memory AND swap usage, human-readable
swapon --show                    # active swap devices/files and their size
cat /proc/swaps                  # the same, raw
```

In `free -h`, the `Swap:` row shows total/used/free swap. Heavy, sustained swap use
("swapping" or "thrashing") usually means you need more RAM or have a leak — it's a
signal to investigate, which ties into the performance lessons later.

## Part 2 — Add a swap file

Modern systems often use a **swap file** (flexible, no partition needed). Creating
one is a clean, memorable sequence:

```bash
# 1. Create a 2 GB file (fallocate is fast; dd is the portable fallback)
sudo fallocate -l 2G /swapfile
# (fallback) sudo dd if=/dev/zero of=/swapfile bs=1M count=2048

# 2. Lock down permissions — swap must be root-only or swapon refuses it
sudo chmod 600 /swapfile

# 3. Format it as swap, then enable it
sudo mkswap /swapfile
sudo swapon /swapfile
swapon --show                    # confirm it's active

# 4. Make it persist across reboots (fstab — Lesson 202 habits apply)
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

> [!IMPORTANT]
> The swap file **must be `chmod 600` and owned by root** — `swapon` refuses a
> world-readable swap file because it can contain sensitive memory contents. And as
> always after editing `/etc/fstab`, sanity-check it (`sudo swapon -a` re-reads swap
> entries) so a reboot won't surprise you.

**Swappiness** tunes how eagerly the kernel swaps (0–100; lower = prefer RAM):

```bash
cat /proc/sys/vm/swappiness            # default often 60
sudo sysctl vm.swappiness=10           # for now (servers often prefer 10)
echo 'vm.swappiness=10' | sudo tee /etc/sysctl.d/99-swappiness.conf   # persist
```

To remove swap: `sudo swapoff /swapfile`, delete the fstab line, then `sudo rm
/swapfile`.

## Part 3 — Measure usage: df vs du

Two tools, two different questions — and confusing them wastes time:

- **`df`** — "how full is each **filesystem**?" (free space per mount).
- **`du`** — "how much space is **this directory tree** using?" (where it went).

```bash
df -h                            # every filesystem: size, used, avail, use%, mount
df -h /                          # just the root filesystem
df -i                            # INODES instead of bytes (crucial — see Part 4)

du -sh /var/log                  # total size of /var/log
du -sh /var/* | sort -h         # each child of /var, smallest to largest (Lesson 109!)
du -h --max-depth=1 /var | sort -h   # one level deep, ranked
```

> [!TIP]
> The "what's eating my disk?" reflex: `df -h` to find the **full filesystem**, then
> `du -h --max-depth=1 /that/mount | sort -h` to find the **biggest directory**,
> then descend into it and repeat. This top-down drill walks you straight to the
> culprit in three or four commands. `ncdu` (`sudo apt install ncdu`) is a friendly
> interactive version of the same idea.

## Part 4 — The sneaky causes

When `df` says the disk is full but `du` "can't find" the space, it's almost always
one of these two — and knowing them marks an experienced admin.

**Inode exhaustion.** A filesystem has a finite number of **inodes** (one per file).
Millions of tiny files (sessions, mail, cache) can exhaust inodes while bytes remain
free — you get "No space left on device" with `df -h` showing space available.

```bash
df -i                            # look at IUse% — if a filesystem is 100%, that's it
# Find the directories with the most files:
sudo find /var -xdev -type f | cut -d/ -f1-4 | sort | uniq -c | sort -nr | head
```

The fix is to delete or archive the huge population of small files (often an
unrotated cache or maildir).

**Deleted-but-still-open files.** If a process has a file open and the file is
**deleted**, the space is **not freed** until the process closes it or restarts —
classic with a service still writing to a log you `rm`'d. `df` shows the space used;
`du` can't see the (now unlinked) file.

```bash
sudo lsof +L1                    # files with link count 0 (deleted but still open)
sudo lsof | grep deleted         # another way to spot them
# Reclaim space by restarting the holding service (preferred) or truncating its fd:
sudo systemctl restart the-service
```

> [!IMPORTANT]
> **Never reclaim space by `rm`-ing a log a running service still has open** — the
> space won't come back and you'll lose the file's contents to confusion. Instead
> **truncate** it in place (`sudo truncate -s 0 /var/log/huge.log`) so the open file
> descriptor keeps working, or **restart the service** to release the deleted file.
> This is the #1 "the disk is full but du says it isn't" gotcha.

## Part 5 — The "disk full" playbook

When you hit **`No space left on device`**, work this order:

```bash
# 1. WHICH filesystem is full?
df -h                                 # find the mount at (or near) 100%

# 2. Is it INODES, not bytes?
df -i                                 # IUse% at 100% => inode exhaustion (Part 4)

# 3. If bytes: WHERE is the space going? (top-down)
sudo du -h --max-depth=1 /var | sort -h | tail        # repeat into the biggest dir
sudo du -h --max-depth=1 /var/log | sort -h | tail

# 4. Common culprits to check
sudo journalctl --disk-usage          # bloated journal? vacuum it (Lesson on logs)
ls -lhS /var/log/*.log | head          # huge unrotated logs? (logrotate)
docker system df                       # containers/images (if Docker present)

# 5. Are deleted-but-open files holding space?
sudo lsof +L1

# 6. Reclaim safely: truncate open logs, restart the holder, vacuum journal,
#    clean caches/old logs, rotate logs — never blind 'rm' on the root fs.
sudo journalctl --vacuum-size=200M
sudo truncate -s 0 /var/log/huge.log   # for a log a service still has open
```

> [!TIP]
> Leave a little headroom on purpose: a filesystem at 100% can stop services from
> writing (databases, logs) and even block logins. Monitoring/alerting at ~80% (a
> later observability topic) turns "the server is down" into "let's clean up this
> afternoon."

## Hands-on lab

```bash
# 1. Inspect memory and swap
free -h
swapon --show

# 2. Create, enable, and then remove a small swap file (safe, reversible)
sudo fallocate -l 512M /swapfile-lab
sudo chmod 600 /swapfile-lab
sudo mkswap /swapfile-lab
sudo swapon /swapfile-lab
swapon --show                          # see /swapfile-lab listed
sudo swapoff /swapfile-lab
sudo rm /swapfile-lab

# 3. df vs du drill — find the biggest directory under /var
df -h /
sudo du -h --max-depth=1 /var 2>/dev/null | sort -h | tail
sudo du -h --max-depth=1 /var/log 2>/dev/null | sort -h | tail

# 4. Inodes
df -i /                                # note IUse%

# 5. Simulate (and resolve) a deleted-but-open file
( exec 3>/tmp/openfile; rm /tmp/openfile; \
  echo "fd still open; file is deleted"; sleep 1; \
  sudo lsof +L1 2>/dev/null | grep openfile || echo "look for it via lsof +L1"; \
  exec 3>&- )                          # closing the fd finally frees it

# 6. Practise the top-down find for many small files
sudo find /usr -xdev -type f 2>/dev/null | wc -l   # how many files under /usr
```

## Exercises

1. Report your system's total RAM and total swap with a single command, and state
   whether any swap is currently in use.
2. Create a 256 MB swap file, enable it, confirm with `swapon --show`, then remove it
   cleanly (including any fstab line if you added one).
3. Find the three largest directories under `/var` using `du` and a sort pipeline.
4. Check whether any filesystem is near inode exhaustion, and explain what `df -i`
   tells you that `df -h` doesn't.
5. Explain the correct way to reclaim space from a large log file that a running
   service still has open — and why `rm` is the wrong move.

## Troubleshooting

- **`swapon: /swapfile: insecure permissions` / refused** — the file isn't `600`/
  root-owned. *Fix:* `sudo chmod 600 /swapfile` then `swapon` again.
- **`df` says full but `du` finds nothing** — deleted-but-open files or you're
  `du`-ing a different filesystem. *Fix:* `lsof +L1` for unlinked open files;
  restart the holder or `truncate` the log; check you measured the right mount.
- **"No space left on device" but `df -h` shows free space** — **inode** exhaustion.
  *Fix:* `df -i`; delete/archive the huge set of tiny files.
- **System is sluggish and swap is maxed** — RAM pressure/thrashing. *Fix:* find the
  memory hog (`ps aux --sort=-%mem | head`, Lesson 115); add RAM or fix the leak;
  swap is a buffer, not a cure.
- **Deleted a big log and space didn't return** — a process holds it open. *Fix:*
  `sudo systemctl restart <service>` (or `truncate -s 0` before deleting next time).

Reproduce the deleted-but-open effect with the lab's step 5: the space is held until
the file descriptor closes, exactly as on a real server with a logging service.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Run the practical items.

1. What is swap, and what problem does it prevent?
2. Which command shows RAM and swap together?
3. List the steps to add and enable a swap file.
4. Why must a swap file be `chmod 600`?
5. What different questions do `df` and `du` answer?
6. What does `df -i` show, and what failure does it diagnose?
7. What are "deleted-but-open" files, and how do you find them?
8. What's the safe way to reclaim space from a log a service still has open?
9. **Practical:** find the largest directory under `/var`. Command?
10. **Practical:** show whether any filesystem is short on inodes. Command and what
    you looked at?

## Solutions & validation

1. **Swap** is disk space used as **memory overflow** when RAM fills; it prevents
   immediate out-of-memory conditions (and the OOM killer) by paging inactive memory
   to disk.
2. `free -h`.
3. `fallocate -l <size> /swapfile` → `chmod 600 /swapfile` → `mkswap /swapfile` →
   `swapon /swapfile` (→ add to `/etc/fstab` to persist).
4. A swap file can contain **sensitive memory contents**, so it must be readable only
   by root; `swapon` refuses looser permissions.
5. `df` = **free space per filesystem**; `du` = **how much space a directory tree
   uses** (where the space went).
6. `df -i` shows **inode** usage; it diagnoses **inode exhaustion** (full of files
   even when bytes remain).
7. Files that were **deleted while a process still has them open**; their space isn't
   freed until the process closes/restarts. Find with `lsof +L1` (or `lsof | grep
   deleted`).
8. **Truncate** it in place (`truncate -s 0 file`) or **restart the service** to
   release it; `rm` leaves the space held by the open descriptor.
9. **Validation:** `sudo du -h --max-depth=1 /var | sort -h | tail` ranks the
   children; the last line is the biggest.
10. **Validation:** `df -i` — look at the **IUse%** column; near 100% means inode
    pressure.

> [!TIP]
> "df to find the full mount, df -i for inodes, du top-down for bytes, lsof +L1 for
> deleted-but-open" is a four-tool playbook that resolves the large majority of
> disk-full incidents fast. Commit it to memory; you *will* use it on call.

## What's next

That completes the **Storage & Filesystems Ops** module. Next, the Linux System
Administration track moves into **Networking Configuration** — assigning static IPs
with Netplan/`nmcli`, configuring DNS resolution, persistent routes, and diagnosing
connectivity from the server side — turning the networking *fundamentals* you learned
earlier into production server configuration skills.
