---
title: "Reference: Indexes"
linkTitle: "Indexes"
weight: 20
---

Indexes speed up finding indexed values in a table.
An index lookup avoids a full table scan, which improves the runtime of point lookups and selective queries.
Building and maintaining indexes, however, is not free: the index occupies storage, and write operations on indexed tables are a bit slower.

```sql
CREATE TABLE sales (id int, customer_id int, article_id int, amount numeric);
CREATE INDEX ON sales (customer_id, article_id);
```

This indexes the `sales` table on customer and article, which helps to quickly find the orders of a customer.
CedarDB automatically chooses the best index to execute a query.
Use [`EXPLAIN`](/docs/references/utility/explain) to check whether a query uses an index:

```sql
EXPLAIN SELECT * FROM sales WHERE customer_id = 42;
```

After creating an index, you can find it in the `pg_indexes` system view.

## CREATE INDEX

```text
CREATE [ UNIQUE ] INDEX [ CONCURRENTLY ] [ [ IF NOT EXISTS ] <name> ]
    ON [ ONLY ] <table_name> [ USING btree ]
    ( <column_name> [ ASC | DESC ] [ NULLS { FIRST | LAST } ] [, ...] )
```

| Parameter                   | Description                                                                                                      |
|-----------------------------|------------------------------------------------------------------------------------------------------------------|
| `UNIQUE`                    | Reject duplicate values. CedarDB checks the existing rows when you create the index.                             |
| `CONCURRENTLY`              | Accepted for compatibility. CedarDB builds the index non-concurrently and prints a warning.                      |
| `IF NOT EXISTS`             | Do not throw an error if an index with the same name already exists.                                             |
| `<name>`                    | The name of the index. Generated from the table and column names if omitted.                                     |
| `USING`                     | The index method. CedarDB supports B-tree indexes. `hash` is accepted and creates a B-tree index with a warning. |
| `ASC`, `DESC`               | The sort order of the column in the index. The default is `ASC`.                                                 |
| `NULLS FIRST`, `NULLS LAST` | Where null values sort in the index.                                                                             |

Name an index explicitly:

```sql
CREATE TABLE sales (id int, customer_id int, article_id int, amount numeric);
CREATE INDEX complaints_index ON sales (customer_id);
```

If you omit the name, CedarDB joins the table name and the column names with underscores.
If that name is taken, CedarDB appends a number:

```sql
CREATE TABLE species (id int, family text, genus text);
CREATE INDEX ON species (family, genus);
CREATE INDEX ON species (family, genus);
SELECT indexname FROM pg_indexes WHERE tablename = 'species';
```

```text
       indexname
-----------------------
 species_family_genus
 species_family_genus1
```

The index is created in the schema of its table, so you cannot schema-qualify the index name.

### B-tree lookups

All indexes are B-tree indexes, so they support equality, range, and prefix lookups.
The example index on `sales (customer_id, article_id)` can be used for predicates like:

```sql
... WHERE customer_id = 42;
... WHERE customer_id BETWEEN 5 AND 10;
... WHERE customer_id = 42 AND article_id > 100;
```

### Unique indexes

A unique index rejects rows with duplicate values in the indexed columns:

```sql
CREATE TABLE plants (id int, code text);
CREATE UNIQUE INDEX plants_code_idx ON plants (code);

INSERT INTO plants VALUES (1, 'OAK'), (2, 'OAK');
-- ERROR:  duplicate key value violates unique constraint
```

If the table already contains duplicates, `CREATE UNIQUE INDEX` fails with `unique constraint violation`.
Null values are not considered equal, so a unique index accepts several rows with a null value.
`INSERT ... ON CONFLICT (<columns>)` can use a unique index as its conflict target.

### Column order

Specify the sort order of each column with `ASC` or `DESC`, and the position of null values with `NULLS FIRST` or `NULLS LAST`.
This helps top-k queries: when the `ORDER BY` of a query matches an index, CedarDB can use the index:

```sql
CREATE TABLE sales (id int, customer_id int, article_id int, amount numeric);
CREATE INDEX sales_recent ON sales (customer_id DESC, article_id);

-- this query is eligible to use the index
SELECT * FROM sales ORDER BY customer_id DESC, article_id LIMIT 10;
```

