---
title: "Reference: Numeric Types"
linkTitle: "Numeric Types"
math: true
weight: 11
---

Numerics are numbers that are typically used to represent counters or identifiers.
Useful when exact precision is needed and rounding errors need to be exact, e.g., for monetary amounts.
Numeric types offer a fixed amount of decimal *precision*, and a fixed *scale* of fractional digits.  
CedarDB supports two different storage widths, an eight-byte `numeric`, and a sixteen-byte `bignumeric`.
Type specifications can use both names, as well as `decimal(precision, scale)`, interchangeably.
The underlying representation will be chosen on the specified precision.

Usage example:
```sql
create table example (
    price numeric(38, 3),
    tax_rate numeric(5, 2)
);
insert into example values
    (123.45, 0.19),
    (1000, 0);
select * from example;
```

```
  price   | tax_rate 
----------+----------
  123.450 |     0.19
 1000.000 |     0.00
(2 rows)
```

## Value Range

| Type (precision, scale) |                                       Min |                                      Max | Underlying |
|-------------------------|------------------------------------------:|-----------------------------------------:|-----------:|
| `numeric(18, 0)`        |                      -9223372036854775808 |                      9223372036854775807 |     8 Byte |
| `numeric(18, 3)`        |                     -9223372036854775.808 |                     9223372036854775.807 |     8 Byte |
| `numeric(38, 0)`        |  -170141183460469231731687303715884105728 |  170141183460469231731687303715884105727 |    16 Byte |
| `numeric(38, 6)`        | -170141183460469231731687303715884.105728 | 170141183460469231731687303715884.105727 |    16 Byte |

{{< callout type="info" >}}
Operations on 16&nbsp;Byte types are expensive to compute.
We recommend using a precision of 18 or less when possible for your application.
{{< /callout >}}


Storing values outside of the supported ranges will result in an overflow exception.
Operations on numerics are range checked, so that e.g., numeric overflows will never cause wrong results.

Example:
```sql
create table numerics(i) as 
values (power(2, 126)::numeric(38,0));
```

The following will produce an overflow, since $2^{126} + 2^{126} > 2^{127}-1$.
```sql
select i + i from integers;
```
```
ERROR:  numeric overflow
```

Wrapping the operation in a `try()` produces a `null` value for overflows:
```sql
select try(i + i) from numerics;
```
```
    try     
------------
           
(1 row)
```
