---
title: "Observability — Metrics & Time-Series (Prometheus)"
slug: "observability-metrics-and-time-series"
track: "observability"
trackName: "Monitoring, Logging & Observability"
module: "Observability Foundations"
order: 1702
level: "Intermediate"
difficulty: "Advanced"
distribution: "Cross-platform"
category: "DevOps"
tags: [observability, metrics, prometheus, promql, red-method, use-method]
cover: "/covers/curriculum/observability.svg"
estMinutes: 65
status: "published"
summary: "The metrics pillar in depth with Prometheus: metric types (counter, gauge, histogram, summary), pull-based scraping, labels and cardinality, PromQL fundamentals, and the RED and USE methods for choosing which metrics actually matter for services and resources."
seoTitle: "Observability 2: Metrics & Time-Series (Prometheus, PromQL, RED/USE)"
seoDescription: "Prometheus metrics: counter/gauge/histogram, pull-based scraping, labels/cardinality, PromQL basics, rate(), histograms/quantiles, and the RED and USE methods. Lab + assessment."
---

Metrics are the foundation of monitoring — cheap, aggregatable numbers over time that power
dashboards and alerts. **Prometheus** is the de-facto open-source metrics system, and its model
(pull-based scraping, labeled time-series, PromQL) is the industry standard. This lesson covers the
**metric types** (counter/gauge/histogram), how Prometheus **scrapes** targets, **labels and
cardinality**, **PromQL** fundamentals (especially `rate()` and quantiles), and — most importantly —
the **RED** and **USE** methods that tell you *which* metrics actually matter so you measure
signal, not noise.

## Learning objectives

By the end of this lesson you will be able to:

- Distinguish the **metric types**: counter, gauge, histogram, summary.
- Explain Prometheus's **pull/scrape** model and labeled time-series.
- Write basic **PromQL** (selectors, `rate()`, aggregation, quantiles).
- Manage **cardinality** in labels.
- Apply the **RED** and **USE** methods to choose metrics.

## Part 1 — Metric types

A metric is a **named, labeled time-series** of numbers. Four types:

```text
COUNTER     monotonically increasing (resets to 0 on restart) — for COUNTS/RATES
   http_requests_total, errors_total → you take the RATE of change, not the raw value
GAUGE       goes up AND down — for CURRENT VALUES
   memory_used_bytes, queue_depth, temperature, active_connections
HISTOGRAM   samples observations into buckets — for DISTRIBUTIONS (latency, sizes)
   request_duration_seconds → compute quantiles (p50/p95/p99) across instances
SUMMARY     like histogram but quantiles computed client-side (less aggregatable)
```

The key insight: **counters measure rates, gauges measure levels, histograms measure
distributions.** You never read a counter's raw value (it's just "total since start") — you take
its **`rate()`**. Histograms let you answer "what's my p99 latency?" — the percentile questions
that averages hide.

## Part 2 — Prometheus's pull model

Prometheus **pulls** (scrapes) metrics from targets that expose them over HTTP, on a schedule:

```text
   target app exposes  GET /metrics  (Prometheus text format):
      http_requests_total{method="GET",status="200"} 1027
      http_requests_total{method="GET",status="500"} 12
   Prometheus SCRAPES each target every ~15s, stores the time-series in its TSDB
   SERVICE DISCOVERY finds targets dynamically (Kubernetes pods, cloud instances, files)
```

```yaml
# prometheus.yml (scrape config)
scrape_configs:
  - job_name: 'my-app'
    static_configs:
      - targets: ['app:8080']        # scrape app:8080/metrics
    scrape_interval: 15s
```

**Pull** (vs push) means Prometheus controls timing, can detect when a target is **down** (scrape
fails), and works great with **service discovery** (auto-find Kubernetes pods/cloud instances). Apps
expose `/metrics` via client libraries (or you run **exporters** that translate other systems'
metrics — node_exporter for host metrics, etc.).

## Part 3 — Labels and cardinality

Every time-series is identified by its **name + a set of labels**:

```text
http_requests_total{method="GET", path="/api/orders", status="200", instance="app-1"}
   each unique COMBINATION of label values = a SEPARATE time-series
```

