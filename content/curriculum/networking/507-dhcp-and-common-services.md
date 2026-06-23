---
title: "Networking — DHCP & Common Network Services"
slug: "networking-dhcp-and-common-services"
track: "networking"
trackName: "Networking"
module: "Core Protocols"
order: 507
level: "Intermediate"
difficulty: "Intermediate"
distribution: "Cross-platform"
category: "Networking"
tags: [networking, dhcp, services, ntp, proxy, intermediate]
cover: "/covers/curriculum/networking.svg"
estMinutes: 45
status: "published"
summary: "How devices get configured automatically, and the services that make a network usable. The DHCP DORA process and what it hands out, plus a practical tour of common network services — NTP, proxies, VPN, load balancers — and where each fits."
seoTitle: "Networking 7: DHCP (DORA) & Common Network Services"
seoDescription: "Intermediate networking: how DHCP assigns IPs (DORA), leases and options, plus a tour of common services — NTP, proxies, VPNs, load balancers, firewalls. Lab and assessment."
---

A device plugs into a network and — magically — has an IP, a gateway, and working
DNS. That magic is **DHCP**. This lesson explains how DHCP assigns configuration
automatically (the **DORA** process), what else it hands out, and then tours the
**common network services** that turn raw connectivity into a usable network — NTP,
proxies, VPNs, load balancers, firewalls — and where each fits. It rounds out the
protocols before the troubleshooting capstone.

## Learning objectives

By the end of this lesson you will be able to:

- Explain how **DHCP** assigns IP configuration (the **DORA** steps).
- List what DHCP provides beyond an IP (gateway, DNS, etc.).
- Understand **leases**, renewal, and reservations.
- Recognize the role of common services: **DNS, NTP, proxy, VPN, load balancer,
  firewall**.
- Diagnose common DHCP failures (e.g. APIPA `169.254`).

## Part 1 — DHCP: automatic configuration

**DHCP** (Dynamic Host Configuration Protocol) hands a newly-connected device a full
network configuration, so humans don't assign addresses by hand. It runs over **UDP**
(server port **67**, client **68**) and uses **broadcast** (the client has no IP yet).
The exchange is four steps — **DORA**:

```text
1. DISCOVER  client broadcasts "any DHCP servers out there?"
2. OFFER     server(s) reply "you can have 192.168.1.50, here's the config"
3. REQUEST   client broadcasts "I'll take 192.168.1.50 (from server X)"
4. ACK       server confirms "it's yours for <lease time>"
```

> [!TIP]
> Remember **DORA** (Discover, Offer, Request, Acknowledge). It's broadcast-based and
> UDP precisely because the client starts with **no IP and no idea who the server
> is**. A handy mnemonic for exams and for reasoning about why DHCP needs to work at
> **layer 2 broadcast** before layer 3 is even possible.

## Part 2 — What DHCP provides (it's not just an IP)

A DHCP offer typically includes a bundle of **options**:

- **IP address** + **subnet mask** (your layer-3 identity).
- **Default gateway** (router) — so you can reach other networks.
- **DNS servers** — so names resolve.
- **Lease time** — how long the address is yours.
- Often: **domain/search suffix**, **NTP servers**, **WINS**, boot options (PXE), etc.

This is why one misconfigured DHCP server breaks *everything* — a wrong gateway or DNS
in the offer disables routing or name resolution network-wide.

```bash
# Linux: see your DHCP-assigned config
ip -br addr; ip route                 # IP + gateway you received
resolvectl status 2>/dev/null | grep -i dns   # DNS servers handed out
# Lease details (varies by distro):
ls /var/lib/dhcp/ 2>/dev/null; journalctl -u systemd-networkd --no-pager | tail
```

## Part 3 — Leases and reservations

DHCP addresses are **leased**, not permanent. The client **renews** at roughly half
the lease time; if the server is gone past the lease, the address is released.

- **Dynamic pool** — a range the server hands out to anyone (e.g. `.100–.200`).
- **Reservation** (static DHCP) — a specific MAC always gets a specific IP. The clean
  way to give a server/printer a stable address *without* hand-configuring it.
- **Static (manual) IP** — set on the device itself, **outside** DHCP (used for
  infra: routers, the DHCP server itself, key servers). Keep static IPs **outside the
  dynamic pool** to avoid conflicts.

> [!IMPORTANT]
> A device showing a **`169.254.x.x`** address (APIPA / link-local) means it **failed
> to get a DHCP lease** — no server responded (server down, wrong VLAN, broken link,
> or pool exhausted). It's a clear diagnostic signal: the problem is DHCP/L2, not DNS
> or routing. And **two DHCP servers** on one LAN (e.g. a rogue home router) cause
> chaotic, conflicting offers — a classic "random devices can't connect" cause.

## Part 4 — A tour of common services

Beyond addressing and naming, these services appear on nearly every network. Know
what each does and roughly where it sits:

| Service | Purpose | Note |
|---------|---------|------|
| **DNS** | name ↔ IP resolution | covered in Lesson 506; port 53 |
| **NTP** | keep clocks synchronized | UDP 123; drift breaks TLS/auth/logs |
| **Proxy** | intermediary for web traffic (caching, filtering, egress control) | forward proxy (clients) vs reverse proxy (servers) |
| **Reverse proxy / Load balancer** | distribute traffic across backend servers; TLS termination | nginx/HAProxy; web-infra track |
| **VPN** | encrypted tunnel joining remote hosts/networks | WireGuard/OpenVPN/IPsec |
| **Firewall** | filter traffic by rules (allow/deny per port/IP) | host + network; security track |
| **Mail (SMTP/IMAP)** | send/receive email | 25/465/587, 143/993 |

