---
title: "Reference: Set Operations"
linkTitle: "Set Operations"
---

Set operations combine the results of two queries.
Both queries must return the same number of columns with compatible types.

```sql
CREATE TABLE north_forest (species text);
CREATE TABLE south_forest (species text);
INSERT INTO north_forest VALUES ('Oak'), ('Birch');
INSERT INTO south_forest VALUES ('Oak'), ('Palm');

-- Species that grow in both forests
SELECT species FROM north_forest
INTERSECT
SELECT species FROM south_forest;
```

```text
 species
---------
 Oak
```

| Operation   | Result                                                                   |
|-------------|--------------------------------------------------------------------------|
| `UNION`     | Rows that appear in either query.                                        |
| `INTERSECT` | Rows that appear in both queries.                                        |
| `EXCEPT`    | Rows of the first query that do not appear in the second query.          |

By default, set operations remove duplicate rows.
With `ALL`, e.g., `UNION ALL`, they keep duplicates: `INTERSECT ALL` and `EXCEPT ALL` consider how often each row appears in each query.
`UNION ALL` is cheaper than `UNION` because CedarDB does not need to look for duplicates.

`INTERSECT` binds more tightly than `UNION` and `EXCEPT`.
Use parentheses to control the evaluation order.
An `ORDER BY` or `LIMIT` at the end applies to the combined result:

```sql
CREATE TABLE north_forest (species text);
CREATE TABLE south_forest (species text);

(SELECT species FROM north_forest UNION SELECT species FROM south_forest)
EXCEPT
SELECT 'Palm'
ORDER BY species;
```
