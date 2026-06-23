---
title: "Observability — Alerting & On-Call"
slug: "observability-alerting-and-on-call"
track: "observability"
trackName: "Monitoring, Logging & Observability"
module: "Observability in Practice"
order: 1706
level: "Advanced"
difficulty: "Advanced"
distribution: "Cross-platform"
category: "DevOps"
tags: [observability, alerting, on-call, alert-fatigue, runbooks, escalation]
cover: "/covers/curriculum/observability.svg"
estMinutes: 55
status: "published"
summary: "Turning signals into action: alerting on symptoms not causes, good vs noisy alerts, fighting alert fatigue, severity and routing, runbooks and escalation, on-call practices, and designing alerts that people actually trust and act on."
seoTitle: "Observability 6: Alerting & On-Call (symptom-based, alert fatigue, runbooks)"
seoDescription: "Alerting: symptom vs cause, actionable alerts, alert fatigue, severity/routing, runbooks, escalation, on-call health, and trustworthy alerts. Hands-on lab and assessment."
---

Dashboards require someone watching; **alerts** bring problems to you. But alerting is where many
teams fail hardest: too many alerts → **alert fatigue** → ignored pages → a real incident missed.
This lesson (building on the SIEM and incident-response lessons) covers **good alerting**: alert on
**symptoms not causes**, make every alert **actionable**, fight **alert fatigue**, set **severity
and routing**, attach **runbooks**, design **escalation**, and run **healthy on-call**. The goal:
alerts people **trust and act on**, that wake you only when a human truly needs to act.

## Learning objectives

By the end of this lesson you will be able to:

- Alert on **symptoms** (user impact), not every cause.
- Write **actionable** alerts and avoid noise.
- Diagnose and fight **alert fatigue**.
- Set **severity, routing, and escalation**.
- Attach **runbooks** and run sustainable **on-call**.

## Part 1 — Alert on symptoms, not causes

The most important alerting principle: alert on what **users experience**, not every internal
metric:

```text
✗ CAUSE-based (noisy):   "CPU > 80%"  "disk 75% full"  "a pod restarted"  "memory high"
   → many of these are NORMAL or self-healing; they page you for non-problems
✓ SYMPTOM-based:         "error rate > 1%"  "p99 latency > 2s"  "checkout success < 99%"
   → these mean USERS are actually affected → a human should act
```

High CPU isn't a problem if users are fine; a pod restart that auto-heals isn't worth a page. Alert
on the **symptoms of user pain** (errors, latency, unavailability) — then use metrics/traces/logs to
find the **cause**. This drastically cuts noise: you page on the handful of things that mean "users
are hurting," not the hundreds of internal fluctuations.

> [!IMPORTANT]
> **Page on symptoms (user impact), diagnose with causes.** A symptom-based alert like "checkout
> error rate > 1%" fires only when users are actually affected — so it's always worth a human's
> attention. Cause-based alerts ("CPU high," "pod restarted") fire constantly for things that are
> normal or self-healing, training people to **ignore** alerts (the fatigue death spiral). Keep
> cause metrics on **dashboards** for diagnosis, but **page** only on symptoms. This single shift
> eliminates most alert noise.

## Part 2 — Making alerts actionable

Every alert that pages a human must pass a bar:

```text
A good alert is:
   ACTIONABLE   — there's something a human should DO right now (not "FYI")
   URGENT        — it needs attention NOW (else it's a ticket/dashboard, not a page)
   ACCURATE      — low false-positive rate (trustworthy)
   has a RUNBOOK — what to check/do, linked from the alert itself
   describes IMPACT — "checkout failing for ~30% of users", not "metric X > Y"
```

If an alert isn't actionable and urgent, it **shouldn't page** — make it a dashboard panel, a
ticket, or a digest. The test: **"if this fires at 3 a.m., is there something I must do?"** If no,
it's not a page. Tune alert thresholds and add **`for:`** durations (fire only if the condition
persists N minutes) to avoid flapping on transient blips.

```yaml
# Prometheus alert rule (Alertmanager) — symptom-based, with a duration and context
- alert: HighErrorRate
  expr: sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) > 0.01
  for: 5m                          # must persist 5m (avoid flapping)
  labels: { severity: page }
  annotations:
    summary: "Error rate {{ $value | humanizePercentage }} on checkout"
    runbook: "https://runbooks/checkout-errors"
```

## Part 3 — Alert fatigue

