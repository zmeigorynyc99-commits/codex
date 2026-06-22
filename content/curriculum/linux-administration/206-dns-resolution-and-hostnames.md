---
title: "Linux Administration — DNS Resolution & Hostnames"
slug: "linux-admin-dns-resolution-and-hostnames"
track: "linux-administration"
trackName: "Linux System Administration"
module: "Networking Configuration"
order: 206
level: "Intermediate"
difficulty: "Intermediate"
distribution: "Ubuntu"
category: "Linux Administration"
tags: [linux, dns, resolv-conf, systemd-resolved, hostname, hosts, intermediate]
cover: "/covers/curriculum/linux-administration.svg"
estMinutes: 55
status: "published"
summary: "Make name resolution work and stay fixed. Configure how a server resolves names with /etc/hosts, /etc/resolv.conf and systemd-resolved, set the machine's hostname properly, understand the resolution order, and debug the classic 'ping by IP works but by name fails' problem with dig and resolvectl."
seoTitle: "Linux Administration 6: DNS Resolution, resolv.conf & Hostnames"
seoDescription: "Intermediate Linux: configure name resolution with /etc/hosts, systemd-resolved and resolv.conf, set hostnames, and debug DNS with dig/resolvectl. Lab + assessment."
---

A static IP (Lesson 205) puts your server on the network, but humans and software
reach things by **name**, not number. **DNS** — and the local resolver
configuration around it — turns `botera.md` into an IP. When DNS is misconfigured, a
server can have perfect connectivity yet "nothing works," because every name lookup
fails. This lesson makes name resolution reliable and teaches you to debug the
single most common networking puzzle: **"ping by IP works, ping by name doesn't."**

## Learning objectives

By the end of this lesson you will be able to:

- Explain the **name-resolution order** (hosts file → DNS resolver).
- Use **`/etc/hosts`** for static local mappings.
- Understand **`/etc/resolv.conf`** and modern **`systemd-resolved`**.
- Set the system **hostname** with `hostnamectl`.
- Debug resolution with **`dig`**, **`host`**, **`getent`** and **`resolvectl`**.

## Part 1 — How a name becomes an address

When something resolves a name, the system follows an order defined in
`/etc/nsswitch.conf` (the `hosts:` line), but in practice it's:

1. **`/etc/hosts`** — a static, local file of name→IP mappings. Checked **first**;
   an entry here wins over DNS.
2. **DNS** — if not found locally, the configured **DNS resolver** is queried over
   the network.

```bash
getent hosts botera.md          # resolves a name the SAME way programs do (hosts + DNS)
```

> [!TIP]
> Use **`getent hosts <name>`** to test resolution as your applications actually
> experience it — it consults the full `nsswitch` chain (hosts file *and* DNS),
> whereas `dig` queries DNS **only**. If `getent` resolves but `dig` doesn't (or vice
> versa), that difference itself tells you where the answer is coming from.

## Part 2 — /etc/hosts: static local mappings

`/etc/hosts` maps names to IPs without any DNS. It's perfect for the loopback
entries, small fixed mappings, and overriding a name during testing:

```text
127.0.0.1   localhost
127.0.1.1   myserver                 # this machine's own hostname (Debian/Ubuntu style)
10.0.0.10   db01 db01.internal       # a fixed internal host, with an alias
```

```bash
sudo nano /etc/hosts                 # add a mapping
getent hosts db01                    # confirm it resolves locally
```

> [!IMPORTANT]
> Because `/etc/hosts` is checked **before** DNS, an entry here **overrides** the
> real DNS answer for that name. That's powerful for testing (point a name at a
> staging server) but a classic foot-gun: a stale hosts entry can send traffic to
> the wrong place and survive every DNS fix you try. When a name resolves
> "impossibly wrong," **check `/etc/hosts` first**.

## Part 3 — The resolver: resolv.conf and systemd-resolved

DNS server settings traditionally live in **`/etc/resolv.conf`**:

```text
nameserver 1.1.1.1
nameserver 8.8.8.8
search example.com               # append this domain to bare names
```

On modern Ubuntu, **`systemd-resolved`** manages DNS, and `/etc/resolv.conf` is
usually a **symlink** to a file it generates — so editing it by hand gets
overwritten. Work *with* resolved instead:

