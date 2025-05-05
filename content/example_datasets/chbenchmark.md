---
title: CH-benCHmark
linkTitle: "CH-benCHmark"
weight: 20
---
The [CH-benCHmark](https://db.in.tum.de/research/projects/CHbenCHmark/?lang=en) bridges the gap between TPC-C, an OLTP (i.e., transactional), and TPC-H, an OLAP (i.e., analytical benchmark).

In contrast to many other benchmarks for hybrid workloads, CH-benCHmark runs its analytical queries on the same tables that are updated by the transactional queries.
This especially stresses the database's transaction subsystem as it has to ensure that all queries see a consistent state of the heavily write-contested tables. 


## The Dataset

The data set consists of all nine [TPC-C](https://www.tpc.org/tpcc/) tables, and three additional [TPC-H](https://www.tpc.org/tpch/) tables.
It runs all 22 TPC-H queries in a slightly adapted form which uses the TPC-C base tables, ensuring analytical queries depend on the transactional updates of the TPC-C tables.


## Executing the benchmark

CMU's benchmarking tool [benchbase](https://github.com/cmu-db/benchbase/) comes with a CH-benCHmark configuration and is compatible to Postgres.
