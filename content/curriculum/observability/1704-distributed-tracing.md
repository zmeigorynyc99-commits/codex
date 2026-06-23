---
title: "Observability — Distributed Tracing"
slug: "observability-distributed-tracing"
track: "observability"
trackName: "Monitoring, Logging & Observability"
module: "Observability in Practice"
order: 1704
level: "Advanced"
difficulty: "Advanced"
distribution: "Cross-platform"
category: "DevOps"
tags: [observability, tracing, spans, opentelemetry, context-propagation, jaeger]
cover: "/covers/curriculum/observability.svg"
estMinutes: 60
status: "published"
summary: "The third pillar: spans and traces, context propagation across service boundaries, OpenTelemetry instrumentation, sampling strategies (head vs tail), and using traces to find latency bottlenecks and failures in request chains that span many services."
seoTitle: "Observability 4: Distributed Tracing (spans, OpenTelemetry, sampling)"
seoDescription: "Distributed tracing: spans/traces, context propagation, OpenTelemetry instrumentation, head vs tail sampling, and finding latency bottlenecks across services. Lab + assessment."
---

In a monolith, a stack trace shows you where a request spent its time. In a distributed system —
the microservices, serverless, and Kubernetes apps you've learned to build — a single request hops
through many independently-deployed services, and **no single stack trace exists**. **Distributed
tracing** solves this: it follows one request across **all** the services it touches, recording the
timing and outcome of each step. This lesson covers **spans and traces**, **context propagation**
(the magic that connects spans across services), **OpenTelemetry** instrumentation, **sampling**
strategies, and using traces to pinpoint **latency bottlenecks** and failures.

## Learning objectives

By the end of this lesson you will be able to:

- Explain **spans, traces**, and the parent-child structure.
- Describe **context propagation** across service boundaries.
- Instrument with **OpenTelemetry** (auto + manual spans).
- Choose **sampling** strategies (head vs tail).
- Use traces to find **latency bottlenecks** and failures.

## Part 1 — Spans and traces

```text
A TRACE = the full journey of ONE request, made of SPANS:
   span = one unit of work (a service call, a DB query, a function) with:
      - a name, start/end time (DURATION), status (ok/error), and attributes (tags)
      - a parent (forming a tree) and a shared TRACE ID

Trace (trace_id = abc123):
   ├─ api-gateway          [=========================] 360ms
   │   └─ auth-service      [==] 15ms
   │   └─ order-service     [====================] 330ms
   │        └─ database     [================] 320ms   ← the bottleneck is HERE
```

A **trace** is a tree of **spans** sharing a **trace ID**. Each span has a **duration** and
**parent**, so you see exactly **where time went** and **which step failed**. The visualization (a
waterfall/Gantt of spans) makes a slow database query or a failing downstream call **immediately
obvious** — something metrics and logs alone can't show for a multi-service request.

## Part 2 — Context propagation

The core mechanism that makes tracing work across services: each service **passes the trace
context** (trace ID + parent span ID) to the next, usually via **HTTP headers**:

```text
   client → [traceparent: 00-abc123-span1-01] → service A
      A creates a child span, calls B → [traceparent: 00-abc123-span2-01] → service B
         B creates a child span, queries DB → span3 ...
   → all spans share trace_id=abc123, linked parent→child → ONE coherent trace
```

The **W3C Trace Context** standard (`traceparent` header) is how this propagates across HTTP/gRPC/
messaging. Without propagation, you'd get disconnected spans (each service isolated); **with** it,
the spans assemble into one trace spanning the whole system. This is the same idea as the
**correlation ID** from logging — and ideally it's the **same ID**, so logs and traces link.