You've already met DNS, NTP and firewalls in the Linux track; they reappear here as
**network** services because the whole network depends on them. Proxies, VPNs and
load balancers get full treatment in the security, web-infra and SRE tracks — for now,
recognize their roles so a network diagram makes sense.

> [!TIP]
> Two distinctions worth fixing now: a **forward proxy** sits in front of **clients**
> (controls/filters their outbound access); a **reverse proxy** sits in front of
> **servers** (load-balances and terminates TLS for inbound traffic). And a **VPN**
> extends a private network across the public internet via an **encrypted tunnel** —
> different from a proxy, which forwards specific application traffic.

## Hands-on lab

```bash
# 1. What did DHCP give you? (IP, gateway, DNS)
ip -br addr | grep -v '127.0.0.1'
ip route | grep default
resolvectl status 2>/dev/null | grep -i 'DNS Server' | head || cat /etc/resolv.conf

# 2. Watch a DHCP exchange on the wire (renew/request; needs an active lease)
sudo tcpdump -i any -c 6 -n 'port 67 or port 68' &
# trigger traffic if safe on a lab machine:
# sudo dhclient -v <iface>   # (re)request a lease  -- only on a disposable VM!
sleep 2; wait 2>/dev/null || echo "(no DHCP traffic captured; that's fine)"

# 3. Recognize an APIPA failure signature (concept)
echo "169.254.x.x => DHCP failed (no server/lease); not a DNS/routing problem"

# 4. NTP / time sync status (ties to the admin track)
timedatectl | grep -E 'synchronized|NTP'

# 5. Identify services you depend on
ip route | awk '/default/{print "gateway (router):", $3}'
resolvectl status 2>/dev/null | awk '/DNS Servers/{print "DNS:", $0}' | head
```

## Exercises

1. From your machine, list the four things DHCP most likely provided: IP, subnet,
   gateway, and DNS servers (use `ip`/`resolvectl`).
2. Describe the DORA process in your own words, naming the broadcast/unicast nature
   and the UDP ports involved.
3. Explain the difference between a DHCP **reservation** and a **statically
   configured** IP, and when you'd use each.
4. A laptop has `169.254.10.5`. List three possible causes and the layer/service you'd
   investigate first.
5. Match each service to its job: NTP, forward proxy, reverse proxy, VPN, firewall.

## Troubleshooting

- **`169.254.x.x` address / no connectivity** — DHCP failed. *Fix:* check the link/
  VLAN, the DHCP server (up? pool exhausted?), and try renewing
  (`dhclient`/reconnect); it's not DNS or routing.
- **Got an IP but no internet** — bad **gateway/DNS** in the offer, or rogue DHCP
  server. *Fix:* verify gateway (`ip route`) and DNS; look for a second DHCP server.
- **Intermittent/conflicting addresses** — **two DHCP servers** or static IPs inside
  the dynamic pool. *Fix:* one DHCP server; keep statics outside the pool.
- **Address changes unexpectedly** — short lease + dynamic pool. *Fix:* use a
  **reservation** for devices that need a stable IP.
- **Clocks wrong across the network** — NTP not reaching its servers. *Fix:* allow
  UDP 123; verify with `timedatectl` (Lesson 211).

Reproduce the APIPA signal mentally: unplug from DHCP (or block it) and the OS falls
back to `169.254.x.x` — instantly telling you "no DHCP lease," which narrows the
problem to the DHCP/link layer.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).**

1. What does DHCP do, and over what protocol/ports?
2. Name and describe the four DORA steps.
3. Why must DHCP work via broadcast at layer 2?
4. List four things a DHCP offer typically includes.
5. What's the difference between a DHCP reservation and a static IP?
6. What does a `169.254.x.x` address indicate?
7. Why are two DHCP servers on one LAN a problem?
8. Distinguish a forward proxy, a reverse proxy, and a VPN.
9. **Practical:** show the gateway and DNS servers you received.
10. **Practical:** name the command to check NTP/time sync status.

## Solutions & validation

1. **Auto-assigns IP configuration** to clients; **UDP** ports **67** (server)/**68**
   (client).
2. **Discover** (client broadcasts), **Offer** (server proposes config), **Request**
   (client accepts), **Acknowledge** (server confirms with a lease).
3. The client has **no IP and no known server** yet, so it must **broadcast** at L2.
4. Any four: **IP, subnet mask, default gateway, DNS servers, lease time, domain/
   search, NTP**.
5. A **reservation** ties a MAC to a fixed IP **via DHCP** (centralized); a **static
   IP** is configured **on the device** outside DHCP (for infra).
6. **DHCP failed** (no lease) — APIPA/link-local fallback.
7. They send **conflicting offers**, causing inconsistent/duplicate configuration and
   random connectivity failures.
8. **Forward proxy** fronts **clients** (filter/cache outbound); **reverse proxy**
   fronts **servers** (load-balance/TLS inbound); **VPN** = encrypted tunnel joining
   networks over the internet.
9. **Validation:** `ip route | grep default` (gateway) and `resolvectl status` /
   `/etc/resolv.conf` (DNS).
10. **Validation:** `timedatectl` (look for `System clock synchronized`/`NTP`).

> [!TIP]
> "DORA over UDP 67/68, broadcast because the client has no IP; `169.254` means it
> failed" covers DHCP for practical purposes. And recognizing the common services —
> DNS, NTP, proxy, reverse proxy/LB, VPN, firewall — lets you read any network diagram
> and know what each box is doing.

## What's next

Next: **Lesson 508 — Network Troubleshooting & Packet Analysis.** The capstone: a
methodical, layered workflow to diagnose any network problem, the essential toolkit
(`ping`, `traceroute`/`mtr`, `ss`, `dig`, `curl`, `nc`), and a real introduction to
reading packets with `tcpdump` and Wireshark — turning everything in this track into
a repeatable diagnostic skill.
