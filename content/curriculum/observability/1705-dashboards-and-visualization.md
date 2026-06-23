---
title: "Observability — Dashboards & Visualization"
slug: "observability-dashboards-and-visualization"
track: "observability"
trackName: "Monitoring, Logging & Observability"
module: "Observability in Practice"
order: 1705
level: "Intermediate"
difficulty: "Intermediate"
distribution: "Cross-platform"
category: "DevOps"
tags: [observability, dashboards, grafana, golden-signals, visualization]
cover: "/covers/curriculum/observability.svg"
estMinutes: 55
status: "published"
summary: "Turning telemetry into insight: building effective dashboards with Grafana, choosing the right visualization, the four golden signals, designing views that answer real operational questions, avoiding dashboard sprawl, and dashboards-as-code for reproducibility."
seoTitle: "Observability 5: Dashboards & Visualization (Grafana, golden signals)"
seoDescription: "Effective dashboards: Grafana, choosing visualizations, the four golden signals, dashboard design principles, avoiding sprawl, and dashboards-as-code. Hands-on lab and assessment."
---

Collecting telemetry is only useful if you can **see and reason** about it. **Dashboards** turn
metrics (and logs/traces) into visual insight — but most dashboards are bad: cluttered, vanity
metrics, no story, impossible to read during an incident. This lesson covers building **effective
dashboards** with **Grafana**, choosing the **right visualization** for each data type, the **four
golden signals** that belong on every service dashboard, **design principles** (answer a question,
avoid sprawl), and **dashboards-as-code** for reproducibility.

## Learning objectives

By the end of this lesson you will be able to:

- Build dashboards in **Grafana** connected to data sources.
- Choose the **right visualization** for each metric type.
- Apply the **four golden signals** to a service dashboard.
- Design dashboards that **answer questions** and avoid sprawl.
- Manage **dashboards-as-code** and template variables.

## Part 1 — Grafana and data sources

**Grafana** is the standard open-source visualization layer — it connects to many **data sources**
(Prometheus, Loki, Tempo, cloud, SQL) and renders panels:

```text
   Prometheus (metrics) ┐
   Loki (logs)          ├→ GRAFANA → dashboards (panels) + alerts + exploration
   Tempo (traces)       ┘
```

A **dashboard** is a set of **panels**, each running a query (e.g. PromQL) against a data source and
rendering a visualization. Grafana also unifies the pillars: a panel can link a metric anomaly to
logs (Loki) and traces (Tempo) for the same time range — the **correlation** from earlier lessons,
made visual. You point Grafana at your data sources and build panels with the queries you learned
(`rate()`, `histogram_quantile`, etc.).

## Part 2 — Choosing the right visualization

Match the chart to the data and the question:

```text
TIME SERIES (line graph)   trends over time — request rate, latency, CPU — THE workhorse
STAT / SINGLE VALUE         one current number — uptime, current error %, total today
GAUGE                       a value against a threshold — SLO budget, disk % used
BAR / HISTOGRAM             distributions / comparisons across categories
HEATMAP                     latency distribution over time (great for histograms/percentiles)
TABLE                       discrete items — top-N slow endpoints, current alerts, log rows
LOGS panel                  recent log lines (filtered) for the selected time range
```

The most common mistake is using the wrong type — a pie chart for time-series data, or a table when
a trend line tells the story. **Line graphs for trends, stats for current values, heatmaps for
distributions, tables for lists.** Pick the visualization that makes the **answer** obvious at a
glance.

## Part 3 — The four golden signals

Google's SRE book defines the **four golden signals** — the metrics that matter most for any
user-facing service (a superset/cousin of RED):

```text
LATENCY      how long requests take (and separate SUCCESSFUL vs FAILED latency!)
TRAFFIC      how much demand (requests/sec, transactions/sec)
ERRORS       rate of failed requests (explicit 5xx, and implicit wrong-but-200)
SATURATION   how "full" the service is (resource closest to its limit — the constraint)
```

Every service dashboard should prominently show these four. They answer "**is this service healthy
and is it about to fall over?**" from the user's perspective. Note: measure **failed** request
latency separately — a fast 500 can hide a real problem, and slow errors vs fast errors mean
different things.

> [!TIP]
> Start every service dashboard with the **four golden signals** (latency, traffic, errors,
> saturation) — they're the few signals that actually predict user pain, and they fit on one
> screen. Resist adding every available metric "just in case": a dashboard with 50 panels is
> unreadable during the incident when you need it most. If a panel doesn't help you make a
> **decision**, it's clutter. Latency + traffic + errors + saturation, clearly laid out, beats a
> wall of vanity graphs every time.

## Part 4 — Dashboard design principles

```text
□ Each dashboard ANSWERS A QUESTION ("is service X healthy?" "what's the user experience?")
□ Most important panels TOP-LEFT (we read top-down, left-right) — golden signals first
□ Consistent layout/units/colors; label axes; show units (ms, %, req/s)
□ Use red/yellow/green + thresholds so "bad" is obvious at a glance (during an incident, fast!)
□ TIME RANGE + auto-refresh appropriate to use (incident: short range, fast refresh)
□ Avoid SPRAWL: a few curated dashboards > hundreds of stale ones nobody trusts
□ AUDIENCE: exec/overview vs on-call/debug dashboards differ in detail
```

Two failure modes: the **vanity dashboard** (pretty, lots of graphs, answers nothing) and **sprawl**
(hundreds of auto-generated dashboards, all stale, nobody knows which is real). The cure for both is
**intent**: each dashboard should answer a specific operational question, lead with the golden
signals, and use color/thresholds so problems jump out. Design for the **stressed on-call engineer at
3 a.m.**, not a demo.

## Part 5 — Templating and dashboards-as-code

