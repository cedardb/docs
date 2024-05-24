---
title: "Reference: Timestamp Type"
linkTitle: "Timestamp"
weight: 26
---

Timestamps combine the [date](../date) and [time](../time) types to a single column in microsecond resolution.
Timestamps optionally support time zones, either by specifying `with time zone` or by using the `timestamptz` alias.

## Usage Example

```sql
create table example (
    raw timestamp,
    local timestamptz -- equivalent to timestamp with time zone
);
insert into example
    values (timestamp '2024-05-24 11:42:36.470585', timestamptz '2024-05-24 01:42:36.470585 PST'),
           (now()::timestamp, now());
select raw, local from example;
```

```
            raw             |             local             
----------------------------+-------------------------------
 2024-05-24 11:42:36.470585 | 2024-05-24 11:42:36.470585+02 
 2024-05-24 11:43:29.870372 | 2024-05-24 11:43:29.870372+02
(2 rows)
```


## Working with Time Zones

Timestamps with time zones are printed in *local time*, not the time zone they were initially entered in, as demonstrated in the usage example above:
1:42 AM PST is equivalent to 11:42 in Munich, where the client (and CedarDB's headquarters) is located.

Your client usually sets the local time zone when connecting to the database, and if it does not, CedarDB defaults to
the local time zone configured for the database system.

When working with fixed time zones, we recommend setting the time zone explicitly for your database session:

```sql
set timezone to 'US/Pacific';
```

Alternatively, when you multiplex different user sessions in one database session, working in UTC time in your backend
can eliminate this dependency on implicit state:

```sql
set timezone to 'UTC';
```

When the time of day is *not* relevant for your use case, e.g., when dealing with birthdates for age verification, consider using the [date](../date) type instead.
