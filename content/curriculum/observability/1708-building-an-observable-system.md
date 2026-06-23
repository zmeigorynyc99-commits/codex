---
title: "Observability — Building an Observable System"
slug: "observability-building-an-observable-system"
track: "observability"
trackName: "Monitoring, Logging & Observability"
module: "Observability in Practice"
order: 1708
level: "Advanced"
difficulty: "Senior"
distribution: "Cross-platform"
category: "DevOps"
tags: [observability, opentelemetry, debugging, stack, best-practices]
cover: "/covers/curriculum/observability.svg"
estMinutes: 65
status: "published"
summary: "The capstone: instrumenting a service for all three pillars with OpenTelemetry, choosing an observability stack, the observability-driven debugging workflow, correlating signals, common pitfalls, cost management, and a production-readiness checklist that ties the whole track together."
seoTitle: "Observability 8: Building an Observable System (OTel, debugging, stack)"
seoDescription: "Building observable systems: OpenTelemetry instrumentation for all 3 pillars, stack choices, the debugging workflow, correlation, pitfalls, cost, and a readiness checklist. Capstone lab + assessment."
---

This capstone brings the pillars together into a **complete, observable system**. You'll see how to
**instrument** a service for metrics, logs, and traces with **OpenTelemetry**, **choose a stack**,
follow the **observability-driven debugging workflow** (metric → trace → log, correlated), avoid the
**common pitfalls**, manage **cost**, and run a **production-readiness checklist**. The goal is a
system where, when something breaks, you can go from "alert fired" to "root cause" in minutes — and
where observability is built **in from the start**, not bolted on after the first outage.

## Learning objectives

By the end of this lesson you will be able to:

- Instrument a service for **all three pillars** with OpenTelemetry.
- Choose an appropriate **observability stack**.
- Follow the **observability-driven debugging** workflow with correlated signals.
- Avoid common **pitfalls** and manage **cost**.
- Apply a **production-readiness checklist**.

## Part 1 — Instrumenting with OpenTelemetry

**OpenTelemetry** unifies all three pillars under one vendor-neutral SDK/API — instrument once,
export anywhere:

```text
   YOUR SERVICE (OTel SDK)
     ├─ METRICS  (RED/golden signals, custom counters/histograms)
     ├─ LOGS     (structured, with trace_id correlation)
     └─ TRACES   (auto-instrumented HTTP/DB + manual business spans)
          │ all share a TRACE ID (the correlation key!)
          ▼
   OTel COLLECTOR (receive, process, batch, sample, export)
          ▼
   backends: Prometheus (metrics) · Loki (logs) · Tempo/Jaeger (traces) · or one vendor
```

The winning pattern: **auto-instrumentation** for breadth (HTTP, DB, framework spans/metrics with
near-zero code) + **a few manual spans/metrics** for your key business operations, all emitting a
shared **trace ID** so the pillars **correlate**. The **OTel Collector** sits between your apps and
backends, so you can switch backends, add sampling/processing, and avoid vendor lock-in.

> [!IMPORTANT]
> **Build observability in from day one with OpenTelemetry, not after the first outage.** Adding
> telemetry mid-incident is too late — you can't go back in time to instrument the failure. Start
> every service with auto-instrumentation (free breadth) plus the **golden-signal metrics**,
> **structured logs with trace_id**, and **traces** that propagate context. OTel keeps you
> **vendor-neutral** (instrument once, export to any backend via the Collector), so the expensive
> instrumentation work isn't wasted if you change tools. Observability is a build-time investment that
> pays off the moment something breaks.

## Part 2 — Choosing a stack

```text
OPEN-SOURCE (self-hosted):
   metrics: Prometheus    logs: Loki      traces: Tempo/Jaeger    viz: Grafana    (the "LGTM" stack)
   + no per-GB vendor bill, full control   - you operate it (scaling, storage, upgrades)
MANAGED / SaaS:
   Datadog, Honeycomb, New Relic, Grafana Cloud, cloud-native (CloudWatch/Cloud Ops)
   + no ops, powerful features, fast start  - cost can be high at scale; some lock-in
HYBRID: OTel SDKs (portable) → Collector → whichever backend (swap without re-instrumenting)
```

The choice mirrors the IaaS-vs-managed trade-off from the cloud track: **self-hosted** (Prometheus/
Grafana/Loki/Tempo) gives control and avoids per-GB bills but you operate it; **managed** (Datadog/
Honeycomb/etc.) is turnkey but costs more at scale. **Instrument with OTel regardless** so the backend
is swappable. For most teams: start managed (speed) or with Grafana's stack (cost), and keep
instrumentation portable.

