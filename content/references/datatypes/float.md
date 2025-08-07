---
title: "Reference: Float Type"
linkTitle: "Float"
weight: 13
---

The types `double precision`, `float`, and `real` are floating-point numbers. Depending on the precision, they are stored in an four or eight-byte
[IEEE&nbsp;754](https://en.wikipedia.org/wiki/IEEE_754) format.

{{< callout type="warning" >}}
The `double precision` type is not suitable for conducting precise calculations, which are essential, for instance, when handling monetary values.
{{< /callout >}}

## Usage Example
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
   name   |    value 
----------+--------------
 pi       |     3.14159
 planck   | 6.62607e-34
 avogadro | 6.02214e+23
(3 rows)
```
## IEEE Special Values

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

## Precision

Depending on the type size, the precision varies.

| Data Type          | Approximate Precision | Storage Size | Notes                                                    |
|--------------------|-----------------------|--------------|----------------------------------------------------------|
| `REAL`             | ~6 decimal digits     | 4 bytes      | Typically referred to as `float` in C                    |
| `DOUBLE PRECISION` | ~15 decimal digits    | 8 bytes      | Typically referred to as `double` in C                   |
| `FLOAT(p)`         | Depends on `p`        | 4 or 8 bytes | `p ≤ 24` => `REAL`, `24 < p ≤ 53` => `DOUBLE PRECISION`. |


Beware of the limited floating-point precision, where rounding errors can quickly add up, and can lead 
to subtle errors.
Consider, e.g., the following query: 

```sql
with x(i) as (
    values (0.1), 
           (0.2), 
           (-0.3)
) 
select sum(i::double precision) from x;
```

```
         sum          
----------------------
 5.55111512312578e-17
(1 row)
```

With exact-precision [`numeric`](numeric) types, the result of the query would be 0.
However, with `double precision`, the result is only *close to* zero.

The result also is not stable, i.e., can change indeterministically when repeated:
CedarDB executes queries in parallel and thus cannot guarantee the order in which the numbers are added.
For the above query, an equally valid result would be:

```
         sum          
----------------------
 2.77555756156289e-17
(1 row)
```
