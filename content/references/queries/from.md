---
title: "Reference: FROM / JOIN"
linkTitle: "FROM / JOIN"
---

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
