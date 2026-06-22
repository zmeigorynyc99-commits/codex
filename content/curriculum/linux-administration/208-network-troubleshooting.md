---
title: "Linux Administration — Network Troubleshooting from the Server"
slug: "linux-admin-network-troubleshooting"
track: "linux-administration"
trackName: "Linux System Administration"
module: "Networking Configuration"
order: 208
level: "Intermediate"
difficulty: "Intermediate"
distribution: "General Linux"
category: "Linux Administration"
tags: [linux, networking, troubleshooting, ping, mtr, ss, tcpdump, curl, intermediate]
cover: "/covers/curriculum/linux-administration.svg"
estMinutes: 65
status: "published"
summary: "A methodical, layer-by-layer playbook for diagnosing any network problem from a Linux server: link and address with ip, reachability with ping and mtr, ports and listeners with ss, name resolution with dig, application checks with curl, and seeing real packets with tcpdump."
seoTitle: "Linux Administration 8: Network Troubleshooting (ping, ss, mtr, tcpdump)"
seoDescription: "Intermediate Linux: a layered network troubleshooting playbook with ip, ping, mtr, ss, dig, curl and tcpdump to diagnose connectivity, ports and packet-level issues. Lab + assessment."
---

"The server can't reach the database." "The website is down from here." Vague
network complaints are a daily reality, and the engineers who fix them fast all do
the same thing: they **work the layers methodically** instead of guessing. This
lesson gives you that playbook — a repeatable sequence from "is the cable up?" to
"let's watch the actual packets" — using the standard toolkit: `ip`, `ping`, `mtr`,
`ss`, `dig`, `curl`, and an introduction to **`tcpdump`**. It ties together
everything in this module.

## Learning objectives

By the end of this lesson you will be able to:

- Apply a **layered troubleshooting method** (link → IP → route → DNS → port → app).
- Check link/address with `ip`, reachability with `ping`, and path with `mtr`.
- Inspect listening ports and connections with **`ss`**.
- Test an application endpoint with **`curl`** and resolution with `dig`/`getent`.
- Capture and read packets with **`tcpdump`** for the hard cases.

## Part 1 — Troubleshoot in layers (the method)

Random poking wastes time. Work **up the stack**, confirming each layer before
moving on — the answer is usually the first layer that fails:

1. **Link** — is the interface up? `ip -br link`
2. **Address** — does it have the right IP? `ip -br a`
3. **Route** — is there a path out? `ip route`, `ip route get <ip>`
4. **Reachability** — can you reach the target IP? `ping`, `mtr`
5. **DNS** — does the name resolve? `getent hosts`, `dig`
6. **Port** — is the service listening / the port open? `ss`, `nc`
7. **Application** — does the service actually answer? `curl`

Each layer has a go-to command. When you find the layer that fails, you've found the
problem class — and the earlier lessons in this module tell you how to fix it.

> [!TIP]
> Resist jumping to step 7. Most "the app is broken" tickets are actually step 4
> (firewall/route) or step 5 (DNS). Spending ten seconds each on link → address →
> route → ping → DNS → port, in order, finds the real layer faster than an hour of
> staring at application logs.

## Part 2 — Link, address, route (layers 1–3)

```bash
ip -br link                    # is the interface UP? (DOWN = layer-1/driver issue)
ip -br a                       # does it have the expected IP/prefix?
ip route                       # is there a default route / route to the target?
ip route get 10.0.0.5          # which interface/gateway WOULD be used for this IP
```

If the interface is `DOWN`, bring it up (`sudo ip link set eth0 up`) and check
cabling/driver/VM settings. If there's no IP, revisit Netplan/nmcli (Lesson 205). If
there's no route, revisit routing (Lesson 207). Confirm these three before
suspecting anything further out.

## Part 3 — Reachability and path (layer 4)

```bash
ping -c4 192.168.1.1           # can I reach the gateway? (local network ok?)
ping -c4 1.1.1.1               # can I reach the internet by IP? (routing ok?)
ping -c4 botera.md             # by name (this also tests DNS — layer 5)
```

`ping` tells you *whether* you can reach a host. **`mtr`** tells you *where* the path
breaks — it combines `traceroute` and continuous `ping`, showing loss at each hop:

```bash
mtr 1.1.1.1                    # live, per-hop latency and loss (q to quit)
mtr --report -c 10 botera.md   # a 10-cycle report you can capture/share
traceroute botera.md           # the classic one-shot path trace
```

> [!IMPORTANT]
> **A failed `ping` doesn't always mean "unreachable."** Many hosts and firewalls
> **drop ICMP** (ping) on purpose while still serving real traffic — so a server can
> be perfectly up yet not answer ping. Always corroborate with a **port/app** test
> (`ss`, `curl`, `nc`) before declaring a host down. Conversely, ping working but the
> app failing points you at layers 6–7.

