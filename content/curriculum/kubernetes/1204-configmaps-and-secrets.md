---
title: "Kubernetes — Configuration: ConfigMaps & Secrets"
slug: "kubernetes-configmaps-and-secrets"
track: "kubernetes"
trackName: "Kubernetes"
module: "Kubernetes Workloads"
order: 1204
level: "Intermediate"
difficulty: "Intermediate"
distribution: "Cross-platform"
category: "Containers & Docker"
tags: [kubernetes, configmap, secret, configuration, env, volumes]
cover: "/covers/curriculum/kubernetes.svg"
estMinutes: 55
status: "published"
summary: "Decouple configuration from images the Kubernetes way: ConfigMaps for non-sensitive settings and Secrets for credentials, injecting them as environment variables or mounted files, and the crucial caveats — Secrets are only base64-encoded by default, so encryption-at-rest and RBAC matter."
seoTitle: "Kubernetes 4: ConfigMaps & Secrets (env vars, mounts, security)"
seoDescription: "Kubernetes config: ConfigMaps and Secrets, injecting as env vars or volume files, base64 caveat, encryption at rest, and external secret stores. Hands-on lab and assessment."
---

The 12-factor rule from Docker — **one image, configured by the environment** — is built
into Kubernetes via **ConfigMaps** (non-sensitive config) and **Secrets** (credentials).
You keep the *same* image across dev/staging/prod and supply different configuration as
**environment variables** or **mounted files**. This lesson shows how to create and consume
both, and — critically — the security caveats: Kubernetes Secrets are **base64-encoded, not
encrypted** by default, so you must enable **encryption at rest**, lock down **RBAC**, and
often reach for an **external secrets manager**.

## Learning objectives

By the end of this lesson you will be able to:

- Create **ConfigMaps** and **Secrets** (imperatively and as YAML).
- Inject config as **environment variables** and as **mounted files (volumes)**.
- Choose env vars vs files appropriately.
- Explain that Secrets are **base64, not encrypted**, and how to actually secure them.
- Reference external secret stores at a high level.

## Part 1 — ConfigMaps

A **ConfigMap** holds non-sensitive key/value config (or whole config files):

```bash
kubectl create configmap app-config \
  --from-literal=LOG_LEVEL=info \
  --from-literal=FEATURE_X=on \
  --from-file=app.properties           # a file becomes a key with the file as its value
kubectl get configmap app-config -o yaml
```

```yaml
apiVersion: v1
kind: ConfigMap
metadata: { name: app-config }
data:
  LOG_LEVEL: "info"
  FEATURE_X: "on"
  app.properties: |
    timeout=30
    retries=3
```

Use ConfigMaps for log levels, feature flags, URLs, tuning, and config files — anything
that's **not** a secret.

## Part 2 — Consuming config as env vars

```yaml
spec:
  containers:
    - name: app
      image: myapp:1.0
      env:
        - name: LOG_LEVEL                    # one key
          valueFrom:
            configMapKeyRef: { name: app-config, key: LOG_LEVEL }
      envFrom:
        - configMapRef: { name: app-config } # ALL keys as env vars
```

`envFrom` pulls every key in as an env var (handy); `valueFrom`/`configMapKeyRef` picks one
specific key. The app reads them like any environment variable — the 12-factor approach.

## Part 3 — Consuming config as mounted files

Mount a ConfigMap as a **volume** so each key becomes a **file** — ideal for config files an
app reads from disk (nginx.conf, application.yaml):

```yaml
spec:
  containers:
    - name: app
      image: myapp:1.0
      volumeMounts:
        - name: cfg
          mountPath: /etc/app           # /etc/app/LOG_LEVEL, /etc/app/app.properties ...
          readOnly: true
  volumes:
    - name: cfg
      configMap: { name: app-config }
```

> [!TIP]
> Use **env vars** for simple scalar settings and **file mounts** for config *files* or
> larger data. A subtle but important difference: **env vars are captured at container
> start** and do **not** update if the ConfigMap changes — you must restart the Pod
> (`kubectl rollout restart`). **Mounted ConfigMap files**, by contrast, are eventually
> updated in place — though most apps still need a reload/restart to notice. Pick based on
> whether the app expects env or a file, and remember rollouts pick up changes cleanly.

