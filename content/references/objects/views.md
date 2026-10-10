---
title: "Reference: Views"
linkTitle: "Views"
weight: 30
---

A view is a *virtual* table, defined by a query.
When you reference the view, CedarDB reruns the query as if you had specified it as a subquery.
Views are similar to common table expressions (CTEs), but they survive connection and server restarts.
To store the result of a query instead of rerunning it, use a [materialized view](/docs/references/objects/materialized_views).

```sql
CREATE TABLE trees (id int, species text, height_m numeric);
INSERT INTO trees VALUES (1, 'Oak', 21.5), (2, 'Birch', 9.0), (3, 'Oak', 12.4);

-- Create a view
CREATE VIEW oaks AS
    SELECT id, height_m FROM trees WHERE species = 'Oak';

-- Use the view like a regular table
SELECT * FROM oaks WHERE height_m > 15;
```

```text
 id | height_m
----+-----------
  1 | 21.500000
```

## Using Views

Views are a good way to structure your SQL.
They encapsulate the structure of your data and decouple an interface from the underlying tables.
CedarDB does not treat views as an optimization barrier, but optimizes across the whole query.
Therefore, querying data from a view has exactly the same performance as specifying the query manually.

Views are read-only: you cannot `INSERT`, `UPDATE`, or `DELETE` through a view.

After creating a view, you can find it in the `pg_views` system view, in `information_schema.views`, and in `pg_class` with `relkind = 'v'`.
`pg_get_viewdef()` returns the query of a view.

## CREATE VIEW

```text
CREATE [ OR REPLACE ] [ TEMP | TEMPORARY ] VIEW <name> [ ( <column_name> [, ...] ) ]
    AS <query>
```

