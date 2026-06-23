---
title: "Databases — Operating in Production"
slug: "databases-operating-in-production"
track: "databases"
trackName: "Databases & Data Infrastructure"
module: "Database Operations"
order: 1808
level: "Advanced"
difficulty: "Senior"
distribution: "Cross-platform"
category: "Data"
tags: [databases, production, managed, security, capacity, best-practices]
cover: "/covers/curriculum/databases.svg"
estMinutes: 65
status: "published"
summary: "The capstone: managed databases vs self-hosting (and on Kubernetes), database security and access control, connection management, safe schema changes, capacity planning, the broader data-infrastructure landscape (caches, queues, warehouses, data pipelines), and a production-readiness checklist."
seoTitle: "Databases 8: Operating in Production (managed vs self-host, security, capacity)"
seoDescription: "Production databases: managed vs self-hosted/Kubernetes, security/access control, connection management, safe schema changes, capacity planning, and a readiness checklist. Capstone lab + assessment."
---

This capstone ties the track into **running databases in production** — the decisions and disciplines
that keep them fast, safe, and available. We'll weigh **managed vs self-hosted** (and the realities of
databases on Kubernetes), cover **database security and access control**, **connection management**,
**safe schema changes** at scale, **capacity planning**, the broader **data-infrastructure landscape**
(caches, queues, warehouses, pipelines), and a **production-readiness checklist** synthesizing the
whole track. The throughline: the database is usually your **most critical, least forgiving** tier —
operate it accordingly.

## Learning objectives

By the end of this lesson you will be able to:

- Decide between **managed and self-hosted** databases (incl. on Kubernetes).
- Apply database **security and access control**.
- Manage **connections** and **safe schema changes** at scale.
- Do basic **capacity planning**.
- Place a database in the broader **data-infrastructure** landscape and run a readiness checklist.

## Part 1 — Managed vs self-hosted

```text
MANAGED (RDS/Cloud SQL/Aurora/Atlas/etc.)   provider runs it
   + automated backups, patching, multi-AZ FAILOVER, replicas, monitoring — the hard parts done
   - costs more; less control/tuning; some lock-in
SELF-HOSTED (your VMs / Kubernetes)         you run it
   + full control, any extension/config, no per-DB premium
   - YOU own backups, HA/failover, patching, scaling, monitoring — operationally HARD
```

The recurring advice (the K8s and cloud lessons): **prefer a managed database unless you have a strong
reason not to.** Running a production database well — backups, **tested restores**, failover, patching,
capacity — is genuinely hard, and managed services do the highest-stakes parts for you. **Databases on
Kubernetes** are increasingly viable via **operators** (CloudNativePG, Zalando, Vitess) that automate
failover/backups, but it's still more complex than a managed service — use an **operator, not a
hand-rolled StatefulSet** (recall the K8s storage lesson), and only if you have the expertise.

> [!IMPORTANT]
> **The database is the tier where DIY mistakes are most expensive — default to managed.** A botched
> web server is a restart; a botched database failover, an untested backup, or a bad schema migration
> can mean **permanent data loss or extended downtime**. Managed databases handle the parts that are
> easy to get catastrophically wrong (failover, backups, patching). Self-host only with real expertise
> and on-call capacity — and if on Kubernetes, use a **mature operator**, never a hand-built
> StatefulSet. The cost premium of managed is usually trivial next to the cost of one data-loss
> incident.

## Part 2 — Security and access control

The database holds your crown jewels — apply the security track:

```text
□ NETWORK: database in a PRIVATE subnet, never internet-exposed; access only from app/SG (cloud lesson)
□ ENCRYPTION: at rest (KMS) + in transit (TLS) — always
□ LEAST PRIVILEGE: per-app/service DB users with ONLY needed grants (not superuser everywhere)
   - separate read-only users for replicas/reporting; no shared admin accounts
□ AUTH: strong/rotated credentials from a SECRETS MANAGER (not in code); consider IAM auth
□ AUDIT: log access/admin actions; monitor for anomalies
□ INJECTION: parameterized queries / prepared statements (NEVER string-concatenate SQL) — OWASP #1-ish
□ BACKUPS encrypted; PII handling per compliance (security/compliance lessons)
```

Two database-specific musts: **never expose the database to the internet** (private subnet + SG/firewall, app-only access), and **always use parameterized queries** to prevent **SQL injection** —
the classic, devastating web vulnerability where unsanitized input becomes executable SQL. Grant each
service a **least-privilege** user; reporting/replica access should be **read-only**.

## Part 3 — Connection management and safe schema changes

