==================================================================
HOW TO ADD THIS TUTORIAL (admin area)
------------------------------------------------------------------
1. Sign in at  https://botera.md/admin/login
2. Click  "New tutorial"
3. Copy each field below into the matching box.
4. Paste everything under "CONTENT (MARKDOWN)" into the big
   "Content (Markdown)" editor. Use "Show preview" to check it.
5. Set Status = Published (or Draft first), then Save.
   Tip: set the Publication date one day after Day 6.
==================================================================

TITLE:
Linux to DevOps Roadmap — Day 7: Firewalls & Server Hardening

URL SLUG:
linux-to-devops-day-7-firewalls-server-hardening

SUMMARY:
Day 7 of the Linux-to-DevOps roadmap. Lock the front door: configure the ufw
firewall to allow only the ports you need, harden SSH (no password or root login),
install fail2ban to ban brute-force attackers, and adopt the everyday habits that
keep an internet-facing server safe. About one hour, hands-on, with other-distro
and Windows notes.

CATEGORY:
Getting Started

TAGS:
linux, devops, roadmap, firewall, ufw, ssh-hardening, fail2ban, security, hardening, beginner

DIFFICULTY:
Beginner

DISTRIBUTION:
Ubuntu

AUTHOR:
botera

COVER IMAGE (paste this URL into the "Cover image" box):
https://botera.md/covers/linux-devops-day-7.svg

SEO TITLE:
Linux to DevOps — Day 7: ufw Firewall & SSH Hardening (Beginner)

SEO DESCRIPTION:
Day 7 of the Linux-to-DevOps roadmap: configure the ufw firewall, harden SSH
(disable password & root login), and install fail2ban to stop brute-force. ~1 hour.

------------------------------------------------------------------
CONTENT (MARKDOWN) — paste everything below this line
------------------------------------------------------------------

Welcome to **Day 7** of the **Linux to DevOps Roadmap**. Your server is now on the
internet (Day 6) — which means within minutes of going live, automated bots are
already knocking on its doors, trying common passwords and probing for open
ports. That's not paranoia; it's just what the internet is. Today you make your
server **boring to attackers**: you'll put up a **firewall**, **harden SSH** so
there's nothing to brute-force, and add **fail2ban** to automatically ban the bots
that keep trying.

This is the lesson that separates a hobby box from a server you can trust on the
public internet. None of it is hard — it's a handful of commands and good habits.

> [!NOTE]
> About an hour with the lab. Do this on a **cloud server you can afford to lock
> yourself out of while learning** (or a local VM). The single golden rule of this
> whole lesson: **never enable a firewall or restart SSH without first making sure
> you can still get in.** We'll build that safety habit into every step.

## Today's mission

- Understand what a **firewall** does and the "default deny" mindset.
- Configure **ufw**: allow SSH/HTTP/HTTPS, block everything else.
- **Harden SSH**: key-only login, no root login, sane settings.
- Install **fail2ban** to auto-ban brute-force attackers.
- Keep the system patched and adopt a short **hardening checklist**.

## Part 1 — What a firewall actually does

A **firewall** decides which network connections are allowed to reach your
machine. Every one of those listening ports you saw with `ss -tulpn` on Day 6 is a
potential way in. A firewall lets you say: "allow connections to ports 22, 80 and
443 — and silently drop everything else."

The professional default is **deny incoming, allow outgoing**:

- **Incoming** connections are blocked unless you explicitly allow them. Your
  server only opens the specific doors it needs.
- **Outgoing** connections are allowed, so the server can fetch updates, send
  email, call APIs, etc.

Ubuntu ships with **ufw** ("Uncomplicated Firewall") — a friendly front-end to the
kernel's powerful `nftables`/`iptables`. We'll use ufw; the concepts apply to any
firewall.

> [!IMPORTANT]
> Cloud providers have a **second, separate firewall** (AWS "security groups",
> DigitalOcean "cloud firewalls", etc.) that sits in front of your server. For a
> port to work, it must be open in **both** the cloud firewall **and** ufw. If a
> port is open in ufw but still unreachable, check the provider's firewall next.

## Part 2 — Configure ufw safely

Here's the safe order. **Allow SSH before you enable the firewall**, or you'll cut
off your own connection:

```bash
sudo ufw default deny incoming      # block all incoming by default
sudo ufw default allow outgoing     # allow the server to reach out
sudo ufw allow OpenSSH              # CRUCIAL: allow SSH *before* enabling
sudo ufw allow 'Nginx Full'        # opens both 80 (HTTP) and 443 (HTTPS)
```

`OpenSSH` and `Nginx Full` are named **application profiles** ufw ships with. You
can also allow raw ports:

