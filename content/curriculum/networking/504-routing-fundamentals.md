---
title: "Networking — Routing Fundamentals"
slug: "networking-routing-fundamentals"
track: "networking"
trackName: "Networking"
module: "Core Protocols"
order: 504
level: "Intermediate"
difficulty: "Intermediate"
distribution: "Cross-platform"
category: "Networking"
tags: [networking, routing, gateway, nat, static-routes, intermediate]
cover: "/covers/curriculum/networking.svg"
estMinutes: 55
status: "published"
summary: "How packets cross between networks. Understand routers and routing tables, the default gateway, longest-prefix match, static vs dynamic routing, hop-by-hop forwarding, and NAT — how private networks share public IPs to reach the internet."
seoTitle: "Networking 4: Routing, Default Gateway, Longest-Prefix & NAT"
seoDescription: "Intermediate networking: routers and routing tables, default gateway, longest-prefix match, static vs dynamic routing, hop-by-hop forwarding, and NAT/PAT. Lab and assessment."
---

Layer 2 delivers within a network; **routing** (layer 3) is how packets travel
**between** networks — across the office, the data center, and the whole internet.
This lesson covers how routers decide where to send a packet (the **routing table**
and **longest-prefix match**), the **default gateway**, static vs dynamic routing,
the hop-by-hop journey of a packet, and **NAT** — the mechanism that lets a whole
private network share one public IP.

## Learning objectives

By the end of this lesson you will be able to:

- Explain what a **router** does and read a **routing table**.
- Describe the **default gateway** and **longest-prefix match**.
- Distinguish **static** vs **dynamic** routing.
- Trace a packet's **hop-by-hop** journey.
- Explain **NAT/PAT** and why private networks need it.

## Part 1 — Routers and routing tables

A **router** connects different networks and forwards **packets** between them based
on the **destination IP**. Every router (and every host) has a **routing table** —
a list of "to reach **this network**, send via **this next hop / interface**."

```bash
ip route                # the routing table (Linux)
ip route get 8.8.8.8    # exactly which route/next-hop would be used for this IP
```

A typical table:

```text
default via 192.168.1.1 dev eth0          # catch-all -> the default gateway
192.168.1.0/24 dev eth0 scope link        # directly connected (no gateway needed)
10.8.0.0/24 via 192.168.1.254 dev eth0    # a remote network via a specific router
```

Each entry is a **destination network** and how to reach it. A host's table is
usually just "my own subnet (connected)" + "everything else → default gateway."

## Part 2 — The default gateway and longest-prefix match

The **default gateway** (`0.0.0.0/0`, written `default`) is the **catch-all**: any
destination not matched by a more specific route goes there. For a typical host,
that's the router to the internet.

When multiple routes could match a destination, the router uses **longest-prefix
match**: the **most specific** (longest prefix) route wins.

```text
Packet to 10.8.0.50:
  matches 10.8.0.0/24 (a /24)   <- more specific, WINS
  also matches default /0       <- less specific, ignored
-> sent via 192.168.1.254
```

> [!IMPORTANT]
> **Most specific route wins, always** — a `/24` beats a `/16` beats the default
> `/0`, regardless of order in the table. This single rule governs every routing
> decision. `ip route get <ip>` shows you the winner directly, taking the match into
> account — the best routing-debug command there is. "Why did my traffic go the wrong
> way?" is almost always a more-specific route you forgot about.

## Part 3 — Static vs dynamic routing

How do routes get into the table?

- **Connected** — automatically, for each interface's own subnet.
- **Static** — an admin **manually** configures a route (`ip route add ...`, or
  persistent config). Simple, predictable, no overhead; but doesn't adapt to failures
  and is tedious at scale.
- **Dynamic** — routers **exchange** reachability with each other via a **routing
  protocol**, building tables automatically and **rerouting** around failures.

Common routing protocols (you'll meet these deeper in CCNA-level study):

| Protocol | Type | Used for |
|----------|------|----------|
| **OSPF** | link-state, interior | within an organization (fast convergence) |
| **EIGRP** | hybrid, interior | Cisco enterprise networks |
| **BGP** | path-vector, exterior | **between** organizations — runs the internet |

> [!TIP]
> Small/edge setups (a home, a single server, a simple branch) use **static** routes
> — explicit and easy to reason about. Larger networks use **dynamic** routing
> (OSPF/BGP) so paths adapt automatically when links fail. **BGP** is special: it's
> how independent networks (ISPs, clouds) exchange routes — it literally runs the
> internet. You don't need to configure BGP to be a great admin, but know what it is.

## Part 4 — A packet's hop-by-hop journey

Follow a packet from your laptop to a web server, tying together L2 and L3:

```text
1. Your host: dest IP is remote -> send the frame to the GATEWAY's MAC (ARP),
   but the packet's dest IP stays the server's IP.
2. Gateway/router: strips the frame, looks up the dest IP in its routing table
   (longest-prefix), picks the next hop, builds a NEW frame to the next router's MAC.
3. Each router repeats: same dest IP, new L2 frame per hop, TTL decremented by 1.
4. Final router: dest is on a connected network -> ARPs for the server, delivers.
```

Two invariants worth memorizing: the **destination IP stays the same** end-to-end,
while the **L2 frame (MACs) is rebuilt at every hop**; and the **TTL** (time to live)
decreases by 1 per router, preventing loops (hit 0 → packet dropped, which is how
`traceroute` works).

```bash
traceroute 1.1.1.1      # shows each router (hop) along the path
mtr 1.1.1.1             # live traceroute + per-hop loss/latency
```

## Part 5 — NAT: sharing public IPs

There aren't enough public IPv4 addresses for every device, and private ranges
(`10/8`, `172.16/12`, `192.168/16`) aren't routable on the internet. **NAT** (Network
Address Translation) solves both: the router **rewrites** private source addresses to
its **public** IP on the way out, and reverses it on replies — so a whole LAN shares
one public address.

