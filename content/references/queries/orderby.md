---
title: "Reference: ORDER BY and LIMIT"
linkTitle: "ORDER BY / LIMIT"
---

`ORDER BY` sorts the result of a query.
`LIMIT` and `OFFSET` return only a part of the sorted result.
Without `ORDER BY`, the order of the result rows is not defined.

```sql
CREATE TABLE trees (id int, species text, height_m numeric);
INSERT INTO trees VALUES (1, 'Oak', 21.5), (2, 'Birch', 9.0), (3, 'Ash', NULL);

-- The two tallest trees
SELECT species, height_m FROM trees
ORDER BY height_m DESC NULLS LAST
LIMIT 2;
```

```text
 species | height_m
---------+-----------
 Oak     | 21.500000
 Birch   |  9.000000
```

## ORDER BY

```text
ORDER BY <expression> [ ASC | DESC ] [ NULLS { FIRST | LAST } ] [, ...]
```

You can sort by any expression, by an output column name or alias, or by the position of an output column (`ORDER BY 2`).
`ASC` is the default.
By default, null values sort as if they were larger than all other values: last for `ASC`, first for `DESC`.
Use `NULLS FIRST` or `NULLS LAST` to change this.

For `SELECT DISTINCT`, the `ORDER BY` expressions must appear in the select list.

## LIMIT and OFFSET

```text
LIMIT { <count> | ALL }
OFFSET <start> [ ROW | ROWS ]
FETCH { FIRST | NEXT } [ <count> ] { ROW | ROWS } ONLY
```

`OFFSET` skips the given number of rows, and `LIMIT` returns at most the given number of rows.
`FETCH FIRST <n> ROWS ONLY` is the SQL-standard spelling of `LIMIT`.

```sql
CREATE TABLE trees (id int, species text, height_m numeric);

-- Rows 11 to 20
SELECT * FROM trees ORDER BY id LIMIT 10 OFFSET 10;
SELECT * FROM trees ORDER BY id OFFSET 10 ROWS FETCH NEXT 10 ROWS ONLY;
```

`LIMIT ALL` and `LIMIT NULL` return all rows.

Top-k queries with `ORDER BY` and `LIMIT` can use an [index](/docs/references/objects/indexes#column-order) with a matching sort order.

## PostgreSQL Differences

- `FETCH FIRST ... WITH TIES` is not supported.
- `ORDER BY ... USING <operator>` is not supported.
- A negative `LIMIT` or `FETCH FIRST` count returns no rows, and a negative `OFFSET` is treated as 0. PostgreSQL rejects negative values with an error.
