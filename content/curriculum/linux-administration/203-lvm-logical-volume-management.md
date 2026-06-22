---
title: "Linux Administration — LVM: Logical Volume Management"
slug: "linux-admin-lvm-logical-volume-management"
track: "linux-administration"
trackName: "Linux System Administration"
module: "Storage & Filesystems Ops"
order: 203
level: "Advanced"
difficulty: "Advanced"
distribution: "Ubuntu"
category: "Linux Administration"
tags: [linux, lvm, storage, pvcreate, vgcreate, lvextend, advanced]
cover: "/covers/curriculum/linux-administration.svg"
estMinutes: 70
status: "published"
summary: "Break free from rigid partitions. LVM adds a flexible layer between disks and filesystems so you can grow volumes on the fly, pool multiple disks, and snapshot. Learn physical volumes, volume groups and logical volumes, then grow a live filesystem with no downtime — a core senior storage skill."
seoTitle: "Linux Administration 3: LVM (pvcreate, vgcreate, lvextend, resize)"
seoDescription: "Advanced Linux: LVM concepts (PV/VG/LV), create and grow logical volumes, extend a mounted ext4/xfs filesystem online, and snapshot. Hands-on lab and graded assessment."
---

Fixed partitions have a hard limit: when one fills up, you can't easily make it
bigger without repartitioning and downtime. **LVM (Logical Volume Management)**
solves this by inserting a flexible layer between your physical disks and your
filesystems. With LVM you can **grow a volume while it's mounted and in use**, pool
several disks into one big space, move data between disks live, and take snapshots.
It's how serious servers manage storage, and a signature senior skill. This lesson
is **Advanced** — it builds directly on partitions (201) and filesystems (202).

> [!NOTE]
> Use the **practice VM with one or two disposable spare disks**. LVM is best
> learned with two small spares (e.g. `/dev/sdb`, `/dev/sdc`) so you can see a
> volume group span disks. Confirm devices with `lsblk`; never use the system disk.

## Learning objectives

By the end of this lesson you will be able to:

- Explain the LVM stack: **PV → VG → LV** and why each layer exists.
- Create physical volumes, a volume group, and logical volumes.
- Put a filesystem on an LV and mount it.
- **Grow** a volume group, a logical volume, and a **live** filesystem.
- Understand LVM **snapshots** at a high level.

## Part 1 — The LVM mental model

LVM has three layers. Learn them once and everything else follows:

1. **Physical Volume (PV)** — a whole disk or partition handed over to LVM
   (`/dev/sdb`, `/dev/sdb1`). It's the raw capacity.
2. **Volume Group (VG)** — a **pool** built from one or more PVs. Think of it as a
   bucket of storage; you can add more PVs to enlarge the bucket anytime.
3. **Logical Volume (LV)** — a slice carved out of the VG, which you format and
   mount like a partition (`/dev/vgname/lvname`). Unlike a partition, you can
   **resize** it freely as long as the VG has room.

```text
[ /dev/sdb ] [ /dev/sdc ]      <- physical disks
      |            |
    (PV)         (PV)          <- pvcreate
       \         /
        \       /
      [  Volume Group  ]       <- vgcreate / vgextend  (the flexible pool)
        /     |     \
     (LV)   (LV)   (LV)        <- lvcreate / lvextend (resizable volumes)
       |      |      |
    ext4    xfs    ext4         <- mkfs + mount, as in Lesson 202
```

The payoff: a filesystem sits on an **LV**, not a fixed partition, so when it fills
you just **extend the LV** (and grow the filesystem) — online, no reboot. Add a new
disk? Make it a PV, add it to the VG, and that capacity is instantly available to
grow any LV.

## Part 2 — Build an LVM stack

Install the tools if needed (`sudo apt install -y lvm2`). Then, bottom-up:

```bash
# 1. Create physical volumes from spare disks (or partitions)
sudo pvcreate /dev/sdb /dev/sdc
sudo pvs                         # summary of PVs   (pvdisplay for detail)

# 2. Create a volume group named 'data' from those PVs
sudo vgcreate data /dev/sdb /dev/sdc
sudo vgs                         # the pool's total/free size  (vgdisplay for detail)

# 3. Create a 2 GB logical volume named 'web' in the 'data' VG
sudo lvcreate -L 2G -n web data
sudo lvs                         # list LVs   (lvdisplay for detail)

# 4. Format and mount it — exactly like Lesson 202
sudo mkfs.ext4 /dev/data/web
sudo mkdir -p /srv/web
sudo mount /dev/data/web /srv/web
df -h /srv/web
```

