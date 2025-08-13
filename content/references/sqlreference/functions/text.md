---
title: "Reference: Text Functions"
linkTitle: "Text"
---

CedarDB supports a variety of functions for the [text](/docs/references/datatypes/text) data type. This page currently
only describes a  subset of those. See [SQL features](/docs/compatibility/sql_features) for a full list of supported
functions.

## Functions and Operators

#### string_to_table()

**Arguments**: (_string_ text, _delimiter_ text [, _null_string_ text ]))

The `string_to_table()` function splits a _string_ at the _delimiter_ and replaces output words that match the
_null_string_ by null. If the _delimiter_ is NULL, the _string_ is split into all its characters. If the _delimiter_ is
empty, the _string_ is not split at all.
The final result is returned as a column of type **text** where each output word is a row.

```sql
select string_to_table('The General Sherman tree is the largest tree in the world.', ' ', 'the') as foo;
```

```
 foo 
-----
The
General
Sherman
tree
is
NULL
largest
tree
in
NULL
world.
(11 rows)
```

## Pattern Matching

### POSIX Regular Expressions

CedarDB allows to specify POSIX regular expressions within a pattern.
The following functions allow to specify such a pattern.

#### regexp_count()

**Arguments**: (_string_ text, _pattern_ text [, _start_ integer [, _flags_ text ]])

The `regexp_count()` function counts the number of appearances of a _pattern_ in a _string_.
If a _start_ parameter is provided, the search starts at that offset in the _string_,  else from the beginning
of the _string_. The _flags_ parameter changes the function's semantics; for example, the `i` flag makes the pattern
matching case-insensitive.

```sql
select regexp_count('The General Sherman tree is the largest tree in the world.', 'Tree', 23, 'i') as foo;
```

```
 foo 
-----
 1
(1 row)
```

#### regexp_instr()

**Arguments**:
(_string_ text, _pattern_ text [, _start_ integer [, _N_ integer [, _endoption_ integer
[, _flags_ text [, _subexpr_ integer ]]]]])

The `regexp_instr()` function determines the position of a _pattern_ in a _string_.
If a _start_ parameter is provided, the search starts at that offset in the _string_,  else from the beginning
of the _string_. If _N_ is specified, the function determines the *N*th match with the _pattern_, otherwise the first match
is determined. If the _endoption_ is not set or set to 0, the position of the match's first character is returned,
else it must be set to 1, implying the position after the match's last character is returned.
The _flags_ parameter changes the function's semantics; for example, the `i` flag makes the pattern
matching case-insensitive. The _subexpr_ allows to specify the subexpression of interest within the _pattern_ and
defaults to 0, which leads to identifying the position of the whole match regardless of parenthesized subexpressions.

```sql
select regexp_instr('The General Sherman tree is the largest tree in the world.', 'Tree', 23, 1, 1, 'i') as foo;
```

```
 foo 
-----
 45
(1 row)
```

#### regexp_like()

**Arguments**: (_string_ text, _pattern_ text [, _flags_ text]))

The `regexp_like()` function compares a _pattern_ to a _string_. It returns true if the _pattern_ matches the _string_
and false if it does not. If any input is null, the output is also null. _Flags_ change the function's semantics;
for example, the `i` flag makes the pattern matching case-insensitive.

```sql
select regexp_like('The General Sherman tree is the largest tree in the world.', 'Tree.*Largest', 'i') as foo;
```

```
 foo 
-----
 t
(1 row)
```