```bash
ls -l /etc/resolv.conf                 # often -> ../run/systemd/resolve/stub-resolv.conf
resolvectl status                      # the REAL DNS servers per interface (authoritative)
resolvectl query botera.md             # resolve via systemd-resolved
```

You normally set DNS servers **where you set the IP** (Lesson 205) — Netplan's
`nameservers:` or `nmcli ... ipv4.dns` — and `systemd-resolved` picks them up. That
keeps everything in one place and survives reboots.

> [!IMPORTANT]
> On systemd-resolved systems, **don't hand-edit `/etc/resolv.conf`** — it's
> regenerated and your change vanishes (a confusing "my DNS keeps reverting"
> symptom). Set DNS in your **Netplan/NetworkManager** config instead, and use
> **`resolvectl status`** (not `cat /etc/resolv.conf`) to see the DNS servers
> actually in effect.

## Part 4 — The hostname

A server's **hostname** is its own name. Set it properly with `hostnamectl` (it
updates the running system and persists it):

```bash
hostnamectl                            # current hostname and machine info
sudo hostnamectl set-hostname web01    # set a new static hostname
hostname                               # short name now
hostnamectl status                     # confirm
```

Also ensure `/etc/hosts` has a line mapping the hostname to `127.0.1.1` (Debian/
Ubuntu) so local tools resolve the machine's own name without DNS. A correct
hostname matters for logs, clustering, mail, and many services that identify
themselves by it.

## Part 5 — Debugging resolution with dig

`dig` is the precise DNS query tool (install `dnsutils`/`bind-utils` if missing):

```bash
dig botera.md                          # full answer: records, TTL, which server answered
dig +short botera.md                   # just the IP(s)
dig botera.md @1.1.1.1                 # ask a SPECIFIC DNS server (bypass local config)
dig MX example.com                     # mail records; also try A, AAAA, NS, TXT, CNAME
dig +trace botera.md                   # follow the resolution from the root servers
host botera.md                         # friendly one-liner
```

The **"ping by IP works, by name fails"** diagnosis is a clean decision tree:

```bash
ping -c2 1.1.1.1            # IP works? -> network/routing is FINE; it's DNS.
dig +short botera.md        # empty/timeout? your resolver isn't answering...
dig +short botera.md @1.1.1.1   # works against a public server? -> your LOCAL DNS config is wrong
getent hosts botera.md      # how the SYSTEM resolves it (hosts + DNS) — catches /etc/hosts overrides
resolvectl status           # what DNS servers are actually configured
```

If `dig @1.1.1.1` resolves but your default `dig` doesn't, your **local resolver
configuration** is the problem (no nameserver set, wrong server, resolved
misconfigured) — fix it in Netplan/NetworkManager (Part 3).

## Hands-on lab

```bash
# 1. See the current resolution setup
ls -l /etc/resolv.conf
resolvectl status | sed -n '1,20p'
getent hosts localhost

# 2. Static mapping via /etc/hosts
sudo cp /etc/hosts /etc/hosts.bak
echo "203.0.113.99   testhost.local testhost" | sudo tee -a /etc/hosts
getent hosts testhost           # resolves to 203.0.113.99 — no DNS involved
ping -c1 testhost 2>/dev/null || echo "(name resolves even if host is unreachable)"

# 3. Show that /etc/hosts overrides DNS (override a real name on THIS box only)
echo "127.0.0.1   example.com" | sudo tee -a /etc/hosts
getent hosts example.com        # now 127.0.0.1 locally — the override in action
# revert the experiment
sudo cp /etc/hosts.bak /etc/hosts

# 4. DNS queries
dig +short botera.md
dig +short botera.md @1.1.1.1   # ask a specific public resolver
dig MX gmail.com +short | head

# 5. Hostname
hostnamectl status
# sudo hostnamectl set-hostname lab01   # (optional; revert afterwards)

# 6. The diagnosis tree in action
ping -c2 1.1.1.1
getent hosts botera.md
resolvectl status | grep -i 'DNS Servers' | head
```

## Exercises

1. Use `getent hosts` to resolve three names and note which come from `/etc/hosts`
   vs DNS.
2. Add a static mapping for `app.internal` to a private IP in `/etc/hosts`, confirm
   it resolves, then remove it.
