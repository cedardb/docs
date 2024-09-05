---
title: Prepared Statements
weight: 60
prev: advanced
next: pgvector
---

Prepared statements allow you to declare an SQL statement *template* ahead of time once and execute it many times over later on.
You can think of it like a function call in your favorite programming language:
```sql
prepare add as select $1::int + $2::int as sum;
```

You can then run your freshly prepared statement with any argument values:
```
execute add(4,5);

 sum
-----
   9
(1 row)
```

If you want to re-define a prepared statement, you first have to make CedarDB forget about your previous definition:
```
deallocate add;
```

{{< callout type="info" >}}
Names of prepared statements are case-*insensitive*: `ADD`, `adD` and `add` refer to the same statement.
{{< /callout >}}



## Why you might want prepare your statements
Prepared statements especially shine in two use cases:

### Increase security
When working with user-facing applications, queries to CedarDB usually involve user-submitted data, such as a user's name or their data of birth.
If such data is not properly sanitized, the application is vulnerable to [SQL injections](https://en.wikipedia.org/wiki/SQL_injection).
In a prepared statement, that user-supplied data stays confined to the arguments within a query and is not treated as a query itself.

**Unsafe**:
```sql
username = 'alonso;drop table users;';
query = "select * from users where name =" + username;
---> All your users are deleted!
```

**Safe, with prepared statements**:
```sql
prepare lookupuser as select * from users where name = $1;
execute lookupuser('alonso;drop table users'); 
-- the whole string is interpreted as name, 
-- the attacker cannot escape the query! 
```

### Increase performance
SQL statements are usually executed not just once, but multiple times.
When preparing a statement, CedarDB can do a lot of upfront work **once**, instead of each time when the query is executed.
Assume, for example, we want to build a stock market monitoring app and have to keep track of thousands of incoming trades per second:

```sql
create table trades
(
    timestamp   bigint,
    side        text,
    stock       text,
    quantity    int,
    price       numeric(10,4)
);

prepare newTrade as insert into trades values($1, $2, $3, $4, $5);
```

Now we can just execute this function for each new incoming trade:

```sql
EXECUTE newTrade(1715958691, 'BUY', 'AAPL', 3, 189.8700);
```

While the difference does not seem like much, it quickly adds up over millions of inserts.
```sql
> insert into trades values (1715958691, 'BUY', 'AAPL', 3, 189.8700);
INFO:     [s] execution: (0.000178s) compilation: (0.000313s)

> execute newTrade(1715958691, 'BUY', 'AAPL', 3, 189.8700);
INFO:     [s] execution: (0.000179s) compilation: (0.000032s) <--- just a tenth!
```

## Prepared statements in your favorite client
You can of course use prepared statements via raw SQL instructions as shown above.

{{< callout type="info" >}}
Keep in mind that statements you prepared via SQL are stored by *session*.
If you start a second connection, use a thread pool, or reconnect after a timeout, you will have to re-prepare your statements.
{{< /callout >}}

Most database drivers, however, offer far more comfortable abstractions to make use of them without you having to do extra work.

For example, in [Python's `psycopg`](/docs/clients/python) you can use the `executeMany()` call when executing the same SQL statements multiple times.
`psycopg` then internally instructs CedarDB to prepare the statement, when a certain threshold is reached.

Have a look at the ["Clients" section](/docs/clients) to see how your favorite client can be used efficiently with prepared statements.


## How CedarDB treats prepared statements
Whenever instructed to prepare a statement, CedarDB
1. parses the query string
2. generates and optimizes an execution plan
3. generates highly optimized executable code for the plan

Each subsequent execution of the statement within the session can then directly use this optimized code.
This ensures that all subsequent queries are consistently executed with minimal latency.

To be able to completely compile the prepared statement, CedarDB enforces static types for all parameters.
In many cases, CedarDB infers parameter types from the surrounding query, and an explicit type can be omitted.
However, in some cases it is not possible to infer the data type, which results in an error:
```sql
prepare echo as select $1;
ERROR:  unable to infer the data type for parameter $1
```

In such cases, you can explicitly cast the parameter to a type, e.g.: `$1::int`.
