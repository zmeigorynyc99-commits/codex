---
title: "Security — Fundamentals & the CIA Triad"
slug: "security-fundamentals-and-the-cia-triad"
track: "security"
trackName: "Security & Defensive Operations"
module: "Security Foundations"
order: 901
level: "Beginner"
difficulty: "Beginner"
distribution: "Cross-platform"
category: "Security"
tags: [security, cia-triad, threat-model, risk, defense-in-depth, beginner]
cover: "/covers/curriculum/security.svg"
estMinutes: 50
status: "published"
summary: "The mental model every security decision rests on: the CIA triad (confidentiality, integrity, availability), threats vs vulnerabilities vs risk, defense in depth and least privilege, and how to think like an attacker and a defender. The foundation for the whole security track."
seoTitle: "Security 1: CIA Triad, Threats, Risk & Defense in Depth"
seoDescription: "Beginner security: confidentiality/integrity/availability, threat vs vulnerability vs risk, defense in depth, least privilege, and basic threat modeling. Lab + assessment."
---

Security isn't a product you install — it's a way of **reasoning about risk**. Before any
firewall rule or password policy makes sense, you need the mental models that organize
every decision: the **CIA triad** (confidentiality, integrity, availability), the
vocabulary of **threat / vulnerability / risk**, and the design principles **defense in
depth** and **least privilege**. This lesson gives you the lens you'll use for the rest of
the track — and the rest of your career.

> [!NOTE]
> This track is **defensive** (blue team): protecting systems, detecting attacks, and
> responding to incidents on systems **you are authorized to secure**. Understanding how
> attackers think makes you a better defender — but only practice these techniques on
> systems you own or have **explicit written permission** to test.

## Learning objectives

By the end of this lesson you will be able to:

- Explain the **CIA triad** and classify a control by which property it protects.
- Distinguish **threat**, **vulnerability**, **risk**, and **exploit**.
- Apply **defense in depth** and **least privilege** to a design.
- Describe **AAA** (authentication, authorization, accounting) at a high level.
- Sketch a simple **threat model** for a system.

## Part 1 — The CIA triad

Three properties define what "secure" means for any asset:

| Property | Question it answers | Protected by |
|---|---|---|
| **Confidentiality** | Can only authorized parties read it? | Encryption, access control, classification |
| **Integrity** | Has the data been altered (accidentally or maliciously)? | Hashing, signatures, checksums, version control |
| **Availability** | Can authorized users access it when needed? | Redundancy, backups, DDoS protection, capacity |

Every control maps to one or more of these. A backup protects **availability** (and
integrity). TLS protects **confidentiality** and **integrity** in transit. A hash verifies
**integrity**. When evaluating a control, ask *"which leg of the triad does this
strengthen, and at what cost to the others?"* — they often trade off (heavy encryption can
hurt availability/performance).

> [!IMPORTANT]
> The triad is the **classifier** for all of security. Tightening one property frequently
> **weakens another**: locking everything down (confidentiality) can reduce availability;
> aggressive availability (open access, no MFA) erodes confidentiality. Good security is
> the **right balance for the asset's value**, not "maximum everywhere."

## Part 2 — Threat, vulnerability, risk, exploit

These words are not interchangeable:

- **Asset** — something of value (data, a server, a reputation).
- **Vulnerability** — a weakness (unpatched software, weak password, misconfiguration).
- **Threat** — a potential cause of harm (an attacker, malware, a flood, an insider).
- **Threat actor** — who/what poses the threat (criminal, nation-state, careless employee).
- **Exploit** — the actual technique/code that leverages a vulnerability.
- **Risk** — the **likelihood** a threat exploits a vulnerability **× the impact**.

```text
Risk  ≈  Threat  ×  Vulnerability  ×  Impact
```

