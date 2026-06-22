---
title: "Linux Administration — Disks & Partitions"
slug: "linux-admin-disks-and-partitions"
track: "linux-administration"
trackName: "Linux System Administration"
module: "Storage & Filesystems Ops"
order: 201
level: "Intermediate"
difficulty: "Intermediate"
distribution: "Ubuntu"
category: "Linux Administration"
tags: [linux, storage, disks, partitions, lsblk, parted, fdisk, intermediate]
cover: "/covers/curriculum/linux-administration.svg"
estMinutes: 60
status: "published"
summary: "Understand how Linux sees storage and lay out a disk correctly. Identify block devices with lsblk and blkid, read the difference between MBR and GPT partition tables, and create partitions safely with parted/fdisk — the foundation of every filesystem, LVM and RAID setup that follows."
seoTitle: "Linux Administration 1: Disks & Partitions (lsblk, parted, GPT)"
seoDescription: "Intermediate Linux: how Linux names block devices, MBR vs GPT, and creating partitions safely with lsblk, fdisk and parted. Hands-on lab and graded assessment."
---

Welcome to **Linux System Administration** — the track where you stop *operating* a
Linux box and start *running* one. We begin with **storage**, because almost
everything a server does eventually touches a disk, and storage mistakes are among
the most painful to recover from. This first lesson teaches you how Linux *sees*
disks, how partitions work, and how to lay one out **safely**. Get the mental model
right here and filesystems, LVM, RAID and backups (the next lessons) all click into
place.

> [!NOTE]
> Do this on a **practice VM with a spare/second virtual disk you can destroy** —
> never rehearse partitioning on a disk that holds anything you care about. In
> VirtualBox/your cloud provider, add a small extra disk (e.g. 5 GB) for the labs.
> Throughout, we'll target that spare disk (shown as `/dev/sdb`), never the system
> disk.

## Learning objectives

By the end of this lesson you will be able to:

- Explain how Linux represents disks as **block devices** and how they're named.
- List and inspect storage with **`lsblk`**, **`blkid`**, **`fdisk -l`**.
- Describe the difference between **MBR** and **GPT** partition tables.
- Create and delete partitions with **`parted`** (and `fdisk`) safely.
- Re-read the partition table so the kernel sees your changes.

## Part 1 — How Linux sees storage: block devices

Linux exposes storage as **block devices** — special files under `/dev`. Naming
follows the interface:

- **`/dev/sda`, `/dev/sdb`, …** — SATA/SAS/USB disks (`sd` = SCSI disk). First disk
  `sda`, second `sdb`, and so on.
- **`/dev/vda`, `/dev/vdb`, …** — virtio disks (common on KVM/cloud VMs).
- **`/dev/nvme0n1`, `/dev/nvme1n1`, …** — NVMe SSDs.

**Partitions** are numbered on top of the disk: `/dev/sda1`, `/dev/sda2` are the
first and second partitions of `sda`; `/dev/nvme0n1p1` is the first partition of
that NVMe device (note the `p1`). The disk is the whole device; partitions are
slices of it.

```bash
lsblk                       # tree of disks and partitions, sizes, mountpoints — START HERE
lsblk -f                    # add filesystem type, UUID and mountpoint
sudo fdisk -l               # detailed partition listing for every disk
ls -l /dev/sd* /dev/nvme* 2>/dev/null   # the raw device files
```

`lsblk` is the command you'll run first, every time, to understand a system's
storage. Read it as a tree: each disk, the partitions under it, and where (if
anywhere) each is **mounted** into the filesystem (Lesson 202).

> [!TIP]
> Identify *which* device is which before touching anything. `lsblk -o
> NAME,SIZE,TYPE,MOUNTPOINT,MODEL` shows sizes and models so you don't confuse the
> 50 GB system disk with the 5 GB spare. The cost of partitioning the wrong device
> is total data loss — measure twice, cut once.

## Part 2 — Partition tables: MBR vs GPT

Before a disk can hold partitions it needs a **partition table** — the index
describing how the disk is sliced. Two schemes exist:

| | **MBR** (msdos) | **GPT** |
|---|---|---|
| Age | Legacy (1980s) | Modern standard |
| Max disk size | ~2 TB | Effectively unlimited (zettabytes) |
| Primary partitions | 4 (then "extended/logical" hack) | 128 |
| Redundancy | Single copy | Backup table + checksums |
| Use when | Very old systems/BIOS quirks | **Default choice today** |

