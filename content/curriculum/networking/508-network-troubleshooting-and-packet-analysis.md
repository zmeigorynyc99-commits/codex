---
title: "Networking — Troubleshooting & Packet Analysis"
slug: "networking-troubleshooting-and-packet-analysis"
track: "networking"
trackName: "Networking"
module: "Operating Networks"
order: 508
level: "Senior"
difficulty: "Senior"
distribution: "Cross-platform"
category: "Networking"
tags: [networking, troubleshooting, tcpdump, wireshark, packet-analysis, senior]
cover: "/covers/curriculum/networking.svg"
estMinutes: 65
status: "published"
summary: "The capstone: a repeatable, layered method to diagnose any network problem, the essential CLI toolkit (ping, traceroute/mtr, ss, dig, curl, nc), and a real introduction to reading packets with tcpdump and Wireshark — including the signatures that reveal firewall drops, resets and retransmits."
seoTitle: "Networking 8: Troubleshooting Method & Packet Analysis (tcpdump)"
seoDescription: "Senior networking: a layered troubleshooting method, the CLI toolkit (ping/traceroute/mtr/ss/dig/curl/nc), and reading packets with tcpdump/Wireshark — SYN/RST/retransmit signatures. Lab + assessment."
---

This **Senior**-level capstone ties the whole track together into the skill that
defines a strong network engineer: **methodical diagnosis**. Anyone can run `ping`;
the professional applies a **layered method**, reaches for the right tool per layer,
and — when higher tools can't explain it — reads the **actual packets** to find ground
truth. You'll consolidate the toolkit and learn to read **tcpdump**/Wireshark well
enough to recognize the signatures of firewall drops, resets, and retransmissions.

## Learning objectives

By the end of this lesson you will be able to:

- Apply a **layered troubleshooting method** to any network problem.
- Use the core toolkit: **ping, traceroute/mtr, ss, dig, curl, nc**.
- Capture and filter packets with **`tcpdump`** (and analyze in **Wireshark**).
- Recognize key packet **signatures**: SYN/SYN-ACK, RST, retransmissions, no-reply.
- Produce a clear **diagnosis** that names the failing layer.

## Part 1 — The layered method

Work the layers (Lesson 501), stopping at the first that fails — guess less, isolate
more:

| Layer | Question | Tool |
|-------|----------|------|
| 1 Physical | Is the link up? | `ip link`, link lights |
| 2 Data Link | MAC/ARP resolving? right VLAN? | `ip neigh` |
| 3 Network | Reach the IP? route exists? | `ping`, `ip route`, `traceroute`/`mtr` |
| 4 Transport | Port open? handshake completes? | `ss`, `nc`, `tcpdump` |
| 7 Application | Does the service answer correctly? | `curl`, app logs |

Plus **DNS** as a cross-cutting check (`dig`, `getent`) between L3 and L7. The art is
**bisection**: each test rules a layer in or out, halving the problem space. "Ping the
IP works, by name fails" instantly isolates DNS; "port refused vs timeout"
distinguishes service-down from firewall.

## Part 2 — The CLI toolkit, consolidated

```bash
# Reachability & path (L3)
ping -c4 1.1.1.1                 # reachable? loss? latency?
mtr -n --report -c 10 host      # per-hop loss/latency — WHERE it breaks
traceroute -n host              # one-shot path

# Name resolution (DNS)
getent hosts host               # how the OS resolves (hosts + DNS)
dig +short host @1.1.1.1        # DNS in isolation (bypass local config)

# Ports & connections (L4)
ss -tulpn                       # what's listening here (+ process)
nc -zv host 443                 # is a remote port reachable? refused vs timeout
ss -tn state established        # who am I connected to

# Application (L7)
curl -v https://host            # full DNS->TCP->TLS->HTTP, shows the failing stage
curl -sS -o /dev/null -w '%{http_code} %{time_total}s\n' https://host
```

`curl -v` is itself a layered diagnostic: it prints the DNS lookup, the TCP connect,
the TLS handshake, and the HTTP exchange — so you can see **exactly** which stage
fails. `mtr` localizes packet loss to a hop. `nc -zv` cleanly separates "refused"
(closed port) from "timeout" (filtered).

> [!IMPORTANT]
> **A failed `ping` ≠ "down."** Many hosts/firewalls drop ICMP while serving real
> traffic, so corroborate with a **port/app** test (`nc`, `curl`) before declaring an
> outage. And remember the bind-address trap from Lesson 505: a service on
> `127.0.0.1` is invisible remotely even though `ss` shows it "listening." The method
> protects you from both false negatives and false positives.

## Part 3 — tcpdump: reading the wire

