---
title: "Replicating from Amazon RDS for PostgreSQL with AWS DMS"
linkTitle: "Replicate with AWS DMS"
aliases:
  - /cookbook/aws_dms/
---

This recipe uses
the [AWS Database Migration Service (DMS)](https://docs.aws.amazon.com/dms/latest/userguide/Welcome.html) to copy tables
from Amazon RDS for PostgreSQL into CedarDB and to keep replicating changes afterward.
DMS connects to CedarDB as a regular PostgreSQL target, so it works for self-hosted CedarDB and CedarDB Cloud alike.
Your application keeps writing to PostgreSQL until you switch it over to CedarDB.

The example replicates a small table `shop.customers`.
The setup also works for other hosted or self-managed PostgreSQL databases, such as Aurora PostgreSQL.
Only enabling logical replication and the replication privileges of the DMS user differ,
see [Using a PostgreSQL database as an AWS DMS source](https://docs.aws.amazon.com/dms/latest/userguide/CHAP_Source.PostgreSQL.html)
for how to configure other sources.

## Prerequisites

* An Amazon RDS for PostgreSQL instance, or the permissions to create one.
  The example uses PostgreSQL 16.
* A CedarDB instance and the connection details of a superuser.
* The `psql` client to run the SQL statements in this recipe.

## Overview

```text
RDS PostgreSQL ──logical replication──► DMS replication instance ──PostgreSQL protocol──► CedarDB
```

DMS reads the changes from a logical replication slot in PostgreSQL and writes them to CedarDB with regular SQL
statements.
A DMS *task* first copies the existing rows (full load) and then applies the ongoing changes (change data capture, CDC).

The steps:

1. [Enable logical replication in RDS](#enable-logical-replication-in-rds)
2. [Prepare PostgreSQL](#prepare-postgresql)
3. [Prepare CedarDB](#prepare-cedardb)
4. [Create the replication instance](#create-the-replication-instance)
5. [Create the source and target endpoints](#create-the-source-and-target-endpoints)
6. [Create and start the task](#create-and-start-the-task)
7. [Verify the replication](#verify-the-replication)

The console labels in this recipe match the AWS console as of October 2026.

## Enable logical replication in RDS

DMS needs logical replication, which you enable through a DB parameter group.
In the RDS console, open **Parameter groups** and click **Create parameter group**:

| Field                  | Value                                                  |
|------------------------|--------------------------------------------------------|
| Parameter group name   | `cedardb-dms-source`                                   |
| Engine type            | PostgreSQL                                             |
| Parameter group family | The major version of your instance, e.g., `postgres16` |
| Type                   | DB Parameter Group                                     |

Open the new group, click **Edit**, and set these parameters:

| Parameter                 | Value | Purpose                                                           |
|---------------------------|-------|-------------------------------------------------------------------|
| `rds.logical_replication` | `1`   | Sets `wal_level` to `logical` and enables replication slots       |
| `wal_sender_timeout`      | `0`   | Prevents PostgreSQL from closing idle DMS replication connections |

Attach the parameter group to your RDS instance.
For a new instance, choose it under **Additional configuration → DB parameter group**.
For an existing instance, choose **Modify**, select the parameter group, and apply the change.
`rds.logical_replication` only takes effect after a reboot of the instance.

Check the setting with `psql`:

```sql
SHOW wal_level;
```

```text
 wal_level
-----------
 logical
```

## Prepare PostgreSQL

The example replicates this table in the source database:

```sql
CREATE SCHEMA shop;
CREATE TABLE shop.customers
(
    id         integer PRIMARY KEY,
    name       text        NOT NULL,
    email      text,
    created_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO shop.customers (id, name, email)
VALUES (1, 'Ada Lovelace', 'ada@example.com'),
       (2, 'Alan Turing', 'alan@example.com'),
       (3, 'Grace Hopper', 'grace@example.com');
```

{{< callout type="info" >}}
As with any DMS replication from PostgreSQL, the source tables need a primary key.
This is a limitation of DMS on the PostgreSQL side and applies to every target database.
For tables without a primary key, DMS only replicates inserts, not updates and deletes.
With `ALTER TABLE ... REPLICA IDENTITY FULL`, it also replicates updates and deletes, but leaves out the LOB columns of
such tables, which includes `text` columns.
See [Using a PostgreSQL database as an AWS DMS source](https://docs.aws.amazon.com/dms/latest/userguide/CHAP_Source.PostgreSQL.html)
for details.
{{< /callout >}}

DMS only needs to read the replicated tables and to use logical replication.
Create a dedicated user in the source database:

```sql
CREATE USER dms_user WITH PASSWORD '<password>';
GRANT rds_replication TO dms_user;
GRANT USAGE ON SCHEMA shop TO dms_user;
GRANT SELECT ON ALL TABLES IN SCHEMA shop TO dms_user;
```

Grant `SELECT` on tables before adding them to a DMS task.

## Prepare CedarDB

DMS can create the tables in CedarDB itself.
The tables get the columns, types, and primary key of the source, but no column defaults, secondary indexes, or other
constraints.
That is enough to for most replication cases but might be insufficient for a full migration.
For a migration, create the full schema in CedarDB before you start the task, for example with `pg_dump --schema-only`
as described in [Copy with pg_dump](../pg_dump/), and let DMS only load the data.

In both cases DMS also creates additional tables to track progress, prefixed `awsdms_*` in CedarDB.

## Create the replication instance

The replication instance is the EC2 machine that runs the DMS tasks.
It must reach both PostgreSQL and CedarDB on port 5432.
The example puts all AWS resources in the default VPC.

1. In the EC2 console, create a security group `dms-replication-sg` in the VPC, without inbound rules.
2. In the security group of your RDS instance, add an inbound rule for **PostgreSQL** (port 5432) with the source
   `dms-replication-sg`.
3. In the DMS console, open **Subnet groups**, click **Create subnet group**, name it `cedardb-dms`, select the VPC, and
   add its subnets.
4. Open **Provisioned instances** and click **Create replication instance**:

| Field                    | Value                                                                         |
|--------------------------|-------------------------------------------------------------------------------|
| Name                     | `cedardb-dms`                                                                 |
| Instance class           | `dms.r6i.large` for small tables, see [Sizing](#sizing-for-high-change-rates) |
| High availability        | Dev or test workload (Single-AZ)                                              |
| Allocated storage        | 50 GiB                                                                        |
| VPC                      | The VPC of your RDS instance                                                  |
| Replication subnet group | `cedardb-dms`                                                                 |
| Public accessible        | Yes, if CedarDB runs outside the VPC (e.g., CedarDB Cloud)                    |
| VPC security groups      | `dms-replication-sg`                                                          |

If CedarDB runs outside the VPC, the replication instance needs internet access.
In a public subnet, such as those of the default VPC, it needs a public IP address and thus **Public accessible**.
In a private subnet, it needs a NAT gateway instead.

The replication instance takes about 10 minutes to become available.

## Create the source and target endpoints

In the DMS console, open **Endpoints** and click **Create endpoint** for the source:

| Field                          | Value                                  |
|--------------------------------|----------------------------------------|
| Endpoint type                  | Source endpoint                        |
| Select RDS DB instance         | Checked, then choose your RDS instance |
| Endpoint identifier            | `rds-source`                           |
| Source engine                  | PostgreSQL                             |
| Access to endpoint database    | Provide access information manually    |
| User name / Password           | `dms_user` and its password            |
| Secure Socket Layer (SSL) mode | `require`                              |
| Database name                  | `postgres`                             |
| Endpoint settings              | `CaptureDdls` = `false`                |

The example assumes a stable schema and turns off the replication of schema changes, so `dms_user` only needs read and
replication privileges.
Apply schema changes to CedarDB yourself before you make them in PostgreSQL.
To let DMS replicate schema changes instead, keep `CaptureDdls` enabled and connect with a user that can create event
triggers, such as the RDS master user.

Create a second endpoint for CedarDB:

| Field                       | Value                                      |
|-----------------------------|--------------------------------------------|
| Endpoint type               | Target endpoint                            |
| Endpoint identifier         | `cedardb-target`                           |
| Target engine               | PostgreSQL                                 |
| Access to endpoint database | Provide access information manually        |
| Server name / Port          | Host name of your CedarDB instance, `5432` |
| User name / Password        | A CedarDB superuser                        |
| SSL mode                    | `require`                                  |
| Database name               | `postgres`                                 |

{{< callout type="info" >}}
CedarDB Cloud uses a self-signed certificate.
Use the SSL mode `require`, which encrypts the connection without verifying the certificate.
The modes `verify-ca` and `verify-full` fail.
{{< /callout >}}

For both endpoints, use **Test endpoint connection** with the replication instance `cedardb-dms` before you create them.

## Create and start the task

In the DMS console, open **Database migration tasks** and click **Create task**:

| Field                                | Value                                                                  |
|--------------------------------------|------------------------------------------------------------------------|
| Task identifier                      | `shop-to-cedardb`                                                      |
| Source / Target database endpoint    | `rds-source` / `cedardb-target`                                        |
| Replication instance                 | `cedardb-dms`                                                          |
| Migration type                       | Migrate and replicate                                                  |
| Target table preparation mode        | Drop tables on target                                                  |
| LOB column settings                  | Limited LOB mode, maximum LOB size 32 KB                               |
| Task logs                            | Turn on CloudWatch logs                                                |
| Turn on batch-optimized apply        | Optional for small tables, see [Sizing](#sizing-for-high-change-rates) |
| Premigration assessment              | Off                                                                    |
| Migration task startup configuration | Automatically on create                                                |

Under **Table mappings**, add a selection rule with schema `shop`, source table name `%`, and action **Include**.

With **Drop tables on target**, DMS creates the tables in CedarDB.
If you created the schema in CedarDB beforehand, choose **Truncate** instead, which keeps your tables, indexes, and
defaults.

DMS treats PostgreSQL `text` columns as LOBs.
In limited LOB mode, DMS truncates values longer than the maximum LOB size, so set it above your longest `text` value.

## Verify the replication

Once the task status is **Load complete, replication ongoing**, the tab **Table statistics** shows the copied rows.
Check the rows in CedarDB:

```sql
SELECT *
FROM shop.customers
ORDER BY id;
```

```text
 id |     name     |       email       |          created_at
----+--------------+-------------------+-------------------------------
  1 | Ada Lovelace | ada@example.com   | 2026-10-13 15:16:13.975097+00
  2 | Alan Turing  | alan@example.com  | 2026-10-13 15:16:13.975097+00
  3 | Grace Hopper | grace@example.com | 2026-10-13 15:16:13.975097+00
(3 rows)
```

Change some rows in PostgreSQL:

```sql
BEGIN;
INSERT INTO shop.customers (id, name, email)
VALUES (4, 'Edsger Dijkstra', 'edsger@example.com');
UPDATE shop.customers
SET email = 'grace.hopper@example.com'
WHERE id = 3;
DELETE
FROM shop.customers
WHERE id = 2;
COMMIT;
```

After a few seconds, CedarDB shows the changes:

```sql
SELECT id, name, email
FROM shop.customers
ORDER BY id;
```

```text
 id |      name       |          email
----+-----------------+--------------------------
  1 | Ada Lovelace    | ada@example.com
  3 | Grace Hopper    | grace.hopper@example.com
  4 | Edsger Dijkstra | edsger@example.com
(3 rows)
```

Changes that DMS could not apply appear in `awsdms_apply_exceptions`, which should be empty:

```sql
SELECT count(*)
FROM public.awsdms_apply_exceptions;
```

## Switch over to CedarDB

1. Stop the writes of your application to PostgreSQL.
2. Wait until the last changes arrived in CedarDB, i.e., the metric `CDCLatencyTarget` of the task drops to a few
   seconds and the row counts match.
3. Stop and delete the task.
4. Point your application to CedarDB.

## Sizing for high change rates

DMS writes changes to CedarDB in one of two modes:

* **Transactional apply** (default) replays each change as a single statement, in the order of the source transactions.
  It suits low change rates.
* **Batch-optimized apply** collects changes, copies them into the staging table `awsdms_changes<id>` with `COPY`, and
  applies them with a few set-based `INSERT`, `UPDATE`, and `DELETE` statements per table.
  Use it for high change rates, because CedarDB processes such set-based statements efficiently.
  DMS applies a batch after at most `BatchApplyTimeoutMax` seconds (default 30) or once the batch reaches
  `BatchApplyMemoryLimit` (default 500 MB), so the replication lag is up to 30 seconds by default.

With high change rates, the replication instance usually limits the throughput, not CedarDB.
A task reads and decodes the changes from PostgreSQL in only a few threads, so it uses about two cores, regardless of
the instance size.
DMS reports `CPUUtilization` across all cores, so 200% means two fully used cores.

To replicate high change rates:

* Turn on batch-optimized apply.
* Choose a replication instance with fast cores and enough memory rather than many cores.
* If a task cannot keep up, split the tables across several tasks.
  Each task uses its own replication slot and threads.
* Avoid stopping a task under load.
  While it is stopped, PostgreSQL retains the WAL for the replication slot to continue the task at a later point.
  Catching up again is bound to take much longer than the task was stopped for.

## Monitoring

The task tab **Monitoring** and CloudWatch (namespace **DMS**, dimension **ReplicationTaskIdentifier** with the task
resource ID) show:

| Metric               | Meaning                                                         |
|----------------------|-----------------------------------------------------------------|
| `CDCLatencySource`   | How far DMS lags behind when reading changes from PostgreSQL    |
| `CDCLatencyTarget`   | How far CedarDB lags behind PostgreSQL                          |
| `CDCIncomingChanges` | Changes that DMS has read but not yet applied                   |
| `CPUUtilization`     | CPU usage of the replication instance or task, across all cores |

If `CDCLatencySource` is close to `CDCLatencyTarget`, the replication instance is the bottleneck.

In PostgreSQL, check how much WAL the replication slot retains:

```sql
SELECT slot_name,
       active,
       pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), confirmed_flush_lsn)) AS backlog
FROM pg_replication_slots;
```

The slot name starts with the resource ID of the task, which is the last part of the task ARN.

## Clean up

Deleting a task also drops its replication slot in PostgreSQL.
A stopped task keeps its slot, and PostgreSQL retains all WAL from that point on until the storage fills up.
So make sure to delete the task fully if you plan to keep using the source instance.

You can check `pg_replication_slots` to make sure the replication slot was properly cleaned up on task deletion.

## Related tool documentation

| Tool                                            | Description                                                         |
|-------------------------------------------------|---------------------------------------------------------------------|
| [Debezium](/docs/clients/data_import/debezium/) | Replicate from PostgreSQL to CedarDB through Kafka, outside of AWS. |
| [Copy with pg_dump](../pg_dump/)                | Create the full schema in CedarDB before you start the DMS task.    |
| [psql](/docs/clients/tools/psql/)               | The PostgreSQL command-line client used in this recipe.             |
