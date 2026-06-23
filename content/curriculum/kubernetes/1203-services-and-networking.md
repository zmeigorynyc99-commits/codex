---
title: "Kubernetes — Services & Networking"
slug: "kubernetes-services-and-networking"
track: "kubernetes"
trackName: "Kubernetes"
module: "Kubernetes Foundations"
order: 1203
level: "Intermediate"
difficulty: "Advanced"
distribution: "Cross-platform"
category: "Containers & Docker"
tags: [kubernetes, services, networking, clusterip, ingress, dns]
cover: "/covers/curriculum/kubernetes.svg"
estMinutes: 65
status: "published"
summary: "Pods are ephemeral with changing IPs — so how does traffic reach them? The Service abstraction and its types (ClusterIP, NodePort, LoadBalancer), label-selector endpoints, DNS-based service discovery, the cluster networking model, and Ingress for HTTP routing into the cluster."
seoTitle: "Kubernetes 3: Services & Networking (ClusterIP, Ingress, DNS)"
seoDescription: "Kubernetes networking: Service types (ClusterIP/NodePort/LoadBalancer), endpoints/selectors, DNS discovery, the pod network model, and Ingress for HTTP routing. Lab + assessment."
---

Pods are disposable and get a **new IP every time** they're recreated — so you can never
hardcode a Pod IP. **Services** solve this: a Service is a **stable virtual IP and DNS name**
that load-balances across a changing set of Pods selected by **labels**. This lesson covers
the Service **types** (ClusterIP, NodePort, LoadBalancer), how **endpoints** track healthy
Pods, **DNS-based service discovery**, the cluster's flat **networking model**, and
**Ingress** for routing external HTTP traffic to many services through one entry point.

## Learning objectives

By the end of this lesson you will be able to:

- Explain why **Services** exist and how they track Pods via **selectors/endpoints**.
- Use the three Service types: **ClusterIP**, **NodePort**, **LoadBalancer**.
- Resolve services by **DNS** name within the cluster.
- Describe the **flat pod network** model (every Pod can reach every Pod).
- Use **Ingress** to route external HTTP traffic to multiple services.

## Part 1 — Why Services

Pod IPs are **unstable** — a rollout, crash, or scale event gives Pods new IPs. A **Service**
provides a **stable abstraction** in front of a set of Pods:

```text
   clients ──► Service (stable ClusterIP + DNS name) ──► load-balances ──► [Pod, Pod, Pod]
                       │ selects Pods by LABEL                              (IPs change freely)
                       └─ keeps an up-to-date list of healthy Pod IPs (Endpoints)
```

The Service watches for Pods matching its **selector** and maintains an **EndpointSlice** of
their current IPs; kube-proxy programs the routing so traffic to the Service is load-balanced
across them. Pods come and go; the Service IP/name stays constant.

```yaml
apiVersion: v1
kind: Service
metadata: { name: web }
spec:
  selector: { app: web }        # picks Pods with label app=web (must match the Deployment's Pod labels)
  ports:
    - port: 80                  # the Service port
      targetPort: 80            # the container port on the Pods
```

## Part 2 — Service types

```text
ClusterIP   (default)  internal-only virtual IP; reachable WITHIN the cluster
NodePort               opens a static port (30000–32767) on EVERY node's IP
LoadBalancer           provisions an external cloud load balancer -> public IP
ExternalName           DNS CNAME alias to an external host (no proxying)
```

- **ClusterIP** — the default; for **internal** service-to-service traffic (your db, api,
  cache). Not reachable from outside.
- **NodePort** — exposes the Service on a high port on each node; basic external access,
  mostly for dev/testing.
- **LoadBalancer** — on a cloud, provisions a real external load balancer with a public IP;
  the standard way to expose a service to the internet (each one = its own LB, which gets
  expensive — Ingress solves that).

```bash
kubectl expose deployment web --port=80 --target-port=80          # quick ClusterIP
kubectl expose deployment web --type=NodePort --port=80           # NodePort
kubectl get svc                                                    # see TYPE, CLUSTER-IP, PORT(S)
kubectl get endpointslices -l kubernetes.io/service-name=web      # the Pod IPs behind it
```