## Part 3 — The observability-driven debugging workflow

The payoff — going from symptom to root cause fast by **correlating the pillars**:

```text
1. DETECT    a symptom-based ALERT fires (SLO burn / error rate / latency)        [METRICS]
2. SCOPE     dashboard: which service/region/version/endpoint is affected?         [METRICS]
3. LOCALIZE  open an example failing/slow TRACE → which span dominates/errors?      [TRACES]
4. EXPLAIN   jump to that span's LOGS (same trace_id) → the exact error/context     [LOGS]
5. CONFIRM   form a hypothesis, check a metric to confirm, then fix/rollback        [all]
```

This loop — **metric detects, dashboard scopes, trace localizes, logs explain** — is only possible
because the pillars are **correlated** (shared trace IDs, linked in the UI). A mature setup lets you
click an anomalous metric → see related traces → jump to logs in one flow. This is the difference
between minutes-to-resolution and hours of grepping. It's also the **observability** half of the
incident-response lifecycle you learned in the security track.

## Part 4 — Common pitfalls

```text
✗ Three disconnected silos (metrics, logs, traces don't share IDs) → can't correlate
   → FIX: propagate trace_id everywhere; link the pillars in your UI
✗ Cardinality explosion (high-cardinality metric labels) → cost/OOM
   → FIX: low-cardinality metric labels; per-request detail in traces/logs
✗ Logging everything / 100% tracing → huge bill
   → FIX: sample (keep errors/slow), tier retention, structured + leveled logs
✗ Vanity dashboards / alert fatigue → noise, ignored signals
   → FIX: golden signals, symptom-based actionable alerts, runbooks
✗ Instrumenting after the outage → no data for the failure you needed to debug
   → FIX: observability built-in from day one
✗ Vendor lock-in on proprietary agents → expensive to switch
   → FIX: OpenTelemetry
```

Almost every observability failure is one of these — and each maps to a principle from the earlier
lessons. Avoiding them is mostly **discipline**: correlate via IDs, manage cardinality and cost,
alert on symptoms with runbooks, and instrument early with OTel.

## Part 5 — Cost management and readiness

Observability data can rival your infrastructure bill — manage it like the FinOps lesson taught:

```text
COST LEVERS:  sample traces (tail: keep errors/slow), sample/tier logs, low-cardinality metrics,
   retention tiers (hot days → archive → delete), drop high-volume low-value telemetry
   → the same "keep the signal, sample the noise" discipline across all three pillars
```

```text
OBSERVABILITY PRODUCTION-READINESS CHECKLIST (the whole track):
□ All 3 pillars instrumented (OpenTelemetry); trace context propagated across services
□ Metrics: RED for services, USE for resources; low-cardinality labels; histograms for latency
□ Logs: structured (JSON), leveled, centralized, with trace_id; secrets/PII never logged
□ Traces: context propagated; sampling keeps errors/slow (tail); manual spans on key ops
□ Pillars CORRELATED (shared trace_id; click metric→trace→log)
□ Dashboards: golden signals, answer a question, dashboards-as-code, no sprawl
□ Alerts: symptom-based, actionable, runbooks linked, severity/routing/escalation, low noise
□ SLIs/SLOs defined with error budgets + burn-rate alerts; SLO stricter than SLA
□ Cost managed: sampling, retention tiers, cardinality control
□ Built-in from the start; portable (OTel) to avoid lock-in
```

## Hands-on lab

```bash
# Stand up a mini observability stack and walk the debugging workflow conceptually.
# (Grafana "LGTM"-style: Prometheus + Loki + Tempo + Grafana; here a minimal subset.)
docker network create obs 2>/dev/null
cat > prometheus.yml <<'EOF'
global: { scrape_interval: 5s }
scrape_configs:
  - job_name: 'prometheus'
    static_configs: [{ targets: ['localhost:9090'] }]
EOF
docker run -d --name prom    --network obs -p 9090:9090 -v "$PWD/prometheus.yml:/etc/prometheus/prometheus.yml" prom/prometheus
docker run -d --name grafana --network obs -p 3000:3000 grafana/grafana
docker run -d --name tempo   --network obs -p 3200:3200 -p 4318:4318 grafana/tempo || true
echo "Grafana http://localhost:3000 — add Prometheus (http://prom:9090) + Tempo data sources."

# 1. Build the correlation: a service would emit metrics + logs + traces sharing trace_id.
#    Demo a correlated log line (the trace_id is the join key across pillars):
echo '{"ts":"2026-06-23T14:32:01Z","level":"error","service":"checkout","trace_id":"abc123","event":"payment_timeout","span":"bank-api"}'

# 2. Walk the workflow (reason through it):
cat <<'EOF'
DETECT:   metric alert — checkout 5xx rate > 1% (SLO burn)
SCOPE:    dashboard — errors isolated to checkout, eu region, v2.3
LOCALIZE: trace abc123 — bank-api span = 30s timeout (the failing hop)
EXPLAIN:  logs for trace_id=abc123 — "payment_timeout: connection refused"
CONFIRM:  metric — bank-api dependency latency spiked at 14:30 → rollback / failover
EOF

# 3. Pitfall check: are your metrics low-cardinality? are logs structured w/ trace_id?
echo "Audit: no user_id metric labels? logs JSON+trace_id? traces sampled to keep errors? ✓"

# cleanup
docker rm -f prom grafana tempo 2>/dev/null; docker network rm obs 2>/dev/null
```