**Alert fatigue** is the silent killer of on-call (and the SIEM lesson's warning):

```text
too many alerts → on-call ignores/silences them → REAL incident's alert is missed/dismissed
   symptoms: alerts routinely ignored, "just ack it", channels muted, pages every night
   causes:   cause-based alerts, low thresholds, flapping, duplicate alerts, non-actionable info
```

The cure is ruthless curation: **delete or downgrade** any alert that's routinely non-actionable.
Track **alert volume per on-call shift** as a health metric; if people are paged more than a couple
of actionable times per shift, the alerting is broken, not the people. **Group/deduplicate** related
alerts (one incident shouldn't send 50 pages), add **`for:`** durations, and review noisy alerts in
incident retros. An on-call that can trust every page is the goal; one that's learned to ignore
pages is dangerous.

> [!IMPORTANT]
> **Alert fatigue is a system failure, not a people failure** — and it's how real incidents get
> missed. When on-call learns that pages are usually noise, they stop responding urgently, and the
> one page that mattered gets ack'd-and-ignored. Treat a noisy alert as a **bug to fix**: delete it,
> raise its threshold, add a `for:` duration, deduplicate, or downgrade it to a ticket. Measure
> **pages per shift** and drive it down. The number of alerts you can safely have is limited by how
> many a human can meaningfully act on — far fewer than most teams think.

## Part 4 — Severity, routing, and escalation

Not every alert is a 3 a.m. page:

```text
SEVERITY & ROUTING:
   PAGE (critical)   → wake someone NOW (PagerDuty/Opsgenie) — user-impacting, urgent
   TICKET (warning)  → handle during business hours (degraded but not urgent)
   INFO/dashboard    → no notification, just visibility
ROUTING   send each alert to the right TEAM/channel based on labels (service, severity)
ESCALATION  if the primary on-call doesn't ACK in N minutes → escalate to secondary → manager
   ensures an alert is never silently dropped
ON-CALL SCHEDULES  rotations, follow-the-sun, primary/secondary — so coverage is clear
```

**Alertmanager** (Prometheus) / PagerDuty / Opsgenie handle **routing** (by labels), **grouping**
(collapse related alerts), **silencing** (during maintenance), and **escalation**. Route critical/
user-impacting alerts to a **pager**; everything else to tickets or dashboards. Escalation policies
guarantee an unacknowledged page reaches someone else — no incident falls through the cracks.

## Part 5 — Runbooks and healthy on-call

```text
RUNBOOK   a linked doc per alert: what it means, impact, what to CHECK, how to MITIGATE, who to call
   → turns a 3 a.m. page from "panic" into "follow the steps" (the IR lesson's playbooks)
HEALTHY ON-CALL:
   □ sustainable rotation (not the same person always); reasonable shift length
   □ low, actionable page volume (fix noise; track pages/shift)
   □ every page has a runbook; common fixes documented/automated
   □ blameless follow-up: noisy/false alerts get FIXED in incident retros
   □ comp/time-off for on-call; on-call load is a team responsibility, not heroics
```

A **runbook** linked from every alert is the single best on-call quality-of-life improvement —
recall the incident-response lesson's playbooks. And on-call is a **human sustainability** issue:
fatigue, burnout, and missed incidents all stem from noisy alerts and unfair rotations. A healthy
on-call has **few, trustworthy, runbook-backed pages** and a culture that **fixes** the alerting
rather than blaming the responder.

> [!TIP]
> **Attach a runbook to every alert that can page.** When you're woken at 3 a.m., a link saying
> "this means X, check Y, mitigate with Z, escalate to W" is the difference between a calm 10-minute
> fix and a panicked hour. Build runbooks as you go (each incident → update the runbook), and treat
> on-call health — page volume, fairness, runbook coverage — as a real engineering metric. Sustainable
> on-call isn't a perk; it's what keeps your detection working when it matters.

## Hands-on lab

```text
Alert-design exercise (real paging needs a tool; the reasoning is the skill).

1. SYMPTOM vs CAUSE — rewrite each cause-based alert as a symptom-based one:
   a) "CPU > 90% on web-3"            → ______ (e.g. "request latency p99 > 2s")
   b) "database connections > 80%"     → ______ (e.g. "error rate / query latency up")
   c) "a pod restarted"                → ______ (e.g. only alert if availability drops)

2. ACTIONABLE TEST — for each, should it PAGE, ticket, or just dashboard?
   a) Checkout error rate 5% for 10 min        → ______
   b) Disk 70% full, growing slowly             → ______
   c) One node CPU spiked for 30s then normal   → ______
   (Answers: page; ticket; dashboard/none)

3. RUNBOOK — write a 5-line runbook for "HighErrorRate on checkout": meaning, impact, checks,
   mitigation, escalation.

4. FATIGUE AUDIT — given an on-call paged 40 times/week with 2 real incidents, list three changes
   to cut the noise (thresholds, for:, dedup, symptom-based, downgrade to tickets).

5. ESCALATION — design a policy: ACK within 10 min or escalate to secondary, then manager at 25 min.
```

```bash
# Prometheus Alertmanager rule + routing (sketch you can adapt):
cat <<'EOF'
# alert rule (symptom-based, with duration + runbook annotation)
- alert: HighErrorRate
  expr: sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) > 0.01
  for: 5m
  labels: { severity: page, team: payments }
  annotations: { summary: "checkout 5xx {{ $value }}", runbook: "https://rb/checkout" }

# alertmanager routing (by label) + grouping + escalation handled by PagerDuty receiver
route:
  group_by: ['alertname','service']     # dedupe/group related alerts
  routes:
    - matchers: [severity="page"]
      receiver: pagerduty                # critical -> page
    - matchers: [severity="warning"]
      receiver: slack-tickets            # warning -> channel/ticket
EOF
```

## Exercises

1. Explain symptom- vs cause-based alerting with three rewritten examples.
2. List the criteria for an alert that's allowed to page, and apply them to three scenarios.
3. Describe alert fatigue, its causes, and four concrete fixes.
4. Design severity levels and routing for page vs ticket vs info.
5. Write a runbook for a sample alert.
6. Design an escalation policy and explain why escalation matters.

## Troubleshooting

- **On-call ignores pages** — alert fatigue. *Fix:* symptom-based, raise thresholds, `for:`, dedup,
  downgrade non-actionable.
- **Paged for self-healing events** — cause-based. *Fix:* page on user-impact symptoms only.
- **Flapping alerts** — transient blips. *Fix:* add `for:` duration; smooth/aggregate.
- **One incident, 50 pages** — no grouping. *Fix:* group/deduplicate related alerts.
- **No idea what to do when paged** — no runbook. *Fix:* link a runbook to every alert.
- **Page dropped/unanswered** — no escalation. *Fix:* escalation policy to secondary/manager.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Justify briefly.

1. Why alert on symptoms instead of causes?
2. What makes an alert worthy of paging a human?
3. What is alert fatigue and how does it cause missed incidents?
4. Name four ways to reduce alert noise.
5. Differentiate page, ticket, and info severities.
6. What does an escalation policy guarantee?
7. What is a runbook and why attach one to every alert?
8. What metric indicates unhealthy on-call?
9. **Practical:** rewrite cause-based alerts as symptom-based.
10. **Practical:** decide page/ticket/dashboard for three scenarios.

## Solutions & validation

1. Symptoms mean **users are affected** (always actionable); causes are often normal/self-healing
   (noise).
2. Actionable, urgent, accurate, with a runbook and impact description.
3. Too many/non-actionable alerts → responders ignore them → the real page is missed.
4. Symptom-based, raise thresholds, add `for:` durations, dedup/group, downgrade non-actionable
   (any four).
5. Page = wake now (urgent/user-impact); ticket = business hours; info = dashboard only.
6. That an unacknowledged alert reaches someone else (never silently dropped).
7. A linked doc on meaning/impact/checks/mitigation/escalation; makes pages calm and fast.
8. **Pages per shift** (high = noisy/unsustainable).
9. **Validation:** CPU→latency p99, DB conns→error rate, pod restart→availability drop (see lab).
10. **Validation:** checkout 5%→page, disk 70%→ticket, 30s CPU spike→dashboard.

> [!TIP]
> Good alerting is **few, trustworthy, actionable, symptom-based pages, each with a runbook**, routed
> by severity with **escalation** so nothing is dropped. Treat **alert fatigue as a bug to fix**, not
> a people problem — page only on user impact, diagnose causes from dashboards/traces/logs, and keep
> on-call sustainable. An alerting system people **trust** is one that wakes them only when they're
> truly needed — and that's what keeps real incidents from slipping by.

## What's next

Next: **Lesson 1707 — SLIs, SLOs & Error Budgets.** The framework that ties observability to
reliability decisions: service-level indicators and objectives, error budgets, how SLOs balance
reliability against feature velocity, and using them to drive engineering priorities — the bridge to
SRE.
