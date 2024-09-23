---
title: "Reference: Aggregation Functions"
linkTitle: "Aggregation Functions"
---

[Aggregation functions](https://en.wikipedia.org/wiki/Aggregate_function) allow computing a single *scalar* value from a
set of many values.
Aggregates are often used as a statistic summarizing the contents of a data set.

Usage example:

```sql
-- Determine the price range over all sales
select min(price), max(price), avg(price)
from sales;
-- Or for each customer
select customer_id, min(price), max(price), avg(price)
from sales
group by customer_id;
```

{{< callout type="info" >}}
Most aggregation function ignore `null` values and return `null` when they aggregated zero values.
{{< /callout >}}

## General-purpose functions

`any_value(x)`
: Extract an arbitrary non-null value from the input.

`approx_count_distinct(x)`
: Approximate a count of the distinct `x` values (i.e., `count(distinct x)`).
While a precise `count(distinct x)` needs to store all elements, this approximate version only uses a fixed state for a
[HyperLogLog](https://en.wikipedia.org/wiki/HyperLogLog) sketch independent of the data size.
This function can be very useful to compute distinct counts over huge data sets efficiently.

`arg_max(x, max)`
: Returns the `x` value for the maximum `max` value. When there are multiple equal `max` values, the `x` value is chosen
arbitrarily among them. However, multiple `arg_max` aggregates over the same `max` will come from the same tuple.

`arg_min(x, min)`
: Returns the `x` value for the minimum `min` value. The same caveats as for `arg_max` apply.

`array_agg(x)`
: Collect all incoming values (including `null`) in an [array](/docs/references/datatypes/array).
The order in the array is arbitrary, except when explicitly specified as `array_agg(x order by x)`.

`avg(x)`
: Calculate the arithmetic mean over `x`.

`bit_and(x)`
: Compute a bitwise AND over all `x` values.

`bit_or(x)`
: Compute a bitwise OR over all `x` values.

`bit_xor(x)`
: Compute a bitwise XOR over all `x` values.

`bool_and(x)`
: Compute a boolean AND over all `x` values.

`bool_or(x)`
: Compute a boolean OR over all `x` values.

`count(*)`
: Count the number of input rows.

`count(x)`
: Count the number of non-null `x` values.

`every(x)`
: Alias for `bool_and`.

`max(x)`
: Determine the maximum value. For equivalent maximum values (e.g., with
[case-insensitive collate](/docs/references/datatypes/text/#unicode-collation-support)) returns an arbitrary one.

`min(x)`
: Determine the minimum value. For equivalent minimum values returns an arbitrary one.

`string_agg(x, delimiter)`
: Concatenate all non-null input values with the specified `delimiter` between `x` values.
The order is arbitrary, except when explicitly specified as `string_agg(x, ',' order by x)`.

`sum(x)`
: Calculate the sum of all `x` values.
Uses checked arithmetic to guarantee correct results without [overflow](https://en.wikipedia.org/wiki/Integer_overflow).
For `double` values, CedarDB uses [Kahan summation](https://en.wikipedia.org/wiki/Kahan_summation_algorithm) for
extended precision.

### Modifiers

You can specify the `distinct` or `order by` within aggregation functions to modify the input to that function.
For example, a `count(distinct userid)` calculates how many unique users are in a set.
This also works on other duplicate-sensitive aggregates by deduplicating the input `x` values before processing them.
For order-sensitive aggregates like `string_agg`, you can also specify an `order by` clause to first sort the aggregated
values by an arbitrary expression.

## Statistical Aggregates

The following functions calculate more detailed statistical attributes over the input data.

`covar_pop(y, x)`
: Compute the population covariance

`covar_samp(y, x)`
: Compute the sample covariance

`regr_avgx(y, x)`
: Compute the average of the regression input (independent) `x` variable, i.e., `sum(x)/count(*)`

`regr_avgy(y, x)`
: Compute the average of the regression output (dependent) `y` variable, i.e., `sum(y)/count(*)`

`regr_count(y, x)`
: Count the number of rows where both `y` and `x` are not null.

`regr_intercept(y, x)`
: Determine the y-intercept of a [linear least-squares](https://en.wikipedia.org/wiki/Linear_least_squares) fit equation
of the (x, y) points.

`regr_r2(y, x)`
: Compute the square of the correlation coefficient `r²`.

`regr_slope(y, x)`
: Determine the slope of a [linear least-squares](https://en.wikipedia.org/wiki/Linear_least_squares) fit equation of
the (x, y) points.

`regr_sxx`
: Compute the *sum of squares* of the `x` variable , i.e., `sum(x^2) - sum(x)^2/count(*).`

`regr_svxy`
: Compute the *sum of products* of `x` times `y`, i.e., `sum(x*y) - sum(x) * sum(y)/count(*)`.

`stddev(x)`
: Compute the standard deviation, alias for `stddev_samp`.

`stddev_pop(x)`
: Compute the population standard deviation of `x`.

`stddev_samp(x)`
: Compute the sample standard deviation of `x`.

`variance(x)`
: Compute the variance, alias for `var_samp`.

`var_pop(x)`
: Compute the population variance of `x`.

`var_samp(x)`
: Compute the sample variance of `x`.

## Ordered-set aggregate functions

The following functions are *ordered-set* aggregates, with an order specified as `within group (order by exp)`.

`mode() within group (...)`
: Compute the most frequent value

`percentile_cont(fraction) within group (...)`
: Compute the continuous `n`th [percentile](https://en.wikipedia.org/wiki/Percentile) with the given `n` as a fraction
between 0 and 1.
The continuous percentile interpolates between values if necessary.

`percentile_disc(fraction) within group (...)`
: Compute the discrete `n`th [percentile](https://en.wikipedia.org/wiki/Percentile) with the given `n` as a fraction
between 0 and 1.
The discrete percentile returns the first value exceeding the percentile.
