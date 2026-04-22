---
title: "Reference: WITH (CTEs)"
linkTitle: "WITH"
---

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