## Part 4 — Secrets

**Secrets** look like ConfigMaps but are for **sensitive** data (passwords, tokens, TLS
keys). Values are **base64-encoded** in the API:

```bash
kubectl create secret generic db-cred \
  --from-literal=username=app \
  --from-literal=password='s3cr3t!'
kubectl create secret tls web-tls --cert=tls.crt --key=tls.key   # TLS type
kubectl get secret db-cred -o jsonpath='{.data.password}' | base64 -d   # decode -> s3cr3t!
```

```yaml
spec:
  containers:
    - name: app
      env:
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef: { name: db-cred, key: password }
      volumeMounts:
        - { name: cred, mountPath: /etc/secrets, readOnly: true }
  volumes:
    - name: cred
      secret: { secretName: db-cred }
```

Consume Secrets the same two ways (env or files). **Prefer mounting Secrets as files** over
env vars where you can — env vars are more prone to accidental exposure (logs, child
processes, crash dumps).

## Part 5 — The Secret security caveats

The dangerous misconception: "it's a Secret, so it's secure." By default it is **not**.

```text
base64 is ENCODING, not ENCRYPTION — anyone with read access decodes it instantly.
To actually secure Secrets:
  1. Enable ENCRYPTION AT REST for Secrets in etcd (EncryptionConfiguration / KMS).
  2. Lock down RBAC — who can `get`/`list` secrets in a namespace (least privilege).
  3. Don't commit Secret YAML to Git in plaintext (use SealedSecrets/SOPS/external store).
  4. Prefer an EXTERNAL secrets manager (Vault, AWS/GCP/Azure secret stores) via the
     External Secrets Operator or CSI Secrets Store driver.
```

> [!IMPORTANT]
> A Kubernetes Secret is only **base64-encoded** in etcd by default — that's obfuscation,
> not protection. Treat it as secure **only** when you've (1) enabled **encryption at rest**
> (ideally KMS-backed), (2) restricted **RBAC** so few identities can read secrets, and (3)
> kept plaintext Secret manifests **out of Git**. For anything serious, integrate an
> **external secrets manager** (Vault/cloud KMS) so the real secret never lives in etcd as
> recoverable base64. This is the security track's "hash/encrypt and least-privilege" applied
> to the cluster.

## Hands-on lab

```bash
# 1. ConfigMap + consume as env and as files
kubectl create configmap app-config --from-literal=LOG_LEVEL=debug --from-literal=GREETING=hi
cat > pod.yaml <<'EOF'
apiVersion: v1
kind: Pod
metadata: { name: cfgdemo }
spec:
  restartPolicy: Never
  containers:
    - name: c
      image: busybox
      command: ["sh","-c","echo env LOG_LEVEL=$LOG_LEVEL; echo file:; cat /etc/app/GREETING; sleep 5"]
      envFrom: [{ configMapRef: { name: app-config } }]
      volumeMounts: [{ name: cfg, mountPath: /etc/app, readOnly: true }]
  volumes:
    - name: cfg
      configMap: { name: app-config }
EOF
kubectl apply -f pod.yaml
kubectl logs cfgdemo --follow=false --previous=false 2>/dev/null; sleep 3; kubectl logs cfgdemo

# 2. Secret + prove base64 is NOT encryption
kubectl create secret generic db-cred --from-literal=password='s3cr3t!'
kubectl get secret db-cred -o jsonpath='{.data.password}'; echo
kubectl get secret db-cred -o jsonpath='{.data.password}' | base64 -d; echo   # trivially decoded

# 3. Mount the secret as a file (preferred over env)
kubectl run sec --image=busybox --restart=Never --overrides='
{"spec":{"containers":[{"name":"sec","image":"busybox","command":["sh","-c","cat /s/password; sleep 5"],
"volumeMounts":[{"name":"s","mountPath":"/s","readOnly":true}]}],
"volumes":[{"name":"s","secret":{"secretName":"db-cred"}}]}}'
sleep 3; kubectl logs sec

# 4. Update a ConfigMap and show env vars DON'T change without a restart
kubectl create configmap app-config --from-literal=LOG_LEVEL=trace --from-literal=GREETING=updated \
  --dry-run=client -o yaml | kubectl apply -f -
# (a running Pod keeps old env until: kubectl rollout restart / pod recreate)

# cleanup
kubectl delete pod cfgdemo sec --ignore-not-found
kubectl delete configmap app-config; kubectl delete secret db-cred
```

