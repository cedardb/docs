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

```
                          plan                           
---------------------------------------------------------
 🖩 OUTPUT (Estimate: 5)                                 +
 ▲ SORT (Estimate: 5)                                   +
 𝚪 GROUP BY (Estimate: 5)                               +
 ⨝ JOIN (leftsemi, indexnljoin) (Estimate: 63'658)      +
 ├───🗐 TABLESCAN on table orders (Estimate: 67'382)     +
 └───🗐 TABLESCAN on table lineitem (Estimate: 3'979'321)
(1 row)
```

This plan shows an overview over how CedarDB plans to execute the query.
Annotated in the plan are the estimated output sizes of the operators, which CedarDB uses to determine the best
algorithms and execution order.

How to read a plan: 
As a default, CedarDB's query plans are trees that are shown as text where child nodes are indented (only if a node has at least one child).
The uppermost operator is the result output and the input tables are the most indented children.
CedarDB generally executes plans starting at the input nodes going up in the plan.
In the example, we can see two tables which are joined using an index, before the data is aggregated with a group by.

## Explain Analyze

A regular `explain` only shows the plan, and does not execute the query.
To investigate the runtime behavior of the query, you can specify the `analyze` option to also execute the query.
This then shows the actual result cardinality to judge the quality of the plan estimates.
In addition, CedarDB annotates timing information to identify costly operations.

```sql
explain analyze select ...
```

```
                                      plan                                      
--------------------------------------------------------------------------------
 🖩 OUTPUT ()                                                                   +
 ▲ SORT (Card: 5, Estimate: 5, time 0 )                                        +
 𝚪 GROUP BY (Card: 5, Estimate: 5, time 0 )                                    +
 ⨝ JOIN (leftsemi, indexnljoin) (Card: 52'523, Estimate: 63'659)               +
 ├───🗐 TABLESCAN on table orders (Card: 57'218, Estimate: 67'382, time 100 ***)+
 └───🗐 TABLESCAN on table lineitem (Card: 0, Estimate: 3'979'321)
(1 row)
```

In this example, we can see that almost the complete execution time was spent in the execution of the `orders`
scan.
Note that this includes the time for operations which can be pipelined, and do not need to materialize all tuples.
In the example, the index-join is pipelined and, thus, has no `time`, but is attributed to the table scan.

## Explain Verbose

By default `explain` only shows brief information about the operators, and does not include detailed information.
If you want to see more details about the referenced columns, involved expressions, evaluated predicates, etc., you can
enable `verbose` output:

```sql
explain verbose select ...
```
```
                                                                     plan                                                                     
----------------------------------------------------------------------------------------------------------------------------------------------
 🖩 OUTPUT (Estimate: 5)                                                                                                                      +
 │  Output columns: o_orderpriority, "countstar(*)" as "order_count"                                                                         +
 ▲ SORT (Estimate: 5)                                                                                                                        +
 │  Order by: o_orderpriority                                                                                                                +
 𝚪 GROUP BY (Estimate: 5)                                                                                                                    +
 │  Aggregates: count(*) as "countstar(*)" ▍ Key: o_orderpriority3                                                                           +
 ⨝ JOIN (leftsemi, indexnljoin) (Estimate: 63'658)                                                                                           +
 │  Join condition: l_orderkey=o_orderkey ▍ Using index lineitem_pkey                                                                        +
 ├───🗐 TABLESCAN on table orders (Estimate: 67'382)                                                                                          +
 │      Attributes: o_orderkey, o_orderpriority ▍ Restrictions: o_orderdate between cast('1993-07-01' as date) and cast('1993-09-30' as date)+
 └───🗐 TABLESCAN on table lineitem (Estimate: 3'979'321)                                                                                     +
        Attributes: l_orderkey, l_commitdate, l_receiptdate ▍ Residuals: l_commitdate<l_receiptdate
(1 row)
```

Here, you can now see the used index (`lineitem_pkey`), aggregated expressions (`count(*)`), etc.

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

```
                     plan                     
----------------------------------------------
             ┌────────────┐                  +
             │ output     │                  +
             │ estimate 5 │                  +
             └──────┬─────┘                  +
                    │                        +
             ┌──────┴─────┐                  +
             │ sort       │                  +
             │ estimate 5 │                  +
             └──────┬─────┘                  +
                    │                        +
             ┌──────┴─────┐                  +
             │ group by   │                  +
             │ estimate 5 │                  +
             └─────┬──────┘                  +
                   │                         +
          ┌────────┴────────┐                +
          │ join (leftsemi) │                +
          │ indexnljoin     │                +
          │ estimate 63'658 │                +
          └────────┬────────┘                +
                   │                         +
          ┌────────┴──────────────┐          +
          │                       │          +
 ┌────────┴────────┐   ┌──────────┴─────────┐+
 │ tablescan       │   │ tablescan          │+
 │ orders          │   │ lineitem           │+
 │ estimate 67'382 │   │ estimate 3'979'321 │+
 └─────────────────┘   └────────────────────┘
(1 row)
```

