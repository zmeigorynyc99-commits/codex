---
title: "Observability — Logging & Log Management"
slug: "observability-logging-and-log-management"
track: "observability"
trackName: "Monitoring, Logging & Observability"
module: "Observability Foundations"
order: 1703
level: "Intermediate"
difficulty: "Advanced"
distribution: "Cross-platform"
category: "DevOps"
tags: [observability, logging, structured-logs, elk, loki, correlation-id]
cover: "/covers/curriculum/observability.svg"
estMinutes: 60
status: "published"
summary: "The logging pillar done well: structured logging vs free text, log levels, centralized aggregation (ELK and Loki), parsing and querying, correlation IDs to tie logs to requests/traces, sampling and retention for cost, and what (and what not) to log."
seoTitle: "Observability 3: Logging & Log Management (structured logs, ELK, Loki)"
seoDescription: "Logging: structured vs free-text, log levels, centralized aggregation (ELK/Loki), parsing/querying, correlation IDs, sampling, retention/cost, and what not to log. Lab + assessment."
---

Logs are the most detailed pillar — the record of **what exactly happened** in a specific event —
but bad logging is worse than none: unsearchable free text, missing context, secrets leaked, and a
bill from storing terabytes of noise. This lesson makes logging **useful**: **structured logging**
vs free text, **log levels**, **centralized aggregation** (the ELK/Loki world), **correlation IDs**
to tie logs to requests and traces, and the **retention/sampling/cost** discipline. Done right, logs
turn from a haystack into a fast, searchable debugging tool that explains the failures your metrics
detected.

## Learning objectives

By the end of this lesson you will be able to:

- Write **structured logs** with appropriate **levels**.
- Explain **centralized log aggregation** (ELK, Loki) and the pipeline.
- Use **correlation IDs** to tie logs to requests/traces.
- Manage **retention, sampling, and cost**.
- Decide **what** (and what not) to log.

## Part 1 — Structured logging

The single biggest logging upgrade: log **structured data** (key-value/JSON), not free-text prose:

```text
✗ FREE TEXT (hard to query):
   2026-06-23 14:32:01 ERROR Order 123 failed for user alice: payment declined code 402

✓ STRUCTURED (machine-queryable):
   {"ts":"2026-06-23T14:32:01Z","level":"error","service":"payments","order_id":123,
    "user":"alice","event":"payment_declined","code":402,"trace_id":"abc123"}
```

Structured logs are **queryable**: "show all `payment_declined` with `code=402` in the last hour,
grouped by user" is a filter, not a regex nightmare. Each log is a set of **fields** you can search,
filter, and aggregate. Use a logging library that emits JSON; include consistent fields (timestamp,
level, service, event, IDs).

> [!IMPORTANT]
> **Log structured key-value data, not free-text sentences.** Free text forces fragile regex
> parsing and makes aggregation nearly impossible at scale; structured (JSON) logs are **filterable
> and aggregatable** like a database — "count errors by code per service" becomes trivial. Include
> consistent fields (service, level, event, **trace_id/correlation_id**) on every line. This one
> change is what makes centralized logging actually useful instead of a searchable-but-painful text
> dump.

## Part 2 — Log levels

Levels let you control verbosity and signal severity:

```text
TRACE/DEBUG  fine-grained, dev/diagnostic detail (usually OFF in prod, or sampled)
INFO         normal significant events (service started, request handled, job completed)
WARN         something unexpected but handled (retrying, deprecated path, near a limit)
ERROR        a failure that needs attention (request failed, dependency down)
FATAL/CRITICAL  the app cannot continue (crash, unrecoverable)
```

Use levels **consistently**: ERROR means "a human should probably look," not "anything unusual." Run
prod at **INFO** (or WARN) and raise to DEBUG temporarily when investigating. Over-logging at ERROR
causes alert fatigue (the SIEM lesson); under-logging leaves you blind. Match the level to the
**actionability** of the event.

## Part 3 — Centralized aggregation