> [!IMPORTANT]
> Use **ClusterIP for everything internal** (databases, APIs, caches talk to each other this
> way) and reserve external types for what truly needs public access. A **LoadBalancer per
> service** means many cloud LBs and bills; the scalable pattern is **one LoadBalancer/
> Ingress controller** at the edge routing to many ClusterIP services (Part 5). NodePort is
> handy for local clusters but rarely the right answer in production.

## Part 3 — DNS-based service discovery

Kubernetes runs **CoreDNS**, giving every Service a stable DNS name. Apps connect by
**name**, never by IP:

```text
   <service>                          # same namespace:           web
   <service>.<namespace>              # cross-namespace:          web.prod
   <service>.<namespace>.svc.cluster.local   # fully qualified
```

```bash
# From inside any Pod, the db Service is just "db":
#   DATABASE_URL=postgres://user:pass@db:5432/app
kubectl run tmp --rm -it --image=busybox --restart=Never -- \
  sh -c 'nslookup web; wget -qO- http://web'      # resolves the Service by name
```

This is the cluster version of Docker's user-defined-network DNS — addressing services by
name, with the Service load-balancing across healthy Pods automatically.

## Part 4 — The cluster network model

Kubernetes mandates a **flat network**: **every Pod gets its own IP, and every Pod can reach
every other Pod across nodes without NAT**. A **CNI plugin** (Calico, Cilium, Flannel)
implements this.

```text
Three networks to keep straight:
  Pod network      per-Pod IPs; flat, cross-node, no NAT (CNI provides it)
  Service network  virtual ClusterIPs (not owned by any Pod; kube-proxy routes them)
  Node network     the real machine IPs
```

By default **any Pod can talk to any Pod** — open by design. You restrict that with
**NetworkPolicies** (a later/security topic) to segment tiers, exactly like firewall rules
inside the cluster (recall default-deny from the security track).

## Part 5 — Ingress: HTTP routing into the cluster

A **LoadBalancer per service** doesn't scale. **Ingress** is a single HTTP(S) entry point
that routes by **host/path** to many internal ClusterIP services — and centralizes TLS:

```text
   internet ─► Ingress Controller (one LB) ─► routes by host/path:
                  shop.example.com/        → web      (ClusterIP)
                  shop.example.com/api      → api      (ClusterIP)
                  admin.example.com/        → admin    (ClusterIP)
```

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata: { name: shop }
spec:
  rules:
    - host: shop.example.com
      http:
        paths:
          - path: /api
            pathType: Prefix
            backend: { service: { name: api, port: { number: 80 } } }
          - path: /
            pathType: Prefix
            backend: { service: { name: web, port: { number: 80 } } }
  tls:
    - hosts: [shop.example.com]
      secretName: shop-tls          # terminate HTTPS here (cert in a Secret)
```

You must run an **Ingress controller** (nginx-ingress, Traefik, or a cloud one) for Ingress
objects to do anything. Modern clusters increasingly use the **Gateway API** (a more
expressive successor), but Ingress remains the common starting point.

> [!TIP]
> Expose internal services as **ClusterIP**, then put **one Ingress controller** (a single
> cloud LB) in front to route many hostnames/paths and terminate **TLS** centrally — far
> cheaper and cleaner than a LoadBalancer per service. This mirrors a reverse proxy in front
> of backends; the Ingress controller is just an in-cluster nginx/Traefik configured by
> Ingress objects.

## Hands-on lab

```bash
# 1. A Deployment to expose
kubectl create deployment web --image=nginx --replicas=3
kubectl label pods -l app=web tier=frontend --overwrite >/dev/null 2>&1 || true

# 2. ClusterIP service + see its endpoints track the Pods
kubectl expose deployment web --port=80 --target-port=80
kubectl get svc web
kubectl get endpointslices -l kubernetes.io/service-name=web   # 3 Pod IPs

# 3. DNS discovery from another Pod (resolve by name, load-balanced)
kubectl run tmp --rm -it --image=busybox --restart=Never -- \
  sh -c 'nslookup web; for i in 1 2 3; do wget -qO- http://web | head -1; done'

