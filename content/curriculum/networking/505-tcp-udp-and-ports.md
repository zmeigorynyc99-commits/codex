---
title: "Networking — TCP, UDP & Ports"
slug: "networking-tcp-udp-and-ports"
track: "networking"
trackName: "Networking"
module: "Core Protocols"
order: 505
level: "Intermediate"
difficulty: "Intermediate"
distribution: "Cross-platform"
category: "Networking"
tags: [networking, tcp, udp, ports, handshake, transport, intermediate]
cover: "/covers/curriculum/networking.svg"
estMinutes: 55
status: "published"
summary: "Layer 4 — how hosts run many services and deliver data. Ports and sockets, reliable TCP with its three-way handshake and connection states versus lightweight connectionless UDP, the well-known ports you must memorize, and inspecting live connections with ss."
seoTitle: "Networking 5: TCP vs UDP, Ports & the Three-Way Handshake"
seoDescription: "Intermediate networking: ports and sockets, TCP three-way handshake and states, TCP vs UDP trade-offs, well-known ports, and inspecting connections with ss. Lab and assessment."
---

A single server runs SSH, a web server, and a database at once — how does traffic
reach the right one? **Ports** (layer 4). And how does data arrive reliably across an
unreliable internet? **TCP**. This lesson covers the transport layer: ports and
sockets, the reliable **TCP** protocol (and its famous three-way handshake), the
lightweight **UDP**, when each is used, the well-known ports you must know, and how
to read live connections with `ss`.

## Learning objectives

By the end of this lesson you will be able to:

- Explain **ports** and **sockets** and how they multiplex services.
- Describe **TCP**: reliability, ordering, the **three-way handshake**, states.
- Describe **UDP** and when connectionless is the right choice.
- Recall the **well-known ports** for common services.
- Inspect connections and listeners with **`ss`**.

## Part 1 — Ports and sockets

An **IP address** identifies a **host**; a **port** (0–65535) identifies a **service**
on that host. The combination **IP + port** is a **socket** — and a connection is
uniquely identified by the **four-tuple**: source IP, source port, destination IP,
destination port. That's how one server handles thousands of simultaneous
connections without confusion.

```text
Browser  192.0.2.7 : 51000   <-->   Server 203.0.113.10 : 443   (one HTTPS connection)
Browser  192.0.2.7 : 51001   <-->   Server 203.0.113.10 : 443   (a second one)
```

- **Well-known ports** (0–1023) — reserved for standard services (need privilege to
  bind on Unix).
- **Registered** (1024–49151) and **ephemeral/dynamic** (49152–65535) — the latter
  used for the **client side** of a connection (a random high source port).

## Part 2 — TCP: reliable, ordered, connection-oriented

