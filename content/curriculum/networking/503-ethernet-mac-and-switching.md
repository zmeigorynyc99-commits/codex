---
title: "Networking — Ethernet, MAC & Switching"
slug: "networking-ethernet-mac-and-switching"
track: "networking"
trackName: "Networking"
module: "Foundations"
order: 503
level: "Intermediate"
difficulty: "Intermediate"
distribution: "Cross-platform"
category: "Networking"
tags: [networking, ethernet, mac, arp, switching, vlan, intermediate]
cover: "/covers/curriculum/networking.svg"
estMinutes: 55
status: "published"
summary: "Layer 2 — how devices on the same network actually reach each other. MAC addresses and frames, ARP mapping IPs to MACs, how switches learn and forward, the difference between a hub/switch/router, broadcast vs collision domains, and VLAN segmentation."
seoTitle: "Networking 3: Ethernet, MAC Addresses, ARP & Switching"
seoDescription: "Intermediate networking: MAC addresses & frames, ARP, how switches learn/forward, hub vs switch vs router, broadcast/collision domains, and VLANs. Hands-on lab and assessment."
---

Layer 3 (the last lesson) gets a packet to the right **network**; **layer 2** gets a
frame to the right **device** on the local link. This lesson covers how machines on
the same network actually find and reach each other: **MAC addresses**, **ARP**, and
the **switches** that forward frames — plus **VLANs**, which segment one physical
LAN into many. Understanding L2 explains a huge class of "why can't these two
machines talk?" problems.

## Learning objectives

By the end of this lesson you will be able to:

- Explain **MAC addresses** and Ethernet **frames**.
- Describe how **ARP** maps an IP to a MAC.
- Explain how a **switch** learns and forwards frames.
- Distinguish **hub vs switch vs router** and **broadcast vs collision domains**.
- Describe how **VLANs** segment a LAN.

## Part 1 — MAC addresses and frames

Every network interface has a **MAC address** — a 48-bit hardware address written as
six hex pairs, e.g. `a4:5e:60:c2:1f:8b`. The first half identifies the **vendor**
(OUI); the whole thing is meant to be globally unique and burned into the NIC. MACs
operate at **layer 2** and are only meaningful on the **local link** — they don't
cross routers.

A **frame** is the layer-2 PDU: it wraps an IP packet with a header containing the
**source and destination MAC** (plus a trailer with an error-check, the FCS). On the
local network, delivery is by **MAC**, not IP.

```bash
ip -br link            # your interfaces and their MAC addresses (layer 2)
```

> [!IMPORTANT]
> **MAC = local; IP = global.** Within one network (one subnet), devices deliver
> frames directly using MAC addresses. To reach **another** network, the frame is
> sent to the **router's** MAC, the router strips the frame, routes the packet by IP,
> and builds a **new** frame for the next hop. So the **MAC changes at every hop**,
> while the **source/destination IP stays the same** end-to-end. That single fact
> resolves most L2-vs-L3 confusion.

## Part 2 — ARP: from IP to MAC

You know the destination's **IP** (from DNS or config), but local delivery needs its
**MAC**. **ARP** (Address Resolution Protocol) bridges the gap: the host **broadcasts**
"who has 10.0.0.5? tell 10.0.0.9," and the owner replies with its MAC. The result is
cached in the **ARP table**:

```bash
ip neigh               # the ARP table: IP <-> MAC mappings (Linux)
# arp -a               # classic equivalent (and on Windows/macOS)
ping -c1 10.0.0.5      # populates the ARP entry for a reachable neighbor
```

For a **remote** destination (different subnet), the host doesn't ARP for the remote
IP — it ARPs for the **default gateway's** MAC and sends the frame there. This is why
a wrong gateway breaks "internet but not LAN" (or vice versa).