```bash
sudo ufw allow 22/tcp              # same as OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

Now turn it on and check it:

```bash
sudo ufw enable                    # it warns this may disrupt SSH — you've allowed it, so confirm
sudo ufw status verbose            # review your rules
```

You should see `22`, `80` and `443` as `ALLOW`, with the default policy `deny
(incoming)`. Other useful commands:

```bash
sudo ufw status numbered           # rules with index numbers
sudo ufw delete 3                  # delete rule #3
sudo ufw allow from 203.0.113.5 to any port 22   # allow SSH only from ONE IP
sudo ufw disable                   # turn the firewall off (e.g. while debugging)
```

> [!TIP]
> Locking SSH to a single trusted IP (`ufw allow from YOUR_IP to any port 22`) is
> the strongest, simplest hardening there is — bots can't even *reach* the door.
> Only do this if you have a **static** home/office IP, or you'll lock yourself
> out when it changes. A safe alternative that survives mistakes is in Part 3's
> note about keeping a second session open.

## Part 3 — Harden SSH

SSH is the most attacked service on any server. After Day 6 you log in with
**keys**, so you can now switch passwords off entirely — removing the thing
attackers try to guess. Edit the SSH server config:

```bash
sudo nano /etc/ssh/sshd_config
```

Set (or uncomment and change) these lines:

```text
PermitRootLogin no              # never log in directly as root — use a normal user + sudo
PasswordAuthentication no       # keys only; nothing to brute-force
PubkeyAuthentication yes        # allow key-based login
ChallengeResponseAuthentication no
UsePAM yes
```

> [!IMPORTANT]
> **Before** you restart SSH, prove your key login works and keep a **second SSH
> session open** to the server. Then restart in the first session — if something
> went wrong you still have the open session to fix it. This one habit has saved
> countless admins from a panicked support-ticket lockout.

```bash
sudo sshd -t                    # test the config for syntax errors (like nginx -t)
sudo systemctl restart ssh      # apply (service is 'ssh' on Ubuntu, 'sshd' on RHEL)
```

Now open a **new** terminal and confirm you can still log in with your key. If
yes, you're done — password and root logins are off, and the only way in is your
private key.

Optional but nice: changing SSH to a non-standard port (e.g. 2222) cuts log noise
from bots. It's **obscurity, not security** — keys are what protect you — but it
does quieten the logs. If you do it, `sudo ufw allow 2222/tcp` first and update
your `~/.ssh/config` `Port`.

## Part 4 — fail2ban: auto-ban the bots

Even with key-only login, bots will hammer your SSH port forever. **fail2ban**
watches the logs and **temporarily bans** any IP that fails to log in too many
times — cutting the noise and stopping brute-force attempts cold.

```bash
sudo apt update && sudo apt install -y fail2ban
```

fail2ban works out of the box for SSH, but the right way to configure it is a
`jail.local` file (never edit `jail.conf` directly — upgrades overwrite it):

```bash
sudo nano /etc/fail2ban/jail.local
```

```text
[DEFAULT]
bantime  = 1h          # how long an IP stays banned
findtime = 10m         # window in which failures are counted
maxretry = 5           # failures allowed before a ban

[sshd]
enabled = true
```

Enable it as a service (Day 4 skills) and check on it:

```bash
sudo systemctl enable --now fail2ban
sudo fail2ban-client status            # which jails are active
sudo fail2ban-client status sshd       # banned IPs and failure counts
```

Within a day on a public server you'll see fail2ban has already banned a stream of
IPs that tried to break in. To unban an address you blocked by accident:

```bash
sudo fail2ban-client set sshd unbanip 203.0.113.5
```

## Part 5 — Patch, and a hardening checklist

The cheapest security win remains **keeping software updated** (Day 5). Make it a
habit, and consider automatic security updates:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure --priority=low unattended-upgrades   # auto-apply security patches
```

A short, real-world checklist for any new internet-facing server:

- [ ] A **normal user** with `sudo` exists; you don't log in as root.
- [ ] **SSH keys** work; **password auth disabled**; **root login disabled**.
- [ ] **ufw** is enabled, default-deny incoming, allowing only 22/80/443 (or your
      set).
- [ ] **fail2ban** is running and watching `sshd`.
- [ ] **Automatic security updates** are on.
- [ ] You **only run the services you need** — fewer open ports, smaller attack
      surface (`ss -tulpn` to audit).
