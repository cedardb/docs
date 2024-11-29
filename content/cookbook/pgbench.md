---
title: "Tutorial: Benchmarking with pgbench"
linkTitle: "pgbench"
weight: 100
---

`pgbench` is a benchmarking utility [included with PostgreSQL](https://www.postgresql.org/docs/current/pgbench.html),
and widely available in package repositories:
```shell
sudo apt install postgresql-contrib
```

The workload executed by `pgbench` are mainly small point queries which touch little data.
This is a workload that represents typical simple CRUD-style workloads and specifically stress CedarDB's I/O subsystem
and index performance.

{{< callout type="info" >}}
Small transactions are suboptimal for performance, since these requests are typically latency bound, and a DBMS
additionally needs expensive logic for transaction isolation and durability.
When small requests become a performance problem, consider *request batching*, and e.g., insert 100 values in one
transaction.
{{< /callout >}}

## Running pgbench

pgbench runs its workloads on a simple four table schema:
```sql
create table pgbench_history (tid int, bid int, aid int, delta int, mtime timestamp);
create table pgbench_tellers (tid int primary key, bid int, tbalance int, filler char(84));
create table pgbench_accounts (aid int primary key, bid int, abalance int, filler char(84));
create table pgbench_branches (bid int primary key, bbalance int, filler char(88));
```

### Setup

Before running any benchmarks, the tables need to be initialized with some data.
Since the default data is rather small, we recommend specifying a scale factor for the data with the `--scale`
parameter.
The scale determines how many rows are loaded into the database the during initialization, where a scale of 1
corresponds to 100k rows.
A scale factor of 100 thus inserts 10M rows with about 200MB of data.

In addition to the scale, you also need to specify the connection parameters, username and database name:
```shell
pgbench --initialize -h localhost -U postgres postgres --scale=100
```
```
dropping old tables...
creating tables...
generating data (client-side)...
10000000 of 10000000 tuples (100%) done (elapsed 1.52 s, remaining 0.00 s)
vacuuming...
creating primary keys...
done in 3.65 s (drop tables 0.00 s, create tables 0.02 s, client-side generate 2.00 s, vacuum 0.03 s, primary keys 1.59 s).
```

### Run the Benchmark

After initialization, you can run the benchmark on the initialized database.
The benchmark driver will automatically detect the scale factor of your database that you specified in the last step.
pgbench has different built-in workloads that can be selected with the `--builtin` parameter.
In addition, we recommend to use prepared statements with the `--protocol=prepared` parameter.

#### Read-only workload

For a simple read-only workload, you can run the builtin `select` workload.
This executes a simple in-memory primary-key lookup, which is not very taxing for the database system and creates
little load, but is mostly bound by the connection latency.

```shell
pgbench -h localhost -U postgres postgres -T 10 --protocol=prepared --builtin=select
```
```
pgbench (16.3 (Ubuntu 16.3-0ubuntu0.24.04.1))
starting vacuum...end.
transaction type: <builtin: select only>
scaling factor: 1
query mode: prepared
number of clients: 1
number of threads: 1
maximum number of tries: 1
duration: 10 s
number of transactions actually processed: 601721
number of failed transactions: 0 (0.000%)
latency average = 0.017 ms
initial connection time = 1.080 ms
tps = 60178.442808 (without initial connection time)
```

With many concurrent benchmark threads and connections, this workload becomes less latency sensitive, and gives a better
picture that allows you to judge how the system scales in a read-heavy scenario:

```shell
pgbench -h localhost -U postgres postgres -T 10 --protocol=prepared --builtin=select --jobs=20 --client=200
```
```
tps = 1183279.095676 (without initial connection time)
```

#### Update-heavy workload

For a workload with many small writes, you can run the builtin `simple-update` workload.
However, this needs synchronous writes to storage to guarantee the durability of writes.
This needs synchronous writes to storage.
For typical consumer SSDs, this is >1ms, but enterprise SSDs can have lower write latency.

```shell
pgbench -h localhost -U postgres postgres -T 10 --protocol=prepared --builtin=simple-update
```
```
pgbench (16.3 (Ubuntu 16.3-0ubuntu0.24.04.1))
starting vacuum...end.
transaction type: <builtin: simple update>
scaling factor: 1
query mode: prepared
number of clients: 1
number of threads: 1
maximum number of tries: 1
duration: 10 s
number of transactions actually processed: 14926
number of failed transactions: 0 (0.000%)
latency average = 0.670 ms
initial connection time = 0.234 ms
tps = 1492.543731 (without initial connection time)
```

Again, scaling the number of concurrent writes allows much higher throughput, since the workload is no longer latency
bound.

```shell
pgbench -h localhost -U postgres postgres -T 10 --protocol=prepared --builtin=simple-update --jobs=20 --client=200
```
```
tps = 45882.003693 (without initial connection time)
```
