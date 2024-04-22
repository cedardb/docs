---
title: SQL Queries
linkTitle: "Queries"
prev: /sqlreference
next: /expressions
weight: 10
---

CedarDB has advanced SQL query capabilities.
Using SQL, you can leverage CedarDBs advanced optimizer and execution engine to answer questions over large data *fast*. 
CedarDB automatically compiles your queries to efficient code and executes it in parallel to allow analyzing hundreds of
gigabytes per second with ease.

## Simple Data Access

```sql
-- Get all info about a specific movie
select * from movies where id = 42;
-- Selecting specific columns is more robust against schema changes and reduces I/O
select name, length from movies where id = 42;
```

{{< callout type="info" >}}
For fast single-element access with `where`, consider specifying `id` as primary key or adding an explicit index.
{{< /callout >}}


You can also use [expressions](./expressions) or [functions](./functions) to transform your data:
```sql
select date_trunc('month', release_date) from movies;
```

For many data-specific operations, executing them in the database can be more efficient.

## Group By

Group by calculates aggregated values over a table.
For example, the following query calculates the average rating and counts how many ratings a movie has:

```sql
select movie_id, avg(rating), count(*)
from movie_ratings
group by movie_id
order by avg;
```

In such queries, the `where` condition is evaluated before the aggregation, thus the calculated values can not be used
there.
Instead, you can filter filtering group by columns in the `having` clause.
For our example, you might want to look only at movies that have at least ten ratings:

```sql
select movie_id, avg(rating), count(*)
from movie_ratings
group by movie_id
having count(*) > 10
order by avg;
```

## Joins

To combine data from multiple tables, you can use `join`s.
Joins can be arbitrarily combined and nested to combine information from different tables.
Joins in CedarDB are very efficient, and, thus, can be arbitrarily nested and combined.

```sql
select *
from movies m, producers p
where m.producer_id = p.id
```

Note that joins only include rows where the condition is true.
If you actually want to strictly add *more* information, you might want to use a `left join`.
E.g., in the above example, indie movies without a producer would not show up.
With a left join, you can add `null` values for movies that have no producer:

```sql
select *
from movies m left join producers p
  op m.producer_id = p.id
```

However, you need to be careful when mixing left (outer) joins with inner joins, since the inner joins would filter out
the `null` values of the outer join.


## Common Table Expressions

For complex queries, `with` subqueries, aka *common table expressions* (CTEs) are a good way to structure your query.
They help to build small, self-contained logic blocks that can be named.
This allows to factor out parts of a query that can be independently developed and verified.

```sql
-- All good movies with a high rating
with good_movies as (select * from movies where rating >= 8.0)
select * from good_movies m, producers p
where m.producer_id = p.id;
```

{{< callout type="info" >}}
You can use CTEs in CedarDB liberally.
They have no performance overhead for your queries and make the structure much more understandable.
CedarDB automatically inlines CTEs and optimizes across all subqueries.
{{< /callout >}}

## Window Functions

For advanced analytics, *window functions* allow queries that "know" their result context.
You can specify a `window` for which a query's function should be evaluated for.
This allows e.g., calculating running sums within a window.

```sql
select *,
extract(year from release_date) as release_year,
count(*) over w as releaseno_in_year,
sum(budget) over w as moviebudget_in_year,
from movies m
window w as (partition by extract(year from release_date) order by release_date, id);
```

One pitfall of window queries are underspecified `order by` clauses, since window functions are evaluated *per
equality group*.
In the example above, two movies released on the same day would be equal in their ordering and have the same release
number.
In this query, we avoid this problem by including the primary key `id` as a tie-breasker in the order-by specification.
