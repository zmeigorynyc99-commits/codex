---
title: "Databases — Schema Design & Normalization"
slug: "databases-schema-design-and-normalization"
track: "databases"
trackName: "Databases & Data Infrastructure"
module: "Database Foundations"
order: 1803
level: "Intermediate"
difficulty: "Advanced"
distribution: "Cross-platform"
category: "Data"
tags: [databases, schema, normalization, keys, constraints, relationships]
cover: "/covers/curriculum/databases.svg"
estMinutes: 60
status: "published"
summary: "Building data models that last: data types, primary and foreign keys, normalization (1NF–3NF) and when to denormalize, constraints for integrity, the relationship types (1:1, 1:many, many:many) and how to model them, plus migrations for evolving schemas."
seoTitle: "Databases 3: Schema Design & Normalization (keys, constraints, relationships)"
seoDescription: "Schema design: data types, primary/foreign keys, normalization 1NF-3NF, denormalization, constraints, relationship modeling (1:1/1:many/many:many), and migrations. Lab + assessment."
---

A good schema makes correct code easy and bad data impossible; a bad one causes bugs, duplication,
and corruption forever. This lesson covers **schema design**: choosing **data types**, **primary and
foreign keys**, **normalization** (organizing data to eliminate redundancy) and **when to
denormalize**, **constraints** that enforce integrity at the database level, modeling the
**relationship types** (1:1, 1:many, many:many), and evolving schemas safely with **migrations**.
Investing in schema design pays off for the life of the application.

## Learning objectives

By the end of this lesson you will be able to:

- Choose appropriate **data types** and **primary keys**.
- Apply **normalization** (1NF–3NF) and recognize when to **denormalize**.
- Use **constraints** (NOT NULL, UNIQUE, FK, CHECK) for integrity.
- Model **1:1, 1:many, and many:many** relationships.
- Evolve schemas with **migrations**.

## Part 1 — Data types and primary keys

```text
CHOOSE THE RIGHT TYPE (correctness + storage + performance):
   integers (int/bigint), numeric/decimal (MONEY — never float!), text/varchar,
   boolean, timestamp/timestamptz (use TZ-aware!), date, uuid, jsonb, arrays, enum
PRIMARY KEY = uniquely identifies each row (NOT NULL + UNIQUE, indexed automatically)
   - surrogate key: an auto-generated id (serial/bigserial/UUID) — common default
   - natural key: an existing unique attribute (email, ISBN) — meaningful but can change
```

Pick types deliberately: **`numeric`/`decimal` for money** (floats cause rounding errors),
**timezone-aware timestamps** (`timestamptz`), and the tightest type that fits. Every table needs a
**primary key**. Prefer **surrogate keys** (auto IDs/UUIDs) as the default — they're stable and
simple; use natural keys cautiously (they can change, breaking references). UUIDs help when IDs must
be generated client-side or merged across systems.

## Part 2 — Normalization

**Normalization** organizes data so each fact is stored **once**, eliminating redundancy and update
anomalies. The practical levels:

```text
1NF  atomic values (no comma-separated lists in a column); each row unique
2NF  1NF + every non-key column depends on the WHOLE primary key (no partial dependency)
3NF  2NF + no non-key column depends on ANOTHER non-key column (no transitive dependency)

Un-normalized (BAD):                Normalized (3NF):
  orders(id, product, customer_name,    customers(id, name, email)
         customer_email, ...)            orders(id, customer_id → customers)
  → customer email duplicated in         → email stored ONCE; change it in one place
    every order; change = update many
```

The point of 3NF: **store each fact once, relate via keys.** This prevents **update anomalies** (a
customer changes email → you'd have to update every order row, and might miss some → inconsistent
data). Most operational (OLTP) schemas should be **roughly 3NF** — clean, consistent, no duplication.

> [!IMPORTANT]
> **Normalize OLTP schemas to ~3NF: store each fact once and relate tables with keys.** Redundant
> data (the same customer email copied into every order) causes **update anomalies** — change it in
> one place and the copies go stale, silently corrupting your data. Normalization makes the database
> enforce a single source of truth. The cost is more joins to reassemble data, which is usually a
> fine trade for the integrity. Start normalized; denormalize **deliberately** only when measured
> performance demands it (next part).

## Part 3 — When to denormalize

Normalization optimizes **writes/integrity**; sometimes you trade it for **read performance**:

```text
DENORMALIZATION = intentionally duplicating data to avoid expensive joins/aggregations
   e.g. store order_count on the user row instead of COUNT()ing orders every read
   e.g. a "reporting" table pre-aggregated for dashboards
TRADE-OFF: faster reads, BUT you must keep the duplicate in sync (triggers/app logic) — the
   very anomaly normalization prevents. Do it ONLY when:
   - reads vastly outnumber writes AND the join/aggregation is a measured bottleneck
   - and you have a reliable way to keep the denormalized copy consistent
```