```text
CONNECTIONS (recall the scaling lesson):
   - use a CONNECTION POOL (PgBouncer / app pool) — per-request connections exhaust the DB
   - set sane pool sizes; monitor active vs max; watch for leaks (connections not returned)
   - serverless/lambda needs special care (each invocation can open connections → use a proxy/pooler)

SAFE SCHEMA CHANGES (recall migrations + zero-downtime deploys):
   - EXPAND/CONTRACT: add new (nullable) → backfill in batches → switch app → remove old (separate deploys)
   - make changes BACKWARD-COMPATIBLE so old + new app run together during rollout
   - avoid long table locks: add indexes CONCURRENTLY; batch big UPDATEs; short transactions
   - test migrations on a copy/staging with production-like data; have a rollback plan
   - the most dangerous migration is one that locks a huge table or isn't reversible
```

Connection pooling and safe migrations are where most **self-inflicted production database incidents**
come from: an app opening too many connections (outage under load) or a migration that **locks a giant
table** mid-day (everything blocks). The **expand/contract** pattern + **CONCURRENTLY** + **batched
backfills** let you change schemas with zero downtime alongside rolling deploys.

> [!TIP]
> **Treat schema migrations as the riskiest deploys you do.** A migration runs against your most
> critical data and can lock tables, block the app, or be irreversible. Use **expand/contract**
> (additive, backward-compatible steps across deploys), add indexes **CONCURRENTLY**, **batch** large
> data changes to avoid long locks, **test on production-like data** first, and always have a
> **rollback plan**. The migration that takes a `LOCK` on a 500M-row table at peak traffic is how a
> routine deploy becomes an outage.

## Part 4 — Capacity planning

```text
PLAN AHEAD (don't discover limits during an incident):
   STORAGE   growth rate × time → when do you run out? (disk-full = DB stops!) auto-scale storage if possible
   CONNECTIONS  expected concurrency vs pool/DB limits
   IOPS/THROUGHPUT  read/write rate vs instance/disk capability
   MEMORY    working set vs cache size (low cache hit ratio = disk-bound = slow)
   CPU       query load; watch the slow-query log
   HEADROOM  run at ~60–70%, not 95% — leave room for spikes and growth
```

Capacity planning means **projecting growth** (data size, traffic, connections) and **scaling before
you hit the wall** — especially **storage** (a full disk halts the database). Use the **monitoring**
from the previous lesson to track trends, and the **scaling** options (vertical/replicas/sharding) to
stay ahead. Leave headroom; databases degrade badly near their limits.

## Part 5 — The data-infrastructure landscape and readiness

A production data platform is usually **more than one database** (polyglot, Lesson 1801):

```text
   OPERATIONAL DB (OLTP)  the app's source of truth (Postgres/MySQL/managed)
   + CACHE (Redis)         hot reads/sessions in front of the DB (speed; ephemeral)
   + QUEUE/STREAM          decouple writes / async processing (Kafka/SQS — cloud lesson)
   + SEARCH (Elastic/OpenSearch)  full-text/faceted search
   + DATA WAREHOUSE (OLAP)  analytics, fed by ETL/ELT from the operational DB (don't query OLTP!)
   + DATA PIPELINE          CDC/ETL moving data between systems (Debezium, dbt, Airflow)
```

```text
DATABASE PRODUCTION-READINESS CHECKLIST (the whole track):
□ Right data model(s) for the workload; ~3NF OLTP schema with constraints
□ Indexed for the real query patterns (verified with EXPLAIN); slow-query log on
□ Transactions for invariants; correct isolation; deadlock-aware + retries
□ HA: replication + automatic failover (multi-AZ); connection pooling
□ Backups (3-2-1) + PITR + TESTED restores (with measured RTO); replication ≠ backup
□ Security: private network, TLS + at-rest encryption, least-privilege users, secrets manager,
  parameterized queries (no injection)
□ Monitoring: connections, lag, disk, slow queries, cache hit ratio; alerts (esp. disk)
□ Maintenance: vacuum/stats/bloat; patched version
□ Safe schema changes (expand/contract, CONCURRENTLY, batched, tested, reversible)
□ Capacity planned with headroom; managed service unless strong reason to self-host
```

## Hands-on lab

```bash
docker run -d --name pg -e POSTGRES_PASSWORD=secret -p 5432:5432 postgres:16
sleep 4; q() { docker exec -i pg psql -U postgres -tA -c "$1"; }

# 1. LEAST-PRIVILEGE users (not everyone is superuser)
q "CREATE DATABASE app;"
q "CREATE USER app_rw WITH PASSWORD 'x';"
q "CREATE USER app_ro WITH PASSWORD 'y';"
docker exec -i pg psql -U postgres -d app -c "CREATE TABLE t(id int);"
docker exec -i pg psql -U postgres -d app -c "GRANT SELECT, INSERT, UPDATE ON t TO app_rw;"
docker exec -i pg psql -U postgres -d app -c "GRANT SELECT ON t TO app_ro;"   # read-only user
echo "app_ro can read but not write (least privilege)"

# 2. SQL INJECTION contrast (parameterized vs concatenation) — conceptual
cat <<'EOF'
UNSAFE:  "SELECT * FROM users WHERE name = '" + input + "'"   ← input "' OR '1'='1" dumps the table
SAFE:    cur.execute("SELECT * FROM users WHERE name = %s", (input,))  ← parameterized, injection-proof
EOF

# 3. SAFE schema change: additive + concurrent index (no long lock)
docker exec -i pg psql -U postgres -d app -c "ALTER TABLE t ADD COLUMN created timestamptz;"   # additive
docker exec -i pg psql -U postgres -d app -c "CREATE INDEX CONCURRENTLY idx_t_created ON t(created);" 2>&1 | tail -1

# 4. Capacity snapshot
echo "db size: $(q "SELECT pg_size_pretty(pg_database_size('app'));")"
echo "max connections: $(q 'SHOW max_connections;')   current: $(q 'SELECT count(*) FROM pg_stat_activity;')"

docker rm -f pg
```

