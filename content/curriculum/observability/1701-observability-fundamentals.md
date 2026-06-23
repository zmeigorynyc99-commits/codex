---
title: "Observability — Fundamentals & the Three Pillars"
slug: "observability-fundamentals-and-the-three-pillars"
track: "observability"
trackName: "Monitoring, Logging & Observability"
module: "Observability Foundations"
order: 1701
level: "Intermediate"
difficulty: "Intermediate"
distribution: "Cross-platform"
category: "DevOps"
tags: [observability, monitoring, metrics, logs, traces, telemetry]
cover: "/covers/curriculum/observability.svg"
estMinutes: 55
status: "published"
summary: "Why observability and how to think about it: monitoring vs observability, the three pillars (metrics, logs, traces), known-unknowns vs unknown-unknowns, telemetry and instrumentation, and the goal — being able to ask why a system behaves as it does without shipping new code."
seoTitle: "Observability 1: Fundamentals & the Three Pillars (metrics, logs, traces)"
seoDescription: "Intro to observability: monitoring vs observability, the three pillars (metrics/logs/traces), telemetry, cardinality, and asking 'why' about systems. Lab and assessment."
---

You can build systems — but can you **see inside them** when something's wrong at 3 a.m.?
**Observability** is the property of a system that lets you understand its internal state from its
external outputs — to ask **"why is it behaving this way?"** without deploying new code. This
lesson establishes the foundations: how **observability differs from monitoring**, the **three
pillars** (metrics, logs, traces) and what each is good for, the **known-unknowns vs unknown-
unknowns** distinction that motivates observability, and **telemetry/instrumentation** — the data
you must emit to be observable. This is the discipline that makes everything you've built
operable.

## Learning objectives

By the end of this lesson you will be able to:

- Distinguish **monitoring** from **observability**.
- Describe the **three pillars** (metrics, logs, traces) and when to use each.
- Explain **known-unknowns vs unknown-unknowns**.
- Define **telemetry, instrumentation, and cardinality**.
- Explain why observability matters for modern (distributed) systems.

## Part 1 — Monitoring vs observability

They're related but not the same:

```text
MONITORING       watching KNOWN things — predefined metrics/checks, dashboards, alerts
   "Is CPU > 90%? Is the service up? Is error rate above threshold?"
   → answers questions you KNEW to ask in advance (known-unknowns)
OBSERVABILITY    being able to ASK NEW questions of your system without changing it
   "WHY are checkout requests from European mobile users on v2.3 slow only after 2pm?"
   → explore unanticipated problems (unknown-unknowns) by slicing rich telemetry
```

