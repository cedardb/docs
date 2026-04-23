---
title: "Reference: Tables"
linkTitle: "Tables"
weight: 10
---

## CREATE TABLE

Create table creates a new relation with the specified columns.

Usage example:

```sql
create table species (
    id int primary key,
    common_name text,
    botanical_name text not null,
    genus_id int foreign key references genus
);
```

After executing this statement, you can find the created table in the `pg_tables` system view.

### Columns

Column definitions are specified as: `name type constraint`.
Column names can be any identifier; however, for arbitrary character sequences, you need to enclose them in double
quotes: `"complex name""`.
You can find a list of supported types in the [data types reference](/docs/references/datatypes).

CedarDB supports the following constraints, which can either be specified per-column, or separately when referencing
multiple columns:

* `unique(...)`
* `primary key(...)`
* `foreign key(...) references other_table(...)`
* `not null`

The `unique`, `primary key`, `foreign key`, and `check` constraints can optionally be given a name using the `constraint` keyword:

```sql
create table orders (
    id        int,
    customer  int,
    item      int,
    constraint orders_pk primary key (id),
    constraint orders_customer_fk foreign key (customer) references customers (id),
    constraint orders_item_fk foreign key (item) references items (id),
    constraint orders_unique unique (customer, item),
    constraint orders_id_positive check (id > 0)
);
```

The `constraint <name>` part can be omitted entirely, in which case CedarDB automatically assigns a default name using the same conventions as PostgreSQL:
- Primary key: `tablename_pkey`
- Unique: `tablename_colname_key`
- Foreign key: `tablename_colname_fkey`
- Check: `tablename_colname_check`

These default names can be used just like explicit names, e.g., to drop a constraint with `alter table ... drop constraint <name>`.
Naming is not supported for `not null`.

### Options

Create a temporary table that will be dropped when the current client disconnects:

```sql
create temp table table_name (...);
```

Do not throw an error if a table with the same name already exists:

```sql
create table table_name if not exists (...);
```

Create a table that stores all compressed data on remote server, which was created with name `remote_storage` (see [create server](/docs/references/advanced/createserver) for more infos):

```sql
create table table_name (...) with (server = remote_storage);
```



### Permissions

To create a role, you need to have superuser or `createrole` permissions.

## CREATE TABLE AS

`Create table as` allows creating tables with an inferred schema from the output of a query.

Usage example:

```sql
create table recent_movies as 
   select * 
   from movies
   where release_date >= now()::date - interval '2' year;
```

This statement creates a table which resembles the output schema (names and data types) of the query.
Then, the output of the `select` query is stored in this newly created table.

### Select into

CedarDB also supports the alternative `select into` syntax for compatibility with PostgreSQL:

```sql
select *
into recent_movies
from movies
where release_date >= now()::date - interval '2' year;
```

### Caveats

The data types and names of the created columns can be surprising for queries with multiple expressions.
E.g., CedarDB promotes the precision of numeric types to avoid overflows,
or infers that columns are guaranteed not-null, e.g., `release_date` in the example above (due to the `>=` predicate).
For more control over the schema, consider using the regular
[create table](/docs/references/objects/tables) statement.

## ALTER TABLE

Alter table allows modifying the definition of a table.
See [PostgreSQL: ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html) for the PostgreSQL documentation.

### Column statements

#### `RENAME COLUMN`
```sql
ALTER TABLE IF EXISTS movies RENAME COLUMN runlength TO duration;
```
Rename column of table with `table_name` and `current_column_name` to the `new_column_name`.
If exists checks if the table exists and only tries to rename in the case of existence.

### Constraint statements

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
