---
title: "Reference: Range Types"
linkTitle: "Ranges"
---

The range types are a convenient way to define a range of values between two bounds.

CedarDB supports ranges with the following bound types:
- `int4range` (range of [`int`](../integer.md))
- `int8range` (range of [`bigint`](../integer.md))
- `numrange` (range of [`bignumeric(38,6)`](../numeric.md))
- `daterange` (range of [`date`](../date.md))
- `tsrange` (range of [`timestamp`](../timestamp.md) without time zone)
- `tstzrange` (range of [`timestamptz`](../timestamp.md))

## Usage example

```sql
-- Create a table with an int4range column
CREATE TABLE trees (
    species TEXT,
    height_range INT4RANGE -- The minimum and maximum expected height
);

-- Insert some trees
INSERT INTO tree VALUES
   ('Cedar', '[15,40)'::int4range),
   ('Oak', '[30,40)'::int4range),
   ('Maple', '[35,40)'::int4range);

-- Get the trees that reach a high of at least 20 m
-- Use the lower function to get the lower bound
SELECT *
FROM trees
WHERE lower(height_range) >= 20;
```

```
species  | height_range
---------+--------------
Oak      | [30,40)
Maple    | [35,40)
```

```sql
-- Find trees whose height range contains 20 m
SELECT * 
FROM trees
WHERE height_range @> 20;
```

```
species  | height_range
---------+--------------
Cedar    | [15,40)
```

## Creating ranges

Ranges can be created either by casting a string to a range or explicitly by calling the constructor function.
For each range, the bounds and whether they are inclusive, exclusive or infinite can be defined.
Inclusive ranges are represented with `[` and `]`, exclusive ones with `(` and `)` and for infinite bounds, the bound value is omitted.

CedarDB canonicalizes all ranges to have an inclusive lower and an exclusive upper bound.
Only infinite bounds are always exclusive.
This also affects the output of some functions, e.g., `lower` always returns the lower bound as inclusive.

### Example

```sql
-- Use the trees table defined above
INSERT INTO trees VALUES
  ('Birch', '(10,30)'), -- Both bounds are exclusive
  ('Sequoia', '[100,)'), -- There is no value for the upper bound, claiming that sequoia trees can reach arbitrary height
  ('Pine', int4range(15, 25)), -- Using the constructor function with the default bounds '[)'
  ('Appletree', int4range(2, 12, '[]')) -- Using the constructor function with explicit bounds

-- Get all trees
SELECT * FROM trees;
```

```
species   | height_range
----------+--------------
Cedar     | [15,40)
Oak       | [30,40)
Maple     | [35,40)
Birch     | [11,30) -- The lower bound has been canonicalized
Sequoia   | [100,)
Pine      | [15,25)
Appletree | [2,13) -- The upper bound has been canonicalized
```

## PostgreSQL Compatibility

In PostgreSQL, canonicalization is only applied to `int4range`, `int8range` and `daterange`.
In CedarDB, this is possible for all range types.

CedarDB restricts the precision and scale of [`numerics`](../numeric.md) for performance reason. 
As the `numeric` datatype is used for the bound values of `numranges`, the restrictions apply here as well.
In this case, CedarDB stores the bounds as `bignumeric(38,6)`.