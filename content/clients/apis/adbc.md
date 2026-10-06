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

## Connecting and Querying

The examples below load the [2015 NYC Street Tree Census](https://data.cityofnewyork.us/Environment/2015-Street-Tree-Census-Tree-Data/uvpi-gqnh) into a `trees` table with ADBC bulk ingestion and then query the three cedars with the thickest trunks.
Download the dataset (~220 MB) into your project directory:

```shell
curl -L -o trees.csv "https://data.cityofnewyork.us/api/views/uvpi-gqnh/rows.csv?accessType=DOWNLOAD"
```

Then pick your preferred language to install the ADBC client library and run the example:

{{< tabs >}}
{{< tab name="C++" >}}

### Installing the C++ Client

Install the Arrow C++ and ADBC libraries with your system package manager.

On Debian or Ubuntu:

```shell
sudo apt install libarrow-dev libadbc-driver-manager-dev
```

### Connecting and Querying with C++

```cpp
#include <cstdlib>
#include <iostream>

#include <arrow-adbc/adbc.h>
#include <arrow-adbc/adbc_driver_manager.h>
#include <arrow/api.h>
#include <arrow/c/bridge.h>
#include <arrow/csv/api.h>
#include <arrow/io/api.h>

void Check(AdbcStatusCode status, AdbcError* error) {
  if (status != ADBC_STATUS_OK) {
    std::cerr << error->message << std::endl;
    std::exit(EXIT_FAILURE);
  }
}

int main() {
  // Read trees.csv into Arrow
  auto input = arrow::io::ReadableFile::Open("trees.csv").ValueOrDie();
  auto trees = arrow::csv::TableReader::Make(arrow::io::default_io_context(), input,
                                             arrow::csv::ReadOptions::Defaults(),
                                             arrow::csv::ParseOptions::Defaults(),
                                             arrow::csv::ConvertOptions::Defaults())
                   .ValueOrDie()
                   ->Read()
                   .ValueOrDie();

  // Connect to CedarDB
  AdbcError error = {};

  AdbcDatabase database = {};
  Check(AdbcDatabaseNew(&database, &error), &error);
  Check(AdbcDatabaseSetOption(&database, "driver", "postgresql", &error), &error);
  Check(AdbcDatabaseSetOption(&database, "uri",
                              "postgresql://<username>:<password>@localhost:5432/<dbname>", &error),
        &error);
  Check(AdbcDriverManagerDatabaseSetLoadFlags(&database, ADBC_LOAD_FLAG_DEFAULT, &error), &error);
  Check(AdbcDatabaseInit(&database, &error), &error);

  AdbcConnection connection = {};
  Check(AdbcConnectionNew(&connection, &error), &error);
  Check(AdbcConnectionInit(&connection, &database, &error), &error);

  AdbcStatement statement = {};
  Check(AdbcStatementNew(&connection, &statement, &error), &error);

  // Create the trees table and bulk load the data
  struct ArrowArrayStream stream = {};
  arrow::ExportRecordBatchReader(std::make_shared<arrow::TableBatchReader>(trees), &stream).ok();
  Check(AdbcStatementSetOption(&statement, ADBC_INGEST_OPTION_TARGET_TABLE, "trees", &error),
        &error);
  Check(AdbcStatementSetOption(&statement, ADBC_INGEST_OPTION_MODE,
                               ADBC_INGEST_OPTION_MODE_REPLACE, &error),
        &error);
  Check(AdbcStatementBindStream(&statement, &stream, &error), &error);
  Check(AdbcStatementExecuteQuery(&statement, nullptr, nullptr, &error), &error);

  // Run the query
  Check(AdbcStatementSetSqlQuery(&statement,
                                 "SELECT tree_id, spc_common, tree_dbh, address, borough FROM trees "
                                 "WHERE spc_common ILIKE '%cedar%' ORDER BY tree_dbh DESC LIMIT 3",
                                 &error),
        &error);
  Check(AdbcStatementExecuteQuery(&statement, &stream, nullptr, &error), &error);

  // Fetch and print the results
  auto reader = arrow::ImportRecordBatchReader(&stream).ValueOrDie();
  std::cout << reader->ToTable().ValueOrDie()->ToString() << std::endl;

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

### Connecting and Querying with C\#

```csharp
using Apache.Arrow;
using Apache.Arrow.Adbc;
using Apache.Arrow.Adbc.DriverManager;
using Apache.Arrow.Ipc;
using Microsoft.VisualBasic.FileIO;

// Read trees.csv into Arrow
// (.NET has no CSV reader that infers types, so read only the queried columns)
Int64Array.Builder treeId = new();
StringArray.Builder species = new();
Int32Array.Builder trunkDiameter = new();
StringArray.Builder address = new();
StringArray.Builder borough = new();

using (TextFieldParser csv = new("trees.csv"))
{
    csv.SetDelimiters(",");
    string[] header = csv.ReadFields()!;
    int Column(string name) => System.Array.IndexOf(header, name);
    (int id, int spc, int dbh, int addr, int boro) =
        (Column("tree_id"), Column("spc_common"), Column("tree_dbh"), Column("address"), Column("borough"));

    while (csv.ReadFields() is { } row)
    {
        treeId.Append(long.Parse(row[id]));
        species.Append(row[spc]);
        trunkDiameter.Append(int.Parse(row[dbh]));
        address.Append(row[addr]);
        borough.Append(row[boro]);
    }
}

RecordBatch trees = new RecordBatch.Builder()
    .Append("tree_id", false, treeId.Build())
    .Append("spc_common", true, species.Build())
    .Append("tree_dbh", false, trunkDiameter.Build())
    .Append("address", true, address.Build())
    .Append("borough", true, borough.Build())
    .Build();

// Connect to CedarDB
using AdbcDriver driver = AdbcDriverManager.FindLoadDriver(
    "postgresql",
    loadOptions: AdbcLoadFlags.Default);

using AdbcDatabase db = driver.Open(new Dictionary<string, string>
{
    ["uri"] = "postgresql://<username>:<password>@localhost:5432/<dbname>",
});

using AdbcConnection conn = db.Connect(null);

// Create the trees table and bulk load the data
using (AdbcStatement ingest = conn.CreateStatement())
{
    ingest.SetOption("adbc.ingest.target_table", "trees");
    ingest.SetOption("adbc.ingest.mode", "adbc.ingest.mode.replace");
    ingest.Bind(trees, trees.Schema);
    ingest.ExecuteUpdate();
}

// Run the query
using AdbcStatement stmt = conn.CreateStatement();
stmt.SqlQuery =
    "SELECT tree_id, spc_common, tree_dbh, address, borough FROM trees " +
    "WHERE spc_common ILIKE '%cedar%' ORDER BY tree_dbh DESC LIMIT 3";

QueryResult result = stmt.ExecuteQuery();
using IArrowArrayStream stream = result.Stream!;

// Fetch and print the results
while (await stream.ReadNextRecordBatchAsync() is { } batch)
{
    using (batch)
    {
        var ids = (Int64Array)batch.Column("tree_id");
        var names = (StringArray)batch.Column("spc_common");
        var diameters = (Int32Array)batch.Column("tree_dbh");
        var addresses = (StringArray)batch.Column("address");
        var boroughs = (StringArray)batch.Column("borough");
        for (int i = 0; i < batch.Length; i++)
        {
            Console.WriteLine($"{ids.GetValue(i)}  {names.GetString(i)}  {diameters.GetValue(i)} in  " +
                              $"{addresses.GetString(i)}, {boroughs.GetString(i)}");
        }
    }
}
```

{{< /tab >}}
{{< tab name="Go" >}}

### Installing the Go Client

```shell
go get github.com/apache/arrow-adbc/go/adbc github.com/apache/arrow-go/v18
```

### Connecting and Querying with Go

```go
package main

import (
    "context"
    "fmt"
    "log"
    "os"

    "github.com/apache/arrow-adbc/go/adbc"
    "github.com/apache/arrow-adbc/go/adbc/drivermgr"
    "github.com/apache/arrow-go/v18/arrow"
    "github.com/apache/arrow-go/v18/arrow/array"
    "github.com/apache/arrow-go/v18/arrow/csv"
)

func main() {
    ctx := context.Background()

    // Read trees.csv into Arrow
    file, err := os.Open("trees.csv")
    if err != nil {
        log.Fatal(err)
    }
    defer file.Close()

    csvReader := csv.NewInferringReader(file,
        csv.WithHeader(true), csv.WithChunk(65536), csv.WithNullReader(true, ""))
    defer csvReader.Release()

    var batches []arrow.RecordBatch
    for csvReader.Next() {
        batch := csvReader.RecordBatch()
        batch.Retain()
        batches = append(batches, batch)
    }
    if err := csvReader.Err(); err != nil {
        log.Fatal(err)
    }
    trees, err := array.NewRecordReader(csvReader.Schema(), batches)
    if err != nil {
        log.Fatal(err)
    }
    defer trees.Release()

    // Connect to CedarDB
    var drv drivermgr.Driver

    db, err := drv.NewDatabase(map[string]string{
        "driver": "postgresql",
        "uri":    "postgresql://<username>:<password>@localhost:5432/<dbname>",
    })
    if err != nil {
        log.Fatal(err)
    }
    defer db.Close()

    conn, err := db.Open(ctx)
    if err != nil {
        log.Fatal(err)
    }
    defer conn.Close()

    // Create the trees table and bulk load the data
    ingest, err := conn.NewStatement()
    if err != nil {
        log.Fatal(err)
    }
    defer ingest.Close()

    if err := ingest.SetOption(adbc.OptionKeyIngestTargetTable, "trees"); err != nil {
        log.Fatal(err)
    }
    if err := ingest.SetOption(adbc.OptionKeyIngestMode, adbc.OptionValueIngestModeReplace); err != nil {
        log.Fatal(err)
    }
    if err := ingest.BindStream(ctx, trees); err != nil {
        log.Fatal(err)
    }
    if _, err := ingest.ExecuteUpdate(ctx); err != nil {
        log.Fatal(err)
    }

    // Run the query
    stmt, err := conn.NewStatement()
    if err != nil {
        log.Fatal(err)
    }
    defer stmt.Close()

    err = stmt.SetSqlQuery("SELECT tree_id, spc_common, tree_dbh, address, borough FROM trees " +
        "WHERE spc_common ILIKE '%cedar%' ORDER BY tree_dbh DESC LIMIT 3")
    if err != nil {
        log.Fatal(err)
    }

    stream, _, err := stmt.ExecuteQuery(ctx)
    if err != nil {
        log.Fatal(err)
    }
    defer stream.Release()

    // Fetch and print the results
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
npm install @apache-arrow/adbc-driver-manager apache-arrow csv-parse
```

### Connecting and Querying with JavaScript

```javascript
import { AdbcDatabase, IngestMode } from "@apache-arrow/adbc-driver-manager";
import { tableFromJSON } from "apache-arrow";
import { readFileSync } from "node:fs";
import { parse } from "csv-parse/sync";

// Read trees.csv into Arrow
const trees = tableFromJSON(
  parse(readFileSync("trees.csv"), { columns: true, cast: true }),
);

// Connect to CedarDB
const db = new AdbcDatabase({
  driver: "postgresql",
  databaseOptions: {
    uri: "postgresql://<username>:<password>@localhost:5432/<dbname>",
  },
});

let conn;
try {
  conn = await db.connect();
  // Create the trees table and bulk load the data
  await conn.ingest("trees", trees, { mode: IngestMode.Replace });

  // Run the query and fetch the results
  const table = await conn.query(
    "SELECT tree_id, spc_common, tree_dbh, address, borough FROM trees " +
      "WHERE spc_common ILIKE '%cedar%' ORDER BY tree_dbh DESC LIMIT 3",
  );

  // Print the results
  console.table(table.toArray());
} finally {
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

### Connecting and Querying with Python

```python
import pyarrow.csv
from adbc_driver_manager import dbapi

# Read trees.csv into Arrow
trees = pyarrow.csv.read_csv("trees.csv")

# Connect to CedarDB
with (
    dbapi.connect(
        driver="postgresql",
        db_kwargs={
            "uri": "postgresql://<username>:<password>@localhost:5432/<dbname>",
        },
    ) as connection,
    connection.cursor() as cursor,
):
    # Create the trees table and bulk load the data
    cursor.adbc_ingest("trees", trees, mode="replace")
    connection.commit()

    # Run the query
    cursor.execute(
        "SELECT tree_id, spc_common, tree_dbh, address, borough FROM trees "
        "WHERE spc_common ILIKE '%cedar%' ORDER BY tree_dbh DESC LIMIT 3"
    )

    # Fetch and print the results
    print(cursor.fetch_arrow_table())
```

{{< /tab >}}
{{< tab name="R" >}}

### Installing the R Client

```r
install.packages(c("adbcdrivermanager", "arrow", "tibble"))
```

### Connecting and Querying with R

```r
library(adbcdrivermanager)

# Read trees.csv into Arrow
trees <- arrow::read_csv_arrow("trees.csv", as_data_frame = FALSE)

# Connect to CedarDB
db <- adbc_database_init(
  adbc_driver("postgresql"),
  uri = "postgresql://<username>:<password>@localhost:5432/<dbname>"
)
con <- adbc_connection_init(db)

# Create the trees table and bulk load the data
write_adbc(trees, con, "trees", mode = "replace")

# Run the query and fetch the results
result <- read_adbc(
  con,
  "SELECT tree_id, spc_common, tree_dbh, address, borough FROM trees
   WHERE spc_common ILIKE '%cedar%' ORDER BY tree_dbh DESC LIMIT 3"
)

# Print the results
print(tibble::as_tibble(result))
```

{{< /tab >}}
{{< tab name="Ruby" >}}

### Installing the Ruby Client

Install the native Arrow and ADBC GLib libraries, then the `red-adbc` gem.

On Debian or Ubuntu, add the [Apache Arrow APT repository](https://arrow.apache.org/install/) first:

```shell
sudo apt install libarrow-glib-dev libadbc-glib-dev
gem install red-adbc
```

On macOS with Homebrew:

```shell
brew install apache-arrow-glib apache-arrow-adbc-glib
gem install red-adbc
```

{{< callout type="info" >}}
If `gem install` reports that Apache Arrow C++ isn't found, install the `red-arrow` version that matches your Arrow C++ version (`pkg-config --modversion arrow`), for example `gem install red-arrow -v "~> 24.0"`.
{{< /callout >}}

### Connecting and Querying with Ruby

```ruby
require "adbc"

# Read trees.csv into Arrow
trees = Arrow::Table.load("trees.csv")

# Connect to CedarDB
database = ADBC::Database.new

begin
  database.set_option("driver", "postgresql")
  database.set_option("uri", "postgresql://<username>:<password>@localhost:5432/<dbname>")
  database.set_load_flags(ADBC::LoadFlags::DEFAULT)
  database.init

  database.connect do |connection|
    # Create the trees table and bulk load the data
    connection.open_statement do |statement|
      statement.ingest_target_table = "trees"
      statement.set_option("adbc.ingest.mode", "adbc.ingest.mode.replace")
      statement.bind(trees) do
        statement.execute(need_result: false)
      end
    end

    # Run the query and fetch the results
    connection.open_statement do |statement|
      statement.sql_query = <<~SQL
        SELECT tree_id, spc_common, tree_dbh, address, borough FROM trees
        WHERE spc_common ILIKE '%cedar%' ORDER BY tree_dbh DESC LIMIT 3
      SQL
      table, = statement.execute

      # Print the results
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
cargo add arrow --features prettyprint
```

{{< callout type="info" >}}
`arrow` must be a version that `adbc_core` supports.
If the build reports two versions of `arrow_array`, add the version shown by `cargo tree -p adbc_core`, for example `cargo add arrow@59 --features prettyprint`.
{{< /callout >}}

### Connecting and Querying with Rust

```rust
use std::fs::File;
use std::io::Seek;
use std::sync::Arc;

use adbc_core::options::{AdbcVersion, IngestMode, OptionDatabase, OptionStatement};
use adbc_core::{Connection, Database, Driver, LOAD_FLAG_DEFAULT, Optionable, Statement};
use adbc_driver_manager::ManagedDriver;
use arrow::csv::{ReaderBuilder, reader::Format};
use arrow::record_batch::RecordBatch;
use arrow::util::pretty::print_batches;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Read trees.csv into Arrow
    let mut file = File::open("trees.csv")?;
    let (schema, _) = Format::default().with_header(true).infer_schema(&mut file, None)?;
    file.rewind()?;
    let trees = ReaderBuilder::new(Arc::new(schema)).with_header(true).build(file)?;

    // Connect to CedarDB
    let mut driver = ManagedDriver::load_from_name(
        "postgresql",
        None,
        AdbcVersion::default(),
        LOAD_FLAG_DEFAULT,
        None,
    )?;
    let opts = [(
        OptionDatabase::Uri,
        "postgresql://<username>:<password>@localhost:5432/<dbname>".into(),
    )];
    let db = driver.new_database_with_opts(opts)?;
    let mut conn = db.new_connection()?;

    // Create the trees table and bulk load the data
    let mut ingest = conn.new_statement()?;
    ingest.set_option(OptionStatement::TargetTable, "trees".into())?;
    ingest.set_option(OptionStatement::IngestMode, IngestMode::Replace.into())?;
    ingest.bind_stream(Box::new(trees))?;
    ingest.execute_update()?;

    // Run the query
    let mut query = conn.new_statement()?;
    query.set_sql_query(
        "SELECT tree_id, spc_common, tree_dbh, address, borough FROM trees \
         WHERE spc_common ILIKE '%cedar%' ORDER BY tree_dbh DESC LIMIT 3",
    )?;
    let results = query.execute()?;

    // Fetch and print the results
    let batches = results.collect::<Result<Vec<RecordBatch>, _>>()?;
    print_batches(&batches)?;
    Ok(())
}
```

{{< /tab >}}
{{< /tabs >}}

Query results are returned in [Apache Arrow](https://arrow.apache.org/) format.