When higher-level tools leave you guessing, **`tcpdump`** shows the actual packets —
the ground truth nothing else provides:

```bash
sudo tcpdump -i any -n host 10.0.0.5            # all traffic to/from a host (-n no DNS)
sudo tcpdump -i eth0 -n 'tcp port 443'          # just HTTPS
sudo tcpdump -i any -n 'tcp port 22' -c 20      # 20 packets then stop
sudo tcpdump -i any -n icmp                     # watch pings
sudo tcpdump -i any -n 'tcp[tcpflags] & tcp-syn != 0'   # only SYN packets
sudo tcpdump -i any -w capture.pcap host 10.0.0.5       # save for Wireshark
```

Filter **tightly** (host/port) and **limit** with `-c` — an unfiltered capture on a
busy host floods instantly and may grab sensitive data. Write to a `.pcap` with `-w`
to open in **Wireshark** later, where you get a GUI, protocol decoding, "Follow TCP
Stream," and expert analysis.

## Part 4 — Packet signatures to recognize

Reading a capture, these patterns tell the story:

- **Healthy TCP open**: `SYN` → `SYN, ACK` → `ACK`, then data. The handshake completed
  — connectivity and the port are fine.
- **Firewall drop (filtered)**: repeated outbound **`SYN`** with **no reply** (then
  retransmitted SYNs). The packets leave but nothing comes back → something is
  **silently dropping** them. This is the classic "it just hangs" signature.
- **Connection refused**: `SYN` → **`RST`** (reset) immediately. The host is reachable
  but **no service** is listening on that port → "connection refused."
- **Retransmissions / dup ACKs**: the same segment sent again, or duplicate ACKs →
  **packet loss** on the path (correlate with `mtr`). Lots of these = a lossy/
  congested link.
- **`ICMP unreachable`**: a router replying "no route to host / network unreachable" →
  a **routing**/reachability problem.

> [!IMPORTANT]
> **SYN with no reply = filtered (firewall); SYN→RST = closed port; SYN→SYN/ACK =
> open.** That one line of packet-reading resolves the single most common networking
> ambiguity — "is it a firewall or is the service down?" — definitively. When tickets
> argue about it, a 10-packet `tcpdump` ends the debate with evidence.

## Part 5 — From symptom to diagnosis

Put it together on a real complaint — "the app can't reach the database":

```bash
ping -c2 dbhost                 # L3: reachable? (or is ICMP filtered?)
getent hosts dbhost             # DNS: resolves to the right IP?
nc -zv dbhost 5432              # L4: port open? refused vs timeout?
ss -tulpn | grep 5432           # on the DB host: is it listening, and on 0.0.0.0?
sudo tcpdump -i any -n 'host dbhost and port 5432' -c 10   # the truth: SYN/RST/none?
```

The output names the layer: name resolves wrong → DNS; `nc` times out + `tcpdump`
shows SYN with no reply → **firewall**; `nc` refused + DB only on `127.0.0.1` →
**bind address**; all fine but the app errors → **application/auth**. A good diagnosis
ends with a sentence: *"Layer 4 — the DB host's firewall is dropping SYNs to 5432;
allow the app subnet."*

## Hands-on lab

```bash
# 1. Run the layered toolkit against a known-good target
ping -c2 1.1.1.1
getent hosts botera.md
nc -zv botera.md 443 2>&1 | tail -1
curl -sS -o /dev/null -w 'http=%{http_code} time=%{time_total}s\n' https://botera.md

# 2. mtr to localize any path loss
mtr -n --report -c 5 1.1.1.1 2>/dev/null || traceroute -n 1.1.1.1 | head

# 3. Capture and READ a healthy TCP handshake (SYN, SYN-ACK, ACK)
sudo tcpdump -i any -n 'tcp port 443' -c 8 &
curl -s https://botera.md -o /dev/null
sleep 1; wait 2>/dev/null

# 4. Refused vs filtered, on the wire
nc -zv 127.0.0.1 1 2>&1 | tail -1            # closed port -> refused (RST), instant
( sudo tcpdump -i any -n 'tcp port 1 and host 127.0.0.1' -c 2 & \
  sleep 0.3; nc -zv 127.0.0.1 1 2>/dev/null; sleep 0.5; wait 2>/dev/null ) || true

# 5. Curl as a layered diagnostic
curl -v https://botera.md 2>&1 | grep -E 'Trying|Connected|SSL|HTTP/' | head

# 6. (optional) save a capture for Wireshark
sudo tcpdump -i any -n -c 20 -w /tmp/cap.pcap 'tcp port 443' 2>/dev/null &
curl -s https://botera.md -o /dev/null; wait 2>/dev/null
ls -lh /tmp/cap.pcap 2>/dev/null && rm -f /tmp/cap.pcap
```

