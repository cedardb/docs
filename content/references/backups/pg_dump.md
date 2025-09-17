---
title: SQL Dump using pg_dump
prev: /references/backups
next: /references/backups/pg_dump
weight: 10
---
In addition to a full file-system level backup, which requires the database to be shut down,
you can use the `pg_dump` tool to create backups without interrupting regular queries.

{{<callout type="warning">}}
`pg_dump` compatibility is currently in preview mode and is not guaranteed to work with all schemas!
{{</callout>}}

{{<callout type="warning">}}
`pg_dump` does currently not recreate schema object ownership and access rights correctly!
However, it is expected to fully and correctly backup tables, indexes, views, functions and sequences.
{{</callout>}}

## Creating Backups


{{<callout type="info">}}
`pg_dump` does not work with the interactive sql shell mode of CedarDB as pg_dump expects to connect to a PostgreSQL compatible server!
{{</callout>}}

## Restoring Backups
For backups in text mode, the resulting SQL file `dump.sql` can be re-applied to an empty database using the psql tool:

```
psql -X dbname < dump.sql
```
