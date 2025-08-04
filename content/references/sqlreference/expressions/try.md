---
title: "Reference: Try Expression"
linkTitle: "Try"
---

A `try(...)` expression allows graceful error handling in case of invalid inputs.
Instead of raising an error that terminates the query, CedarDB returns `null`.

{{< callout type="info" >}}
`try` expressions are not supported by PostgreSQL.
{{< /callout >}}

## Example

Casts between different data types are a common source of errors.
For example, the following cast raises an error:

```sql
with input(str) as (values ('42'), ('oops'))
select str::int from input;
```

```
ERROR:  invalid number format for integer: no digits found in "oops"
```

Wrapping the cast in a `try` expression masks the error and returns `null` instead:

```sql
with input(str) as (values ('42'), ('oops'))
select try(str::int) from input;
```

```
  try
--------
     42
 <null>
(2 rows)
```

{{< callout type="info" >}}
We recommend combining `try` expressions with a `coalesce` to provide default values, or a `is not null` to filter out
failed expressions.
{{< /callout >}}

Try expressions work for many common errors, and can catch more than one error condition:

```sql
with input(str) as (values ('1'), ('0'), ('oops'))
select try(1::numeric / str::int) from input;
```

```
   try
----------
 1.000000
   <null>
   <null>
(3 rows)
```
