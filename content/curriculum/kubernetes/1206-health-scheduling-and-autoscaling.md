---
title: "Kubernetes — Health, Scheduling & Autoscaling"
slug: "kubernetes-health-scheduling-and-autoscaling"
track: "kubernetes"
trackName: "Kubernetes"
module: "Kubernetes Operations"
order: 1206
level: "Advanced"
difficulty: "Advanced"
distribution: "Cross-platform"
category: "Containers & Docker"
tags: [kubernetes, probes, scheduling, autoscaling, hpa, affinity, resources]
cover: "/covers/curriculum/kubernetes.svg"
estMinutes: 65
status: "published"
summary: "Make workloads resilient and efficient: liveness/readiness/startup probes, resource requests/limits and QoS classes, how the scheduler places Pods (nodeSelector, affinity, taints/tolerations), and the Horizontal Pod Autoscaler for scaling on demand."
seoTitle: "Kubernetes 6: Probes, Scheduling & Autoscaling (HPA, affinity)"
seoDescription: "Kubernetes resilience: liveness/readiness/startup probes, requests/limits and QoS, scheduler placement (affinity, taints/tolerations), and the HPA. Hands-on lab + assessment."
---

A workload that merely *runs* isn't enough — it must be **healthy**, **placed well**, and
able to **scale**. This lesson covers the three pillars: **probes** (liveness/readiness/
startup) that tell Kubernetes whether to restart a container or send it traffic; **resource
requests/limits and QoS** that drive scheduling and protect nodes; **scheduling controls**
(nodeSelector, affinity, taints/tolerations) that decide *where* Pods land; and the
**Horizontal Pod Autoscaler** that adds/removes replicas based on load. Together they turn
"it deploys" into "it stays up under real conditions."

## Learning objectives

By the end of this lesson you will be able to:

- Configure **liveness**, **readiness**, and **startup** probes correctly.
- Set **requests/limits** and explain the **QoS classes** and OOM/eviction behavior.
- Influence placement with **nodeSelector**, **affinity/anti-affinity**, and **taints/
  tolerations**.
- Configure a **Horizontal Pod Autoscaler (HPA)**.
- Combine these for resilient, efficient workloads.

## Part 1 — Health probes

The kubelet runs three kinds of probe; each answers a different question:

```yaml
spec:
  containers:
    - name: app
      image: myapp:1.0
      readinessProbe:                 # "Ready for TRAFFIC?"  fail -> removed from Service endpoints
        httpGet: { path: /healthz, port: 8080 }
        initialDelaySeconds: 5
        periodSeconds: 10
      livenessProbe:                  # "Still ALIVE?"  fail -> kubelet RESTARTS the container
        httpGet: { path: /livez, port: 8080 }
        periodSeconds: 10
        failureThreshold: 3
      startupProbe:                   # "Done STARTING?"  protects slow starters from liveness
        httpGet: { path: /livez, port: 8080 }
        failureThreshold: 30
        periodSeconds: 5
```

- **readiness** — should this Pod receive traffic *right now*? Failing readiness removes it
  from Service **endpoints** (no traffic) but does **not** restart it. Essential for
  zero-downtime rollouts and load shedding.
- **liveness** — is the container wedged/deadlocked? Failing liveness makes the kubelet
  **restart** it.
- **startup** — for slow-booting apps; it **gates** liveness until startup succeeds, so a
  long boot isn't mistaken for a hang.

Probe types: `httpGet`, `tcpSocket`, `exec` (run a command), `grpc`.

> [!IMPORTANT]
> **Readiness and liveness are different and frequently confused.** Readiness failing =
> "don't send traffic" (no restart) — use it for warmup, dependency checks, and graceful
> rollouts. Liveness failing = "**restart me**" — use it *only* for unrecoverable hangs. A
> common outage pattern: a too-aggressive **liveness** probe (or one that checks a
> dependency) restarts healthy Pods in a loop. Keep liveness simple/local, put dependency
> and warmup logic in **readiness**, and add a **startup probe** for slow boots.

## Part 2 — Requests, limits, and QoS

Every container should declare what it needs and its ceiling:

```yaml
resources:
  requests: { cpu: 100m, memory: 128Mi }   # GUARANTEED; used by the scheduler to place the Pod
  limits:   { cpu: 500m, memory: 256Mi }   # CEILING; enforced at runtime
```

- **requests** — what the Pod is *guaranteed*; the **scheduler** uses requests to decide
  which node has room. Under-set them and you'll oversubscribe nodes.
- **limits** — the hard cap. **Memory** over the limit → the container is **OOM-killed**
  (exit 137). **CPU** over the limit → **throttled** (not killed).

