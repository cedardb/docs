---
title: "Reference: Double Type"
linkTitle: "Double Type"
weight: 13
---

The types `double precision`, `float`, and `real` are floating-point numbers that are stored in an eight-byte
[IEEE&nbsp;754](https://de.wikipedia.org/wiki/IEEE_754) format.

{{< callout type="warning" >}}
The `double precision` type is unsuitable for *exact* calculations that are necessary e.g., for monetary values.
Consider using [`numeric`](numeric) instead.
{{< /callout >}}

Usage example:
```sql
create table constants (
    name text,
    value real
);
insert into constants
    values ('pi', 3.141592653589793238462643383279502884),
           ('planck', 6.62607015e-34),
           ('avogadro', 6.02214076e23);
select * from constants;
```

```
   name   |      value       
----------+------------------
 pi       | 3.14159265358979
 planck   |   6.62607015e-34
 avogadro |   6.02214076e+23
(3 rows)
```

If you need IEEE&nbsp;754 *special values*, you need to enter them with explicitly typed literal syntax:
```sql
select real 'nan', real 'inf', real '-0';
```

```
 ?column? | ?column? | ?column? 
----------+----------+----------
      NaN | Infinity |       -0
(1 row)
```


Additionally, beware of the limited floating-point precision, where rounding errors can quickly add up, and can lead 
to subtle errors.
Consider, e.g., the following query: 

```sql
with x(i) as (
    values (0.1), 
           (0.2), 
           (-0.3)
) 
select sum(i::real) from x;
```

```
         sum          
----------------------
 5.55111512312578e-17
(1 row)
```

With exact-precision [`numeric`](numeric) types, the result of the query would be 0.
However, with `double precision`, the result is only *close to* zero.
The result also is not stable, since queries run in parallel, and we cannot guarantee an execution order.
For the above query, an equally valid result would be:

```
         sum          
----------------------
 2.77555756156289e-17
(1 row)
```