You can rarely remove threats (you don't control attackers), so security work mostly
**reduces vulnerabilities** and **limits impact**. A vulnerability with no plausible threat
is low risk; a tiny vulnerability on a crown-jewel asset can be high risk.

## Part 3 — Defense in depth

No single control is perfect, so layer them — if one fails, others still stand:

```text
        Internet
           │
   [ Firewall / WAF ]        network layer
           │
   [ Segmentation / VLANs ]  reduce blast radius
           │
   [ Host hardening + EDR ]  endpoint layer
           │
   [ AuthN + MFA + RBAC ]    identity layer
           │
   [ Encryption + backups ]  data layer
           │
   [ Logging / monitoring ]  detection across all layers
```

An attacker who bypasses the firewall still faces segmentation, host hardening, identity
controls, and monitoring. **Defense in depth** assumes any one layer **will** be breached
and ensures that's not game-over.

> [!TIP]
> Pair defense in depth with **assume breach**: design as if attackers are already inside.
> That mindset drives segmentation, least privilege, MFA, and monitoring — so a single
> compromised credential or host doesn't cascade into total compromise.

## Part 4 — Least privilege and related principles

- **Least privilege** — every user/process/service gets the **minimum** access needed, and
  no more. The single highest-leverage principle in practical security.
- **Need to know** — access to data is granted only where required for a role.
- **Separation of duties** — no single person can complete a sensitive action alone (e.g.
  request *and* approve a payment).
- **Fail securely** — on error, deny rather than allow (a broken auth check should lock
  out, not let in).
- **Keep it simple** — complexity is the enemy of security; fewer moving parts, fewer
  bugs.

## Part 5 — AAA and basic threat modeling

**AAA** underpins access control (you'll go deep in Lesson 902):

- **Authentication** — *who are you?* (proving identity)
- **Authorization** — *what are you allowed to do?* (permissions)
- **Accounting** (auditing) — *what did you do?* (logs, traceability)

A lightweight **threat model** answers four questions (Shostack's framing):

1. **What are we building?** (diagram the system, data flows, trust boundaries)
2. **What can go wrong?** (brainstorm threats — STRIDE: Spoofing, Tampering, Repudiation,
   Information disclosure, Denial of service, Elevation of privilege)
3. **What are we going to do about it?** (mitigations / controls)
4. **Did we do a good job?** (validate)

## Hands-on lab

No attacking — this lab is **analysis**, the core daily skill of a defender.

```text
Scenario: a small web app — users log in, upload files, data stored in a database
on a server behind a load balancer; admins manage it over SSH.

1. CIA mapping — for each, name one threat and one control:
   - Confidentiality: ____________________
   - Integrity:       ____________________
   - Availability:    ____________________

2. Identify 3 vulnerabilities and rate each risk (Low/Med/High) using
   likelihood × impact. Example: "SSH open to the internet with passwords" → High.

3. Draw the defense-in-depth layers you'd add (network → identity → data → detection).

4. Apply least privilege: list 2 places the design likely over-grants access.

5. STRIDE pass: pick the login flow and name one threat per STRIDE letter you can.
```

```bash
# Quick real-world integrity demo you CAN run safely on your own machine:
echo "hello" > file.txt
sha256sum file.txt          # record the hash (integrity baseline)
echo "tampered" >> file.txt
sha256sum file.txt          # hash changes -> integrity violation detected
```

## Exercises

1. Classify each control by CIA property: TLS, RAID, file hashing, MFA, off-site backups,
   disk encryption, rate limiting.
2. Define threat, vulnerability, risk, and exploit in your own words, with one example
   each from the lab scenario.
3. Explain a real situation where strengthening confidentiality reduced availability.
4. Give two concrete applications of **least privilege** for the lab's admin SSH access.
5. Do a four-question threat model of a personal project (or the lab app) and list the top
   three mitigations.

## Troubleshooting

- **"We bought a firewall, so we're secure"** — single control. *Fix:* defense in depth;
  no one layer suffices.
- **Confusing risk with vulnerability** — a vuln isn't a risk without a threat and impact.
  *Fix:* rate `likelihood × impact`.
- **Over-permissioned everything "to avoid breakage"** — violates least privilege. *Fix:*
  start from deny; grant the minimum.
- **Security that blocks the business** — unbalanced triad. *Fix:* match controls to asset
  value; usable security gets used.
- **No logging** — you can't detect or investigate. *Fix:* accounting is part of AAA;
  log and monitor.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Justify each answer briefly.

1. Name the CIA triad and what each property protects.
2. Which property does a hash/checksum protect, and which does a backup protect?
3. Define threat vs vulnerability vs risk.
4. Write the informal risk relationship.
5. What is defense in depth, and what assumption pairs well with it?
6. State the principle of least privilege and one application.
7. What do the three A's in AAA stand for?
8. What does STRIDE help you do?
9. **Practical:** demonstrate an integrity check with `sha256sum`.
10. **Practical:** for a system you know, give one vulnerability per CIA property.

## Solutions & validation

1. **Confidentiality** (only authorized read), **Integrity** (not altered), **Availability**
   (accessible when needed).
2. Hash → **integrity**; backup → **availability** (and integrity).
3. Threat = potential cause of harm; vulnerability = weakness; risk = likelihood a threat
   exploits a vuln × impact.
4. `Risk ≈ Threat × Vulnerability × Impact`.
5. Layered controls so one failure isn't fatal; pairs with **assume breach**.
6. Minimum access necessary; e.g. admins use named accounts with sudo, not shared root.
7. **Authentication, Authorization, Accounting** (auditing).
8. Enumerate threats: Spoofing, Tampering, Repudiation, Information disclosure, DoS,
   Elevation of privilege.
9. **Validation:** hash changes after editing the file (see lab).
10. **Validation:** sensible per-property vulns (e.g. plaintext storage / no integrity
    monitoring / single point of failure).

> [!TIP]
> Internalize three things and most of security follows: **classify with the CIA triad**,
> **quantify with risk = likelihood × impact**, and **design with defense in depth +
> least privilege**. Every later lesson — identity, crypto, firewalls, SIEM, incident
> response — is a deeper application of these same ideas.

## What's next

Next: **Lesson 902 — Authentication, Authorization & Identity.** The "who are you / what
can you do" core of every system: passwords and their pitfalls, MFA, hashing vs encryption
for credentials, sessions and tokens, SSO/OAuth/SAML at a high level, and access-control
models (RBAC/ABAC) — the most-attacked surface in modern infrastructure.
