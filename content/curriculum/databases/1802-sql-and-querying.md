---
title: "Databases — SQL & Querying"
slug: "databases-sql-and-querying"
track: "databases"
trackName: "Databases & Data Infrastructure"
module: "Database Foundations"
order: 1802
level: "Intermediate"
difficulty: "Intermediate"
distribution: "Cross-platform"
category: "Data"
tags: [databases, sql, joins, aggregation, cte, querying]
cover: "/covers/curriculum/databases.svg"
estMinutes: 65
status: "published"
summary: "The language of relational data: SELECT and filtering, the join types, aggregation and GROUP BY, subqueries and CTEs, window functions at a glance, and writing correct, readable queries — the indispensable skill for anyone who works with data."
seoTitle: "Databases 2: SQL & Querying (joins, GROUP BY, CTEs, window functions)"
seoDescription: "Practical SQL: SELECT/WHERE, INNER/LEFT joins, GROUP BY and aggregates, subqueries and CTEs, window functions, and readable queries. Hands-on lab and assessment."
---

**SQL** is the most durable skill in computing — declarative, ~50 years old, and used everywhere
from a tiny app to a petabyte warehouse. This lesson builds practical querying fluency: **SELECT and
filtering**, the **join types** (the part everyone trips on), **aggregation with GROUP BY**,
**subqueries and CTEs** for composing queries, a glance at **window functions**, and the habits of
**correct, readable** SQL. You'll work hands-on against PostgreSQL. Master this and you can answer
almost any question your data holds.

## Learning objectives

By the end of this lesson you will be able to:

- Write **SELECT** queries with filtering, sorting, and limiting.
- Use the **join types** correctly (INNER, LEFT, etc.).
- Aggregate with **GROUP BY/HAVING** and aggregate functions.
- Compose queries with **subqueries** and **CTEs**.
- Recognize **window functions** and write **readable** SQL.

## Part 1 — SELECT, filter, sort, limit

```sql
SELECT name, email                    -- columns (or * for all)
FROM users
WHERE created_at > '2026-01-01'       -- filter rows
  AND status = 'active'
ORDER BY created_at DESC              -- sort
LIMIT 10;                             -- cap rows

-- Useful predicates:
WHERE age BETWEEN 18 AND 65
WHERE country IN ('US','CA','UK')
WHERE name LIKE 'A%'                  -- pattern (ILIKE = case-insensitive in Postgres)
WHERE email IS NOT NULL               -- NULL needs IS / IS NOT (not = )
WHERE total > 100 OR vip = true
```

SQL is **declarative** — you describe *what* you want, the database figures out *how*. **`WHERE`**
filters rows, **`ORDER BY`** sorts, **`LIMIT`** caps results. A key gotcha: **NULL** means "unknown"
and doesn't compare with `=` — use **`IS NULL`/`IS NOT NULL`** (and beware `NULL` in conditions
silently dropping rows).

## Part 2 — Joins

Joins combine rows from multiple tables on a relationship — the heart of relational querying and the
most common point of confusion:

```sql
-- INNER JOIN: only rows that match in BOTH tables
SELECT u.name, o.total
FROM users u
JOIN orders o ON o.user_id = u.id;          -- users WITH orders only

-- LEFT JOIN: ALL left rows; NULLs where no right match
SELECT u.name, o.total
FROM users u
LEFT JOIN orders o ON o.user_id = u.id;      -- ALL users, even those with no orders

-- Find users with NO orders (anti-join pattern)
SELECT u.name FROM users u
LEFT JOIN orders o ON o.user_id = u.id
WHERE o.id IS NULL;                          -- left rows with no match
```

```text
INNER JOIN   intersection — rows matching in both
LEFT JOIN    all left rows + matches (NULLs for unmatched right)  ← most common after INNER
RIGHT JOIN   all right rows + matches (rarely used; flip to LEFT)
FULL JOIN    all rows from both, NULLs where no match
CROSS JOIN   every combination (cartesian) — usually a mistake if unintended
```

> [!IMPORTANT]
> **The most common SQL bug is the wrong join type and a missing/ambiguous join condition.** An
> `INNER JOIN` silently **drops** rows with no match (e.g. users who never ordered disappear); a
> `LEFT JOIN` keeps them with NULLs. Always know whether you want "only matches" (INNER) or "all of
> the left side regardless" (LEFT). And **always specify the `ON` condition** — forgetting it (or
> joining on the wrong column) produces a CROSS JOIN/cartesian explosion or wrong results. When a
> query returns too few or too many rows, suspect the join first.

