---
title: Load History
weight: 20
---

CedarDB collects metrics on system usage. These metrics include CPU usage, network usage,
disk usage for the disk the database resides on, as well as some CedarDB-internal metrics.

These metrics are exposed through system tables, and can be queried through sql:

```sql
select * from cedardb_cpu_load_history
order by timestamp desc
limit 10;
```

```text
           timestamp           | cpu_load  
-------------------------------+-----------
 2026-09-08 14:09:51.552458+02 |       2.1
 2026-09-08 14:09:41.552465+02 |      2.06
 2026-09-08 14:09:31.552557+02 |      1.37
 2026-09-08 14:09:21.552383+02 | 1.5500001
 2026-09-08 14:09:11.552349+02 |       1.4
 2026-09-08 14:09:01.552454+02 | 1.5799999
 2026-09-08 14:08:51.552497+02 | 1.5899999
 2026-09-08 14:08:41.552507+02 |      1.77
 2026-09-08 14:08:31.552545+02 |      2.23
 2026-09-08 14:08:21.552451+02 | 2.5500002
(10 rows)
```

{{< callout type="info" >}}
Load history collection is an enterprise feature and requires an enterprise license to use.
{{< /callout >}}

## Configuration

Both the interval in which these metrics are collected and the number of measurements to retain can be configured.

Setting `loadhistory.interval` specifies the time between two measurements (in ms). The default value for this setting is `10000` (10 seconds).
Setting this to `0` disables load history collection altogether.

Setting `loadhistory.retention` specifies the number of measurements that are stored before they will be dropped. The default value for this setting is `8640`.
For an interval of 10 seconds, this will retain values for 24 hours.

## Metrics and Tables

All `cedardb_*_load_history` tables have as their first column the `timestamp` of when the measurement was taken.

### CPU load

CedarDB makes available the CPU usage through the system table `cedardb_cpu_load_history`.

`cpu_load`
: CPU usage in percent

### Connection activity

CedarDB makes available metrics on connections through the system table `cedardb_connection_load_history`.

`total`
: Total number of connections to the database open

`active`
: Connections currently executing a statement

`idle`
: Connections currently not inside a transaction

`idle_in_transaction`
: Connections with an active transaction, but not currently executing a statement

### Memory usage

Since CedarDB is optimized to make good use of memory, it uses 90% of system memory by default. Thus, it doesn't report
usage of system RAM, but rather the pressure on the buffer manager. This metric is exposed through the system table
`cedardb_memory_load_history`.

`buffer_pressure`
: The last known pressure estimate of the buffer manager

You can read more about CedarDB's technology [on the docs page](../../../technology).

### Disk usage

CedarDB makes available metrics on the disk that the database resides on through the system table `cedardb_disk_load_history`.

All metrics are in bytes.

`disk_size`
: The total size of the disk

`free_space`
: The total free space left on the disk

`db_file_size`
: The size of the `db` file

`page_file_size`
: The size of the `db.pages` file

`tmpfiles_dir_size`
: The combined size of all files inside the `tmpfiles` directory

`wal_files_size`
: The combined size of all `.wal` files

`read_bytes`
: The number of bytes read by CedarDB since startup

`write_bytes`
: The number of bytes written by CedarDB since startup

### Network I/O

CedarDB makes available metrics on network usage through the system table `cedardb_network_load_history`.

`read_bytes`
: The total number of bytes read from any network interface (except `loopback`) since OS startup

`write_bytes`
: The total number of bytes written to any network interface (except `loopback`) since OS startup
