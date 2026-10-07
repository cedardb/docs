---
title: "Reference: Interval Data Types"
linkTitle: "Interval"
weight: 15
---

Intervals are a convenient way for arithmetic on [date](../date), [time](../time), and [timestamp](../timestamp) data.
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

```text
  duration
-------------
 90 days
 21 days
 1 mon 1 day
(3 rows)
```

{{< callout type="info" >}}
By default, CedarDB prints intervals in the PostgreSQL style shown above.
You can change the output format with the `IntervalStyle` setting, for example to the terse SQL standard format:  
`set IntervalStyle to 'sql_standard';`  
CedarDB supports the styles `postgres`, `postgres_verbose`, `sql_standard`, and `iso_8601`.
{{< /callout >}}

## Why Intervals?

Date arithmetic with intervals automatically handle edge-cases like the irregular month lengths and leap years by
using CedarDBs calendar for calculations.

```sql
select date '2024-05-31' + interval '1' month, date '2024-05-31' + interval '2' month;
```

```text
      ?column?       |      ?column?       
---------------------+---------------------
 2024-06-30 00:00:00 | 2024-07-31 00:00:00
(1 row)
```

```sql
select date '2024-02-28' + interval '2' day;
```

```text
      ?column?       
---------------------
 2024-03-01 00:00:00
(1 row)
```

## PostgreSQL Differences

- A fractional value combined with a separate field qualifier, such as `interval '1.5' day`, is rejected. PostgreSQL accepts it.
- CedarDB accepts a fractional-second precision such as `interval(0)` but ignores it: values always keep microsecond resolution.