```text
5. MANAGED vs SELF-HOSTED — for each, choose and justify:
   a) A 3-person startup's main app DB        → ______ (managed — no DBA, focus on product)
   b) A regulated bank needing custom extensions + full control → ______ (depends; often self-host/managed-enterprise)
   c) A side project                            → ______ (managed free tier)
```

## Exercises

1. Decide managed vs self-hosted for three scenarios and justify; note the Kubernetes-operator caveat.
2. List the database security controls (network, encryption, least privilege, injection) and apply
   them.
3. Show the difference between a parameterized query and string concatenation; explain the injection.
4. Explain connection pooling's role and a safe zero-downtime schema-change procedure.
5. Do a basic capacity plan for storage and connections with headroom.
6. Sketch a polyglot data platform and run the readiness checklist against a service.

## Troubleshooting

- **Data-loss/failover disaster self-hosting** — underestimated difficulty. *Fix:* managed service /
  mature operator.
- **DB internet-exposed / SQL injection** — security gaps. *Fix:* private network; parameterized
  queries; least privilege.
- **Outage under load (too many connections)** — no pooling. *Fix:* connection pool; serverless DB
  proxy.
- **Migration locked prod** — unsafe change. *Fix:* expand/contract, CONCURRENTLY, batched, tested.
- **Disk filled, DB stopped** — no capacity planning. *Fix:* monitor + alert on disk; auto-scale
  storage; plan ahead.
- **Reporting crushing the OLTP DB** — wrong tier. *Fix:* warehouse + ETL; read replicas.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Justify briefly.

1. When prefer managed over self-hosted, and the Kubernetes caveat?
2. Name four database security controls.
3. How do you prevent SQL injection?
4. Why use a connection pool?
5. Describe a safe zero-downtime schema change.
6. What's the deadliest capacity oversight, and why?
7. Why keep analytics off the OLTP database?
8. Name three components of a polyglot data platform.
9. **Practical:** create least-privilege DB users.
10. **Practical:** do an additive schema change with a concurrent index.

## Solutions & validation

1. Default to **managed** (it does the hard, high-stakes parts); on K8s use a **mature operator**,
   not a hand-built StatefulSet.
2. Private network, encryption (TLS + at-rest), least-privilege users, parameterized queries (and
   secrets manager/audit).
3. **Parameterized queries / prepared statements** (never concatenate input into SQL).
4. To avoid exhausting the database's connection limit (per-request connections) under load.
5. **Expand/contract**: additive/backward-compatible change → backfill in batches → switch → remove
   old; CONCURRENTLY; tested.
6. **Storage/disk-full** — the database stops accepting writes/crashes.
7. Heavy analytical scans degrade the low-latency transactional workload; use a warehouse.
8. e.g. operational DB, cache, queue/stream, search, warehouse, pipeline (any three).
9. **Validation:** app_ro has SELECT only; app_rw has read/write (see lab).
10. **Validation:** `ALTER TABLE ADD COLUMN` + `CREATE INDEX CONCURRENTLY` (no long lock).

> [!TIP]
> The database is your **most critical, least forgiving tier** — operate it conservatively: **prefer
> managed** (or a mature K8s operator), lock it down (private network, encryption, least privilege,
> **parameterized queries**), **pool connections**, treat **schema migrations as your riskiest
> deploys** (expand/contract, CONCURRENTLY, tested, reversible), **plan capacity** with headroom, and
> compose a **polyglot** platform (cache/queue/warehouse) rather than overloading one database.
> Above all, the disciplines that save you are **tested backups + PITR** and **monitoring** — earn
> your confidence before the incident, not during it.

## What's next

You've completed the **Databases & Data Infrastructure** track — data models, SQL, schema design,
indexing, transactions, replication/scaling, backups/recovery, and production operations. You can now
design, query, tune, scale, and safely operate the data stores at the heart of every application. Next
in the roadmap: **Web Infrastructure** — the servers, proxies, load balancers, and CDNs that deliver
applications — followed by the remaining virtualization, storage, DR, SRE, and troubleshooting tracks.
