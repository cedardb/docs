---
title: "Reference: Materialized Views"
linkTitle: "Materialized Views"
weight: 35
---

A materialized view stores the result of a query as a table.
Unlike a regular [view](/docs/references/objects/views), CedarDB does not rerun the query when you read from a materialized view.
Instead, it returns the rows that it computed when the view was created or last refreshed.
Changes to the underlying tables become visible only after you run `REFRESH MATERIALIZED VIEW`.

```sql
CREATE TABLE trees (
    id       integer PRIMARY KEY,
    species  text    NOT NULL,
    height_m numeric NOT NULL
);
INSERT INTO trees VALUES (1, 'Oak', 12.4), (2, 'Oak', 20.1), (3, 'Birch', 9.0);

CREATE MATERIALIZED VIEW species_stats AS
    SELECT species, count(*) AS tree_count, avg(height_m) AS avg_height_m
    FROM trees
    GROUP BY species;

SELECT * FROM species_stats ORDER BY species;
```

```text
 species | tree_count | avg_height_m
---------+------------+--------------
 Birch   |          1 |     9.000000
 Oak     |          2 |    16.250000
```

## Using Materialized Views

Materialized views are useful for expensive queries whose results you read much more often than the underlying data changes.
Typical examples are aggregations for dashboards and reports, or pre-joined data for an application.

You can read from a materialized view like from any other table, join it with other tables and views, and create indexes on it.
You cannot change its contents with `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, or `COPY FROM`.
The only way to change the contents is `REFRESH MATERIALIZED VIEW`.

After creating a materialized view, you can find it in the `pg_matviews` system view.
In `pg_class`, materialized views have the `relkind` value `m`.

## CREATE MATERIALIZED VIEW

`CREATE MATERIALIZED VIEW` defines a new materialized view and, by default, populates it with the result of the query.

```text
CREATE MATERIALIZED VIEW [ IF NOT EXISTS ] <name> [ ( <column_name> [, ...] ) ]
    [ WITH ( <storage_option> = <value> [, ...] ) ]
    AS <query>
    [ WITH [ NO ] DATA ]
```

| Parameter                   | Description                                                                                                 |
|-----------------------------|-------------------------------------------------------------------------------------------------------------|
| `IF NOT EXISTS`             | Do not throw an error if a relation with the same name already exists. CedarDB does not run the query then. |
| `<name>`                    | The name of the materialized view, optionally schema-qualified.                                             |
| `<column_name>`             | Names for the columns of the view. Columns without a name in the list keep the name from the query.         |
| `WITH (<strg_opt>)`         | Storage options, as for [`CREATE TABLE`](/docs/references/objects/tables/#options), e.g., `server`.         |
| `<query>`                   | A `SELECT`, `VALUES`, or `TABLE` query that defines the contents.                                           |
| `WITH DATA`                 | Run the query and populate the view. This is the default.                                                   |
| `WITH NO DATA`              | Create the view without running the query. The view is unpopulated until you refresh it.                    |

Rename the output columns:

```sql
CREATE TABLE trees (id integer, species text, height_m numeric);

CREATE MATERIALIZED VIEW tallest (tree_species, max_height_m) AS
    SELECT species, max(height_m) FROM trees GROUP BY species;
```

Store the contents of a materialized view on remote storage, such as S3, instead of local disk.
This works for materialized views just like for [tables](/docs/references/objects/tables/#options), and requires a server previously created with
[CREATE SERVER](/docs/references/advanced/createserver):

```sql
CREATE TABLE trees (id integer, species text, height_m numeric);

CREATE MATERIALIZED VIEW tree_heights WITH (server = remote_storage) AS
    SELECT id, height_m FROM trees;
```

A materialized view can read from tables, views, and other materialized views.
It cannot read from temporary tables, neither directly nor through a view, because a materialized view outlives the session of a temporary table.

### Unpopulated materialized views

With `WITH NO DATA`, CedarDB only checks the query for errors and derives the columns, but does not run it.
Reading from an unpopulated materialized view is an error:

```sql
CREATE TABLE trees (id integer, species text);
INSERT INTO trees VALUES (1, 'Oak');

CREATE MATERIALIZED VIEW oaks AS
    SELECT id FROM trees WHERE species = 'Oak'
    WITH NO DATA;

SELECT * FROM oaks;
-- ERROR:  materialized view "oaks" has not been populated

REFRESH MATERIALIZED VIEW oaks;
SELECT * FROM oaks;
--  id
-- ----
--   1
```

The `ispopulated` column of `pg_matviews` and the `relispopulated` column of `pg_class` show whether a materialized view is populated.

### Indexes

You can create regular and unique [indexes](/docs/references/objects/indexes) on a materialized view.
CedarDB maintains them on every refresh.
To create an index, you must own the materialized view (or be a member of the owning role) and have the `CREATE` privilege on its schema.
If a refresh produces rows that violate a unique index, the refresh fails and the view keeps its previous contents:

```sql
CREATE TABLE trees (id integer, species text);
INSERT INTO trees VALUES (1, 'Oak'), (2, 'Birch');

CREATE MATERIALIZED VIEW tree_species AS SELECT id, species FROM trees;
CREATE UNIQUE INDEX ON tree_species (species);

