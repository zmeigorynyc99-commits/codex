---
title: "Linux Administration — Routing & Multiple Interfaces"
slug: "linux-admin-routing-and-multiple-interfaces"
track: "linux-administration"
trackName: "Linux System Administration"
module: "Networking Configuration"
order: 207
level: "Advanced"
difficulty: "Advanced"
distribution: "Ubuntu"
category: "Linux Administration"
tags: [linux, routing, ip-route, interfaces, gateway, networking, advanced]
cover: "/covers/curriculum/linux-administration.svg"
estMinutes: 65
status: "published"
summary: "Control how a server decides where to send packets. Read and edit the routing table with ip route, understand the default gateway and longest-prefix match, add persistent static routes via Netplan, handle servers with multiple interfaces, and grasp the basics of policy routing and IP forwarding."
seoTitle: "Linux Administration 7: Routing, ip route & Multiple Interfaces"
seoDescription: "Advanced Linux: read/edit the routing table with ip route, default gateways, longest-prefix match, persistent static routes, multi-homed servers, forwarding and policy routing basics. Lab + assessment."
---

Every packet a server sends faces one question: *which way out?* The answer comes
from the **routing table**. For a simple single-interface box it's automatic, but
real servers — ones that sit on a public and a private network, reach a separate
storage subnet, or act as gateways — need you to **understand and control** routing.
This **Advanced** lesson teaches you to read the table, add **persistent** routes,
manage **multiple interfaces**, and reason about how Linux chooses a path.

> [!NOTE]
> Practise on a VM, ideally one with **two network interfaces** (most hypervisors
> and cloud providers let you attach a second NIC). As with Lesson 205, keep
> **console access** — routing mistakes can cut SSH, and we'll change the table
> live.

## Learning objectives

By the end of this lesson you will be able to:

- Read the **routing table** with `ip route` and interpret each entry.
- Explain the **default gateway** and **longest-prefix match**.
- Add and remove routes live with `ip route add/del`.
- Make static routes **persistent** with Netplan.
- Reason about **multi-homed** servers (multiple interfaces) and asymmetric routing.
- Enable **IP forwarding** and understand where **policy routing** fits.

## Part 1 — Reading the routing table

```bash
ip route                       # the main routing table
ip -6 route                    # the IPv6 table
ip route get 8.8.8.8           # which route/interface WOULD be used for this IP
```

A typical table:

```text
default via 192.168.1.1 dev eth0 proto dhcp metric 100
10.0.5.0/24 dev eth1 proto kernel scope link src 10.0.5.20
192.168.1.0/24 dev eth0 proto kernel scope link src 192.168.1.50
```

Read each line as "to reach **this destination**, send via **this gateway/
interface**":

- **`default`** (= `0.0.0.0/0`) — the catch-all: anything not matched by a more
  specific route goes here, via the **default gateway**. This is your route to the
  internet.
- **`10.0.5.0/24 dev eth1 ... scope link`** — a **directly connected** network: hosts
  on `10.0.5.0/24` are reachable straight out of `eth1`, no gateway needed.
- **`metric`** — a tie-breaker cost when multiple routes could apply (lower wins).
- **`src`** — the source IP the kernel will use for traffic on that route.

> [!IMPORTANT]
> Linux picks a route by **longest-prefix match**: the **most specific** matching
> network wins, regardless of order in the table. A packet to `10.0.5.7` matches
> `10.0.5.0/24` (a /24, 24 bits) over `default` (a /0), so it goes out `eth1`. Only
> when nothing more specific matches does the **default** route apply. Internalising
> "most specific wins" explains almost every routing decision.

## Part 2 — Add and remove routes live

You can change the table immediately (changes are **not** persistent — they vanish
on reboot, which is a useful safety property while experimenting):

```bash
# Route a specific subnet via a particular gateway/interface
sudo ip route add 10.10.0.0/16 via 192.168.1.254 dev eth0

# A host route (single /32) and a directly-connected route
sudo ip route add 172.16.0.5/32 via 192.168.1.254
sudo ip route add 10.0.5.0/24 dev eth1

# Change the default gateway
sudo ip route replace default via 192.168.1.1 dev eth0

# Remove a route
sudo ip route del 10.10.0.0/16

# Verify what the kernel would actually do
ip route get 10.10.0.5
```

