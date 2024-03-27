---
title: "Reference: Date Type"
linkTitle: "Date Type"
weight: 14
---

Date are day-accurate types without time of day references in ISO&nbsp;8601 `YYYY-MM-DD` format.
CedarDB also accepts [PostgreSQL notation](https://www.postgresql.org/docs/current/datatype-datetime.html#DATATYPE-DATETIME-DATE-TABLE).

Usage example:
```sql
create table example (
    due_date date
);
insert into example
    values (date '2000-01-01'),
           (date '2000-01-01' + interval '90' day);
select due_date from example;
```

```
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

Storing values outside of the supported range will result in an overflow exception.
Operations on dates are range checked, so that e.g., overflows will never cause wrong results.

## Input

In a session, you can change the `DateStyle` setting, which determines the parsing when entering ambiguous dates.

```sql
-- The common "little-endian" date style
set DateStyle = 'DMY';
select '01/02/03';
```
```
  ?column?  
------------
 2003-02-01
(1 row)
```

```sql
-- US "middle-endian" date style
set DateStyle = 'MDY';
select '01/02/03';
```
```
  ?column?  
------------
 2003-01-02
(1 row)
```



