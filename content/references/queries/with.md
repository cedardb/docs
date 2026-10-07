---
title: "Reference: WITH (CTEs)"
linkTitle: "WITH"
---

For complex queries, `with` subqueries, aka *common table expressions* (CTEs) are a good way to structure your query.
They help to build small, self-contained logic blocks that can be named.
This allows to factor out parts of a query that can be independently developed and verified.

```sql
-- All good movies with a high rating
with good_movies as (select * from movies where rating >= 8.0)
select * from good_movies m, producers p
where m.producer_id = p.id;
```

{{< callout type="info" >}}
You can use CTEs in CedarDB liberally.
They have no performance overhead for your queries and make the structure much more understandable.
CedarDB automatically inlines CTEs and optimizes across all subqueries.
{{< /callout >}}

## Recursive CTEs

`WITH RECURSIVE` defines a CTE that can reference itself.
The first part of the `UNION` is evaluated once. The second part is evaluated repeatedly on the rows of the previous iteration until it returns no rows:

```sql
CREATE TABLE taxonomy (id int, parent_id int, name text);
INSERT INTO taxonomy VALUES (1, NULL, 'Plants'), (2, 1, 'Trees'), (3, 2, 'Oaks');

WITH RECURSIVE lineage (id, name, depth) AS (
    SELECT id, name, 0 FROM taxonomy WHERE parent_id IS NULL
  UNION ALL
    SELECT t.id, t.name, l.depth + 1
    FROM taxonomy t JOIN lineage l ON t.parent_id = l.id
)
SELECT * FROM lineage ORDER BY depth;
```

With `UNION` instead of `UNION ALL`, CedarDB discards duplicate rows, which stops cycles.

By default, CedarDB's optimizer decides on its own whether to compute a CTE once or to inline it into the query.
`MATERIALIZED`, e.g., `WITH c AS MATERIALIZED (...)`, is accepted and does not change this.
`NOT MATERIALIZED` always inlines the CTE.

## Data-modifying statements in WITH

A CTE can contain an `INSERT`, `UPDATE`, or `DELETE` statement with a `RETURNING` clause.
The main query then reads the returned rows:

```sql
CREATE TABLE seedlings (id int, species text, height_cm int);
INSERT INTO seedlings VALUES (1, 'Oak', 12), (2, 'Ash', 30);

WITH transplanted AS (
    DELETE FROM seedlings WHERE height_cm > 25 RETURNING *
)
SELECT count(*) AS transplanted FROM transplanted;
```

```text
 transplanted
--------------
            1
```

A query can contain only one data-modifying statement.
Combining several, e.g., a `DELETE` in a CTE with an `INSERT` in the main query, fails.

## PostgreSQL Differences

- The `SEARCH` and `CYCLE` clauses of recursive CTEs are not supported.
- A query can contain only one data-modifying statement.
- A data-modifying statement in `WITH` must have a `RETURNING` clause.