> [!IMPORTANT]
> **Use GPT for new disks** unless you have a specific reason not to (some ancient
> BIOS-only setups). GPT removes MBR's 2 TB limit and 4-partition awkwardness and
> keeps a backup table for resilience. The old `fdisk` historically meant MBR;
> modern `fdisk` and `parted` both handle GPT. When in doubt, GPT.

Check what a disk currently uses:

```bash
sudo parted /dev/sdb print          # shows "Partition Table: gpt" or "msdos"
sudo fdisk -l /dev/sdb | grep -i 'disklabel\|type'
```

## Part 3 — Creating partitions with parted

`parted` is the modern, scriptable tool and handles GPT cleanly. Here's a **safe,
deliberate** sequence to put a single partition spanning a whole spare disk
(`/dev/sdb`). Read every command before running it.

```bash
# 0. CONFIRM the target is the spare disk and is empty/unmounted
lsblk /dev/sdb
sudo umount /dev/sdb* 2>/dev/null    # ensure nothing is mounted

# 1. Create a GPT partition table (THIS WIPES the disk's partitioning)
sudo parted /dev/sdb --script mklabel gpt

# 2. Create one partition using 100% of the disk
sudo parted /dev/sdb --script mkpart primary ext4 0% 100%

# 3. Review the result
sudo parted /dev/sdb --script print
lsblk /dev/sdb                       # you should now see /dev/sdb1
```

`--script` runs non-interactively (good for repeatability); without it, `parted`
opens an interactive prompt where you type `mklabel`, `mkpart`, `print`, `quit`.

> [!IMPORTANT]
> `mklabel` **erases the disk's partition table** — every existing partition on that
> disk becomes inaccessible. There is no undo. Before running it, prove the device
> with `lsblk` (size, model, mountpoints) and make sure it's the disposable spare,
> not your system disk. The renderer flags destructive commands for a reason; treat
> partition operations with the same care as `rm -rf`.

### The classic fdisk alternative

Many admins still use `fdisk` interactively. The keystrokes for a fresh GPT disk:

```text
sudo fdisk /dev/sdb
  g     # create a new empty GPT partition table
  n     # new partition (accept defaults for number, first/last sector = whole disk)
  p     # print to review
  w     # WRITE changes and exit  (q quits WITHOUT saving — your safety net)
```

`fdisk`'s `q` (quit without writing) is your escape hatch: nothing is committed
until you press `w`. If you get confused mid-session, **press `q`** and start over —
no harm done.

## Part 4 — Make the kernel re-read the table

After changing partitions, the running kernel sometimes still has the old layout
cached. If your new partition doesn't appear:

```bash
sudo partprobe /dev/sdb         # ask the kernel to re-read the partition table
lsblk /dev/sdb                  # confirm the new partition is now visible
```

A new partition (e.g. `/dev/sdb1`) is just an empty slice of disk — it has **no
filesystem yet**, so you can't store files on it. Putting a filesystem on it
(`mkfs`) and mounting it is **Lesson 202**, which picks up exactly here.

## Hands-on lab

> Requires a **disposable spare disk**. Adjust `/dev/sdb` to match *your* spare from
> `lsblk` — never the system disk.

```bash
# 1. Survey storage and identify the spare
lsblk -o NAME,SIZE,TYPE,MOUNTPOINT,MODEL
SPARE=/dev/sdb                  # <-- set this to YOUR confirmed spare disk
sudo parted "$SPARE" print 2>/dev/null || echo "no table yet (that's fine)"

# 2. Ensure it's unmounted, then create a GPT table
sudo umount "${SPARE}"* 2>/dev/null
sudo parted "$SPARE" --script mklabel gpt

# 3. Create two partitions: 1 GB and the rest
sudo parted "$SPARE" --script mkpart primary 0% 1GiB
sudo parted "$SPARE" --script mkpart primary 1GiB 100%
sudo partprobe "$SPARE"

# 4. Review your handiwork
sudo parted "$SPARE" --script print
lsblk "$SPARE"                  # expect sdb1 and sdb2
blkid "${SPARE}1" 2>/dev/null   # no TYPE yet — no filesystem (that's Lesson 202)

# 5. Tear it back down (so the disk is clean for the next lesson)
sudo parted "$SPARE" --script mklabel gpt   # fresh empty GPT
lsblk "$SPARE"
```

