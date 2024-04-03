---
title: "Reference: Text Types"
linkTitle: "Text Types"
weight: 12
---

CedarDB's `text` data type stores string data.
It considers all strings as Unicode in UTF-8 encoding.
In addition to the unconstrained `text` data type, CedarDB support standard SQL blank-padded 
`char(length)`, and length constrained `varchar(length)` types.

## Usage Example
```sql
create table example (
    gender char(1),
    description text
);
insert into example
    values ('⚧', repeat('UwU', 100)),
           ('X', '''Hi''');
select * from example;
```

```
 gender | description 
--------+-------------
 ⚧      | UwUUwU...
 X      | 'Hi'
(2 rows)
```

## Text Length

CedarDB specifies text length in *Unicode code points*:

```sql
select length('🍍'), char_length('🍍'), octet_length('🍍');
```

```
 length | char_length | octet_length 
--------+-------------+--------------
      1 |           1 |            4
(1 row)
```

The maximum *byte length* for strings is 4&nbsp;GiB.
For compatibility to existing systems, conversions from `char` to `text` strips trailing
blank-padded spaces.

In addition, all strings need to be valid UTF-8 sequences, i.e., it is not possible to store
arbitrary binary data in string columns without additional encoding.
For such data, consider using `bytea`.

## Performance Considerations
Text and length-constrained string data types are handled equivalently.
Strings with explicit length do not provide performance or storage benefits.
Thus, we generally recommend against length-constraining string columns.

One exception is `char(1)`, which is often used as an enum value.
Therefore, CedarDB stores it as a four-byte integer, i.e., one full Unicode code point.

Independent of length-constraints, CedarDB stores short strings of up to 12&nbsp;Bytes
inline, whereas larger strings need an indirection.
Short strings therefore have significant performance advantages.

## Unicode Collation Support

[Unicode collations](https://en.wikipedia.org/wiki/Collation) allow comparisons of string data.
In the default collation, strings are ordered `binary`, i.e., lexicographically byte-by-byte by their UTF-8 encoding.
Collates can be specified as [Unicode CLDR locale identifiers](https://unicode.org/reports/tr35/#Canonical_Unicode_Locale_Identifiers)
with the additional tags `_ci` for case-insensitivity, and `_ai` for accent-insensitivity.

For example, a case-insensitive collate can be useful for text comparison:
```sql
with strings(a, b) as (
   values ('foo', 'FOO')
)
select a, b, a = b, a collate "en_US_ci" = b
from strings;
```

```
  a  |  b  | ?column? | ?column? 
-----+-----+----------+----------
 foo | FOO | f        | t
(1 row)
```

### Non-deterministic Results
Be aware that queries using collates can lead to unexpected results, when values *look* different, but 
are considered equivalent according to the specified collate!
For example, for the following query, both, the lowercase and the uppercase result are equally valid:
```sql
with strings(s) as (values ('foo'), ('FOO'))
select distinct s collate "en_US_ci"
from strings;
```

```
 ?column? 
----------
 foo
(1 row)
```
```
 ?column? 
----------
 FOO
(1 row)
```

You can achieve a deterministic result by rewriting the query to output a `min()` aggregate in `binary` collate.
```sql
select min(s collate "binary")
from strings
group by s collate "en_US_ci";
```

### Choose the Right Locale
The expected ordering of diacritics can depend on the specified collate. French Candians, for example, seem to have a specific preference about the lexicographical order of diacritics:

```sql
with strings(s) as (
   values ('cote'),
          ('coté'),
          ('côte'),
          ('côté')
)
select s from strings order by s;
```

```
  s
------
 cote
 coté
 côte
 côté
(4 rows)
```


```sql
select s from strings order by s collate "fr_CA";
```

```
  s
------
 cote
 côte
 coté
 côté
(4 rows)
```

