---
title: "Migrating from PostgreSQL to CedarDB"
linkTitle: "Importing from PostgreSQL"
weight: 10
---

CedarDB is highly PostgreSQL compatible and works with most PostgreSQL tools out of the box, so you can move a
PostgreSQL database to CedarDB with the tools you already know.
The recipes in this section copy a PostgreSQL database into CedarDB once, or keep copying changes until you switch your
application over.
They work for self-hosted PostgreSQL and managed services such as Amazon RDS, Aurora, Google Cloud SQL, and Azure
Database for PostgreSQL, and for self-hosted CedarDB and CedarDB Cloud alike.

## Recipes

| Recipe                                             | Downtime                     | What arrives in CedarDB                                                                       | Use it when                                                                                                                         |
|----------------------------------------------------|------------------------------|-----------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------|
| [Copy with pg_dump](pg_dump/)                      | For the duration of the copy | Complete schema with keys, indexes, defaults, identity columns, views, owners, and privileges | You want the simplest setup and can stop writes to PostgreSQL while the data is copied. Needs only the PostgreSQL client tools.     |
| [Migrate with minimal downtime](minimal_downtime/) | During the switchover only   | Complete schema, as with `pg_dump`                                                            | Your application must keep writing to PostgreSQL until a short switchover. Uses `pg_dump` for the schema and Debezium for the data. |
| [Replicate with AWS DMS](aws_dms/)                 | During the switchover only   | Tables created by the DMS task                                                                | Your PostgreSQL runs on Amazon RDS or Aurora and you want a managed AWS service.                                                    |

## What to expect

* **Schema.** `pg_dump` restores tables, views, indexes, constraints, defaults, identity columns, owners, and privileges
  as they are in PostgreSQL.
* **Roles and privileges.** The recipes copy roles with `pg_dumpall`, including their passwords, so applications keep
  their credentials.
  Privileges require a CedarDB [enterprise license](/docs/licensing/). With the community edition, the recipes keep the
  owners and skip the privileges.
* **Data types.** Most PostgreSQL types arrive unchanged.
  CedarDB does not support `timetz`, `xml`, the geometric types, stored generated columns, and `infinity` dates and
  timestamps. The `pg_dump` and minimal-downtime recipes show how to find and convert them first.
* **Downtime.** A one-time copy needs a pause in writes for as long as the copy takes.
  With change data capture (Debezium or AWS DMS), the pause shrinks to the switchover.
* **Validation.** The `pg_dump` and minimal-downtime recipes end with queries that compare row counts and checksums on
  both sides, so you can check the copy before you switch.

## Related tool documentation

| Tool                                                                    | Description                                                                                                                                                               |
|-------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| [Airbyte](/docs/clients/data_import/airbyte/)                           | Copy tables once with Airbyte's Postgres connectors, also from sources other than PostgreSQL. Creates its own tables with extra Airbyte columns, without keys or indexes. |
| [Debezium](/docs/clients/data_import/debezium/)                         | Keep CedarDB continuously in sync with PostgreSQL through Kafka, or copy a snapshot once. Creates tables with columns and primary keys.                                   |
| [psql](/docs/clients/tools/psql/)                                       | The PostgreSQL command-line client used in the recipes.                                                                                                                   |
| [Importing and working with CSV data](/docs/cookbook/working_with_csv/) | `COPY` options for CSV files.                                                                                                                                             |
