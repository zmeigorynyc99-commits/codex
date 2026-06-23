---
title: "Security — System Hardening"
slug: "security-system-hardening"
track: "security"
trackName: "Security & Defensive Operations"
module: "Defensive Operations"
order: 905
level: "Intermediate"
difficulty: "Advanced"
distribution: "Cross-platform"
category: "Security"
tags: [security, hardening, ssh, patching, cis-benchmark, attack-surface, sudo]
cover: "/covers/curriculum/security.svg"
estMinutes: 65
status: "published"
summary: "Turn a default install into a hardened server: patching and update discipline, reducing attack surface, securing SSH (keys, no root, no passwords), account and sudo policy, sysctl/kernel tuning, file permissions and SUID, and using CIS benchmarks plus tools like Lynis to measure your baseline."
seoTitle: "Security 5: System Hardening (SSH, patching, CIS, least privilege)"
seoDescription: "Harden Linux servers: patch management, attack-surface reduction, SSH hardening, sudo/account policy, sysctl, SUID/permissions, and CIS benchmarks with Lynis. Lab + assessment."
---

A fresh OS install is built for **convenience**, not security — open services, password
logins, permissive defaults. **Hardening** is the disciplined reduction of attack surface
and tightening of configuration until only what's needed remains, configured safely. This
lesson is a practical hardening playbook: **patching**, **service minimization**, **SSH
hardening**, **account/sudo policy**, **kernel/sysctl** settings, **file permissions/
SUID**, and how to **measure** your baseline with **CIS benchmarks** and **Lynis**.

## Learning objectives

By the end of this lesson you will be able to:

- Run a **patch/update** discipline and explain why it's the #1 control.
- **Reduce attack surface** (remove packages, disable/close services).
- **Harden SSH** (keys only, no root, restricted, fail2ban).
- Apply **least-privilege accounts** and safe **sudo** policy.
- Tighten **sysctl**, **file permissions**, and audit **SUID** binaries.
- Benchmark a host against **CIS** using **Lynis**/auditing tools.

## Part 1 — Patch management

Most breaches exploit **known, already-patched** vulnerabilities. Timely patching is the
highest-leverage thing you can do:

```bash
# Debian/Ubuntu
sudo apt update && sudo apt upgrade -y
sudo apt install unattended-upgrades          # automatic security updates
sudo dpkg-reconfigure -plow unattended-upgrades

# RHEL/Fedora
sudo dnf upgrade --security -y
sudo dnf install dnf-automatic                 # automated updates

# Audit what's installed / what has known CVEs
apt list --upgradable
```

- Prioritize **security** updates; automate them where you can, with monitoring/reboot
  windows.
- Track an **inventory** so you know what to patch; subscribe to vendor/CVE advisories.
- **Kernel** updates often need a reboot (or **livepatch**) — don't let uptime become a
  liability.

> [!IMPORTANT]
> "We were breached by a 0-day" is rare; "we were breached by a 6-month-old unpatched CVE"
> is the norm. **Patching is the single most important control.** Automate security
> updates, define a cadence for the rest, and keep an inventory so nothing is forgotten —
> the goal is to remove vulnerabilities before a threat finds them.

## Part 2 — Reduce attack surface

Every running service is a potential entry point. Remove what you don't need:

```bash
ss -tulpn                                # what's listening?
systemctl list-units --type=service --state=running
sudo systemctl disable --now <service>   # stop + disable unneeded services
sudo apt purge <package>                 # remove unneeded software entirely

# Bind services to localhost when only local access is needed (e.g. a DB)
#   in the service config: bind-address = 127.0.0.1
```

Principle: **if it isn't needed, remove it.** Fewer packages = fewer CVEs, less to patch,
smaller attack surface. Don't run a GUI/dev tools/compilers on production servers.

## Part 3 — SSH hardening

SSH is the most-attacked service on internet-facing Linux. Harden `/etc/ssh/sshd_config`:

