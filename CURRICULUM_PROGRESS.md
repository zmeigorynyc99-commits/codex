# Curriculum Build — Progress Ledger

This file tracks the multi-session build of the botera learning platform
(thousands of lessons, beginner → expert, across Linux/Windows/networking/
security/cloud/DevOps/SRE). **Update it at the end of every batch.**

> Goal: a graduate who completes all lessons + assessments is strongly prepared
> for real infra/ops/security/DevOps/SRE work and major certifications. Quality
> over count — no shallow filler.

---

## How the platform works (read first if you're a new session)

Lessons are **files**, auto-imported into the existing CMS — there is **no manual
upload**. Do not reintroduce manual uploading.

- **Source of truth:** `content/curriculum/<track-slug>/<NNN>-<slug>.md`
  (markdown + YAML-ish front matter). Template + rules:
  `content/curriculum/README.md`.
- **Taxonomy:** `content/curriculum/curriculum.json` (tracks, levels, certs).
- **Importer:** `scripts/import-content.mjs` — idempotent (content-hash),
  non-destructive (only touches its own rows, tracked in the `imported_content`
  table; never edits admin-authored tutorials). Parser:
  `scripts/lib/frontmatter.mjs`.
- **Runs automatically** on container start via the Dockerfile `CMD`
  (`node scripts/import-content.mjs --prune; node server.js`). Manual:
  `npm run content:import` (add `-- --prune` to drop deleted lessons).
- **Quality gate:** `tests/unit/curriculum-content.test.ts` fails CI unless every
  lesson has the required sections (objectives, hands-on lab, exercises,
  troubleshooting, assessment **with a passing requirement**, solutions) and valid
  front matter, unique slug, and renders safely.
- **Levels:** `Difficulty` enum extended to Beginner/Intermediate/Advanced/
  **Senior/Expert** (`src/lib/cms/constants.ts`); badges styled in
  `src/app/globals.css`. `Distribution` gained `Windows` + `Cross-platform`.
- **Rendering/listing/SEO:** reuses the existing `/linux-tutorials` catalogue
  (filter by category=track, difficulty=level, search, pagination) — nothing
  redesigned.

### Authoring checklist (per lesson)
1. Create `content/curriculum/<track>/<order>-<slug>.md` with full front matter.
2. Body must include the required sections (see README). Be accurate, practical,
   senior-level. Mark destructive commands clearly.
3. `npm run content:import` against a temp DB to sanity-check, then
   `npx vitest run tests/unit/curriculum-content.test.ts`.
4. Reference a cover (track covers live in `public/covers/curriculum/`).

---

## Status

### ✅ Batch 1 — Pipeline + Linux Fundamentals, Module 1 (DONE, committed)
Infrastructure:
- Content pipeline (importer, parser, frontmatter, idempotent + non-destructive).
- Auto-import on startup (Dockerfile CMD + `COPY content`), `content:import` npm
  script, content-validation test, 5-level difficulty enum + badge CSS,
  distribution enum widened.
- Curriculum map (`curriculum.json`, 24 tracks) + authoring README + track cover
  for Linux Fundamentals.

Content — **Linux Fundamentals › Module 1: First Steps** (5 lessons, Beginner):
- 101 What Linux Is and How to Reach a Shell
- 102 The Terminal and Your First Commands (ls, tab, history)
- 103 The Filesystem Hierarchy and Navigation (paths, cd)
- 104 Looking at Files (cat, less, head, tail, wc, file)
- 105 Creating and Managing Files & Directories (mkdir, touch, cp, mv, rm)

Validation: `npm run typecheck` clean · `npm test` 172 passing · `npm run build`
OK · importer clean (5 created, idempotent on re-run).

### ✅ Batch 2 — Linux Fundamentals, Module 2: Text & Help (DONE, committed)
- 106 Getting Help (man, --help, apropos, whatis, man sections, type/which)
- 107 Standard I/O & Redirection (streams, `>` `>>` `2>` `2>&1` `&>`, /dev/null, tee, pipes)
- 108 Finding Text with grep (flags, context, basic + extended regex)
- 109 Text Processing Pipelines (cut, sort, uniq -c, tr; the extract→sort→uniq→rank pattern)
- 110 sed & awk Essentials (substitute/delete/in-place; awk fields, filters, arithmetic)
- 111 Finding Files (find by name/type/size/time/owner, locate, xargs/-exec safely)

Validation: importer imports 11 curriculum lessons cleanly; 78 content tests
pass. (Levels exercised: Beginner + Intermediate.)

