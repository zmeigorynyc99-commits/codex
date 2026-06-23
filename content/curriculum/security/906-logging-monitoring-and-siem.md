---
title: "Security — Logging, Monitoring & SIEM"
slug: "security-logging-monitoring-and-siem"
track: "security"
trackName: "Security & Defensive Operations"
module: "Defensive Operations"
order: 906
level: "Intermediate"
difficulty: "Advanced"
distribution: "Cross-platform"
category: "Security"
tags: [security, logging, monitoring, siem, detection, soc, alerting]
cover: "/covers/curriculum/security.svg"
estMinutes: 60
status: "published"
summary: "You can't defend what you can't see. Centralized logging, what to log (and what not to), detection engineering and alerting, how a SIEM correlates events across the fleet, key sources (auth, network, endpoint), and the metrics that define a good detection capability (MTTD/MTTR)."
seoTitle: "Security 6: Logging, Monitoring & SIEM for Detection"
seoDescription: "Centralized logging, log sources, detection engineering, alerting, SIEM correlation, MTTD/MTTR, and tuning false positives. Hands-on with journald/auth logs. Lab + assessment."
---

Prevention fails eventually — so **detection** decides whether an intrusion becomes a
minor event or a catastrophe. This lesson is about **visibility**: centralized **logging**,
**what to log**, turning logs into **detections** and **alerts**, and how a **SIEM**
(Security Information and Event Management) **correlates** events from across your fleet to
surface attacks a single host would never reveal. This is the day-to-day work of a
blue team / SOC.

## Learning objectives

By the end of this lesson you will be able to:

- Explain why **centralized** logging matters and the key **log sources**.
- Decide **what to log** (and what *not* to — secrets/PII).
- Write a basic **detection** and a useful **alert** (signal vs noise).
- Describe what a **SIEM** does: collect, normalize, correlate, alert.
- Use detection metrics — **MTTD/MTTR**, false positive/negative — to judge a program.

## Part 1 — Why centralize logs

Logs scattered on individual hosts are nearly useless for security:

- Attackers **delete local logs** to cover tracks — ship logs **off-box** in real time so
  the evidence survives a host compromise.
- Many attacks are only visible **across** systems (a failed login here, a new admin there,
  data leaving over there) — correlation needs them in **one place**.
- Centralization enables **retention**, **search**, and **alerting** at scale.

```text
hosts/apps/network ──► shipper (rsyslog/Fluent Bit/Vector/agent) ──►
   central store (Elastic/Loki/Splunk/cloud) ──► SIEM (correlate + alert) ──► SOC
```

> [!IMPORTANT]
> Ship logs **off the host in real time**. A local log an attacker can delete is not
> evidence — and the most valuable detections come from **correlating across systems**,
> which is impossible if logs never leave their hosts. Centralized, tamper-resistant,
> time-synced (NTP!) logging is the foundation of every detection.

## Part 2 — What to log (and what not to)

High-value security sources:

- **Authentication** — logins/logouts, failures, sudo/privilege use, new accounts, MFA
  events (`/var/log/auth.log`, Windows Security 4624/4625/4720/4672).
- **Network** — firewall allow/deny, DNS queries, proxy/flow logs, VPN connections.
- **Endpoint/EDR** — process creation, persistence, suspicious child processes.
- **Application** — access logs, errors, admin actions, transactions.
- **Cloud control plane** — AWS CloudTrail / Azure Activity / GCP Audit (who did what).
- **Integrity/audit** — `auditd`, file integrity monitoring (FIM) on sensitive files.

Each event needs **who, what, when, where, outcome** and a **synchronized timestamp**.

> [!TIP]
> **Never log secrets or excess PII** — passwords, tokens, full card numbers, session
> cookies. Logs are widely accessible and long-retained, so a logged secret is a breach in
> waiting. Redact/mask at the source, and balance retention with privacy law (GDPR). Log
> the **decision and identity**, not the sensitive payload.

## Part 3 — Detection engineering and alerting

A **detection** is a rule/query that fires on attacker behavior; an **alert** is a
detection worth a human's attention. The craft is **signal vs noise**:

```text
Examples of useful detections:
- N failed logins then a success from one IP   (brute force succeeded)
- Login from a new country + impossible travel   (account takeover)
- New local admin / new sudoer created           (persistence/privesc)
- Outbound to a known-bad IP / rare destination  (C2 / exfiltration)
- Service binary or crontab modified             (tampering/persistence)
- Log source suddenly goes silent                (attacker disabled logging)
```

- Map detections to a framework like **MITRE ATT&CK** (cover real adversary techniques,
  find blind spots).
- **Tune** relentlessly: an alert that's 95% false positives gets ignored (**alert
  fatigue**) — the most dangerous failure mode. Every alert should be **actionable** and
  have a **runbook**.
- Prefer **behavioral** detections (hard for attackers to avoid) over brittle string
  matches.

## Part 4 — What a SIEM does

A **SIEM** is the platform that operationalizes all of the above:

