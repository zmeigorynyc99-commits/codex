---
title: "Networking — The OSI & TCP/IP Models"
slug: "networking-osi-and-tcp-ip-models"
track: "networking"
trackName: "Networking"
module: "Foundations"
order: 501
level: "Beginner"
difficulty: "Beginner"
distribution: "Cross-platform"
category: "Networking"
tags: [networking, osi, tcp-ip, layers, encapsulation, beginner]
cover: "/covers/curriculum/networking.svg"
estMinutes: 50
status: "published"
summary: "The mental map that makes all networking make sense. Learn the OSI seven layers and the practical TCP/IP four-layer model, what each layer does, how data is encapsulated as it goes down the stack, and how to use the layers as a troubleshooting framework."
seoTitle: "Networking 1: The OSI & TCP/IP Models Explained"
seoDescription: "Beginner networking: the OSI seven layers and TCP/IP four-layer model, what each layer does, encapsulation (frame/packet/segment), and using layers to troubleshoot. Lab + assessment."
---

Welcome to the **Networking** track. Before commands and configs, you need the
**mental map** that makes everything else click: the layered model of how data
moves across a network. Every protocol, device and troubleshooting step fits into
this model, and senior engineers think in its terms constantly ("that's a layer-2
problem," "the issue is at layer 4"). This first lesson gives you that framework —
the **OSI** and **TCP/IP** models — which the rest of the track builds on.

## Learning objectives

By the end of this lesson you will be able to:

- Explain why networking is built in **layers**.
- Name the **OSI seven layers** and what each does.
- Map them to the practical **TCP/IP four-layer** model.
- Describe **encapsulation** (data → segment → packet → frame).
- Use the layers as a **troubleshooting framework**.

## Part 1 — Why layers?

A network does many jobs: turning bits into signals on a wire, addressing the right
machine, finding a path across the internet, delivering data reliably, and
presenting it to an application. Trying to understand all of that at once is
overwhelming. **Layering** splits the work into independent levels, each handling
one job and talking only to the layers directly above and below it.

The payoff is huge:

- **Modularity** — Wi-Fi vs Ethernet (lower layers) doesn't change how a web browser
  (upper layer) works.
- **Interoperability** — equipment from different vendors interoperates because they
  agree on each layer's job.
- **Troubleshooting** — you can isolate a problem to a layer and fix it there.

Two models describe these layers: the **OSI** model (7 layers, the teaching/
reference standard) and the **TCP/IP** model (4 layers, what the internet actually
runs on). You'll use both vocabularies.

## Part 2 — The OSI seven layers

From top (closest to the user) to bottom (closest to the wire):

| # | Layer | Job | Examples |
|---|-------|-----|----------|
| 7 | **Application** | Interface to apps / network services | HTTP, DNS, SSH, SMTP |
| 6 | **Presentation** | Format, encrypt, compress data | TLS, encoding (UTF-8), JPEG |
| 5 | **Session** | Set up / manage / tear down sessions | session tokens, RPC |
| 4 | **Transport** | End-to-end delivery, ports, reliability | **TCP, UDP** |
| 3 | **Network** | Logical addressing & routing between networks | **IP**, ICMP, routers |
| 2 | **Data Link** | Framing & local addressing on one link | Ethernet, MAC, switches, ARP |
| 1 | **Physical** | Bits as signals on the medium | cables, Wi-Fi radio, voltages |

A classic mnemonic top-down: **A**ll **P**eople **S**eem **T**o **N**eed **D**ata
**P**rocessing (Application → Physical). The four you'll reference most in practice
are **7 (Application)**, **4 (Transport — TCP/UDP & ports)**, **3 (Network — IP &
routing)**, and **2 (Data Link — Ethernet/MAC/switches)**.

> [!TIP]
> Layers 5 and 6 (Session/Presentation) are blurry in the real world — modern
> protocols often fold their jobs into the application (e.g. TLS encryption sits
> "around" layer 6/7). Don't over-index on them. Master the practical four — **L2,
> L3, L4, L7** — and you can reason about almost any networking problem.

## Part 3 — The TCP/IP model

The internet was built on the **TCP/IP** model, which collapses OSI's seven into
four practical layers:

| TCP/IP layer | Maps to OSI | Does | Examples |
|--------------|-------------|------|----------|
| **Application** | 5–7 | Everything apps use | HTTP, DNS, SSH, TLS |
| **Transport** | 4 | Ports + reliability | TCP, UDP |
| **Internet** | 3 | Addressing + routing | IP, ICMP |
| **Link** (Network Access) | 1–2 | The local link | Ethernet, Wi-Fi, MAC |

This is the model that actually runs the world. When people say "the TCP/IP stack,"
this is it. OSI is the richer reference for **discussion and exams**; TCP/IP is the
**implementation**. They line up cleanly, so knowing one means knowing the other.

## Part 4 — Encapsulation: how data travels down the stack

When you send data, each layer **wraps** it with its own header (and the data link
layer adds a trailer too) — like nesting envelopes. The name of the bundle changes
per layer (its **PDU**, protocol data unit):

```text
Application:  [ DATA ]                                   ← your HTTP request
Transport:    [ TCP header | DATA ]            → "segment"   (adds ports, sequencing)
Internet:     [ IP header | TCP | DATA ]       → "packet"    (adds source/dest IP)
Link:         [ Eth header | IP | TCP | DATA | Eth trailer ] → "frame" (adds MACs, FCS)
Physical:     ...transmitted as bits/signals on the medium...
```

At the receiver, each layer **strips its header** (de-encapsulation) and hands the
inside up to the next layer. Memorize the names by layer — they're used constantly:

- **L4 → segment** (TCP) / datagram (UDP) — has **ports**.
- **L3 → packet** — has **IP addresses**.
- **L2 → frame** — has **MAC addresses**.

> [!IMPORTANT]
> The vocabulary matters: a **frame** carries MAC addresses (local, layer 2), a
> **packet** carries IP addresses (logical, layer 3), and a **segment** carries port
> numbers (layer 4). Using the right term signals — and sharpens — your
> understanding of *where* in the stack something happens. "The switch forwards
> frames; the router forwards packets" is a sentence that encodes the whole model.

## Part 5 — Layers as a troubleshooting framework

The model isn't academic — it's a **diagnostic method**. Work **bottom-up**:

1. **L1 Physical** — is the cable plugged in / interface up? (`ip link`, link lights)
2. **L2 Data Link** — does the local link work? MAC/ARP resolving? (`ip neigh`, switch)
3. **L3 Network** — can you reach IPs / is there a route? (`ping IP`, `ip route`)
4. **L4 Transport** — is the port open / service listening? (`ss`, `nc`, TCP handshake)
5. **L7 Application** — does the app respond correctly? (`curl`, app logs)

This is exactly the layered triage from the Linux networking-troubleshooting lesson,
now with names. "Ping the IP works but the website doesn't" = layers 1–3 are fine,
look at 4–7. "Can't even ping the gateway" = layers 1–3. Naming the failing layer
tells you *which tools* to reach for.

## Hands-on lab

```bash
# Observe each layer on your own machine (Linux).

# L1/L2 — the physical/data-link layer: interfaces, state, MAC addresses
ip -br link                 # interface up/down + MAC (layer 2 addresses)
ip neigh                    # ARP table: IP <-> MAC mappings (L2/L3 boundary)

# L3 — the network layer: IP addresses and routing
ip -br addr                 # your IP addresses (layer 3)
ip route                    # how packets are routed (layer 3)
ping -c2 1.1.1.1            # reach an IP (L3 reachability via ICMP)

# L4 — the transport layer: ports and connections
ss -tulpn                   # listening TCP/UDP ports (layer 4)
ss -tn state established    # active TCP connections (L4 sessions)

# L7 — the application layer: an actual service exchange
curl -sI https://botera.md | head -1     # HTTP response (layer 7)

# See encapsulation for real: capture a few packets and note the layers
sudo tcpdump -i any -c 3 -n icmp &        # frames carrying IP packets carrying ICMP
ping -c2 1.1.1.1 >/dev/null; wait 2>/dev/null
```

As you run each command, say which **layer** it inspects. That habit makes the model
concrete.

## Exercises

1. Write out the OSI seven layers in order (top to bottom) with a one-line job for
   each, then the TCP/IP four and how they map.
2. For each of these, name the layer: an Ethernet switch, an IP router, a TCP port,
   a TLS handshake, a Wi-Fi radio, an HTTP request.
3. Draw (in text) the encapsulation of an HTTP request from application data down to
   a frame, labeling segment/packet/frame.
4. On your machine, run one command per layer (L2 MAC, L3 route, L4 ports, L7 HTTP)
   and note what each reveals.
5. Given "I can ping the server's IP but the web page won't load," state which layers
   are working and which to investigate next, with the tool for each.

## Troubleshooting

- **"Is this an L2 or L3 problem?"** — L2 issues are **local** (same link: bad cable,
  wrong VLAN, ARP). L3 issues involve **reaching another network** (routing, gateway).
  *Method:* can you reach hosts on your own subnet (L2/local) but not others (L3)?
- **Confusing frame/packet/segment** — match the address type: MAC→frame (L2),
  IP→packet (L3), port→segment (L4).
- **"Ping works but the app doesn't"** — L1–L3 are fine; the problem is L4 (port/
  firewall) or L7 (the application). *Tools:* `ss`/`nc` then `curl`/logs.
- **Over-focusing on L5/L6** — in practice their jobs live in the application/TLS;
  spend your energy on L2/L3/L4/L7.

Reproduce the layered method: `ping 1.1.1.1` (L3 ok) then `curl https://expired.
badssl.com` (L7/TLS fails) — same lower layers, the failure is higher up, exactly as
the model predicts.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).**

