==================================================================
HOW TO ADD THIS TUTORIAL (admin area)
------------------------------------------------------------------
1. Sign in at  https://botera.md/admin/login
2. Click  "New tutorial"
3. Copy each field below into the matching box.
4. Paste everything under "CONTENT (MARKDOWN)" into the big
   "Content (Markdown)" editor. Use "Show preview" to check it.
5. Set Status = Published (or Draft first), then Save.
   Tip: set the Publication date one day after Day 5.
==================================================================

TITLE:
Linux to DevOps Roadmap — Day 6: Networking Fundamentals & SSH

URL SLUG:
linux-to-devops-day-6-networking-ssh

SUMMARY:
Day 6 of the Linux-to-DevOps roadmap. Learn how machines talk: IP addresses,
ports, DNS and the tools to inspect them (ip, ss, ping, dig, curl). Then master
SSH — key-based login, the config file, and copying files with scp and rsync —
the secure way you'll reach every server from now on. About one hour, hands-on,
with other-distro and Windows notes.

CATEGORY:
Getting Started

TAGS:
linux, devops, roadmap, networking, ssh, dns, ip, ssh-keys, scp, rsync, beginner

DIFFICULTY:
Beginner

DISTRIBUTION:
Ubuntu

AUTHOR:
botera

COVER IMAGE (paste this URL into the "Cover image" box):
https://botera.md/covers/linux-devops-day-6.svg

SEO TITLE:
Linux to DevOps — Day 6: Networking Basics & SSH Keys (Beginner)

SEO DESCRIPTION:
Day 6 of the Linux-to-DevOps roadmap: IP addresses, ports, DNS, and the tools to
inspect them — then SSH key login, config, and scp/rsync file copying. ~1 hour.

------------------------------------------------------------------
CONTENT (MARKDOWN) — paste everything below this line
------------------------------------------------------------------

Welcome to **Day 6** of the **Linux to DevOps Roadmap**. On Day 5 you stood up a
web server — but it was only reachable from the box itself. Today you connect it
to the world. You'll learn the **fundamentals of networking** (how a name like
`botera.md` turns into a server that answers a browser), the **tools to inspect**
a network, and then the single most important skill for any server admin: **SSH**,
the secure, encrypted way you'll log into and manage every machine from now on.

By the end of the hour you'll understand what's really happening when you type a
URL, and you'll log into a server with a key instead of a password — the
professional standard.

> [!NOTE]
> About an hour with the lab. The SSH parts are most rewarding with **two**
> machines: your laptop and a cloud server (even a $5/month VPS). No second box?
> You can still practise everything locally — `ssh localhost` works on most Linux
> machines once OpenSSH server is installed. Keep your `~/devops-lab` notes handy.

## Today's mission

- Understand **IP addresses**, **ports**, and **TCP** in plain language.
- Learn how **DNS** turns `botera.md` into an IP address.
- Inspect your network with **`ip`, `ss`, `ping`, `dig`/`host`, and `curl`**.
- Log into a server with **SSH**, then switch from passwords to **SSH keys**.
- Tidy your logins with an **SSH config** file.
- Copy files securely with **`scp`** and **`rsync`**.

## Part 1 — How machines find each other

When your browser loads `https://botera.md`, four things happen in about a
quarter of a second:

1. **DNS lookup** — your computer asks "what IP address is `botera.md`?" and gets
   back something like `203.0.113.10`. DNS is the internet's phone book: it maps
   human **names** to machine **addresses**.
2. **Connection** — your computer opens a **TCP** connection to that IP on a
   specific **port** (443 for HTTPS, 80 for plain HTTP).
3. **Request & response** — your browser asks for the page; the server answers.
4. **Render** — the browser draws the page.

Three concepts power all of it:

- **IP address** — the unique number of a machine on a network, like
  `203.0.113.10` (IPv4) or a longer `2001:db8::1` (IPv6). A **private** range
  like `192.168.x.x` or `10.x.x.x` is for your home/office LAN; a **public** IP
  is reachable from the internet.
- **Port** — a numbered "door" on a machine, so one server can run many services
  at once. SSH listens on **22**, HTTP on **80**, HTTPS on **443**. An address +
  a port (`203.0.113.10:443`) identifies one specific service.
