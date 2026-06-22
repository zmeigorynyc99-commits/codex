---
title: "Linux Fundamentals — Package Management"
slug: "linux-fundamentals-package-management"
track: "linux-fundamentals"
trackName: "Linux Fundamentals"
module: "Users, Permissions & Processes"
order: 117
level: "Intermediate"
difficulty: "Intermediate"
distribution: "Ubuntu"
category: "Linux Fundamentals"
tags: [linux, apt, dnf, pacman, packages, repositories, updates, intermediate]
cover: "/covers/curriculum/linux-fundamentals.svg"
estMinutes: 55
status: "published"
summary: "Install software the Linux way — from trusted, signed repositories with a package manager that handles dependencies for you. Master apt (install, update, upgrade, search, remove) on Debian/Ubuntu, the dnf and pacman equivalents, the lower-level dpkg/rpm, and how to keep a server patched safely."
seoTitle: "Linux Fundamentals 17: Package Management with apt, dnf & pacman"
seoDescription: "Intermediate Linux: install/update/remove software with apt, dnf and pacman; understand repositories and signing; dpkg/rpm; and keep servers patched safely. Lab + assessment."
---

Software on Linux doesn't come from downloading installers off random websites. It
comes from **repositories** — trusted, curated, cryptographically signed
collections maintained by your distribution — installed by a **package manager**
that resolves dependencies for you. This model is one of Linux's great strengths:
secure, repeatable, and scriptable (which is the seed of automation). This lesson
makes you fluent with it.

## Learning objectives

By the end of this lesson you will be able to:

