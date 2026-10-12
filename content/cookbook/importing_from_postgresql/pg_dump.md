---
title: "Migrating from PostgreSQL with pg_dump"
linkTitle: "Copy with pg_dump"
---

This recipe copies a PostgreSQL database into CedarDB with the PostgreSQL client tools `pg_dump`, `pg_dumpall`, and `psql`.
It copies the complete schema, including keys, indexes, views, owners, and privileges.
To avoid data loss, this guide requires to stop writes to PostgreSQL during the copy.
For migration paths with connected applications still running, see [Migrate with minimal downtime](../minimal_downtime/).

## Before you start

### Check for unsupported column types

CedarDB does not support the PostgreSQL types `timetz`, `xml`, and the geometric types, or stored generated columns.
Find such columns in the source database:

```sql
SELECT table_schema, table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
  AND (data_type IN ('time with time zone', 'xml', 'point', 'line', 'lseg', 'box', 'path', 'polygon', 'circle')
       OR is_generated = 'ALWAYS')
ORDER BY 1, 2, 3;
```

Convert these columns before the migration, for example to `text`, or exclude the affected tables from the dump with `--exclude-table` and copy them separately.
CedarDB also rejects the date and timestamp values `infinity` and `-infinity`.

### Check for column privileges

CedarDB supports privileges on tables, views, schemas, and sequences, but not on single columns.
Find column privileges in the source database:

```sql
SELECT c.relnamespace::regnamespace AS table_schema, c.relname AS table_name, a.attname AS column_name
FROM pg_attribute AS a
JOIN pg_class AS c ON c.oid = a.attrelid
WHERE a.attacl IS NOT NULL
  AND c.relnamespace::regnamespace::text NOT IN ('pg_catalog', 'information_schema')
ORDER BY 1, 2, 3;
```

Replace them with a view that contains the permitted columns and grant access to the view, or revoke them before the migration.
Otherwise, the restore stops at the first column privilege.

### Set up connections

The examples copy the PostgreSQL database `garden`.
Install the PostgreSQL client tools (`pg_dump`, `pg_restore`, `psql`) in the same major version as the source server.
Then define the two connections.
Use a superuser on both sides, so the restore can create objects for other owners:

```shell
SOURCE="postgresql://<postgres-user>@<postgres-host>:5432/garden?sslmode=require"
TARGET="postgresql://<cedardb-user>@<cedardb-host>:5432/garden?sslmode=require"
TARGET_ADMIN="postgresql://<cedardb-user>@<cedardb-host>:5432/postgres?sslmode=require"
```

To avoid password prompts, store the passwords in a `~/.pgpass` file or set `PGPASSWORD`.

### Copy roles and create the database

`pg_dump` copies the objects of one database, but not the roles that own them or receive privileges.
Copy the roles first, leaving out the superuser `postgres`, which already exists in CedarDB:

```shell
pg_dumpall --roles-only --dbname="$SOURCE" \
  | grep -vE '^(CREATE|ALTER) ROLE postgres[ ;]' \
  | psql "$TARGET_ADMIN"
```

The roles keep their PostgreSQL passwords, so applications can log in to CedarDB with their existing credentials.
On managed services such as Amazon RDS, you cannot read password hashes. Add `--no-role-passwords` and set the passwords with `ALTER ROLE ... PASSWORD` afterward.
Also remove provider-specific roles, such as `rds_superuser`, from the output.

Then create the target database with its original owner, here `garden_owner`:

```shell
psql "$TARGET_ADMIN" -c "CREATE DATABASE garden OWNER garden_owner"
```

{{< callout type="info" >}}
Privileges (`GRANT`, `ALTER DEFAULT PRIVILEGES`, and role memberships) require a CedarDB [enterprise license](/docs/licensing/).
With the community edition, add `--no-privileges` to every `pg_dump` command on this page, and remove the role memberships from the `pg_dumpall` output by adding `| grep -v '^GRANT'` before `psql`.
Owners are kept in both editions.
{{< /callout >}}

## Copy the database

The PostgreSQL client tools offer three ways to copy the database, all with the complete schema:

* **Full dump:** one command copies schema and data. Stop writes to PostgreSQL before you start.
* **Table by table:** create the tables, copy each table separately, then add constraints and indexes. Use it to copy only some tables, to copy large tables in parallel, or to repeat a single table if its copy fails.
* **CSV files:** export the schema and data to files and import them on the other side. Use it when PostgreSQL and CedarDB cannot reach each other over the network.

{{< tabs >}}
{{< tab name="Full dump" >}}

Stream a dump of the whole database into CedarDB:

```shell
pg_dump "$SOURCE" \
  | sed -E 's/^( *SEQUENCE NAME )[^.]+\./\1/' \
  | psql -v ON_ERROR_STOP=1 "$TARGET"
```