Logs scattered on hosts are useless (and lost when the host dies — recall the SIEM lesson). **Ship
them to a central system**:

```text
   app stdout/files → SHIPPER (Fluent Bit, Vector, Filebeat, Promtail) → STORE/INDEX → UI/query
   ELK stack:   Elasticsearch (store+index) + Logstash (process) + Kibana (UI)
   Loki:        Grafana Loki (index LABELS only, store compressed logs) + Grafana UI — cheaper
   Cloud:       CloudWatch Logs, Cloud Logging, Datadog, etc.
```

- **Ship to stdout** (12-factor, the Docker lesson) → an agent forwards to the central store.
- **ELK** (Elasticsearch/Logstash/Kibana) — full-text indexing, powerful but resource-heavy.
- **Loki** — indexes only **labels** (not full text), stores compressed logs cheaply — the metrics-
  style approach to logs, often paired with Prometheus/Grafana.
- Centralization gives **search across all services**, retention, and correlation — the whole point.

## Part 4 — Correlation IDs: tying it together

A single user request flows through many services, each logging separately. A **correlation ID**
(a.k.a. request ID / trace ID) is a unique value attached to all logs (and traces) for **one
request**:

```text
   request arrives → assign correlation_id = "abc123" (or take it from an upstream header)
   → propagate it in headers to every downstream service
   → EVERY log line for this request includes trace_id/correlation_id = "abc123"
   → search "abc123" → see the ENTIRE request's journey across all services, in order
```

This is what makes distributed debugging possible: filter logs by one ID and reconstruct exactly
what happened to **that** request everywhere. Tie the **same ID** into your **traces** (next lesson)
and you can jump from a slow trace to its logs instantly. Propagating correlation/trace context is
one of the highest-value instrumentation steps you can take.

> [!TIP]
> **Put a `trace_id`/`correlation_id` on every log line and propagate it across services.** When an
> incident hits, one ID lets you pull **all** logs for a single failing request across your entire
> system, in order — turning "grep 12 services and hope" into a single filter. Use the **same ID**
> as your distributed traces so you can pivot metric → trace → logs seamlessly. This single field is
> the difference between debuggable and undebuggable distributed systems.

## Part 5 — Retention, sampling, cost, and what not to log

Logs are **expensive at scale** (storage + indexing) — manage volume deliberately:

```text
RETENTION    keep recent logs hot (days), archive older to cheap storage, then delete
   tiered: 7d searchable → 90d archived (object storage) → delete (or per compliance)
SAMPLING     for high-volume/low-value logs (e.g. successful requests), keep a fraction
   keep ALL errors; sample 1% of successes → huge cost cut, keep the signal
LEVELS        don't ship DEBUG to prod storage; raise temporarily when needed
WHAT NOT to LOG (critical):
   ✗ secrets/credentials/tokens   ✗ full PII (card numbers, SSNs)   ✗ huge payloads
   → these are a breach and a compliance violation (recall security/SIEM lessons)
```

The discipline mirrors metrics cardinality and the SIEM lesson: **keep all the high-value signal
(errors, security events) and sample/tier the rest**, never log **secrets or excess PII**, and set
**retention** by value and compliance. Logging everything forever bankrupts you and creates a
liability; logging nothing leaves you blind — aim for the deliberate middle.

## Hands-on lab