### 🟡 Batch 3 — Linux Fundamentals, Module 3 (PARTIAL: 112–115 DONE, committed)
- 112 Users, Groups & Identity (/etc/passwd, /etc/group, UID/GID, useradd/usermod, id)
- 113 Permissions (rwx, octal 644/755/600, chmod sym+octal, chown/chgrp, umask)
- 114 sudo & Privilege (sudo vs su, /etc/sudoers + visudo, scoped NOPASSWD, auditing)
- 115 Processes & Jobs (ps, top/htop, signals, kill TERM vs KILL, &/jobs/fg/bg/nohup)

Validation: importer imports 15 curriculum lessons cleanly; 106 content tests
pass.

### ✅ Batch 4 — Linux Fundamentals, Module 3 complete (116–118 DONE, committed)
- 116 systemd & Services (systemctl start/stop/enable, unit files, journalctl)
- 117 Package Management (apt/dnf/pacman, repos, dpkg, patching, unattended-upgrades)
- 118 Text Editors Survival (nano essentials; vim survival subset incl. how to quit vim)

🎉 **The linux-fundamentals track is now COMPLETE (18 lessons, 101–118).**
Validation: importer imports 18 curriculum lessons cleanly; 127 content tests pass.

### 🟡 Batch 5 — Linux System Administration, Module 1: Storage (DONE, committed)
Track cover added: `public/covers/curriculum/linux-administration.svg`.
- 201 Disks & Partitions (lsblk/blkid, MBR vs GPT, parted/fdisk, partprobe)
- 202 Filesystems & Mounting (mkfs ext4/xfs, mount, UUIDs, /etc/fstab + mount -a safety)
- 203 LVM (PV/VG/LV, lvextend + resize2fs/xfs_growfs online, vgextend, snapshots) [Advanced]
- 204 Swap, Disk Usage & "Disk Full" playbook (swap file, df/du, df -i inodes, lsof +L1)

Validation: importer imports 22 lessons cleanly; 155 content tests pass.
Totals so far: 22 lessons (Linux Fundamentals 18 + Linux Administration 4).

### 🟡 Batch 6 — Linux System Administration, Module 2: Networking (DONE, committed)
- 205 Network Configuration (Netplan + nmcli, static IPs, netplan try safety)
- 206 DNS Resolution & Hostnames (/etc/hosts, systemd-resolved, resolvectl, dig)
- 207 Routing & Multiple Interfaces [Advanced] (ip route, longest-prefix, persistent
  routes, multi-homed, ip_forward, policy-routing concepts)
- 208 Network Troubleshooting (layered method: ip/ping/mtr/ss/dig/curl/tcpdump)

Validation: importer imports 26 lessons cleanly; 183 content tests pass.
Totals so far: 26 lessons (Linux Fundamentals 18 + Linux Administration 8).

---

### ✅ Batch 7 — Linux Administration Module 3 + UI (DONE, on main)
- 209 Scheduling with cron & systemd timers (env pitfalls, OnCalendar, Persistent)
- 210 Logging Architecture [Advanced] (journald + rsyslog, journalctl, persistence/
  capping, logrotate, central shipping)
- 211 Time, Clocks & NTP (timedatectl, UTC/RTC, timesyncd vs chrony, drift)
- UI: lesson carousel is click-safe + whole-card link + starts at Lesson 1; added
  an always-clickable "All lessons" index, a Subnet (CIDR) cheat-sheet aside, and
  an "In-depth guides" section for standalone (non-lesson_order) tutorials.
- Numbering is now GLOBAL continuous (Lesson 1 → N), not per-track.
- Merged the user's main: PR #12 TutorialCard fix + PR #13 seed-tutorials.ts
  ("Zero to Hero Networking" standalone guide, seeded from db.ts, idempotent).
  Course now 29 ordered lessons. Everything pushed to `main`.

NOTE: two content pipelines now coexist — the file-based curriculum importer
(content/curriculum, the numbered course) and seed-tutorials.ts (one standalone
networking guide seeded on db open). Keep them separate; the carousel/All-lessons
use listCourseLessons (lesson_order), guides use listStandaloneGuides (null order).

### ✅ Batch 8 — LinuxAdmin Module 4 + Shell & Bash track (DONE, on main)
- Linux Administration Module 4 (212–215): performance methodology & load [Adv],
  CPU & memory [Adv], disk & I/O [Adv], kernel tuning sysctl & limits [Senior].
  **linux-administration track COMPLETE (15 lessons, 201–215).**
