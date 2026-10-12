---
title: "Reference: Bit String Functions and Operators"
linkTitle: "Bit String Functions and Operators"
---

[Bit String Functions and Operators](https://en.wikipedia.org/wiki/Bit_array) allow to examine and manipulate bit strings. The supported data types are `bit` and `bit varying`.

{{< callout type="info" >}}
Bitstring functions ignore `null` values and return `null` when one input is `null`.
{{< /callout >}}

## General-purpose functions

### `bit & bit`

Bitwise AND (inputs must be of equal length).
Example:

```sql
SELECT B'10011' & B'10101'; -> B'10001'
```

### `bit | bit`

Bitwise OR (inputs must be of equal length).
Example:

```sql
SELECT B'10011' | B'10101'; -> B'10111'
```

### `bit # bit`

Bitwise XOR (inputs must be of equal length).
Example:

```sql
SELECT B'10011' # B'10101'; -> B'00110'
```

### `bit || bit`

Concatenation.
Example:

```sql
SELECT B'10001' || B'011'; -> B'10001011'
```

In addition, `length`, `bit_length`, `octet_length`, `bit_count`, `position`, `substring`, `overlay`, `get_bit`, and `set_bit` work on bit strings, and integers can be cast to and from `bit(n)`.

## PostgreSQL Differences

- The bitwise NOT operator `~` and the shift operators `<<` and `>>` are not supported for bit strings.
