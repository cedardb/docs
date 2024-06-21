---
title: "Reference: Create Table As Statement"
linkTitle: "Create Table As"
---

`Create table as` allows creating tables with an inferred schema from the output of a query.

Usage example:

```sql
create table recent_movies as 
   select * 
   from movies
   where release_date >= now()::date - interval '2' year;
```

This statement creates a table which resembles the output schema (names and data types) of the query.
Then, the output of the `select` query is stored in this newly created table.

## Select into

CedarDB also supports the alternative `select into` syntax for compatibility with PostgreSQL:

```sql
select *
into recent_movies
from movies
where release_date >= now()::date - interval '2' year;
```

## Caveats

The data types and names of the created columns can be surprising for queries with multiple expressions.
E.g., CedarDB promotes the precision of numeric types to avoid overflows,
or infers that columns are guaranteed not-null, e.g., `release_date` in the example above (due to the `>=` predicate).
For more control over the schema, consider using the regular
[create table](/docs/references/sqlreference/statements/createtable) statement.
