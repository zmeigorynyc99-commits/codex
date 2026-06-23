---
title: "Security — Incident Response"
slug: "security-incident-response"
track: "security"
trackName: "Security & Defensive Operations"
module: "Defensive Operations"
order: 908
level: "Advanced"
difficulty: "Senior"
distribution: "Cross-platform"
category: "Security"
tags: [security, incident-response, forensics, playbook, soc, blue-team, dfir]
cover: "/covers/curriculum/security.svg"
estMinutes: 70
status: "published"
summary: "The capstone: responding to a real intrusion calmly and effectively. The IR lifecycle (prepare, identify, contain, eradicate, recover, lessons learned), preserving evidence and chain of custody, containment trade-offs, communication, and writing playbooks and a blameless post-incident review."
seoTitle: "Security 8: Incident Response (IR lifecycle, forensics, playbooks)"
seoDescription: "Incident response: NIST/SANS lifecycle, triage and severity, containment vs eradication, evidence preservation, communication, playbooks, and blameless post-incident review. Lab + assessment."
---

Everything in this track exists so that when prevention and detection meet a **real
intrusion**, you respond with a **practiced plan instead of panic**. **Incident response
(IR)** is the structured process of detecting, containing, eradicating, and recovering from
security incidents — and learning from them. This capstone covers the **IR lifecycle**,
**triage** and severity, the crucial **containment vs eradication** distinction,
**preserving evidence** (chain of custody), **communication**, and the **playbooks** and
**blameless reviews** that make response fast and repeatable.

## Learning objectives

By the end of this lesson you will be able to:

- Walk the **IR lifecycle** (prepare → identify → contain → eradicate → recover → lessons).
- **Triage** an alert into an incident and assign **severity**.
- Choose containment that **stops harm while preserving evidence**.
- Maintain **chain of custody** and capture volatile data in the right order.
- Run **communication** and write a **playbook** + **blameless post-incident review**.

## Part 1 — The IR lifecycle

The widely used **NIST/SANS** model (six phases; the loop never really ends):

```text
1. PREPARE     plan, tools, contacts, playbooks, backups, training, drills
2. IDENTIFY    detect & confirm a real incident (triage, scope, severity)
3. CONTAIN     stop the spread (short-term + long-term) — preserve evidence
4. ERADICATE   remove the cause (malware, accounts, persistence, the vuln)
5. RECOVER     restore clean systems, monitor closely, confirm normal
6. LESSONS     blameless review → improvements feed back into PREPARE
```

> [!IMPORTANT]
> **Preparation is the phase that decides the others.** The middle of a breach is the worst
> time to figure out who to call, where backups are, or how to isolate a host. Build the
> plan, the **playbooks**, the contact tree, and **tested backups** *before* an incident —
> and **drill** them (tabletop exercises). Teams that prepare respond in minutes; teams that
> don't lose days.

## Part 2 — Identify: triage and severity

Not every alert is an incident. **Triage** confirms and scopes:

- **Is it real?** (true positive vs false positive — validate the alert.)
- **What's affected?** (hosts, accounts, data — scope it.)
- **How bad?** Assign **severity** by impact + spread:

```text
SEV-1  critical: active breach, data exfiltration, ransomware, prod down
SEV-2  high:     confirmed compromise, contained-ish, sensitive data at risk
SEV-3  medium:   suspicious but limited; single host, no data loss yet
SEV-4  low:      policy violation / minor, no compromise
```

Severity drives **who is engaged**, **how fast**, and **communication cadence**. Start a
**timeline** immediately — log every action with timestamps; you'll need it for both
response and the post-mortem.

## Part 3 — Contain, eradicate, recover

These are **distinct** and often rushed together — to your detriment:

- **Containment** — stop the bleeding. **Short-term**: isolate the host (network-quarantine,
  not necessarily power-off — see evidence below), disable compromised accounts, block C2
  IPs/domains, revoke tokens. **Long-term**: patch, rebuild, tighten while keeping the
  business running.
