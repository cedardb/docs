---
title: "Reference: Explain Statement"
linkTitle: "Explain"
---

`Explain` statements show the execution plan of a query.
This is useful to understand the performance characteristics of a query.

Usage example:

```sql
-- TPC-H Query 4
explain
select o_orderpriority, count(*) as order_count
from orders
where o_orderdate >= date '1993-07-01' and o_orderdate < date '1993-07-01' + interval '3' month
  and exists (select * from lineitem
              where l_orderkey = o_orderkey
                and l_commitdate < l_receiptdate)
group by o_orderpriority
order by o_orderpriority
```

```text
                       plan                        
---------------------------------------------------
 🖩 OUTPUT (Estimate: 5)                           +
 ▲ SORT (In-Memory) (Estimate: 5)                 +
 𝚪 GROUP BY (In-Memory) (Estimate: 5)             +
 ⨝ JOIN (leftsemi, hashjoin) (Estimate: 54'260)   +
 ├───🗐 TABLESCAN on orders (Estimate: 61'523)     +
 └───🗐 TABLESCAN on lineitem (Estimate: 3'205'078)
(1 row)
```

This plan shows an overview over how CedarDB plans to execute the query.
Annotated in the plan are the estimated output sizes of the operators, which CedarDB uses to determine the best
algorithms and execution order.

How to read a plan:
As a default, CedarDB's query plans are trees that are shown as text where child nodes are indented (only if a node has at least one child).
The uppermost operator is the result output and the input tables are the most indented children.
CedarDB generally executes plans starting at the input nodes going up in the plan.
In the example, two tables are joined with a hash join before the data is aggregated with a group by.

## Explain Analyze

A regular `explain` only shows the plan, and does not execute the query.
To investigate the runtime behavior of the query, you can specify the `analyze` option to also execute the query.
This then shows the actual result cardinality to judge the quality of the plan estimates.
In addition, CedarDB annotates timing information to identify costly operations.

```sql
explain analyze select ...
```

```text
                                                                              plan                                                                               
-----------------------------------------------------------------------------------------------------------------------------------------------------------------
 🖩 OUTPUT ()                                                                                                                                                    +
 ▲ SORT (In-Memory) (Result Materialized: 4 KB, Result Utilization: 4 %, Peak Materialized: 4 KB, Peak Utilization: 6 %, Card: 5, Estimate: 5, Time: 0 ms (0 %))+
 𝚪 GROUP BY (In-Memory) (Pre-Aggregation: 100, Materialized: 19 KB, Utilization: 0 %, Card: 5, Estimate: 5, Time: 0 ms (0 %))                                   +
 ⨝ JOIN (leftsemi, hashjoin) (Materialized: 5 MB, Utilization: 41 %, Card: 29'908, Estimate: 54'261)                                                            +
 ├───🗐 TABLESCAN on orders (num IOs: 0, Fetched: 0 B, Card: 57'500, Estimate: 61'523, Time: 54 ms (62 % ***))                                                   +
 └───🗐 TABLESCAN on lineitem (num IOs: 0, Fetched: 0 B, Card: 149'949, Estimate: 3'205'078, Time: 33 ms (38 % **))
(1 row)
```

Each operator shows its actual cardinality (`Card`) next to the estimate, and its execution time with the share of the total time.
Asterisks mark the most expensive operators.
Table scans also show the I/O they caused (`num IOs`, `Fetched`), and materializing operators show their memory use.
In this example, most of the execution time was spent in the `orders` scan.
Note that this includes the time for operations which can be pipelined, and do not need to materialize all tuples.
In the example, the probe side of the hash join is pipelined and, thus, has no `Time`, but is attributed to the table scans.

## Explain Verbose

By default `explain` only shows brief information about the operators, and does not include detailed information.
If you want to see more details about the referenced columns, involved expressions, evaluated predicates, etc., you can
enable `verbose` output:

```sql
explain verbose select ...
```

```text
                                                                                                   plan                                                                                                    
-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
 🖩 OUTPUT (Estimate: 5)                                                                                                                                                                                   +
 │  Output columns: o_orderpriority, "count_star(*)" as order_count                                                                                                                                       +
 ▲ SORT (In-Memory) (Estimate: 5)                                                                                                                                                                         +
 │  Order by: o_orderpriority                                                                                                                                                                             +
 𝚪 GROUP BY (In-Memory) (Estimate: 5)                                                                                                                                                                     +
 │  Aggregates: count(*) as "count_star(*)" ▍ Key: o_orderpriority3                                                                                                                                       +
 ⨝ JOIN (leftsemi, hashjoin) (Estimate: 54'260)                                                                                                                                                           +
 │  Join condition: l_orderkey = o_orderkey                                                                                                                                                               +
 ├───🗐 TABLESCAN on orders (Unfiltered: 1'500'000, Estimate: 61'523)                                                                                                                                      +
 │      Attributes: o_orderkey, o_orderpriority ▍ Restrictions: o_orderdate between cast('1993-07-01' as date) and cast('1993-09-30' as date)                                                             +
 └───🗐 TABLESCAN on lineitem (Unfiltered: 6'000'000, Estimate: 3'205'078)                                                                                                                                 +
        Attributes: l_orderkey, l_commitdate, l_receiptdate ▍ Residuals: l_commitdate < l_receiptdate ▍ Restrictions: l_orderkey = (hash join filter), l_commitdate is not null, l_receiptdate is not null
(1 row)
```

