---
title: "Airbyte"
linkTitle: "Airbyte"
---

[Airbyte](https://airbyte.com/) moves data from hundreds of sources into a database with a few settings in its UI.
CedarDB works as an Airbyte destination through Airbyte's **Postgres** destination connector, so you can load data into
CedarDB from any source Airbyte supports.
This page uses a PostgreSQL database as the source and copies its tables with a full refresh.
Incremental syncs with **Append + Deduped** are not supported yet.
To replicate changes from PostgreSQL continuously, use [Debezium](../debezium/).

This page was tested with the Airbyte connectors `source-postgres` 3.8.7 and `destination-postgres` 3.0.23, and
PostgreSQL 16.
The setting names match the Airbyte UI of self-managed Airbyte and Airbyte Cloud.

This page is a self-contained example that you can follow from start to finish.
It copies the tables `species` and `plants` from the PostgreSQL database `nursery` into the CedarDB database `nursery`.
It keeps the Airbyte setup short and points out what is specific to CedarDB.
For all connector settings and for running Airbyte in production, see Airbyte's documentation of
the [Postgres source](https://docs.airbyte.com/integrations/sources/postgres),
the [Postgres destination](https://docs.airbyte.com/integrations/destinations/postgres), [sync modes](https://docs.airbyte.com/platform/using-airbyte/core-concepts/sync-modes),
and [deploying Airbyte](https://docs.airbyte.com/platform/deploying-airbyte).

## How CedarDB tables look

Airbyte creates one table per source table (stream) in CedarDB.
These tables are landing tables, not a copy of the source schema:

* Each table has four extra columns: `_airbyte_raw_id`, `_airbyte_extracted_at`, `_airbyte_meta`, and
  `_airbyte_generation_id`.
* All source columns are nullable.
  Primary keys, foreign keys, unique constraints, defaults, and indexes are not copied.
* Types are normalized: integers become `bigint`, decimals and floating-point numbers become `numeric`, `uuid` and most
  other types become `varchar`, and arrays become `jsonb`.

The Postgres destination creates these tables the same way in PostgreSQL; this is not specific to CedarDB.

If you need the exact source schema, for example to migrate an application, use Airbyte to load the data and then copy
it into tables you define yourself, or follow [Migrating from PostgreSQL](/docs/cookbook/importing_from_postgresql/).

## Prerequisites

* Airbyte (self-managed or Airbyte Cloud) that can reach both PostgreSQL and CedarDB over the network.
* A CedarDB superuser to create the destination role and database.

## Set up CedarDB as a destination

{{% steps %}}

### Create a role and database

Connect to CedarDB as a superuser and create a role for Airbyte that owns the target database:

```sql
CREATE ROLE airbyte WITH LOGIN PASSWORD '<airbyte-password>';
CREATE DATABASE nursery OWNER airbyte;
```

As the database owner, Airbyte can create its schemas and tables without further privileges.
This works in every CedarDB edition.
Granting privileges with `GRANT` instead requires a CedarDB [enterprise license](/docs/licensing/).

### Add the destination in Airbyte

In Airbyte, add a new destination of type **Postgres** with these settings:

| Setting                   | Value                                                                                                     |
|---------------------------|-----------------------------------------------------------------------------------------------------------|
| Host, Port                | Host name and port of CedarDB                                                                             |
| Database Name             | `nursery`                                                                                                 |
| Default Schema            | `public`                                                                                                  |
| Username, Password        | `airbyte` and its password                                                                                |
| SSL Connection, SSL Modes | Enable SSL and use `require` (see [SSL configuration](/docs/references/configuration/#ssl-configuration)) |

Leave the other settings at their defaults.
When you save the destination, Airbyte tests it by creating, writing, and dropping a table in CedarDB.

{{% /steps %}}

Airbyte keeps the source schema name: tables from the PostgreSQL schema `public` land in the CedarDB schema `public`.
To land them somewhere else, change the **Destination Namespace** of the connection.

## Copy tables once

A **Full refresh | Overwrite** sync copies all rows of the selected tables and replaces the CedarDB tables on every run.

{{% steps %}}

### Prepare PostgreSQL

In the source PostgreSQL database, create a role that can read the tables:

```sql
CREATE ROLE airbyte_source WITH LOGIN PASSWORD '<source-password>';
GRANT USAGE ON SCHEMA public TO airbyte_source;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO airbyte_source;
```

### Add the source in Airbyte

Add a new source of type **Postgres** with the host, port, database name, `airbyte_source` credentials, and the schema
`public`.
The source requires an **Update Method**.
Select **Scan Changes with User Defined Cursor**, which needs no replication setup in PostgreSQL.
Full refresh syncs read all rows and ignore it.

### Create the connection

Create a connection from the source to the CedarDB destination, select the tables, and set the sync mode of each table
to **Full refresh | Overwrite**.
Click **Sync now**.
On the connection's **Status** tab, Airbyte shows the records loaded per table while the sync runs.
The **Timeline** tab lists each sync with its duration and logs.

### Verify the copy

Compare row counts and sums on both sides, for example:

```sql
SELECT count(*), sum(price), min(plant_id), max(plant_id)
FROM plants;
```

{{% /steps %}}

Each further run replaces the CedarDB tables with the current source rows, including deletions.
To migrate an application, stop writes to PostgreSQL, run a final sync, and verify the tables before you switch over.

## CedarDB limitations

### Decimals with more than six fractional digits

CedarDB columns such as `numeric(38,18)` store more than six fractional digits, but Airbyte does not create such
columns.
It creates all decimal and floating-point source columns as `numeric` without precision and scale, which CedarDB
creates as `numeric(38,6)` (see [Numeric](/docs/references/datatypes/numeric/)).
A value with nonzero digits after the sixth decimal place, for example the `double precision` value `3.14159265`, makes
the sync of the table fail with `invalid number format: loss of precision`, and no rows of the table arrive.
Very small values, such as `1e-9`, are stored as `0` without an error.

To copy such columns exactly, create their tables in CedarDB before the first sync.
Give each decimal and floating-point column a `numeric(p,s)` type with enough fractional digits:

```sql
CREATE TABLE public.soil_samples (
    _airbyte_raw_id        varchar     NOT NULL,
    _airbyte_extracted_at  timestamptz NOT NULL,
    _airbyte_meta          jsonb       NOT NULL,
    _airbyte_generation_id bigint,
    sample_id              bigint,
    ph                     numeric(38,18),
    trace_ppm              numeric(38,18)
);
```

Airbyte keeps existing `numeric` columns with their precision and scale.
It changes columns of other types, such as `double precision`, to `numeric(38,6)`, so convert such columns after the
copy if you need them.

### Other CedarDB limitations

* **Append + Deduped** is not supported.
  The sync fails because CedarDB currently only supports a single data-modifying CTE per query, whereas Airbyte uses 3.

## Airbyte behavior

The following behavior is the same with a PostgreSQL destination:

* A **Full refresh | Overwrite** sync drops and recreates the destination tables, so it fails while a view depends on
  one of them.
  Drop such views before the sync and recreate them afterward, or enable **Drop tables with CASCADE** in the
  destination, which drops the views.
* Empty strings arrive as `NULL`.
* `infinity` dates and timestamps, `NaN` and infinite floating-point values, and multidimensional arrays arrive as
  `NULL`, with a note in `_airbyte_meta`.