- **Eradication** — remove the **root cause**: malware, attacker accounts, **persistence**
  (cron, services, SSH keys, scheduled tasks), and the **vulnerability** that let them in.
  If you skip the vuln, they walk right back in.
- **Recovery** — restore from **known-clean** backups/images, validate integrity, **reset
  credentials**, and **monitor intensively** for re-compromise before declaring normal.

> [!TIP]
> The classic mistake is **eradicating before you understand scope** — you wipe one box, the
> attacker still holds three others and a backdoor, and they're back by morning. **Contain
> broadly, investigate to find *all* footholds, then eradicate everything at once.** And
> never restore onto the same unpatched hole — recovery without fixing the root cause is a
> reset button for the attacker.

## Part 4 — Evidence and chain of custody

If the incident may lead to legal action, insurance, or just a solid root-cause, **preserve
evidence** correctly:

- **Order of volatility** — capture the most ephemeral first: **RAM/running processes/
  network connections → disk → logs/archives**. Powering off destroys memory and may trip
  attacker dead-man switches; prefer **network isolation** to preserve volatile state.
- **Chain of custody** — document **who collected what, when, how, and where it's stored**;
  use **hashes** to prove evidence wasn't altered. Work on **copies/images**, never the
  original.
- **Don't tip off the attacker** prematurely (they may destroy data or escalate) — balance
  containment speed against intelligence.

```bash
# Volatile-first triage on a suspect Linux host (capture, don't 'fix' yet)
date -u; hostname                      # anchor the timeline (UTC)
ps auxf                                # process tree (look for odd parents/children)
ss -tunp                               # active connections (C2?)
who; last -20                          # who's logged in / recent logins
sudo crontab -l; ls -la /etc/cron.*    # persistence via cron
ls -la ~/.ssh/authorized_keys          # rogue SSH keys
# Hash anything you collect for integrity:
sha256sum /path/to/collected/artifact >> evidence.sha256
```

## Part 5 — Communication, playbooks, and lessons learned

- **Communication** — incidents are as much about people as packets. Designate an
  **incident commander**, keep a single source of truth, brief **legal/PR/leadership** and
  meet **breach-notification** obligations (GDPR 72h, contractual, regulatory). Use
  **out-of-band** comms if email/chat may be compromised.
- **Playbooks** — per-scenario runbooks (ransomware, phishing, compromised credentials, web
  defacement) with concrete steps, owners, and decision points. They turn chaos into a
  checklist.
- **Lessons learned / post-incident review** — **blameless**: focus on *what in the system*
  let this happen and how to prevent recurrence, **not** who to blame (blame hides
  information and kills future reporting). Output concrete, owned **action items** that feed
  back into **prepare**.

> [!TIP]
> Run a **blameless post-mortem** for every significant incident: timeline, root cause,
> what worked, what didn't, and dated action items with owners. The goal isn't punishment —
> it's a **stronger system**. Organizations that learn from incidents get harder to breach;
> those that blame individuals just lose their best signal (people stop reporting).

## Hands-on lab — tabletop + triage

> The most valuable IR practice is a **tabletop exercise** — no real attack needed.

```text
Scenario: At 02:14 your SIEM alerts: a web server (prod, internet-facing) made
outbound connections to a known-bad IP, and a NEW local admin account "svc-tmp"
was created an hour after a spike of failed-then-successful SSH logins.

Work the lifecycle on paper, writing a timeline as you go:

1. IDENTIFY: Is it real? What's the scope? Assign a severity (and justify).
2. CONTAIN: List short-term actions — and for each, note the evidence trade-off
   (e.g. "isolate NIC" preserves RAM; "power off" destroys it).
3. EVIDENCE: In what ORDER do you capture artifacts, and how do you prove integrity?
4. ERADICATE: What persistence/root-cause must you hunt for and remove?
5. RECOVER: How do you restore safely and verify the attacker is gone?
6. LESSONS: Three action items (owners + dates) that prevent recurrence.
7. COMMS: Who do you notify, when, and via what channel? Any legal clock?
```

