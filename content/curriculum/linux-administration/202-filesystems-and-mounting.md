---
title: "Linux Administration — Filesystems & Mounting"
slug: "linux-admin-filesystems-and-mounting"
track: "linux-administration"
trackName: "Linux System Administration"
module: "Storage & Filesystems Ops"
order: 202
level: "Intermediate"
difficulty: "Intermediate"
distribution: "Ubuntu"
category: "Linux Administration"
tags: [linux, filesystem, mkfs, mount, fstab, ext4, xfs, uuid, intermediate]
cover: "/covers/curriculum/linux-administration.svg"
estMinutes: 60
status: "published"
summary: "Turn a raw partition into usable storage. Create filesystems with mkfs (ext4, xfs), attach them to the directory tree with mount, identify them reliably by UUID, and make them mount automatically at boot via /etc/fstab — including the safe edit-and-test workflow that prevents an unbootable server."
seoTitle: "Linux Administration 2: Filesystems, mount & /etc/fstab Safely"
seoDescription: "Intermediate Linux: create ext4/xfs filesystems with mkfs, mount them, use UUIDs, and configure /etc/fstab safely (mount -a test) so a typo never blocks boot. Lab + assessment."
---

In Lesson 201 you created partitions — empty slices of disk that can't yet hold
files. This lesson makes them **usable**: you'll put a **filesystem** on a
partition, **mount** it into the directory tree, and configure it to mount
**automatically at boot** through `/etc/fstab`. That last part is where careless
admins break servers, so we'll do it the safe way that professionals always use.
This is core RHCSA/LPIC material and a daily sysadmin task.

> [!NOTE]
> Continue on the **practice VM with a disposable spare disk** from Lesson 201.
> We'll target a partition on the spare (shown as `/dev/sdb1`) — confirm yours with
> `lsblk` and never touch the system disk.

## Learning objectives

By the end of this lesson you will be able to:

- Explain what a **filesystem** is and pick between **ext4** and **xfs**.
- Create a filesystem with **`mkfs`**.
- **Mount** and **unmount** filesystems and inspect them with `df` and `mount`.
- Identify filesystems reliably by **UUID** (`blkid`).
- Configure **`/etc/fstab`** for persistent mounts and **test it safely** with
  `mount -a`.

## Part 1 — What a filesystem is, and which to use

A **filesystem** is the structure that organises raw blocks into files and
directories, with names, permissions, and timestamps. A partition without a
filesystem is just space; `mkfs` ("make filesystem") writes that structure.

The two you'll use most on Linux:

| Filesystem | Strengths | Typical use |
|------------|-----------|-------------|
| **ext4** | Mature, rock-solid, great all-rounder, shrinkable | Default on Debian/Ubuntu; general purpose |
| **xfs** | Excellent for large files & parallelism, scales well | Default on RHEL/Rocky; big data, databases |