Here, you can now see the join condition, aggregated expressions (`count(*)`), the number of rows before filtering (`Unfiltered`), etc.

## Format

CedarDB can reconstruct the query plan in the following output formats:

- flat (default)
- tree
- sql
- json

### Format Tree

For a graphical presentation of the query plan, you can use the tree format:

```tree
explain (format tree) select ...
```

```text
                     plan                     
----------------------------------------------
             ┌────────────┐                  +
             │ output     │                  +
             │ estimate 5 │                  +
             └──────┬─────┘                  +
                    │                        +
             ┌──────┴─────┐                  +
             │ sort       │                  +
             │ in-memory  │                  +
             │ estimate 5 │                  +
             └──────┬─────┘                  +
                    │                        +
             ┌──────┴─────┐                  +
             │ group by   │                  +
             │ in-memory  │                  +
             │ estimate 5 │                  +
             └─────┬──────┘                  +
                   │                         +
          ┌────────┴────────┐                +
          │ join (leftsemi) │                +
          │ hashjoin        │                +
          │ estimate 54'260 │                +
          └────────┬────────┘                +
                   │                         +
          ┌────────┴──────────────┐          +
          │                       │          +
 ┌────────┴────────┐   ┌──────────┴─────────┐+
 │ tablescan       │   │ tablescan          │+
 │ orders          │   │ lineitem           │+
 │ estimate 61'523 │   │ estimate 3'205'078 │+
 └─────────────────┘   └────────────────────┘
(1 row)
```

How to read a tree plan:  
CedarDBs query plans are usually tree-structured with the result output on top and input tables at the leaves on the
bottom.
CedarDB generally executes plans bottom-up from left to right:
In the example, we can see two tables which are joined with a hash join, before the data is aggregated with a group by.

### Format SQL

CedarDB can also reconstruct the query plan as SQL:

```sql
explain (format sql) select ...
```

```sql
with scan_table_1 as (select o_orderkey as o_orderkey, o_orderpriority as o_orderpriority3 from public.orders where o_orderdate between cast('1993-07-01' as date) and cast('1993-09-30' as date)),
scan_table_2 as (select * from (select l_orderkey as l_orderkey, l_commitdate as l_commitdate, l_receiptdate as l_receiptdate from public.lineitem where l_commitdate is not null and l_receiptdate is not null) s where l_commitdate < l_receiptdate),
join_leftsemi_3 as (select * from scan_table_1 where exists(select 1 from scan_table_2 where l_orderkey = o_orderkey))
select o_orderpriority as o_orderpriority, "count_star(*)" as order_count from (select (o_orderpriority3) as o_orderpriority, count(*) as "count_star(*)" from join_leftsemi_3 group by (o_orderpriority3)) tgv0 order by o_orderpriority
```

### Format JSON

For a machine-readable description, you can also use the JSON format:

```sql
explain (format json) select ...
```

```json
{
  "plan":{
   "operator":"sort",
   "physicalOperator":"sort",
   "cardinality":5,
   "operatorId":1,
   "input":{
     ...
   },
   "order":[{"value":{"expression":"iuref", "iu":"o_orderpriority32"}, "collate":""}],
   "duplicateFree":true
  },
  ...
}
```

## Step

By default, `explain` shows the plan including all optimizations.
To see the plan after different optimization steps, the step can the specified as an argument:

```sql
explain (step <step_value>) select ...
```

For `step_value`, the number of optimization steps to be performed can be passed as an integer.
Alternatively, the name of the last step to be applied can be used.
The possible values are:

- NoOptimizations
- ExpressionSimplification
- Unnesting
- PredicatePushdown
- InitialJoinTree
- SidewayInformationPassing
- OperatorReordering
- EarlyProbing
- CommonSubtreeElimination
- PhysicalOperatorMapping

## Permissions

`EXPLAIN` requires the same privileges as the statement it explains, with or without `ANALYZE`.
For example, `EXPLAIN INSERT INTO trees ...` fails with `permission denied for table 'trees'` if you lack the `INSERT` privilege on `trees`.

## PostgreSQL Differences

- CedarDB's plan output differs from PostgreSQL's: it shows CedarDB's operators, cardinality estimates, and, with `ANALYZE`, timings.
- The options `COSTS`, `BUFFERS`, `TIMING`, `SETTINGS`, `WAL`, `SUMMARY`, and `GENERIC_PLAN` are not supported.
- The formats `XML` and `YAML` are not supported. In addition to PostgreSQL's formats, CedarDB supports `TREE` and `SQL`.
