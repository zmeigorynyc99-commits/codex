---
title: "Networking — DNS Deep Dive"
slug: "networking-dns-deep-dive"
track: "networking"
trackName: "Networking"
module: "Core Protocols"
order: 506
level: "Intermediate"
difficulty: "Intermediate"
distribution: "Cross-platform"
category: "Networking"
tags: [networking, dns, records, resolution, dig, intermediate]
cover: "/covers/curriculum/networking.svg"
estMinutes: 55
status: "published"
summary: "The internet's phone book, in detail. How a name resolves through the DNS hierarchy (root → TLD → authoritative), the record types you must know (A, AAAA, CNAME, MX, TXT, NS), recursive vs authoritative resolvers, caching and TTLs, and debugging resolution with dig."
seoTitle: "Networking 6: DNS Deep Dive (records, resolution, dig, TTL)"
seoDescription: "Intermediate networking: the DNS hierarchy and resolution flow, record types (A/AAAA/CNAME/MX/TXT/NS), recursive vs authoritative servers, caching/TTL, and dig debugging. Lab + assessment."
---

DNS turns `botera.md` into an IP — and when it breaks, "the internet is down" even
though everything else works. This lesson goes deep on how name resolution actually
happens: the **hierarchy** (root → TLD → authoritative), the **record types** you'll
configure and query, **recursive vs authoritative** servers, **caching and TTLs**,
and using **`dig`** to debug. DNS is one of the highest-leverage topics in
networking — it's behind a huge share of "mysterious" outages.

## Learning objectives

By the end of this lesson you will be able to:

- Trace the **resolution flow** through the DNS hierarchy.
- Identify the key **record types** (A, AAAA, CNAME, MX, TXT, NS, PTR).
- Distinguish **recursive** from **authoritative** name servers.
- Explain **caching** and **TTL** and their trade-offs.
- Debug resolution with **`dig`**.

## Part 1 — The resolution flow

DNS is a **distributed hierarchy**, read right-to-left from the dot: `www.botera.md.`
= root (`.`) → TLD (`md`) → domain (`botera`) → host (`www`). Resolving a name your
**recursive resolver** hasn't cached walks the hierarchy:

```text
1. Your resolver asks a ROOT server:        "where is .md ?"   -> TLD servers
2. Asks the .md TLD server:                 "where is botera.md ?" -> authoritative NS
3. Asks botera.md's AUTHORITATIVE server:   "what is www.botera.md ?" -> the A record (IP)
4. Resolver caches the answer (per its TTL) and returns the IP to you.
```

Your device asks **one** resolver (configured via DHCP or statically); that resolver
does the recursive legwork and caches results so the next lookup is instant.

```bash
dig +trace botera.md     # watch the hierarchy walk: root -> TLD -> authoritative
```

## Part 2 — Record types

A DNS **zone** holds **records**, each a name → value mapping of a given **type**:

| Type | Maps | Example |
|------|------|---------|
| **A** | name → **IPv4** | `botera.md → 203.0.113.10` |
| **AAAA** | name → **IPv6** | `botera.md → 2001:db8::10` |
| **CNAME** | name → **another name** (alias) | `www → botera.md` |
| **MX** | domain → **mail server** (with priority) | `botera.md → 10 mail.botera.md` |
| **TXT** | name → **arbitrary text** (SPF, DKIM, verification) | `"v=spf1 ..."` |
| **NS** | domain → **authoritative name servers** | `botera.md → ns1.provider.net` |
| **PTR** | IP → **name** (reverse DNS) | `10.113.0.203.in-addr.arpa → botera.md` |
| **SOA** | zone **administrative info** | serial, refresh, TTL defaults |

> [!IMPORTANT]
> A **CNAME** is an alias to **another name** (not an IP), and a name with a CNAME
> can't also have other records — a common gotcha is putting a CNAME at the zone apex
> (`botera.md` itself), which the spec forbids (use an A record or provider "ALIAS/
> ANAME" there). **MX** records point to mail servers by **name** (which must resolve
> via A/AAAA), with a **priority** (lower = preferred). **TXT** records carry email-
> auth (SPF/DKIM/DMARC) and domain-verification strings.