- **TCP** — the protocol that makes a reliable, ordered connection between two
  ports. (Its cousin **UDP** is connectionless — used for DNS and video.)

> [!TIP]
> A useful mental model: the **IP address** is the building, the **port** is the
> apartment number, **TCP** is the conversation, and **DNS** is the directory that
> tells you the building's address from its name.

## Part 2 — Inspect your own machine

The modern tool for everything address-related is **`ip`** (it replaced the old
`ifconfig`). The `-br` flag gives a clean, "brief" view:

```bash
ip -br a            # your interfaces and their IP addresses (a = address)
ip route            # your routing table — note the "default via ..." gateway
hostname -I         # just your IP address(es), quick and dirty
```

`ip -br a` shows each network interface (`lo` is loopback/localhost, `eth0` or
`ens3` is your main link) and whether it's **UP**. The `default via` line in
`ip route` is your **gateway** — the door out to the rest of the network.

To see which **ports are open and listening** on your machine — a question you'll
ask constantly — use **`ss`** (it replaced `netstat`):

```bash
ss -tulpn
# t = TCP, u = UDP, l = listening, p = process, n = numeric ports
```

Each row tells you a service is listening on a port. After Day 5 you should see
something on `:80` (nginx). After today you'll see `:22` (sshd). If a service
"isn't reachable," the first question is always: **is it even listening?** `ss
-tulpn | grep :80` answers it in one line.

## Part 3 — Test connectivity and DNS

```bash
ping -c 4 1.1.1.1          # can I reach this IP at all? (4 packets, then stop)
ping -c 4 botera.md        # can I reach it by name? (this also proves DNS works)
```

If `ping 1.1.1.1` works but `ping botera.md` fails, your **network is fine but DNS
is broken** — a hugely common, instantly-diagnosable situation.

To look up DNS directly, use **`dig`** (install with `sudo apt install -y
dnsutils` if missing) or the simpler **`host`**:

```bash
dig +short botera.md       # just the IP address(es)
dig botera.md              # full answer: record type, TTL, the lot
host botera.md             # friendly one-liner
```

And to actually talk to a web server from the terminal — your Day 5 friend:

```bash
curl -I https://botera.md          # headers only: status code, server, etc.
curl -s https://botera.md | head   # first lines of the HTML
```

> [!IMPORTANT]
> **`curl localhost` works on the server but the site won't load from your
> browser** is the #1 beginner networking puzzle. It almost always means a
> **firewall** is blocking the port — either the server's `ufw` or the cloud
> provider's security group. We fix firewalls properly on **Day 7**. For now,
> remember the diagnostic order: is the service *listening* (`ss`), is the host
> *reachable* (`ping`), does the *name* resolve (`dig`), is the *port* open
> (firewall)?

## Part 4 — SSH: log into a server securely

**SSH** ("Secure Shell") gives you an encrypted terminal on a remote machine.
It's how virtually all Linux servers are administered. The basic form:

```bash
ssh username@server-ip
# e.g.
ssh alex@203.0.113.10
```

The first time you connect, SSH shows the server's **fingerprint** and asks you to
confirm. Type `yes`. This stores the server's identity in `~/.ssh/known_hosts` so
SSH can warn you if it ever changes (which could mean an imposter).

```bash
ssh alex@203.0.113.10 -p 22     # -p sets the port if SSH isn't on the default 22
ssh alex@203.0.113.10 'uptime'  # run ONE command remotely and return immediately
```

Once in, you're on the remote machine — every command you've learned (Days 1–5)
works exactly the same. Type `exit` (or press Ctrl+D) to come back.

> [!NOTE]
> No second machine? Practise locally. Install the server with `sudo apt install
> -y openssh-server`, confirm it's listening with `ss -tulpn | grep :22`, then
> `ssh localhost`. Everything below works against `localhost` too.

## Part 5 — Stop typing passwords: SSH keys

Passwords are weak and tedious. Professionals log in with a **key pair**: a
**private key** that never leaves your laptop, and a **public key** you copy to
the server. They mathematically prove your identity without ever sending a secret
over the wire.

**Step 1 — generate a key pair** (on your laptop, once):

```bash
ssh-keygen -t ed25519 -C "you@example.com"
# Press Enter to accept the default location (~/.ssh/id_ed25519).
# Set a passphrase when asked — it encrypts the private key on disk.
```