The discipline: **normalize first, denormalize later with evidence.** Premature denormalization
reintroduces the consistency bugs normalization solved. OLAP/warehouses are often **intentionally
denormalized** (star schemas) because they're read-heavy and rebuilt from the normalized source —
that's the right context for it.

## Part 4 — Constraints and relationships

**Constraints** make the **database** enforce integrity — far more reliable than hoping application
code is correct everywhere:

```sql
CREATE TABLE orders (
  id          bigserial PRIMARY KEY,
  user_id     bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,  -- FK + referential integrity
  total       numeric(10,2) NOT NULL CHECK (total >= 0),               -- CHECK: no negative totals
  status      text NOT NULL DEFAULT 'pending',
  email       text UNIQUE,                                              -- UNIQUE
  created_at  timestamptz NOT NULL DEFAULT now()
);
```

```text
NOT NULL    column must have a value
UNIQUE      no duplicate values (e.g. email)
PRIMARY KEY  unique + not null (row identity)
FOREIGN KEY  must reference an existing row (referential integrity); ON DELETE CASCADE/RESTRICT/SET NULL
CHECK       a condition each row must satisfy (total >= 0, status IN (...))
DEFAULT     a value when none supplied
```

**Modeling relationships:**

```text
1:1     a user has one profile → profile.user_id UNIQUE FK (or same PK)
1:MANY  a user has many orders → orders.user_id FK (the "many" side holds the key)  ← most common
MANY:MANY students↔courses → a JUNCTION table enrollments(student_id, course_id) with two FKs
```

> [!TIP]
> **Enforce integrity with constraints in the database, not just application code.** A `FOREIGN KEY`
> guarantees no orphaned order can ever reference a non-existent user; a `CHECK` makes a negative
> total impossible; `NOT NULL`/`UNIQUE` stop whole classes of bugs — regardless of which app, script,
> or admin touches the data. App-only validation is bypassed by the next service, migration, or
> manual fix that forgets it. The database is the **last line of defense** for data correctness;
> constraints are cheap and make bad data structurally impossible.

## Part 5 — Migrations: evolving the schema

Schemas change over time; **migrations** are versioned, repeatable changes (the IaC idea for
schemas):

```text
MIGRATION = a versioned script that changes the schema (add column, table, index, constraint)
   - stored in Git, applied in order, tracked (which have run) — like Terraform for your DB
   - tools: Flyway, Liquibase, Alembic, Rails/Django migrations, Prisma, golang-migrate
SAFE MIGRATION practices (esp. on live DBs):
   - additive first (add nullable column) → backfill → enforce (the "expand/contract" pattern)
   - avoid long locks on big tables (add indexes CONCURRENTLY; batch backfills)
   - make changes BACKWARD-COMPATIBLE so old + new app versions both work during a rolling deploy
   - always reversible / have a rollback plan; test on a copy first
```

Migrations make schema changes **version-controlled, reviewable, and reproducible** — never run ad-
hoc `ALTER TABLE` on production by hand. The **expand/contract** pattern (add new → migrate data →
remove old, in separate deploys) lets you change schemas with **zero downtime** during rolling
deployments (recall the Kubernetes/CI-CD lessons — old and new code run simultaneously).

## Hands-on lab

```bash
docker run -d --name pg -e POSTGRES_PASSWORD=secret -p 5432:5432 postgres:16
sleep 4
q() { docker exec -i pg psql -U postgres -tA -c "$1"; }

# 1. A normalized schema with constraints + relationships
q "CREATE TABLE users(id bigserial PRIMARY KEY, name text NOT NULL, email text UNIQUE NOT NULL);"
q "CREATE TABLE orders(
     id bigserial PRIMARY KEY,
     user_id bigint NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     total numeric(10,2) NOT NULL CHECK (total >= 0),
     created_at timestamptz NOT NULL DEFAULT now());"
# many:many via a junction table
q "CREATE TABLE tags(id bigserial PRIMARY KEY, name text UNIQUE);"
q "CREATE TABLE order_tags(order_id bigint REFERENCES orders(id), tag_id bigint REFERENCES tags(id),
     PRIMARY KEY(order_id, tag_id));"

# 2. Constraints in action (each rejects bad data)
q "INSERT INTO users(name,email) VALUES ('Ada','a@x.io');"
q "INSERT INTO orders(user_id,total) VALUES (1,-5);"   2>&1 | grep -i check   && echo ">> CHECK blocked negative total"
q "INSERT INTO orders(user_id,total) VALUES (999,5);"  2>&1 | grep -i foreign && echo ">> FK blocked orphan order"
q "INSERT INTO users(name,email) VALUES ('Eve','a@x.io');" 2>&1 | grep -i unique && echo ">> UNIQUE blocked dup email"

# 3. ON DELETE CASCADE: deleting a user removes their orders
q "INSERT INTO orders(user_id,total) VALUES (1,10),(1,20);"
q "DELETE FROM users WHERE id=1;"
echo "orders left after deleting the user: $(q 'SELECT count(*) FROM orders;')"   # 0 (cascaded)

# 4. A simple "migration": add a column safely (additive, nullable), then backfill
q "ALTER TABLE users ADD COLUMN country text;"                 # additive, backward-compatible
q "UPDATE users SET country='unknown' WHERE country IS NULL;"  # backfill
# (a later migration could add NOT NULL once all rows are populated — expand/contract)

docker rm -f pg
```

