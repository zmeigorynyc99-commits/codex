---
title: "Observability — SLIs, SLOs & Error Budgets"
slug: "observability-slis-slos-and-error-budgets"
track: "observability"
trackName: "Monitoring, Logging & Observability"
module: "Observability in Practice"
order: 1707
level: "Advanced"
difficulty: "Senior"
distribution: "Cross-platform"
category: "DevOps"
tags: [observability, sli, slo, error-budget, reliability, sre]
cover: "/covers/curriculum/observability.svg"
estMinutes: 60
status: "published"
summary: "The framework that ties observability to reliability decisions: service-level indicators (SLIs) and objectives (SLOs), error budgets, how SLOs balance reliability against feature velocity, burn-rate alerting, and using them to drive engineering priorities — the bridge to SRE."
seoTitle: "Observability 7: SLIs, SLOs & Error Budgets (reliability, burn rate)"
seoDescription: "SLIs/SLOs/error budgets: defining good SLIs, setting SLO targets, error budgets, burn-rate alerting, SLO-driven prioritization, and SLA vs SLO. Hands-on lab and assessment."
---

You can measure everything — but **what reliability target are you aiming for, and how do you decide
when to prioritize reliability over features?** **SLOs** (Service Level Objectives) answer this. They
turn the vague goal "be reliable" into a **measurable target** with an **error budget** that lets you
make principled trade-offs between reliability and velocity. This lesson — the bridge to the SRE
track — covers **SLIs** (what to measure), **SLOs** (the target), **error budgets** (the allowance
for failure), **burn-rate alerting**, and how SLOs **drive engineering decisions** instead of
endless "how reliable is reliable enough?" debates.

## Learning objectives

By the end of this lesson you will be able to:

- Define good **SLIs** (Service Level Indicators).
- Set **SLOs** (objectives) and explain the cost of more nines.
- Compute and use an **error budget**.
- Configure **burn-rate** alerting on SLOs.
- Use SLOs to **drive priorities**, and distinguish **SLA vs SLO vs SLI**.

## Part 1 — SLIs: what to measure

An **SLI** (Service Level Indicator) is a **quantitative measure of a service's behavior** — usually
a ratio of good events to total events, from the **user's perspective**:

```text
SLI = good events / valid events   (a number between 0 and 1, expressed as %)

AVAILABILITY SLI:  successful requests / total requests       (e.g. 99.95%)
LATENCY SLI:       requests faster than 300ms / total requests (e.g. 99.0%)
QUALITY/CORRECTNESS, FRESHNESS, THROUGHPUT ... — pick what reflects USER happiness
```

A good SLI **correlates with user happiness** and is measured where the user experiences it (at the
load balancer / client, not deep internals). The golden signals (latency, errors, availability) make
great SLIs. Pick a **few** SLIs that capture what users actually care about — usually availability
and latency for a request-driven service.

## Part 2 — SLOs: the target

An **SLO** (Service Level Objective) is a **target value for an SLI** over a window:

```text
SLO:  "99.9% of requests succeed, measured over a rolling 28 days"
      "99% of requests complete in under 300ms over 28 days"

THE NINES (availability over 30 days ≈ allowed downtime):
   99%     "two nines"   → ~7.2 hours/month down
   99.9%   "three nines"  → ~43 minutes/month
   99.99%  "four nines"   → ~4.3 minutes/month
   99.999% "five nines"   → ~26 seconds/month  (extremely expensive!)
```

The crucial insight: **each additional nine costs exponentially more** (redundancy, complexity, ops).
**100% is the wrong target** — it's impossibly expensive and unnecessary (users can't tell 99.99%
from 100%, and their own networks fail more than that). Set the SLO at the level **users actually
need** — usually lower than engineers' instinct. The right SLO is a **business decision** about how
reliable the service must be.

> [!IMPORTANT]
> **100% reliability is the wrong goal** — it's infinitely expensive and users won't notice the
> difference above a certain point (their ISP, device, and Wi-Fi fail more often than a well-run
> 99.9% service). Each "nine" costs exponentially more in redundancy and operational complexity, so
> set your SLO at the level that **keeps users happy and the business healthy**, then **stop**. The
> gap between your SLO and 100% is not failure — it's the **error budget** you get to spend on
> shipping features and taking risks.

