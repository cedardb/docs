---
title: "ADBC"
linkTitle: "ADBC"
weight: 15
---

CedarDB is compatible with the [ADBC](https://arrow.apache.org/adbc/) PostgreSQL driver for Arrow-native database access.

## Installing Driver

Install the PostgreSQL ADBC driver with [dbc](https://docs.columnar.tech/dbc/):

```shell
dbc install postgresql
```

## Connecting to CedarDB

Pick your language to install the ADBC client library and connect to CedarDB:

{{< tabs >}}
{{< tab name="C++" >}}

### Installing the C++ Client

Install the Arrow C++ and ADBC libraries with your system package manager.

On Debian or Ubuntu:

```shell
sudo apt install libarrow-dev libadbc-driver-manager-dev
```

### Connecting with C++

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

### Installing the C# Client

```shell
dotnet add package Apache.Arrow.Adbc
```

### Connecting with C\#

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

stmt.SqlQuery = "SELECT version()";

QueryResult result = stmt.ExecuteQuery();
using IArrowArrayStream stream = result.Stream!;

while (await stream.ReadNextRecordBatchAsync() is { } batch)
{
    using (batch)
    {
        Console.WriteLine(((Apache.Arrow.StringArray)batch.Column(0)).GetString(0));
    }
}
```

{{< /tab >}}
{{< tab name="Go" >}}

### Installing the Go Client

```shell
go get github.com/apache/arrow-adbc/go/adbc
```

### Connecting with Go

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

### Installing the JavaScript Client

```shell
npm install @apache-arrow/adbc-driver-manager apache-arrow
```

### Connecting with JavaScript

```javascript
import { AdbcDatabase } from "@apache-arrow/adbc-driver-manager";

const db = new AdbcDatabase({
  driver: "postgresql",
  databaseOptions: {
    uri: "postgresql://<username>:<password>@localhost:5432/<dbname>",
  },
});

let conn, stmt;
try {
  conn = await db.connect();
  stmt = await conn.createStatement();
  await stmt.setSqlQuery("SELECT version()");
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

### Installing the Python Client

```shell
pip install adbc-driver-manager pyarrow
```

### Connecting with Python

```python
from adbc_driver_manager import dbapi

with (
    dbapi.connect(
        driver="postgresql",
        db_kwargs={
            "uri": "postgresql://<username>:<password>@localhost:5432/<dbname>",
        },
    ) as connection,
    connection.cursor() as cursor,
):
    cursor.execute("SELECT version()")
    table = cursor.fetch_arrow_table()

print(table)
```

{{< /tab >}}
{{< tab name="R" >}}

### Installing the R Client

```r
install.packages(c("adbcdrivermanager", "arrow", "tibble"))
```

### Connecting with R

```r
library(adbcdrivermanager)

drv <- adbc_driver("postgresql")

db <- adbc_database_init(
  drv,
  uri = "postgresql://<username>:<password>@localhost:5432/<dbname>"
)

con <- adbc_connection_init(db)

stmt <- adbc_statement_init(con)
adbc_statement_set_sql_query(stmt, "SELECT version()")

stream <- nanoarrow::nanoarrow_allocate_array_stream()
adbc_statement_execute_query(stmt, stream)
tibble::as_tibble(stream)
```

{{< /tab >}}
{{< tab name="Ruby" >}}

### Installing the Ruby Client

Install the native Arrow and ADBC GLib libraries, then the `red-adbc` gem.

On Debian or Ubuntu:

```shell
sudo apt install libarrow-glib-dev libadbc-glib-dev
gem install red-adbc
```

On macOS with Homebrew:

```shell
brew install apache-arrow-glib apache-arrow-adbc-glib
gem install red-adbc
```

### Connecting with Ruby

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

### Installing the Rust Client

```shell
cargo add adbc_core adbc_driver_manager
```

### Connecting with Rust

```rust
use adbc_core::options::{AdbcVersion, OptionDatabase};
use adbc_core::{Connection, Database, Driver, LOAD_FLAG_DEFAULT, Statement};
use adbc_driver_manager::ManagedDriver;

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
    statement.set_sql_query("SELECT version()").unwrap();
    let reader = statement.execute().unwrap();

    for batch in reader {
        println!("{:?}", batch.unwrap());
    }
}
```

{{< /tab >}}
{{< /tabs >}}

Query results are returned in [Apache Arrow](https://arrow.apache.org/) format.
