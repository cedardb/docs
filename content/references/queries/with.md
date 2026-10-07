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

`WITH RECURSIVE` defines a CTE that references itself.
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

`MATERIALIZED` and `NOT MATERIALIZED` are accepted, e.g., `WITH c AS MATERIALIZED (...)`.
CedarDB's optimizer decides on its own how to evaluate the CTE.

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

{{< callout type="warning" >}}
Support for DML in CTEs is still limited. Read the section below carefully.
{{< /callout >}}

A query can contain only one data-modifying statement.
Combining several, e.g., a `DELETE` in a CTE with an `INSERT` in the main query, fails.

CedarDB runs the data-modifying statement only as far as the main query reads its rows.
If the main query does not reference the CTE, the statement does not run at all.
If it reads only some rows, e.g., with `LIMIT`, only some rows are modified.
Always give the statement a `RETURNING` clause and read all of its rows, as `count(*)` does in the example above.

## PostgreSQL Differences

- The `SEARCH` and `CYCLE` clauses of recursive CTEs are not supported.
- A query can contain only one data-modifying statement.
- A data-modifying statement in `WITH` is not always executed to completion. PostgreSQL always runs it completely, even if the main query does not read its output.
- A data-modifying statement in `WITH` must have a `RETURNING` clause.
