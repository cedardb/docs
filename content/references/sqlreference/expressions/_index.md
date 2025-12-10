---
title: "Reference: SQL Expressions"
linkTitle: "SQL Expressions"
weight: 30
---

CedarDB supports many expressions that manipulate data:

* Abs (`@`)
* [Access `->`, `->>`](/docs/references/sqlreference/functions/json#dictionary-access)
* And (`&&`)
* At time zone
* Between, between symmetric
* Bit and (`&`) on [bitsrings](/docs/references/sqlreference/functions/bitstring#bit--bit)
* Bit or (`|`) on [bitstrings](/docs/references/sqlreference/functions/bitstring#bit--bit-1)
* Bit xor (`#`) on [bitstrings](/docs/references/sqlreference/functions/bitstring#bit--bit-2)
* Case-insensitive like (`ilike`, `~~*`), negated (`not ilike`, `!~~*`)
* Case-insensitive regular expression (`~*`), negated (`!~*`)
* Casting (`::`)
* Coalesce
* Concat (`||`)
* Conditionals (`case when`)
* Contains (`@>`)
* Cube root (`||/`)
* Div (`/`)
* Equal (`=`, `==`), not equal (`<>`, `!=`)
* Exists subquery
* Factorial (`!`, `!!`)
* Greater (`>`)
* Greater or equal (`>=`)
* Greatest / Least
* In
* Is contained (`<@`)
* Is distinct from
* Is null
* Less (`<`)
* Less or equal (`<=`)
* Like (`like`, `~~`), not like (`not like`, `!~~`)
* Minus (`-`)
* Mod (`%`)
* Mul (`*`)
* Nullif
* Or
* Plus (`+`)
* Pow (`^`)
* Regular expressions matching (`~`), negated (`!~`)
* Scalar subquery
* Shift left bitwise (`<<`)
* Shift right bitwise (`>>`)
* Similar to
* Square root (`|/`)
* [Try](try)
* Unique subquery
