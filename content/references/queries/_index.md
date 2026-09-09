---
title: SQL Queries
linkTitle: "Queries"
weight: 10
---

CedarDB has advanced SQL query capabilities.
Using SQL, you can leverage CedarDBs advanced optimizer and execution engine to answer questions over large data *fast*.
CedarDB automatically compiles your queries to efficient code and executes it in parallel to allow analyzing hundreds of
gigabytes per second with ease.

* [FROM / JOIN]({{< relref "/references/queries/from" >}}) — FROM clause, all JOIN types, LATERAL
* [GROUP BY]({{< relref "/references/queries/groupby" >}}) — GROUP BY, HAVING
* [SELECT]({{< relref "/references/queries/select" >}}) — SELECT clause, DISTINCT, column aliases
* [Window functions]({{< relref "/references/queries/window" >}}) — window functions, OVER clause
* [WITH]({{< relref "/references/queries/with" >}}) — CTEs, recursive CTEs