The dump creates the tables and views with their owners and privileges, loads the data with `COPY`, and then adds primary keys, foreign keys, unique constraints, and indexes.
The `sed` command removes the schema name from the sequence names of identity columns, which CedarDB currently does not accept in that position.

{{< /tab >}}
{{< tab name="Table by table" >}}

Create tables, sequences, and views with their owners and privileges, but without constraints and indexes:

```shell
pg_dump --section=pre-data "$SOURCE" \
  | sed -E 's/^( *SEQUENCE NAME )[^.]+\./\1/' \
  | psql -v ON_ERROR_STOP=1 "$TARGET"
```

List the tables to copy, with their schemas, in the file `tables.txt`:

```shell
psql "$SOURCE" -AtX -c "
  SELECT format('%I.%I', n.nspname, c.relname)
  FROM pg_class AS c
  JOIN pg_namespace AS n ON n.oid = c.relnamespace
  WHERE c.relkind = 'r'
    AND n.nspname NOT IN ('pg_catalog', 'information_schema')
    AND n.nspname NOT LIKE 'pg_toast%'" > tables.txt
```

Copy each table through a pipe from PostgreSQL to CedarDB.
Each `psql` prints `COPY` and the number of rows:

```shell
while read -r table; do
  psql "$SOURCE" -c "\copy $table TO STDOUT" | psql "$TARGET" -c "\copy $table FROM STDIN"
done < tables.txt
```

Add the constraints and indexes:

```shell
pg_dump --section=post-data "$SOURCE" \
  | psql -v ON_ERROR_STOP=1 "$TARGET"
```

The copied rows do not advance the sequences of identity columns, because the `setval` calls are part of the data section of the dump.
Let each identity column continue after the highest copied value:

```shell
psql "$TARGET" <<'SQL'
SELECT format('SELECT setval(pg_get_serial_sequence(%L, %L), max(%I)) FROM %I.%I;',
              table_schema || '.' || table_name, column_name, column_name, table_schema, table_name)
FROM information_schema.columns
WHERE is_identity = 'YES'
\gexec
SQL
```

{{< /tab >}}
{{< tab name="CSV files" >}}

On a machine with access to PostgreSQL, export the schema, the list of tables, and the data:

```shell
pg_dump --section=pre-data "$SOURCE" > pre-data.sql
pg_dump --section=post-data "$SOURCE" > post-data.sql
psql "$SOURCE" -AtX -c "
  SELECT format('%I.%I', n.nspname, c.relname)
  FROM pg_class AS c
  JOIN pg_namespace AS n ON n.oid = c.relnamespace
  WHERE c.relkind = 'r'
    AND n.nspname NOT IN ('pg_catalog', 'information_schema')
    AND n.nspname NOT LIKE 'pg_toast%'" > tables.txt
while read -r table; do
  psql "$SOURCE" -c "\copy $table TO '$table.csv' WITH (FORMAT csv)"
done < tables.txt
```

Move the files, including `tables.txt`, together with the `pg_dumpall` output from [Copy roles and create the database](#copy-roles-and-create-the-database), to a machine with access to CedarDB.
There, import them:

```shell
sed -E 's/^( *SEQUENCE NAME )[^.]+\./\1/' pre-data.sql | psql -v ON_ERROR_STOP=1 "$TARGET"
while read -r table; do
  psql "$TARGET" -c "\copy $table FROM '$table.csv' WITH (FORMAT csv)"
done < tables.txt
psql -v ON_ERROR_STOP=1 "$TARGET" -f post-data.sql
```

The copied rows do not advance the sequences of identity columns, because the `setval` calls are part of the data section of the dump.
Let each identity column continue after the highest copied value:

```shell
psql "$TARGET" <<'SQL'
SELECT format('SELECT setval(pg_get_serial_sequence(%L, %L), max(%I)) FROM %I.%I;',
              table_schema || '.' || table_name, column_name, column_name, table_schema, table_name)
FROM information_schema.columns
WHERE is_identity = 'YES'
\gexec
SQL
```

CSV keeps `NULL` and empty strings apart.
For more on CSV files, see [Importing and working with CSV data](/docs/cookbook/working_with_csv/).

{{< /tab >}}
{{< /tabs >}}

## Validate the copy

Run the same query on PostgreSQL and on CedarDB for each table and compare the results:

```sql
SELECT count(*), sum(price), min(plant_id), max(plant_id)
FROM plants;
```

Also check that the constraints and indexes exist:

```sql
SELECT conrelid::regclass AS table_name, conname, contype
FROM pg_constraint
WHERE connamespace = 'public'::regnamespace
ORDER BY 1, 2;
```