```text
PermitRootLogin no                 # never log in directly as root
PasswordAuthentication no          # keys only — defeats brute force/credential stuffing
PubkeyAuthentication yes
AllowUsers deploy admin            # explicit allow-list of accounts
MaxAuthTries 3
LoginGraceTime 20
KbdInteractiveAuthentication no
X11Forwarding no
# Optionally: Port 2222 (reduces noise, NOT real security), AllowGroups ssh-users
```

```bash
# Generate a strong key (on your workstation) and install it
ssh-keygen -t ed25519 -C "you@host"
ssh-copy-id -i ~/.ssh/id_ed25519.pub deploy@server
sudo sshd -t && sudo systemctl reload sshd     # TEST config before reload!

# Add brute-force protection
sudo apt install fail2ban                       # bans IPs after repeated failures
```

> [!TIP]
> The big three for SSH: **keys only** (`PasswordAuthentication no`), **no root login**
> (`PermitRootLogin no`), and an **allow-list** of users — plus **fail2ban** and a
> **restricted source** (firewall/VPN, from Lesson 904). Always `sshd -t` and keep a second
> session open before reloading, so a typo doesn't lock you out.

## Part 4 — Accounts, sudo, and permissions

```bash
# Least-privilege accounts
sudo passwd -l root                      # lock direct root password login (use sudo)
awk -F: '($3>=1000)&&($1!="nobody"){print $1}' /etc/passwd   # human accounts review
awk -F: '($2==""){print $1" has NO password"}' /etc/shadow   # empty passwords (bad)

# sudo: grant specific commands, not blanket root; log everything
#   in /etc/sudoers.d/deploy:   deploy ALL=(ALL) /usr/bin/systemctl restart myapp
sudo visudo -c                           # validate sudoers syntax

# Password policy (libpam-pwquality) + lockout (pam_faillock)
# Permissions & SUID audit
find / -perm -4000 -type f 2>/dev/null   # SUID binaries — minimize; each is a risk
chmod 600 ~/.ssh/authorized_keys
find / -perm -2 ! -type l 2>/dev/null | head   # world-writable files (investigate)
```

- **Lock root**, use named accounts + **sudo** for accountability.
- Grant sudo for **specific commands**, not `ALL` — and it's logged.
- **Strong password policy**, account **lockout**, and disable unused accounts.
- Audit **SUID/SGID** and **world-writable** files — classic privilege-escalation vectors.

## Part 5 — Kernel/sysctl and benchmarking

```bash
# Network/kernel hardening (/etc/sysctl.d/99-hardening.conf), then: sudo sysctl --system
net.ipv4.conf.all.rp_filter=1            # anti-spoofing reverse-path filter
net.ipv4.tcp_syncookies=1                # SYN-flood protection
net.ipv4.conf.all.accept_redirects=0     # ignore ICMP redirects
net.ipv4.conf.all.accept_source_route=0
kernel.randomize_va_space=2              # full ASLR
fs.protected_hardlinks=1
fs.protected_symlinks=1
```

**Measure** rather than guess — benchmark against the **CIS Benchmarks** (vendor-neutral
hardening standards) and let a tool find gaps:

```bash
sudo apt install lynis
sudo lynis audit system        # scored report + concrete hardening suggestions
# Also: enable auditd (kernel audit log), and consider AppArmor/SELinux (MAC) enforcing.
```

> [!TIP]
> Don't harden from memory — harden to a **standard** and **measure**. Run **Lynis** for a
> quick scored baseline and the **CIS Benchmark** for your OS as the authoritative checklist
> (tools like OpenSCAP can scan against it). Re-scan after changes so you can prove the
> baseline improved and catch regressions.

## Hands-on lab

> Use a disposable VM. Keep a root console open in case SSH changes lock you out.