Labels enable powerful slicing (`by status`, `by path`) — but **cardinality** (the count of unique
series) is the #1 Prometheus pitfall:

```text
✓ low cardinality: method (GET/POST...), status (2xx/4xx/5xx), path (bounded routes)
✗ high cardinality: user_id, request_id, email, full URL with IDs, timestamps
   → a label with millions of values = millions of series = OOM / slow / expensive
```

> [!IMPORTANT]
> **Cardinality is the thing that kills Prometheus.** Each unique combination of label values
> creates a separate time-series, so a single **high-cardinality label** (user ID, request ID, raw
> URL) can explode from thousands to millions of series and exhaust memory. Keep metric labels to
> **bounded, low-cardinality** dimensions (method, status code, route *template* not raw path).
> Per-request/per-user detail belongs in **traces and logs**, not metric labels. When Prometheus
> falls over, cardinality is almost always why.

## Part 4 — PromQL fundamentals

PromQL queries the time-series. The essentials:

```promql
# Instant/range selectors
http_requests_total{status="500"}              # current value of matching series
rate(http_requests_total[5m])                  # PER-SECOND rate over 5m (for counters!)

# Aggregation across series
sum(rate(http_requests_total[5m]))                         # total request rate
sum by (status) (rate(http_requests_total[5m]))            # rate grouped by status
sum without (instance) (rate(http_requests_total[5m]))     # drop the instance label

# Error ratio (RED!)
sum(rate(http_requests_total{status=~"5.."}[5m]))
  / sum(rate(http_requests_total[5m]))                     # fraction of 5xx errors

# Latency quantile from a histogram
histogram_quantile(0.99, sum by (le) (rate(request_duration_seconds_bucket[5m])))  # p99
```

The most important function is **`rate()`** — counters only make sense as rates (`rate(...[5m])` =
per-second average over 5 minutes). **`histogram_quantile()`** gives you p95/p99 latency.
Aggregation (`sum/avg/max ... by (label)`) collapses many series into the view you want. These few
patterns cover most real queries.

> [!TIP]
> Learn these PromQL patterns and you can answer most questions: **`rate(counter[5m])`** for rates
> (never graph a raw counter), **`sum by (label)(...)`** to aggregate/group, an **error ratio**
> (5xx rate / total rate), and **`histogram_quantile(0.99, ...)`** for p99 latency. Always wrap
> counters in `rate()` over a window that's a few scrape intervals wide. Averages lie about latency
> — use **histograms + quantiles** to see the tail your slowest users actually feel.

## Part 5 — RED and USE: what to measure

The hard part isn't collecting metrics — it's choosing the **right** ones. Two proven methods:

```text
RED method (for SERVICES / request-driven things):
   Rate        requests per second
   Errors      failed requests per second (or error %)
   Duration    latency distribution (p50/p95/p99)
   → these three tell you if a service is healthy from the USER's perspective

USE method (for RESOURCES / infrastructure):
   Utilization  how busy (CPU%, memory%, disk%)
   Saturation   how much queued/waiting (run-queue, swap, I/O wait)
   Errors       error counts (disk errors, dropped packets)
   → these tell you if a resource is a bottleneck
```

- **RED** for **services** (an API, a microservice) — measures the user-facing health: are requests
  flowing, failing, or slow?
- **USE** for **resources** (a host, disk, network) — is this resource overloaded?

Start every service with **RED metrics** and every host with **USE metrics**; that handful of
signals catches most problems and avoids drowning in thousands of meaningless metrics.

## Hands-on lab

