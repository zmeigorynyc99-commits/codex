---
title: "Databases — Fundamentals & Data Models"
slug: "databases-fundamentals-and-data-models"
track: "databases"
trackName: "Databases & Data Infrastructure"
module: "Database Foundations"
order: 1801
level: "Intermediate"
difficulty: "Intermediate"
distribution: "Cross-platform"
category: "Data"
tags: [databases, relational, nosql, data-models, acid, oltp]
cover: "/covers/curriculum/databases.svg"
estMinutes: 55
status: "published"
summary: "How to think about databases: why databases over files, the relational model and the main NoSQL families (document, key-value, wide-column, graph), OLTP vs OLAP, structured/semi/unstructured data, and how to choose the right data model for a workload."
seoTitle: "Databases 1: Fundamentals & Data Models (relational, NoSQL, OLTP/OLAP)"
seoDescription: "Database basics: why databases vs files, relational model, NoSQL families (document/KV/wide-column/graph), OLTP vs OLAP, and choosing a data model. Hands-on lab and assessment."
---

Databases sit at the heart of nearly every system you've built — and choosing and using them well
separates reliable applications from fragile ones. This foundational lesson covers **why databases**
exist (over flat files), the **relational model** and the main **NoSQL families** (document,
key-value, wide-column, graph), the **OLTP vs OLAP** divide (transactions vs analytics), the kinds of
**data** (structured/semi/unstructured), and — the practical skill — **choosing the right data
model** for a workload. This is the map for the rest of the track.

## Learning objectives

By the end of this lesson you will be able to:

- Explain **why databases** beat flat files for application data.
- Describe the **relational model** and the four main **NoSQL families**.
- Distinguish **OLTP vs OLAP** workloads.
- Classify **structured, semi-structured, and unstructured** data.
- **Choose a data model** for a given workload.

## Part 1 — Why databases

A database management system (DBMS) provides what files can't at scale:

```text
✗ flat files:   no concurrent access control, no integrity, no efficient queries/search,
                no transactions, manual indexing, corruption risk, no relationships
✓ a DBMS gives:  CONCURRENCY (many clients safely), INTEGRITY (constraints/types),
                 efficient QUERIES (indexes), TRANSACTIONS (all-or-nothing), DURABILITY,
                 RELATIONSHIPS, and a query language to ask arbitrary questions
```

The core value: **structured, concurrent, queryable, durable** storage with **integrity
guarantees**. You *could* store data in CSV/JSON files, but you'd reinvent (badly) concurrency
control, indexing, transactions, and querying. A database is the right tool the moment you have
**shared, structured, queried** data.

## Part 2 — The relational model

The dominant model for 50 years: data in **tables** (rows and columns) with **relationships** and a
**schema**:

```text
   users                    orders
   ┌────┬───────┬──────┐    ┌────┬─────────┬────────┐
   │ id │ name  │ email│    │ id │ user_id │ total  │
   ├────┼───────┼──────┤    ├────┼─────────┼────────┤
   │ 1  │ Ada   │ a@x  │    │ 10 │   1     │ 42.00  │  ← user_id is a FOREIGN KEY → users.id
   └────┴───────┴──────┘    └────┴─────────┴────────┘
   - SCHEMA: columns have types; constraints enforce integrity (NOT NULL, UNIQUE, FK)
   - NORMALIZATION: store each fact once; relate tables via keys (avoid duplication)
   - SQL: a declarative language to query/join/aggregate across tables
```

Relational databases (PostgreSQL, MySQL, SQL Server, Oracle) excel at **structured data with
relationships, complex queries (joins), and strong integrity**. The schema enforces structure, keys
relate tables, and **SQL** lets you ask almost any question. This is the **default choice** for most
application data — start here unless you have a specific reason not to.

## Part 3 — The NoSQL families

"NoSQL" = a set of non-relational models for needs relational databases handle less naturally
(massive scale, flexible schema, specific access patterns):

```text
DOCUMENT (MongoDB, Firestore)   self-contained JSON-like documents; flexible schema
   → semi-structured data, varying fields, "store the whole object" — app-friendly
KEY-VALUE (Redis, DynamoDB)     simple key → value lookups; extremely fast/scalable
   → caching, sessions, simple high-throughput lookups
WIDE-COLUMN (Cassandra, Bigtable)  rows with dynamic columns; huge write scale, partitioned
   → time-series, IoT, massive write-heavy workloads across many nodes
GRAPH (Neo4j, Neptune)          nodes + edges; relationship-first
   → social networks, recommendations, fraud — traversing connections cheaply
```