## Part 3 — Recursive vs authoritative

Two distinct server roles, often confused:

- **Authoritative** server — holds the **actual records** for a zone (the source of
  truth, run by the domain owner / DNS provider). It answers "I *am* the authority for
  botera.md; here's the A record."
- **Recursive resolver** (caching resolver) — the server **your devices query**. It
  doesn't own any records; it **walks the hierarchy** on your behalf, **caches** the
  answers, and returns them. Examples: your ISP's resolver, `1.1.1.1` (Cloudflare),
  `8.8.8.8` (Google).

```bash
dig botera.md @1.1.1.1     # ask a specific RECURSIVE resolver
dig NS botera.md           # find the AUTHORITATIVE name servers
dig botera.md @ns1.example # ask the authoritative server directly (no caching)
```

## Part 4 — Caching and TTL

Every record has a **TTL** (time to live, in seconds) telling resolvers **how long to
cache** it. Caching makes DNS fast and reduces load, but means changes **propagate
slowly** — old answers persist until TTLs expire.

```bash
dig botera.md              # the ANSWER section shows the record's remaining TTL
```

The trade-off:

- **High TTL** (e.g. 86400 = 1 day) — great caching, less load, but slow to change.
- **Low TTL** (e.g. 300 = 5 min) — quick changes, more queries.

> [!IMPORTANT]
> **Before a planned IP change/migration, lower the TTL** (e.g. to 300s) a day ahead
> so the cutover propagates quickly; raise it again afterward. "I changed the DNS but
> it still points to the old server" is almost always **caching** — the old record is
> cached somewhere (your resolver, your OS, your browser) until its TTL expires. You
> can't force the whole internet to forget instantly; plan around TTLs. Check what a
> specific resolver currently returns with `dig @resolver name`.

## Part 5 — Debugging with dig

`dig` is the precise DNS tool (install `dnsutils`/`bind-utils`):

```bash
dig botera.md                 # full answer (record, TTL, which server answered)
dig +short botera.md          # just the IP(s)
dig AAAA botera.md            # IPv6
dig MX botera.md +short       # mail servers
dig TXT botera.md +short      # SPF/verification text
dig NS botera.md +short       # authoritative name servers
dig -x 1.1.1.1                # reverse lookup (PTR): IP -> name
dig botera.md @8.8.8.8        # query a SPECIFIC resolver (compare answers)
dig +trace botera.md          # walk the hierarchy from the root
```

The everyday diagnoses: compare `dig name` (your resolver) with `dig name @1.1.1.1`
(a public one) — if they differ, your local resolver/cache is the issue; `dig +trace`
shows where the hierarchy walk breaks; `dig NS` confirms the right authoritative
servers are in place after a change.

## Hands-on lab

```bash
sudo apt install -y dnsutils 2>/dev/null || true

# 1. Basic resolution and the TTL
dig botera.md
dig +short botera.md

# 2. Different record types
dig +short AAAA botera.md
dig +short MX gmail.com | head
dig +short TXT botera.md
dig +short NS botera.md

# 3. Authoritative vs recursive — compare answers
dig +short botera.md @1.1.1.1        # public recursive resolver
dig NS botera.md +short              # who is authoritative

# 4. Walk the hierarchy
dig +trace botera.md | sed -n '1,20p'

# 5. Reverse DNS (PTR)
dig -x 8.8.8.8 +short

# 6. The "system vs DNS" comparison (ties to the Linux admin lesson)
getent hosts botera.md               # how the OS resolves (hosts file + DNS)
```

## Exercises

1. Resolve a domain's A record and note the TTL in the answer; query it again and
   observe the TTL counting down (cached).
2. Look up the MX records for a well-known email domain and identify the highest-
   priority (lowest number) mail server.