```bash
# Run Prometheus + a target locally with Docker; explore real metrics + PromQL.
mkdir prom-lab && cd prom-lab
cat > prometheus.yml <<'EOF'
global: { scrape_interval: 5s }
scrape_configs:
  - job_name: 'prometheus'
    static_configs: [{ targets: ['localhost:9090'] }]   # Prometheus scrapes ITSELF
EOF
docker run -d --name prom -p 9090:9090 \
  -v "$PWD/prometheus.yml:/etc/prometheus/prometheus.yml" prom/prometheus

# 1. See raw exposed metrics (the /metrics text format)
curl -s localhost:9090/metrics | head -20

# 2. Query via the API (or use the UI at http://localhost:9090)
q() { curl -s "localhost:9090/api/v1/query?query=$1" | python3 -m json.tool | head -25; }
q 'up'                                         # 1 = target is up (pull model detects down!)
q 'rate(prometheus_http_requests_total[1m])'   # request RATE (counter -> rate)
q 'sum%20by%20(code)%20(rate(prometheus_http_requests_total[1m]))'  # grouped by code

# 3. Counter vs gauge: identify each in the output
curl -s localhost:9090/metrics | grep -E "_total |go_goroutines"   # _total=counter; goroutines=gauge

# 4. Cardinality awareness: count series
q 'count(prometheus_http_requests_total)'      # how many label combinations exist

# cleanup
docker rm -f prom
```

```text
5. METHOD exercise — for these, list the RED or USE metrics you'd add:
   a) A REST API service        → RED: ______, ______, ______
   b) A database server (host)  → USE: ______, ______, ______
```

## Exercises

1. Classify five metrics as counter/gauge/histogram and explain why.
2. Explain Prometheus's pull model and one advantage over push.
3. Identify two low- and two high-cardinality labels; explain the risk of the high ones.
4. Write PromQL for: request rate, error ratio, and p99 latency.
5. Apply the RED method to a service and the USE method to a host.
6. Explain why you take `rate()` of a counter instead of reading it directly.

## Troubleshooting

- **Prometheus OOM / slow** — cardinality explosion. *Fix:* remove high-cardinality labels (IDs);
  use route templates.
- **Counter graph looks like a ramp** — graphed raw counter. *Fix:* wrap in `rate(...[5m])`.
- **Target shows `up=0`** — scrape failing. *Fix:* check target `/metrics` reachable; firewall;
  port.
- **Latency average looks fine but users complain** — averages hide the tail. *Fix:* histograms +
  `histogram_quantile` (p99).
- **Too many meaningless metrics** — no method. *Fix:* RED for services, USE for resources; start
  there.
- **Push needed (batch jobs)** — pull doesn't fit short-lived jobs. *Fix:* Pushgateway for batch.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Justify briefly.

1. Differentiate counter, gauge, and histogram.
2. Why do you take the rate of a counter?
3. How does Prometheus collect metrics, and one benefit of pull?
4. What is cardinality and why is it dangerous?
5. Which labels are safe vs unsafe? Give examples.
6. Write PromQL for an error ratio.
7. What does `histogram_quantile` give you?
8. State the RED and USE methods and when to use each.
9. **Practical:** query a request rate and a grouped aggregation.
10. **Practical:** list RED metrics for a service and USE metrics for a host.

## Solutions & validation

1. Counter (monotonic, for rates), gauge (up/down, current value), histogram (distribution/
   quantiles).
2. The raw value is just "total since start"; the **rate** of change is the meaningful signal.
3. **Pull/scrape** over HTTP on a schedule; benefits: detects down targets, works with service
   discovery.
4. Number of unique series (label combos); high cardinality explodes memory/cost.
5. Safe: method, status, route template; unsafe: user_id, request_id, raw URL.
6. `sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))`.
7. A **percentile** (e.g. p99) of a distribution from histogram buckets.
8. RED (Rate/Errors/Duration) for services; USE (Utilization/Saturation/Errors) for resources.
9. **Validation:** `rate(...[1m])` and `sum by (code)(rate(...))` (see lab).
10. **Validation:** RED = req rate, error rate, p99 latency; USE = CPU%, saturation, disk errors.

> [!TIP]
> Metrics done right: pick the correct **type** (counter→rate, gauge→level, histogram→quantiles),
> keep labels **low-cardinality**, query with **`rate()`/`sum by`/`histogram_quantile`**, and
> choose **what** to measure with **RED (services)** and **USE (resources)**. Those methods turn
> "thousands of metrics, no insight" into a handful of signals that actually tell you whether your
> system is healthy from the user's and the machine's perspective.

## What's next

Next: **Lesson 1703 — Logging & Log Management.** The second pillar: structured logging, log levels,
centralized aggregation (the ELK/Loki world), parsing and querying, correlation IDs, retention and
cost, and turning logs from noise into a searchable, useful debugging tool.