```text
TEMPLATE VARIABLES   make dashboards reusable across services/environments/instances
   $service, $environment, $instance dropdowns → one dashboard works for ALL services
   (queries use the variable: rate(http_requests_total{service="$service"}[5m]))
DASHBOARDS AS CODE   store dashboard JSON in Git; provision via Grafana provisioning / Terraform
   → versioned, reviewed, reproducible (not click-built and lost) — IaC for dashboards
```

**Template variables** turn one well-designed dashboard into a reusable template (pick the service/
env from a dropdown) — instead of copy-pasting a dashboard per service. **Dashboards-as-code** (JSON
in Git, provisioned automatically) applies everything you learned about IaC/GitOps to dashboards:
versioned, reviewed, reproducible, no "someone deleted the prod dashboard" disasters. Generate
standard service dashboards from a template so every new service gets golden-signal monitoring for
free.

## Hands-on lab

```bash
# Run Grafana + Prometheus and build a golden-signals dashboard.
cat > prometheus.yml <<'EOF'
global: { scrape_interval: 5s }
scrape_configs:
  - job_name: 'prometheus'
    static_configs: [{ targets: ['localhost:9090'] }]
EOF
docker network create obs 2>/dev/null
docker run -d --name prom --network obs -p 9090:9090 \
  -v "$PWD/prometheus.yml:/etc/prometheus/prometheus.yml" prom/prometheus
docker run -d --name grafana --network obs -p 3000:3000 grafana/grafana
echo "Grafana: http://localhost:3000 (admin/admin). Add Prometheus data source: http://prom:9090"

# 1. In Grafana, add the Prometheus data source, then build panels for golden-ish signals:
cat <<'EOF'
TRAFFIC  (time series):  sum(rate(prometheus_http_requests_total[1m]))
ERRORS   (time series):  sum(rate(prometheus_http_requests_total{code=~"5.."}[1m]))
LATENCY  (heatmap/p99):  histogram_quantile(0.99, sum by (le)(rate(prometheus_http_request_duration_seconds_bucket[5m])))
SATURATION (stat/gauge): go_goroutines   (a proxy for "how busy")
EOF

# 2. Add a TEMPLATE VARIABLE $job (Dashboard settings → Variables → query label_values(job))
#    then use {job="$job"} in queries → one dashboard, switchable per job.

# 3. Dashboards-as-code: export the dashboard JSON (Share → Export) and commit it to Git.
#    Provision it back via /etc/grafana/provisioning/dashboards/*.yaml

# cleanup
docker rm -f prom grafana; docker network rm obs
```

```text
4. DESIGN critique — given a dashboard with 40 panels including a pie chart of CPU over time,
   list three problems and how you'd fix them (wrong viz, sprawl, no golden signals up top).
```

## Exercises

1. Connect Grafana to a data source and build a time-series panel from a PromQL query.
2. Match five data/questions to the right visualization type.
3. Build a service dashboard featuring the four golden signals; explain each panel.
4. Critique a cluttered dashboard and redesign it to answer one question.
5. Add a template variable so one dashboard serves multiple services.
6. Export a dashboard as JSON and describe how dashboards-as-code helps.

## Troubleshooting

- **Unreadable dashboard during incident** — sprawl/clutter. *Fix:* golden signals top-left; remove
  non-decision panels.
- **Wrong chart type** — e.g. pie for time-series. *Fix:* line for trends, heatmap for
  distributions, stat for current.
- **Dashboard per service copy-pasted** — *Fix:* template variables; one reusable dashboard.
- **Dashboard lost/changed, no history** — click-built. *Fix:* dashboards-as-code (JSON in Git,
  provisioned).
- **Averages hide problems** — *Fix:* show p95/p99 (histograms), not just mean latency.
- **No units/thresholds** — ambiguous. *Fix:* label units; color thresholds so "bad" is obvious.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Justify briefly.

1. What is Grafana, and how do data sources fit?
2. Match three visualizations to the data they suit.
3. Name the four golden signals and what each tells you.
4. Why measure failed-request latency separately?
5. What question should a dashboard answer, and where do key panels go?
6. What are the two common dashboard failure modes?
7. What do template variables enable?
8. What is dashboards-as-code and why use it?
9. **Practical:** build a golden-signals panel set in Grafana.
10. **Practical:** add a template variable to make a dashboard reusable.

## Solutions & validation

1. A visualization layer; data sources (Prometheus/Loki/Tempo/...) feed its panels.
2. Line=trends, heatmap=distributions over time, stat=current value, table=lists (any three).
3. Latency, traffic, errors, saturation — user-facing health + nearness to limits.
4. A fast error or slow error mislead if mixed with success latency; separate them.
5. A specific operational question; most important panels **top-left** (golden signals).
6. Vanity (pretty, answers nothing) and sprawl (many stale dashboards).
7. One dashboard reused across services/environments via dropdowns ($service, etc.).
8. Dashboard JSON in Git, provisioned automatically — versioned, reviewed, reproducible.
9. **Validation:** traffic/errors/latency/saturation panels built (see lab).
10. **Validation:** `$job` variable switches the dashboard's scope.

> [!TIP]
> A great dashboard **answers one question fast**: lead with the **four golden signals** (latency,
> traffic, errors, saturation), pick the **right visualization** (line for trends, heatmap for
> distributions), use color/thresholds so problems pop, and keep it lean. Make dashboards
> **reusable with template variables** and **reproducible as code in Git**. Design for the on-call
> engineer mid-incident, not the demo — clarity under stress is the whole point.

## What's next

Next: **Lesson 1706 — Alerting & On-Call.** Turning signals into action: alerting on symptoms not
causes, good vs noisy alerts, alert fatigue, severity and routing, runbooks, escalation and on-call
practices, and designing alerts people actually trust and act on.