**QoS classes** (derived from requests/limits) determine **eviction order** when a node is
under pressure:

```text
Guaranteed   requests == limits for all resources       -> evicted LAST  (most protected)
Burstable    requests < limits (or only some set)        -> evicted in the middle
BestEffort   no requests/limits at all                   -> evicted FIRST (least protected)
```

> [!TIP]
> **Always set requests** (for correct scheduling) and **memory limits** (to contain leaks).
> Be careful with **CPU limits** — they cause **throttling** that can hurt latency-sensitive
> apps; many teams set CPU *requests* but leave CPU *limits* generous or unset. Aim for
> **Guaranteed** QoS (requests == limits) on critical workloads so they're evicted last under
> node pressure. No requests/limits = **BestEffort** = first to be killed — never do that for
> anything important.

## Part 3 — Scheduling: getting Pods onto the right nodes

The scheduler places Pods on nodes with enough requested resources — you can **constrain or
spread** placement:

```yaml
# Simple: only schedule onto nodes with a label
nodeSelector: { disktype: ssd }

# Affinity: prefer/require nodes; spread replicas across nodes/zones
affinity:
  podAntiAffinity:                       # don't put two replicas on the same node (HA)
    requiredDuringSchedulingIgnoredDuringExecution:
      - labelSelector: { matchLabels: { app: web } }
        topologyKey: kubernetes.io/hostname
```

- **nodeSelector** — simplest: match node labels.
- **node affinity** — richer required/preferred node rules.
- **pod (anti-)affinity** — co-locate or **spread** Pods relative to other Pods (e.g.
  anti-affinity to keep replicas on different nodes for HA).
- **Taints & tolerations** — a node **taint** repels Pods unless they have a matching
  **toleration**; used to reserve nodes (GPU, system, dedicated tenants).

```bash
kubectl taint nodes node1 gpu=true:NoSchedule        # only Pods tolerating gpu=true land here
# Pod must declare: tolerations: [{ key: gpu, value: "true", effect: NoSchedule }]
```

Also: **topologySpreadConstraints** to evenly spread Pods across zones/nodes — important for
real availability.

## Part 4 — Horizontal Pod Autoscaler

The **HPA** automatically changes a Deployment's **replica count** based on metrics
(commonly CPU, or custom/memory metrics):

```bash
# Requires metrics-server installed (kubectl top must work)
kubectl autoscale deployment web --cpu-percent=70 --min=2 --max=10
kubectl get hpa
```

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata: { name: web }
spec:
  scaleTargetRef: { apiVersion: apps/v1, kind: Deployment, name: web }
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource: { name: cpu, target: { type: Utilization, averageUtilization: 70 } }
```

The HPA needs **CPU requests set** (it scales on % of *requested* CPU) and a **metrics-
server**. It scales **out** when average utilization exceeds the target and **in** when it
drops (with stabilization to avoid flapping). Related: **VPA** (right-sizes requests/limits)
and the **Cluster Autoscaler** (adds/removes *nodes* when Pods can't be scheduled) — HPA
scales Pods, Cluster Autoscaler scales nodes.

> [!TIP]
> The HPA scales on a **percentage of the CPU *request***, so an HPA without CPU requests
> does nothing useful — set requests first and install **metrics-server**. Use **HPA** for
> Pods + **Cluster Autoscaler** for nodes together: HPA adds replicas, and if the cluster
> runs out of room, the Cluster Autoscaler adds nodes. Set sane `min`/`max` and don't scale
> on a metric your app can't actually shed load by adding replicas (e.g. a single-writer DB).

## Hands-on lab

```bash
# 1. Deployment with probes + resources
cat > app.yaml <<'EOF'
apiVersion: apps/v1
kind: Deployment
metadata: { name: web, labels: { app: web } }
spec:
  replicas: 2
  selector: { matchLabels: { app: web } }
  template:
    metadata: { labels: { app: web } }
    spec:
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                labelSelector: { matchLabels: { app: web } }
                topologyKey: kubernetes.io/hostname
      containers:
        - name: nginx
          image: nginx:1.27
          ports: [{ containerPort: 80 }]
          readinessProbe: { httpGet: { path: /, port: 80 }, initialDelaySeconds: 3, periodSeconds: 5 }
          livenessProbe:  { httpGet: { path: /, port: 80 }, periodSeconds: 10, failureThreshold: 3 }
          resources:
            requests: { cpu: 100m, memory: 64Mi }
            limits:   { cpu: 250m, memory: 128Mi }
EOF
kubectl apply -f app.yaml
kubectl get pods -l app=web -o wide          # anti-affinity tries to spread across nodes
kubectl describe pod -l app=web | grep -A3 -i qos   # QoS class (Burstable here)

