---
title: "CedarDB Database Upgrade"
linkTitle: "Database Upgrade"
weight: 110
---
This page contains instructions for upgrading to a newer version of CedarDB that is not backward compatible with previous database formats.
Please check this page whenever a new release is listed in the release notes as incompatible with previous versions, as we will also be improving the process for upgrading database versions.

{{% callout type="warning" %}}
CedarDB releases are still in alpha, and some releases will break with the old database file format. To ensure a smooth upgrade process, please keep track of your DDL statements to re-create your schema if necessary.
{{% /callout %}}

## Export your data
For now, upgrading the database format requires exporting all user data held in tables.

{{% steps %}}

### Stop concurrent access

To prevent data loss, make sure that no other process is writing data to CedarDB while the upgrade is performed.
The data export runs in a separate transaction to ensure a consistent state of all your data, but any concurrent changes during the export will be lost!

### Copy data to CSV files

Once you have stopped all writer processes, copy all data out of CedarDB into CSV files.

First, connect to CedarDB using the `psql` tool from PostgreSQL.

```bash
psql -h localhost -U {{username}}
```

Following, copy all your tables to CSV files by running the following command for each table:

```sql
\copy {tablename} TO 'your/backup/path/{tablename}.csv' DELIMITER '|' CSV NULL '';
```


{{% /steps %}}


## Upgrade CedarDB

After you have exported all your data, you can upgrade CedarDB to the latest release.

{{% steps %}}

### Stop all running CedarDB instances

First, stop all running CedarDB instances.

### Backup and move old database files

To ensure access to the old database in case of problems during the upgrade, create a backup of the database directory.
This can be removed once the new version is running and all data has been imported correctly.
Once all running CedarDB instances are stopped, this can be done safely by any method, e.g., using the `mv` command.

```bash
mv your/path your/path.bak
```

{{% callout type="info" %}}
For docker deployments, `your/path` is the path which was mounted as a docker volume.
{{% /callout %}}

### Install latest version

Please follow the [installation guide](..) to install and start the latest CedarDB version.

{{% /steps %}}

## Re-import your data

Once the latest version of CedarDB is up and running, you can import your data back into it.

{{% steps %}} 

### Re-create your schema

Connect to the CedarDB instance and re-create your schema, e.g., by running your `schema.sql` script:

```bash
psql -h localhost -U {{username}} < schema.sql
```

### Copy data from CSV files
Once your schema is created, copy the contents of all tables from the CSV backups you created earlier.
Run for each table:

```sql
\copy {tablename} from 'your/backup/path/{tablename}.csv' DELIMITER '|' CSV NULL '';
```

{{% /steps %}}

## Cleanup

Once you have verified that all your data has been successfully imported into the new CedarDB version, you can clean up all intermediate and backup files.
This includes all old docker containers and binaries, as well as the CSV and database file backups.
