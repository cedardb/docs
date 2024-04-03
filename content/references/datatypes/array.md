---
title: "Reference: Array Types"
linkTitle: "Array Types"
weight: 21
---

CedarDB supports variable-length arrays, similar to [PostgreSQL](https://www.postgresql.org/docs/current/arrays.html).
Arrays can have arbitrary underlying types, e.g, `int[]` or `text[]`, and an arbitrary number of dimensions.
Similar to PostgreSQL, the length and dimensions of an array column do not need to be uniform.

## Usage Example
```sql
create table example (
    numbers int[],
    strings text[]
);
insert into example 
    values (array [1, 2, 3], array ['a', 'b', 'c']),
           ('{{1, 3}, {3, 4}}', '{{"a", "b"},{"c", "d"}}');
select * as first from example;
```

```
    numbers    |    strings    
---------------+---------------
 {1,2,3}       | {a,b,c}
 {{1,3},{3,4}} | {{a,b},{c,d}}
(2 rows)
```

## Caveats

Contrary to most programming languages, access to arrays is **1-indexed**:

```sql
with data(a) as (values (array[1, 2, 3]))
select a[1] as first from data;
```
```
 first 
-------
     1
(1 row)
```

CedarDB supports arrays with a maximum of 4&nbsp;GB of underlying data.
For most data types, this limits array to about one billion elements. 

```sql
select array_fill('x', array[1000000000]);
```
```
ERROR:   string length overflow
```
