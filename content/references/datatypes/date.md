---
title: "Reference: Date Type"
linkTitle: "Date"
weight: 14
---

Date is a day-accurate type without time of day references in ISO&nbsp;8601 `YYYY-MM-DD` format.
CedarDB also accepts the common PostgreSQL input formats, such as `January 8, 1999`, `1999-Jan-08`, `19990108`, and `J2451187`.

## Usage Example

```sql
create table example (
    due_date date
);
insert into example
    values (date '2000-01-01'),
           (date '2000-01-01' + interval '90' day);
select due_date from example;
```

```text
  due_date
------------
 2000-01-01
 2000-03-31
(2 rows)
```

## Value Range

|         Min |         Max |
|------------:|------------:|
| -4712-01-01 | 99999-12-31 |

Storing values outside the supported range will result in an overflow exception.
Operations on dates are range checked, so that e.g., overflows will never cause wrong results.

## Input

In a session, you can change the `DateStyle` setting, which determines the parsing when entering ambiguous dates.
The default is `ISO, YMD`.
CedarDB accepts the field orders `DMY`, `MDY`, and `YMD`, optionally prefixed with `ISO` and a comma, e.g., `ISO, DMY`.

```sql
-- The common "little-endian" date style
set DateStyle = 'DMY';
select date '01/02/03';
```

```text
  ?column?
------------
 2003-02-01
(1 row)
```

```sql
-- US "middle-endian" date style
set DateStyle = 'MDY';
select date '01/02/03';
```

```text
  ?column?
------------
 2003-01-02
(1 row)
```

## PostgreSQL Differences

- The special values `infinity` and `-infinity` are not supported.
- CedarDB always prints dates in ISO format. The `DateStyle` output styles `SQL`, `Postgres`, and `German` are not supported.