> [!IMPORTANT]
> **Context propagation is what turns isolated spans into a distributed trace.** Each service must
> **extract** the incoming trace context (from headers) and **inject** it into outgoing calls, so
> the trace ID flows through the entire request path. Break propagation at any hop (a service that
> doesn't forward the header, an async boundary that drops it) and the trace splits into
> disconnected fragments. Use the same trace ID in your **logs** so you can pivot from a slow span
> straight to its log lines — the unification of all three pillars around one request.

## Part 3 — OpenTelemetry instrumentation

**OpenTelemetry (OTel)** is the vendor-neutral standard for generating traces (and metrics/logs).
You instrument **once** and export to any backend (Jaeger, Tempo, Datadog, etc.):

```text
AUTO-INSTRUMENTATION   libraries/agents that automatically create spans for common operations
   (HTTP servers/clients, DB drivers, gRPC, frameworks) — zero/low code, gets you 80% there
MANUAL SPANS           add custom spans for YOUR business logic / important operations
```

```python
# OpenTelemetry (Python sketch) — a manual span around business logic
from opentelemetry import trace
tracer = trace.get_tracer("orders")

with tracer.start_as_current_span("process_order") as span:
    span.set_attribute("order.id", order_id)
    span.set_attribute("order.total", total)
    # ... work ...
    if failed:
        span.set_status(trace.StatusCode.ERROR)
        span.record_exception(err)
```

```text
   app (OTel SDK) → OTel COLLECTOR (receive/process/batch/export) → backend (Jaeger/Tempo/...)
```

Start with **auto-instrumentation** (huge coverage for free — HTTP, DB, framework spans), then add
**manual spans** with attributes around the operations you care about. The **OTel Collector** is a
common piece that receives telemetry and routes it to your backend(s), decoupling apps from
vendors.

## Part 4 — Sampling

Tracing **every** request at high volume is expensive (storage + overhead), so you **sample**:

```text
HEAD-based sampling   decide at the START of a request whether to keep it (e.g. keep 1%)
   + simple, low overhead    - might miss the rare slow/error traces you most want
TAIL-based sampling   buffer the whole trace, decide AFTER it completes
   + keep ALL errors + slow traces, sample the boring fast successes
   - needs more infra (buffer full traces), more complex
```

The goal: **keep the interesting traces** (errors, high latency) and sample the rest. **Tail
sampling** is ideal (you only know a trace is interesting once it's done — was it slow? did it
error?), but **head sampling** is simpler and common. Either way, **always keep error and slow
traces** — they're the ones you'll actually investigate.

> [!TIP]
> Sample to control cost, but **never drop the traces you'd want during an incident** — errors and
> high-latency requests. **Tail-based sampling** (decide after the trace completes) is best for this
> because it can keep all errors/slow traces and sample only the boring fast successes; **head
> sampling** is simpler but blind to outcome. At minimum, ensure error and slow-path traces are
> retained at 100%. A 1% uniform sample that happens to miss the one failing request defeats the
> purpose.

## Part 5 — Using traces to debug

Traces answer the questions metrics and logs can't for distributed requests:

```text
"Why is checkout slow?"        → open a slow trace → the waterfall shows DB span = 90% of time
"Where did the request fail?"   → the errored span is highlighted in red, with its exception
"What's the critical path?"     → which spans are sequential vs parallel; what to optimize
"Is a dependency the problem?"  → see the downstream service's span duration/errors
"Tail latency cause?"           → compare fast vs slow traces; find what the slow ones share
```

Workflow: a **metric** alert fires (high p99) → find an example **slow trace** → the waterfall shows
**which span** dominates → open that span's **logs** (same trace ID) for the exact error. Traces are
the **localize** step that connects detection (metrics) to explanation (logs) — indispensable once
your system is more than one service.

## Hands-on lab

```bash
# Run Jaeger all-in-one and view example traces (it traces ITSELF / accepts OTLP).
docker run -d --name jaeger -p 16686:16686 -p 4318:4318 jaegertracing/all-in-one:latest
echo "Open the Jaeger UI: http://localhost:16686  (search/visualize traces)"

# 1. Send a trace via OTLP/HTTP (a minimal manual span using curl + OTLP JSON)
#    (Conceptual: normally an OTel SDK does this. The UI shows the waterfall of spans.)
echo "In real apps: install OTel auto-instrumentation, set OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318"

# 2. Trace structure exercise (reason about a waterfall):
cat <<'EOF'
Trace abc123 (total 360ms):
  api-gateway      0–360ms
    auth            5–20ms   (15ms)
    order-service   25–355ms (330ms)
      cache-lookup  26–28ms  (2ms, miss)
      database      30–350ms (320ms)  <-- 
  Q: Where is the time going? What would you optimize first?
  A: the database span (320/360 ms). Optimize the query/index or add caching.
EOF

# 3. Propagation check (concept): every span shares trace_id=abc123; break a header → split trace.

# cleanup
docker rm -f jaeger
```

```text
4. SAMPLING decision — for a service doing 10,000 req/s, design a sampling strategy that controls
   cost but never loses error/slow traces. (Hint: tail sampling; keep 100% errors + p99-slow,
   sample ~1% of successes.)
```

## Exercises

1. Explain spans, traces, and the parent-child tree with a small example.
2. Describe context propagation and what happens if a service doesn't forward the trace header.
3. Compare auto- vs manual instrumentation with OpenTelemetry; when add a manual span?
4. Compare head vs tail sampling and which keeps error/slow traces.
5. Given a trace waterfall, identify the bottleneck and what to optimize.
6. Describe the metric→trace→log workflow for diagnosing a latency spike.

## Troubleshooting

- **Trace split into fragments** — propagation broken. *Fix:* extract/inject trace context every
  hop; check async boundaries.
- **No traces at all** — not instrumented/exporting. *Fix:* OTel SDK/agent + exporter endpoint.
- **Missing the slow/error traces** — uniform head sampling. *Fix:* tail sampling; keep
  errors/slow at 100%.
- **Tracing overhead/cost too high** — sampling 100%. *Fix:* sample successes; collector batching.
- **Can't link trace to logs** — different IDs. *Fix:* use the same trace_id in logs.
- **Spans lack useful detail** — no attributes. *Fix:* add meaningful span attributes (ids, sizes,
  outcomes).

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Justify briefly.

1. What are a span and a trace?
2. How are spans linked into one trace across services?
3. What is context propagation, and what breaks it?
4. What is OpenTelemetry, and auto vs manual instrumentation?
5. What does the OTel Collector do?
6. Compare head and tail sampling.
7. Which traces must you always keep?
8. How do traces fit the metric→trace→log workflow?
9. **Practical:** read a waterfall and find the bottleneck.
10. **Practical:** design a sampling strategy that keeps error/slow traces.

## Solutions & validation

1. A **span** = one timed unit of work; a **trace** = the tree of spans for one request (shared
   trace ID).
2. Via **context propagation** — passing trace_id/parent in headers so spans share a trace.
3. Extracting/injecting trace context across hops; a service not forwarding the header splits the
   trace.
4. The vendor-neutral standard; **auto** instruments common ops automatically, **manual** adds
   custom spans for business logic.
5. Receives/processes/batches/exports telemetry to backends (decoupling apps from vendors).
6. Head decides at start (simple, may miss outliers); tail decides after completion (keeps errors/
   slow).
7. **Error and high-latency** traces (always retain).
8. Metric **detects** (p99 spike) → trace **localizes** the slow span → logs **explain** it (same
   ID).
9. **Validation:** database span = 320/360ms → optimize the query/index/cache (see lab).
10. **Validation:** tail sampling, 100% errors+slow, ~1% successes.

> [!TIP]
> Tracing is the **localize** pillar: it follows one request across every service so you see exactly
> **where time went and what failed** — impossible with metrics/logs alone in a distributed system.
> Instrument with **OpenTelemetry** (auto + a few manual spans), make sure **context propagates**
> through every hop, **sample to keep the interesting traces** (errors/slow via tail sampling), and
> use the **same trace ID** to pivot to logs. Metrics detect, traces localize, logs explain — that's
> the full loop.

## What's next

Next: **Lesson 1705 — Dashboards & Visualization.** Turning telemetry into insight: building
effective dashboards (Grafana), choosing visualizations, the golden signals, avoiding dashboard
sprawl, and designing views that answer real operational questions at a glance.