## Exercises

1. Using only `lsblk`, write down every disk on your system, its size, and which
   partition (if any) is mounted at `/`.
2. Determine whether your spare disk currently uses an MBR or GPT table, and state
   how you checked.
3. On the spare disk, create a single GPT partition spanning the whole disk, then
   confirm it appears with `lsblk`.
4. Delete that partition and recreate **two** equal-ish partitions instead. Show the
   `parted print` output.
5. Explain, with the command, how you'd make the kernel notice a partition change
   without rebooting.

## Troubleshooting

- **New partition doesn't show in `lsblk`** — the kernel cached the old table.
  *Fix:* `sudo partprobe /dev/sdX` (or reboot). Ensure nothing on the disk is
  mounted/in use.
- **`parted`/`mkpart` says the device is busy** — a partition is mounted or used by
  LVM/RAID. *Fix:* `umount` it (and deactivate LVM) before changing partitions;
  `lsblk` shows what's mounted.
- **"I think I partitioned the wrong disk"** — stop immediately; do **not** write a
  filesystem on top. Data may be recoverable if you haven't overwritten it. *Going
  forward:* always confirm device, size, and model with `lsblk` first.
- **GPT vs MBR confusion / 2TB disk only shows 2TB** — the disk has an MBR table.
  *Fix:* repartition as GPT (destroys data — back up first).
- **`fdisk` doesn't show my changes** — you didn't `w` (write). In `fdisk`, changes
  only commit on `w`; `q` discards. Re-run and press `w`.

Reproduce the "no filesystem yet" idea: after creating `sdb1`, run `blkid
/dev/sdb1` — it reports no TYPE, proving a partition isn't usable until you put a
filesystem on it (next lesson).

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Practical items require a
disposable spare disk.

1. What is a block device, and where do they live?
2. How are the first and second SATA disks named? The first partition of the
   second disk?
3. Which command should you run first to understand a system's storage layout?
4. Give two advantages of GPT over MBR.
5. What does `parted mklabel gpt` do, and why is it dangerous?
6. In interactive `fdisk`, which key commits changes and which discards them?
7. After changing partitions, how do you make the kernel re-read the table without
   rebooting?
8. Does a freshly created partition contain a filesystem? What must you do next?
9. **Practical:** identify your system disk and your spare disk from `lsblk`. How
   did you tell them apart?
10. **Practical:** create a single GPT partition on the spare and show it with
    `lsblk`. Commands?

## Solutions & validation

1. A **block device** is the kernel's representation of a storage device, exposed as
   a special file under **`/dev`** (e.g. `/dev/sda`).
2. First SATA disk `/dev/sda`, second `/dev/sdb`; the first partition of the second
   disk is `/dev/sdb1`.
3. **`lsblk`** (optionally `lsblk -f`).
4. Any two of: supports disks **> 2 TB**; up to **128 primary partitions**; keeps a
   **backup partition table + checksums** for resilience.
5. It writes a **new, empty GPT partition table**, which **erases** the existing
   partitioning — all current partitions on that disk become inaccessible (no undo).
6. **`w`** writes/commits; **`q`** quits without saving.
7. `sudo partprobe /dev/sdX`.
8. **No** — a new partition is empty; you must **create a filesystem** on it
   (`mkfs`, Lesson 202) before storing files.
9. **Validation:** compared **SIZE** and **MODEL** (and mountpoints) in `lsblk -o
   NAME,SIZE,TYPE,MOUNTPOINT,MODEL`; the disk mounted at `/` is the system disk.
10. **Validation:** `parted /dev/sdb --script mklabel gpt` then `mkpart primary 0%
    100%`, `partprobe`, and `lsblk /dev/sdb` shows `sdb1`.

> [!TIP]
> "`lsblk` first, confirm the device, then act" is the storage admin's prime
> directive. Every later storage operation — filesystems, LVM, RAID, fstab —
> starts with correctly identifying the device you're working on.

## What's next

Next: **Lesson 202 — Filesystems & Mounting.** Your partitions are empty slices.
Now you'll put a **filesystem** on them with `mkfs`, attach them into the directory
tree with `mount`, label them with UUIDs, and make them mount automatically at boot
via **`/etc/fstab`** — including the safe way to edit fstab so a typo can't stop your
server from booting.
