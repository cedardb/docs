---
title: "Reference: System_stats Extension"
linkTitle: "System_stats Extension"
---

CedarDB offers built-in functions with the same types and functionality as the PostgreSQL extension
[System_stats](https://github.com/EnterpriseDB/system_stats).

## Usage example

```sql
select * from pg_sys_os_info();
```

```text
 name  |    version    |   host_name    |   domain_name    | handle_count | process_count | thread_count | architecture |    last_bootup_time     | os_up_since_seconds 
-------+---------------+----------------+------------------+--------------+---------------+--------------+--------------+-------------------------+---------------------
Debian | 0.3.7-generic | your-host-name | your.domain.name |         1234 |           400 |          840 | x86-64       | 2026-09-08 05:52:55 UTC |               25028 
(1 row)
```

{{< callout type="info" >}}
The `pg_sys_` tables can be queried by superusers and users with the `pg_read_all_stats` role.
{{< /callout >}}

## Tables

`pg_sys_os_info`
: General information on the operating system and host.

`pg_sys_cpu_info`
: Information on the CPU. Fields `processor_type`, `logical_processor`, and `cpu_type`
are stubbed for compatibility and always return `NULL`.

`pg_sys_cpu_usage_info`
: Information on CPU usage. Values are a percentage of time spent by CPUs for all operations, divided by type of CPU operation.

`pg_sys_memory_info`
: Information on memory usage. All values are in bytes.

`pg_sys_io_analysis_info`
: Information on block device I/O. CedarDB returns one row per detected block device.

`pg_sys_disk_info`
: Information on installed disks. CedarDB returns one row per detected disk.

`pg_sys_load_avg_info`
: The average CPU load of the system over 1, 5, 10, and 15 minute intervals.

`pg_sys_process_info`
: Aggregate information on currently active processes.

`pg_sys_network_info`
: Information on network interfaces. CedarDB returns one row per detected network interface.

`pg_sys_cpu_memory_by_process`
: Information on CPU, memory, and other resource usage per process. CedarDB returns one row per process.
