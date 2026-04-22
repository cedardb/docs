---
title: SQL Queries
linkTitle: "Queries"
weight: 10
---

CedarDB has advanced SQL query capabilities.
Using SQL, you can leverage CedarDBs advanced optimizer and execution engine to answer questions over large data *fast*.
CedarDB automatically compiles your queries to efficient code and executes it in parallel to allow analyzing hundreds of
gigabytes per second with ease.

* [FROM / JOIN](./from) — FROM clause, all JOIN types, LATERAL
* [GROUP BY](./groupby) — GROUP BY, HAVING
* [SELECT](./select) — SELECT clause, DISTINCT, column aliases
* [Window functions](./window) — window functions, OVER clause
* [WITH](./with) — CTEs, recursive CTEs