## Part 4 — Ports and listeners (layer 6)

The two sides of a port problem: is **my** service listening, and can I reach the
**remote** port?

```bash
# Local: what is listening on THIS server?
ss -tulpn                      # TCP/UDP listening sockets with the owning process
ss -tulpn | grep :443          # is anything listening on 443?
ss -tn state established       # current established TCP connections

# Remote: is a port open on ANOTHER host?
nc -zv db01 5432               # can I open TCP 5432 to db01? (z=scan, v=verbose)
curl -v telnet://db01:5432     # alternative connectivity probe
timeout 3 bash -c '</dev/tcp/db01/5432' && echo open || echo "closed/filtered"
```

The classic four-way diagnosis of "can't connect to a service":

1. Is the service **running**? (`systemctl status`, Lesson 116)
2. Is it **listening** on the expected address/port? (`ss -tulpn` — note `127.0.0.1`
   vs `0.0.0.0`!)
3. Is a **firewall** blocking it? (server `ufw`/`firewalld` and any cloud security
   group)
4. Does the **name resolve** to the right IP? (`getent hosts`)

> [!IMPORTANT]
> A service listening on **`127.0.0.1:5432`** is reachable **only from the server
> itself**, not from other machines — a hugely common "I can't connect remotely"
> cause. `ss -tulpn` shows the bind address: `127.0.0.1` = local-only, `0.0.0.0`
> (or `*`/`::`) = all interfaces. Fix it by configuring the service to bind to the
> right address — not by opening more firewall holes.

## Part 5 — Application check (layer 7) with curl

`curl` confirms the service actually *responds* correctly, beyond just an open port:

```bash
curl -I https://botera.md             # headers + status code (200? 502? timeout?)
curl -v https://botera.md             # verbose: DNS, TCP connect, TLS, request/response
curl --resolve botera.md:443:203.0.113.10 https://botera.md   # bypass DNS, test a SPECIFIC server
curl -s -o /dev/null -w '%{http_code} %{time_total}s\n' https://botera.md  # status + timing
```

`curl -v` is a layered diagnostic in itself — it shows the DNS lookup, the TCP
connection, the TLS handshake, and the HTTP exchange, so you can see *exactly* which
step fails (name? connect? certificate? HTTP error?).

## Part 6 — Seeing real packets with tcpdump

When higher-level tools leave you unsure, **`tcpdump`** shows the actual packets on
the wire — the ground truth. A first, practical taste:

```bash
sudo tcpdump -i any -n host 10.0.0.5            # all traffic to/from that host (-n = no DNS)
sudo tcpdump -i eth0 -n port 443                # just HTTPS traffic on eth0
sudo tcpdump -i any -n 'tcp port 5432' -c 20    # 20 packets to/from Postgres, then stop
sudo tcpdump -i any -n icmp                     # watch pings
```

Reading it, you can answer questions nothing else can: *Are my packets even leaving?
Is the other side replying? Are SYNs going out with no SYN-ACK coming back (a
firewall drop)?* For example, repeated outbound `SYN` with no reply is the classic
signature of a **firewall silently dropping** the connection.

> [!IMPORTANT]
> `tcpdump` is powerful and can capture **sensitive data**, so use it deliberately:
> filter tightly (host/port), limit with `-c <count>`, and avoid capturing plaintext
> traffic you shouldn't. On a busy server an unfiltered capture floods instantly —
> always narrow with a `host`/`port` expression. Write to a file with `-w
> capture.pcap` to analyse later (e.g. in Wireshark).

## Hands-on lab

```bash
# 1. Walk the layers on your own machine
ip -br link                          # link up?
ip -br a                             # address?
ip route get 1.1.1.1                 # route out?
ping -c2 1.1.1.1                     # reachability
getent hosts botera.md               # DNS
curl -sI https://botera.md | head -1 # app responds? (status line)

# 2. Listeners on this host
ss -tulpn
ss -tulpn | grep -E ':80|:443|:22'   # the usual suspects
ss -tn state established | head      # who am I connected to?

# 3. Remote port probe (pick a real reachable service)
nc -zv botera.md 443 2>&1 || echo "use a host you can reach"

# 4. curl as a layered diagnostic
curl -v https://botera.md 2>&1 | grep -E 'Trying|Connected|SSL|HTTP/' | head

# 5. A tiny, tightly-filtered packet capture (Ctrl+C or -c stops it)
sudo tcpdump -i any -n -c 10 icmp &      # capture 10 ping packets
ping -c3 1.1.1.1 >/dev/null; wait        # generate some, then see them

# 6. The "listening locally only" check
ss -tulpn | awk '/127.0.0.1/{print "local-only:", $0}'
```

