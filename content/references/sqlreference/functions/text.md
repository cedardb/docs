---
title: "Reference: Text Functions"
linkTitle: "Text"
---

CedarDB supports a variety of functions for the [text](/docs/references/datatypes/text) data type. This page currently
only describes a  subset of those. See [SQL features](/docs/compatibility/sql_features) for a full list of supported
functions.

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

#### regexp_like()

**Arguments**: (string, pattern [, flags ]))

The `regexp_like()` function compares a pattern to a string. It returns true if the pattern matches the string and
false if it does not. If any input is null, the output is also null. Flags change the function's semantics;
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

