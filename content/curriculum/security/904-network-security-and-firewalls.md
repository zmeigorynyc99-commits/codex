---
title: "Security — Network Security & Firewalls"
slug: "security-network-security-and-firewalls"
track: "security"
trackName: "Security & Defensive Operations"
module: "Defensive Operations"
order: 904
level: "Intermediate"
difficulty: "Intermediate"
distribution: "Cross-platform"
category: "Security"
tags: [security, firewall, network, ids, ips, vpn, zero-trust, segmentation]
cover: "/covers/curriculum/security.svg"
estMinutes: 60
status: "published"
summary: "Defend the network: stateful firewalls (host vs perimeter), segmentation and zero trust, IDS vs IPS, VPNs, and common network attacks (MITM, ARP/DNS spoofing, DDoS) — with hands-on host firewalling using ufw and a default-deny ruleset you can apply today."
seoTitle: "Security 4: Network Security, Firewalls, IDS/IPS & Zero Trust"
seoDescription: "Stateful firewalls, segmentation, zero trust, IDS vs IPS, VPNs, and network attacks (MITM, spoofing, DDoS), plus hands-on default-deny ufw/nftables. Lab + assessment."
---

The network is where attacks travel — and where you place many of your strongest controls.
This lesson covers **firewalls** (how stateful filtering works, host vs perimeter),
**segmentation** and the shift to **zero trust**, **IDS/IPS** for detection and blocking,
**VPNs** for secure transport, and the **attacks** you're defending against (MITM, ARP/DNS
spoofing, DDoS). You'll finish by building a **default-deny** host firewall — the single
most effective network control you can apply to a server today.

## Learning objectives

By the end of this lesson you will be able to:

- Explain **stateful** firewalling and the **default-deny** model.
- Distinguish **host** vs **network/perimeter** firewalls.
- Apply **segmentation** and describe **zero trust** ("never trust, always verify").
- Compare **IDS vs IPS** and signature vs anomaly detection.
- Recognize common network attacks (**MITM, ARP/DNS spoofing, DDoS**) and defenses.
- Configure a default-deny host firewall with **ufw** / **nftables**.

## Part 1 — Firewalls and stateful filtering

A firewall allows or blocks traffic by rules matching **interface, source/dest IP, port,
and protocol**. A **stateful** firewall tracks **connections**, so reply packets of an
allowed outbound flow are permitted automatically:

```text
Rule order matters — first match wins; end with a default policy.

Default DENY inbound, ALLOW established/related, allow only what you need:
  allow  in  established,related
  allow  in  tcp 22  from <admin-subnet>     # SSH, restricted source
  allow  in  tcp 443                          # HTTPS to the world
  deny   in  everything else                  # default deny
  allow  out anything (or tighten egress too)
```

- **Default-deny** (whitelist) is the secure default: block everything, then open exactly
  what's required — far safer than default-allow + blacklisting.
- **Egress filtering** (restricting *outbound*) is underused but valuable: it limits
  malware **C2/exfiltration** and lateral movement.

> [!IMPORTANT]
> Start from **default-deny inbound** and open the **minimum** ports to the **minimum
> sources**. SSH should not be open to `0.0.0.0/0` — restrict it to an admin subnet/VPN.
> First-match-wins means **rule order matters**: specific allows before the broad deny.
> Don't forget **egress** — controlling outbound traffic catches compromised hosts phoning
> home.

## Part 2 — Host vs perimeter, and segmentation

- **Network/perimeter firewall** — at the edge/between zones (the classic DMZ between
  internet and internal). Protects whole segments.
- **Host firewall** — on each server (`ufw`/`nftables`/Windows Defender Firewall, cloud
  **security groups**). Protects the individual host even if the perimeter is breached —
  essential in cloud and **assume-breach** designs.

**Segmentation** divides the network into zones (web / app / database / management) so a
compromise in one **can't freely reach** the others — limiting **blast radius** and
**lateral movement**. **Microsegmentation** takes this to per-workload policy.

## Part 3 — Zero trust

The old model trusted anything "inside the network." **Zero trust** drops that
assumption: **"never trust, always verify."**

- Every request is **authenticated, authorized, and encrypted** regardless of network
  location — there is no trusted interior.
- Access is **per-resource**, identity- and device-aware, least-privilege, and continuously
  evaluated.
- Implemented via strong identity (MFA), device posture, microsegmentation, and
  policy-driven access (e.g. identity-aware proxies, **mTLS** between services).

## Part 4 — IDS, IPS, and VPNs

- **IDS (Intrusion Detection System)** — **detects** and alerts on suspicious traffic
  (out-of-band, passive). E.g. Suricata/Snort, Zeek.
- **IPS (Intrusion Prevention System)** — sits **inline** and can **block** matching
  traffic in real time.
- Detection methods: **signature-based** (known bad patterns — precise, misses novel
  attacks) vs **anomaly/behavior-based** (flags deviations — catches unknowns, more false
  positives).
- **VPN** — encrypts traffic over untrusted networks (site-to-site or remote access);
  **WireGuard**/IPsec/OpenVPN. Note: a VPN secures **transport**, it is **not** zero trust
  by itself (it often grants broad network access — exactly what zero trust avoids).

## Part 5 — Common attacks and defenses