1. Why is networking built in layers — give two benefits.
2. List the OSI seven layers in order.
3. Which four layers do you reference most in practice, and what does each do?
4. How does the TCP/IP four-layer model map to OSI?
5. What is encapsulation?
6. What are the layer-4, layer-3, and layer-2 PDUs called, and what address does
   each carry?
7. "The switch forwards ___ ; the router forwards ___." Fill in and give the layers.
8. How do you use the layers to troubleshoot, and in which direction?
9. **Practical:** name one command that inspects layer 2, one for layer 3, one for
   layer 4, and one for layer 7.
10. Given "ping the IP works, the website doesn't," which layers are fine and which
    do you check?

## Solutions & validation

1. Any two: **modularity** (change one layer without others), **interoperability**
   (vendors agree per layer), **easier troubleshooting** (isolate to a layer).
2. Application, Presentation, Session, Transport, Network, Data Link, Physical.
3. **L7 Application** (apps/services), **L4 Transport** (ports + reliability, TCP/
   UDP), **L3 Network** (IP addressing + routing), **L2 Data Link** (Ethernet/MAC/
   switching).
4. Application(5–7), Transport(4), Internet(3), Link(1–2).
5. Each layer **wrapping** the data with its own header (and L2 a trailer) as it goes
   down the stack; reversed on receipt.
6. L4 **segment** (ports), L3 **packet** (IP addresses), L2 **frame** (MAC
   addresses).
7. The switch forwards **frames** (L2); the router forwards **packets** (L3).
8. Work the layers (typically **bottom-up**): physical → link → network → transport →
   application; the first failing layer localizes the problem.
9. **Validation:** L2 `ip link`/`ip neigh`; L3 `ip route`/`ping`; L4 `ss -tulpn`/`nc`;
   L7 `curl`.
10. **Fine:** L1–L3 (and ICMP); **check:** L4 (port/firewall) then L7 (the app), with
    `ss`/`nc` then `curl`/logs.

> [!TIP]
> Keep the four practical layers — **L2 frames/MAC, L3 packets/IP, L4 segments/ports,
> L7 apps** — at your fingertips. Naming the layer a problem lives on is half the
> diagnosis, and it's the shared language every network engineer speaks.

## What's next

Next: **Lesson 502 — IP Addressing & Subnetting.** The layer-3 skill every network
role demands: how IPv4 addresses and CIDR work, how to carve a network into subnets,
and how to compute network/broadcast addresses and host ranges — with the subnet
cheat sheet on the lessons page as your quick reference.