## Exercises

1. Walk all the layers for reaching `https://botera.md`, writing the command and
   result at each (link, IP, DNS, port, app).
2. Use `mtr --report` to a public host and identify any hop with packet loss,
   explaining why mid-path loss differs from final-hop loss.
3. Capture a TCP three-way handshake with `tcpdump` and label the SYN, SYN/ACK, and
   ACK packets.
4. Demonstrate the difference between a **refused** port and a **filtered** one using
   `nc` and a short `tcpdump`, and describe the packet signatures.
5. Write a one-paragraph diagnosis for a fabricated "can't reach the database"
   scenario, naming the failing layer and the fix, supported by which tool's output.

## Troubleshooting

- **Everything "looks fine" but it's slow/flaky** — packet loss. *Fix:* `mtr` to find
  the lossy hop; `tcpdump` for retransmissions/dup ACKs.
- **"It just hangs"** — filtered (firewall) or unreachable. *Fix:* `nc` (timeout) +
  `tcpdump` (SYN, no reply) confirms a drop; check firewalls (host + cloud) and
  routing.
- **"Connection refused"** — port closed/no service. *Fix:* `ss -tulpn` on the target;
  start the service; check the **bind address**.
- **Works by IP, not by name** — DNS. *Fix:* `dig @1.1.1.1 name` vs your resolver;
  `getent hosts` for `/etc/hosts` overrides.
- **tcpdump floods / catches nothing** — filter too broad or too narrow. *Fix:* scope
  to `host`/`port`, add `-c`, and pick the right interface (`-i any`).

Reproduce the decisive signature: a `tcpdump` of a connection to a firewalled port
shows outbound **SYN** packets with **no reply** (and SYN retransmits), while a closed
local port shows **SYN → RST** — packet-level proof of firewall vs closed.

## Assessment

**Passing requirement: at least 9 of 11 correct (≈82%) — the capstone.**

1. What is the layered troubleshooting method, and in what direction do you work?
2. Why corroborate a failed `ping` with a port/app test?
3. Which tool localizes packet loss to a specific hop?
4. What does `curl -v` reveal about a request's stages?
5. What's the packet signature of a firewall **drop** vs a **closed port** vs an
   **open** port?
6. What do retransmissions / duplicate ACKs indicate?
7. Why filter `tcpdump` tightly and limit with `-c`?
8. How do you save a capture for Wireshark, and what does Wireshark add?
9. What distinguishes a DNS problem from a routing problem in your tests?
10. **Practical:** capture and identify a TCP handshake.
11. **Practical:** distinguish a refused from a filtered port.

## Solutions & validation

1. Test each **layer** (link → data link → network → transport → application), usually
   **bottom-up**, stopping at the first that fails.
2. Many hosts/firewalls **drop ICMP** while serving real traffic, so ping can fail on
   a healthy host.
3. **`mtr`** (or traceroute) — per-hop loss/latency.
4. The **DNS lookup, TCP connect, TLS handshake, and HTTP** exchange — so you see
   which stage fails.
5. Drop = **SYN with no reply** (retransmits); closed = **SYN → RST**; open = **SYN →
   SYN/ACK → ACK**.
6. **Packet loss** on the path (congestion/lossy link) — correlate with `mtr`.
7. To avoid **flooding** (busy hosts) and capturing **sensitive** data; tight scope
   makes the signal readable.
8. `tcpdump -w file.pcap`; Wireshark adds a **GUI, protocol decoding, Follow TCP
   Stream, and expert analysis**.
9. Name fails but IP works ⇒ **DNS**; IP unreachable / `traceroute` breaks ⇒
   **routing**.
10. **Validation:** `tcpdump -n 'tcp port 443' -c 8` during a `curl` shows SYN, SYN/
    ACK, ACK.
11. **Validation:** `nc -zv` → refused (instant, RST) vs timeout (filtered); `tcpdump`
    confirms RST vs no-reply.

> [!TIP]
> 🎉 That completes the **Networking** track. You can reason in layers, wield the full
> CLI toolkit, and read packets to settle any "firewall or service?" question with
> evidence. That methodical, packet-aware approach is exactly what distinguishes a
> senior network/operations engineer — and it underpins security, cloud and SRE work.

## What's next

The roadmap continues into the platforms and practices that build on this foundation:
**security** (hardening, defense, incident response), **Git** and the **DevOps**
toolchain (Docker, Kubernetes, CI/CD, IaC), and the **cloud** — where networking
concepts reappear as VPCs, security groups, and load balancers. Everything you can now
diagnose at the packet level makes you faster and more credible across all of them.
