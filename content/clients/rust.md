---
title: "Rust"
linkTitle: "Rust"
weight: 60
---

You can use CedarDB with [tokio-postgres](https://docs.rs/tokio-postgres/), a popular PostgreSQL adapter for Rust.

## Connecting

Connect to CedarDB like this:

```rust
let (client, connection) = tokio_postgres::connect("host=127.0.0.1 user=<username> password=<password> dbname=<database>", NoTls).await?;
tokio::spawn(async move {
    if let Err(e) = connection.await { eprintln!("connection error: {}", e); }
});
```

This starts the connection to CedarDB in the [Tokio asynchronous runtime](https://tokio.rs/), which executes all queries
via `async` functions.
You can execute a first query which should print "Hello CedarDB" like this:

```rust
let row = client.query_one("select 'Hello CedarDB!'", &[]).await?;
let test: &str = row.get(0);
println!("{}", test);
```

## Inserting Data

Let's now use the database client to create a table storing chat messages:

```rust
client.execute("create table if not exists chatlog(userid integer, message text, ts timestamptz)", &[]).await?;
```

Afterward, we can insert some data:

```rust
client.execute("insert into chatlog values ($1, $2, $3)", &[&7, &"(☞ﾟ∀ﾟ)☞", &chrono::Local::now()]).await?;
```

{{< callout type="info" >}}
Under the hood, the Rust values are converted from/to Postgres types via the
[postgres_types](https://docs.rs/postgres-types/latest/postgres_types/trait.ToSql.html#types) crate.
This example converts the parameters `i32` to an `integer`, a `&str` to a `text` and a `chrono::DateTime<Local>` to a
`timestamptz`.
{{< /callout >}}

## Executing Queries

Let's now query the data we just inserted:

```rust
let result = client.query("select ts, userid, message from chatlog", &[]).await?;
for row in result {
    let (ts, usr, msg): (chrono::DateTime<chrono::Local>, i32, String) = (row.get(0), row.get(1), row.get(2));
    println!("[{ts}]: User {usr} wrote message \"{msg}\"");
}
```

```
[2024-06-06 11:00:41.536369 +02:00]: User 7 wrote message "(☞ﾟ∀ﾟ)☞"
```

## Bulk Loading

If you need to load a lot of data at once, you can use bulk loading instead of sending individual inserts.

You can use the `copy_in` binary format to fill a single table as follows:

```rust
let ts = chrono::Local::now();
let copy_sink = client.copy_in("copy chatlog (userid, message, ts) from stdin binary").await?;
let writer = BinaryCopyInWriter::new(copy_sink, &[Type::INT4, Type::TEXT, Type::TIMESTAMPTZ]);
let mut writer = pin!(writer);
let res = async {
    for i in 1..1000 {
        writer.as_mut().write(&[&i, &"Hello", &ts]).await?
    };
    Ok(())
};
res.await?;
```

## Pipelining

You can also use the async pipelining mode to efficiently execute many individual statements.
In this mode, the client does not wait for a server response before the next query is sent.

```rust
let ts = chrono::Local::now();
let mut new_messages = vec![(1, "Hello, I'm user 1".to_string(), ts)];
for i in 2..1000 {
    new_messages.push((i, "Hello, user 1".into(), ts.add(chrono::TimeDelta::seconds(i.into()))));
}

let insert = client.prepare("insert into chatlog values ($1, $2, $3)").await?;
{
    let trans = client.transaction().await?;
    let mut pipeline = Vec::new();
    for (id, msg, ts) in &new_messages {
        pipeline.push(async { trans.client().execute(&insert, &[id, msg, ts]).await });
    }
    future::try_join_all(pipeline).await?;
    trans.commit().await?;
}
```

This example starts an explicit [transaction](/docs/references/sqlreference/transaction/), and commits only once.
This writes significantly faster to the database than executing the statements individually.
However, you need to make sure that you explicitly commit the transaction, or otherwise all changes will be rolled back.

## Source Code

{{% details title="Open to show the complete sample code" closed="true" %}}

```toml
[package]
name = "cedar-example"
version = "0.0.1"
edition = "2021"

[dependencies]
tokio = { version = "1.38.0", features = ["full"] }
tokio-postgres = { version = "0.7.10", features = ["with-chrono-0_4"] }
chrono = "0.4.38"
futures-util = "0.3.30"
```

```rust
// SPDX-License-Identifier: MIT-0
use std::ops::Add;
use std::pin::pin;
use futures_util::future;
use tokio_postgres::{NoTls, Error};
use chrono;
use tokio_postgres::binary_copy::BinaryCopyInWriter;
use tokio_postgres::types::Type;

#[tokio::main]
async fn main() -> Result<(), Error> {
    let (mut client, connection) = tokio_postgres::connect("host=127.0.0.1 user=<username> password=<password> dbname=<dbname>", NoTls).await?;
    tokio::spawn(async move {
        if let Err(e) = connection.await { eprintln!("connection error: {}", e); }
    });

    // First Query
    let row = client.query_one("select 'Hello CedarDB!'", &[]).await?;
    let test: &str = row.get(0);
    println!("{}", test);

    // Inserting Data
    client.execute("create table if not exists chatlog(userid integer, message text, ts timestamptz)", &[]).await?;
    client.execute("insert into chatlog values ($1, $2, $3)", &[&7, &"(☞ﾟ∀ﾟ)☞", &chrono::Local::now()]).await?;

    // Executing queries
    {
        let result = client.query("select ts, userid, message from chatlog", &[]).await?;
        for row in result {
            let (ts, usr, msg): (chrono::DateTime<chrono::Local>, i32, String) = (row.get(0), row.get(1), row.get(2));
            println!("[{ts}]: User {usr} wrote message \"{msg}\"");
        }
    }

    // Bulk Loading
    let ts = chrono::Local::now();
    {
        let copy_sink = client.copy_in("copy chatlog (userid, message, ts) from stdin binary").await?;
        let writer = BinaryCopyInWriter::new(copy_sink, &[Type::INT4, Type::TEXT, Type::TIMESTAMPTZ]);
        let mut writer = pin!(writer);

        let res = async {
            for i in 1..1000 {
                writer.as_mut().write(&[&i, &"Hello", &ts]).await?
            };
            Ok(())
        };
        res.await?;
    }

    // Pipelining
    let ts = chrono::Local::now();
    let mut new_messages = vec![(1, "Hello, I'm user 1".to_string(), ts)];
    for i in 2..1000 {
        new_messages.push((i, "Hello, user 1".into(), ts.add(chrono::TimeDelta::seconds(i.into()))));
    }

    let insert = client.prepare("insert into chatlog values ($1, $2, $3)").await?;
    {
        let trans = client.transaction().await?;
        let mut pipeline = Vec::new();
        for (id, msg, ts) in &new_messages {
            pipeline.push(async { trans.client().execute(&insert, &[id, msg, ts]).await });
        }
        future::try_join_all(pipeline).await?;
        trans.commit().await?;
    }
    
    let row = client.query_one("select count(*) from chatlog", &[]).await?;
    let num_messages: i64 = row.get(0);
    println!("chatlog table has {num_messages} rows");

    return Ok(());
}
```

{{% /details %}}