- [ ] Backups exist (that's Day 9).

> [!TIP]
> Security is about **layers**, not one magic setting. Keys + firewall + fail2ban
> + updates each block a different attack. Together they make your server an
> unappealing, low-value target — which is exactly the goal. You don't need to be
> unbreakable; you need to be more trouble than you're worth.

## Hands-on lab: lock it down (safely)

```bash
# 0. SAFETY: confirm key login works and keep this session open in a 2nd terminal.

# 1. Firewall: allow what you need, THEN enable
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status verbose

# 2. Harden SSH (edit, test, restart — with a 2nd session open)
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak      # always back up first
sudo sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sudo sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo sshd -t                        # MUST print nothing (no errors)
sudo systemctl restart ssh
# -> now open a NEW terminal and confirm you can still log in.

# 3. fail2ban
sudo apt install -y fail2ban
printf '[sshd]\nenabled = true\nbantime = 1h\nmaxretry = 5\n' | sudo tee /etc/fail2ban/jail.local
sudo systemctl enable --now fail2ban
sudo fail2ban-client status sshd

# 4. Patch and confirm
sudo apt update && sudo apt upgrade -y

# 5. Audit your open ports
ss -tulpn
```

If, after all this, you can still log in with your key, your firewall shows only
the ports you intended, and `fail2ban-client status sshd` reports an active jail —
**your server is hardened**. Congratulations; this is a real production baseline.

## For Windows people

Windows Server has the same ideas with different tools — **Windows Defender
Firewall** (configurable via PowerShell) and account-lockout policies:

```powershell
# Firewall: block inbound by default, allow specific ports
New-NetFirewallRule -DisplayName "Allow HTTPS" -Direction Inbound -LocalPort 443 -Protocol TCP -Action Allow
Get-NetFirewallProfile                       # inspect profiles (Domain/Private/Public)
Set-NetFirewallProfile -DefaultInboundAction Block

# Remote management uses RDP (port 3389) or PowerShell Remoting / SSH.
# Account lockout (the fail2ban equivalent) is set via Group Policy / Local Security Policy.
```

> [!NOTE]
> Concept map: **ufw** ≈ **Windows Defender Firewall**; **SSH keys** ≈ smart-card
> / certificate auth; **fail2ban** ≈ **account-lockout policy**; **RDP (3389)** is
> the Windows equivalent of SSH (22) and should be firewalled just as carefully —
> exposed RDP is one of the most-attacked things on the internet.

## Common mistakes to avoid

- **Enabling ufw before allowing SSH** — instant lockout. Allow OpenSSH *first*,
  every time.
- **Restarting SSH without a second session open** — if the config is broken you
  lose your only way in. Keep a spare session and run `sshd -t` first.
- **Disabling password auth before keys work** — confirm key login *then* turn
  passwords off, not the other way around.
- **Editing `jail.conf` instead of `jail.local`** — your changes get wiped on
  upgrade. Always use `.local`.
- **Forgetting the cloud firewall** — a port must be open in both ufw and the
  provider's security group.
- **Opening ports "just in case"** — every open port is attack surface. Close what
  you don't use.

## Recap — what you learned today

- A **firewall** enforces "default deny incoming"; **ufw** makes it easy.
- Allow **SSH before enabling** ufw; open only the ports you need.
- **Harden SSH**: `PermitRootLogin no`, `PasswordAuthentication no`, test with
  `sshd -t`, restart with a spare session open.
- **fail2ban** auto-bans brute-force IPs; configure it in `jail.local`.
- **Patch** regularly and work through the hardening checklist; security is
  **layers**.

## Homework (15–20 minutes)

1. Enable ufw with default-deny, allowing only OpenSSH and Nginx Full; show
   `ufw status verbose`.
2. Back up `sshd_config`, disable root and password login, test with `sshd -t`,
   restart, and confirm key login still works (with a second session open!).
3. Install fail2ban, set `maxretry = 3`, and read `fail2ban-client status sshd`.
4. Run `ss -tulpn` and justify, out loud, why each listening port should be open —
   close any you can't justify.
5. Turn on `unattended-upgrades`.
6. (Optional) Try `ufw allow from YOUR_HOME_IP to any port 22` on a test box and
   observe how it locks SSH to one source.

## Common questions

**If I use key-only SSH, do I even need fail2ban?**
Keys make brute-force pointless, but fail2ban still cuts huge amounts of log noise,
protects *other* services, and reduces wasted server resources from constant bot
traffic. It's cheap defence-in-depth — keep it.

**ufw or nftables/iptables directly?**
For a single server, ufw is perfect and far less error-prone. `nftables` (and the
older `iptables`) is what ufw drives underneath; you'll meet it later when you need
fine-grained rules, but you rarely need to start there.

**I changed the SSH port — is that "more secure"?**
Marginally, and only against lazy bots — it's obscurity, not security. It quietens
logs but doesn't replace keys, a firewall, or fail2ban. Fine to do; don't rely on
it.

**How do I see who's been trying to get in?**
`sudo fail2ban-client status sshd` for bans, and `sudo journalctl -u ssh --since
today | grep -i fail` for raw attempts. On a public box you'll be amazed how much
there is.

## What's next — Day 8

Your server is reachable and secure. Time to make it **do work for you
automatically**. On **Day 8** we start **Bash scripting**: turning the commands
you've been typing by hand into reusable scripts — variables, `if` tests, loops,
functions, arguments and exit codes. It's the moment you stop being a person who
*runs* commands and become someone who *automates* them — the heart of DevOps.

Outstanding work — a hardened server is a milestone every professional respects.
Run the lab's safety steps until "allow SSH, then enable" is pure muscle memory.