The LV's device path is `/dev/<vg>/<lv>` (here `/dev/data/web`; also visible as
`/dev/mapper/data-web`). From the filesystem's point of view it's just a block
device — everything you learned about `mkfs`, `mount`, UUIDs and `/etc/fstab` applies
unchanged.

> [!TIP]
> `pvs`, `vgs`, `lvs` (summaries) and their `*display` cousins (details) are your
> LVM dashboard. Run `vgs` to see **how much free space the pool has** before you
> grow anything — you can only extend an LV if its VG has free extents.

## Part 3 — Grow a logical volume and its filesystem (online!)

This is LVM's headline feature. Suppose `/srv/web` is filling up and the VG has free
space. Extend the LV, then grow the filesystem **while it stays mounted**:

```bash
# Check there is free space in the VG first
sudo vgs

# Extend the LV by 1 GB (or use -L 5G for an absolute new size)
sudo lvextend -L +1G /dev/data/web

# Grow the FILESYSTEM to fill the enlarged LV:
#   ext4:
sudo resize2fs /dev/data/web          # ext4 grows online, no unmount
#   xfs (must be MOUNTED; xfs only grows, never shrinks):
# sudo xfs_growfs /srv/web

df -h /srv/web                        # bigger now, and never went offline
```

LVM even offers a shortcut that resizes the filesystem in the same step:

```bash
sudo lvextend -r -L +1G /dev/data/web   # -r/--resizefs grows the FS automatically
```

> [!IMPORTANT]
> Growing is two steps: **enlarge the LV** (`lvextend`), then **grow the
> filesystem** (`resize2fs` for ext4, `xfs_growfs` for xfs). Forgetting the second
> step is the classic mistake — the LV is bigger but `df` still shows the old size
> because the filesystem hasn't been told to expand. Both **ext4 and xfs grow
> online**; only **ext4 can shrink** (and shrinking requires unmounting and is risky
> — always back up first). Use `-r` to do both at once and avoid the trap.

### Adding a disk to the pool

Out of space in the whole VG? Add another disk live:

```bash
sudo pvcreate /dev/sdd               # new disk becomes a PV
sudo vgextend data /dev/sdd          # add it to the pool — VG instantly larger
sudo vgs                             # more free space now, ready for lvextend
```

## Part 4 — Snapshots (the concept)

An LVM **snapshot** is a frozen-in-time view of an LV, created instantly, useful for
**consistent backups** (snapshot, back up the snapshot, drop it) or a safety net
before a risky change:

```bash
# Create a 1 GB snapshot of the 'web' LV
sudo lvcreate -L 1G -s -n web-snap /dev/data/web
# ...back up /dev/data/web-snap, or mount it read-only to inspect...
sudo lvremove /dev/data/web-snap     # remove when done
```