```text
4. READINESS REVIEW — take a service you know and score it against the checklist. Find the top 3
   gaps and what you'd fix first.
```

## Exercises

1. Describe how OpenTelemetry instruments all three pillars and why the trace_id is the key.
2. Compare a self-hosted (Grafana/Prometheus/Loki/Tempo) vs managed observability stack.
3. Walk a real incident through the metric→trace→log debugging workflow with correlation.
4. Identify three observability pitfalls in a sample setup and the fix for each.
5. Design a cost-control plan across all three pillars.
6. Score a service against the production-readiness checklist and prioritize gaps.

## Troubleshooting

- **Can't correlate pillars** — no shared IDs. *Fix:* propagate trace_id into logs/metrics-exemplars;
  link in UI.
- **Slow root-cause analysis** — siloed tools. *Fix:* unified stack + correlation; metric→trace→log
  flow.
- **Observability bill huge** — no sampling/retention. *Fix:* sample (keep errors/slow), tier
  retention, control cardinality.
- **No data for the outage** — instrumented too late. *Fix:* build in observability from the start.
- **Locked into a vendor** — proprietary agents. *Fix:* OpenTelemetry; Collector to switch backends.
- **Alerts/dashboards useless in incident** — noise/sprawl. *Fix:* golden signals, symptom alerts,
  runbooks.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Justify briefly.

1. How does OpenTelemetry unify the three pillars, and what's the correlation key?
2. What does the OTel Collector provide?
3. Compare self-hosted vs managed observability stacks.
4. Describe the metric→trace→log debugging workflow.
5. Why must the pillars be correlated?
6. Name three common observability pitfalls and fixes.
7. How do you manage observability cost across pillars?
8. Why instrument from day one?
9. **Practical:** walk an incident through the debugging workflow.
10. **Practical:** score a service against the readiness checklist.

## Solutions & validation

1. One SDK/API emits metrics, logs, and traces; the **trace_id** correlates them.
2. Receives/processes/samples/batches/exports telemetry; decouples apps from backends (no lock-in).
3. Self-hosted (control, no per-GB bill, you operate) vs managed (turnkey, costly at scale, some
   lock-in).
4. Metric detects → dashboard scopes → trace localizes the failing span → logs explain → confirm/fix.
5. Without correlation the pillars are silos; correlation enables fast root-cause across them.
6. e.g. disconnected pillars (share IDs), cardinality explosion (low-card labels), logging everything
   (sample/tier), alert fatigue (symptom alerts).
7. Sample traces (keep errors/slow), sample/tier logs, low-cardinality metrics, retention tiers.
8. You can't retroactively instrument the failure you need to debug; it must already be emitting.
9. **Validation:** alert→dashboard→trace abc123→logs→confirm dependency (see lab).
10. **Validation:** checklist scored; top gaps identified and prioritized.

> [!TIP]
> An observable system is **instrumented for all three pillars with OpenTelemetry, correlated by a
> shared trace ID, surfaced through golden-signal dashboards and symptom-based alerts, governed by
> SLOs/error budgets, and cost-managed by sampling.** Build it in **from day one** and keep it
> **portable** (OTel). Then the debugging loop — **metric detects, trace localizes, log explains** —
> takes you from alert to root cause in minutes. That's the difference between operating with
> confidence and guessing in the dark.

## What's next

You've completed the **Monitoring, Logging & Observability** track — fundamentals, metrics, logs,
traces, dashboards, alerting, SLOs/error budgets, and building observable systems. You can now see
inside the systems you build and operate them with confidence. Next in the roadmap: **Databases &
Data Infrastructure** — running, scaling, and operating the data stores at the heart of your
applications — followed by the remaining web, virtualization, storage, DR, SRE, and troubleshooting
tracks.