> [!TIP]
> ARP problems are sneaky. A **duplicate IP** on the LAN, a stale ARP entry after
> swapping hardware, or **ARP spoofing** (an attacker answering for someone else's
> IP) all show up as "intermittent" or "wrong host" connectivity. `ip neigh` (look
> for `FAILED`/`INCOMPLETE` or an unexpected MAC) is your first L2 diagnostic. Clear a
> stale entry with `ip neigh flush dev <iface>`.

## Part 3 — How a switch works

A **switch** connects devices on a LAN and forwards frames intelligently. It builds a
**MAC address table** by **learning**: when a frame arrives on a port, the switch
records "this source MAC lives on this port." To forward:

- **Known destination MAC** → send only out the **one** port it's on (unicast).
- **Unknown destination** → **flood** out all ports (until it learns).
- **Broadcast** (`ff:ff:ff:ff:ff:ff`) → flood to all ports.

This learning is why a switch is vastly better than a hub: it sends each frame only
where it needs to go, so devices aren't competing for one shared wire.

## Part 4 — Hub vs switch vs router; domains

| Device | Layer | Behavior |
|--------|-------|----------|
| **Hub** | 1 | Dumb repeater — copies bits to **all** ports (one shared collision domain; obsolete) |
| **Switch** | 2 | Learns MACs, forwards **frames** per port; each port is its own collision domain |
| **Router** | 3 | Forwards **packets** between networks by IP; separates broadcast domains |

Two key concepts:

- **Collision domain** — a set of devices that can collide on the wire. A switch
  gives each port its own, so modern LANs essentially have none.
- **Broadcast domain** — the set of devices a broadcast reaches. A switch forwards
  broadcasts to **all** ports → one broadcast domain per LAN/VLAN. **Routers** (and
  VLAN boundaries) **stop** broadcasts, splitting broadcast domains.

> [!IMPORTANT]
> **Switches forward broadcasts; routers (and VLANs) contain them.** A single large
> flat LAN is one big broadcast domain — broadcast traffic (ARP, DHCP discovery) hits
> every device, which doesn't scale and is a security concern (everyone sees the
> broadcasts). Segmenting with **VLANs/subnets + routing** keeps broadcast domains
> small. "Why is this noisy/insecure flat network slow?" is usually a broadcast-
> domain-too-big problem.

## Part 5 — VLANs: segmenting a LAN

A **VLAN** (Virtual LAN) splits one physical switch into multiple **logical**
networks — each VLAN is its own broadcast domain (and usually its own subnet), even
on the same hardware. You might put servers on VLAN 10, staff on VLAN 20, guests on
VLAN 30 — isolated from each other unless a router/firewall permits traffic between
them.

- **Access port** — belongs to **one** VLAN (a normal device plugs in here).
- **Trunk port** — carries **many** VLANs between switches (frames are **tagged**
  with their VLAN ID, IEEE **802.1Q**).
- **Inter-VLAN routing** — a router or L3 switch routes between VLANs (since they're
  separate subnets/broadcast domains).

VLANs give you **segmentation** (security/isolation), **smaller broadcast domains**
(performance), and **flexibility** (logical grouping regardless of physical
location) — foundational for any real network design.

## Hands-on lab

```bash
# 1. Your layer-2 identity and neighbors
ip -br link              # interfaces + MAC addresses
ip neigh                 # ARP table (IP <-> MAC)

# 2. Populate and read an ARP entry for a neighbor (your gateway)
GW=$(ip route | awk '/default/{print $3; exit}')
ping -c1 "$GW" >/dev/null 2>&1
ip neigh | grep "$GW"    # the gateway's MAC, learned via ARP

# 3. See the MAC change for remote vs local (concept check)
#    Local target -> its own MAC; remote target -> the GATEWAY's MAC is used.
ip neigh                 # note neighbors are all on YOUR subnet

# 4. Watch ARP on the wire (broadcast who-has / reply)
sudo tcpdump -i any -c 4 -n arp &
ping -c1 "$GW" >/dev/null 2>&1; sleep 1; wait 2>/dev/null

# 5. (If you run VMs/containers) list bridges = software switches
ip -br link | grep -i -E 'br|docker|virbr' || echo "(no bridges here)"
bridge fdb show 2>/dev/null | head        # the bridge's MAC table (learning in action)
```