## Exercises

1. Walk all seven layers for reaching `https://botera.md` from your server, writing
   the command and result at each step.
2. List every port your server is listening on and identify which are bound to
   `127.0.0.1` (local-only) versus all interfaces.
3. Use `mtr --report` to capture a 10-cycle path to a public host and identify any
   hop with packet loss.
4. Use `curl -v` to a website and point out the lines showing DNS resolution, TCP
   connect, TLS, and the HTTP status.
5. Capture exactly 10 packets to/from one host/port with `tcpdump`, and explain why
   tight filtering matters.

## Troubleshooting

- **"Host is down" but it's actually up** — ICMP is filtered. *Fix:* don't rely on
  ping alone; test the real **port/app** with `ss`/`nc`/`curl`.
- **Service runs but remote clients can't connect** — bound to `127.0.0.1`, or a
  firewall blocks it. *Fix:* check the **bind address** in `ss -tulpn`; reconfigure
  the service to listen on the right interface; verify `ufw`/cloud firewall.
- **Intermittent connectivity / packet loss** — find *where* with `mtr` (which hop
  loses packets); loss at the final hop points at the destination, mid-path at a
  transit link.
- **`curl` hangs then times out** — could be DNS (no resolution), routing
  (no path), or a firewall dropping the SYN. *Fix:* `curl -v` shows which step
  stalls; corroborate with `tcpdump` (outbound SYN, no reply ⇒ filtered).
- **TLS/certificate errors in curl** — name/cert mismatch or expired cert. *Fix:*
  `curl -v` shows the TLS detail; test the specific server with `--resolve`.

Reproduce the local-only trap: start a simple listener bound to localhost
(`python3 -m http.server 8080 --bind 127.0.0.1 &`), confirm `curl 127.0.0.1:8080`
works but it's absent from another host, see it in `ss -tulpn` as `127.0.0.1:8080`,
then stop it.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Run the practical items.

1. List the troubleshooting layers in order from link to application.
2. Why shouldn't a failed `ping` alone make you conclude a host is down?
3. What does `mtr` show that a single `ping` doesn't?
4. Which command lists listening ports with their owning process?
5. What's the significance of a service listening on `127.0.0.1` vs `0.0.0.0`?
6. Give the four-way diagnosis for "can't connect to a service."
7. What does `curl -v` reveal about the stages of a request?
8. What is `tcpdump` for, and name two safety/practical precautions when using it.
9. **Practical:** show all listeners on your server and flag the local-only ones.
   Command?
10. **Practical:** capture 10 ICMP packets with tcpdump while you ping. Commands?

## Solutions & validation

1. **Link → Address → Route → Reachability → DNS → Port → Application.**
2. Many hosts/firewalls **drop ICMP** deliberately while serving real traffic, so
   ping can fail on a perfectly healthy host; confirm with a port/app test.
3. Per-**hop** latency and **packet loss** along the whole path (where it breaks),
   continuously — combining traceroute and ping.
4. `ss -tulpn`.
5. `127.0.0.1` = reachable **only from the server itself**; `0.0.0.0`/`*` = reachable
   on **all interfaces** (remotely). A local-only bind is a common "can't connect
   remotely" cause.
6. Is the service **running**? Is it **listening** on the right address/port? Is a
   **firewall** blocking it? Does the **name resolve** correctly?
7. The **DNS lookup, TCP connection, TLS handshake, and HTTP request/response** — so
   you see exactly which stage fails.
8. Capturing/inspecting **actual packets** on the wire; precautions: **filter
   tightly** (host/port) and **limit** with `-c`, and avoid capturing **sensitive/
   plaintext** data.
9. **Validation:** `ss -tulpn` lists listeners; entries with `127.0.0.1:` are
   local-only.
10. **Validation:** `sudo tcpdump -i any -n -c 10 icmp` while running `ping -c3
    1.1.1.1` shows the echo request/reply packets.

> [!TIP]
> Keep the layered checklist on a sticky note until it's automatic. "Link, address,
> route, ping, DNS, port, app" — run in order, stop at the first failure — turns
> intimidating network problems into a five-minute, repeatable diagnosis. It's one
> of the most transferable skills in all of operations.

## What's next

That completes the **Networking Configuration** module. You can now configure a
server's addressing, name resolution and routing, and diagnose problems methodically
across every layer. Next, the track moves into **Scheduling, Logging & Time** —
cron and systemd timers in depth, centralised logging with journald and rsyslog,
log rotation, and keeping clocks correct with chrony/NTP — the operational backbone
of a well-run server.
