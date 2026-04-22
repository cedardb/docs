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
sum(budget) over w as moviebudget_in_year,
from movies m
window w as (partition by extract(year from release_date) order by release_date, id);
```

One pitfall of window queries are underspecified `order by` clauses, since window functions are evaluated *per
equality group*.
In the example above, two movies released on the same day would be equal in their ordering and have the same release
number.
In this query, we avoid this problem by including the primary key `id` as a tie-breasker in the order-by specification.
