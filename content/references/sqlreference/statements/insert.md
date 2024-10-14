---
title: "Reference: Insert Statement"
linkTitle: "Insert"
---

With insert, you can create new rows of a table.

Usage example:

```sql
insert into movies(title, year, length, genre)
values ('Barbie', 2023, 114, 'Comedy'),
       ('The Boy and the Heron', 2023, 124, 'Anime');
```

When inserting many values verbatim, consider using a [copy statement](/docs/references/sqlreference/statements/copy)
instead to reduce parsing overhead.

You can also insert rows from the result of arbitrary queries:

```sql
insert into products(name, date, price) 
select name, now(), price * 1.1
from products;
```

## Insert Column Names

Insert statements have an optional list of column names in the insert target in
parentheses (`movies(title, year, length, genre)`).
While these names can be omitted, we recommend always explicitly specifying the column names.
Without a column list, swapping similarly typed columns (e.g., year and length) can lead to subtle bugs.
In addition, omitted columns will be filled with default generated values.

## On Conflict

Inserting duplicate values into a table might cause conflicts when the table has a primary key or unique constraint
defined.
The default action for such conflicts is to report an error and abort the current transaction.
Alternatively, you can specify an `on conflict` clause which explicitly handles the conflicting values as an *Upsert*.
The following example inserts two users with unique ids, skipping all tuples with already existing user ids.

```sql
insert into employees(id, name)
values (1, 'Chris'), (2, 'Philipp')
on conflict do nothing;
```

You can find the full documentation for `on conflict` in the [upsert reference](../upsert).

## Returning

Insert also supports a returning clause, which can be helpful to extract generated columns from inserted rows.
For example, when you have a column `id int generated always as identity`, you can return the generated ids:

```sql
insert into movies(title, year, length, genre)
...
returning id;
```

You can also use the returning clause for arbitrary queries on the database state for the inserted values:

```sql
insert into shopping_cart(user_id, product_id, quantity)
values ($1, $2, $3)
returning (
    select sum(p.price * quantity)
    from prices p
    where product_id = p.id
);
```