```bash
# 1. Baseline before
sudo lynis audit system | tee lynis-before.txt    # note the "Hardening index"

# 2. Patch
sudo apt update && sudo apt upgrade -y

# 3. Attack surface
ss -tulpn                                          # list exposed services
sudo systemctl disable --now <something-unneeded>  # e.g. an unused daemon

# 4. SSH hardening
sudo sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sudo sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo sshd -t && sudo systemctl reload sshd         # TEST then reload

# 5. Permissions/SUID audit
find / -perm -4000 -type f 2>/dev/null

# 6. sysctl hardening
printf 'net.ipv4.tcp_syncookies=1\nkernel.randomize_va_space=2\n' | \
  sudo tee /etc/sysctl.d/99-hardening.conf && sudo sysctl --system

# 7. Re-baseline — prove improvement
sudo lynis audit system | tee lynis-after.txt
diff <(grep 'Hardening index' lynis-before.txt) <(grep 'Hardening index' lynis-after.txt)
```

## Exercises

1. Set up automatic security updates and explain your patch cadence/reboot strategy.
2. List the listening services on a host and justify disabling or localhost-binding at
   least two.
3. Produce a hardened `sshd_config` (keys only, no root, allow-list) and show how you test
   it safely.
4. Write a sudoers rule granting one account permission to restart a single service only.
5. Find all SUID binaries on a system and explain why each is a potential risk.
6. Run Lynis before and after applying three changes and report the change in hardening
   index.

## Troubleshooting

- **Locked out after SSH changes** — disabled your own access. *Fix:* `sshd -t` first, keep
  a console, change one thing at a time.
- **Auto-updates broke a service** — untested patch. *Fix:* stage in non-prod, schedule
  reboot windows, monitor.
- **Disabled a service that was needed** — *Fix:* `ss -tulpn` + map services to apps before
  disabling; re-enable quickly.
- **sudoers typo locks out sudo** — *Fix:* always `visudo`/`visudo -c`; keep a root shell
  open.
- **SUID binary abused for privesc** — *Fix:* remove the SUID bit if not required
  (`chmod u-s`), keep packages patched.
- **Hardening with no measurement** — can't prove value. *Fix:* CIS/Lynis baseline before
  and after.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Justify briefly.

1. Why is patching considered the highest-leverage security control?
2. What does "reduce attack surface" mean in practice? Give two actions.
3. Name the three core SSH hardening settings.
4. Why lock root and use sudo with specific commands?
5. What risk do SUID binaries and world-writable files pose?
6. Name two sysctl hardening settings and what they defend against.
7. What is a CIS benchmark, and what does Lynis do?
8. Why test `sshd -t` and keep a console before reloading SSH?
9. **Practical:** show a hardened sshd_config diff and how you validate it.
10. **Practical:** run a before/after Lynis and report the hardening index change.

## Solutions & validation

1. Most breaches exploit **known, patched** CVEs; patching removes them before exploitation.
2. Remove/disable what isn't needed; e.g. `systemctl disable --now`, purge packages, bind to
   localhost.
3. **Keys only** (`PasswordAuthentication no`), **no root** (`PermitRootLogin no`),
   **AllowUsers** allow-list.
4. Accountability + least privilege; named accounts are logged, sudo limits/records actions.
5. Privilege-escalation vectors — SUID runs as owner (often root); world-writable lets
   anyone tamper.
6. e.g. `tcp_syncookies` (SYN floods), `randomize_va_space=2` (ASLR), `rp_filter`
   (spoofing).
7. CIS = vendor-neutral hardening checklist; **Lynis** scans and scores a host with
   suggestions.
8. A config typo can lock you out; `sshd -t` validates syntax, console = recovery path.
9. **Validation:** sshd_config shows `PermitRootLogin no` + `PasswordAuthentication no`,
   `sshd -t` passes.
10. **Validation:** the "Hardening index" rises between `lynis-before` and `lynis-after`.

> [!TIP]
> Hardening is **subtraction plus discipline**: patch relentlessly, remove what you don't
> need, lock down SSH and accounts, and tighten the kernel — then **measure against CIS/
> Lynis** so it's provable and repeatable. Bake the result into an image or config-
> management role so every new host is born hardened, not hardened by hand later.

## What's next

Next: **Lesson 906 — Logging, Monitoring & SIEM.** You can't defend what you can't see:
centralized logging, what to log, detection and alerting, and how a **SIEM** correlates
events across the fleet to surface attacks — the backbone of blue-team operations.