> [!IMPORTANT]
> A snapshot only stores **changes** since it was taken, so its size needs to cover
> the expected churn — if a snapshot **fills up**, it becomes invalid. Snapshots are
> for **short-lived** purposes (a backup window, a pre-upgrade safety net), **not**
> long-term storage, and they live in the **same VG** so they share its risk. They're
> a tool, not a backup strategy on their own (that's the Backup/DR track).

## Hands-on lab

> Needs at least one disposable spare disk; two is better. Adjust device names from
> `lsblk`.

```bash
sudo apt install -y lvm2 2>/dev/null
lsblk                                   # identify spares (here sdb, sdc)

# 1. PV -> VG -> LV
sudo pvcreate /dev/sdb
sudo vgcreate labvg /dev/sdb
sudo lvcreate -L 1G -n vol1 labvg
sudo pvs; sudo vgs; sudo lvs

# 2. Filesystem + mount
sudo mkfs.ext4 /dev/labvg/vol1
sudo mkdir -p /mnt/vol1
sudo mount /dev/labvg/vol1 /mnt/vol1
df -h /mnt/vol1                          # ~1G

# 3. Grow the pool by adding a second disk, then grow the volume ONLINE
sudo pvcreate /dev/sdc
sudo vgextend labvg /dev/sdc
sudo vgs                                 # more free space now
sudo lvextend -r -L +1G /dev/labvg/vol1  # extend LV AND filesystem in one step
df -h /mnt/vol1                          # ~2G, and it stayed mounted the whole time

# 4. Snapshot, inspect, remove
sudo lvcreate -L 512M -s -n vol1-snap /dev/labvg/vol1
sudo lvs                                 # see the snapshot
sudo lvremove -y /dev/labvg/vol1-snap

# 5. Tear down completely
sudo umount /mnt/vol1
sudo lvremove -y /dev/labvg/vol1
sudo vgremove -y labvg
sudo pvremove /dev/sdb /dev/sdc
lsblk
```

## Exercises

1. Build a full stack: one PV from a spare disk, a VG named `appvg`, and a 500 MB LV
   named `logs`. Show `pvs`, `vgs`, `lvs`.
2. Put an ext4 filesystem on the LV, mount it at `/srv/logs`, and confirm with
   `df -h`.
3. Extend the LV to 1 GB and grow the filesystem **without unmounting**. Prove
   `df -h` reflects the new size.
4. Add a second spare disk as a PV and extend the VG with it; show the VG's free
   space increasing.
5. Create and then remove a snapshot of your LV, and explain in one sentence what a
   snapshot is for.

## Troubleshooting

- **`lvextend` worked but `df` still shows the old size** — you didn't grow the
  filesystem. *Fix:* `resize2fs <lv>` (ext4) or `xfs_growfs <mountpoint>` (xfs); or
  use `lvextend -r` next time.
- **`Insufficient free space` on lvextend** — the VG is full. *Fix:* add a disk:
  `pvcreate` + `vgextend`, then retry.
- **`Device /dev/sdb excluded by a filter` / `already in use`** — the disk has an old
  filesystem/partition signature or is mounted. *Fix:* unmount it; `wipefs -a
  /dev/sdb` clears stale signatures (destructive — confirm the device first).
- **Can't shrink an xfs filesystem** — xfs **cannot shrink**, by design. *Fix:* to
  reclaim space you must back up, recreate smaller, and restore; or use ext4 if you
  anticipate shrinking.
- **LV won't activate after a reboot / not in `lsblk`** — *Fix:* `sudo vgchange -ay`
  to activate volume groups; check `vgs`/`lvs`. Ensure fstab uses the LV path/UUID.

Reproduce the "forgot to grow the FS" trap deliberately: `lvextend -L +500M` (without
`-r`), note `df` is unchanged, then run `resize2fs` and watch it update.

## Assessment

**Passing requirement: at least 9 of 11 correct (≈82%).** Practical items need spare
disk(s).

1. What are the three LVM layers, and what is each for?
2. Why is an LV more flexible than a plain partition?
3. Which commands create a PV, a VG, and an LV?
4. After `lvextend`, what second step is required, and why?
5. Which filesystems can grow **online**? Which can **shrink**?
6. How do you add a brand-new disk's capacity to an existing VG?
7. What does `lvextend -r` do?
8. What is an LVM snapshot used for, and why must it not be long-lived?
9. Which commands summarise PVs, VGs, and LVs?
10. **Practical:** build PV→VG→LV, format and mount it. Commands?
11. **Practical:** grow that LV and its filesystem online. Commands and proof?

## Solutions & validation

1. **PV** (a disk/partition given to LVM — raw capacity), **VG** (a pool of one or
   more PVs), **LV** (a resizable slice of the VG that you format and mount).
2. An LV can be **resized** (grown, and for ext4 shrunk) and can **span multiple
   disks** via its VG, all without repartitioning; a fixed partition can't.
3. `pvcreate`, `vgcreate`, `lvcreate`.
4. **Grow the filesystem** (`resize2fs`/`xfs_growfs`); `lvextend` only enlarges the
   block device, so the filesystem must be told to use the new space.
5. **ext4 and xfs** both grow online; **only ext4** can shrink (offline, risky).
6. `pvcreate /dev/sdX` then `vgextend <vg> /dev/sdX`.
7. Extends the LV **and** automatically resizes its filesystem in one step.
8. Consistent **backups** or a **pre-change safety net**; it stores only changes and
   becomes invalid if it fills, so it's for short-lived use, not long-term storage.
9. `pvs`, `vgs`, `lvs` (with `pvdisplay`/`vgdisplay`/`lvdisplay` for detail).
10. **Validation:** `pvcreate` → `vgcreate labvg` → `lvcreate -L 1G -n vol1 labvg` →
    `mkfs.ext4 /dev/labvg/vol1` → `mount` → `df -h` shows it.
11. **Validation:** `lvextend -r -L +1G /dev/labvg/vol1`; `df -h` shows the larger
    size while it stayed mounted.

> [!TIP]
> "PV feeds VG, VG feeds LV, LV holds the filesystem" — and growth flows the same
> way: add a PV → extend the VG → extend the LV → grow the FS. Internalise that
> flow and online storage expansion becomes a routine, confident operation.

## What's next

Next: **Lesson 204 — Swap, Disk Usage & "Disk Full" Troubleshooting.** You can build
and grow storage; now you'll manage memory overflow with **swap**, measure usage
precisely with `df` and `du`, and run the methodical playbook for the dreaded
**"No space left on device"** — including the sneaky cases (inodes, deleted-but-open
files) that confuse even experienced admins. That completes the storage module.