1. **Collect** — ingest logs/events from everywhere.
2. **Normalize/parse** — common schema so fields line up across sources.
3. **Enrich** — add context (geo-IP, asset criticality, threat intel, user identity).
4. **Correlate** — rules across sources/time ("failed logins **then** privilege escalation
   **then** outbound transfer").
5. **Alert & dashboard** — notify analysts, feed cases.
6. **Retain & search** — for hunting and **forensics/compliance**.

Examples: Splunk, Elastic Security, Microsoft Sentinel, Wazuh (open source). Related:
**SOAR** automates response (auto-isolate a host, open a ticket); **UEBA** baselines
normal user/entity behavior to flag anomalies.

## Part 5 — Metrics that matter

- **MTTD** (Mean Time To Detect) — how fast you notice an intrusion.
- **MTTR** (Mean Time To Respond/Remediate) — how fast you contain it.
- **False positives** (cried wolf) vs **false negatives** (missed real attack) — tune the
  balance; a false negative can be fatal, too many false positives cause fatigue.
- **Coverage** — which ATT&CK techniques/log sources you actually detect (find the gaps).

Lowering **MTTD/MTTR** is the whole game: the faster you see and contain, the smaller the
damage.

## Hands-on lab

```bash
# 1. Read the auth log — the #1 security source on Linux
sudo journalctl -u ssh -S -1h --no-pager           # recent SSH events (systemd)
sudo grep -Ei 'fail|invalid' /var/log/auth.log | tail -20

# 2. Build a tiny "brute force" detection: top IPs by failed SSH logins
sudo grep 'Failed password' /var/log/auth.log \
  | grep -oE 'from [0-9.]+' | awk '{print $2}' | sort | uniq -c | sort -rn | head
#   -> an IP with hundreds of failures is a candidate alert

# 3. Detect privilege use and new accounts
sudo grep -E 'sudo:.*COMMAND' /var/log/auth.log | tail
sudo grep -E 'useradd|usermod|new user|to group .sudo' /var/log/auth.log

# 4. Centralize: forward syslog to a collector (concept)
#   /etc/rsyslog.d/90-forward.conf:   *.*  @@logserver.internal:6514   (TLS)
#   then: sudo systemctl restart rsyslog

# 5. Make sure time is synced (correlation depends on it)
timedatectl status | grep -i synchronized
```

```text
6. Detection-design exercise: for the brute-force case, define
   - the rule (threshold + window), e.g. ">20 failures from one IP in 5 min, then success"
   - severity, the runbook (block IP, check the account, force reset)
   - how you'd reduce false positives (allow-list known scanners? exclude internal?)
```

## Exercises

1. Explain why local-only logs are inadequate for security and what centralizing buys you.
2. List five high-value log sources and one attack each would reveal.
3. Give two things you must **never** log and why.
4. Write a detection (in words) for a successful brute force, including threshold, window,
   and runbook.
5. Describe the SIEM pipeline (collect → … → alert) and what "correlation" adds over single
   logs.
6. Define MTTD and MTTR and why driving them down matters; contrast false positive vs false
   negative.

## Troubleshooting

- **No logs after an incident** — local logs deleted/rotated. *Fix:* central, tamper-
  resistant logging shipped in real time.
- **Timestamps don't line up across hosts** — clock skew. *Fix:* NTP/`timedatectl`; correlation
  needs synced time.
- **Analysts ignore alerts** — alert fatigue from false positives. *Fix:* tune, suppress,
  make every alert actionable with a runbook.
- **Missed the attack entirely** — coverage gap. *Fix:* map to MITRE ATT&CK; add the
  missing log source/detection.
- **Secrets in logs** — a breach waiting. *Fix:* redact/mask at source; review log fields.
- **Storage blows up** — logging everything at full verbosity. *Fix:* tier/retain by value;
  sample low-value, keep security-relevant longer.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Justify briefly.

1. Why centralize logs instead of keeping them on each host?
2. Name four high-value security log sources.
3. What must you never put in logs?
4. What's the difference between a detection and an alert?
5. Why is alert fatigue dangerous, and how do you fight it?
6. List the SIEM stages and what correlation adds.
7. Define MTTD and MTTR.
8. Why is time synchronization (NTP) critical for detection?
9. **Practical:** from auth logs, find the top source IPs by failed SSH logins.
10. **Practical:** write a brute-force detection rule with a threshold, window, and runbook.

## Solutions & validation

1. Attackers delete local logs and many attacks are only visible **across** systems;
   central = survivable, searchable, correlatable.
2. e.g. authentication, firewall/network, endpoint/EDR, cloud control plane (CloudTrail),
   auditd/FIM.
3. **Secrets/PII** — passwords, tokens, card numbers; logs are widely accessible/retained.
4. A **detection** is a rule that fires on behavior; an **alert** is a detection worth
   human attention.
5. Ignored alerts → real ones missed; fight it by **tuning** to actionable, runbook-backed
   alerts.
6. Collect → normalize → enrich → correlate → alert → retain; correlation links events
   **across sources/time** into one attack story.
7. **MTTD** = time to detect; **MTTR** = time to respond/remediate.
8. Correlation across hosts depends on **comparable timestamps**; skew breaks ordering.
9. **Validation:** the `grep 'Failed password' | uniq -c | sort -rn` pipeline (see lab).
10. **Validation:** e.g. ">20 failures from an IP in 5 min then a success" → block + reset
    + investigate.

> [!TIP]
> Detection is the safety net under prevention. Get the **fundamentals** right —
> centralized, time-synced, tamper-resistant logging of the **right** sources — then build
> **tuned, actionable** detections mapped to **ATT&CK**, and measure yourself by **MTTD/
> MTTR**. A SIEM is only as good as the data you feed it and the discipline of tuning what
> it tells you.

## What's next

Next: **Lesson 907 — Vulnerability Management.** Find and fix weaknesses before attackers
do: scanning, CVE/CVSS scoring, prioritization, patching workflows, and the vuln-management
lifecycle that keeps your hardened baseline from drifting.