**TCP** (Transmission Control Protocol) provides a **reliable, ordered byte stream**.
It guarantees delivery by numbering bytes (sequence numbers), **acknowledging** what's
received, **retransmitting** what's lost, and reordering out-of-order segments. It
also does **flow control** (don't overwhelm the receiver) and **congestion control**
(don't overwhelm the network).

A TCP connection starts with the **three-way handshake**:

```text
Client ----SYN--->        Server     "let's talk, my seq = x"
Client <--SYN/ACK--        Server     "ok, my seq = y, ack x+1"
Client ----ACK--->        Server     "ack y+1" -> connection ESTABLISHED
```

And closes with a FIN/ACK exchange. In between, the connection moves through
**states** you'll see in `ss`:

```text
LISTEN -> SYN-SENT/SYN-RECV -> ESTABLISHED -> FIN-WAIT/CLOSE-WAIT -> TIME-WAIT -> CLOSED
```

> [!IMPORTANT]
> The **three-way handshake** is why a **firewall silently dropping** traffic looks
> like a "hang": the client sends `SYN` and waits for `SYN/ACK` that never comes
> (timeout), versus a **closed port** that replies `RST` (instant "connection
> refused"). In `tcpdump`, repeated outbound `SYN` with no reply = filtered/dropped;
> an immediate `RST` = port closed but reachable. That distinction tells you firewall
> vs service-down at a glance.

## Part 3 — UDP: lightweight, connectionless

**UDP** (User Datagram Protocol) just sends **datagrams** with no handshake, no
acknowledgements, no ordering, and no guaranteed delivery. It trades reliability for
**speed and low overhead** — and lets the application decide what to do about loss.

Use UDP when:

- **Speed/latency** matters more than perfect delivery — **DNS** queries, **VoIP**,
  video streaming, online games.
- **Broadcast/multicast** is needed (TCP is point-to-point only) — **DHCP**.
- The app handles reliability itself (e.g. **QUIC/HTTP-3** builds reliability on UDP).

| | **TCP** | **UDP** |
|---|---|---|
| Connection | Yes (handshake) | No |
| Reliability | Guaranteed, ordered, retransmits | Best-effort, may lose/reorder |
| Overhead | Higher | Lower |
| Use when | Data must arrive intact (web, SSH, email, files) | Speed > perfection (DNS, VoIP, video, DHCP) |

## Part 4 — Well-known ports to memorize

These come up constantly — in firewall rules, troubleshooting, and exams:

| Port | Proto | Service |
|------|-------|---------|
| 20/21 | TCP | FTP (data/control) |
| **22** | TCP | **SSH** |
| 23 | TCP | Telnet (insecure, legacy) |
| 25 | TCP | SMTP (mail send) |
| **53** | TCP/**UDP** | **DNS** |
| 67/68 | UDP | DHCP (server/client) |
| **80** | TCP | **HTTP** |
| 110/143 | TCP | POP3 / IMAP (mail retrieval) |
| **443** | TCP | **HTTPS** |
| 3306 | TCP | MySQL |
| 5432 | TCP | PostgreSQL |
| 3389 | TCP | RDP (Windows remote desktop) |

> [!TIP]
> Memorize at least **22 (SSH), 53 (DNS), 80 (HTTP), 443 (HTTPS)**, and your
> databases (**3306**, **5432**). Note **DNS uses both** UDP (normal queries) and TCP
> (large responses/zone transfers), and **DHCP is UDP**. Knowing a service's port
> turns "is it reachable?" into a one-line `nc -zv host port` test.

## Part 5 — Inspecting connections with ss

`ss` (the modern `netstat`) shows sockets — what's listening and what's connected:

```bash
ss -tulpn               # listening TCP/UDP ports + owning process (the key command)
ss -tn state established # active established TCP connections
ss -tan                 # all TCP sockets with their states
ss -s                   # summary counts by protocol/state
ss -tn dst :443         # connections to port 443
```

Reading it answers the everyday questions: *is my service listening, and on which
address/port?* (`-l`), *who am I connected to?* (established), *is the port bound to
`127.0.0.1` (local-only) or `0.0.0.0` (all interfaces)?* — the last being a top cause
of "works locally, not remotely."

```bash
nc -zv host 443         # is a REMOTE port reachable? (opens a TCP connection)
```

## Hands-on lab

```bash
# 1. What's listening here, with ports and processes
ss -tulpn
ss -tulpn | grep -E ':22|:80|:443' || echo "(those ports not listening here)"

# 2. Make a connection and watch its state
curl -s https://botera.md -o /dev/null &
ss -tn state established | head
wait 2>/dev/null

# 3. See the three-way handshake on the wire (SYN, SYN-ACK, ACK)
sudo tcpdump -i any -c 6 -n 'tcp port 443' &
curl -s https://botera.md -o /dev/null
sleep 1; wait 2>/dev/null

# 4. TCP vs UDP for the same service: DNS
ss -u -a | head                       # UDP sockets (DNS often here)
dig +short botera.md                  # a UDP DNS query under the hood

# 5. Closed vs filtered (refused vs hang) — concept demo
nc -zv 127.0.0.1 22 2>&1 || true      # likely 'succeeded' or 'refused' fast
timeout 3 nc -zv 10.255.255.1 22 2>&1 || echo "  (timeout = filtered/unreachable)"

# 6. Local-only vs all-interfaces bind
ss -tulpn | awk '/127.0.0.1/{print "local-only:", $0}'
```

## Exercises

1. List every listening port on your machine with its process, and flag which are
   bound to `127.0.0.1` (local-only) vs all interfaces.
2. Capture a TCP three-way handshake with `tcpdump` while making an HTTPS request,
   and identify the SYN, SYN/ACK, and ACK.
3. For five services (SSH, DNS, HTTP, HTTPS, PostgreSQL), state the port and whether
   it's TCP, UDP, or both.
4. Explain, with the handshake, why a firewall-dropped connection "hangs" while a
   closed port is "refused" instantly.
5. Use `nc -zv` to test reachability of a port you know is open and one that isn't,
   and describe the difference in behavior.

## Troubleshooting

- **"Connection refused"** — reached the host, but the port is **closed** (no service
  listening). *Fix:* start/enable the service; confirm with `ss -tulpn`.
- **"Connection timed out" / hangs** — a **firewall is dropping** the SYN (or host
  unreachable). *Fix:* check firewalls (host + cloud), routing, and that the service
  binds the right interface.
- **Service up but unreachable remotely** — bound to `127.0.0.1`. *Fix:* bind to
  `0.0.0.0`/the right interface; verify in `ss -tulpn`.
- **DNS works sometimes, fails for big responses** — UDP truncation; it should retry
  over **TCP/53**. *Fix:* ensure TCP/53 isn't blocked by a firewall.
- **Can't bind a port < 1024** — needs privilege. *Fix:* run as root, use a
  capability, or proxy from a high port.

Reproduce refused-vs-filtered: `nc -zv 127.0.0.1 1` returns "refused" instantly
(closed port, reachable host), while connecting to a firewalled host **times out** —
the handshake difference made visible.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).**

1. What does a port identify, and what is a socket?
2. What four values uniquely identify a TCP connection?
3. Describe the TCP three-way handshake.
4. Give three guarantees TCP provides that UDP does not.
5. When is UDP the better choice? Give two examples.
6. State the ports for SSH, DNS, HTTP, HTTPS, and which protocol(s) DNS uses.
7. Why does a firewall-dropped connection hang while a closed port refuses instantly?
8. Which command shows listening ports and their processes?
9. **Practical:** show your listeners and flag local-only ones.
10. **Practical:** test whether a remote port is reachable.

## Solutions & validation

1. A port identifies a **service** on a host; a **socket** is **IP + port**.
2. **Source IP, source port, destination IP, destination port** (the four-tuple).
3. `SYN` → `SYN/ACK` → `ACK`, after which the connection is **ESTABLISHED**.
4. Any three: **guaranteed delivery, ordering, retransmission, flow control,
   congestion control, connection setup**.
5. When **speed/low latency or broadcast** matters more than perfect delivery; e.g.
   **DNS, VoIP/video, gaming, DHCP**.
6. SSH **22/TCP**, DNS **53 TCP+UDP**, HTTP **80/TCP**, HTTPS **443/TCP**.
7. A drop yields **no SYN/ACK** → the client waits/timeouts; a closed-but-reachable
   port replies **RST** → instant "refused."
8. `ss -tulpn`.
9. **Validation:** `ss -tulpn`; entries on `127.0.0.1:` are local-only.
10. **Validation:** `nc -zv host port` (open = succeeds, closed = refused, filtered =
    times out).

> [!TIP]
> Layer 4 in one breath: **ports multiplex services; TCP is reliable+ordered via the
> handshake; UDP is fast+connectionless; `ss -tulpn` shows what's listening; refused
> vs timeout distinguishes closed-port from firewall.** That toolkit resolves most
> "can't connect" problems fast.

## What's next

Next: **Lesson 506 — DNS Deep Dive.** The internet's phone book in detail: how a name
resolves through the DNS hierarchy (root → TLD → authoritative), the record types
(A, AAAA, CNAME, MX, TXT, NS), recursive vs authoritative servers, caching and TTLs,
and debugging resolution with `dig`.
