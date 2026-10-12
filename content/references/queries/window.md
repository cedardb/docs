---
title: "Reference: Window Functions"
linkTitle: "Window Functions"
---

For advanced analytics, *window functions* allow queries that "know" their result context.
You can specify a `window` for which a query's function should be evaluated for.
This allows e.g., calculating running sums within a window.

```sql
select *,
extract(year from release_date) as release_year,
count(*) over w as releaseno_in_year,
sum(budget) over w as moviebudget_in_year
from movies m
window w as (partition by extract(year from release_date) order by release_date, id);
```

One pitfall of window queries are underspecified `order by` clauses, since window functions are evaluated *per
equality group*.
In the example above, two movies released on the same day would be equal in their ordering and have the same release
number.
In this query, we avoid this problem by including the primary key `id` as a tie-breaker in the order-by specification.

## Window frames

A frame clause restricts the rows of the partition that a window function sees.
CedarDB supports `ROWS`, `RANGE`, and `GROUPS` frames with `UNBOUNDED PRECEDING`, `<n> PRECEDING`, `CURRENT ROW`, `<n> FOLLOWING`, and `UNBOUNDED FOLLOWING` bounds, and the `EXCLUDE` options:

```sql
CREATE TABLE measurements (tree_id int, measured date, height_m numeric);

-- Moving average over the previous, current, and next measurement of each tree
SELECT tree_id, measured,
       avg(height_m) OVER (PARTITION BY tree_id ORDER BY measured
                           ROWS BETWEEN 1 PRECEDING AND 1 FOLLOWING) AS smoothed
FROM measurements;
```

Besides aggregate functions such as `sum` and `avg`, CedarDB supports the window functions `row_number`, `rank`, `dense_rank`, `percent_rank`, `cume_dist`, `ntile`, `lag`, `lead`, `first_value`, `last_value`, and `nth_value`.

Named windows from the `WINDOW` clause can be refined with a frame, e.g., `OVER (w ROWS BETWEEN 1 PRECEDING AND CURRENT ROW)`.
Aggregate window functions also support `FILTER (WHERE ...)`.