# 2. Watch readiness gate traffic: break readiness and see it leave endpoints
kubectl exec deploy/web -- sh -c 'mv /usr/share/nginx/html/index.html /tmp/ 2>/dev/null || true'
kubectl get endpointslices -l kubernetes.io/service-name=web 2>/dev/null || true
kubectl describe pod -l app=web | grep -i -A2 readiness

# 3. HPA (needs metrics-server; kubectl top must work)
kubectl autoscale deployment web --cpu-percent=70 --min=2 --max=6
kubectl get hpa web
# generate load (in another terminal) to watch it scale:
# kubectl run load --rm -it --image=busybox -- sh -c 'while true; do wget -q -O- http://web; done'

# 4. Taints/tolerations demo (single-node clusters: observe NoSchedule)
kubectl get nodes
# kubectl taint nodes <node> dedicated=team-a:NoSchedule   # then only tolerating pods schedule

# cleanup
kubectl delete -f app.yaml; kubectl delete hpa web --ignore-not-found
```

## Exercises

1. Explain the difference between readiness and liveness probes and give a correct use for
   each.
2. Add a startup probe to a slow-starting app and explain what problem it prevents.
3. Set requests/limits to produce a Guaranteed Pod and a Burstable Pod; show the QoS class.
4. Explain what happens when a container exceeds its memory limit vs its CPU limit.
5. Use pod anti-affinity to spread replicas across nodes; verify placement.
6. Configure an HPA (min/max/target) and explain why CPU requests are required.

## Troubleshooting

- **Pods restart in a loop** — bad/aggressive liveness probe (or it checks a dependency).
  *Fix:* simplify liveness; move dependency checks to readiness; add startup probe.
- **Traffic hits a not-ready Pod** — no readiness probe. *Fix:* add readiness; rollouts wait
  for Ready.
- **Slow app keeps getting killed at boot** — liveness fires during startup. *Fix:* startup
  probe.
- **Pod `Pending` / not scheduled** — requests too big, taints, or affinity unsatisfiable.
  *Fix:* `describe` Events; adjust requests/affinity/tolerations.
- **HPA shows `<unknown>` targets** — no metrics-server / no CPU requests. *Fix:* install
  metrics-server; set requests.
- **App OOM-killed (137)** — memory limit too low/leak. *Fix:* raise limit or fix the leak;
  check QoS/eviction.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Justify briefly.

1. What does a failing readiness probe do? A failing liveness probe?
2. When do you need a startup probe?
3. What does the scheduler use requests for? What enforces limits?
4. What happens at a memory limit vs a CPU limit?
5. Name the three QoS classes and their eviction order.
6. What's the difference between node affinity and pod anti-affinity?
7. What do taints and tolerations accomplish together?
8. What does the HPA scale on, and what must be configured for it to work?
9. **Practical:** deploy with probes + resources and show the QoS class.
10. **Practical:** configure an HPA with min/max and a CPU target.

## Solutions & validation

1. Readiness fail → removed from **Service endpoints** (no traffic, no restart); liveness
   fail → **kubelet restarts** the container.
2. For **slow-starting** apps — it gates liveness so a long boot isn't treated as a hang.
3. Scheduler uses **requests** to place Pods; **limits** are enforced at runtime by the
   kubelet/cgroups.
4. Memory over limit → **OOM-killed** (137); CPU over limit → **throttled**.
5. **Guaranteed** (evicted last), **Burstable** (middle), **BestEffort** (evicted first).
6. Node affinity targets **node labels**; pod anti-affinity spreads/avoids relative to
   **other Pods**.
7. Reserve/dedicate nodes — taints repel Pods unless they carry a matching toleration.
8. **% of requested CPU** (or custom metrics); needs **CPU requests** + **metrics-server**.
9. **Validation:** `describe pod` shows QoS class; probes listed (see lab).
10. **Validation:** `kubectl get hpa` shows min/max/target.

> [!TIP]
> Resilience = **probes done right** (readiness for traffic, liveness only for hangs, startup
> for slow boots), **requests/limits** for correct scheduling and protection (aim Guaranteed
> for critical apps), **spread** with anti-affinity/topology constraints, and **HPA + Cluster
> Autoscaler** for elasticity. These are the settings that separate a demo Deployment from a
> production-grade one.

## What's next

Next: **Lesson 1207 — Security & RBAC.** Locking down the cluster: authentication and
authorization with RBAC (Roles, RoleBindings, ServiceAccounts), namespaces as boundaries,
NetworkPolicies, Pod security standards, and the least-privilege principles from the security
track applied to Kubernetes.
