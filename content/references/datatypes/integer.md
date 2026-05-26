---
title: "Reference: Integer Types"
linkTitle: "Integer"
math: true
weight: 10
---

Integers are whole numbers that are typically used to represent counters or identifiers.
CedarDB supports the following signed integer types:

* A one-byte `tinyint` (alias: `int1`),
* a two-byte `smallint` (alias: `int2`),
* a four-byte `integer` (alias: `int4`),
* and an eight-byte `bigint` (alias: `int8`).

CedarDB also supports unsigned variants for each width: `uint1`, `uint2`, `uint4`, and `uint8`.

## Usage Example

```sql
create table example (
    id integer primary key
);
insert into example select i from generate_series(1, 3) g(i);
select id from example;
```

```text
 id 
----
  1
  2
  3
(3 rows)
```

## Value Range

### Signed

| Type                |       Min |        Max |
|---------------------|----------:|-----------:|
| `tinyint` (`int1`)  |  $-2^{7}$ |  $2^{7}-1$ |
| `smallint` (`int2`) | $-2^{15}$ | $2^{15}-1$ |
| `integer` (`int4`)  | $-2^{31}$ | $2^{31}-1$ |
| `bigint` (`int8`)   | $-2^{63}$ | $2^{63}-1$ |
| `uint1`             |       $0$ |  $2^{8}-1$ |
| `uint2`             |       $0$ | $2^{16}-1$ |
| `uint4`             |       $0$ | $2^{32}-1$ |
| `uint8`             |       $0$ | $2^{64}-1$ |

Storing values outside the supported ranges will result in an overflow exception.
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

```text
ERROR:  numeric overflow
```

You can handle such overflows in multiple ways:

#### Try

Wrapping the operation in a [`try()`](/docs/references/expressions/try/) produces a `null` value for overflows:

```sql
select try(i + i) from integers;
```

```text
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

```text
  ?column?  
------------
 1073741824
 2147483648
(2 rows)
```