> [!TIP]
> `ip route get <ip>` is the single best routing debug command: it tells you the
> **exact** route, interface, gateway and source IP the kernel would use for that
> destination — taking longest-prefix match into account for you. Before adding a
> route, check what happens now; after, confirm it changed as intended.

## Part 3 — Persistent routes with Netplan

Live `ip route` changes are lost on reboot. To make a static route **persistent** on
Ubuntu, add it to the interface's Netplan config (Lesson 205) and apply with
`netplan try`:

```yaml
network:
  version: 2
  ethernets:
    eth1:
      addresses: [10.0.5.20/24]
      routes:
        - to: 10.10.0.0/16        # reach this subnet...
          via: 10.0.5.1           # ...via this gateway on eth1
        - to: default
          via: 192.168.1.1        # default gateway stays on the primary interface
```

```bash
sudo netplan try                  # apply with rollback safety
ip route                          # confirm the static route is present
```

On NetworkManager systems the equivalent is `nmcli con mod <name> +ipv4.routes
"10.10.0.0/16 10.0.5.1"`.

## Part 4 — Multi-homed servers (multiple interfaces)

A **multi-homed** server has more than one interface — e.g. `eth0` on a public
network and `eth1` on a private/storage network. Key principles:

- **Exactly one default route.** The default gateway should normally be on the
  interface that reaches the internet. Two default routes with equal metric cause
  unpredictable path selection — give them different **metrics** if you truly need a
  backup.
- **Directly-connected networks** (the `scope link` routes) are added automatically
  for each interface's own subnet — you don't route those manually.
- **Add specific routes** for remote subnets reachable via a particular interface's
  gateway (Part 3).

```bash
ip -br a                          # see both interfaces and their addresses
ip route                          # one default, plus a connected route per interface
ip route get 10.0.5.50            # confirms private traffic exits eth1
ip route get 8.8.8.8              # confirms internet traffic exits eth0
```

> [!IMPORTANT]
> **Asymmetric routing** bites multi-homed servers: a reply leaves via a different
> interface than the request arrived on, and stateful firewalls (or the kernel's
> reverse-path filter, `rp_filter`) drop it. Symptoms: a service on the private
> interface is reachable from its own subnet but not from elsewhere. The proper fix
> is **policy routing** (Part 5) — separate routing tables and rules so replies go
> back the way they came.

## Part 5 — IP forwarding & policy routing (the concepts)

**IP forwarding** turns a server into a **router** — it will pass packets *between*
interfaces rather than only handling its own traffic. It's off by default and is
required for gateways, NAT boxes, VPNs and many container setups:

```bash
cat /proc/sys/net/ipv4/ip_forward          # 0 = off (default), 1 = on
sudo sysctl -w net.ipv4.ip_forward=1       # enable now
echo 'net.ipv4.ip_forward=1' | sudo tee /etc/sysctl.d/99-forward.conf   # persist
```

**Policy routing** lets you choose routes based on more than the destination — e.g.
the **source** address or interface — using multiple routing tables (`/etc/
iproute2/rt_tables`) and `ip rule`:

```bash
ip rule show                               # the rules that pick which table to use
ip route show table main                   # the normal table
# (Advanced setups add a table per interface and rules like:
#   ip rule add from 10.0.5.20 table 100 )
```

You won't configure full policy routing every day, but recognising **when** you need
it — multi-homed asymmetric-routing problems — is the senior-level takeaway. The
detailed mechanics belong to the dedicated networking track.

## Hands-on lab

> Live routing changes are non-persistent, so this is safe to experiment with; keep
> console access if you touch the default route.

```bash
# 1. Read and understand the current table
ip route
ip route get 8.8.8.8            # path to the internet
ip route get 127.0.0.1         # loopback

# 2. Add a harmless static route to an unused subnet, verify, remove
sudo ip route add 198.51.100.0/24 via "$(ip route | awk '/default/{print $3; exit}')"
ip route | grep 198.51.100
ip route get 198.51.100.5      # see it chosen
sudo ip route del 198.51.100.0/24

# 3. Demonstrate longest-prefix match
ip route get 8.8.8.8           # matches 'default' (/0)
#   (on a multi-homed box, ip route get an IP in a connected subnet shows the
#    specific interface instead of default — most specific wins)

# 4. Inspect forwarding and policy rules (read-only)
cat /proc/sys/net/ipv4/ip_forward
ip rule show

# 5. (Multi-NIC VMs) confirm each interface handles its own subnet
ip -br a
# ip route get <private-subnet-ip>   # should exit the private NIC
```

