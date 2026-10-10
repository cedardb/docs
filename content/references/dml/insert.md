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

When inserting many values verbatim, consider using a [copy statement](../copy)
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

## Default Values

Omitted columns get their default value, or null if they have none.
Use the keyword `DEFAULT` to explicitly request the default value for a column, or `DEFAULT VALUES` to insert a row that consists only of defaults:

```sql
CREATE TABLE plantings (id int GENERATED ALWAYS AS IDENTITY, species text DEFAULT 'unknown', planted date DEFAULT current_date);

INSERT INTO plantings (species) VALUES ('Oak');
INSERT INTO plantings (species, planted) VALUES (DEFAULT, '2024-04-01');
INSERT INTO plantings DEFAULT VALUES;
```

For an identity column with `GENERATED ALWAYS`, inserting an explicit value fails.
Use `OVERRIDING SYSTEM VALUE` to insert the given value anyway, or `OVERRIDING USER VALUE` to ignore the given value and use the generated one:

```sql
INSERT INTO plantings (id, species) OVERRIDING SYSTEM VALUE VALUES (1000, 'Ash');
```

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

## Permissions

To insert into a table, you need the `INSERT` privilege on it, and `USAGE` on its schema.
Inserting into a `serial` or identity column also requires `USAGE` on the column's [sequence](/docs/references/objects/sequences#sequence-privileges).
`INSERT ... SELECT` requires the privileges to run the query.
`ON CONFLICT DO NOTHING` without a conflict target needs no further privilege.
A conflict target, such as `ON CONFLICT (id)` or `ON CONFLICT ON CONSTRAINT plants_pkey`, requires the `SELECT` privilege, with both `DO NOTHING` and `DO UPDATE`.
`ON CONFLICT DO UPDATE` also requires the `UPDATE` privilege, and the `SELECT` privilege if it reads columns of the table.
`RETURNING` requires the `SELECT` privilege.

## PostgreSQL Differences

- `RETURNING` requires the `SELECT` privilege on the table, even if it does not reference a column, such as `RETURNING 1`.
  PostgreSQL only requires `SELECT` on the columns that `RETURNING` references.
- `ON CONFLICT ON CONSTRAINT <name>` requires the `SELECT` privilege on the table.
  PostgreSQL requires only `INSERT` (and `UPDATE` for `DO UPDATE`) when no column is read.
- A `WHERE` clause in the conflict target, `ON CONFLICT (<column>) WHERE <predicate>`, is not supported, because CedarDB has no partial indexes.
