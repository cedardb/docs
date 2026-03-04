---
title: "Reference: Alter Table Statement"
linkTitle: "Alter Table"
---

Alter table allows modifying the definition of a table.
See [PostgreSQL: ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html) for the PostgreSQL documentation.

## Column statememts

#### `RENAME COLUMN`
```sql
ALTER TABLE IF EXISTS movies RENAME COLUMN runlength TO duration;
```
Rename column of table with `table_name` and `current_column_name` to the `new_column_name`.
If exists checks if the table exists and only tries to rename in the case of existence.

## Constraint statements

#### `ADD CONSTRAINT`

Adds a constraint to an existing table.
CedarDB supports named `primary key`, `foreign key`, and `unique` constraints:

```sql
ALTER TABLE orders ADD CONSTRAINT orders_pk primary key (id);
ALTER TABLE orders ADD CONSTRAINT orders_customer_fk foreign key (customer) references customers (id);
ALTER TABLE orders ADD CONSTRAINT orders_unique unique (customer, item);
```

The `CONSTRAINT <name>` part can be omitted entirely, in which case CedarDB automatically assigns a default name using the same conventions as PostgreSQL:
- Primary key: `tablename_pkey`
- Unique: `tablename_colname_key`
- Foreign key: `tablename_colname_fkey`

#### `DROP CONSTRAINT`

Removes a constraint by name, using either an explicit name or the default name:

```sql
ALTER TABLE orders DROP CONSTRAINT orders_unique;
ALTER TABLE orders DROP CONSTRAINT orders_pkey;
```
