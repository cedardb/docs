---
title: "Reference: Copy Statement"
linkTitle: "Copy"
---

Copy statements allow bulk im- and export of tables:

Usage example:

```sql
-- Export
copy (select * from movies) to 'movies_backup.csv';
-- Import
copy movies2 from 'movies_backup.csv';
```

## Options

Copy supports a number of options controlling the format.

* `Format`:
  `csv`, `text`, `binary`. Only for copy to: `numpy`.
* `Delimiter`:
  The record separator for `text` and `csv` formats.
  By default `\t`, and `,`.
* `Header`:
  If the `text` and `csv` has a header.
  By default `false`.
* `Null`:
  The string that represents a `null` value in `text` and `csv` formats.
  By default `\N`, and empty string.
* `Quote`:
  The quoting character for the `csv` format. By default `"`.
  This can be used to insert values containing the delimiter.
* `Escape`:
  The escape character for the `csv` format. By default `"`.
  This can be used to escape the quote character.
* `Force Not Null`:
  Do not match the specified columns' values against the null string. In the default case where the null string is empty, this means that empty values will be read as zero-length strings rather than nulls, even when they are not quoted. If `*` is specified, the option will be applied to all columns. This option is allowed only in `COPY FROM`, and only when using `csv` format.
* `Force Null`:
  Match the specified columns' values against the null string, even if it has been quoted, and if a match is found set the value to `NULL`. In the default case where the null string is empty, this converts a quoted empty string into NULL. If `*` is specified, the option will be applied to all columns. This option is allowed only in `COPY FROM`, and only when using `csv` format.
  {{< callout type="info" >}}Note: `FORCE_NULL` and `FORCE_NOT_NULL` can be used simultaneously on the same column. This results in converting quoted null strings to null values and unquoted null strings to empty strings.{{< /callout >}}

CedarDB also supports a best-effort import mode:

* `(on_error ignore)`:
  By default, Copy aborts when encountering invalid rows.
  With this option, rows containing mismatching elements will be skipped on a best-effort basis.

A query that uses all available copy options could look like this:
```sql
COPY target_table (column1, column2, column3)
FROM '/absolute/path/to/your_file.csv'
WITH (
    FORMAT csv,
    DELIMITER ',',
    HEADER true,
    NULL 'null',
    QUOTE '"',
    ESCAPE '\',
    FORCE_NOT_NULL (column1, column2),
    FORCE_NULL (column3),
    ON_ERROR ignore
);
```
