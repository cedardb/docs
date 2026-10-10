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

```text
ERROR:  invalid number format for integer: no digits found in "oops"
```

Wrapping the cast in a `try` expression masks the error and returns `null` instead:

```sql
with input(str) as (values ('42'), ('oops'))
select try(str::int) from input;
```

```text
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

```text
   try
----------
 1.000000
   <null>
   <null>
(3 rows)
```

`try` catches errors that the wrapped expression raises while processing a row, for example:

* Invalid input in casts, such as `'oops'::int`, `'2024-13-45'::date`, or `'{bad'::jsonb`
* Division by zero, including modulo (`%`)
* Numeric overflow, such as `2147483647 + 1` or `100000::smallint`

Errors from mathematical functions with invalid arguments, such as `ln(0)` or `sqrt(-1)` on column values, are not caught and still terminate the query.
Errors that are not raised by the wrapped expression itself, such as a scalar subquery that returns more than one row, are not caught either.

{{< callout type="warning" >}}
An explicit cast to a length-limited type such as `varchar(3)` truncates longer values outside of `try`, but returns `null` inside `try`.
{{< /callout >}}