This creates two files:

- `~/.ssh/id_ed25519` — your **private** key. **Never share or copy this off your
  machine.**
- `~/.ssh/id_ed25519.pub` — your **public** key. Safe to hand out.

**Step 2 — copy the public key to the server:**

```bash
ssh-copy-id alex@203.0.113.10
# It logs in with your password ONE last time and installs the public key into
# the server's ~/.ssh/authorized_keys.
```

**Step 3 — log in with no password:**

```bash
ssh alex@203.0.113.10     # straight in, using the key
```

> [!IMPORTANT]
> Key permissions are strict on purpose. If SSH refuses your key, it's almost
> always permissions: `chmod 700 ~/.ssh` and `chmod 600 ~/.ssh/id_ed25519` (and
> on the server, `chmod 600 ~/.ssh/authorized_keys`). SSH **ignores** keys with
> permissions that are too open — a Day 3 lesson paying off.

Keys are the foundation of Day 7's hardening, where we'll **turn password login
off entirely** so attackers have nothing to guess.

## Part 6 — A tidy SSH config

Typing `ssh alex@203.0.113.10 -p 2222 -i ~/.ssh/work_key` every time is painful.
Define hosts once in `~/.ssh/config`:

```text
# ~/.ssh/config
Host botera
    HostName 203.0.113.10
    User alex
    Port 22
    IdentityFile ~/.ssh/id_ed25519

Host web1
    HostName 10.0.0.5
    User deploy
```

Now connecting is just:

```bash
ssh botera          # expands to ssh -i ~/.ssh/id_ed25519 alex@203.0.113.10
scp file.txt botera:    # the alias works with scp and rsync too
```

This small file is one of the biggest day-to-day quality-of-life wins in all of
server administration. Set `chmod 600 ~/.ssh/config`.

## Part 7 — Move files: scp and rsync

**`scp`** copies files over SSH — same idea as `cp`, but one side is `host:path`:

```bash
scp report.txt botera:/home/alex/            # local  -> remote
scp botera:/var/log/nginx/access.log .       # remote -> local (note the trailing .)
scp -r ./site botera:/var/www/               # -r for a whole directory
```

**`rsync`** is smarter: it copies **only what changed**, which makes repeated
deploys fast. It's the workhorse of real deployments:

```bash
rsync -avz ./site/ botera:/var/www/site/
# -a archive (preserve perms/times), -v verbose, -z compress in transit
rsync -avz --delete ./site/ botera:/var/www/site/
# --delete also removes files on the server that you deleted locally (mirror)
```

> [!TIP]
> Trailing slashes matter in `rsync`. `rsync ./site/ host:/dest/` copies the
> **contents** of `site` into `dest`. Without the trailing slash on the source,
> `rsync ./site host:/dest/` copies the **folder itself**, creating
> `/dest/site/`. When in doubt, test with `--dry-run` first — it shows what
> *would* happen without touching anything.

## Hands-on lab: inspect, connect, key, copy

```bash
# 1. Look at your own network
ip -br a
ip route
ss -tulpn          # what's listening? (you should see nginx on :80 from Day 5)

# 2. Prove the path to the internet and DNS separately
ping -c 3 1.1.1.1
ping -c 3 botera.md
dig +short botera.md
curl -I https://botera.md

# 3. (If you have OpenSSH server / a second box) generate a key
ssh-keygen -t ed25519 -C "lab key"      # accept defaults, set a passphrase
cat ~/.ssh/id_ed25519.pub               # this is the PUBLIC key — safe to share

# 4. Install it and log in without a password
ssh-copy-id alex@SERVER_IP              # or: ssh-copy-id localhost
ssh alex@SERVER_IP 'hostname && uptime' # one-shot remote command

# 5. Add a tidy alias in ~/.ssh/config (see Part 6), then:
ssh botera 'df -h /'                    # connect by alias

# 6. Copy a file each way
echo "hello from my laptop" > hello.txt
scp hello.txt botera:/tmp/
rsync -avz botera:/var/log/nginx/ ./nginx-logs/   # pull logs with rsync
```

If step 4 logs you in with **no password prompt**, you're now using key-based
authentication — the way you'll reach servers for the rest of your career.

## For Windows people