Each NoSQL family optimizes for a **specific access pattern** at the cost of relational generality
(joins, ad-hoc queries, strong schema). They typically scale **horizontally** more easily than
traditional relational databases and relax some guarantees for it.

> [!IMPORTANT]
> **NoSQL isn't "better" than relational — it's specialized.** Each family trades the relational
> model's flexibility (joins, ad-hoc queries, strong schema/integrity) for a specific strength:
> documents for flexible schemas, key-value for raw speed/scale, wide-column for massive writes,
> graph for relationship traversal. The right question isn't "SQL or NoSQL?" but "**what's my access
> pattern, and which model serves it best?**" For most general application data with relationships,
> **relational is still the right default** — reach for NoSQL when a specific pattern (scale, schema
> flexibility, graph traversal) genuinely demands it.

## Part 4 — OLTP vs OLAP

A fundamental workload split (recall the cloud storage lesson):

```text
OLTP (Online Transaction Processing)   many small, fast read/WRITE transactions
   "create an order, update a balance, fetch a user" — your APP's database
   → optimized for: low latency, high concurrency, row-level operations, integrity
   → relational (Postgres/MySQL) or NoSQL operational stores

OLAP (Online Analytical Processing)    few large, complex READ queries over huge datasets
   "revenue by region by quarter over 3 years" — analytics/BI/reporting
   → optimized for: scanning/aggregating billions of rows; columnar storage
   → data warehouses (BigQuery, Redshift, Snowflake), NOT your transactional DB
```

The key rule: **don't run heavy analytics (OLAP) on your transactional (OLTP) database** — the big
scanning queries will crush the app's fast transactional workload. Move analytics to a **separate
warehouse** (often via ETL/ELT pipelines), keeping the operational database fast for the app.

## Part 5 — Data types and choosing a model

```text
STRUCTURED       fits a fixed schema (rows/columns) → relational, warehouses
SEMI-STRUCTURED  flexible/nested (JSON, XML, logs) → document stores (or JSON in Postgres!)
UNSTRUCTURED     blobs (images, video, files) → OBJECT STORAGE (not a database) + metadata in a DB
```

```text
CHOOSING A DATA MODEL:
   relationships + complex queries + integrity → RELATIONAL (the default)
   flexible/evolving schema, store whole objects → DOCUMENT
   simple fast lookups / cache / sessions        → KEY-VALUE
   massive write scale, time-series               → WIDE-COLUMN
   relationship traversal (who-knows-who)         → GRAPH
   analytics over huge data                       → DATA WAREHOUSE (OLAP)
   files/blobs                                     → OBJECT STORAGE + metadata in a DB
```

Most real systems are **polyglot**: a relational DB for core data, a cache (key-value) for speed,
object storage for files, a warehouse for analytics — each store matched to its access pattern.
Don't force one database to do everything; **match the model to the workload**.

## Hands-on lab

```bash
# Run PostgreSQL locally and feel the relational model + a query.
docker run -d --name pg -e POSTGRES_PASSWORD=secret -p 5432:5432 postgres:16
sleep 4
psql() { docker exec -i pg psql -U postgres -c "$1"; }

# 1. Create related tables with a schema + foreign key (integrity!)
psql "CREATE TABLE users  (id serial PRIMARY KEY, name text NOT NULL, email text UNIQUE);"
psql "CREATE TABLE orders (id serial PRIMARY KEY, user_id int REFERENCES users(id), total numeric);"
psql "INSERT INTO users(name,email) VALUES ('Ada','a@x.io'),('Bob','b@x.io');"
psql "INSERT INTO orders(user_id,total) VALUES (1,42.00),(1,8.50),(2,15.00);"

# 2. A JOIN answers a question across tables (relational superpower)
psql "SELECT u.name, sum(o.total) AS spent FROM users u JOIN orders o ON o.user_id=u.id GROUP BY u.name;"

# 3. Integrity in action: the schema REJECTS bad data
psql "INSERT INTO users(name,email) VALUES ('Eve','a@x.io');" 2>&1 | grep -i "duplicate\|unique" && echo ">> UNIQUE constraint protected integrity"
psql "INSERT INTO orders(user_id,total) VALUES (999,1.00);" 2>&1 | grep -i "foreign" && echo ">> FK constraint protected integrity"

# 4. Semi-structured: Postgres can store JSON too (relational + document flexibility)
psql "CREATE TABLE events (id serial, data jsonb);"
psql "INSERT INTO events(data) VALUES ('{\"type\":\"click\",\"x\":10}'),('{\"type\":\"view\"}');"
psql "SELECT data->>'type' AS type, count(*) FROM events GROUP BY 1;"

docker rm -f pg
```