As in `ORDER BY`, null values sort last for `ASC` and first for `DESC`.
Queries return the same rows whether or not they use the index:

```sql
CREATE TABLE trees (species text, height_m int);
INSERT INTO trees VALUES ('Oak', 25), ('Birch', 18), ('Seedling', NULL);
CREATE INDEX trees_height ON trees (height_m DESC);
SELECT species, height_m FROM trees ORDER BY height_m DESC LIMIT 2;
```

```text
 species  | height_m
----------+----------
 Seedling |
 Oak      |       25
```

### Automatic indexes

CedarDB automatically creates indexes for `PRIMARY KEY`, `UNIQUE`, and `FOREIGN KEY` constraints.
Primary key and unique indexes appear in `pg_indexes` with the constraint name, e.g., `plants_pkey`.
Foreign key indexes are named after the constraint, e.g., `trees_forest_id_fkey`.
They are listed in `pg_index`, but not in `pg_class` or `pg_indexes` for compatibility with PostgreSQL tools.

### Indexes on temporary tables and materialized views

You can create indexes on [temporary tables](/docs/references/objects/tables#temporary-tables).
These indexes are temporary, too, and CedarDB drops them together with the table.

You can also create regular and unique indexes on [materialized views](/docs/references/objects/materialized_views).
CedarDB maintains them on every `REFRESH MATERIALIZED VIEW`.
You cannot create indexes on regular views.

### Permissions

To create an index, you must own the table and have the `CREATE` privilege on the schema of the table.
Members of the owning role and superusers can create indexes, too.
Privileges on the table, such as `ALL` or `WITH GRANT OPTION`, do not allow creating indexes.
For indexes on temporary tables, you must have the `TEMPORARY` privelege on the database instead fo the `CREATE` privilege on the schema.

The index belongs to the owner of the table.
If you change the owner of the table with `ALTER TABLE ... OWNER TO`, its indexes move to the new owner.
Indexes have no privileges of their own.

## DROP INDEX

`DROP INDEX` removes indexes.

```text
DROP INDEX [ CONCURRENTLY ] [ IF EXISTS ] <name> [, ...] [ CASCADE | RESTRICT ]
```

```sql
CREATE TABLE sales (id int, customer_id int);
CREATE INDEX sales_customer ON sales (customer_id);
DROP INDEX sales_customer;
```

Use `IF EXISTS` to avoid an error if the index does not exist.
`CONCURRENTLY` is accepted for compatibility.

You cannot drop an index that a foreign key depends on, such as the primary key index of a referenced table.

{{< callout type="warning" >}}
Dropping the index of a `PRIMARY KEY`, `UNIQUE`, or `FOREIGN KEY` constraint also removes the constraint, without an error.
CedarDB then no longer enforces the constraint.
Use `ALTER TABLE ... DROP CONSTRAINT` to remove constraints instead.
{{< /callout >}}

### Permissions

To drop an index, you must own its table, own the schema, or be a superuser.
You also need the `USAGE` privilege on the schema.
Privileges on the table do not allow dropping its indexes.

## PostgreSQL Differences

- Only B-tree indexes are supported. `USING hash` falls back to B-tree with a warning, but `pg_indexes.indexdef` still shows `USING hash`.
  `gist`, `gin`, `brin`, and `spgist` indexes are not supported.
- Indexes on expressions, partial indexes (`WHERE`), `INCLUDE` columns, storage parameters (`WITH`), and `TABLESPACE` are not supported.
- Operator classes, such as `text_pattern_ops`, are accepted and ignored.
- `ALTER INDEX` and `REINDEX` are not supported.
- Generated index names have no `_idx` suffix, e.g., `species_family_genus` instead of `species_family_genus_idx`.
- `NULLS NOT DISTINCT` is not supported.
- `DROP INDEX` on the index of a primary key or unique constraint drops the constraint instead of failing.
- CedarDB creates an index for every foreign key, and `DROP INDEX` on it drops the foreign key constraint.
- `COMMENT ON INDEX` is not supported.