## Exercises

1. Print your routing table and explain, line by line, what each route does
   (default, connected, any static).
2. Use `ip route get` for three destinations (internet IP, loopback, and a
   private-subnet IP) and state which route/interface each uses and why.
3. Add a non-persistent static route to a test subnet via your gateway, verify it
   with `ip route get`, then delete it.
4. On Ubuntu, write the Netplan snippet that would make that static route
   **persistent**, and explain how you'd apply it safely.
5. Explain longest-prefix match using a packet to `10.0.5.7` given a table with both
   `10.0.5.0/24` and `default`.

## Troubleshooting

- **Can reach the local subnet but nothing else** — no/È wrong **default route**.
  *Fix:* `ip route` to check for a `default via …`; add/replace it
  (`ip route replace default via <gw> dev <if>`), then persist in Netplan.
- **Lost connectivity after changing routes** — you replaced the default badly.
  *Fix:* live changes are non-persistent — **reboot** restores the saved config, or
  fix via console. Prefer `ip route get` to test before persisting.
- **Multi-homed: service reachable from its own subnet but not elsewhere** — likely
  **asymmetric routing**/`rp_filter` drops. *Fix:* policy routing (per-interface
  table + `ip rule`); as a diagnostic, inspect `rp_filter` and reverse path.
- **Server won't forward packets between interfaces** — IP forwarding is off. *Fix:*
  `sysctl net.ipv4.ip_forward=1` and persist it.
- **Two default routes, flaky paths** — equal-metric defaults on two NICs. *Fix:*
  keep one default (internet-facing) or set distinct **metrics**.

Reproduce longest-prefix match: add `ip route add 8.8.8.0/24 via <gw>`, then `ip
route get 8.8.8.8` — it now matches your /24 over `default`; remove it and it falls
back to `default`.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Run the practical items.

1. What does the `default` route represent?
2. What does a `scope link` (directly connected) route mean?
3. State the rule Linux uses to choose among matching routes.
4. Which command shows exactly which route the kernel would use for a given IP?
5. Are `ip route add` changes persistent? How do you make a route persistent on
   Ubuntu?
6. What is a multi-homed server, and how many default routes should it normally
   have?
7. What is asymmetric routing, and what problem does it cause?
8. What does enabling `net.ipv4.ip_forward` do?
9. **Practical:** show which interface internet-bound traffic uses. Command and
   result?
10. **Practical:** add and then remove a static route to a test subnet. Commands?

## Solutions & validation

1. The **catch-all** route (`0.0.0.0/0`): traffic not matched by a more specific
   route is sent to the **default gateway** (typically toward the internet).
2. The network is **directly attached** to an interface, reachable without a gateway
   (hosts on that subnet are one hop away).
3. **Longest-prefix (most specific) match** — the route with the most matching
   network bits wins, regardless of table order.
4. `ip route get <ip>`.
5. **No**, they're lost on reboot; persist on Ubuntu by adding a `routes:` entry in
   the interface's **Netplan** config and applying with `netplan try/apply`.
6. A server with **multiple network interfaces**; it should normally have **one**
   default route (on the internet-facing interface).
7. Replies leave via a **different** interface than requests arrived on; stateful
   firewalls / reverse-path filtering then **drop** the traffic.
8. It makes the server **forward packets between interfaces** (act as a router),
   needed for gateways/NAT/VPN/containers.
9. **Validation:** `ip route get 8.8.8.8` shows `dev <iface> via <gateway> src
   <ip>` — the chosen path.
10. **Validation:** `ip route add 198.51.100.0/24 via <gw>` (verify with `ip route
    get`), then `ip route del 198.51.100.0/24`.

> [!TIP]
> "Most specific route wins, exactly one default, and `ip route get` to prove it" is
> 90% of practical routing. Reach for policy routing only when a multi-homed box
> shows asymmetric-routing symptoms — recognising *that* is the senior skill.

## What's next

Next: **Lesson 208 — Network Troubleshooting from the Server.** You can configure
addressing, DNS and routes; now you'll learn the **methodical diagnostic playbook**
when something's wrong: working up the layers with `ip`, `ping`/`mtr`, `ss`,
`curl`, and a first look at **`tcpdump`** to actually see packets. That completes the
networking module.