# 4. Prove the Service survives Pod churn (stable IP, changing endpoints)
SVCIP=$(kubectl get svc web -o jsonpath='{.spec.clusterIP}'); echo "stable: $SVCIP"
kubectl delete pod "$(kubectl get pod -l app=web -o jsonpath='{.items[0].metadata.name}')"
kubectl get endpointslices -l kubernetes.io/service-name=web   # a new Pod IP appears; SVCIP unchanged

# 5. NodePort for external-ish access (on kind/minikube)
kubectl patch svc web -p '{"spec":{"type":"NodePort"}}'
kubectl get svc web   # note the 3xxxx NodePort
# minikube service web --url    # get a reachable URL on minikube

# 6. (If an ingress controller is installed) apply an Ingress; otherwise read the manifest above
# cleanup
kubectl delete deploy web; kubectl delete svc web
```

## Exercises

1. Explain why you can't address Pods directly and how a Service fixes it.
2. Create a ClusterIP Service for a Deployment and show its endpoints match the Pod IPs.
3. From a temporary Pod, resolve and curl the Service **by DNS name**.
4. Show the Service IP stays constant while a Pod is replaced (endpoints change).
5. Compare ClusterIP, NodePort, and LoadBalancer and when to use each.
6. Describe how Ingress lets one entry point serve many services, and what you must run for
   it to work.

## Troubleshooting

- **Service has no endpoints** — selector doesn't match Pod labels, or Pods not ready. *Fix:*
  align labels; check readiness; `kubectl get endpointslices`.
- **Can't reach service by name** — DNS/CoreDNS issue or wrong namespace. *Fix:* use
  `svc.namespace`; check CoreDNS pods.
- **LoadBalancer stuck `<pending>`** — no cloud LB provider (local cluster). *Fix:* use
  NodePort/port-forward locally; install MetalLB.
- **Ingress does nothing** — no Ingress controller installed. *Fix:* install nginx-ingress/
  Traefik.
- **Traffic only hits one Pod** — long-lived connections/affinity. *Fix:* understand L4 LB;
  use Ingress/L7 for HTTP balancing.
- **Pod can't reach another Pod** — NetworkPolicy or CNI issue. *Fix:* check policies; verify
  CNI is healthy.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Justify briefly.

1. Why are Pod IPs unsuitable for clients to use directly?
2. How does a Service know which Pods to send traffic to?
3. What are Endpoints/EndpointSlices?
4. Compare ClusterIP, NodePort, and LoadBalancer.
5. How do you address a Service from another namespace by DNS?
6. State the Kubernetes pod-network requirement.
7. What problem does Ingress solve that many LoadBalancers don't?
8. What must be running for Ingress objects to take effect?
9. **Practical:** expose a Deployment as ClusterIP and curl it by name from a Pod.
10. **Practical:** show the Service IP is stable while endpoints change.

## Solutions & validation

1. They **change** on every recreate/scale — clients would chase moving targets.
2. Via a **label selector**; it tracks matching Pods' IPs as **endpoints**.
3. The live list of healthy Pod IPs backing a Service (updated automatically).
4. ClusterIP = internal virtual IP; NodePort = static port on every node; LoadBalancer =
   external cloud LB/public IP.
5. `<service>.<namespace>` (e.g. `db.prod`) — or the FQDN `…svc.cluster.local`.
6. **Every Pod gets an IP and can reach every other Pod across nodes without NAT** (via CNI).
7. One entry point + L7 host/path routing + central TLS, instead of an LB (and bill) per
   service.
8. An **Ingress controller** (nginx/Traefik/cloud).
9. **Validation:** `wget -qO- http://web` from a temp Pod returns nginx (see lab).
10. **Validation:** ClusterIP unchanged after deleting a Pod; endpoints list updates.

> [!TIP]
> The networking model in one line: **Pods are cattle with throwaway IPs; Services are the
> stable names/IPs you actually use, load-balancing across them; Ingress is the single L7
> front door.** Address everything internal by **Service DNS name**, keep backends
> ClusterIP, and route the outside world in through **one Ingress** with TLS. Lock it down
> later with NetworkPolicies.

## What's next

Next: **Lesson 1204 — Configuration: ConfigMaps & Secrets.** Decouple config from images the
Kubernetes way: ConfigMaps for non-sensitive settings, Secrets for credentials, injecting
them as env vars or mounted files, and the important caveats about Secret security.
