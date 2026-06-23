---
title: "CI/CD — Deployment Strategies"
slug: "cicd-deployment-strategies"
track: "cicd"
trackName: "CI/CD Pipelines"
module: "Delivery & Operations"
order: 1305
level: "Advanced"
difficulty: "Advanced"
distribution: "Cross-platform"
category: "DevOps"
tags: [cicd, deployment, blue-green, canary, rollback, feature-flags]
cover: "/covers/curriculum/cicd.svg"
estMinutes: 60
status: "published"
summary: "Getting the artifact to production safely: rolling, blue-green, and canary deployments, feature flags to decouple deploy from release, automated rollback, environment promotion (dev → staging → prod), and choosing the right strategy for your risk and infrastructure."
seoTitle: "CI/CD 5: Deployment Strategies (rolling, blue-green, canary)"
seoDescription: "Deployment strategies: rolling, blue-green, canary, feature flags, automated rollback, and environment promotion. Hands-on lab and assessment for safe releases."
---

You have a tested, traceable artifact — now get it to production **without downtime or
drama**. The deployment strategy determines how a new version replaces the old, how risk is
contained, and how fast you can recover if it's bad. This lesson covers the main strategies —
**rolling**, **blue-green**, and **canary** — plus **feature flags** (decoupling deploy from
release), **automated rollback**, and **environment promotion**. Choosing well turns releases
from heart-stopping events into routine, reversible operations.

## Learning objectives

By the end of this lesson you will be able to:

- Compare **rolling**, **blue-green**, and **canary** deployments and their trade-offs.
- Use **feature flags** to decouple **deploy** from **release**.
- Implement **automated rollback** triggered by health/metrics.
- Promote an artifact through **dev → staging → prod**.
- Choose a strategy based on **risk, cost, and infrastructure**.

## Part 1 — Rolling deployment

Replace instances **gradually**, a few at a time, until all run the new version (the
Kubernetes Deployment default):

```text
[v1][v1][v1][v1]  →  [v2][v1][v1][v1]  →  [v2][v2][v1][v1]  →  [v2][v2][v2][v2]
```

- **Pros**: no extra infrastructure, zero downtime, built into K8s.
- **Cons**: v1 and v2 run **simultaneously** (must be compatible); rollback is another rolling
  update (not instant); a bad version reaches some users before you notice.

Best for: most stateless services where versions are backward-compatible. Pair with
**readiness probes** and `maxUnavailable: 0` (Lesson: K8s health) for true zero-downtime.

## Part 2 — Blue-green deployment

Run **two identical environments** — **blue** (current) and **green** (new). Deploy to green,
test it, then **switch all traffic** at once:

```text
   router ──► BLUE (v1, live)        deploy v2 to GREEN, test it
   router ──► GREEN (v2, live)       flip the router → instant cutover
                                     (BLUE kept warm for instant rollback)
```

- **Pros**: **instant cutover**, **instant rollback** (flip back to blue), test green fully
  before going live, no mixed versions in front of users.
- **Cons**: **double the infrastructure** (two full environments), database/schema changes
  are tricky (both must work with the shared DB), more expensive.

Best for: releases where you want a clean cutover and fast rollback and can afford double
capacity briefly.

## Part 3 — Canary deployment

Release to a **small subset** of users/traffic first, watch metrics, then **gradually
increase** if healthy:

```text
   5% traffic → v2 (canary), 95% → v1     watch error rate / latency / business metrics
   healthy?  → 25% → 50% → 100%            unhealthy? → route back to v1 (rollback)
```

- **Pros**: **limits blast radius** (a bad release hits 5%, not 100%), real-production
  validation, data-driven promotion.
- **Cons**: needs **traffic-shaping** + good **monitoring/automation**; slower; mixed versions
  (compatibility again).

Best for: high-traffic, high-risk services where you want to **prove** a release in prod
before full rollout. Tools: Argo Rollouts, Flagger, service meshes (Istio/Linkerd).

