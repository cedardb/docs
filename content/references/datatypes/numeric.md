---
title: "Reference: Numeric Types"
linkTitle: "Numeric"
math: true
weight: 11
---

Numerics are numbers that are typically used to represent counters or identifiers.
They are useful when exact precision is needed and rounding errors need to be exact, e.g., when storing monetary amounts.
Numeric types offer a fixed amount of decimal *precision*, and a fixed *scale* of fractional digits.  
CedarDB supports two different storage widths, an eight-byte `numeric`, and a sixteen-byte `bignumeric`.
Type specifications can use both names, as well as `decimal(precision, scale)`, interchangeably.
CedarDB will choose the underlying representation automatically based on the specified precision.

## Usage Example
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

## Precision and Scale Changes in Operations

Operations such as addition or multiplication on numeric types can potentially alter the precision and scale of the output type, as keeping them unchanged can lead to unnecessary overflows.
For example, the product of two or more numeric values can easily exceed the precision of the input values, resulting in an overflow, even though the system is capable of storing higher precision.
In such cases, many systems, including PostgreSQL, automatically increase the precision and scale to fit the result.
The table below illustrates how CedarDB selects the precision and scale of the result type for numeric operations involving numeric values `n1` and `n2` with respective precisions `p1` and `p2` and scales `s1` and `s2`.

| **Operation**                                | **Precision**                           | **Scale**           |
|----------------------------------------------|-----------------------------------------|---------------------|
| n1 + n2                                      | max(s1, s2) + max(p1 - s1, p2 - s2) + 1 | max(s1, s2)         |
| n1 - n2                                      | max(s1, s2) + max(p1 - s1, p2 - s2) + 1 | max(s1, s2)         |
| n1 * n2                                      | p1 + p2                                 | s1 + s2             |
| n1 / n2                                      | p1 - s1 + s2 + max(6, s1 + p2 + 1)      | max(6, s1 + p2 + 1) |
| n1 % n2                                      | min(p1 - s1, p2 - s2) + max(s1, s2)     | max(s1, s2)         |
| Other operations (such as UNION, CASE, etc.) | max(s1, s2) + max(p1 - s1, p2 - s2)     | max(s1, s2)         |


As numerics in CedarDB have a maximum precision of 38, the resulting precisions and scales can sometimes exceed the system limits. In these cases, CedarDB adapts the scale and precision through a set of rules.

### Rules for All Operations Except Multiplication and Division

If the resulting precision exceeds 38, it is clipped to 38 and the scale is reduced by this amount. If the scale would become negative, it is instead set to 0.
For example, if the resulting precision were 42 and the scale were 6, the precision would be reduced by 4 to 38, and the scale would also be reduced by 4 to 2.

### Rules for Multiplication and Divisions

1. If the scale is larger than 6, and `precision - scale` is larger than 32, the scale is set to 6 and the precision set to 38.
2. If the scale is not larger than 6 but `precision - scale` is still larger than 32, the precision is set to 38 and the scale value is not modified.
3. In all other cases, the scale is set to `min(scale, 38 - (precision - scale))` and then the precision to `min(38, precision)`.

## Handling Overflows

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

Wrapping the operation in a [`try()`](/docs/references/sqlreference/expressions/try/) produces a `null` value for overflows:
```sql
select try(i + i) from numerics;
```
```
    try     
------------
           <---- null
(1 row)
```

## PostgreSQL Compatibility

PostgreSQL allows `NaN`, `+Infinity`, and `-Infinity` as special numeric values.
Since all operations on numerics are bounds-checked, these values cannot occur during regular operations.
However, PostgreSQL still allows entering them directly.

CedarDB forbids entering these values as numeric data types.
See [Float](/docs/references/datatypes/float) for data types supporting those special values. 
