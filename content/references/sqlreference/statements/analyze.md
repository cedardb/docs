---
title: "Reference: Analyze Statement"
linkTitle: "Analyze"
---

An analyze statement can be used to recompute the query planning statistics of a table.

Usage example:

```sql
-- Collect statistics for a single table
analyze orders;
-- Collect statistics for all tables
analyze;
```

## When to use Analyze

CedarDB automatically recomputes query planning statistics on-demand when around 10% of a table changed.
Thus, during normal operation, you do not need to run analyze manually.

When analyzing a table, CedarDB collects
[count-distinct sketches](https://en.wikipedia.org/wiki/Count-distinct_problem) to estimate join results, a random
sample of the rows to estimate predicates, and for numeric columns, a statistical distribution to estimate calculated
expressions.
Due to their probabilistic nature, these statistics might be inaccurate by chance.
When a query runs slowly due to a bad query plan, running `analyze` on the queried tables might result in a different
plan.
