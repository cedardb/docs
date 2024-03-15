---
title: Guides
prev: /
weight: 20

---

* Creating tables and inserting data
* Joining multiple tables
* Window functions
* Recursive SQL
* Best practices
  * Schema design
  * Bulk Inserts
  * Indexes
* Performance troubleshooting
  * Explain / analyze
  * Hardware setup
* Example Datasets
  * TPC-H
  * TPC-DS
  * JOB
  * Reddit / Taxi / Handelsregister?

## Configuration

You can see all config parameters in the `sql` REPL tool:

```sql
\show
```

### Resource usage

By default, CedarDB uses 50% of the available system memory for the page cache.
Consider setting the start-up parameter via an environment variable to a setting that plays works for your setup:

```shell
export BUFFERSIZE=1G
```

CedarDB also uses *all* threads of the system for best performance.
This is intended behaviour, but might generate high load on your machine.
If you want to keep other applications responsive, consider starting CedarDB with `nice`.
Alternatively, you can restrict the number of threads that CedarDB uses.
However, keep in mind that this comes with a hard performance limit for CedarDB.

```shell
export PARALLEL=8
```
