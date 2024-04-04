---
title: "C#"
linkTitle: "C#"
weight: 10
prev: /clients
next: /references
---

CedarDB is compatible with [Npgsql](https://www.npgsql.org/), the open source .NET driver for PostgreSQL.

## Connecting
Connect to CedarDB like this:
```C#
String connString = "Server=127.0.0.1;User Id=<username>;Password=<password>;Database=<dbname>;NoResetOnClose=true";
var dataSourceBuilder = new NpgsqlDataSourceBuilder(connString);
var dataSource = dataSourceBuilder.Build();
var conn = await dataSource.OpenConnectionAsync();
```

{{< callout type="warning" >}}
Npgsql uses connection pooling. To avoid leaking state, it resets the connection state when switching the connection thread. However, CedarDB does not yet support the `DISCARD` command used by Postgres to achieve this. Therefore, we have to disable this behavior with the `NoResetOnClose=true` parameter in the connection string for now.
{{< /callout >}}

You now have an open connection to CedarDB that allows you to insert data or query the database.

## Inserting Data

Let's use npgsql's `DataSource` abstraction to create a new table storing the log of a public chat channel:

```C#
await using var createCommand = dataSource.CreateCommand(
    "CREATE TABLE IF NOT EXISTS chatlog(userid integer, message text, ts timestamptz)");
await createCommand.ExecuteNonQueryAsync(); // you can also run this command synchronously, if required 
```
Alternatively, you can also talk to CedarDB using the `Connection` object instead. 
In the following, we insert a new tuple using the `conn` instance and a prepared statement:

```C#
await using var insertCommand = new NpgsqlCommand("INSERT INTO chatlog VALUES ($1, $2, $3)", conn)
{
    Parameters =
    {
        new() { Value = 7 },
        new() { Value = "(☞ﾟ∀ﾟ)☞" },
        new() { Value = SystemClock.Instance.InUtc().GetCurrentInstant()},
    }
};
await insertCommand.ExecuteNonQueryAsync();

```

## Executing Queries

Let's read back all data we have inserted previously:

```C#
await using var readCommand = dataSource.CreateCommand("SELECT ts, userid, message FROM chatlog");
await using var reader = await readCommand.ExecuteReaderAsync();

while (await reader.ReadAsync())
{
    Console.WriteLine(
        "[{0}]: User {1} wrote message \"{2}\"", 
        reader.GetDateTime(0), 
        reader.GetInt64(1), 
        reader.GetString(2));
}
```

## Bulk Loading
If you need to load a lot of data at once (e.g., for an initial import of your existing data set), inserting tuples one by one is too slow:
npgsql has to do a full roundtrip to CedarDB and back for each single insert, making the whole loading process severely network latency bound, even on a local connection.

Use npgsql's bulk loading feature instead:
```C#
using (var writer = conn.BeginTextImport("COPY chatlog (userid, message) FROM STDIN (FORMAT TEXT)"))
{
    for (int i = 0; i < 1000000; ++i)
    {
        await writer.WriteAsync(i + "\t(☞ﾟ∀ﾟ)☞\t2024-04-04 01:03:03\n");
    }
}       
```
This feature makes use of CedarDB's Postgres-compatible `COPY` mode to bulk transmit all data, leading to significantly higher throughput:
```
INFO:    1000000 rows (0.000014 s parsing, 0.000248 s compilation, 1.136539 s transmission, 0.035195 s execution)
```

{{< callout type="info" >}}
Npgsql also has a very easy to use *binary* copy mode which does not require manual string concatenation and promises to be even faster.
CedarDB will support this mode soon!
{{< /callout >}}


## Batching
If bulk loading is not an option, but data comes in at such a high rate that network latency becomes an issue, consider *batching*:

```C#
await using var transaction = await conn.BeginTransactionAsync();
await using var batch = new NpgsqlBatch(conn)
{
    BatchCommands =
    {
        new("INSERT INTO chatlog (userid, message, ts) VALUES (9,'I am part of a batch!', '2024-04-03 01:03:03')"),
        new("INSERT INTO chatlog (userid, message, ts) VALUES (10,'Me too!', '2024-04-04 01:03:03')"),
        new("INSERT INTO chatlog (userid, message, ts) VALUES (11,'Servus', '2024-04-05 01:03:03')"),
        new("INSERT INTO chatlog (userid, message, ts) VALUES (12,'I am the last!', '2024-04-06 01:03:03')"),
    }
};
await batch.ExecuteNonQueryAsync();
await transaction.CommitAsync();
```
Here, npgsql groups multiple statements into a single packet to CedarDB, saving expensive round trips.

{{< callout type="info" >}}
We recommend executing each batch within an explicit transaction (as shown above). 
Otherwise, each insert statement is applied in its own transaction, increasing latency.
Furthermore, by using one transaction per batch, you can ensure that either the whole batch is applied or nothing.
{{< /callout >}}


## Source Code

{{% details title="Open to show the complete sample code" closed="true" %}}

```C#
using NodaTime;
using NodaTime.Extensions;
using Npgsql;

class Sample
{
    static async Task Main(string[] args)
    {
        // Connect to CedarDB
        String connString = "Server=127.0.0.1;User Id=<username>; " + 
            "Password=<password>;Database=<database>;NoResetOnClose=true";
        
    var dataSourceBuilder = new NpgsqlDataSourceBuilder(connString);
    dataSourceBuilder.UseNodaTime();
    var dataSource = dataSourceBuilder.Build();
    var conn = await dataSource.OpenConnectionAsync();

    
    // Let's create a table
    await using var createCommand = dataSource.CreateCommand(
        "CREATE TABLE IF NOT EXISTS chatlog(userid integer, message text, ts timestamptz)");
    await createCommand.ExecuteNonQueryAsync();

    // Insert some data
    await using var insertCommand = new NpgsqlCommand("INSERT INTO chatlog VALUES ($1, $2, $3)", conn)
    {
        Parameters =
        {
            new() { Value = 7, DataTypeName = "integer"},
            new() { Value = "(☞ﾟ∀ﾟ)☞" },
            new() { Value = SystemClock.Instance.InUtc().GetCurrentInstant()},
        }
    };
    await insertCommand.ExecuteNonQueryAsync();
    
    // Let's query it!
    await using var readCommand = dataSource.CreateCommand("SELECT ts, userid, message FROM chatlog LIMIT 10");
    await using var reader = await readCommand.ExecuteReaderAsync();

    while (await reader.ReadAsync())
    {
        Console.WriteLine(
            "[{0}]: User {1} wrote message \"{2}\"", 
            reader.GetDateTime(0), 
            reader.GetInt64(1), 
            reader.GetString(2));
    }
    
    // Do a bulk insert
    using (var writer = conn.BeginTextImport("COPY chatlog (userid, message, ts) FROM STDIN (FORMAT TEXT)"))
    {
        for (int i = 0; i < 1000000; ++i)
        {
            await writer.WriteAsync(i + "\t(☞ﾟ∀ﾟ)☞\t2024-04-04 01:03:03\n");
        }
    }      
    
    // Do a batched transaction
    await using var transaction = await conn.BeginTransactionAsync();
    await using var batch = new NpgsqlBatch(conn, transaction)
    {
        BatchCommands =
        {
            new("INSERT INTO chatlog (userid, message, ts) VALUES (9,'I am part of a batch!', '2024-04-03 01:03:03')"),
            new("INSERT INTO chatlog (userid, message, ts) VALUES (10,'Me too!', '2024-04-04 01:03:03')"),
            new("INSERT INTO chatlog (userid, message, ts) VALUES (11,'Servus', '2024-04-05 01:03:03')"),
            new("INSERT INTO chatlog (userid, message, ts) VALUES (12,'I am the last!', '2024-04-06 01:03:03')"),
        }
    };
    await batch.ExecuteNonQueryAsync();
    await transaction.CommitAsync();
    }
}
```

{{% /details %}}
