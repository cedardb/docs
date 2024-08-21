---
title: "Reference: Boolean"
linkTitle: "Boolean"
weight: 23
---

Booleans store logical truth values, and can be used to, e.g., store flags.

## Usage Example
```sql
create table example (
     flag bool
);
insert into example 
    values (true), ('t'), ('yes'), ('on'), ('1'),
           (false), ('f'), ('no'), ('off'), ('0');
select * from example;
```

```
 flag 
------
 t
 t
 t
 t
 t
 f
 f
 f
 f
 f
(10 rows)
```

## Caveats

Due to `null` values, boolean expressions in SQL have *ternary* logic, with sometimes unexpected results compared to
other programming languages.
However, this ternary logic is context-sensitive:
* In predicates (e.g., for `where` conditions), `null`s are considered `false` and filter tuples. 
  This is the intuitive behavior, that is used most often.
* For value returning expressions (e.g., in a `select` result), boolean logic can result in `null`.

The underlying reason for this ternary logic is that `null` values are considered an *unknown* value, and e.g., the 
expression `42 < null` results in a `null` value, since we don't know how an arbitrary value compares to 42.
Equality comparisons between values follow the same rules, i.e., `x = null` will always result in another `null`, even
when the value of `x` is `null` as well.
To opt-out of this behaviour you can use `x is null`, which never returns `null`.
The syntax to compare two values and consider `nulls` equal is somewhat verbose: `x is not distinct from y`.

However, while most functions return `null` for any `null` input, for boolean logic, e.g., in `and`, a single `false`
can determine the whole expressions&nbsp;[[1](http://databasearchitects.blogspot.com/2017/02/reasoning-in-presence-of-nulls.html), [2](https://doi.org/10.1109/ICDE.2018.00214)].
This results in more subtle ternary truth tables for booleans:

```sql
with bools(v) as (values (true), (null), (false))
select a.v as a, b.v as b, a and b as and, a or b as or
from bools a, bools b;
```

```
 a | b | and | or 
---+---+-----+----
 t | t | t   | t
   | t |     | t
 f | t | f   | t
 t |   |     | t
   |   |     | 
 f |   | f   | 
 t | f | f   | t
   | f | f   | 
 f | f | f   | f
(9 rows)
```
