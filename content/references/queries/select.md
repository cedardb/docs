---
title: "Reference: SELECT"
linkTitle: "SELECT"
---

```sql
-- Get all info about a specific movie
select * from movies where id = 42;
-- Selecting specific columns is more robust against schema changes and reduces I/O
select name, length from movies where id = 42;
```

{{< callout type="info" >}}
For fast single-element access with `where`, consider specifying `id` as primary key or adding an explicit index.
{{< /callout >}}

You can also use [expressions](../../expressions) or [functions](/docs/references/functions) to transform your data:

```sql
select date_trunc('month', release_date) from movies;
```

For many data-specific operations, executing them in the database can be more efficient.

## DISTINCT

`DISTINCT` removes duplicate rows from the result.
`DISTINCT ON (<expressions>)` keeps only the first row of each group of rows with equal values of the expressions.
Use `ORDER BY` to define which row is the first:

```sql
CREATE TABLE measurements (tree_id int, measured date, height_m numeric);

-- The latest measurement for each tree
SELECT DISTINCT ON (tree_id) tree_id, measured, height_m
FROM measurements
ORDER BY tree_id, measured DESC;
```

With `SELECT DISTINCT`, the expressions in `ORDER BY` must appear in the select list.

## VALUES and TABLE

`VALUES` produces rows from literal values, either as a standalone statement or in the `FROM` clause:

```sql
SELECT * FROM (VALUES (1, 'Oak'), (2, 'Ash')) AS t(id, species);
```

`TABLE <name>` is short for `SELECT * FROM <name>`.

To store the result of a query in a new table, use [`SELECT INTO` or `CREATE TABLE AS`](/docs/references/objects/tables#create-table-as).

## Row locking

`SELECT ... FOR UPDATE` and `FOR NO KEY UPDATE` lock the selected rows of base tables, including `OF`, `NOWAIT`, and `SKIP LOCKED`.
CedarDB never waits for a row lock: if another transaction holds a conflicting lock or has modified the row, the statement fails immediately with a conflict error. See [Row locks](/docs/references/transactions/#row-locks) for the behavior and the supported variants.

## Permissions

- `SELECT`, `TABLE`, and every table referenced in a query, including tables in subqueries and CTEs, require the `SELECT` privilege on that table and the `USAGE` privilege on its schema.
  Without it, the query fails with `permission denied for table '<name>'`.
- `FOR UPDATE` and `FOR NO KEY UPDATE` require both the `SELECT` and the `UPDATE` privilege on the locked table.
- `SELECT INTO` requires the `CREATE` privilege on the target schema, like `CREATE TABLE AS`. `SELECT INTO TEMP` requires the `TEMPORARY` privilege on the database, which every role has by default.
- `VALUES` and queries without tables need no privileges.

## PostgreSQL Differences

- `FOR SHARE` and `FOR KEY SHARE` are not supported, and `FOR UPDATE` never waits for a lock held by another transaction.
- `FOR UPDATE` on a subquery in `FROM` is not supported.