## Part 3 — Aggregation and GROUP BY

Aggregate functions compute over groups of rows:

```sql
-- Aggregate functions over the whole table
SELECT count(*), sum(total), avg(total), min(total), max(total) FROM orders;

-- GROUP BY: aggregate PER group
SELECT user_id, count(*) AS order_count, sum(total) AS spent
FROM orders
GROUP BY user_id                              -- one row per user_id
HAVING sum(total) > 50                         -- filter GROUPS (WHERE filters rows, HAVING filters groups)
ORDER BY spent DESC;

-- Join + group: spend per user name
SELECT u.name, count(o.id) AS orders, coalesce(sum(o.total),0) AS spent
FROM users u LEFT JOIN orders o ON o.user_id = u.id
GROUP BY u.name;
```

The rules: every column in `SELECT` must be **either in `GROUP BY` or inside an aggregate**.
**`WHERE` filters rows before grouping; `HAVING` filters after** (on aggregate results). `count(*)`
counts rows; `count(col)` counts non-NULLs. `coalesce(x, 0)` turns NULLs (e.g. from a LEFT JOIN with
no orders) into a default.

## Part 4 — Subqueries and CTEs

For composing complex queries, **subqueries** (nested) and **CTEs** (named, readable):

```sql
-- Subquery in WHERE: users who spent above average
SELECT name FROM users WHERE id IN (
  SELECT user_id FROM orders GROUP BY user_id HAVING sum(total) > (SELECT avg(total) FROM orders)
);

-- CTE (Common Table Expression): the SAME, but READABLE (build up in steps)
WITH user_spend AS (
  SELECT user_id, sum(total) AS spent FROM orders GROUP BY user_id
)
SELECT u.name, us.spent
FROM users u JOIN user_spend us ON us.user_id = u.id
WHERE us.spent > (SELECT avg(spent) FROM user_spend)
ORDER BY us.spent DESC;
```

**CTEs (`WITH`)** name intermediate results, letting you build a complex query in **readable steps**
instead of deeply nested subqueries — hugely improving clarity and maintainability. Prefer CTEs for
anything non-trivial; they read top-to-bottom like a pipeline.

> [!TIP]
> Use **CTEs (`WITH ... AS`)** to make complex queries readable — build the result up in named steps
> rather than nesting subqueries three levels deep. A CTE reads like a pipeline (here's the spend per
> user → now join names → now filter above average), which is far easier to write, debug, and review
> than an inside-out subquery. Modern databases optimize CTEs well, so favor clarity. The same SQL
> craftsmanship that makes code reviewable (small steps, good names) applies to queries.

## Part 5 — Window functions and readable SQL

**Window functions** compute across a set of rows **related to the current row** without collapsing
them (unlike GROUP BY):

```sql
-- Rank orders per user by total; running totals; row numbers
SELECT user_id, total,
       row_number() OVER (PARTITION BY user_id ORDER BY total DESC) AS rank_in_user,
       sum(total)   OVER (PARTITION BY user_id) AS user_total,
       sum(total)   OVER (ORDER BY id) AS running_total
FROM orders;
```

Window functions (`OVER (PARTITION BY ... ORDER BY ...)`) do rankings, running totals, moving
averages, and "compare to the group" — keeping individual rows. They're the tool for "top N per
group," "% of total," and time-series calculations.

**Readable SQL** habits: uppercase keywords, one clause per line, meaningful aliases, CTEs over deep
nesting, and format consistently. SQL you can read is SQL you can trust.

## Hands-on lab

