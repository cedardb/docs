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

