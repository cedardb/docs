---
title: Configuration
linkTitle: "Configuration"
prev: /example_datasets
next: /cookbook
weight: 30
---

In this part of the documentation, we will show you settings to control the resource usage of CedarDB, help you to collect benchmark results, and highlight some of our advanced configurations.
Usually, the advanced configuration are not necessary as CedarDB employs strategies to automatically choose the best setting for you.


## Resource usage

### Buffer Size

By default, CedarDB uses 50% of the available system memory for our internal page cache.
If you run multiple applications on a single instance, you might want to reduce this amount.
In contrast to all the other settings, this setting has to be defined during the start up phase of CedarDB.
The amount of used memory can be defined via an environment variable in your shell.

```shell
export BUFFERSIZE=1G
```

### Degree of parallelism

CedarDB also uses *all* threads of the system for best performance.
This is intended behaviour, but might generate high load on your machine.
If you want to keep other applications responsive, consider starting CedarDB with `nice`.
Alternatively, you can restrict the number of threads that CedarDB uses.
However, keep in mind that this limits the performance of CedarDB since all queries leverage the full parallelism of the system.
This stems from our superior [morsel-driven](https://db.in.tum.de/~leis/papers/morsels.pdf) parallelization strategy.
To change the parallelism, simply query the database with the following PostgreSQL-style setting command

```sql
set debug.parallel=8;
```

## Storage types

CedarDB implements different storage types.
As you have seen in an earlier chapter of this documentation, you can specify the storage type during the creation of a table.

```sql
create table persons (
    id integer primary key generated always as identity,
    name text
) with (storage = columnar);
```

We support different storage types:
  - `columnar` should be used as the default storage that leverages the buffer manager and provides ACID guarantees. It is optimized for hybrid and analytical workloads.
  - `paged` uses a PAX-layout that leverages the buffer manager and provides ACID guarantees. It is optimized for OLTP workloads.
  - `mapped` is an in-memory only relation that should not be used in production.


## Benchmarking


### Repetition of queries

To validate results, it is important to run queries multiple times.
To repeat a query, you can either repeat the execution (*e*), the compilation (*c*), or both (*a*).
To change the repetition mode, simply query this command.

```sql
set debug.repeatmode='a';
```

The amount of repetitions can simply be set with the following command.

```sql
set debug.repeat=3;
```


### Timeout

In the unlikely event of a long running query, you would like to specify a maximum amount.
This can be achieved with our timeout setting.
This setting specifies the timeout in milliseconds, and 0 milliseconds disable the timeout.

```sql
set debug.timeout=1000;
```

## SQL tool

If you launch our sql tool, we have additional commands that help you benchmark our system.

### General commands

A list of possible commands are shown with our help-command.
```
\?
```

If you would like to specify a query that is stored within a file, you can load and execute the query with our input command.
```
\i path/to/query.sql
```


### Performance statistics commands


To record our performance statistics, you can create a CSV with our performance results.
Simply specify the output CSV with the following setting.

```
\record path/to/perf.csv
```


The output of the queries can be redirected to files (or `/dev/null`).

```
\o path/to/output
```


## Advanced configuration

Although these settings are usually determined automatically, we briefly discuss some of our advanced settings.

### Compilation strategy

CedarDB is a compiling database, such that every query is compiled to machine executable code.
To do so, we first create our own intermediate representation (think of LLVM-IR) which is then compiled to machine code.
We offer several compilation backends:
  - Adaptive ('a'): Adaptively chooses the best backend according to the current execution of the query (default).
  - Interpreted ('i'): Interprets the generated code with very low latency.
  - DirectEmit ('d'): Directly generates executable machine code from our intermediate representation with low latency and good query execution performance.
  - Cheap ('c'): Medium latency backend that compiles the intermediate representation with LLVM and few optimizations and good query execution performance.
  - Optimized ('o'): High latency backend that compiles the intermediate representation with LLVM and many optimizations for superior execution performance.


```sql
set debug.compilationmode='a';
```

### Multiway joins

CedarDB does not only implement binary joins but also multiway joins.
These joins are especially useful in graph workloads.
Because most workloads do not benefit by these types of joins, we only use them conservatively.
If your workload benefits by such joins, you can direct the database system to more actively use such joins with the following options:

  - Cautious ('c'): Conservatively use multiway joins only when these joins clearly outperform binary joins.
  - Eager ('e'): Use multiway joins more aggressively when the estimated runtime is slightly improved.
  - Disabled ('d'): Allows only binary joins.

```sql
set debug.multiway='c';
```

