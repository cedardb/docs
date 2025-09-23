---
title: Benchmarking in interactive mode
linktitle: Interactive Benchmarking

---

For benchmarking purposes, we support several advanced settings in CedarDB's interactive mode.

## Repetition of queries

To validate performance, it is important to run queries multiple times.
To repeat a query, you can either repeat the execution (`e`), the compilation (`c`), or both (`a`).
To change the repetition mode, simply query this command.

```
\set repeatmode 'a'
```

The number of repetitions can be set with the following command.

```
\set repeat 3
```

#### Timeout

In the unlikely event of a long-running query, you may want to set a query time after which the query is terminated
automatically.
This can be accomplished with our timeout setting.
This setting specifies the timeout in milliseconds, with 0 milliseconds disabling the timeout.

```
\set timeout 1000
```


## Performance statistics commands

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