```text
5. NORMALIZE exercise — given an un-normalized table:
   orders(id, customer_name, customer_email, product_name, product_price, qty)
   split it into 3NF tables and list the keys/relationships.
```

## Exercises

1. Choose appropriate types for: money, a timestamp, a flexible attribute bag, a boolean flag.
2. Explain surrogate vs natural primary keys and when to use each.
3. Take an un-normalized table to 3NF and explain the update anomaly you removed.
4. Give a justified example of denormalization and how you'd keep it consistent.
5. Add NOT NULL/UNIQUE/FK/CHECK constraints to a table and show each rejecting bad data.
6. Model 1:1, 1:many, and many:many relationships with the correct keys/junction table.

## Troubleshooting

- **Inconsistent duplicated data** — un-normalized. *Fix:* normalize; store each fact once; relate
  by key.
- **Orphaned/invalid rows** — no FK/CHECK. *Fix:* add foreign keys and CHECK constraints.
- **Money rounding errors** — used float. *Fix:* `numeric/decimal`.
- **Premature denormalization bugs** — duplicates out of sync. *Fix:* normalize first; denormalize
  only with evidence + sync.
- **Ad-hoc `ALTER` broke prod** — no migrations. *Fix:* versioned migrations; expand/contract;
  backward-compatible.
- **Migration locked a huge table** — *Fix:* additive changes, `CREATE INDEX CONCURRENTLY`, batched
  backfills.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Justify briefly.

1. Why use `numeric` for money instead of float?
2. Surrogate vs natural primary key — trade-offs?
3. What does normalization prevent, with an example anomaly?
4. When is denormalization justified, and what's the risk?
5. Name four constraint types and what each enforces.
6. Why enforce integrity in the DB, not just the app?
7. How do you model a many:many relationship?
8. What are migrations and the expand/contract pattern?
9. **Practical:** add constraints and show them rejecting bad data.
10. **Practical:** normalize an un-normalized table to 3NF.

## Solutions & validation

1. Floats cause rounding errors; `numeric/decimal` is exact.
2. Surrogate (auto id) = stable/simple (default); natural (email) = meaningful but can change/break
   refs.
3. Redundancy/update anomalies — e.g. duplicated customer email going stale on update.
4. When reads dominate and a join/aggregation is a measured bottleneck; risk = keeping duplicates in
   sync.
5. NOT NULL, UNIQUE, FOREIGN KEY, CHECK (and PRIMARY KEY/DEFAULT).
6. The DB is the last line of defense — constraints hold regardless of which code/admin touches data.
7. A **junction table** with foreign keys to both sides (composite PK).
8. Versioned schema-change scripts; expand/contract = add new → backfill → remove old across deploys
   (zero downtime).
9. **Validation:** CHECK/FK/UNIQUE each block bad inserts (see lab).
10. **Validation:** customers/products/orders(+line items) with keys, each fact once.

> [!TIP]
> A durable schema: right **types** (decimal for money, tz-aware timestamps), a **primary key** per
> table (surrogate by default), **~3NF** so each fact lives once, **constraints** (FK/CHECK/UNIQUE/
> NOT NULL) making bad data impossible at the DB level, correct **relationship modeling** (junction
> tables for many:many), and **versioned migrations** (expand/contract) to evolve safely. Get the
> schema right and correct application code becomes the easy path — get it wrong and you fight data
> bugs forever.

## What's next

Next: **Lesson 1804 — Indexing & Query Performance.** Making queries fast: how indexes work (B-trees),
when they help and hurt, reading EXPLAIN plans, avoiding full table scans, composite and covering
indexes, and the most common performance pitfalls — turning slow queries into fast ones.