| Attack | What it is | Defenses |
|---|---|---|
| **MITM** | Attacker relays/alters traffic between two parties | TLS everywhere, cert validation, HSTS |
| **ARP spoofing** | Poison LAN ARP cache to intercept traffic | Dynamic ARP inspection, static ARP, segmentation |
| **DNS spoofing/poisoning** | Forge DNS answers to redirect | DNSSEC, DoH/DoT, trusted resolvers |
| **Port scanning / recon** | Map open ports/services | Default-deny, minimize exposure, rate-limit, IDS |
| **DDoS** | Overwhelm with traffic (availability) | Upstream scrubbing/CDN, rate limiting, anycast |
| **Lateral movement** | Spread after a foothold | Segmentation, least privilege, host firewalls, EDR |

## Hands-on lab

> Run on a host you control (a VM is ideal). A firewall mistake on a remote box can lock
> you out — keep console access.

```bash
# --- ufw: a default-deny web/SSH server (Debian/Ubuntu) ---
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow from 203.0.113.0/24 to any port 22 proto tcp   # SSH from admin subnet only
sudo ufw limit 22/tcp                                          # rate-limit SSH brute force
sudo ufw allow 443/tcp                                         # HTTPS to the world
sudo ufw enable
sudo ufw status verbose                                        # review the ruleset

# Inspect listening services you might NOT want exposed
ss -tulpn

# --- nftables equivalent (modern, distro-agnostic) ---
sudo nft list ruleset
# A minimal default-deny inbound table:
#   table inet filter {
#     chain input {
#       type filter hook input priority 0; policy drop;
#       ct state established,related accept
#       iif lo accept
#       tcp dport 22 ip saddr 203.0.113.0/24 accept
#       tcp dport 443 accept
#     }
#   }

# --- See detection in action (optional) ---
# sudo apt install suricata && sudo suricata -i eth0   # watch eve.json alerts
```

```text
Analysis: from `ss -tulpn`, list every listening service and decide keep/bind-local/
firewall. Anything on 0.0.0.0 that should be 127.0.0.1 is an exposure to fix.
```

## Exercises

1. Write a default-deny inbound policy for a server that serves HTTPS publicly and SSH only
   from `10.0.0.0/24`. Include the established/related rule and explain rule order.
2. Explain host vs perimeter firewalls and why you want both in the cloud.
3. Define zero trust and contrast it with the perimeter model; why isn't a VPN alone zero
   trust?
4. IDS vs IPS, and signature vs anomaly detection — give a scenario favoring each.
5. Pick three attacks from the table and give a concrete defense for each.
6. Use `ss -tulpn` on a machine and identify one service that should be firewalled or bound
   to localhost.

## Troubleshooting

- **Locked out after enabling the firewall** — denied your own SSH. *Fix:* allow your
  admin source **before** `enable`; keep console access.
- **Rule "ignored"** — order/first-match. *Fix:* put specific allows above the broad deny.
- **Service still reachable despite a rule** — another firewall layer (cloud security
  group) or it binds `0.0.0.0`. *Fix:* check all layers; bind to localhost where possible.
- **IPS blocking legit traffic** — false positives. *Fix:* tune signatures, start in
  detect (IDS) mode, then enforce.
- **Outbound malware traffic unnoticed** — no egress control/monitoring. *Fix:* egress
  filtering + DNS/flow monitoring.
- **MITM possible on internal traffic** — plaintext internal services. *Fix:* TLS/mTLS even
  internally (zero trust).

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Justify briefly.

1. What does "stateful" mean for a firewall?
2. Why is default-deny safer than default-allow?
3. Why run host firewalls when you already have a perimeter firewall?
4. Define segmentation and what it limits.
5. State the zero-trust principle in four words.
6. IDS vs IPS — the key difference?
7. Signature vs anomaly detection — one strength and weakness each.
8. Name two network attacks and a defense for each.
9. **Practical:** write a ufw/nftables default-deny ruleset allowing only 443 and
   restricted SSH.
10. **Practical:** use `ss -tulpn` to find an exposed service and say how you'd restrict it.

## Solutions & validation

1. It **tracks connections**, auto-allowing replies to permitted flows.
2. You block everything and open only the known-good — no reliance on enumerating all bad.
3. Defense in depth: a host firewall protects the box even if the perimeter (or cloud SG)
   is bypassed.
4. Dividing the network into zones so compromise can't spread; limits **blast radius/
   lateral movement**.
5. **Never trust, always verify.**
6. IDS **detects/alerts** (passive); IPS sits **inline** and **blocks**.
7. Signature: precise on known threats, misses novel ones. Anomaly: catches unknowns,
   more false positives.
8. e.g. MITM → TLS/cert validation; DDoS → upstream scrubbing/rate limiting.
9. **Validation:** see lab ufw/nftables ruleset (default deny + 443 + restricted 22).
10. **Validation:** identify a `0.0.0.0` listener and restrict via firewall or
    localhost bind.

> [!TIP]
> The highest-value network control you can apply today is a **default-deny host
> firewall** that exposes only what's needed, from only who needs it — plus **egress**
> awareness. Layer **segmentation** and **zero-trust identity** on top, and add **IDS/IPS**
> for detection. Network security is fundamentally about **shrinking the attack surface**
> and **limiting blast radius**.

## What's next

Next: **Lesson 905 — System Hardening.** Lock down the hosts themselves: patching,
removing unneeded services, secure SSH, account and sudo policy, kernel/sysctl tuning,
file permissions, and using benchmarks (CIS) — turning a default install into a hardened
server.
