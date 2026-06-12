---
title: "C++ Client"
linkTitle: "C++"
weight: 10
---

CedarDB is compatible with the [PostgreSQL libpqxx](https://pqxx.org/development/libpqxx/) driver.

## Installing

Before demonstrating the connection to CedarDB, we need to get the correct dependencies.
libpqxx uses the libpq library internally.
On Debian or Ubuntu you can simply get the dev files from an apt repository.

```bash
sudo apt install libpqxx-dev
```

{{% callout type="warning" %}}
The `libpqxx-dev` package in Ubuntu 26.04 ships libpqxx 7.10, which [crashes on exit](https://github.com/jtv/libpqxx/issues/1195) due to a double-free in `pqxx::internal::demangle_type_name`. We recommend building libpqxx 8 from source instead:

```bash
sudo apt install cmake g++ libpq-dev
git clone --depth 1 --branch 8.0.1 https://github.com/jtv/libpqxx.git /tmp/libpqxx
cmake -S /tmp/libpqxx -B /tmp/libpqxx/build -DSKIP_BUILD_TEST=ON -DCMAKE_BUILD_TYPE=Release
cmake --build /tmp/libpqxx/build -j$(nproc)
sudo cmake --install /tmp/libpqxx/build
```

{{% /callout %}}

After finishing the client (see at the full program at the bottom of the program), we need to first compile our program with `g++` and then execute it.

```bash
g++ -std=c++23 main.cpp -lpqxx -lpq -o CedarDBClient
./CedarDBClient
```

## Connecting

Connect to CedarDB like this:

```cpp
// The connection string
auto connectionString = "dbname=<dbname> user=<username> password=<password> host=localhost port=5432";
try {
    // Establishing a connection
    pqxx::connection connection(connectionString);
    if (!connection.is_open()) {
        cerr << "Can't connect!" << endl;
        return 1;
    }
} catch (const std::exception& e) {
    cerr << e.what() << std::endl;
    return 1;
}
return 0;

```

You now have an open connection to CedarDB that allows you to insert data or query the database.

## Inserting Data

Let's create a new table storing the log of a public chat channel:

```cpp
// Create transaction
pqxx::work transaction(connection);

// Create table
auto createTable = "CREATE TABLE IF NOT EXISTS chatlog(userid integer, message text, ts timestamptz)"sv;
transaction.exec(createTable);
transaction.commit();
```

In the following, we first prepare a new insert statement, before we insert a new tuple using the `connection` instance:

```cpp
// Create transaction
pqxx::work transaction(connection);

// Insert data
connection.prepare("insert", "INSERT INTO chatlog VALUES ($1 , $2, $3)");
std::string_view message = "(☞ﾟ∀ﾟ)☞"sv;
auto id = 0;
auto time = std::chrono::system_clock::to_time_t(std::chrono::system_clock::now());
std::stringstream ss;
ss << std::put_time(std::localtime(&time), "%Y-%m-%d %X%z");
transaction.exec(pqxx::prepped{"insert"}, pqxx::params{id, message, ss.str()});
transaction.commit();
```

## Executing Queries

Let's read back all data we have inserted previously:

```cpp
// Create transaction
pqxx::work transaction(connection);

// Read data
auto readTable = "SELECT * FROM chatlog ORDER BY userid LIMIT 10"sv;
for (auto [id, message, time] : transaction.stream<int, string_view, string_view>(readTable)) {
    std::cout << id << "," << message << "," << time << "\n";
}
transaction.commit();
```

## Bulk Loading

If you need to load a lot of data at once (e.g., for an initial import of your existing data set), inserting tuples one by one is too slow:
jdbc has to do a full roundtrip to CedarDB and back for each single insert, making the whole loading process severely network latency bound, even on a local connection.

Use jdbc's bulk loading feature instead:

```cpp
// Create transaction
pqxx::work transaction(connection);

// Copy data
auto stream = pqxx::stream_to::table(transaction, {"chatlog"sv}, {"userid", "message", "ts"});
for (int i = 0; i < 100000; i++) {
    stream.write_values(i, "This is a message!", "2024-04-11 18:16:16.368000+00");
}
stream.complete();
transaction.commit();
```

This feature makes use of CedarDB's Postgres-compatible `COPY` mode to bulk transmit all data, leading to significantly higher throughput:

```text
LOG: 100000 rows (0.000012 s parsing, 0.000374 s compilation, 0.025395 s transmission, 0.016492 s execution)
```

## Source Code

{{% details title="Open to show the complete sample code" closed="true" %}}

```cpp
#include <chrono>
#include <iostream>
#include <pqxx/pqxx>

using namespace std::string_view_literals;

int main(int argc, char* argv[]) {
    auto connectionString = "dbname=<dbname> user=<username> password=<password> host=localhost port=5432";
    try {
        // Establishing a connection
        pqxx::connection connection(connectionString);
        if (!connection.is_open()) {
            std::cerr << "Can't connect!" << std::endl;
            return 1;
        }

        {
            // Create transaction
            pqxx::work transaction(connection);

            // Create table
            auto createTable = "CREATE TABLE IF NOT EXISTS chatlog(userid integer, message text, ts timestamptz)"sv;
            transaction.exec(createTable);
            transaction.commit();
        }
        {
            // Create transaction
            pqxx::work transaction(connection);

            // Insert data
            connection.prepare("insert", "INSERT INTO chatlog VALUES ($1 , $2, $3)");
            std::string_view message = "(☞ﾟ∀ﾟ)☞"sv;
            auto id = 0;
            auto time = std::chrono::system_clock::to_time_t(std::chrono::system_clock::now());
            std::stringstream ss;
            ss << std::put_time(std::localtime(&time), "%Y-%m-%d %X%z");
            transaction.exec(pqxx::prepped{"insert"}, pqxx::params{id, message, ss.str()});
            transaction.commit();
        }
        {
            // Create transaction
            pqxx::work transaction(connection);

            // Copy data
            auto stream = pqxx::stream_to::table(transaction, {"chatlog"sv}, {"userid", "message", "ts"});
            for (int i = 0; i < 100000; i++) {
                stream.write_values(i, "This is a message!", "2024-04-11 18:16:16.368000+00");
            }
            stream.complete();
            transaction.commit();
        }
        {
            // Create transaction
            pqxx::work transaction(connection);

            // Read data
            auto readTable = "SELECT * FROM chatlog ORDER BY userid LIMIT 10"sv;
            for (auto [id, message, time] : transaction.stream<int, std::string_view, std::string_view>(readTable)) {
                std::cout << id << "," << message << "," << time << "\n";
            }
            transaction.commit();
        }
    } catch (const std::exception& e) {
        std::cerr << e.what() << std::endl;
        return 1;
    }
    return 0;
}
```

{{% /details %}}
