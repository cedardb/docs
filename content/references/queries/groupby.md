---
title: "Reference: GROUP BY"
linkTitle: "GROUP BY"
---

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