```bash
# Run Loki + Grafana (lightweight) OR just practice structured logging + querying locally.

# 1. Emit STRUCTURED logs (JSON) — note the trace_id field
log() { echo "{\"ts\":\"$(date -u +%FT%TZ)\",\"level\":\"$1\",\"service\":\"$2\",\"trace_id\":\"$3\",\"event\":\"$4\"}"; }
log info  payments abc123 request_received  >> app.log
log info  payments abc123 calling_bank      >> app.log
log error payments abc123 payment_declined  >> app.log
log info  orders   xyz789 order_created      >> app.log

# 2. Query like a log system would (structured = easy filtering with jq)
echo "--- all logs for request abc123 (correlation!) ---"
grep abc123 app.log | python3 -c "import sys,json; [print(json.loads(l)['event']) for l in sys.stdin]"
echo "--- all errors across services ---"
grep '"level":"error"' app.log

# 3. Levels: filter to only errors (what you'd alert/page on)
python3 -c "import json;[print(l.strip()) for l in open('app.log') if json.loads(l)['level']=='error']"

# 4. (Optional) Loki + Grafana stack:
#    docker run -d --name loki -p 3100:3100 grafana/loki
#    docker run -d --name grafana -p 3000:3000 grafana/grafana
#    ship app.log via Promtail; query in Grafana with LogQL: {service="payments"} |= "abc123"

# 5. What-NOT-to-log check: scan for secrets you should never log
grep -iE "password|token|secret|card" app.log && echo ">> LEAK risk!" || echo "no secrets logged ✓"
rm -f app.log
```

## Exercises

1. Convert three free-text log lines to structured JSON with consistent fields.
2. Assign appropriate log levels to five events and justify each.
3. Explain centralized aggregation and compare ELK vs Loki.
4. Use a correlation/trace ID to reconstruct a single request across services.
5. Design a retention + sampling policy that controls cost while keeping signal.
6. List what must never be logged and why.

## Troubleshooting

- **Logs unsearchable** — free text. *Fix:* structured JSON with consistent fields.
- **Can't follow a request across services** — no correlation ID. *Fix:* assign + propagate
  trace_id; log it everywhere.
- **Logs lost after an incident** — local only. *Fix:* centralize (ship to a store) in real time.
- **Huge logging bill** — logging everything at high volume. *Fix:* sample low-value logs, tier
  retention, drop DEBUG in prod.
- **Secret/PII in logs** — breach. *Fix:* redact at source; never log credentials; scan logs.
- **Alert fatigue from ERROR noise** — misused level. *Fix:* ERROR = actionable; downgrade
  handled cases to WARN/INFO.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Justify briefly.

1. Why are structured logs better than free text?
2. What do log levels convey, and what should ERROR mean?
3. Why centralize logs, and what's the pipeline?
4. ELK vs Loki — key difference?
5. What is a correlation/trace ID and why is it essential?
6. How do you control logging cost while keeping signal?
7. What must never be logged?
8. How do logs complement metrics and traces?
9. **Practical:** reconstruct a request's journey via a correlation ID.
10. **Practical:** filter structured logs to errors only.

## Solutions & validation

1. They're **queryable/aggregatable** (fields), not regex-parsed prose.
2. Severity/verbosity; **ERROR** = a failure a human should likely look at (actionable).
3. Local logs are lost/unsearchable; ship → store/index → query. Pipeline: app→shipper→store→UI.
4. ELK indexes **full text** (powerful, heavy); Loki indexes **labels only** (cheaper).
5. A unique ID across all logs/traces for one request — lets you reconstruct its whole journey.
6. Sample low-value logs (keep all errors), tier retention, drop DEBUG in prod.
7. Secrets/credentials/tokens and full PII (breach + compliance risk).
8. Metrics detect/scope, traces localize, **logs explain** the specific event (with full context).
9. **Validation:** grep/filter by `abc123` shows the ordered events across services (see lab).
10. **Validation:** filter `level == error` returns only error lines.

> [!TIP]
> Useful logging = **structured (JSON) + consistent levels + centralized + correlation IDs +
> cost-managed.** Make logs queryable like a database, put a **trace_id on every line** so you can
> follow one request everywhere, ship them centrally, sample/tier to control cost, and **never log
> secrets/PII**. Then logs become the "explain why" companion to your metrics and traces instead of
> an expensive, unsearchable liability.

## What's next

Next: **Lesson 1704 — Distributed Tracing.** The third pillar: spans and traces, context
propagation across services, OpenTelemetry instrumentation, sampling strategies, and using traces to
find latency bottlenecks and failures in request chains that span many services.