How to read a tree plan:  
CedarDBs query plans are usually tree-structured with the result output on top and input tables at the leaves on the
bottom.
CedarDB generally executes plans bottom-up from left to right:
In the example, we can see two tables which are joined using an index, before the data is aggregated with a group by.

### Format SQL

CedarDB can also reconstruct the query plan as SQL:

```sql
explain (format sql) select ...
```

```sql
with scan_table_1 as (select "o_orderkey" as o_orderkey, "o_orderpriority" as o_orderpriority3 from "public"."orders" where "o_orderdate" between cast('1993-07-01' as date) and cast('1993-09-30' as date)),
scan_table_2 as (select * from (select "l_orderkey" as l_orderkey, "l_commitdate" as l_commitdate, "l_receiptdate" as l_receiptdate from "public"."lineitem") s where l_commitdate<l_receiptdate),
join_leftsemi_3 as (select * from scan_table_1 where exists(select 1 from scan_table_2 where l_orderkey=o_orderkey)),
groupby_4 as (select tv0 as o_orderpriority, count(*) as "countstar(*)" from (select o_orderpriority3 as tv0 from join_leftsemi_3) s group by tv0)
select o_orderpriority as "o_orderpriority", "countstar(*)" as "order_count" from groupby_4 order by o_orderpriority
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
  "ius":[{"iu":"o_orderkey", "type":{"type":"integer"}}, {"iu":"o_custkey", "type":{"type":"integer"}}, {"iu":"o_orderstatus", "type":{"type":"char1"}}, {"iu":"o_totalprice", "type":{"type":"numeric", "precision":12, "scale":2}}, {"iu":"o_orderdate", "type":{"type":"date"}}, {"iu":"o_orderpriority", "type":{"type":"char", "precision":15}}, {"iu":"o_clerk", "type":{"type":"char", "precision":15}}, {"iu":"o_shippriority", "type":{"type":"integer"}}, {"iu":"o_comment", "type":{"type":"text", "precision":79}}, {"iu":"tid", "type":{"type":"bigint"}}, {"iu":"tableoid", "type":{"type":"integer"}}, {"iu":"rowstate", "type":{"type":"bigint"}}, {"iu":"l_orderkey", "type":{"type":"integer"}}, {"iu":"l_partkey", "type":{"type":"integer"}}, {"iu":"l_suppkey", "type":{"type":"integer"}}, {"iu":"l_linenumber", "type":{"type":"integer"}}, {"iu":"l_quantity", "type":{"type":"numeric", "precision":12, "scale":2}}, {"iu":"l_extendedprice", "type":{"type":"numeric", "precision":12, "scale":2}}, {"iu":"l_discount", "type":{"type":"numeric", "precision":12, "scale":2}}, {"iu":"l_tax", "type":{"type":"numeric", "precision":12, "scale":2}}, {"iu":"l_returnflag", "type":{"type":"char1"}}, {"iu":"l_linestatus", "type":{"type":"char1"}}, {"iu":"l_shipdate", "type":{"type":"date"}}, {"iu":"l_commitdate", "type":{"type":"date"}}, {"iu":"l_receiptdate", "type":{"type":"date"}}, {"iu":"l_shipinstruct", "type":{"type":"char", "precision":25}}, {"iu":"l_shipmode", "type":{"type":"char", "precision":10}}, {"iu":"l_comment", "type":{"type":"text", "precision":44}}, {"iu":"tid29", "type":{"type":"bigint"}}, {"iu":"tableoid30", "type":{"type":"integer"}}, {"iu":"rowstate31", "type":{"type":"bigint"}}, {"iu":"o_orderpriority32", "type":{"type":"char", "precision":15}}, {"iu":"countstar(*)", "type":{"type":"bigint"}}],
  "output":[{"name":"o_orderpriority", "iu":{"expression":"iuref", "iu":"o_orderpriority32"}}, {"name":"order_count", "iu":{"expression":"iuref", "iu":"countstar(*)"}}],
  "type":"select",
  "query":true
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