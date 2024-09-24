---
title: AsOf Join
prev: advanced
---

CedarDB supports AsOf joins for fuzzy merges, usually on time series.
An AsOf join allows combining two tables on a "closest matching" attribute.
This is useful to find the latest metric from one table at the time of another measurement with an ordering comparison.

Usage example:

```sql
-- Example schema
create table humidity(measure_time timestamp, value double);
create table temperature(measure_time timestamp, value double);

-- Get combined measurements, e.g., to calculate a "feels like" heat index
select h.measure_time, t.measure_time, h.value as humidity, t.value as temperature
from humidity h
asof join temperature t
on h.measure_time >= t.measure_time;
```

In this example, we get the latest temperature for a humidity measurement, even when the times do not line up precisely.
Expressing this query in standard SQL is more involved and usually results in slower execution, see
[Alternative Implementations](#alternative-implementations).

With AsOf joins, you can express such a fuzzy match with a time ordering.
As ordering condition, the AsOf join needs a condition with one of the following ordering comparisons:
`>=`, `<=`, `<`, `>`, and compare values from the left and right side of the join.
You can also add equality join conditions to logically group matches.

In contrast to regular joins, AsOf joins are asymmetric:
`L asof join R` does not produce the same result as `R asof join L`!
AsOf joins produce *at most* one tuple on the left side with the matching tuple from the right.
Tuples that do not find a matching value are filtered out.

{{< callout type="info" >}}
CedarDB currently does not use any indexes for AsOf joins.
Support for index-supported AsOf joins is planned for a future CedarDB release.
{{< /callout >}}

## Extended Example

Let's now look at a more in-depth example using real market data from
[our NASDAQ example](https://github.com/cedardb/examples/tree/main/nasdaq).
Here, we'll be using three tables:

* `orders`: a table containing all orders on the stock market
* `executions`: all actually executed orders
* `stocks`: static information about stock ticker symbols

In the following query, we calculate the time series with current market prices.
Then we use those to find the current market price for each order, and can use that to determine if the order is likely
to be executed soon.

```sql
with market_price as (
   select e.stockid, e.timestamp, coalesce(e.price, o.price) price
   from executions e, orders o
   where e.orderid = o.orderid
)
select mp.stockid, o.orderid, o.side, mp.price as market_price, o.price as orderprice, mp.price - o.price as delta
from orders o
asof join market_price mp
  on mp.stockid = o.stockid and mp.timestamp <= o.timestamp
join stocks s
  on s.stockid = mp.stockid
where s.name = 'GME'
limit 10;
```

```
 stockid | orderid | side | market_price | orderprice |  delta
---------+---------+------+--------------+------------+---------
    3405 | 3655250 | BUY  |       5.8300 |     5.8400 | -0.0100
    3405 | 3655254 | BUY  |       5.8300 |     5.5000 |  0.3300
    3405 | 3655258 | BUY  |       5.8300 |     5.4000 |  0.4300
    3405 | 3655262 | BUY  |       5.8300 |     5.2500 |  0.5800
    3405 | 3655266 | BUY  |       5.8300 |     5.0800 |  0.7500
    3405 | 3655270 | BUY  |       5.8300 |     5.0100 |  0.8200
    3405 | 3655274 | BUY  |       5.8300 |     5.0000 |  0.8300
    3405 | 3655278 | BUY  |       5.8300 |     5.0000 |  0.8300
    3405 | 3655282 | BUY  |       5.8300 |     5.0000 |  0.8300
    3405 | 3655286 | BUY  |       5.8300 |     5.0000 |  0.8300
(10 rows)
```

## Alternative Implementations

{{% details title="Open to show standard SQL alternatives for AsOf joins" closed="true" %}}

```sql
-- AsOf join
select mp.stockid, o.orderid, o.side, mp.price as market_price, o.price as orderprice, mp.price - o.price as delta
from orders o
asof join market_price mp
  on mp.stockid = o.stockid and mp.timestamp <= o.timestamp
join stocks s
  on s.stockid = mp.stockid
where s.name = 'GME'
limit 10;

-- Subselect with limit 1
select mp.stockid, o.orderid, o.side, mp.price as market_price, o.price as orderprice, mp.price - o.price as delta
from orders o, (
   select *
   from market_price mp
   where o.stockid = mp.stockid
     and mp.timestamp <= o.timestamp
   order by mp.timestamp desc
   limit 1
) mp, stocks s
where s.stockid = mp.stockid
and s.name = 'GME';
```

{{% /details %}}
