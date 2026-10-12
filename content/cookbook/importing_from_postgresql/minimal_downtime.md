---
title: "Migrating from PostgreSQL with Minimal Downtime"
linkTitle: "Migrate with minimal downtime"
---

This recipe migrates a PostgreSQL database to CedarDB while your application keeps running.
Create the full schema in CedarDB, let [Debezium](/docs/clients/data_import/debezium/) copy and replicate the data while the application still writes to PostgreSQL, and switch over once CedarDB has caught up.
The downtime is minimal and only lasts from stopping writes until the application uses CedarDB.

## Prerequisites

* A running Kafka Connect with the Debezium connectors, set up as described in [Debezium](/docs/clients/data_import/debezium/).
* Logical replication enabled in PostgreSQL (see [Debezium](/docs/clients/data_import/debezium/#enable-logical-replication-in-postgresql)).

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

Convert these columns before the migration, for example to `text`.
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
On managed services such as Amazon RDS, you cannot read password hashes. There, instead add `--no-role-passwords` and set the passwords with `ALTER ROLE ... PASSWORD` afterward.
Also remove provider-specific roles, such as `rds_superuser`, from the output.

Then create the target database with its original owner, here `garden_owner`:

```shell
psql "$TARGET_ADMIN" -c "CREATE DATABASE garden OWNER garden_owner"
```

{{< callout type="info" >}}
Privileges (`GRANT`, `ALTER DEFAULT PRIVILEGES`, and role memberships) require a CedarDB [enterprise license](/docs/licensing/).
With the community edition, add `--no-privileges` to every `pg_dump` and `pg_restore` command on this page, and remove the role memberships from the `pg_dumpall` output by adding `| grep -v '^GRANT'` before `psql`.
Owners are kept in both editions.
{{< /callout >}}

## Migrate

{{% steps %}}

### Create the schema without foreign keys

Debezium writes each table independently, so a row can arrive before the row it references.
Create the schema without foreign keys and add them after the switch:

```shell
pg_dump --format=custom --schema-only "$SOURCE" -f schema.dump
pg_restore --list schema.dump | grep -v 'FK CONSTRAINT' > schema-without-fks.list
pg_restore --list schema.dump | grep 'FK CONSTRAINT' > fks.list

pg_restore --use-list=schema-without-fks.list --file=- schema.dump \
  | sed -E 's/^( *SEQUENCE NAME )[^.]+\./\1/' \
  | psql -v ON_ERROR_STOP=1 "$TARGET"
```

Then let the CedarDB user of the Debezium sink write into the tables:

```sql
GRANT USAGE ON SCHEMA public TO debezium_sink;
GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE ON ALL TABLES IN SCHEMA public TO debezium_sink;
```

With the community edition, restore with `--no-owner --no-privileges` as the sink user instead, so the sink owns the tables.
Avoid schema changes in PostgreSQL during the migration.

### Replicate the data

Set up Debezium as described in [Set up continuous replication](/docs/clients/data_import/debezium/#set-up-continuous-replication), with these differences:

* Include all tables of the database in the publication, `table.include.list`, and `topics`.
* Set `collection.name.format` in the sink to `public.${source.table}`, so the sink writes into the tables you created.

Debezium copies the existing rows and then applies every change.
Wait until the sink's consumer lag stays close to zero.
While the application still writes to PostgreSQL, the two databases can differ by the most recent changes.

### Stop writes and let CedarDB catch up

Stop writes to PostgreSQL.
Then wait until the sink's consumer lag is zero
(see [Monitor the pipeline](/docs/clients/data_import/debezium/#monitor-the-pipeline)).

### Validate the copy

Run the same query on PostgreSQL and on CedarDB for each table and compare the results:

```sql
SELECT count(*), sum(price), min(plant_id), max(plant_id)
FROM plants;
```

### Remove the Debezium pipeline

Delete the Debezium connectors, then drop the replication slot and the publication in PostgreSQL, as described
in [Remove the pipeline](/docs/clients/data_import/debezium/#remove-the-pipeline).

### Add foreign keys and continue identity columns

Add the foreign keys that you left out at the start:

```shell
pg_restore --use-list=fks.list --file=- schema.dump \
  | psql -v ON_ERROR_STOP=1 "$TARGET"
```

Debezium does not advance the sequences of identity columns.
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

Check that the constraints and indexes exist:

```sql
SELECT conrelid::regclass AS table_name, conname, contype
FROM pg_constraint
WHERE connamespace = 'public'::regnamespace
ORDER BY 1, 2;
```

### Switch the application to CedarDB

Point your application to CedarDB.

{{% /steps %}}