- Explain **packages**, **repositories**, **dependencies**, and **signing**.
- Use **`apt`** to update, install, search, inspect and remove software.
- Map those operations to **`dnf`** (Fedora/RHEL) and **`pacman`** (Arch).
- Use the low-level tools **`dpkg`**/**`rpm`** to inspect packages.
- Keep a system **patched** safely, including automatic security updates.

## Part 1 — The model: repositories and dependencies

A **package** is a bundled archive of a program plus metadata: its version, what it
depends on, and where its files go. A **repository** is a server hosting many
packages, with a signed index so your machine can verify authenticity.

Why this beats downloading installers:

- **Trust & integrity** — packages are **signed**; the manager refuses tampered or
  unsigned ones. You're not trusting a random website.
- **Dependencies handled** — install one thing and the manager pulls in everything
  it needs, at compatible versions.
- **Clean removal & updates** — it tracks every file it placed, so it can update or
  remove cleanly.
- **Repeatable** — the same `apt install` produces the same result on every server,
  which is exactly what automation relies on.

Debian/Ubuntu use **`apt`** (`.deb` packages); Fedora/RHEL/Rocky use **`dnf`**
(`.rpm`); Arch uses **`pacman`**. Same ideas, different commands.

## Part 2 — apt: the essentials

Two commands you'll run constantly — and they are **not** the same:

```bash
sudo apt update      # refresh the list of available packages (does NOT install)
sudo apt upgrade     # install newer versions of packages you already have
```

> [!IMPORTANT]
> `apt update` only **refreshes the catalogue** of what's available; `apt upgrade`
> actually **installs** the updates. Always `update` before `install`/`upgrade`, or
> apt may look for a version it doesn't know about yet. Memorise the combo:
> **`sudo apt update && sudo apt upgrade`**.

Installing, inspecting, removing:

```bash
sudo apt install htop tree curl   # install one or more packages (+ dependencies)
apt search nginx                  # find packages by keyword
apt show nginx                    # version, size, dependencies, description
apt list --installed              # everything currently installed
apt list --installed | wc -l      # how many packages? (Lesson 107 pipe!)
sudo apt remove htop              # remove the package (KEEPS its config files)
sudo apt purge htop               # remove the package AND its config files
sudo apt autoremove               # remove dependencies nothing needs anymore
```

> [!NOTE]
> `apt` (friendly, colourful, for interactive use) vs `apt-get`/`apt-cache` (older,
> stable interface for **scripts**): they overlap heavily. Use `apt` at the
> keyboard; you'll see `apt-get` in Dockerfiles and automation because its output
> format is guaranteed stable.

## Part 3 — dpkg: the layer beneath apt

`apt` downloads from repos and resolves dependencies; underneath, **`dpkg`** handles
individual `.deb` files and the local package database:

```bash
dpkg -l                       # list all installed packages
dpkg -l | grep nginx          # is nginx installed? which version?
dpkg -L nginx                 # list every file the nginx package installed
dpkg -S /usr/sbin/nginx       # which package owns this file?
sudo dpkg -i ./package.deb    # install a local .deb (then `apt -f install` fixes deps)
```

`dpkg -L` (what did this package put on disk?) and `dpkg -S` (what package owns this
file?) are genuinely useful when tracking down where a config or binary came from.

## Part 4 — Other distros (so you're never lost)

The concepts are identical; only the command changes. Keep this table:

| Task | Debian/Ubuntu (apt) | Fedora/RHEL (dnf) | Arch (pacman) |
|------|---------------------|-------------------|---------------|
| Refresh index | `apt update` | (automatic) | `pacman -Sy` |
| Install | `apt install X` | `dnf install X` | `pacman -S X` |
| Upgrade all | `apt upgrade` | `dnf upgrade` | `pacman -Syu` |
| Search | `apt search X` | `dnf search X` | `pacman -Ss X` |
| Remove | `apt remove X` | `dnf remove X` | `pacman -R X` |
| Info | `apt show X` | `dnf info X` | `pacman -Si X` |
| Owns file | `dpkg -S file` | `rpm -qf file` | `pacman -Qo file` |
| List installed | `apt list --installed` | `rpm -qa` / `dnf list installed` | `pacman -Q` |

> [!TIP]
> You don't need to memorise every column — just internalise that **install /
> update / search / remove** exist everywhere, and look up the exact word for the
> distro in front of you. Knowing the *concept* transfers; the syntax is a quick
> `man` away (Lesson 106).

## Part 5 — Keeping a server patched

Security updates are the cheapest, highest-impact thing you can do for a server. On
any box, the first thing an engineer runs:

```bash
sudo apt update && sudo apt upgrade -y
```

For unattended security patches on Ubuntu:

```bash
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure --priority=low unattended-upgrades   # enable auto security updates
```

```bash
apt list --upgradable          # what updates are pending?
cat /etc/apt/sources.list      # where packages come from (your repositories)
ls /etc/apt/sources.list.d/    # extra repository definitions (PPAs, vendor repos)
```

> [!IMPORTANT]
> Updating is routine, but on **production** schedule it for a maintenance window
> and know that a kernel update needs a reboot (`sudo reboot`) to take effect. Check
> `apt list --upgradable` first so you know what's changing, and never add untrusted
> third-party repositories casually — an unsigned or malicious repo undermines the
> entire trust model. Only add repos from sources you trust, and prefer the
> distribution's own packages.

## Hands-on lab

```bash
# 1. Refresh and see what's pending (safe, read-only-ish)
sudo apt update
apt list --upgradable | head

# 2. Search, inspect, install
apt search '^tree$'            # find the 'tree' package
apt show tree                  # read its metadata
sudo apt install -y tree htop
tree -L 1 /etc | head          # use what you just installed

# 3. Inspect with dpkg
dpkg -l | grep -E 'tree|htop'
dpkg -L tree | head            # files the package installed
dpkg -S "$(which htop)"        # which package owns the htop binary

# 4. Count installed packages
apt list --installed 2>/dev/null | wc -l

# 5. Remove vs purge, then tidy
sudo apt remove -y tree        # remove (keeps config)
sudo apt autoremove -y         # drop now-orphaned dependencies

# 6. (Read-only) where do packages come from?
cat /etc/apt/sources.list | grep -v '^#' | grep -v '^$' | head
```

## Exercises

1. Refresh the package index and list how many upgrades are pending.
2. Install `htop`, then use `dpkg -L` to find where its main binary was installed.
3. Search for a package that provides the `dig` command (hint: it's in
   `dnsutils`/`bind-utils`), then show its info.
4. Explain the difference between `apt remove` and `apt purge`, then demonstrate it
   by removing a package and checking whether its config files remain.
5. On (or imagining) a Fedora and an Arch box, write the command to install `htop`
   on each.

## Troubleshooting

- **`Unable to locate package X`** — your index is stale or the package name is
  wrong. *Fix:* `sudo apt update` first; verify the name with `apt search`.
- **`Could not get lock /var/lib/dpkg/lock`** — another apt/package process is
  running (often an automatic update). *Fix:* wait for it to finish, or find it with
  `ps aux | grep -E 'apt|dpkg'`; don't delete the lock unless you're certain nothing
  is running.
- **A broken/half-configured install** — *Fix:* `sudo apt --fix-broken install` (or
  `sudo dpkg --configure -a`).
- **`apt upgrade` held back some packages** — those updates change dependencies;
  `sudo apt full-upgrade` (or `dist-upgrade`) allows them, with more care.
- **Installed a `.deb` and it complains about dependencies** — `dpkg -i` doesn't
  fetch deps. *Fix:* `sudo apt -f install` afterwards to pull them in.

Reproduce the stale-index case: on a fresh VM, try installing an obscure package
before `apt update` (may fail "unable to locate"), then `apt update` and retry.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Run the practical items on
a VM.

1. What is a repository, and why is installing from one safer than a website
   download?
2. What's the difference between `apt update` and `apt upgrade`?
3. Write the command to install three packages at once.
4. What's the difference between `apt remove` and `apt purge`?
5. What does `apt autoremove` do?
6. Which command lists every file a package installed? Which tells you what package
   owns a given file?
7. Give the install command on apt, dnf, and pacman.
8. How do you enable automatic security updates on Ubuntu?
9. **Practical:** how many packages are installed on your system, and what pipeline
   counted them?
10. **Practical:** install `tree`, use it once, then remove it. Which commands?

## Solutions & validation

1. A **repository** is a curated, **signed** collection of packages from your distro;
   the manager **verifies signatures** and resolves dependencies, so you're not
   trusting an arbitrary, unverified website download.
2. `apt update` **refreshes the catalogue** of available packages; `apt upgrade`
   **installs** newer versions of what you have.
3. `sudo apt install pkg1 pkg2 pkg3`.
4. `remove` deletes the package but **keeps its config files**; `purge` removes the
   package **and** its config files.
5. Removes **orphaned dependencies** — packages that were installed only to satisfy
   something now removed.
6. `dpkg -L <pkg>` lists installed files; `dpkg -S <file>` shows the owning package
   (`rpm -ql` / `rpm -qf` on RPM distros).
7. apt: `sudo apt install htop`; dnf: `sudo dnf install htop`; pacman: `sudo pacman
   -S htop`.
8. Install `unattended-upgrades` and enable it (`sudo dpkg-reconfigure
   unattended-upgrades`).
9. **Validation:** `apt list --installed 2>/dev/null | wc -l` prints a count.
10. **Validation:** `sudo apt install -y tree`, run `tree`, then `sudo apt remove -y
    tree` (optionally `purge`).

> [!TIP]
> The package manager is how Linux installs *everything* — including the services
> from Lesson 116 and the tools in every later track. "Update first, then install;
> remove cleanly; keep it patched" is a habit that keeps systems secure and
> predictable.

## What's next

Next: **Lesson 118 — Text Editors Survival (nano & vim).** You've been editing files
in the labs; now you'll get properly comfortable. You'll learn `nano` for quick,
friendly edits, and the **survival subset** of `vim` — including the famously
elusive "how do I quit vim?" — so you can confidently edit a config on any server,
even a minimal one where `nano` isn't installed. That completes the track.
