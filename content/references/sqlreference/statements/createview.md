---
title: "Reference: Create View Statement"
linkTitle: "Create View"
---

You can use create view to define a *virtual* table, specified by a query.
When you reference the view, CedarDB reruns the query as if you would have specified the table as a subselect.
Views are similar to common table expressions (CTEs), but they survive connection and server restarts.

Usage example:

```sql
-- Create a view
create view funny_movies as
select *
from movies
where genre = 'Comedy';

-- Use the view like a regular table
select * 
from funny_movies
where director = 'Mel Brooks';

-- This is equivalent
select *
from (
  select *
  from movies
  where genre = 'Comedy'
)
where director = 'Mel Brooks';
```

## Using Views

Views are a good way to structure your SQL.
Views help to encapsulate the structure of your data and allow decoupling an interface from the underlying tables.
CedarDB does not treat views as an optimization barrier, but optimizes across the whole query.
Therefore, querying data from a view has exactly the same performance as specifying the query manually.

However, you should be mindful when querying data from views which contain joins.
When the view contains joins between multiple tables, but you only reference one of them, the query might execute
unnecessary joins.
When your schema enforces foreign keys, CedarDB's query optimizer can often infer which joins have no effect on the
query result and eliminate them.
But, if and how a join does or does not affect the query result can be subtle.
When in doubt, you can inspect the query plan with `explain` to see which tables are actually used.

## Options

* You can specify `create or replace view` to update a view with additional columns.
  To avoid accidentally breaking existing queries, you cannot change column names or types this way.
  Instead, consider dropping the view and creating a new view.
