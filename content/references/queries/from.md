---
title: "Reference: FROM / JOIN"
linkTitle: "FROM / JOIN"
---

To combine data from multiple tables, you can use `join`s.
Joins can be arbitrarily combined and nested to combine information from different tables.
Joins in CedarDB are very efficient, and, thus, can be arbitrarily nested and combined.

```sql
select *
from movies m, producers p
where m.producer_id = p.id
```

Note that joins only include rows where the condition is true.
If you actually want to strictly add *more* information, you might want to use a `left join`.
E.g., in the above example, indie movies without a producer would not show up.
With a left join, you can add `null` values for movies that have no producer:

```sql
select *
from movies m left join producers p
  on m.producer_id = p.id
```

However, you need to be careful when mixing left (outer) joins with inner joins, since the inner joins would filter out
the `null` values of the outer join.

## Join types

CedarDB supports all standard join types:

| Join                          | Result                                                                             |
|-------------------------------|------------------------------------------------------------------------------------|
| `[INNER] JOIN ... ON`         | Pairs of rows for which the condition is true.                                     |
| `LEFT [OUTER] JOIN`           | All rows of the left table, with null values where no right row matches.           |
| `RIGHT [OUTER] JOIN`          | All rows of the right table, with null values where no left row matches.           |
| `FULL [OUTER] JOIN`           | All rows of both tables, with null values where no partner matches.                |
| `CROSS JOIN`                  | All combinations of rows. Same as listing the tables separated by commas.          |
| `JOIN ... USING (<columns>)`  | Join on equality of the listed columns, which appear only once in the result.      |
| `NATURAL JOIN`                | Join on all columns with the same name.                                            |

```sql
CREATE TABLE trees (id int, species text);
CREATE TABLE measurements (tree_id int, height_m numeric);

SELECT t.species, m.height_m
FROM trees t LEFT JOIN measurements m ON m.tree_id = t.id;
```

## LATERAL

A `LATERAL` subquery can reference columns of tables listed before it in the `FROM` clause.
It is evaluated for each row of those tables:

```sql
CREATE TABLE trees (id int, species text);
CREATE TABLE measurements (tree_id int, measured date, height_m numeric);

-- The latest measurement for each tree
SELECT t.species, latest.height_m
FROM trees t
LEFT JOIN LATERAL (
    SELECT height_m FROM measurements m
    WHERE m.tree_id = t.id
    ORDER BY measured DESC
    LIMIT 1
) latest ON true;
```

## Table functions

Functions that return sets of rows, such as `generate_series` and `unnest`, can be used in the `FROM` clause.
They can also reference columns of preceding tables, like `LATERAL` subqueries.
`WITH ORDINALITY` adds a column with the row number:

```sql
SELECT * FROM unnest(ARRAY['Oak', 'Ash']) WITH ORDINALITY AS s(species, n);
```

```text
 species | n
---------+---
 Oak     | 1
 Ash     | 2
```

## PostgreSQL Differences

- `ROWS FROM (...)` is not supported.
- An alias for the join columns, `JOIN ... USING (...) AS <alias>`, is not supported.
