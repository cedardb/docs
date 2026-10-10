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
Instead, you can filter on aggregated values in the `having` clause.
For our example, you might want to look only at movies that have at least ten ratings:

```sql
select movie_id, avg(rating), count(*)
from movie_ratings
group by movie_id
having count(*) > 10
order by avg;
```

## GROUPING SETS, ROLLUP, and CUBE

`GROUPING SETS` computes aggregates for several groupings in one query.
`ROLLUP (a, b)` is short for the grouping sets `(a, b)`, `(a)`, and `()`, and `CUBE (a, b)` for all combinations of `a` and `b`.
Columns that are not part of a grouping set are null in its result rows.
The `GROUPING()` function returns 1 for these columns, which distinguishes them from null values in the data:

```sql
CREATE TABLE trees (species text, forest text, height_m numeric);
INSERT INTO trees VALUES ('Oak', 'North', 20), ('Oak', 'South', 18), ('Ash', 'North', 12);

SELECT species, GROUPING(species) AS is_total, count(*)
FROM trees
GROUP BY ROLLUP (species)
ORDER BY is_total, species;
```

```text
 species | is_total | count
---------+----------+-------
 Ash     |        0 |     1
 Oak     |        0 |     2
         |        1 |     3
```

## FILTER

The `FILTER` clause restricts the rows that an aggregate function processes:

```sql
CREATE TABLE trees (species text, forest text, height_m numeric);

SELECT count(*) AS all_trees,
       count(*) FILTER (WHERE height_m > 15) AS tall_trees
FROM trees;
```