> [!IMPORTANT]
> The strategies trade **safety vs cost vs complexity**. **Rolling** is cheap and default but
> exposes all users gradually with slow rollback. **Blue-green** gives instant cutover/
> rollback at **double the cost**. **Canary** gives the **smallest blast radius** and data-
> driven confidence but needs traffic control + strong monitoring. Pick by **risk and
> infrastructure**: routine low-risk service → rolling; critical user-facing release → canary;
> need a clean, instantly reversible cutover → blue-green.

## Part 4 — Feature flags: deploy ≠ release

A powerful idea: **deploying code** and **releasing a feature** can be **separate events**.
Wrap new functionality in a **feature flag** so it's shipped but **off**, then turn it on
independently:

```text
deploy v2 (flag OFF for everyone)   → code is in prod, dormant, fully tested in place
turn flag ON for 1% / internal users → progressive rollout, controlled by config, not deploy
problem? → turn the flag OFF instantly  (no redeploy, no rollback)
```

Benefits: **decouple risky features from deploys**, do **percentage rollouts** and A/B tests,
enable **trunk-based development** (merge incomplete features behind a flag), and get an
**instant kill switch** without a deploy. (Tools: LaunchDarkly, Unleash, or a simple config-
driven flag.) Caveat: flags are **tech debt** — remove them once a feature is fully rolled
out.

## Part 5 — Rollback and environment promotion

**Automated rollback** is the safety net: if post-deploy health checks or key metrics
(error rate, latency) breach thresholds, **automatically revert** to the last good version:

```text
deploy v2 → run smoke tests + watch metrics for N minutes →
   healthy?  keep v2
   degraded? AUTO-ROLLBACK to v1 (redeploy previous artifact / flip blue-green / shift canary back)
```

**Environment promotion** moves the **same artifact** through stages, gaining confidence:

```text
   build once → DEV (auto) → STAGING (auto + integration tests) → PROD (approval / auto)
   the SAME image digest flows through; config differs per env (12-factor)
```

Each environment should mirror prod as closely as practical. Promotion + "build once" means
prod runs exactly what staging validated.

> [!TIP]
> Make **rollback faster and more automatic than diagnosis** — when a deploy looks bad,
> revert first, investigate after. Tie rollback to **objective health signals** (smoke tests,
> error-rate/latency SLOs) so it triggers without a human in the loop. Combined with **feature
> flags** (instant off-switch) and **promotion of one artifact**, you make production changes
> boring and reversible — the goal of all deployment strategy.

## Hands-on lab

```bash
# Simulate the strategies with a local Kubernetes cluster (kind/minikube)
kubectl create deployment app --image=nginx:1.26 --replicas=4
kubectl expose deployment app --port=80

# 1. ROLLING update (default) — watch gradual replacement, then rollback
kubectl set image deployment/app nginx=nginx:1.27
kubectl rollout status deployment/app
kubectl rollout history deployment/app
kubectl rollout undo deployment/app          # revert (another rolling update)

# 2. BLUE-GREEN — two deployments, switch the Service selector
kubectl create deployment app-blue  --image=nginx:1.26 && kubectl label deploy app-blue  color=blue --overwrite
kubectl create deployment app-green --image=nginx:1.27 && kubectl label deploy app-green color=green --overwrite
kubectl patch svc app -p '{"spec":{"selector":{"app":"app","color":"blue"}}}'  2>/dev/null || true
# ...test green out-of-band, then flip ALL traffic instantly:
kubectl patch svc app -p '{"spec":{"selector":{"color":"green"}}}'             # instant cutover
# rollback = flip back to blue:
kubectl patch svc app -p '{"spec":{"selector":{"color":"blue"}}}'

# 3. CANARY — mix replicas behind one Service (simple weight by replica count)
kubectl scale deployment app-green --replicas=1   # ~ small % canary
kubectl scale deployment app-blue  --replicas=9   # ~ 90% stable
# observe; if healthy, shift replicas green-up/blue-down; if not, scale green to 0

# 4. Feature-flag concept (config, not redeploy)
kubectl create configmap flags --from-literal=NEW_CHECKOUT=off
# turn it on without a deploy:
kubectl create configmap flags --from-literal=NEW_CHECKOUT=on --dry-run=client -o yaml | kubectl apply -f -

# cleanup
kubectl delete deploy app app-blue app-green; kubectl delete svc app; kubectl delete cm flags
```

