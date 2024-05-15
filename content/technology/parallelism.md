---
title: "Parallel Query Execution"
linkTitle: "Parallelism"
weight: 20
draft: true
---

Modern CPUs have hundreds of cores.
Unfortunately, few database systems can use all cores simultaneously to run queries.
Executing a query on all of these cores at once can give you interactive latencies.
For example, when a query runs on one core in a minute, processing the query in parallel on all cores can give you a
result in under a second.

CedarDB uses *morsel driven parallelism*, as introduced by Leis et
al. [[1](https://db.in.tum.de/~leis/papers/morsels.pdf)] to utilize all available cores of your hardware.
This approach dynamically adapts the parallelism used to execute a query, depending on the amount of data processed and
the system load.
In contrast, other systems often use static parallelism, which decides during query planning with how many parallel
workers a query should be processed.
To avoid that the whole system becomes unresponsive when under high load, static parallelism cannot dedicate all
available hardware resources to a single query, resulting in low overall utilization.

TODO: insert Lukas' parallelism gif

In the image above, PostgreSQL uses only 10 cores, while CedarDB uses all 48 cores.
This uses the hardware much more efficiently, and ensures you always get the best query latency from your hardware.

## Morsels

To process queries in parallel, we dynamically split all work necessary to execute a query into chunks of work,
so-called *morsels*.
These morsels are the work unit on which a thread schedules its work.
CedarDB keeps morsels relatively small, and processes all morsels independently of other morsels.
This ensures that as many threads as possible can work on a query and work is distributed evenly among the threads.
In addition, the system is still responsive to other queries even with high load, since each thread can also work on
morsels from other queries and does not block parallel progress.

TODO: insert morsel execution with small chunks on threads

## Concurrency

For optimal performance, CedarDB always uses as many worker threads as your system has hardware threads.
Compared to other database systems, the total system load will be higher, usually approaching your CPU cores:

```shell
cat /proc/loadavg
```

```
19.54 19.14 18.89 25/5342 368920
```

Having a high system load is a feature, since otherwise parts of your system would be unnecessarily idle and your
application would be slower than necessary.
All of CedarDB's CPU load is spent on useful work processing your data.
Consequently, using hardware with more CPU cores will improve query latency.

## Interactive Workloads

Having a high load average will increase the interactive latency for short running queries.
In traditional database systems, this can become a problem with changing system loads when mixing compute heavy queries
with short running transactions.
Due to the short running morsels, CedarDB still remains responsive.

TODO: include Query Latency plot from Benjamin's paper

In addition, CedarDB uses an optimized query scheduler as proposed by Wagner et
al. [[2](https://db.in.tum.de/~kohn/papers/query-scheduling-sigmod21.pdf)], which minimizes overall system latency.
This scheduler uses a lock-free, self-tuning algorithm to dynamically adjust query priorities that make the system
elastic to high system load.

## References

[1] Viktor Leis, Peter Boncz, Alfons Kemper, Thomas Neumann.
[Morsel-driven parallelism: A NUMA-aware query evaluation framework for the many-core age](https://db.in.tum.de/~leis/papers/morsels.pdf).
SIGMOD'14  
[2] Benjamin Wagner, André Kohn, Thomas Neumann.
[Self-Tuning Query Scheduling for Analytical Workloads](https://db.in.tum.de/~kohn/papers/query-scheduling-sigmod21.pdf).
SIGMOD'21
