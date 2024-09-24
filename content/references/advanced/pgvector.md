---
title: Pgvector Extension
---

CedarDB supports working with vectors using the syntax from the [pgvector
Postgres extension](https://github.com/pgvector/pgvector).

{{<callout type="info">}}
Currently, CedarDB has no vector similarity index, so vector similarity
searches will be slow for data sets larger than a few gigabytes.
{{</callout>}}

All vectors are represented as a bracket-enclosed, comma-separated list of
float values with the SQL type `vector`. You can optionally specify the number
of dimensions of the vector type, e.g., `vector(42)`. Values that have the type
`vector` contain one or more elements, values with a fixed number of dimensions
must always have that fixed number of elements.

Internally, CedarDB stores the vector values as single-precision 32-bit floats,
so all arithmetic operations on vectors will also have single-precision
accuracy.

## Creating Vectors

You can write vectors as string literals like this:
```sql
-- Create a vector with three elements
select '[1,1.5,2]'::vector;
-- Create a vector with a fixed, known number of dimensions
select '[1,1.5,2]'::vector(3);
```

Vectors must have at least one element and must not contain infinity or NaN
values. So, all of these examples are invalid:
```sql
-- Vector must contain at least one element
select '[]'::vector;
-- Vector can't have infinity elements
select '[inf]'::vector;
-- Vector can't have NaN elements
select '[NaN]'::vector;
-- Vector must have correct number of dimensions (if specified)
select '[1,1.5,2]'::vector(42);
```

You can also create vectors by casting them from arrays. Casting to a vector
with a fixed number of dimensions will fail if the array does not have the same
number of elements. But you can cast between different vector types which will
truncate the vector or append zeroes, if necessary.
```sql
-- Cast an array of doubles to a vector
select cast('{1,2,3}'::double[] as vector);
-- You can also cast vectors back to arrays
select cast('[1,2,3]'::vector as double[]);
-- This cast fails because the array does not contain 42 elements
select cast('{1,2,3}'::double[] as vector(42));
-- Cuts off the last value of the vector
select cast('[1,2,3]'::vector as vector(2));
-- Appends the element 0 to the vector
select cast('[1,2,3]'::vector as vector(4));
```

## Basic Operations on Vectors

Vectors support element-wise addition, subtraction and multiplication with
other vectors, as well as multiplication and division with scalars. You can add
and subtract vectors with different dimensions in which case CedarDB
automatically appends zeroes to the smaller vector.

```sql
-- Add two vectors element-wise
select '[1,2,3]'::vector + '[4,5,6]'::vector;
-- Result: [5,7,9]

-- Subtract two vectors element-wise
select '[1,2,3]'::vector - '[4,5,6]'::vector;
-- Result: [-3,-3,-3]

-- Multiply two vectors element-wise
select '[1,2,3]'::vector * '[4,5,6]'::vector;
-- Result: [4,10,18]

-- Add two vectors with different dimensions
select '[1,2,3]'::vector + '[42]'::vector;
-- Result: [43,2,3]

-- Multiply a vector by a scalar
select '[1,2,3]'::vector * 2;
-- Result: [2,4,6]

-- Divide a vector by a scalar
select '[1,2,3]'::vector / 2;
-- Result: [0.5,1,1.5]
```

You can also compare vectors for equality and inequality. Since vectors contain
floating-point numbers, comparing them for exact equality probably isn't that
useful. Instead, you should use one of the similarity functions explained
below. When comparing two vectors with different dimensions, the smaller vector
is padded with zeros. Inequalities (`<`, `<=`, `>`, `>=`) are lexicographic.

```sql
-- Inequality comparison on a two vectors
select '[1,2,3]'::vector < '[3,4,5]'::vector;
-- Result: t

-- Inequality comparison of vectors of different sizes
select '[1,2,0]'::vector >= '[1,2]'::vector;
-- Result: t
```

You can also use the function `vector_cmp` that compares two vectors and
returns 0 if they are equal, -1 if the first vector is smaller than the second,
and 1 otherwise:

```sql
select vector_cmp('[1,2,3]'::vector, '[3,4,5]'::vector);
-- Result: -1

select vector_cmp('[1,2,3]'::vector, '[0,1,2]'::vector);
-- Result: 1
```

Since vectors support basic arithmetic and comparison, you can also use them
with aggregation functions such as `sum`, `avg`, `min`, and `max`:
```sql
create table my_vectors ( v vector not null );
select sum(v), avg(v), min(v), max(v) from my_vectors;
```

## Vector Functions and Operators

When working with vectors, it is very common to compare them according to
different similarity metrics. CedarDB implements the similarity metrics shown
in the following table:

| Similarity Metric       | Function Name     | Operator |
|-------------------------|-------------------|----------|
| L2 / euclidean distance | `l2_distance`     | `<->`    |
| L1 / manhattan distance | `l1_distance`     | `<+>`    |
| cosine distance         | `cosine_distance` | `<=>`    |
| inner product           | `inner_product`   | `<#>`    |

For compatibility with pgvector, the `inner_product` function returns the inner
product of two vectors but the `<#>` operator returns the *negative* inner
product.

Here are some examples:

```sql
select '[1,2,3]'::vector <-> '[1,2,5]'::vector;
-- Result: 2
select l2_distance('[1,2,3]'::vector, '[1,2,5]'::vector);
-- Result: 2

select '[1,2,3]'::vector <+> '[4,5,6]'::vector;
-- Result: 9
select l1_distance('[1,2,3]'::vector, '[4,5,6]'::vector);
-- Result: 9

select '[1,1,1,1]'::vector <=> '[2,2,2,2]'::vector;
-- Result: 0
select cosine_distance('[1,1,1,1]'::vector, '[2,2,2,2]'::vector);
-- Result: 0

select '[1,2,3]'::vector <#> '[4,5,6]'::vector;
-- Result: -32
select inner_product('[1,2,3]'::vector, '[4,5,6]'::vector);
-- Result: 32
```

### Miscellaneous Functions

CedarDB also supports some utility functions on vectors shown in the following
table:

| Function Name  | Description                                    |
|----------------|------------------------------------------------|
| `vector_norm`  | Calculates the L2 / euclidean norm of a vector |
| `l2_normalize` | Normalize a vector using its L2 norm           |
| `vector_dims`  | Returns the number of dimensions of a vector   |
| `\|\|`         | Concatenate two vectors                        |

Examples:

```sql
select vector_norm('[1,1,1,1]'::vector);
-- Result: 2

select l2_normalize('[1,1,1,1]'::vector);
-- Result: [0.5,0.5,0.5,0.5]

select vector_dims('[1,2,3]'::vector);
-- Result: 3

select '[1,2]'::vector || '[3,4]'::vector;
-- Result: [1,2,3,4]
```
