---
title: "Reference: Bit String Functions and Operators"
linkTitle: "Bit String Functions and Operators"
---

[Bit String Functions and Operators](https://en.wikipedia.org/wiki/Bit_array) allow to examine and manipulate bit strings. The supported data types are `bit` and `bit varying`.

{{< callout type="info" >}}
Bitstring functions ignore `null` values and return `null` when one input is `null`.
{{< /callout >}}

See [PostgreSQL: Bit string functions and operators](https://www.postgresql.org/docs/current/functions-bitstring.html) for the PostgreSQL documentation.

## General-purpose functions

#### `bit & bit`
Bitwise AND (inputs must be of equal length).
Example:
```sql
SELECT B'10011' & B'10101'; -> B'10001'
```

#### `bit | bit`
Bitwise OR (inputs must be of equal length).
Example:
```sql
SELECT B'10011' | B'10101'; -> B'10111'
```

#### `bit # bit`
Bitwise XOR (inputs must be of equal length).
Example:
```sql
SELECT B'10011' # B'10101'; -> B'00110'
```
