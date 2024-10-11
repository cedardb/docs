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

## Returning Updated Rows

Update statements can also report the changed values, which might be useful if you update rows with a sub-select:

```sql
...
returning m.name, m.gross_opening_week;
```

## Serialization Errors

Concurrent updates to rows might cause serialization failures, which show up in the form of:

```
ERROR:   conflict with concurrent transaction
```

This is caused by CedarDB's MVCC [transaction isolation](/docs/references/sqlreference/transaction), where a
transaction will read the latest committed version.
When two updates run concurrently on the same data, the second update will not observe the updated version and would
blindly overwrite the row.
CedarDB prohibits such *lost updates* and will abort the second transaction, resulting in the error message above.

{{< callout type="info" >}}
When updating values concurrently, your application needs to handle transaction aborts.
{{< /callout >}}