## Part 3 — Error budgets

The **error budget** is the genius of SLOs: `1 − SLO` is the amount of **unreliability you're
allowed**, and you get to **spend** it:

```text
SLO = 99.9%  →  ERROR BUDGET = 0.1%  →  over 28 days ≈ 40 minutes of "allowed" downtime/errors
   - within budget?  → ship features, take risks, deploy freely (reliability is fine)
   - budget EXHAUSTED? → FREEZE risky changes, focus on reliability until you recover
```

The error budget **reframes reliability vs velocity from a fight into a number**: you don't argue
about whether to ship — you check the budget. Plenty of budget left? Move fast. Burned through it
from incidents? Stop shipping risky changes and shore up reliability. It aligns dev (who want
velocity) and ops/SRE (who want stability) around a **shared, objective signal** — and makes "how
much risk can we take?" a calculation, not an argument.

> [!TIP]
> The **error budget turns reliability into a shared, objective decision tool.** Instead of devs and
> SREs fighting over "ship vs stabilize," everyone looks at the budget: in budget → ship freely; out
> of budget → freeze risky launches and fix reliability. This makes some unreliability **explicitly
> okay** (spend the budget on velocity!) and gives a clear, blameless trigger to slow down. It's the
> mechanism that lets a team be **both fast and reliable** by making the trade-off explicit and
> measurable rather than political.

## Part 4 — Burn-rate alerting

Don't just alert when the budget is gone — alert on how **fast** you're burning it (**burn rate**):

```text
BURN RATE = how fast you're consuming the error budget relative to "normal"
   burn rate 1  = consuming budget exactly fast enough to exactly exhaust it over the window
   burn rate 14.4 = burning 14.4× too fast → budget gone in HOURS, not the 28-day window → PAGE

MULTI-WINDOW alerts (Google SRE):
   FAST burn (e.g. 2% of budget in 1h)  → PAGE (a serious, fast-moving problem)
   SLOW burn (e.g. 10% of budget in 6h)  → ticket (a slow leak worth fixing, not urgent)
```

Burn-rate alerting is **superior to threshold alerting**: it's tied directly to **user impact and
your SLO**, fires appropriately for both fast catastrophes and slow leaks, and avoids the noise of
raw-threshold alerts (the alerting lesson). A fast burn means "users are being hurt fast — page";
a slow burn means "we're trending toward missing the SLO — fix it this week."

## Part 5 — SLO-driven decisions, and SLA vs SLO vs SLI

```text
SLI   the MEASUREMENT (good/total) — what you observe
SLO   your internal TARGET for the SLI (e.g. 99.9%) — what you aim for
SLA   a CONTRACT with customers (with penalties) — usually LOOSER than your SLO
      → you set the SLO STRICTER than the SLA so you fix problems before breaching the contract
```

SLOs **drive engineering priorities**:

```text
□ budget healthy → invest in features/velocity (reliability is good enough)
□ budget burning/exhausted → prioritize reliability work (the budget says so, not opinion)
□ choosing what to build → SLOs tell you which services need reliability investment
□ post-incident → did it threaten the SLO? size the response to user impact, not drama
```

This is the bridge to **SRE** (next track): SLOs and error budgets are the **operational contract**
that turns observability data into reliability **decisions** — replacing "is it reliable enough?"
arguments with a number everyone agreed on.

## Hands-on lab

```text
SLO design exercise + PromQL (the core SRE skill).

1. DEFINE SLIs — for a checkout API, write the availability and latency SLI (good/total):
   availability SLI = ______ / ______      latency SLI = (requests < 300ms) / total

2. SET an SLO and compute the error budget:
   - Choose an SLO (e.g. 99.9% availability over 28 days).
   - Error budget = 0.1% → how many minutes of errors over 28 days? (≈ 40 min)
   - If you had 25 min of errors this period, how much budget remains?

3. NINES cost — fill in allowed monthly downtime: 99% = ____, 99.9% = ____, 99.99% = ____.
   Why is 99.999% usually not worth it?

4. PromQL — availability SLI and error-budget burn (sketch):
   availability: sum(rate(http_requests_total{status!~"5.."}[28d])) / sum(rate(http_requests_total[28d]))
   error ratio (for burn): sum(rate(http_requests_total{status=~"5.."}[1h])) / sum(rate(http_requests_total[1h]))

5. DECISION — your error budget is 80% spent with 10 days left in the window. A risky new feature
   is ready to ship. What does the error-budget policy say? (Slow down / freeze risky changes.)

6. SLA vs SLO — if your SLA promises 99.5%, what should your internal SLO be, and why?
```