INSERT INTO trees VALUES (3, 'Oak');
REFRESH MATERIALIZED VIEW tree_species;
-- ERROR:  duplicate key value violates unique constraint "tree_species_species_key"
```

### Permissions

To create a materialized view, you need the `CREATE` privilege on the target schema and the `SELECT` privilege on all relations that the query reads.
The creating role becomes the owner of the view.
Default privileges defined with `ALTER DEFAULT PRIVILEGES ... ON TABLES` also apply to new materialized views.
For example, let `bi` read every materialized view that `analytics` creates from now on:

```sql
ALTER DEFAULT PRIVILEGES FOR ROLE analytics GRANT SELECT ON TABLES TO bi;
```

Other roles only need the `SELECT` privilege on the materialized view itself to read it.
They do not need any privileges on the underlying tables:

```sql
GRANT SELECT ON species_stats TO dashboard_reader;
```

## REFRESH MATERIALIZED VIEW

`REFRESH MATERIALIZED VIEW` replaces the contents of a materialized view with the current result of its query.

```text
REFRESH MATERIALIZED VIEW [ CONCURRENTLY ] <name>
    [ WITH [ NO ] DATA ]
```

| Parameter      | Description                                                                                      |
|----------------|--------------------------------------------------------------------------------------------------|
| `CONCURRENTLY` | Accepted for PostgreSQL compatibility. CedarDB never blocks readers during a refresh, see below. |
| `<name>`       | The name of the materialized view, optionally schema-qualified.                                  |
| `WITH DATA`    | Rerun the query and populate the view with its result. This is the default.                      |
| `WITH NO DATA` | Discard the contents of the view and mark it as unpopulated.                                     |

```sql
CREATE TABLE trees (id integer, species text);
INSERT INTO trees VALUES (1, 'Oak');

CREATE MATERIALIZED VIEW tree_count AS SELECT count(*) AS total FROM trees;

INSERT INTO trees VALUES (2, 'Birch');
SELECT total FROM tree_count;
-- 1

REFRESH MATERIALIZED VIEW tree_count;
SELECT total FROM tree_count;
-- 2
```

A refresh is transactional like any other write.
Concurrent transactions keep reading the previous contents until the refresh commits.
If you roll back the transaction, the view keeps its previous contents.

When a materialized view reads from another materialized view, refreshing the outer view uses the current contents of the inner one.
Refresh the views in dependency order, starting with the ones that only read from tables.

CedarDB does not refresh materialized views automatically.
To keep a view up to date, run `REFRESH MATERIALIZED VIEW` periodically or after loading new data.

### Permissions

Only the owner of a materialized view, members of the owning role, and superusers can refresh it.
To let another role refresh a view, make it a member of the owning role (see [Roles](/docs/references/objects/roles#role-membership)):

```sql
GRANT analytics TO etl;  -- etl can now refresh views owned by analytics
```

The owner needs the `SELECT` privilege on all relations that the query reads.
The refresh always runs with the privileges of the owner, also when a superuser runs it.
If the owner loses this privilege, the refresh fails with `permission denied for table '<name>'`, and the view keeps its previous contents.

## ALTER MATERIALIZED VIEW

`ALTER MATERIALIZED VIEW` changes the properties of an existing materialized view.
Specify `IF EXISTS` to not throw an error if the materialized view does not exist.

Rename a materialized view:

```sql
ALTER MATERIALIZED VIEW species_stats RENAME TO species_summary;
```

Rename a column of a materialized view.
This only renames the column of the view, not the column of the underlying table:

```sql
ALTER MATERIALIZED VIEW species_stats RENAME COLUMN tree_count TO number_of_trees;
```

Move a materialized view to another schema:

```sql
ALTER MATERIALIZED VIEW species_stats SET SCHEMA reporting;
```

Change the owner of a materialized view:

```sql
ALTER MATERIALIZED VIEW species_stats OWNER TO analyst;
```

`ALTER TABLE` can also rename a materialized view, move it to another schema, and change its owner.
It rejects changes that only apply to tables, such as adding columns or constraints, since the columns of a materialized view are defined by its query.

### Permissions

To alter a materialized view, you must be its owner or a member of the owning role.
Superusers can alter any materialized view.
Renaming the view also requires the `CREATE` privilege on its schema, and `SET SCHEMA` requires `CREATE` on the new schema.
For `OWNER TO`, you must be able to `SET ROLE` to the new owner, and the new owner needs `CREATE` on the schema.

## DROP MATERIALIZED VIEW

`DROP MATERIALIZED VIEW` removes a materialized view, its data, and its indexes.

```text
DROP MATERIALIZED VIEW [ IF EXISTS ] <name> [, ...] [ CASCADE | RESTRICT ]
```

```sql
DROP MATERIALIZED VIEW species_stats;
```

Do not throw an error if the materialized view does not exist:

```sql
DROP MATERIALIZED VIEW IF EXISTS species_stats;
```

If other views or materialized views read from the materialized view, the drop fails.
Use `CASCADE` to drop the dependent objects as well:

```sql
DROP MATERIALIZED VIEW species_stats CASCADE;
```

Use the right `DROP` statement for the object type: `DROP TABLE` and `DROP VIEW` do not drop materialized views.

### Permissions

To drop a materialized view, you must own it, own its schema, or be a superuser.

## Dependencies

A materialized view depends on all tables and views its query reads.
While the materialized view exists, CedarDB refuses to drop these relations or the columns the view reads, unless you use `CASCADE`.

You also cannot rename these relations or the columns the view reads, or move the relations to another schema, while the materialized view exists.
Columns that the view does not read can be renamed and dropped.

## PostgreSQL Differences

- `REFRESH MATERIALIZED VIEW` never blocks readers, as CedarDB uses snapshot isolation.
  `CONCURRENTLY` is accepted as a synonym for a regular refresh, does not require a unique index, and can be combined with `WITH NO DATA`.
- CedarDB refuses to rename a table, view, or materialized view, rename a column the view reads, or move a relation to another schema while a materialized view reads from it.
- CedarDB refuses `ALTER TABLE ... ADD COLUMN` on a table that a view or materialized view reads from.