Monitoring tells you **that** something is wrong (the alert fires); observability lets you figure
out **why** (drill into high-cardinality data you didn't pre-aggregate). Monitoring is a subset:
you still need dashboards and alerts, but in complex distributed systems, the failures you didn't
predict dominate — and that's what observability addresses.

> [!IMPORTANT]
> **Monitoring answers questions you knew to ask; observability lets you ask new ones.** In a
> simple system you can predefine every check. In a modern distributed system, most incidents are
> **novel** — a combination of conditions nobody anticipated — so pre-built dashboards aren't
> enough. Observability means emitting **rich, high-cardinality telemetry** you can slice
> arbitrarily *after* the fact, so you can investigate the unexpected without shipping a new build
> just to add a log line. Both matter; observability is what saves you in the failures you didn't
> foresee.

## Part 2 — The three pillars

The classic model — three complementary data types:

```text
METRICS   numeric measurements over time (counters, gauges, histograms)
   cheap, aggregatable, great for DASHBOARDS + ALERTING + trends
   "request rate, error rate, latency p99, CPU%, queue depth"
LOGS      timestamped records of discrete events (structured ideally)
   detailed CONTEXT for a specific event; great for DEBUGGING + forensics
   "ERROR order 123 failed: payment declined (code 402) user=alice"
TRACES    the path of a single request ACROSS services (spans + timing)
   shows WHERE time is spent / WHERE it failed in a distributed call chain
   "request → api-gw 2ms → auth 15ms → orders 8ms → DB 340ms ← the bottleneck"
```

- **Metrics** — "how much/how many, over time?" — efficient, perfect for **alerting and
  dashboards**, but aggregated (low detail).
- **Logs** — "what exactly happened in this event?" — rich detail for **debugging**, but voluminous
  and costly at scale.
- **Traces** — "what was the path and timing of this request through my services?" — essential for
  **distributed systems** (where a single request touches many services).

You need all three: metrics to **detect** and trend, traces to **localize** which service, logs to
**explain** the specific failure.

## Part 3 — Using the pillars together

The pillars **complement** each other in an investigation:

```text
1. METRIC alert fires: "checkout error rate spiked to 8%"            (DETECT — something's wrong)
2. DASHBOARD: errors correlate with the 'payments' service, region eu (NARROW — where/when)
3. TRACE of a failing request: time/failure is in payments→bank-API   (LOCALIZE — which hop)
4. LOGS for that span: "bank-API timeout after 30s, connection refused" (EXPLAIN — root cause)
```

Metrics catch it and show scope, traces pinpoint the failing component in the request path, and
logs give the exact error. A mature setup **links** them — click an anomalous metric → see related
traces → jump to the logs for a specific span (correlated by IDs). This linking is what turns three
data silos into fast root-cause analysis.

## Part 4 — Telemetry, instrumentation, and cardinality

```text
TELEMETRY      the data your system emits about itself (metrics, logs, traces)
INSTRUMENTATION  adding code/agents that EMIT telemetry — you can't observe what you don't emit
   - auto-instrumentation (agents/libraries) + manual (custom metrics, structured logs, spans)
   - OpenTelemetry (OTel): the vendor-neutral STANDARD for emitting all three pillars
CARDINALITY    the number of unique values a label/dimension can have
   - high cardinality (user_id, request_id) = powerful slicing BUT expensive for metrics
   - the tension: rich dimensions enable observability but cost storage/money
```

You're only observable to the extent you **instrument**. **OpenTelemetry (OTel)** has become the
standard, vendor-neutral way to instrument once and export to any backend (Prometheus, Jaeger,
Datadog, etc.). **Cardinality** is the key trade-off: high-cardinality dimensions (per-user,
per-request) make data sliceable and powerful but expensive — managing it is a core observability
skill.

> [!TIP]
> **Instrument with OpenTelemetry** so you emit metrics, logs, and traces in a vendor-neutral way
> and aren't locked into one backend. Add **structured** logs (key-value, not free text),
> **meaningful metric labels**, and **trace context** propagated across services. Watch
> **cardinality**: per-request IDs belong in traces/logs (where high cardinality is fine), not as
> metric labels (where each unique value multiplies cost). The data you don't emit is the question
> you can't answer — but emitting everything bankrupts you, so instrument deliberately.

## Part 5 — Why it matters now

Observability became essential because systems got **distributed**:

```text
MONOLITH (old)       one process, one log file, one stack trace → easy to debug
MICROSERVICES/cloud  one user request touches 20 services across containers/regions
   → no single log/stack trace tells the whole story
   → failures emerge from INTERACTIONS (a slow dependency, a retry storm, partial outage)
   → you MUST correlate across services → traces + structured logs + metrics
```

In a monolith you could attach a debugger and read a log. In a microservices/serverless/Kubernetes
world (everything you've built in this curriculum), a request flows through many independently-
deployed services — so understanding behavior **requires** telemetry that crosses service
boundaries. Observability is the operational counterpart to all the distributed systems you've
learned to build.

## Hands-on lab

```text
Conceptual + reasoning exercise (real tooling comes in the next lessons).

1. PILLAR CHOICE — which pillar (metric/log/trace) best answers each?
   a) "What's our p99 latency trend this week?"           → ______
   b) "Why did THIS specific order fail at 14:32?"          → ______
   c) "Which service in the request path is the bottleneck?" → ______
   d) "Alert me if error rate exceeds 1%"                   → ______
   (Answers: metric; log; trace; metric)

2. INVESTIGATION FLOW — order these steps and label which pillar each uses:
   [ ] read logs for the failing span   [ ] alert fires on error-rate metric
   [ ] trace a failing request          [ ] dashboard shows it's the payments service
   (Order: alert(metric) → dashboard(metric) → trace → logs)

3. CARDINALITY — explain why putting `user_id` as a label on a metric is dangerous, but as a field
   on a log/trace is fine.

4. KNOWN vs UNKNOWN — give one "known-unknown" you'd build a dashboard/alert for, and one
   "unknown-unknown" that observability (ad-hoc slicing) would help you investigate.
```

```bash
# A taste of telemetry locally: emit a structured log line + a simple metric idea
echo '{"ts":"2026-06-23T14:32:00Z","level":"error","service":"payments","order":123,"msg":"declined","code":402}'
#   structured logs (JSON) are queryable/sliceable — unlike free-text logs
# (Prometheus metric format example)
printf 'http_requests_total{service="payments",status="500"} 42\n'
```

## Exercises

1. Explain monitoring vs observability with an example question each answers.
2. Describe the three pillars and the best use for each.
3. Walk an incident investigation through all three pillars in order.
4. Define telemetry, instrumentation, and cardinality; explain the cardinality trade-off.
5. Explain why distributed systems make observability essential (vs a monolith).
6. Classify five questions by which pillar answers them.

## Troubleshooting

- **Alert fired but no idea why** — monitoring without observability. *Fix:* add rich telemetry
  (traces/structured logs) to investigate.
- **Can't trace a request across services** — no distributed tracing/context propagation. *Fix:*
  instrument with OTel; propagate trace IDs.
- **Logs unsearchable** — free-text. *Fix:* structured (JSON) logs with consistent fields.
- **Metrics bill exploded** — high-cardinality labels. *Fix:* move per-request dimensions to
  traces/logs; limit metric labels.
- **"Why is it slow?" unanswerable** — no traces. *Fix:* add tracing to see the request path/
  timing.
- **Vendor lock-in on telemetry** — proprietary agents. *Fix:* OpenTelemetry (portable).

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Justify briefly.

1. How does observability differ from monitoring?
2. Name the three pillars and one use for each.
3. What's the difference between known-unknowns and unknown-unknowns?
4. How do the three pillars work together in an investigation?
5. What is telemetry, and what is instrumentation?
6. What is OpenTelemetry and why does it matter?
7. What is cardinality, and what's the trade-off?
8. Why are distributed systems harder to observe than monoliths?
9. **Practical:** map four questions to the right pillar.
10. **Practical:** order an incident investigation across the pillars.

## Solutions & validation

1. Monitoring watches **predefined** things (known-unknowns); observability lets you ask **new**
   questions (unknown-unknowns) without changing code.
2. Metrics (alerting/trends), logs (event detail/debugging), traces (request path/timing across
   services).
3. Known-unknowns = problems you anticipated (build dashboards/alerts); unknown-unknowns = novel
   ones (explore telemetry).
4. Metrics detect + scope, traces localize the failing hop, logs explain the root cause.
5. Telemetry = the data a system emits; instrumentation = adding code/agents to emit it.
6. The vendor-neutral **standard** for emitting all three pillars; avoids backend lock-in.
7. Number of unique label/dimension values; high cardinality = powerful slicing but expensive
   (esp. metrics).
8. A single request crosses many services; no one log/stack trace tells the whole story — need
   correlation.
9. **Validation:** latency trend→metric, specific failure→log, bottleneck→trace, alert→metric.
10. **Validation:** alert(metric)→dashboard(metric)→trace→logs.

> [!TIP]
> Observability = **emit rich telemetry (metrics, logs, traces) so you can ask why, not just
> what.** Use **metrics to detect and trend**, **traces to localize** the failing service, and
> **logs to explain** the specific event — and **link** them. Instrument with **OpenTelemetry**,
> keep logs **structured**, and manage **cardinality** deliberately. In the distributed systems you
> now build, this is what lets you operate with confidence instead of guessing in the dark.

## What's next

Next: **Lesson 1702 — Metrics & Time-Series (Prometheus).** The first pillar in depth: metric types
(counter/gauge/histogram), pull-based collection, PromQL queries, labels and cardinality, the RED
and USE methods, and building meaningful metrics for your services.