```text
5. MODEL-CHOICE exercise — pick a model for each:
   a) user accounts + orders with reporting   → ______ (relational)
   b) a product catalog with varying attrs     → ______ (document)
   c) a session store / cache                   → ______ (key-value)
   d) "friends of friends" recommendations      → ______ (graph)
   e) 3 years of clickstream for BI              → ______ (warehouse/OLAP)
   f) uploaded videos                            → ______ (object storage + metadata DB)
```

## Exercises

1. List four things a DBMS provides that flat files don't.
2. Describe the relational model (tables, schema, keys, normalization, SQL).
3. Name the four NoSQL families and a use case for each.
4. Explain OLTP vs OLAP and the rule about not mixing them.
5. Classify three data examples as structured/semi/unstructured and pick storage for each.
6. Choose a data model for five workloads and justify by access pattern.

## Troubleshooting

- **Reinventing the DB in files** — concurrency/integrity bugs. *Fix:* use a real DBMS.
- **Analytics crushing the app DB** — OLAP on OLTP. *Fix:* separate warehouse; ETL/ELT.
- **Chose NoSQL "for scale" but need joins** — mismatch. *Fix:* relational default; NoSQL for
  specific patterns.
- **Blobs in the database** — bloat/cost. *Fix:* object storage + metadata row.
- **Rigid schema fights evolving data** — *Fix:* document store, or JSONB columns in Postgres.
- **One DB forced to do everything** — *Fix:* polyglot persistence; match store to pattern.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Justify briefly.

1. Why use a database instead of files?
2. Describe the relational model's core ideas.
3. Name the four NoSQL families and what each optimizes for.
4. What's the difference between OLTP and OLAP?
5. Why not run analytics on your transactional database?
6. Differentiate structured, semi-structured, and unstructured data.
7. What's the default data model and when do you deviate?
8. What does "polyglot persistence" mean?
9. **Practical:** create related tables and run a join.
10. **Practical:** choose data models for five workloads.

## Solutions & validation

1. Concurrency, integrity, efficient queries/indexes, transactions, durability, relationships.
2. Tables (rows/columns) with a typed schema, keys/relationships, normalization, queried via SQL.
3. Document (flexible schema), key-value (fast lookups/cache), wide-column (write scale/time-series),
   graph (relationships).
4. OLTP = many small fast transactions (the app DB); OLAP = few big analytical queries (warehouse).
5. The heavy scans would degrade the app's low-latency transactional workload.
6. Structured (fixed schema), semi (flexible/nested JSON), unstructured (blobs → object storage).
7. **Relational** by default; deviate for specific scale/schema/traversal/analytics needs.
8. Using **multiple specialized stores**, each matched to its access pattern.
9. **Validation:** the JOIN returns per-user totals (see lab).
10. **Validation:** relational/document/KV/graph/warehouse/object per the lab.

> [!TIP]
> Think in **access patterns, not hype**: relational is the **default** for structured, related,
> queried data with integrity; reach for a **NoSQL family** only when a specific pattern (scale,
> flexible schema, key-value speed, graph traversal) demands it; keep **OLAP** off your OLTP
> database; and store **blobs in object storage**, not the DB. Most systems end up **polyglot** —
> the skill is matching each store to the job, which the rest of this track makes concrete.

## What's next

Next: **Lesson 1802 — SQL & Querying.** The language of relational data: SELECT and filtering, joins,
aggregation and grouping, subqueries and CTEs, and writing correct, readable queries — the
indispensable skill for anyone who touches data.