## Exercises

1. Compare rolling, blue-green, and canary on downtime, rollback speed, cost, and blast
   radius.
2. Perform a rolling update and rollback; explain why rollback isn't instant.
3. Implement a blue-green switch via a Service selector; show instant cutover and rollback.
4. Set up a simple canary (replica-weighted) and describe what metrics gate promotion.
5. Explain how feature flags decouple deploy from release, with a concrete example.
6. Design an environment-promotion flow for one artifact and where approvals/tests fit.

## Troubleshooting

- **Bad version hit all users** — rolling with slow detection. *Fix:* canary + automated
  metric-based rollback.
- **Blue-green DB breakage** — schema incompatible across colors. *Fix:* backward-compatible
  migrations (expand/contract).
- **Canary "looks fine" but isn't** — wrong/weak metrics. *Fix:* watch error rate, latency,
  and business KPIs; enough traffic/time.
- **Rollback too slow** — manual, rebuild needed. *Fix:* keep previous artifact; one-action
  revert; flags for instant off.
- **Mixed-version errors** — incompatible v1/v2. *Fix:* backward/forward compatibility; flags;
  blue-green for clean cutover.
- **Prod ≠ staging** — drift. *Fix:* same artifact + parity environments + config via env.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Justify briefly.

1. Describe a rolling deployment and its main downside.
2. How does blue-green enable instant rollback, and what's the cost?
3. What problem does canary specifically solve?
4. Which strategies run two versions simultaneously (compatibility matters)?
5. How do feature flags decouple deploy from release?
6. What should trigger an automated rollback?
7. What does "promote one artifact" mean across environments?
8. How would you pick a strategy for a critical user-facing release?
9. **Practical:** do a blue-green switch via a Service selector.
10. **Practical:** set up a replica-weighted canary and state its promotion gate.

## Solutions & validation

1. Gradually replace instances; downside: slow rollback + v1/v2 coexist + bad version reaches
   some users.
2. Keep blue warm and flip the router back; cost is **double infrastructure**.
3. Limits **blast radius** — validates a release on a small % of real traffic before full
   rollout.
4. **Rolling** and **canary** (blue-green cuts over all at once).
5. Ship code **off** behind a flag, then enable independently (and kill instantly) without a
   deploy.
6. Failing smoke tests or breached error-rate/latency thresholds post-deploy.
7. Deploy the **same image digest** through dev→staging→prod (config differs), so prod runs
   what was tested.
8. Likely **canary** (smallest blast radius + data-driven), with automated rollback.
9. **Validation:** `kubectl patch svc … selector color=green` flips traffic instantly (see
   lab).
10. **Validation:** green=1/blue=9 replicas; gate on healthy error-rate/latency before
    shifting.

> [!TIP]
> There's no single best strategy — match it to **risk and infrastructure**: rolling for
> routine, blue-green for clean reversible cutovers, canary for high-risk validation in prod.
> Layer **feature flags** (deploy ≠ release, instant kill switch) and **automated, metric-
> driven rollback** on top, and promote **one artifact** through parity environments. Done
> right, "deploy to prod" stops being scary.

## What's next

Next: **Lesson 1306 — GitOps & Pipeline Patterns.** The declarative deployment model: Git as
the single source of truth, pull-based reconciliation with Argo CD/Flux, separating CI from
CD, secrets in GitOps, and the patterns that make deployments auditable and self-healing.
