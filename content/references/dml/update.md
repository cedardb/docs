---
title: "Reference: Update Statement"
linkTitle: "Update"
---

With Update, you can change the content of rows of a table.

Usage example:

```sql
update movies
set title = 'The Hitchhiker''s Guide to the Galaxy'
where id = 42;
```

{{< callout type="warning" >}}
Executing an update without a `where` clause will update *all* rows of a table.
When writing update queries by hand, we recommend executing the query once with a read-only select to judge the impact
of the changes.
{{< /callout >}}

## Update Using Queries

You can also use arbitrary queries as sub-selects to store the result of a query:

```sql
update movies m
set gross_opening_week = (
    select sum(revenue)
    from box_offices bo
    where bo.movie_id = m.id
      and bo.date between m.release_date and m.release_date + interval '1 week'
);
```

Take values from other tables with `FROM`:

```sql
CREATE TABLE trees (id int, height_m numeric);
CREATE TABLE measurements (tree_id int, height_m numeric);

UPDATE trees
SET height_m = m.height_m
FROM measurements m
WHERE trees.id = m.tree_id;
```

Assign several columns at once, or reset a column to its default value:

```sql
UPDATE trees SET (height_m, id) = (12.5, 7) WHERE id = 1;
UPDATE trees SET height_m = DEFAULT WHERE id = 2;
```

## Returning Updated Rows

Update statements can also report the changed values, which might be useful if you update rows with a sub-select:

```sql
...
returning m.name, m.gross_opening_week;
```

## Serialization Errors

Concurrent updates to rows might cause serialization failures, which show up in the form of:

```text
ERROR:   conflict with concurrent transaction
```

This is caused by CedarDB's MVCC [transaction isolation](/docs/references/transactions), where a
transaction will read the latest committed version.
When two updates run concurrently on the same data, the second update will not observe the updated version and would
blindly overwrite the row.
CedarDB prohibits such *lost updates* and will abort the second transaction, resulting in the error message above.

{{< callout type="info" >}}
When updating values concurrently, your application needs to handle transaction aborts.
{{< /callout >}}

## Permissions

To update a table, you need the `UPDATE` privilege on it, and `USAGE` on its schema.
If the statement reads columns of the table, for example in `WHERE`, in a `SET` expression, or in `RETURNING`, you also need the `SELECT` privilege.
Subqueries and `FROM` tables require the privileges to read them.

## PostgreSQL Differences

- `RETURNING` requires the `SELECT` privilege on the table, even if it does not reference a column, such as `RETURNING 1`.
  PostgreSQL only requires `SELECT` on the columns that `RETURNING` references.
- Assigning a column list from a subquery, `SET (a, b) = (SELECT ...)`, is not supported.
- `WHERE CURRENT OF` is not supported.