## Exercises

1. Create a ConfigMap with three keys and inject all of them as env vars into a Pod.
2. Mount a ConfigMap as files and read one value from `/etc/...` inside the container.
3. Create a Secret and demonstrate that its value is only base64-encoded (decode it).
4. Mount a Secret as a file and explain why that's often safer than an env var.
5. List the four things required to make Kubernetes Secrets actually secure.
6. Show that changing a ConfigMap doesn't update a running Pod's env vars, and how you'd roll
   out the change.

## Troubleshooting

- **Env var not set** — wrong ConfigMap/key name. *Fix:* check `kubectl get cm -o yaml`;
  match keys.
- **Config change not picked up** — env vars captured at start. *Fix:* `kubectl rollout
  restart deployment/...`.
- **"It's a Secret so it's safe" assumption** — base64 only. *Fix:* encryption at rest +
  RBAC + external store.
- **Secret committed to Git in plaintext** — leak. *Fix:* SealedSecrets/SOPS/external
  manager; rotate the secret.
- **Mounted file has unexpected content** — key name = filename. *Fix:* check keys; use
  `items` to map specific keys to paths.
- **Pod can't read mounted secret** — wrong mountPath/permissions. *Fix:* verify volume +
  `readOnly`; check the file path.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Justify briefly.

1. What is a ConfigMap for, and what is a Secret for?
2. Two ways to consume config in a Pod?
3. When prefer mounted files over env vars?
4. Do running Pods pick up ConfigMap env changes automatically? How do you apply them?
5. How are Secret values stored by default — and is that secure?
6. List the steps to actually secure Kubernetes Secrets.
7. Why prefer mounting Secrets as files over env vars?
8. What's an external secrets manager's role?
9. **Practical:** inject a ConfigMap as env and read a Secret decoded.
10. **Practical:** mount a Secret as a file in a Pod.

## Solutions & validation

1. ConfigMap = **non-sensitive** key/value/config files; Secret = **sensitive** data
   (creds/keys).
2. As **environment variables** and as **mounted files (volumes)**.
3. For config **files** or larger data, and when you want in-place file updates.
4. No — env is captured at start; apply via `kubectl rollout restart` / Pod recreate.
5. **base64-encoded** (not encrypted) — **not** secure by itself.
6. Encryption at rest (KMS), tight RBAC, keep manifests out of Git, use an external manager.
7. Env vars leak more easily (logs, child processes, crash dumps); files are tighter.
8. Stores the real secret outside etcd; injects it securely (Vault/cloud KMS via operators/
   CSI).
9. **Validation:** env shows the ConfigMap value; `base64 -d` reveals the Secret (see lab).
10. **Validation:** the mounted file path contains the secret value.

> [!TIP]
> Decouple config from images with **ConfigMaps**, keep credentials in **Secrets** — but
> never confuse base64 with security. Make Secrets real with **encryption at rest +
> least-privilege RBAC + an external manager**, prefer **file mounts**, and roll out config
> changes with **`rollout restart`**. Same image everywhere, configured per environment, is
> the whole point.

## What's next

Next: **Lesson 1205 — Storage & StatefulSets.** Persisting data in an ephemeral world:
PersistentVolumes and PersistentVolumeClaims, StorageClasses and dynamic provisioning, and
StatefulSets for stable identity and storage — how to run databases and other stateful
workloads on Kubernetes.
