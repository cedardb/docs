---
title: Configuration
linkTitle: "Configuration"
prev: /datatypes
next: /sqlreference
weight: 30
---

In this part of the documentation, we will show you settings to control CedarDB's resource usage, help you collect
benchmark results, and highlight some of our expert configuration options.
Usually, configuring these options is unnecessary, as CedarDB uses strategies to automatically choose the best settings
for you.

## Resource usage

### Buffer Size

By default, CedarDB uses 50% of available system memory for our buffer manager.
If you are running multiple applications on a single instance, you may want to reduce this amount.
Unlike all other settings, this setting must be set during the startup phase of CedarDB.
The amount of memory used can be set via an environment variable in your shell.
The following shell command sets the available buffer size to 1 GB.

```shell
export BUFFERSIZE=1G
```

### Degree of parallelism

CedarDB also uses *all* threads of the system for best performance.
This is intended behaviour, but might generate high load on your machine.
If you want to keep other applications responsive, consider starting CedarDB with `nice`.
Alternatively, you can limit the number of threads CedarDB uses.
Note, however, that this will limit the performance of CedarDB, since all queries will take advantage of the full
parallelism of the system.
This stems from our superior [morsel-driven](https://db.in.tum.de/~leis/papers/morsels.pdf) parallelization strategy.
To change the parallelism, simply query the database with the following PostgreSQL-style set command

```sql
set debug.parallel=8;
```

## Benchmarking

### Repetition of queries

To validate performance, it is important to run queries multiple times.
To repeat a query, you can either repeat the execution (`e`), the compilation (`c`), or both (`a`).
To change the repetition mode, simply query this command.

```sql
set debug.repeatmode='a';
```

The number of repetitions can be set with the following command.

```sql
set debug.repeat=3;
```

### Timeout

In the unlikely event of a long-running query, you may want to set a query time after which the query is terminated
automatically.
This can be accomplished with our timeout setting.
This setting specifies the timeout in milliseconds, with 0 milliseconds disabling the timeout.

```sql
set debug.timeout=1000;
```

## SQL tool

When you run our sql tool, we have additional commands that will help you benchmark our system.

### General commands

For a list of possible commands, use our help command.

```
\?
```

If you want to specify a query that is stored in a file, you can load and run the query with our input command.

```
\i path/to/query.sql
```

### Performance statistics commands

In interactive mode, you can enable timing of commands using:
```
\timing on
```

To record our performance statistics, you can create a CSV with our performance results.
Just specify the output CSV with the following setting.

```
\record path/to/perf.csv
```

The output of the queries can be redirected to files (or `/dev/null`).

```
\o path/to/output
```

## Advanced configuration

Although these settings are usually determined automatically, we will briefly discuss some of our advanced settings.

### Compilation strategy

CedarDB is a compiling database, so each query is compiled into machine executable code.
To do this, we first create our own intermediate representation (think LLVM-IR), which is then compiled into machine
code.
We provide several compilation backends:

- Adaptive `a`: Adaptively chooses the best backend according to the current execution of the query and changes the
  execution over the duration of the query. It starts with the fastest latency backend and gradually transitions to
  faster but higher latency backends (default).
- Interpreted `i`: Interprets the generated code with very low latency but achieves only low performance.
- DirectEmit `d`: Directly generates executable machine code from our intermediate representation with low latency and
  good query execution performance.
- Cheap `c`: Medium latency backend that compiles the intermediate representation with LLVM and few optimizations and
  good query execution performance.
- Optimized `o`: High latency backend that compiles the intermediate representation with LLVM and many optimizations for
  superior execution performance.

```sql
set debug.compilationmode='a';
```

### Multiway joins

In addition to binary joins, CedarDB also implements multiway joins.
These joins are particularly useful for graph workloads.
Because most workloads do not benefit from these types of joins, we use them conservatively.
If your workload does benefit from such joins, you can direct the database system to use them more actively with the
following options:

- Cautious `c`: Conservatively use multiway joins only when these joins clearly outperform binary joins (default).
- Eager `e`: Use multiway joins more aggressively when the estimated runtime is slightly improved.
- Disabled `d`: Allows only binary joins.

```sql
set debug.multiway='c';
```

### Logging

CedarDB prints log messages to the standard error output stream (stderr, fd 2).
Depending on how you run CedarDB, the log messages will be printed to the terminal or your service manager.

When running CedarDB directly in Bash, you can redirect all log messages to a log file:

```bash
./cedardb mydb 2>> cedardb.log
```

When running CedarDB in Docker, you can access the log of the container:

```sh
docker logs cedardb_test
```

When running CedarDB with systemd, you can access the logs using from the journal:

```sh
journalctl -u cedardb
```

#### Log Verbosity

In the default configuration, CedarDB logs few messages, i.e., mainly error messages.
For troubleshooting, it can be helpful to increase the verbosity:

```sql
set debug.verbosity = 'debug5';
```

In this debug verbosity, all client messages and commands are sent to the log.
This can have a noticeable impact on performance, and can generate lots of log messages.
Especially in high-traffic instances, verbosity should be kept low.