```bash
# Practice the volatile-first capture commands on YOUR OWN machine:
ps auxf | head; ss -tunp 2>/dev/null | head; last -5; sudo crontab -l 2>/dev/null
# Notice how each maps to a question: what's running / talking / logged in / persistent?
```

## Exercises

1. List the six IR phases and one key activity in each; explain why preparation dominates.
2. Triage the lab alert: real or false positive? Scope and severity, with reasoning.
3. Explain containment vs eradication and the danger of doing them in the wrong order.
4. Put these in correct collection order and justify: disk image, RAM capture, archived
   logs, live network connections.
5. Why blameless post-mortems? What concretely comes out of one?
6. Draft a 6-step playbook for **compromised credentials** (owners + decision points).

## Troubleshooting

- **Panic / ad-hoc response** — no plan. *Fix:* prepared playbooks + incident commander +
  drills.
- **Eradicated too early, attacker returns** — incomplete scope. *Fix:* contain broadly,
  find all footholds/persistence, eradicate together, fix the vuln.
- **Evidence destroyed** — powered off / worked on originals. *Fix:* volatile-first capture,
  network-isolate, image and hash, work on copies.
- **Restored onto the same hole** — recovery without root-cause fix. *Fix:* patch/rebuild;
  rotate all credentials before reconnecting.
- **Chaos in communication** — no single source of truth/owner. *Fix:* incident commander,
  status cadence, out-of-band channel, legal notified.
- **Blame culture** — people hide mistakes. *Fix:* blameless reviews; reward reporting; fix
  systems not people.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Justify briefly.

1. Name the six IR phases in order.
2. Why is preparation the most important phase?
3. What does triage establish before you act?
4. Containment vs eradication — define each and why order matters.
5. State the order of volatility for evidence and why it matters.
6. What is chain of custody and how do you prove evidence integrity?
7. Why isolate the network instead of powering off a compromised host?
8. What is a blameless post-mortem and what does it produce?
9. **Practical:** for the lab alert, give severity + three containment actions with evidence
   trade-offs.
10. **Practical:** run volatile-first triage commands and map each to the question it
    answers.

## Solutions & validation

1. **Prepare, Identify, Contain, Eradicate, Recover, Lessons learned.**
2. It determines how well every other phase goes — plans, tools, backups, contacts, drills
   ready before the breach.
3. Whether it's real (true positive), its **scope**, and its **severity**.
4. Contain = stop spread (preserve evidence); eradicate = remove root cause/persistence;
   eradicating before full scope lets the attacker persist.
5. **RAM/processes/connections → disk → logs/archives**; most ephemeral data is lost first
   (power-off destroys memory).
6. Documented record of who handled evidence, when, how, where; **hashes** prove it's
   unaltered; work on copies.
7. Isolation **stops C2/spread while preserving volatile memory/state** for forensics.
8. A no-blame review producing a timeline, root cause, and **dated, owned action items**
   feeding back into prepare.
9. **Validation:** e.g. SEV-1/2; isolate NIC (keeps RAM), disable `svc-tmp`, block the
   bad IP — each with its evidence note.
10. **Validation:** `ps auxf` (running), `ss -tunp` (talking), `last` (logged in),
    `crontab -l` (persistence).

> [!TIP]
> Incident response is **prepared calm**: a lifecycle you've drilled, playbooks you can
> follow at 3 a.m., evidence handled correctly, communication that's clear, and a blameless
> review that makes the next response faster. You can't prevent every breach — but you can
> decide, in advance, that a breach becomes a **controlled incident** instead of a
> catastrophe. That's the whole point of the blue team.

## What's next

You've completed the **Security & Defensive Operations** track — from the CIA triad through
identity, cryptography, network and system hardening, detection/SIEM, vulnerability
management, and incident response. Together with the Linux, Windows, networking, scripting
and PowerShell tracks, you now have the defensive foundation every infrastructure
professional needs. Next in the roadmap: **Git & Version Control**, then the
build/ship/run world — **containers, Kubernetes, CI/CD, and infrastructure as code** —
where these security principles get applied to modern delivery pipelines.