## Exercises

1. Show your interfaces' MAC addresses and identify the vendor portion (first 3
   octets / OUI).
2. Ping your default gateway, then display its MAC from the ARP table and explain how
   ARP obtained it.
3. Explain, for a packet to a host on a **different** subnet, whose MAC ends up in the
   destination field of the first frame, and why.
4. In one sentence each, distinguish a hub, a switch, and a router by the layer they
   operate at and what they forward.
5. Explain what a VLAN is and how an access port differs from a trunk port.

## Troubleshooting

- **Two devices on the same subnet can't reach each other** — L2 issue: wrong VLAN,
  bad cable/port, or an ARP problem. *Fix:* check link (`ip link`), `ip neigh` for the
  MAC, and that both are in the same VLAN/subnet.
- **Intermittent connectivity / "wrong host" answers** — duplicate IP or ARP
  spoofing. *Fix:* inspect `ip neigh` for an unexpected/changing MAC; find the
  duplicate; flush stale entries.
- **`169.254` / no gateway reachability** — can't ARP the gateway (DHCP/link issue).
  *Fix:* fix L1/L2 and addressing before blaming routing.
- **Broadcast storms / slow flat network** — broadcast domain too large. *Fix:*
  segment with VLANs/subnets; routers contain broadcasts.
- **Can ping within a VLAN but not across** — that's by design; **inter-VLAN
  routing** is needed. *Fix:* route/permit traffic at an L3 device/firewall.

Reproduce the local-vs-remote MAC idea: `ip neigh` shows entries only for hosts on
**your** subnet (including the gateway) — remote IPs never appear, because you reach
them via the gateway's MAC, not their own.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).**

1. What is a MAC address, and at which layer does it operate?
2. What does ARP do, and how (broadcast/reply)?
3. For a remote destination, which MAC does the host put in the frame?
4. How does a switch learn where to forward frames?
5. What does a switch do with a frame for an unknown destination MAC?
6. Distinguish broadcast domain from collision domain.
7. What contains broadcasts — switches or routers (and VLANs)?
8. What is a VLAN, and how do access and trunk ports differ?
9. **Practical:** show the gateway's MAC from your ARP table. Commands?
10. **Practical:** name the command to list interface MAC addresses.

## Solutions & validation

1. A 48-bit **hardware address** identifying a NIC on the local link; **layer 2**.
2. Maps an **IP to a MAC**: the host **broadcasts** "who has IP X?" and the owner
   **replies** with its MAC (cached in the ARP table).
3. The **default gateway's** MAC (the host ARPs for the gateway, not the remote IP).
4. By **learning** the **source MAC → port** of frames it receives.
5. **Floods** it out all ports (except the one it arrived on) until it learns.
6. **Collision domain** = devices that can collide on the medium (a switch isolates
   each port); **broadcast domain** = devices a broadcast reaches.
7. **Routers** (and **VLAN** boundaries) contain broadcasts; switches forward them.
8. A **logical LAN segment** (own broadcast domain/subnet) on shared hardware; an
   **access** port carries one VLAN, a **trunk** carries many (802.1Q tagged).
9. **Validation:** `ping -c1 $(ip route|awk '/default/{print $3}')` then `ip neigh |
   grep` the gateway IP.
10. **Validation:** `ip -br link` (or `ip link`).

> [!TIP]
> The mental model that unlocks L2: **switches forward frames by MAC within a
> broadcast domain; routers move packets by IP between them; ARP is the glue from IP
> to MAC; VLANs cut one LAN into many.** With that, "why can't these two talk?" almost
> always resolves to a clear layer.

## What's next

Next: **Lesson 504 — Routing Fundamentals.** Moving up to layer 3 between networks:
how routers choose paths with routing tables, static vs dynamic routing, the default
gateway, longest-prefix match, and **NAT** — how private networks share public IPs to
reach the internet.