```bash
# If you have Prometheus running, compute an availability SLI:
# curl -s 'localhost:9090/api/v1/query?query=sum(rate(prometheus_http_requests_total{code!~"5.."}[1h]))/sum(rate(prometheus_http_requests_total[1h]))'
echo "SLI=measurement, SLO=target, error budget=1-SLO (spend it), burn rate=how fast you spend it."
```

## Exercises

1. Define an SLI and write availability and latency SLIs for a service.
2. Set an SLO and explain why each additional nine costs more (and why 100% is wrong).
3. Compute an error budget from an SLO and reason about spending it.
4. Explain burn-rate alerting and why it beats threshold alerting.
5. Use the error-budget policy to make a ship/freeze decision.
6. Distinguish SLI, SLO, and SLA and explain why SLO > SLA strictness.

## Troubleshooting

- **Chasing 100% reliability** — wrong target, infinite cost. *Fix:* set SLO to user need; embrace
  the error budget.
- **Dev vs ops fighting over ship/stabilize** — no shared signal. *Fix:* error-budget policy makes it
  objective.
- **SLI doesn't reflect user pain** — measured internally/wrong thing. *Fix:* measure at the user
  edge; good/total of what users feel.
- **Threshold alerts noisy / miss slow leaks** — *Fix:* multi-window burn-rate alerts tied to the
  SLO.
- **Breaching the SLA unexpectedly** — SLO too loose/equal to SLA. *Fix:* SLO stricter than SLA;
  alert before SLA breach.
- **No reliability prioritization** — *Fix:* let the error budget drive feature-vs-reliability work.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Justify briefly.

1. What is an SLI, and what makes a good one?
2. What is an SLO, and why isn't 100% the target?
3. Why does each additional nine cost more?
4. What is an error budget, and how do you spend it?
5. How does the error budget resolve reliability vs velocity?
6. What is burn rate, and why alert on it?
7. Differentiate SLI, SLO, and SLA.
8. Why set your SLO stricter than your SLA?
9. **Practical:** compute an error budget and make a ship/freeze decision.
10. **Practical:** write an availability SLI in PromQL.

## Solutions & validation

1. A quantitative measure (good/total) of service behavior from the user's view; good one correlates
   with user happiness.
2. A target for an SLI; 100% is impossibly expensive and users can't perceive it.
3. Exponentially more redundancy/complexity/ops per nine.
4. `1 − SLO` — the allowed unreliability; spend it on velocity/risk while in budget, freeze when
   exhausted.
5. It's an objective number: in budget → ship; out of budget → stabilize (no argument).
6. How fast you consume the budget; alerting on it ties pages to real user impact and catches fast
   and slow problems.
7. SLI = measurement, SLO = internal target, SLA = customer contract (with penalties).
8. So you detect/fix problems **before** breaching the contractual SLA.
9. **Validation:** 80% spent + 10 days left → freeze risky changes (see lab).
10. **Validation:** `sum(rate(...{status!~"5.."}[28d]))/sum(rate(...[28d]))`.

> [!TIP]
> SLOs turn observability into **decisions**: pick **SLIs** that reflect user happiness, set an
> **SLO** at the level users need (not 100%), and treat the **error budget** as an allowance you
> spend on velocity — freezing risky changes only when it's exhausted. Alert on **burn rate**, keep
> your SLO **stricter than your SLA**, and let the budget — not opinions — arbitrate reliability vs
> features. This is the operational contract that the whole SRE discipline is built on.

## What's next

Next: **Lesson 1708 — Building an Observable System.** The capstone: instrumenting a service for all
three pillars with OpenTelemetry, choosing a stack, the observability-driven debugging workflow,
common pitfalls, cost management, and a production-readiness checklist that ties the whole track
together.
