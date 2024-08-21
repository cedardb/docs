---
title: "Reference: Integer Types"
linkTitle: "Integer"
math: true
weight: 10
---

Integers are whole numbers that are typically used to represent counters or identifiers.
CedarDB supports three different widths of integers:
*  A two-byte `smallint`,
*  a four-byte `integer`, 
*  and an eight-byte `bigint`.

## Usage Example
```sql
create table example (
    id integer primary key
);
insert into example select i from generate_series(1, 3) g(i);
select id from example;
```

```
 id 
----
  1
  2
  3
(3 rows)
```

## Value Range

| Type       |       Min |        Max |
|------------|----------:|-----------:|
| `smallint` | $-2^{15}$ | $2^{15}-1$ |
| `integer`  | $-2^{31}$ | $2^{31}-1$ |
| `bigint`   | $-2^{63}$ | $2^{63}-1$ |

Storing values outside of the supported ranges will result in an overflow exception.
Operations on integers are range checked, so that e.g., numeric overflows will never cause wrong results.
To avoid overflows, it might be necessary to cast to a type that can represent a larger range.

### Handling Overflows
```sql
create table integers(i) as 
values (power(2, 29)::int),
       (power(2, 30)::int);
```

The following will produce an overflow, since $2^{30} + 2^{30} > 2^{31}-1$.
```sql
select i + i from integers;
```
```
ERROR:  numeric overflow
```
You can handle such overflows in multiple ways:

#### Try
Wrapping the operation in a `try()` produces a `null` value for overflows:
```sql
select try(i + i) from integers;
```
```
    try     
------------
 1073741824
            <---- null
(2 rows)
```

#### Casting
Casting to `bigint` increases the value range and produces the correct result without an exception:

```sql
select i::bigint + i from integers;
```
```
  ?column?  
------------
 1073741824
 2147483648
(2 rows)
```