Modern Windows 10/11 ships with the **same OpenSSH client** — open PowerShell and
the commands are identical:

```powershell
ssh alex@203.0.113.10
ssh-keygen -t ed25519                 # keys land in C:\Users\you\.ssh\
scp file.txt alex@203.0.113.10:/tmp/
# Network inspection equivalents:
ipconfig                              # like ip a
Get-NetTCPConnection -State Listen    # like ss -tulpn
Resolve-DnsName botera.md             # like dig
Test-NetConnection botera.md -Port 443  # like ping + a port check in one
```

> [!NOTE]
> Concept map: **`ip a`** ≈ **`ipconfig`**; **`ss -tulpn`** ≈
> **`Get-NetTCPConnection`**; **`dig`** ≈ **`Resolve-DnsName`**; **`ping`** is the
> same on both. The `.ssh` folder and your keys live in your home directory on
> both systems. Windows admins also use SSH to manage Linux servers every day —
> these skills are universal.

## Common mistakes to avoid

- **Confusing "no route" with "no DNS"** — `ping` an IP *and* a name; if the IP
  works but the name doesn't, it's DNS, not connectivity.
- **Copying the private key** — only ever distribute the `.pub` file. The private
  key stays on your machine.
- **Wrong `.ssh` permissions** — SSH silently ignores keys if `~/.ssh` or the key
  file is too open. `700` for the folder, `600` for the keys.
- **Forgetting the port** — if SSH runs on a non-standard port, add `-p` (or set
  `Port` in `~/.ssh/config`).
- **rsync trailing-slash surprises** — use `--dry-run` until the slashes behave.
- **Editing `known_hosts` panic** — a "host key changed" warning after you
  *rebuilt* a server is normal; remove the old line with `ssh-keygen -R SERVER_IP`.

## Recap — what you learned today

- **IP + port + TCP + DNS** is how every connection works; a name resolves to an
  address, then you connect to a port.
- Inspect with **`ip -br a`**, **`ip route`**, **`ss -tulpn`**, **`ping`**,
  **`dig`/`host`**, and **`curl`**.
- **SSH** gives you a secure remote shell; **keys** (`ssh-keygen` + `ssh-copy-id`)
  replace passwords.
- **`~/.ssh/config`** turns long commands into short aliases.
- **`scp`** and **`rsync`** copy files securely; `rsync` only sends what changed.

## Homework (15–20 minutes)

1. Run `ss -tulpn` and write down every port your machine is listening on, and
   which process owns each.
2. Use `dig +short` on three sites you use daily and note their IPs.
3. Generate an `ed25519` key pair and inspect both files with `ls -l ~/.ssh`
   (check the permissions).
4. Set up password-less login to a server (or `localhost`) with `ssh-copy-id`.
5. Add at least one host to `~/.ssh/config` and connect by its alias.
6. Use `rsync -avz --dry-run` to preview copying a folder to a server, then do it
   for real.

## Common questions

**ed25519 or RSA for the key type?**
Use **ed25519** — it's modern, fast, and secure with short keys. RSA (4096-bit) is
still fine and occasionally needed for very old servers, but ed25519 is the
default choice today.

**What's the difference between SSH and a VPN?**
SSH secures one connection to one machine (a terminal, a file copy, a tunnel). A
VPN puts your whole device onto a remote network. Different tools; you'll meet
both. For administering servers, SSH is what you reach for.

**Do I have to set a passphrase on my key?**
Yes, in practice. The passphrase encrypts the private key so a stolen laptop
doesn't equal stolen servers. Use `ssh-agent` so you only type it once per
session — `ssh-add ~/.ssh/id_ed25519`.

**My connection "hangs" — is it broken?**
Often it's a firewall silently dropping packets (you'll get a timeout, not a
refusal). `ssh -v` (verbose) shows exactly where it stalls. Firewalls are Day 7.

## What's next — Day 7

You can now reach any server securely — which means it's time to **lock the front
door**. On **Day 7** we cover **firewalls and server hardening**: configuring
`ufw` to allow only the ports you need, **hardening SSH** (disabling password
login and root login), installing **fail2ban** to ban brute-force attackers, and
the handful of habits that keep an internet-facing server safe.

Excellent work — networking and SSH are the bedrock of operations. Rebuild the key
-login lab from memory before moving on; you'll do it a thousand times.
