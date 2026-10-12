---
title: "Debezium"
linkTitle: "Debezium"
aliases:
  - /cookbook/aurora_debezium/
---

[Debezium](https://debezium.io/) captures row changes from PostgreSQL and streams them through Kafka.
With the Debezium JDBC sink connector, CedarDB keeps a continuously updated copy of your PostgreSQL tables, so you can
run analytical queries on fresh data without loading your transactional database.
The same pipeline can also copy a consistent snapshot once and stop.

CedarDB does not need its own connector.
The Debezium JDBC sink connects to CedarDB with the PostgreSQL JDBC driver.

This page was tested with Debezium 3.7.0.Final, Kafka 4.3.1, and PostgreSQL 16.

This page is a self-contained example that you can follow from start to finish.
It keeps the Kafka and Debezium setup short and points out what is specific to CedarDB.
For all connector settings and for running Debezium in production, see Debezium's documentation of
the [PostgreSQL connector](https://debezium.io/documentation/reference/stable/connectors/postgresql.html) and
the [JDBC sink connector](https://debezium.io/documentation/reference/stable/connectors/jdbc.html).

## How the pipeline works

```text
PostgreSQL ──> Debezium PostgreSQL connector ──> Kafka ──> Debezium JDBC sink ──> CedarDB
```

* The **PostgreSQL connector** reads a replication slot and writes one Kafka topic per table.
  On first start, it copies the existing rows (snapshot), then streams every committed `INSERT`, `UPDATE`, `DELETE`, and
  `TRUNCATE`.
* The **JDBC sink** creates the target tables in CedarDB and applies the changes as upserts and deletes by primary key.

Both connectors run in Kafka Connect.
The pipeline works with any PostgreSQL that supports logical replication, including Amazon RDS, Aurora, Google Cloud
SQL, and Azure Database for PostgreSQL, and with self-hosted CedarDB or CedarDB Cloud as the target.

## Prerequisites

* A PostgreSQL database where you can enable logical replication and create a role.
* A CedarDB superuser to create the target role and schema.
* Docker with Docker Compose to run Kafka and Kafka Connect, or an existing Kafka Connect cluster with the Debezium 3.7
  connectors.
* Network access from Kafka Connect to PostgreSQL and CedarDB.

## Set up continuous replication

The example replicates the tables `species` and `plants` from the PostgreSQL database `nursery` into the schema
`nursery_replica` of the CedarDB database `nursery`.
Replace host names and passwords in angle brackets with your own values, and the ports if your servers do not use 5432.

{{% steps %}}

### Enable logical replication in PostgreSQL

Set these server parameters and restart PostgreSQL:

```ini
wal_level = logical
max_replication_slots = 10
max_wal_senders = 10
```

Each pipeline uses one replication slot and one WAL sender.

{{< callout type="info" >}}

On managed PostgreSQL services, you change these settings through the provider instead of `postgresql.conf`.

* **Amazon RDS and Aurora:** Set `rds.logical_replication = 1` in the (cluster) parameter group, reboot, and run
  `GRANT rds_replication TO debezium;` instead of the `REPLICATION` attribute below.
* **Google Cloud SQL:** Set the database flag `cloudsql.logical_decoding = on`.
* **Azure Database for PostgreSQL:** Set the server parameter `wal_level = logical`.

See
also [PostgreSQL in the cloud](https://debezium.io/documentation/reference/stable/connectors/postgresql.html#postgresql-in-the-cloud)
in the Debezium documentation.

{{< /callout >}}

### Create a PostgreSQL role and publication

Connect to the source database as a superuser (on managed services, the administrative user the provider gives you) and
run:

```sql
CREATE ROLE debezium WITH LOGIN REPLICATION PASSWORD '<debezium-password>';
GRANT CONNECT ON DATABASE nursery TO debezium;
GRANT USAGE ON SCHEMA public TO debezium;
GRANT SELECT ON species, plants TO debezium;

CREATE PUBLICATION cedardb_publication FOR TABLE species, plants;
```

The publication lists the replicated tables.
Creating it yourself means Debezium does not need ownership of the tables.

### Prepare CedarDB

Connect to CedarDB as a superuser and create a role for the sink and a schema it owns:

```sql
CREATE ROLE debezium_sink WITH LOGIN PASSWORD '<sink-password>';
CREATE DATABASE nursery;
\c nursery
CREATE SCHEMA nursery_replica AUTHORIZATION debezium_sink;
```

As the schema owner, the sink can create, alter, and write the replicated tables without further privileges.
This works in every CedarDB edition.
Granting privileges with `GRANT` instead requires a CedarDB [enterprise license](/docs/licensing/).

### Start Kafka and Kafka Connect

Save this file as `compose.yaml`.
It runs a single Kafka broker in KRaft mode and a Kafka Connect worker with the Debezium connectors installed:

```yaml
services:
  kafka:
    image: quay.io/debezium/kafka:3.7
    environment:
      CLUSTER_ID: 5Yr1SIgYQz-b-dgRabWx4g
      NODE_ID: "1"
      KAFKA_PROCESS_ROLES: broker,controller
      KAFKA_LISTENERS: PLAINTEXT://0.0.0.0:9092,CONTROLLER://0.0.0.0:9093
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092
      KAFKA_CONTROLLER_LISTENER_NAMES: CONTROLLER
      KAFKA_LISTENER_SECURITY_PROTOCOL_MAP: CONTROLLER:PLAINTEXT,PLAINTEXT:PLAINTEXT
      KAFKA_CONTROLLER_QUORUM_VOTERS: 1@kafka:9093
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: "1"
      KAFKA_TRANSACTION_STATE_LOG_REPLICATION_FACTOR: "1"
      KAFKA_TRANSACTION_STATE_LOG_MIN_ISR: "1"
    volumes:
      - kafka-data:/kafka/data

  connect:
    image: quay.io/debezium/connect:3.7.0.Final
    depends_on:
      - kafka
    ports:
      - "8083:8083"
    environment:
      BOOTSTRAP_SERVERS: kafka:9092
      GROUP_ID: cedardb-connect
      CONFIG_STORAGE_TOPIC: cedardb_connect_configs
      OFFSET_STORAGE_TOPIC: cedardb_connect_offsets
      STATUS_STORAGE_TOPIC: cedardb_connect_statuses
      CONFIG_STORAGE_REPLICATION_FACTOR: "1"
      OFFSET_STORAGE_REPLICATION_FACTOR: "1"
      STATUS_STORAGE_REPLICATION_FACTOR: "1"

volumes:
  kafka-data:
```

Start it and check that both connector plugins are available:

```shell
docker compose up -d
curl -s http://localhost:8083/connector-plugins | grep -oE '"class":"[^"]*(PostgresConnector|JdbcSinkConnector)"'
```

```text
"class":"io.debezium.connector.jdbc.JdbcSinkConnector"
"class":"io.debezium.connector.postgresql.PostgresConnector"
```

This is a development setup.
For production, run several brokers, keep the Kafka data on persistent storage, replicate the internal Connect topics,
and do not expose the Kafka Connect REST port 8083, which has no authentication, to untrusted networks.
The deployment sections of the Debezium documentation for
the [PostgreSQL connector](https://debezium.io/documentation/reference/stable/connectors/postgresql.html#postgresql-deployment)
and the [JDBC sink connector](https://debezium.io/documentation/reference/stable/connectors/jdbc.html#jdbc-deployment)
cover production setups.

### Register the CedarDB sink

Save the sink configuration as `sink.json`:

```json
{
  "name": "cedardb-sink",
  "config": {
    "connector.class": "io.debezium.connector.jdbc.JdbcSinkConnector",
    "tasks.max": "1",
    "topics": "nursery.public.species,nursery.public.plants",
    "connection.url": "jdbc:postgresql://<cedardb-host>:5432/nursery?sslmode=require&reWriteBatchedInserts=true",
    "connection.username": "debezium_sink",
    "connection.password": "<sink-password>",
    "insert.mode": "upsert",
    "primary.key.mode": "record_key",
    "delete.enabled": "true",
    "truncate.enabled": "true",
    "schema.evolution": "basic",
    "quote.identifiers": "true",
    "collection.name.format": "nursery_replica.${source.table}",
    "use.reduction.buffer": "true",
    "connection.restart.on.errors": "true",
    "flush.max.retries": "120",
    "flush.retry.delay.ms": "1000"
  }
}
```

The most important settings:

| Setting                                     | Purpose                                                                                        |
|---------------------------------------------|------------------------------------------------------------------------------------------------|
| `topics`                                    | One topic per table, named `<topic.prefix>.<schema>.<table>`.                                  |
| `insert.mode`, `primary.key.mode`           | Apply each change as an upsert by primary key. Replaying a change after a restart is harmless. |
| `delete.enabled`, `truncate.enabled`        | Apply source deletes and truncates.                                                            |
| `schema.evolution`                          | Create missing tables and add new columns. See [Schema changes](#schema-changes).              |
| `collection.name.format`                    | Target table name. Here, the source table name in schema `nursery_replica`.                    |
| `use.reduction.buffer`                      | Collapse several changes to the same row in one batch into the final state.                    |
| `flush.max.retries`, `flush.retry.delay.ms` | Keep retrying for about two minutes when CedarDB is unreachable. The default is five retries.  |

Adjust `sslmode` in both configs to your servers
(see [SSL configuration](/docs/references/configuration/#ssl-configuration)).
Register the sink before the source, so it is ready when the first topics appear:

```shell
curl -fsS -X POST -H 'Content-Type: application/json' \
  http://localhost:8083/connectors --data @sink.json
```

### Register the PostgreSQL source

Save the source configuration as `source.json`:

```json
{
  "name": "postgres-source",
  "config": {
    "connector.class": "io.debezium.connector.postgresql.PostgresConnector",
    "tasks.max": "1",
    "database.hostname": "<postgres-host>",
    "database.port": "5432",
    "database.user": "debezium",
    "database.password": "<debezium-password>",
    "database.dbname": "nursery",
    "database.sslmode": "require",
    "topic.prefix": "nursery",
    "plugin.name": "pgoutput",
    "slot.name": "cedardb_slot",
    "publication.name": "cedardb_publication",
    "publication.autocreate.mode": "disabled",
    "table.include.list": "public.species,public.plants",
    "snapshot.mode": "initial",
    "decimal.handling.mode": "precise",
    "skipped.operations": "none",
    "heartbeat.interval.ms": "10000"
  }
}
```

`skipped.operations` set to `none` also emits `TRUNCATE` events, which Debezium skips by default.
The heartbeat lets PostgreSQL release WAL even when the replicated tables do not change.

Register the source:

```shell
curl -fsS -X POST -H 'Content-Type: application/json' \
  http://localhost:8083/connectors --data @source.json
```

The connector creates the replication slot, copies all existing rows, and then streams changes.

### Verify the replication

Check that both connectors **and** their tasks are `RUNNING`.
A connector can be `RUNNING` while its task has `FAILED`:

```shell
curl -s http://localhost:8083/connectors/postgres-source/status
curl -s http://localhost:8083/connectors/cedardb-sink/status
```

Then compare the tables.
Run the same query on PostgreSQL and on CedarDB (with `SET search_path = nursery_replica;` first) and check that the
results are identical:

```sql
SELECT count(*), sum(price), min(plant_id), max(plant_id)
FROM plants;
```

Changes on PostgreSQL usually appear in CedarDB within a few seconds.

{{% /steps %}}

The sink creates each target table with the source columns and primary key.
It does not copy secondary indexes, unique constraints, foreign keys, check constraints, or identity properties, and
`varchar(n)` columns become `text`.
If your analytical queries need indexes, create them yourself.

## Copy a snapshot once

To copy the current state of the tables once, for example
to [migrate from PostgreSQL](/docs/cookbook/importing_from_postgresql/), use `snapshot.mode` `initial_only`.
The connector copies all rows from a consistent snapshot, drops its replication slot, and does not stream changes
afterward.

Follow the steps above, but set `"snapshot.mode": "initial_only"` in `source.json`.
Adjust `table.include.list` if you want to copy only some of the published tables.

The import has finished when the Kafka Connect log contains `Streaming is disabled for snapshot mode initial_only`, the
lag of the consumer group `connect-cedardb-sink` is zero (see [Monitor the pipeline](#monitor-the-pipeline)), and the
validation queries match.
The source task keeps the state `RUNNING` after the snapshot, so do not wait for it to stop.

Keep these points in mind:

* Restarting the same connector does not copy the data again, because Kafka Connect has stored the snapshot as
  completed.
  For another import, or to import next to a running replication pipeline, use a new connector name, topic prefix, slot,
  and target schema.
* A second import into the same tables only upserts rows.
  Rows deleted at the source in the meantime remain in CedarDB.
* Debezium creates a target table only when it receives a row for it.
  Empty source tables do not appear in CedarDB.
* When you are done, delete both connectors and check that the slot `cedardb_slot` no longer exists in
  `pg_replication_slots`.

## Operate the pipeline

### Monitor the pipeline

Watch three things:

* **Connector and task state.** Every task must be `RUNNING`.
  Restart a failed task after fixing the cause:

  ```shell
  curl -fsS -X POST http://localhost:8083/connectors/cedardb-sink/tasks/0/restart
  ```

* **Consumer lag of the sink.** The lag is the number of changes in Kafka not yet written to CedarDB:

  ```shell
  docker compose exec kafka /kafka/bin/kafka-consumer-groups.sh \
    --bootstrap-server kafka:9092 --describe --group connect-cedardb-sink
  ```

* **Replication slot lag in PostgreSQL.** PostgreSQL keeps WAL until Debezium confirms it.
  A stopped or deleted pipeline whose slot still exists makes the WAL grow without limit:

  ```sql
  SELECT slot_name, active,
         pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), confirmed_flush_lsn)) AS lag
  FROM pg_replication_slots;
  ```

For the metrics that the connectors expose,
see [Monitoring](https://debezium.io/documentation/reference/stable/connectors/postgresql.html#postgresql-monitoring) in
the Debezium documentation.

If CedarDB is unreachable for a short time, the sink retries and catches up afterward.
Changes are applied at least once and in order per table, so CedarDB converges to the source state.
Changes to different tables are applied independently, so a query joining several replicated tables can briefly see one
table ahead of another.

### Remove the pipeline

Delete the connectors, then drop the replication slot and the publication in PostgreSQL:

```shell
curl -fsS -X DELETE http://localhost:8083/connectors/postgres-source
curl -fsS -X DELETE http://localhost:8083/connectors/cedardb-sink
```

```sql
SELECT pg_drop_replication_slot('cedardb_slot');
DROP PUBLICATION cedardb_publication;
```

To remove Kafka, Kafka Connect, and all topics, run `docker compose down -v`.
The replicated tables in CedarDB remain until you drop them.

### Schema changes

PostgreSQL logical replication does not transmit DDL.
The sink only sees the columns of incoming rows and, with `schema.evolution` set to `basic`, it only creates tables and
adds columns
(see [schema evolution](https://debezium.io/documentation/reference/stable/connectors/jdbc.html#jdbc-schema-evolution)
in the Debezium documentation).
The following table shows the effect of source DDL on CedarDB:

| Change in PostgreSQL                                  | Effect in CedarDB                                                                                                                                                                                                                                                                                                                                                                                  |
|-------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `ADD COLUMN`, with or without `DEFAULT` or `NOT NULL` | The column is added with its default and nullability. Existing rows get the default.                                                                                                                                                                                                                                                                                                               |
| `DROP COLUMN`                                         | The column remains in CedarDB and keeps its old values. New rows get `NULL` in it, so a `NOT NULL` column without a default makes the sink task fail. Before you drop such a column in PostgreSQL, run `ALTER TABLE ... ALTER COLUMN ... DROP NOT NULL` on the CedarDB table, or run it afterward and restart the task. Drop the column in CedarDB after the sink has processed all older changes. |
| `RENAME COLUMN`                                       | A new column with the new name is added and filled only for rows changed after the rename. The old column keeps its old values. Renaming a `NOT NULL` column without a default makes the sink task fail.                                                                                                                                                                                           |
| Change of a column type                               | The CedarDB column keeps its type.                                                                                                                                                                                                                                                                                                                                                                 |
| New table                                             | Not replicated until you add it to the publication, `table.include.list`, and `topics`. Existing rows of the new table are copied only with a Debezium [incremental snapshot](https://debezium.io/documentation/reference/stable/connectors/postgresql.html#postgresql-incremental-snapshots).                                                                                                     |

For drops, renames, and type changes, the safest approach is to rebuild the table: set up a second pipeline with new
connector names, topic prefix, slot, and target schema, as
in [Set up continuous replication](#set-up-continuous-replication), wait until it has caught up, and switch your queries
over.

{{< callout type="warning" >}}
CedarDB cannot yet add a column to a table that a view depends on.
If you create views on replicated tables, the sink task fails when a source table gets a new column, including the new
column of a renamed one.
To recover, drop the view, restart the sink task, and create the view again.
{{< /callout >}}

## Data types

The sink maps most PostgreSQL types to the same CedarDB type: integers, `numeric(p,s)`, `real`, `double precision`,
`boolean`, `text`, `varchar` (as `text`), `date`, `timestamp`, `timestamptz`, `uuid`, `jsonb` (as `json`), `bytea`, and
one-dimensional arrays.

### Decimals with more than six fractional digits

CedarDB columns such as `numeric(38,18)` store more than six fractional digits, but the sink cannot write such values
into them yet.
The sink sends each decimal value as a parameter of type `numeric` without precision and scale, and CedarDB currently
reads such a parameter as `numeric(38,6)` (see [Numeric](/docs/references/datatypes/numeric/)) before it converts the
value to the column type.
A value with nonzero digits after the sixth decimal place therefore stops the sink with a `loss of precision` error, and
a value smaller than 0.000001 is stored as `0`.

To replicate such columns exactly, send decimals as strings and create the target table yourself:

1. In `source.json`, set `"decimal.handling.mode": "string"`.
2. In the sink's `connection.url`, add `&stringtype=unspecified`.
3. Create the target table in CedarDB before you register the connectors, with the same `numeric(p,s)` types as the
   source:

   ```sql
   CREATE TABLE nursery_replica.soil_samples (
       sample_id integer PRIMARY KEY,
       ph        numeric(30,10),
       trace_ppm numeric(38,18)
   );
   ```

`decimal.handling.mode` applies to all tables of the source connector.
Tables that the sink creates automatically then get `text` columns instead of `numeric`.

### Unsupported types and values

CedarDB does not accept the following source data:

| Source data                                                  | Effect                                                                            | What to do                                                                                                                                                                                 |
|--------------------------------------------------------------|-----------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `timetz`, `xml`, `point`, and other geometric types          | The sink fails to create the table, because CedarDB does not support these types. | Exclude the columns with the source setting `column.exclude.list`, for example `"public.plants.pickup_window"`, and replicate a text copy maintained at the source if you need the values. |
| `infinity` and `-infinity` in `date` and `timestamp` columns | The sink stops, because CedarDB does not accept infinite dates and timestamps.    | Replace infinite values with finite values or `NULL` at the source, or exclude the column.                                                                                                 |