```bash
docker run -d --name pg -e POSTGRES_PASSWORD=secret -p 5432:5432 postgres:16
sleep 4
q() { docker exec -i pg psql -U postgres -tA -c "$1"; }

# Seed data
q "CREATE TABLE users(id serial PRIMARY KEY, name text, country text);"
q "CREATE TABLE orders(id serial PRIMARY KEY, user_id int, total numeric, created date);"
q "INSERT INTO users(name,country) VALUES ('Ada','US'),('Bob','UK'),('Cy','US');"
q "INSERT INTO orders(user_id,total,created) VALUES (1,42,'2026-01-05'),(1,8,'2026-02-01'),(2,15,'2026-01-20');"
#   note: user Cy (id 3) has NO orders — watch the join behavior

# 1. INNER vs LEFT join (Cy disappears in INNER, appears in LEFT)
echo "INNER (only users with orders):"; q "SELECT u.name,o.total FROM users u JOIN orders o ON o.user_id=u.id ORDER BY u.name;"
echo "LEFT (all users):"; q "SELECT u.name,o.total FROM users u LEFT JOIN orders o ON o.user_id=u.id ORDER BY u.name;"

# 2. Users with NO orders (anti-join)
echo "Users with no orders:"; q "SELECT u.name FROM users u LEFT JOIN orders o ON o.user_id=u.id WHERE o.id IS NULL;"

# 3. Aggregation: spend per user, only > 10
echo "Spenders > 10:"; q "SELECT u.name, sum(o.total) AS spent FROM users u JOIN orders o ON o.user_id=u.id GROUP BY u.name HAVING sum(o.total)>10;"

# 4. CTE: spend vs average
echo "Above-average spenders (CTE):"
q "WITH s AS (SELECT user_id, sum(total) spent FROM orders GROUP BY user_id)
   SELECT u.name, s.spent FROM users u JOIN s ON s.user_id=u.id WHERE s.spent > (SELECT avg(spent) FROM s);"

# 5. Window function: rank a user's orders
echo "Order rank per user:"
q "SELECT user_id, total, row_number() OVER (PARTITION BY user_id ORDER BY total DESC) AS rnk FROM orders;"

docker rm -f pg
```

## Exercises

1. Write a filtered, sorted, limited SELECT with at least three predicates (incl. a NULL check).
2. Demonstrate INNER vs LEFT join on data where some left rows have no match; explain the difference.
3. Write an anti-join to find rows with no related match.
4. Aggregate with GROUP BY + HAVING and explain WHERE vs HAVING.
5. Rewrite a nested subquery as a CTE and explain the readability gain.
6. Use a window function for a "rank within group" or running total.

## Troubleshooting

- **Rows missing unexpectedly** — INNER join dropped non-matches. *Fix:* LEFT join if you want all
  left rows.
- **Cartesian explosion / too many rows** — missing/wrong `ON`. *Fix:* specify the join condition;
  check keys.
- **NULL comparisons return nothing** — used `= NULL`. *Fix:* `IS NULL`/`IS NOT NULL`; `coalesce`.
- **"column must appear in GROUP BY"** — non-aggregated column. *Fix:* add to GROUP BY or aggregate
  it.
- **WHERE on an aggregate fails** — *Fix:* use HAVING for aggregate conditions.
- **Unreadable nested subqueries** — *Fix:* refactor into CTEs.

## Assessment

**Passing requirement: at least 8 of 10 correct (80%).** Justify briefly.

1. What does declarative SQL mean?
2. How do you correctly test for NULL?
3. Difference between INNER and LEFT join?
4. How do you find rows with no related match?
5. Difference between WHERE and HAVING?
6. What rule governs columns with GROUP BY?
7. What advantage do CTEs give over subqueries?
8. What do window functions do that GROUP BY doesn't?
9. **Practical:** show INNER vs LEFT join on data with unmatched rows.
10. **Practical:** write a CTE that compares each user to the average.

## Solutions & validation

1. You describe **what** result you want; the engine decides **how** to execute it.
2. With **`IS NULL` / `IS NOT NULL`** (NULL doesn't compare with `=`).
3. INNER returns only matching rows in both; LEFT returns all left rows (+NULLs for unmatched).
4. **LEFT JOIN ... WHERE right.id IS NULL** (anti-join).
5. WHERE filters **rows** (before grouping); HAVING filters **groups** (on aggregates).
6. Every selected column must be **in GROUP BY or inside an aggregate**.
7. **Readability** — named, sequential steps instead of deep nesting.
8. Compute across related rows **without collapsing** them (rank/running totals per partition).
9. **Validation:** Cy appears only in the LEFT join (see lab).
10. **Validation:** CTE `s` + filter `spent > (SELECT avg(spent) FROM s)`.

> [!TIP]
> SQL fluency rests on a few things done right: know your **join type** (INNER drops, LEFT keeps),
> handle **NULL** with `IS`, split **WHERE vs HAVING**, and compose complex logic with **CTEs** (and
> window functions for per-group calculations). Write it **readable** — uppercase keywords, one
> clause per line, named CTE steps. These are the everyday tools for turning a database full of rows
> into answers, and they transfer to every SQL engine you'll ever touch.

## What's next

Next: **Lesson 1803 — Schema Design & Normalization.** Building data models that last: data types,
primary and foreign keys, normalization (and when to denormalize), constraints for integrity,
relationships (1:1, 1:many, many:many), and designing a schema for a real application.