The common form is **PAT** (Port Address Translation, a.k.a. "NAT overload"): many
inside hosts share one public IP, distinguished by **source port**:

```text
Inside 192.168.1.10:51000  -> Router rewrites to  203.0.113.5:40001  -> Internet
Reply to 203.0.113.5:40001 -> Router maps back to 192.168.1.10:51000
```

> [!IMPORTANT]
> NAT is why your devices have `192.168.x.x` addresses yet still reach the internet —
> the router translates them to its public IP. A consequence: outside hosts can't
> directly initiate connections **to** an inside host (there's no public address for
> it) without **port forwarding** — which is both a feature (security by default) and
> a hassle (hosting a service behind NAT needs explicit forwarding). IPv6, with
> abundant addresses, largely removes the *need* for NAT.

## Hands-on lab

```bash
# 1. Read your routing table and the default gateway
ip route
ip route | awk '/default/{print "gateway:", $3, "via", $5}'

# 2. Longest-prefix match in action
ip route get 8.8.8.8         # -> via the default gateway
ip route get 127.0.0.1       # -> loopback (most specific)
# (on a multi-subnet host, an IP in a connected subnet shows that interface)

# 3. Trace the hop-by-hop path (TTL at work)
traceroute -n 1.1.1.1 2>/dev/null | head || mtr -n --report -c 3 1.1.1.1

# 4. Add and remove a (non-persistent) static route, observe the table
GW=$(ip route | awk '/default/{print $3; exit}')
sudo ip route add 198.51.100.0/24 via "$GW"
ip route get 198.51.100.5    # see it chosen
sudo ip route del 198.51.100.0/24

# 5. See NAT conceptually: your private IP vs the public IP the world sees
ip -br addr | grep -vE '127.0.0.1|::1' | head     # your (likely private) IP
curl -s https://api.ipify.org 2>/dev/null && echo "  <- public IP (after NAT)"
```

## Exercises

1. Print your routing table and identify the default gateway, a connected route, and
   (if any) a static route.
2. Use `ip route get` for an internet IP, the loopback, and an IP in your own subnet;
   explain which route each matched and why (longest-prefix).
3. Add a non-persistent static route to a test subnet via your gateway, confirm it
   with `ip route get`, then remove it.
4. Run `traceroute`/`mtr` to a public host and explain what each hop represents and
   how TTL makes it work.
5. Explain in your own words how NAT/PAT lets ten devices on `192.168.1.0/24` browse
   the internet through one public IP.

## Troubleshooting

- **Can reach the local subnet but nothing else** — missing/wrong **default route**.
  *Fix:* `ip route` for a `default via ...`; add/correct it.
- **Traffic takes the wrong path** — a more-specific route overrides what you
  expected. *Fix:* `ip route get <ip>` to see the winner; review specific routes.
- **`traceroute` shows `* * *` at a hop** — that router doesn't reply to probes
  (filtered), not necessarily broken; loss only at the **final** hop matters.
- **Service unreachable from outside, fine internally** — it's behind **NAT** with no
  port forward. *Fix:* configure port forwarding/firewall, or use a public address.
- **Routing loop / TTL exceeded** — misconfigured routes; TTL hitting 0 drops the
  packet. *Fix:* find the conflicting routes; `ip route get` along the path.

Reproduce longest-prefix: `sudo ip route add 8.8.8.0/24 via $GW`, then `ip route get
8.8.8.8` matches your /24 over default; remove it and it falls back to the default
route.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).**

1. What does a router forward, and based on what?
2. What is the default gateway (in CIDR terms)?
3. State the rule for choosing among matching routes.
4. Which command shows exactly which route an IP would use?
5. Distinguish static from dynamic routing; name one dynamic protocol.
6. What runs routing **between** organizations / the internet?
7. In a packet's journey, what stays the same end-to-end and what changes per hop?
8. What problem does NAT solve, and what is PAT?
9. **Practical:** show your default gateway and the route to 8.8.8.8.
10. **Practical:** demonstrate longest-prefix match with a temporary route.

## Solutions & validation

1. **Packets**, based on the **destination IP** (via the routing table).
2. The **`0.0.0.0/0`** (`default`) catch-all route — used when nothing more specific
   matches.
3. **Longest-prefix (most specific) match** wins, regardless of table order.
4. `ip route get <ip>`.
5. **Static** = manually configured (simple, no adaptation); **dynamic** = routers
   exchange routes via a protocol and adapt (e.g. **OSPF**/BGP/EIGRP).
6. **BGP**.
7. The **destination IP** stays the same; the **L2 frame/MACs** are rebuilt per hop
   and **TTL** decrements.
8. NAT lets a **private network share a public IP** (and conserves IPv4); **PAT**
   maps many inside hosts to one public IP using **source ports**.
9. **Validation:** `ip route | grep default` and `ip route get 8.8.8.8`.
10. **Validation:** `ip route add 8.8.8.0/24 via $GW` → `ip route get 8.8.8.8` shows
    the /24; remove it to fall back to default.

> [!TIP]
> "Most specific route wins; default for everything else; MAC changes per hop, IP
> doesn't; NAT shares one public address" — these four ideas cover the vast majority
> of practical routing. `ip route get` is your truth-teller for any routing question.

## What's next

Next: **Lesson 505 — TCP, UDP & Ports.** Up to layer 4: how **ports** let one host
run many services, the difference between reliable **TCP** (with its three-way
handshake) and lightweight **UDP**, the well-known ports you must know, and how to
see connections and their states with `ss`.
