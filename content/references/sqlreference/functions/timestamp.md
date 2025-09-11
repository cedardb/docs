---
title: "Reference: Timestamp Functions"
linkTitle: "Timestamp"
---

CedarDB supports a variety of functions for the [timestamp](/docs/references/datatypes/timestamp) data type. This page currently
only describes a subset of those. See [SQL features](/docs/compatibility/sql_features) for a full list of supported
functions.

## Functions and Operators

### to_char

The `to_char` function formats a timestamp (with or without time zone) into a string based on a user-specified format pattern.

##### **Syntax**

```
to_char(timestamp Timestamp, format Text) -> Text
to_char(timestamp TimestampTZ, format Text) -> Text
```

##### **Examples**
Formatting the release date of CedarDB with `to_char` to a common U.S. datetime style:
```sql
select to_char(timestamptz 'Sep 10 2025, 5:57PM+02', 'MM/DD/YYYY HH12:MI:SS PM');
```
```
        to_char
------------------------
 09/10/2025 05:57:00 PM
```
Format to a common German datetime style:
```sql
select to_char(timestamptz 'Sep 10 2025, 5:57PM+02', 'DD.MM.YYYY HH24:MI:SS');
```
```
      to_char
---------------------
10.09.2025 17:57:00
```

##### **Supported Format Patterns**
Currently, CedarDB supports a limited but commonly used subset of PostgreSQL format patterns:

| Pattern                           | Description                                    |
|-----------------------------------|------------------------------------------------|
| `AD`, `BC`                        | Era indicator without periods (uppercase)      |
| `ad`, `bc`                        | Era indicator without periods (lowercase)      |
| `A.D.`, `B.C.`                    | Era indicator with periods (uppercase)         |
| `a.d.`, `b.c.`                    | Era indicator with periods (lowercase)         |
| `AM` / `PM`                       | Meridiem indicator (before/after noon)         |
| `DAY` /`Day`/ `day`               | Day name (MONDAY / Monday / monday)            |
| `DY` / `Dy` / `dy`                | Abbreviated day name (MON / Mon / mon)         |
| `ID`                              | ISO day of the week (1–7, Monday=1)            |
| `DD`                              | Day of month (01–31)                           |
| `MM`                              | Month number (01–12)                           |
| `MONTH` / `Month` / `month`       | Month name (MARCH / March / march)             |
| `MON` / `Mon` / `mon`              | Abbreviated month name (MAR / Mar / mar)       |
| `YYYY`                            | Year (4 digits)                                |
| `IYYY`                            | ISO 8601 week-numbering year (4 digits)        |
| `MI`                              | Minute (00–59)                                 |
| `HH`, `HH12`                      | Hour (01–12)                                   |
| `HH24`                            | Hour (00–23)                                   |
| `SS`                              | Seconds (00–59)                                |
| `SSSS`                            | Seconds past midnight (0–86399)                |
| `:`, `;`, `,`, ` `, `.`, `-`, `/` | Char separators                                |

