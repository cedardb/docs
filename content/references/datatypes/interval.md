---
title: "Reference: Interval Data Types"
linkTitle: "Interval"
weight: 15
---

Intervals are a convenient way for arithmetic on [date](date), [time](time), and [timestamp](timestamp) data.
You can specify intervals in quantities of calendar units like `day` or `month`, with at most `microseconds`
granularity.
You can find a complete list of input units and options in the
[PostgreSQL docs](https://www.postgresql.org/docs/current/datatype-datetime.html#DATATYPE-INTERVAL-INPUT).

## Usage Example

```sql
create table example (
    duration interval
);
insert into example
    values (interval '90' day), (interval '3 week'), (interval '1 month 1 day');
select * from example;
```

```
    duration    
----------------
 90 00:00:00
 21 00:00:00
 0-1 1 00:00:00
(3 rows)
```

{{< callout type="info" >}}
By default, CedarDB uses the SQL standard format, which has a terse syntax.
If you prefer human-readable output, consider changing the output format to PostgreSQL style:  
`set IntervalStyle to 'postgres';`
{{< /callout >}}

## Why Intervals?

Date arithmetic with intervals automatically handle edge-cases like the irregular month lengths and leap years by
using CedarDBs calendar for calculations.

```sql
select date '2024-05-31' + interval '1' month, date '2024-05-31' + interval '2' month;
```

```
      ?column?       |      ?column?       
---------------------+---------------------
 2024-06-30 00:00:00 | 2024-07-31 00:00:00
(1 row)
```

```sql
select date '2024-02-28' + interval '2' day;
```

```
      ?column?       
---------------------
 2024-03-01 00:00:00
(1 row)
```

