---
title: "Networking — IP Addressing & Subnetting"
slug: "networking-ip-addressing-and-subnetting"
track: "networking"
trackName: "Networking"
module: "Foundations"
order: 502
level: "Intermediate"
difficulty: "Intermediate"
distribution: "Cross-platform"
category: "Networking"
tags: [networking, ipv4, subnetting, cidr, subnet-mask, intermediate]
cover: "/covers/curriculum/networking.svg"
estMinutes: 70
status: "published"
summary: "The layer-3 skill every network role demands. Understand IPv4 addresses and subnet masks, read and use CIDR notation, compute network/broadcast addresses and usable host ranges, subnet a network into smaller pieces, and recognize private ranges — with the subnet cheat sheet as your reference."
seoTitle: "Networking 2: IP Addressing & Subnetting (CIDR, masks, /27)"
seoDescription: "Intermediate networking: IPv4 addresses, subnet masks, CIDR, computing network/broadcast/host ranges, subnetting (e.g. /27), and private ranges. Hands-on lab and assessment."
---

Subnetting is the skill that intimidates beginners and that every networking
interview and certification tests — and once it clicks, it's genuinely simple
arithmetic. This lesson demystifies **IPv4 addressing**, **subnet masks** and
**CIDR**, then teaches you to compute a subnet's **network address, broadcast
address, and usable host range**, and to **carve a network into subnets**. Keep the
**subnet cheat sheet** (in the sidebar of the lessons page) open as you work — it
turns the math into lookups.

## Learning objectives

By the end of this lesson you will be able to:

- Read an IPv4 address and its **subnet mask** / **CIDR** prefix.
- Compute the **network** and **broadcast** addresses and **usable host range**.
- Calculate **how many hosts/subnets** a prefix gives.
- **Subnet** a network into equal smaller networks.
- Recognize **private** ranges and special addresses.

## Part 1 — IPv4 addresses and masks

An **IPv4 address** is 32 bits, written as four **octets** (0–255) separated by dots:
`192.168.1.50`. Those 32 bits split into a **network portion** and a **host
portion** — the **subnet mask** says where the split is. The mask is also 32 bits:
**1s mark the network part, 0s mark the host part**.

```text
IP:    192.168.1.50    = 11000000.10101000.00000001.00110010
Mask:  255.255.255.0   = 11111111.11111111.11111111.00000000
                          \------ network ------/ \- host -/
```

**CIDR notation** writes the mask as a slash + the number of network (1) bits:
`/24` = 24 ones = `255.255.255.0`. So `192.168.1.50/24` means "this host, on the
network where the first 24 bits are the network ID." CIDR is how addresses are
written everywhere today.

```text
/8  = 255.0.0.0          /24 = 255.255.255.0
/16 = 255.255.0.0        /27 = 255.255.255.224
```

## Part 2 — Network, broadcast, and host range

Given an address and prefix, three values define the subnet:

- **Network address** — the first address (host bits all **0**); identifies the
  subnet, not assignable to a host.
- **Broadcast address** — the last address (host bits all **1**); reaches every host
  on the subnet, not assignable.
- **Usable host range** — everything **in between**.

Work an example: **`192.168.1.50/24`**

```text
Host bits = 32 - 24 = 8  -> block size in the last octet = 2^8 = 256
Network:   192.168.1.0      (host bits 0)
Broadcast: 192.168.1.255    (host bits 1)
Hosts:     192.168.1.1  ...  192.168.1.254   (254 usable)
Total addresses = 2^8 = 256 ;  usable = 256 - 2 = 254
```

The two key formulas:

```text
total addresses = 2 ^ (32 - prefix)
usable hosts    = total - 2          (minus network + broadcast)
```

So a **/24** = 256 total, **254** usable; a **/27** = 2^(32-27) = 32 total, **30**
usable. (Exceptions: a **/31** is a 2-address point-to-point link with no network/
broadcast waste — RFC 3021; a **/32** is a single host.)

> [!TIP]
> For non-/24 masks, find the **block size** = `256 - mask_octet` in the octet the
> prefix lands in. For `/27`, the 4th-octet mask is **224**, so block size = `256-224
> = 32` → subnets step every 32: `.0, .32, .64, .96, ...`. The network is the
> multiple of the block size at or below your host; the broadcast is one less than
> the next. This "block size" trick is the heart of fast subnetting.

## Part 3 — Worked example: a /27

Take **`10.0.0.70/27`**:

