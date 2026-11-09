---
title: "Reference: Backup Statement"
linkTitle: "Backup"
---

The BACKUP statement creates an online backup of the running database.

The following command writes a backup to the '/var/backups/cedardb/2026-11-09' directory on the server.

```sql
BACKUP ALL TO '/var/backups/cedardb/2026-11-09';
```

## Syntax

```sql
BACKUP ALL TO '<destination path>';
```

- `<destination path>` is the directory on the server to which the backup is written. It must be empty.

Only superusers can run `BACKUP`.

## Behavior

- The backup is _online_, other sessions can keep using the database while the backup runs.
- The `BACKUP` statement only returns after the backup has been completely written. Only one backup can run at a time.
- If the backup fails, CedarDB removes the incomplete destination directory.
- A backup takes about as much space as the database itself. CedarDB refuses to perform a backup if the destination filesystem does not have sufficient free space.

{{% callout type="warning" %}}
While a backup is running, CedarDB defers truncating its write-ahead log and deleting obsolete data files.
On a database with heavy writes, this temporarily increases the disk usage of the database itself.
{{% /callout %}}

## Restoring a backup

A backup is a complete database directory. To restore it, start CedarDB on the backup directory:

```shell
./cedardb '/var/backups/cedardb/2026-11-09'
```

The backup includes write-ahead log records that CedarDB replays when it first opens the backup.
Restore a backup with the same CedarDB version that created it, as compatibility of backups across versions is not guaranteed.

To move to a newer version, restore with the original version first, then upgrade as usual.