Both are journaling filesystems (they keep a log so they recover quickly after a
crash). You'll also meet **vfat/exFAT** (USB sticks, cross-OS) and advanced options
like **btrfs**/**ZFS** (snapshots, pooling) later. For server volumes, **ext4 or xfs
is almost always the right answer** — pick the one your distro defaults to unless you
have a reason.

## Part 2 — Create a filesystem with mkfs

```bash
# Confirm the target partition (NOT the whole disk, NOT the system disk)
lsblk /dev/sdb

# Create an ext4 filesystem on the partition
sudo mkfs.ext4 /dev/sdb1
# ...or xfs:
sudo mkfs.xfs /dev/sdb1
# Optional label (a friendly name you can mount by)
sudo mkfs.ext4 -L data /dev/sdb1
```

> [!IMPORTANT]
> **`mkfs` erases everything on the target.** Always run it against a **partition**
> (`/dev/sdb1`), not the whole disk (`/dev/sdb`), and triple-check the device with
> `lsblk` first — formatting the wrong partition destroys its data with no undo.
> Note the difference from Lesson 201: there you sliced the disk; here you format a
> slice.

After formatting, the partition has a **type** and a fresh **UUID**:

```bash
sudo blkid /dev/sdb1        # shows TYPE="ext4" and a UUID="...."
```

## Part 3 — Mounting: attach storage to the tree

Linux has **one** directory tree (Lesson 103). A filesystem becomes usable by
**mounting** it onto an empty directory (a **mount point**); from then on, paths
under that directory live on that filesystem.

```bash
sudo mkdir -p /mnt/data            # create a mount point (an empty directory)
sudo mount /dev/sdb1 /mnt/data     # attach the filesystem there
df -h /mnt/data                    # confirm: shows the device, size, use%
mount | grep sdb1                  # how it's mounted, with options
touch /mnt/data/hello             # now you can store files on it
```

To detach:

```bash
sudo umount /mnt/data              # (note: umount, no 'n')
```

> [!IMPORTANT]
> **`umount: target is busy`** is the classic error: something is using the
> filesystem — often your own shell sitting *inside* the mount, or an open file.
> *Fix:* `cd` out of it first, then `umount`. `sudo lsof +D /mnt/data` (or `fuser
> -vm /mnt/data`) shows what's holding it open. Never yank a mount that's in use —
> you risk data loss.

This `mount` is **temporary** — it disappears on reboot. To make it persist, you use
`/etc/fstab` (Part 5).

## Part 4 — Identify by UUID, not device name

Device names like `/dev/sdb` are **not stable** — add a disk, change a cable, or
reorder cloud volumes and yesterday's `sdb` might be today's `sdc`. If `/etc/fstab`
mounted by `/dev/sdb1`, your server could mount the **wrong** disk (or fail to boot).
The fix: identify filesystems by their **UUID**, a unique ID baked into the
filesystem that never changes:

```bash
sudo blkid                          # UUID and TYPE for every filesystem
sudo blkid /dev/sdb1                # just this one
lsblk -f                            # UUIDs alongside the tree view
```

You can mount by UUID directly:

```bash
sudo mount UUID=1234-5678-... /mnt/data
```

> [!TIP]
> **Always use UUIDs (or filesystem labels) in `/etc/fstab`, never raw `/dev/sdX`
> names.** UUIDs survive disk reordering and hardware changes; device names don't.
> This single habit prevents a whole category of "it booted fine yesterday"
> disasters. Labels (`LABEL=data`) are a readable alternative if you set them with
> `-L`.

## Part 5 — Persistent mounts with /etc/fstab (safely)

`/etc/fstab` ("filesystem table") lists filesystems to mount at boot. Each line has
six fields:

```text
# <device>            <mount point>  <type>  <options>        <dump> <pass>
UUID=1234-5678-...     /mnt/data      ext4    defaults         0      2
```

| Field | Meaning |
|-------|---------|
| device | **UUID=…** (preferred), LABEL, or `/dev/...` |
| mount point | the directory to mount onto |
| type | `ext4`, `xfs`, `vfat`, `nfs`, … (or `auto`) |
| options | `defaults`, or e.g. `noatime,nofail` |
| dump | backup flag — almost always `0` |
| pass | fsck order at boot: `0` skip, `1` root, `2` others |

The **safe workflow** — this is the part that saves servers:

```bash
# 1. Get the UUID
sudo blkid /dev/sdb1

# 2. Back up fstab before editing it
sudo cp /etc/fstab /etc/fstab.bak

# 3. Add the line (use the real UUID). 'nofail' = don't block boot if it's missing.
echo 'UUID=PASTE-UUID-HERE  /mnt/data  ext4  defaults,nofail  0  2' | sudo tee -a /etc/fstab

# 4. TEST without rebooting — this is the critical step
sudo umount /mnt/data 2>/dev/null
sudo mount -a            # mounts everything in fstab; MUST return with no errors
df -h /mnt/data          # confirm it mounted
```

> [!IMPORTANT]
> **Always run `sudo mount -a` after editing `/etc/fstab`, before you reboot.** A
> bad fstab line (wrong UUID, typo, missing filesystem) can drop the boot into an
> emergency shell and make the server **unbootable**. `mount -a` tests every entry
> immediately — if it errors, fix the line *now*, while you still have a running
> system. Adding **`nofail`** to non-essential mounts is a belt-and-braces safeguard
> so a missing disk doesn't halt boot. Keep the `fstab.bak` until you've rebooted
> cleanly once.

## Hands-on lab

> Uses the disposable spare disk. Confirm devices with `lsblk`; adjust as needed.

```bash
# 0. Prepare a partition (from Lesson 201) on the spare
SPARE=/dev/sdb
sudo parted "$SPARE" --script mklabel gpt
sudo parted "$SPARE" --script mkpart primary ext4 0% 100%
sudo partprobe "$SPARE"; lsblk "$SPARE"     # expect sdb1
PART="${SPARE}1"

# 1. Make a filesystem and inspect it
sudo mkfs.ext4 -L lab-data "$PART"
sudo blkid "$PART"                          # note TYPE=ext4 and the UUID

# 2. Mount it temporarily and use it
sudo mkdir -p /mnt/labdata
sudo mount "$PART" /mnt/labdata
df -h /mnt/labdata
echo "stored on a real filesystem" | sudo tee /mnt/labdata/test.txt
cat /mnt/labdata/test.txt

# 3. Persist it via fstab — the SAFE way
UUID=$(sudo blkid -s UUID -o value "$PART")
sudo cp /etc/fstab /etc/fstab.bak
echo "UUID=$UUID  /mnt/labdata  ext4  defaults,nofail  0  2" | sudo tee -a /etc/fstab
sudo umount /mnt/labdata
sudo mount -a                               # MUST succeed with no error
df -h /mnt/labdata                          # mounted again, now persistent

# 4. Demonstrate 'busy' on unmount, then do it cleanly
cd /mnt/labdata; sudo umount /mnt/labdata || echo "busy (we are inside it)"
cd ~; sudo umount /mnt/labdata && echo "unmounted cleanly"

# 5. Clean up: remove the fstab line and restore
sudo cp /etc/fstab.bak /etc/fstab
sudo mount -a
```

## Exercises

1. Create an ext4 filesystem on your spare partition with the label `archive`, then
   show its UUID and type with `blkid`.
2. Mount it on `/mnt/archive`, store a file, then unmount it. Prove the file
   persists by remounting and reading it.
3. Trigger and then resolve a `target is busy` error on unmount, explaining what was
   holding the mount.
4. Add the filesystem to `/etc/fstab` **by UUID** with `nofail`, test with `mount
   -a`, and confirm it mounted — without rebooting.
5. Explain in one paragraph why mounting by UUID in fstab is safer than by
   `/dev/sdb1`.

## Troubleshooting

- **`mount: /dev/sdb1: can't read superblock` / "wrong fs type"** — there's no (or a
  corrupt) filesystem. *Fix:* you skipped `mkfs`, or named the wrong device; verify
  with `blkid`. If corrupt, `sudo fsck /dev/sdb1` (unmounted) may repair it.
- **`umount: target is busy`** — something is using the mount (often your shell).
  *Fix:* `cd` out; find holders with `sudo lsof +D /mnt/...` or `fuser -vm`.
- **Server dropped to emergency mode after a reboot** — a bad `/etc/fstab` line.
  *Fix:* at the emergency shell, `mount -o remount,rw /`, edit fstab (fix/comment the
  bad line), reboot. *Prevention:* always `mount -a` after editing, and use `nofail`.
- **A mounted disk shows the wrong/old contents** — you mounted over a directory that
  already had files (they're hidden, not lost, while mounted). *Fix:* unmount to see
  the original directory; choose an empty mount point.
- **Device name changed after adding a disk** — exactly why fstab should use UUIDs.
  *Fix:* switch fstab entries to `UUID=` (from `blkid`).

Reproduce the hidden-files gotcha: put a file in `/mnt/labdata` *before* mounting,
mount over it, note it's hidden, unmount, and see it reappear.

## Assessment

**Passing requirement: at least 9 of 11 correct (≈82%) — storage is high-stakes.**
Practical items need the spare disk.

1. What does a filesystem provide that a raw partition doesn't?
2. Name two common Linux server filesystems and a strength of each.
3. Which command creates an ext4 filesystem, and what must you be careful about?
4. What does "mounting" mean?
5. What does `umount: target is busy` indicate, and how do you resolve it?
6. What is a UUID, and why mount by it instead of `/dev/sdX`?
7. List the six fields of an `/etc/fstab` line.
8. What command tests `/etc/fstab` without rebooting, and why is it essential?
9. What does the `nofail` option do, and when is it useful?
10. **Practical:** format the spare partition ext4 and mount it. Commands?
11. **Practical:** add it to fstab by UUID and verify with `mount -a`. Commands?

## Solutions & validation

1. **Structure** — files, directories, names, permissions and timestamps — turning
   raw blocks into usable storage.
2. Any two: **ext4** (mature, reliable, shrinkable, general purpose); **xfs**
   (great for large files/parallel I/O, scales well).
3. `sudo mkfs.ext4 /dev/sdb1`; be careful to target the **right partition** (not the
   whole disk or system disk) because **mkfs erases** it.
4. Attaching a filesystem onto a **directory (mount point)** so its files appear in
   the single Linux directory tree.
5. Something is **using** the filesystem (an open file or your shell inside it);
   `cd` out and/or find holders with `lsof`/`fuser`, then unmount.
6. A **unique identifier baked into the filesystem** that never changes; device
   names (`/dev/sdX`) can shift when hardware is added/reordered, so UUIDs prevent
   mounting the wrong disk.
7. device, mount point, type, options, dump, pass.
8. **`sudo mount -a`** — it mounts every fstab entry immediately, so a bad line is
   caught **while the system is still up**, preventing an unbootable server.
9. It tells the system **not to fail/halt boot** if that device is missing; useful
   for non-essential or removable mounts.
10. **Validation:** `sudo mkfs.ext4 /dev/sdb1` then `sudo mount /dev/sdb1 /mnt/...`;
    `df -h` shows it mounted.
11. **Validation:** add `UUID=… /mnt/… ext4 defaults,nofail 0 2` to `/etc/fstab`,
    run `sudo mount -a` (no error), `df -h` confirms.

> [!TIP]
> The fstab safety drill — back up, edit by UUID, `mount -a`, keep the backup until
> a clean reboot — is one of those habits that quietly separates reliable admins
> from the ones who occasionally take a server down. Make it automatic.

## What's next

Next: **Lesson 203 — LVM (Logical Volume Management).** Fixed partitions are rigid —
when a disk fills, you're stuck. **LVM** adds a flexible layer so you can grow
volumes, span multiple disks, and even snapshot — live, without downtime. You'll
learn physical volumes, volume groups and logical volumes, and grow a filesystem
on the fly: a genuine senior-level superpower.