| Parameter       | Description                                                                                   |
|-----------------|-----------------------------------------------------------------------------------------------|
| `OR REPLACE`    | Replace an existing view with the same name. See below for restrictions.                      |
| `TEMPORARY`     | Create a [temporary view](#temporary-views).                                                  |
| `<column_name>` | Names for the columns of the view. Without a list, the columns keep the names from the query. |
| `<query>`       | A `SELECT` query that defines the view.                                                       |

Rename the columns of a view:

```sql
CREATE TABLE trees (id int, species text, height_m numeric);
CREATE VIEW tree_heights (tree_id, meters) AS SELECT id, height_m FROM trees;
```

`CREATE OR REPLACE VIEW` can add columns at the end of the view.
To avoid breaking existing queries, you cannot rename existing columns or change their types this way.
Drop and recreate the view instead:

```sql
CREATE TABLE trees (id int, species text, height_m numeric);
CREATE VIEW oaks AS SELECT id FROM trees WHERE species = 'Oak';
CREATE OR REPLACE VIEW oaks AS SELECT id, height_m FROM trees WHERE species = 'Oak';
```

In compliance with the SQL standard, CedarDB ignores an `ORDER BY` in the query of a view, unless the query also has a `LIMIT`.
To get sorted results, add `ORDER BY` to the query that reads from the view.

### Dependencies

CedarDB tracks which tables and views a view reads from.
While a view reads from a table, you cannot change the table in ways that affect the view:

- add a column to the table,
- rename the table or a column that the view uses,
- move the table to another schema with `SET SCHEMA`,
- drop a column that the view uses, or change its type.

The same applies to a view that other views read from: you cannot rename it or move it to another schema.
CedarDB rejects such statements with `cannot ... because other objects depend on it`.
Drop the dependent views, change the table, and recreate the views:

```sql
CREATE TABLE trees (id int, species text);
CREATE VIEW tree_ids AS SELECT id FROM trees;

ALTER TABLE trees ADD COLUMN height_m numeric;
```

```text
ERROR:  cannot add column to table "trees" because other objects depend on it
DETAIL:  tree_ids depends on it
```

A view defined with `SELECT *` is affected in the same way, because it uses every column of the table.

### Permissions

To create a view, you need the `CREATE` privilege on the schema.
The creator owns the view.
To create a temporary view, you need the `TEMPORARY` privilege on the database.

## ALTER VIEW

```text
ALTER VIEW [ IF EXISTS ] <name> RENAME TO <new_name>
ALTER VIEW [ IF EXISTS ] <name> SET SCHEMA <new_schema>
ALTER VIEW [ IF EXISTS ] <name> OWNER TO { <new_owner> | CURRENT_USER | CURRENT_ROLE | SESSION_USER }
```

```sql
CREATE TABLE trees (id int, species text, height_m numeric);
CREATE VIEW oaks AS SELECT id FROM trees WHERE species = 'Oak';
ALTER VIEW oaks RENAME TO oak_trees;
```

### Permissions

To alter a view, you must own it or be a superuser.
`RENAME TO` and `SET SCHEMA` require the `CREATE` privilege on the target schema.
`OWNER TO` requires that you can `SET ROLE` to the new owner, and that the new owner has the `CREATE` privilege on the schema.

`ALTER TABLE ... RENAME TO` also renames a view.
Other `ALTER TABLE` forms, such as `OWNER TO` and `SET SCHEMA`, do not work on views.

## DROP VIEW

```text
DROP VIEW [ IF EXISTS ] <name> [, ...] [ CASCADE | RESTRICT ]
```

```sql
CREATE VIEW numbers AS SELECT 1 AS n;
DROP VIEW numbers;
```

You cannot drop a view while other views or materialized views read from it.
Use `CASCADE` to drop them as well.
The underlying tables are not affected.

### Permissions

To drop a view, you must own it, own its schema, or be a superuser.

## Temporary views

A temporary view exists only in the current session.
Other sessions cannot see it, and CedarDB drops it when the session ends.

```sql
CREATE TEMP VIEW recent_plantings AS SELECT 1 AS id, current_date AS planted;
SELECT * FROM recent_plantings;
```

A view that reads from a temporary table or another temporary view automatically becomes a temporary view, even without `TEMP`:

```sql
CREATE TEMP TABLE seedling_batch (id int, species text);
CREATE VIEW batch_oaks AS SELECT id FROM seedling_batch WHERE species = 'Oak';

SELECT relpersistence FROM pg_class WHERE relname = 'batch_oaks';
```

```text
 relpersistence
----------------
 t
```

`relpersistence = 't'` marks a temporary relation.

If you specify a permanent schema for such a view, e.g., `CREATE VIEW public.batch_oaks AS ...`, CedarDB rejects it with `cannot create a permanent view over a temporary relation`.

Temporary views follow the same rules as [temporary tables](/docs/references/objects/tables#temporary-tables):
they live in the session's `pg_temp_<n>` schema, hide permanent relations with the same name, support `CREATE OR REPLACE`, and are dropped by `DISCARD TEMP`.

## View privileges

Views support the same privileges as [tables](/docs/references/objects/tables#table-privileges).
Since views are read-only, only `SELECT` has an effect.

{{< callout type="info" >}}
Granting and revoking privileges on views requires an enterprise license.
{{< /callout >}}

To read from a view, a role needs `SELECT` on the view and `USAGE` on its schema.
It does not need privileges on the underlying tables.
Instead, CedarDB checks the privileges on the underlying tables against the *owner* of the view.
This lets you expose a subset of a table to other roles:

```sql
CREATE TABLE tree_locations (id int, species text, gps text);
CREATE ROLE visitor LOGIN;

-- Expose species, but not the exact location
CREATE VIEW public_trees AS SELECT id, species FROM tree_locations;
GRANT SELECT ON public_trees TO visitor;
```

`visitor` can read `public_trees`, but not `tree_locations`.

## PostgreSQL Differences

- Views are not updatable. `INSERT`, `UPDATE`, and `DELETE` on a view fail.
- `WITH CHECK OPTION`, `CREATE RECURSIVE VIEW`, and view options (`WITH (security_barrier)`, `security_invoker`, `check_option`) are not supported.
- While a view reads from a table, you cannot add columns to the table, rename the table or the columns the view uses, or move the table to another schema.
  You also cannot rename or move a view that other views read from.
- CedarDB ignores `ORDER BY` in the query of a view unless the query also has a `LIMIT`.
- `ALTER VIEW` does not support `RENAME COLUMN`, `ALTER COLUMN ... SET DEFAULT`, or `SET`/`RESET` of options.
- `COMMENT ON VIEW` is not supported.