```text
Prefix /27 -> 4th-octet mask = 224 -> block size = 256 - 224 = 32
Subnets step:  .0, .32, .64, .96, .128, ...
70 falls in the .64 block (64 <= 70 < 96)
Network:   10.0.0.64
Broadcast: 10.0.0.95        (one below the next block, .96)
Hosts:     10.0.0.65 ... 10.0.0.94   (30 usable)
```

That's the entire skill: **block size → which block your host is in → network,
broadcast, range.** Practice a dozen and it becomes instant. The cheat sheet gives
you the mask, block size and host count per prefix at a glance.

## Part 4 — Subnetting: dividing a network

Subnetting **borrows host bits to make more networks**. Each borrowed bit **doubles**
the number of subnets and **halves** the hosts per subnet.

Example: split **`192.168.1.0/24`** into 4 subnets. You need 4 = 2² subnets, so
borrow **2 bits** → new prefix **/26** (24+2). Block size = `256 - 192 = 64`:

```text
/26 subnets of 192.168.1.0/24:
  192.168.1.0/26    hosts .1–.62     broadcast .63
  192.168.1.64/26   hosts .65–.126   broadcast .127
  192.168.1.128/26  hosts .129–.190  broadcast .191
  192.168.1.192/26  hosts .193–.254  broadcast .255
Each: 2^(32-26) = 64 total, 62 usable.
```

The trade-off, stated as formulas:

```text
number of subnets    = 2 ^ (borrowed bits)
hosts per subnet     = 2 ^ (32 - new_prefix) - 2
```

> [!IMPORTANT]
> Subnetting is always a **trade-off between number of subnets and hosts per
> subnet** — the 32 bits are fixed, so more networks means fewer hosts each. Plan
> from requirements: "I need N subnets" → borrow `ceil(log2(N))` bits; "I need H
> hosts per subnet" → leave `ceil(log2(H+2))` host bits. **VLSM** (variable-length
> masks) lets different subnets use different sizes from one block, sizing each to
> its need instead of wasting addresses.

## Part 5 — Private ranges and special addresses

