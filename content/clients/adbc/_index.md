---
title: "ADBC"
linkTitle: "ADBC"
weight: 15
---

CedarDB is compatible with the PostgreSQL [ADBC](https://arrow.apache.org/adbc/) (Arrow Database Connectivity) driver.

## Installing

Install the PostgreSQL ADBC driver with [dbc](https://docs.columnar.tech/dbc/):

```shell
dbc install postgresql
```

Then install the ADBC client library for your language:

{{< tabs >}}
{{< tab name="C++" >}}

Install the Arrow C++ and ADBC libraries with your system package manager.

On Debian or Ubuntu:

```shell
sudo apt install libarrow-dev libarrow-adbc-dev
```

{{< /tab >}}
{{< tab name="C#" >}}

```shell
dotnet add package Apache.Arrow.Adbc
```

{{< /tab >}}
{{< tab name="Go" >}}

```shell
go get github.com/apache/arrow-adbc/go/adbc
```

{{< /tab >}}
{{< tab name="JavaScript" >}}

```shell
npm install @apache-arrow/adbc-driver-manager apache-arrow
```

{{< /tab >}}
{{< tab name="Python" >}}

```shell
pip install adbc-driver-manager pyarrow
```

{{< /tab >}}
{{< tab name="R" >}}

```r
install.packages(c("adbcdrivermanager", "arrow", "tibble"))
```

{{< /tab >}}
{{< tab name="Ruby" >}}

Install the native Arrow and ADBC GLib libraries, then the `red-adbc` gem.

On macOS with Homebrew:

```shell
brew install apache-arrow-glib apache-arrow-adbc-glib
gem install red-adbc
```

On Debian or Ubuntu:

```shell
sudo apt install libarrow-glib-dev libadbc-glib-dev
gem install red-adbc
```

{{< /tab >}}
{{< tab name="Rust" >}}

```shell
cargo add adbc_core adbc_driver_manager arrow arrow-array
```

{{< /tab >}}
{{< /tabs >}}

## Connecting

Connect to CedarDB and run a query like this:

{{< tabs >}}
{{< tab name="C++" >}}

```cpp
#include <cstdlib>
#include <cstring>
#include <iostream>

#include <arrow-adbc/adbc.h>
#include <arrow-adbc/adbc_driver_manager.h>
#include <arrow/c/bridge.h>
#include <arrow/record_batch.h>

int main() {
  AdbcError error = {};

  AdbcDatabase database = {};
  AdbcDatabaseNew(&database, &error);
  AdbcDatabaseSetOption(&database, "driver", "postgresql", &error);
  AdbcDatabaseSetOption(&database, "uri",
                        "postgresql://<username>:<password>@localhost:5432/<dbname>", &error);
  AdbcDriverManagerDatabaseSetLoadFlags(&database, ADBC_LOAD_FLAG_DEFAULT, &error);
  AdbcDatabaseInit(&database, &error);

  AdbcConnection connection = {};
  AdbcConnectionNew(&connection, &error);
  AdbcConnectionInit(&connection, &database, &error);

  AdbcStatement statement = {};
  AdbcStatementNew(&connection, &statement, &error);

  struct ArrowArrayStream stream = {};
  int64_t rows_affected = -1;

  AdbcStatementSetOption(&statement, "adbc.postgresql.use_copy", "false", &error);
  AdbcStatementSetSqlQuery(&statement, "SELECT version()", &error);
  AdbcStatementExecuteQuery(&statement, &stream, &rows_affected, &error);

  auto reader = arrow::ImportRecordBatchReader(&stream).ValueOrDie();
  while (auto batch = reader->Next().ValueOrDie()) {
    std::cout << batch->ToString() << std::endl;
  }

  AdbcStatementRelease(&statement, &error);
  AdbcConnectionRelease(&connection, &error);
  AdbcDatabaseRelease(&database, &error);
  return EXIT_SUCCESS;
}
```

{{< /tab >}}
{{< tab name="C#" >}}

```csharp
using Apache.Arrow.Adbc;
using Apache.Arrow.Adbc.DriverManager;
using Apache.Arrow.Ipc;

using AdbcDriver driver = AdbcDriverManager.FindLoadDriver(
    "postgresql",
    loadOptions: AdbcLoadFlags.Default);

using AdbcDatabase db = driver.Open(new Dictionary<string, string>
{
    ["uri"] = "postgresql://<username>:<password>@localhost:5432/<dbname>",
});

using AdbcConnection conn = db.Connect(null);
using AdbcStatement stmt = conn.CreateStatement();

stmt.SetOption("adbc.postgresql.use_copy", "false");
stmt.SqlQuery = "SELECT version()";

QueryResult result = stmt.ExecuteQuery();
using IArrowArrayStream stream = result.Stream!;

while (await stream.ReadNextRecordBatchAsync() is { } batch)
{
    using (batch)
    {
        BatchPrinter.Print(batch);
    }
}
```

{{< /tab >}}
{{< tab name="Go" >}}

```go
package main

import (
    "context"
    "fmt"
    "log"

    "github.com/apache/arrow-adbc/go/adbc/drivermgr"
)

func main() {
    var drv drivermgr.Driver

    db, err := drv.NewDatabase(map[string]string{
        "driver": "postgresql",
        "uri":    "postgresql://<username>:<password>@localhost:5432/<dbname>",
    })
    if err != nil {
        log.Fatal(err)
    }
    defer db.Close()

    conn, err := db.Open(context.Background())
    if err != nil {
        log.Fatal(err)
    }
    defer conn.Close()

    stmt, err := conn.NewStatement()
    if err != nil {
        log.Fatal(err)
    }
    defer stmt.Close()

    if err := stmt.SetOption("adbc.postgresql.use_copy", "false"); err != nil {
        log.Fatal(err)
    }
    if err := stmt.SetSqlQuery("SELECT version()"); err != nil {
        log.Fatal(err)
    }

    stream, _, err := stmt.ExecuteQuery(context.Background())
    if err != nil {
        log.Fatal(err)
    }
    defer stream.Release()

    for stream.Next() {
        fmt.Println(stream.RecordBatch())
    }
    if err := stream.Err(); err != nil {
        log.Fatal(err)
    }
}
```

{{< /tab >}}
{{< tab name="JavaScript" >}}

```javascript
import { AdbcDatabase } from '@apache-arrow/adbc-driver-manager';

const db = new AdbcDatabase({
  driver: 'postgresql',
  databaseOptions: {
    uri: 'postgresql://<username>:<password>@localhost:5432/<dbname>',
  },
});

let conn, stmt;
try {
  conn = await db.connect();
  stmt = await conn.createStatement();
  stmt.setOption('adbc.postgresql.use_copy', 'false');
  await stmt.setSqlQuery('SELECT version()');
  const reader = await stmt.executeQuery();
  for await (const batch of reader) {
    console.log(batch.toArray());
  }
} finally {
  await stmt?.close();
  await conn?.close();
  await db.close();
}
```

{{< /tab >}}
{{< tab name="Python" >}}

```python
from adbc_driver_manager import dbapi

with (
    dbapi.connect(
        driver="postgresql",
        db_kwargs={
            "uri": "postgresql://<username>:<password>@localhost:5432/<dbname>",
        },
    ) as connection,
    connection.cursor(adbc_stmt_kwargs={"adbc.postgresql.use_copy": False}) as cursor,
):
    cursor.execute("SELECT version()")
    table = cursor.fetch_arrow_table()

print(table)
```

{{< /tab >}}
{{< tab name="R" >}}

```r
library(adbcdrivermanager)

drv <- adbc_driver("postgresql")

db <- adbc_database_init(
  drv,
  uri = "postgresql://<username>:<password>@localhost:5432/<dbname>"
)

con <- adbc_connection_init(db)

stmt <- adbc_statement_init(con)
adbc_statement_set_options(
  stmt,
  list(
    "adbc.postgresql.use_copy" = "false"
  )
)
adbc_statement_set_sql_query(stmt, "SELECT version()")

adbc_statement_execute_query(stmt) |>
  tibble::as_tibble()
```

{{< /tab >}}
{{< tab name="Ruby" >}}

```ruby
require "adbc"

database = ADBC::Database.new

begin
  database.set_option("driver", "postgresql")
  database.set_option("uri", "postgresql://<username>:<password>@localhost:5432/<dbname>")
  database.set_load_flags(ADBC::LoadFlags::DEFAULT)
  database.init

  database.connect do |connection|
    connection.open_statement do |statement|
      statement.set_option("adbc.postgresql.use_copy", "false")
      statement.sql_query = "SELECT version()"
      table, = statement.execute
      puts(table)
    end
  end
ensure
  database.release
end
```

{{< /tab >}}
{{< tab name="Rust" >}}

```rust
use adbc_core::options::{AdbcVersion, OptionDatabase, OptionStatement, OptionValue};
use adbc_core::{Connection, Database, Driver, LOAD_FLAG_DEFAULT, Optionable, Statement};
use adbc_driver_manager::ManagedDriver;
use arrow::util::pretty;
use arrow_array::RecordBatch;

fn main() {
    let mut driver = ManagedDriver::load_from_name(
        "postgresql",
        None,
        AdbcVersion::default(),
        LOAD_FLAG_DEFAULT,
        None,
    )
    .expect("Failed to load driver");

    let opts = [(
        OptionDatabase::Uri,
        "postgresql://<username>:<password>@localhost:5432/<dbname>".into(),
    )];
    let db = driver
        .new_database_with_opts(opts)
        .expect("Failed to create database handle");

    let mut conn = db.new_connection().expect("Failed to create connection");

    let mut statement = conn.new_statement().unwrap();
    statement
        .set_option(
            OptionStatement::Other("adbc.postgresql.use_copy".into()),
            OptionValue::String("false".into()),
        )
        .unwrap();
    statement.set_sql_query("SELECT version()").unwrap();
    let reader = statement.execute().unwrap();
    let batches: Vec<RecordBatch> = reader.collect::<Result<_, _>>().unwrap();

    pretty::print_batches(&batches).expect("Failed to print batches");
}
```

{{< /tab >}}
{{< /tabs >}}

Query results are returned in [Apache Arrow](https://arrow.apache.org/) format.

{{< callout type="info" >}}
Be sure to set the statement option `adbc.postgresql.use_copy` to `false` when querying CedarDB.
The PostgreSQL ADBC driver defaults to a `COPY`-based fast path to read results, which CedarDB does not yet support.
{{< /callout >}}
