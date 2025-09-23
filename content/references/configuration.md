---
title: Configuration
linkTitle: "Configuration"
weight: 30
---

In this part of the documentation, we will show you settings to control CedarDB's resource usage, help you collect
benchmark results, and highlight some of our expert configuration options.
Usually, configuring these options is unnecessary, as CedarDB uses strategies to automatically choose the best settings
for you.

## Logging

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

### Log Verbosity

In the default configuration, CedarDB logs few messages, i.e., mainly error messages.
For troubleshooting, it can be helpful to increase the verbosity:

```sql
set verbosity = 'log';
```

In this verbosity, many messages are sent to the log.
This can have a noticeable impact on performance, and can generate lots of log messages.
Especially in high-traffic instances, verbosity should be kept low.
For more infos on the log verbosity options, you can get more information in the [PostgreSQL guide](https://www.postgresql.org/docs/current/runtime-config-logging.html#RUNTIME-CONFIG-SEVERITY-LEVELS).

## Resource usage

### Memory usage

By default, CedarDB uses 45% of available system memory for its buffer manager and 45% as working memory during query processing.
If you are running applications beside CedarDB on your machine (e.g., your IDE or your browser)
while doing heavy query processing on big datasets, you may want to reduce this amount.

Unlike all other settings, this setting must be set before starting CedarDB.
The amount of memory used can be set via an environment variable.

The following shell command sets the available buffer size to 1 GB.

```shell
export BUFFERSIZE=1G
```

The next command sets the available working memory to 3 GB:

```shell
export DATABASE_WORKMEMSIZE=3G
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
set compilationmode='a';
```