Not all addresses are public. Memorize the **private ranges** (RFC 1918) used inside
LANs (and NAT'd to public IPs to reach the internet):

| Range | CIDR | Size |
|-------|------|------|
| `10.0.0.0 – 10.255.255.255` | `10.0.0.0/8` | ~16.7M |
| `172.16.0.0 – 172.31.255.255` | `172.16.0.0/12` | ~1M |
| `192.168.0.0 – 192.168.255.255` | `192.168.0.0/16` | 65K |

Other special addresses to know:

- **`127.0.0.0/8`** — loopback (`127.0.0.1` = localhost, "this machine").
- **`169.254.0.0/16`** — link-local / APIPA (a host that **failed to get DHCP** —
  a useful diagnostic signal).
- **`0.0.0.0`** — "this host" / "any" (e.g. a service binding to all interfaces).
- **`/0`** (`0.0.0.0/0`) — the default route, "everything."

## Hands-on lab

```bash
# Linux has tools that do the subnet math for you — great for checking your work.
sudo apt install -y ipcalc 2>/dev/null || true

# 1. Let ipcalc confirm a /24 and a /27 (compare to your hand calculation)
ipcalc 192.168.1.50/24   2>/dev/null || python3 - <<'EOF'
import ipaddress
for c in ["192.168.1.50/24", "10.0.0.70/27", "192.168.1.0/26"]:
    n = ipaddress.ip_interface(c).network
    hosts = list(n.hosts())
    print(f"{c:18} network={n.network_address} broadcast={n.broadcast_address} "
          f"usable={hosts[0]}..{hosts[-1]} count={n.num_addresses-2}")
EOF

# 2. Subnet a /24 into four /26s with Python's ipaddress
python3 - <<'EOF'
import ipaddress
net = ipaddress.ip_network("192.168.1.0/24")
for sub in net.subnets(new_prefix=26):
    h = list(sub.hosts())
    print(f"{sub}  hosts {h[0]}..{h[-1]}  broadcast {sub.broadcast_address}")
EOF

# 3. Check which block an address falls into (your own subnetting)
python3 - <<'EOF'
import ipaddress
ip = ipaddress.ip_interface("10.0.0.70/27")
print("address:", ip.ip, " network:", ip.network.network_address,
      " broadcast:", ip.network.broadcast_address)
EOF

# 4. Identify private vs public and special addresses
python3 - <<'EOF'
import ipaddress
for a in ["10.5.4.3","192.168.0.10","172.20.1.1","8.8.8.8","127.0.0.1","169.254.0.5"]:
    ip = ipaddress.ip_address(a)
    print(f"{a:15} private={ip.is_private} loopback={ip.is_loopback} "
          f"linklocal={ip.is_link_local}")
EOF
```

## Exercises

1. For `172.16.20.200/24`: give the network, broadcast, usable host range, and host
   count — by hand, then verify with `ipcalc`/`ipaddress`.
2. For `10.0.0.130/26`: compute block size, the network it belongs to, the
   broadcast, and the usable range.
3. How many usable hosts does a `/28` give? A `/30`? A `/22`? Use the formula, then
   check against the cheat sheet.
4. Subnet `192.168.10.0/24` into **8** equal subnets: state the new prefix and list
   the network address of each.
5. Classify these as private/public/special: `10.10.10.10`, `172.32.0.1`,
   `192.168.50.1`, `169.254.1.1`, `203.0.113.5`.

## Troubleshooting

- **Off-by-one on broadcast/host range** — broadcast is **one below the next block's
  network**; first host = network + 1, last host = broadcast − 1.
- **Wrong block size** — block size = `256 − mask_octet` in the octet the prefix
  falls in (e.g. /27 → 256−224 = 32).
- **Counted network/broadcast as usable** — subtract 2 (except /31 and /32).
- **`169.254.x.x` on a host** — it **failed DHCP** (APIPA); fix DHCP/link, not the
  address.
- **Two devices "on the same subnet" can't talk** — mismatched masks put them on
  different networks; verify both use the same prefix.

Reproduce a common subnetting check: by hand, `10.0.0.70/27` → network `.64`,
broadcast `.95`; confirm with `python3 -c "import ipaddress;
print(ipaddress.ip_interface('10.0.0.70/27').network)"` → `10.0.0.64/27`.

## Assessment

**Passing requirement: at least 9 of 11 correct (≈82%) — subnetting is core.**

1. What does a subnet mask define, and how does CIDR express it?
2. What are the network and broadcast addresses (in terms of host bits)?
3. Give the formulas for total addresses and usable hosts.
4. For `/27`, what is the subnet mask and the block size?
5. For `10.0.0.70/27`: network, broadcast, and usable range?
6. How many usable hosts in a `/28`? In a `/30`?
7. To split a `/24` into 4 subnets, what new prefix do you use and why?
8. State the trade-off subnetting always involves.
9. List the three RFC 1918 private ranges.
10. **Practical:** verify a subnet's network/broadcast with a tool. Command?
11. **Practical:** subnet `192.168.1.0/24` into `/26`s and list them.

## Solutions & validation

1. It marks which bits are **network** (1s) vs **host** (0s); CIDR writes the count
   of network bits as `/n`.
2. **Network** = host bits all **0** (first address); **broadcast** = host bits all
   **1** (last address).
3. total = `2^(32-prefix)`; usable = `total - 2`.
4. `/27` → mask **255.255.255.224**; block size **32** (256−224).
5. Network **10.0.0.64**, broadcast **10.0.0.95**, usable **10.0.0.65–10.0.0.94**.
6. `/28` → 2^4−2 = **14**; `/30` → 2^2−2 = **2**.
7. **/26** — 4 = 2², so borrow **2** host bits (24+2).
8. More **subnets** means fewer **hosts per subnet** (the 32 bits are fixed).
9. `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`.
10. **Validation:** `ipcalc 172.16.20.200/24` or `python3 -c "import ipaddress;
    print(ipaddress.ip_interface('172.16.20.200/24').network)"`.
11. **Validation:** `python3 -c "import ipaddress; [print(s) for s in
    ipaddress.ip_network('192.168.1.0/24').subnets(new_prefix=26)]"`.

> [!TIP]
> Drill subnetting until block-size math is reflexive, and keep the cheat sheet for
> the mask/host-count lookups. It shows up in Network+, CCNA, cloud VPC design, and
> every firewall rule — the time you invest here pays back across your whole career.

## What's next

Next: **Lesson 503 — Ethernet, MAC & Switching.** Dropping to layer 2: how devices on
the same network actually find and reach each other with **MAC addresses** and
**ARP**, how **switches** forward frames, and how **VLANs** segment a LAN — the local
delivery beneath the IP layer you just mastered.