3. Find the authoritative name servers (`NS`) for a domain, then query one of them
   directly with `@`.
4. Use `dig +trace` to follow a name from the root servers to the authoritative
   answer, and identify each tier (root, TLD, authoritative).
5. Do a reverse lookup (`dig -x`) on a public IP and explain what a PTR record is for.

## Troubleshooting

- **Name won't resolve at all** — resolver/connectivity. *Fix:* `dig name @1.1.1.1`
  (works ⇒ local resolver misconfigured); check the configured resolver; `getent
  hosts` for `/etc/hosts` overrides.
- **Changed DNS but old IP persists** — **caching/TTL**. *Fix:* wait for the TTL;
  verify the authoritative server already returns the new value (`dig name @authNS`);
  lower TTL before future changes.
- **Email not delivering** — MX/SPF/DKIM issues. *Fix:* `dig MX` (correct servers
  resolving via A?) and `dig TXT` (valid SPF/DKIM/DMARC?).
- **CNAME errors at the domain apex** — not allowed. *Fix:* use an A record (or
  provider ALIAS/ANAME) at the apex.
- **Different answers from different resolvers** — propagation in progress or a split
  view. *Fix:* compare `dig @resolverA` vs `@resolverB`; check authoritative.

Reproduce the caching effect: `dig botera.md` twice quickly — the second response's
**TTL is lower** (counting down from the cache), proving the resolver cached the
first answer.

## Assessment

**Passing requirement: at least 9 of 11 correct (≈82%).**

1. Read right-to-left, what are the tiers of `www.botera.md`?
2. Describe the resolution flow for an uncached name.
3. What do A, AAAA, CNAME, MX, TXT, NS, and PTR records do?
4. Why can't a CNAME exist at the zone apex with other records?
5. Distinguish an authoritative server from a recursive resolver.
6. What is a TTL, and what's the trade-off of high vs low?
7. What should you do to a record's TTL before a planned migration?
8. Which `dig` command walks the hierarchy from the root?
9. How do you query a specific resolver, and when is that useful?
10. **Practical:** show a domain's MX and NS records.
11. **Practical:** compare a domain's answer from your resolver vs `1.1.1.1`.

## Solutions & validation

1. root (`.`) → TLD (`md`) → domain (`botera`) → host (`www`).
2. Resolver asks **root** (→ TLD), then the **TLD** (→ authoritative), then the
   **authoritative** server (→ the record), caches and returns it.
3. A→IPv4, AAAA→IPv6, CNAME→alias to another name, MX→mail server (priority),
   TXT→text (SPF/DKIM/verify), NS→authoritative servers, PTR→reverse (IP→name).
4. The spec forbids a CNAME alongside other records, and the apex needs SOA/NS — so
   use an A (or provider ALIAS) there.
5. **Authoritative** holds the real records for a zone; **recursive** queries the
   hierarchy on clients' behalf and **caches**.
6. **TTL** = how long to cache a record; **high** = better caching/slow changes,
   **low** = fast changes/more queries.
7. **Lower** it (e.g. 300s) ahead of time so the change propagates quickly.
8. `dig +trace name`.
9. `dig name @resolver`; useful to **bypass local config**/compare and isolate
   whether DNS or the local resolver is at fault.
10. **Validation:** `dig MX domain +short` and `dig NS domain +short`.
11. **Validation:** `dig +short name` vs `dig +short name @1.1.1.1`.

> [!TIP]
> When something "works by IP but not by name," it's DNS — and `dig @1.1.1.1 name`
> vs your resolver, plus awareness of **TTL/caching**, resolves most of it. DNS
> changes are never instant; respect the TTL and you'll avoid a lot of false alarms.

## What's next

Next: **Lesson 507 — DHCP & Common Network Services.** How devices get their IP
automatically (the DHCP DORA process), plus a tour of the everyday services that make
a network usable — and where each lives — rounding out the protocols before the
troubleshooting capstone.