3. Demonstrate that `/etc/hosts` overrides DNS by pointing a real domain at
   `127.0.0.1` locally, confirming with `getent`, then reverting.
4. Find the actual DNS servers your system is using with `resolvectl status` (not by
   reading `/etc/resolv.conf`). Why is that distinction important on Ubuntu?
5. Walk the "ping by IP works but by name fails" tree and write the command at each
   step and what each result would tell you.

## Troubleshooting

- **"ping by IP works, by name fails"** — DNS/resolver problem, not connectivity.
  *Fix:* `dig @1.1.1.1 name` (works? → local resolver misconfigured; set DNS in
  Netplan/NM). Check `/etc/hosts` for a stale override with `getent`.
- **My `/etc/resolv.conf` changes keep reverting** — `systemd-resolved` regenerates
  it. *Fix:* set DNS in Netplan/NetworkManager; verify with `resolvectl status`.
- **A name resolves to the wrong IP no matter what** — a leftover **`/etc/hosts`**
  entry overriding DNS. *Fix:* remove the stale line.
- **Slow connections / long pauses before responses** — often a broken **reverse**
  DNS or an unreachable secondary nameserver. *Fix:* check `resolvectl status`;
  remove dead nameservers; verify with `dig`.
- **`hostname` resolves with errors / sudo is slow** — the hostname isn't in
  `/etc/hosts`. *Fix:* add a `127.0.1.1  <hostname>` line.

Reproduce the override gotcha with lab step 3: point `example.com` at `127.0.0.1` in
`/etc/hosts`, watch `getent` return the wrong answer, and feel how a stale entry can
mislead you — then revert.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Run the practical items.

1. In what order does the system resolve a name (two sources)?
2. What is `/etc/hosts` for, and what's the risk of a stale entry?
3. Why shouldn't you hand-edit `/etc/resolv.conf` on a systemd-resolved system?
4. Which command shows the DNS servers actually in effect?
5. How do you set a server's hostname so it persists?
6. What's the difference between `getent hosts` and `dig` for testing resolution?
7. How do you query a specific DNS server with `dig`, and when is that useful?
8. Give the diagnostic sequence for "ping IP works, ping name fails."
9. **Practical:** resolve a name two ways — via the system resolver and via a
   specific public DNS server. Commands?
10. **Practical:** show your machine's hostname and DNS servers. Commands?

## Solutions & validation

1. **`/etc/hosts` first**, then **DNS** (per `/etc/nsswitch.conf`).
2. Static, local **name→IP mappings** checked before DNS; a stale entry silently
   **overrides** the real DNS answer and is easy to overlook.
3. **`systemd-resolved` regenerates it**, so manual edits are overwritten; set DNS in
   Netplan/NetworkManager instead.
4. `resolvectl status`.
5. `sudo hostnamectl set-hostname <name>` (updates and persists it).
6. `getent hosts` resolves the way **applications do** (hosts file **and** DNS via
   nsswitch); `dig` queries **DNS only**.
7. `dig name @<server>` (e.g. `@1.1.1.1`); useful to **bypass local config** and test
   whether DNS itself works.
8. Ping an IP (works ⇒ network fine), `dig +short name` (fails?), `dig +short name
   @1.1.1.1` (works ⇒ local resolver broken), `getent hosts name` (catches `/etc/
   hosts` overrides), `resolvectl status` (see configured servers).
9. **Validation:** `getent hosts botera.md` (system) and `dig +short botera.md
   @1.1.1.1` (specific server) both return an address.
10. **Validation:** `hostnamectl status` (hostname) and `resolvectl status` (DNS
    servers).

> [!TIP]
> Name resolution sits between "the network works" and "my app works," so it's a
> frequent hidden culprit. The two-line reflex — `getent hosts <name>` to see the
> system's answer and `dig @1.1.1.1 <name>` to test DNS in isolation — pinpoints the
> layer fast.

## What's next

Next: **Lesson 207 — Routing & Multiple Interfaces** *(Advanced)*. You'll go deeper
into how a server decides where to send packets: reading and editing the routing
table with `ip route`, adding **persistent** static routes, handling **multiple
network interfaces**, and the basics of policy routing — essential for servers that
straddle several networks.