- Shell & Bash Scripting track started + finished foundations (301–308, with cover):
  301 first script, 302 variables/quoting, 303 conditionals, 304 loops, 305
  functions/args/getopts, 306 arrays & assoc arrays, 307 robust scripts (set -euo
  pipefail/traps/ShellCheck) [Adv], 308 parameter expansion & strings [Adv].
  **shell-bash track COMPLETE (8 lessons).**
- Course now **41 ordered lessons** (1→41). 428 tests pass, typecheck clean, build OK.

### ✅ Batch 9 — Python for Automation track (DONE, on main)
401 first steps, 402 types/lists/dicts, 403 control flow & functions, 404 files &
text (pathlib), 405 subprocess [Int], 406 JSON/APIs/HTTP [Int], 407 venv & pip [Int],
408 robust CLI tools (argparse/logging) [Adv], with cover. **python-automation track
COMPLETE (8 lessons).** Course now **49 ordered lessons** (1→49). 344 content tests
pass, build OK.

Tracks done so far (4 of 24): linux-fundamentals (18), linux-administration (15),
shell-bash (8), python-automation (8).

### ✅ Batch 10 — Networking track (DONE, on main)
501 OSI & TCP/IP models, 502 IP addressing & subnetting [Int], 503 Ethernet/MAC/
switching [Int], 504 routing fundamentals [Int], 505 TCP/UDP & ports [Int], 506 DNS
deep dive [Int], 507 DHCP & common services [Int], 508 troubleshooting & packet
analysis [Senior]. Cover added. **networking track COMPLETE (8 lessons).**
Course now **57 ordered lessons** (1→57). 400 content tests pass, build OK.

Tracks done (5 of 24): linux-fundamentals (18), linux-administration (15),
shell-bash (8), python-automation (8), networking (8).

### ✅ Batch 11 — Windows Administration + Windows Server & AD (DONE, on main)
- windows-administration (601–606): OS model/navigation, registry, users/groups/UAC,
  NTFS permissions, services/processes, event logs. **COMPLETE (6).** Cover added.
- windows-server-ad (701–706): Windows Server & roles, AD concepts, manage AD
  users/groups/computers (AGDLP), Group Policy [Adv], DNS/DHCP, AD security &
  hardening [Senior]. **COMPLETE (6).** Cover added.
Course now **69 ordered lessons** (1→69). 484 content tests pass, build OK.

Tracks done (7 of 24): linux-fundamentals (18), linux-administration (15),
shell-bash (8), python-automation (8), networking (8), windows-administration (6),
windows-server-ad (6).

## ▶️ Next up (Batch 12) — remaining tracks per `curriculum.json` order

powershell,
security, git-vcs, docker-containers, kubernetes, cicd, iac-terraform, config-ansible,
cloud-fundamentals, observability, databases, web-infra, virtualization, storage,
backup-dr-ha, sre-platform, troubleshooting-ir. (Add a track cover SVG as each starts;
use order 5xx for networking, 6xx for the next, etc., keeping global order increasing.)

### Then (subsequent batches), per `curriculum.json` track order
linux-administration → shell-bash → networking → security → git-vcs →
docker-containers → kubernetes → cicd → iac-terraform → config-ansible →
cloud-fundamentals → observability → databases → web-infra → windows-* →
powershell → storage → virtualization → backup-dr-ha → sre-platform →
troubleshooting-ir. Add track covers as each track starts.

### Backlog / nice-to-haves
- Add per-track cover SVGs (only Linux Fundamentals exists so far).
- Optional: a `/curriculum` overview page grouping tutorials by track/level
  (the existing `/linux-tutorials` filters already work; this is polish).
- Optional: migrate the 10 hand-written `content/tutorials/day-*.md` into the
  curriculum format (e.g. as a fast-track), so they auto-load too. Currently they
  remain separate paste-ready files and are NOT auto-imported.
- Consider relabeling the public "distribution" filter to "platform" now that it
  includes Windows/Cross-platform (small UI copy change in TutorialFilters).

---

## Conventions to keep
- Slugs are stable and unique; never reuse a slug for different content.
- Front matter `order` controls intra-track ordering (100s per module).
- Keep `summary` ≤ 500, `seoTitle` ≤ 70, `seoDescription` ≤ 200 (importer also
  truncates).
- Don't redesign working CMS parts. Don't add heavy dependencies.
- Validate (typecheck + test + import) and commit at the end of each batch, then
  update this ledger.
