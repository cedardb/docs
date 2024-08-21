---
title: "Reference: Time Type"
linkTitle: "Time"
weight: 25
---

Time data represents a time of day without a day reference between 00:00:00 and 24:00:00 in microsecond resolution.

## Usage Example

```sql
create table example (
    meeting_time time
);
insert into example
    values (time '8:00 am'),
           (time '8:00 pm'),
           (time '20:15');
select meeting_time from example;
```

```
 meeting_time 
--------------
 08:00:00
 20:00:00
 20:15:00
(3 rows)
```

## Calculating with Time

Calculations with times automatically wrap around following the 24-hour clock.

```sql
select time '11:00 pm' + interval '8' hour;
```

```
 ?column? 
----------
 07:00:00
(1 row)
```
