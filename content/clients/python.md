---
title: "Python"
linkTitle: "Python"
weight: 30
---

CedarDB is compatible with [psycopg](https://www.psycopg.org/), Python's most popular PostgreSQL adapter.

{{< callout type="info" >}}
CedarDB supports the older, but still very common `psycopg2`, as well as the newer `psycopg3`, confusingly called just `psycopg` (without version number).
This article is about the newer `psycopg`(3).
{{< /callout >}}


## Connecting
Connect to CedarDB like this:

```python
connstr = "host=localhost port=5432 dbname=<dbname> user=<username> password=<password>"
with psycopg.connect(connstr) as conn:
    # Your code using your new connection goes here
```
You now have an open connection to CedarDB that allows you to insert data or query the database.

## Inserting Data
Let's use psycopg's `cursor` abstraction to create a new table storing the log of a public chat channel:

```python
with psycopg.connect(connstr) as conn:
    with conn.cursor() as cur:
        cur.execute("""CREATE TABLE IF NOT EXISTS chatlog(
        userid integer, 
        message text, 
        ts timestamp)""")

        conn.commit()
```

After creating our table, we can now insert some data:

```python
with psycopg.connect(connstr) as conn:
    with conn.cursor() as cur:
        cur.execute(
            "INSERT INTO chatlog VALUES (%s, %s, %s)", (7, "(☞ﾟ∀ﾟ)☞", datetime.datetime.now())
        )
        conn.commit()

        # Or, use named parameters
        cur.execute(
            "INSERT INTO chatlog VALUES (%(id)s, %(msg)s, %(ts)s)",
            {'id': 42, 'msg': "(╯°□°)╯︵ ┻━┻", 'ts': datetime.datetime.now()}
        )
        conn.commit()
```

{{< callout type="info" >}}
Be careful: To make sure that data is persisted, you
- have to explicitly call the commit method of your connection object (like we did above) **or**
- let the connection object go out of scope without encountering an exception **or**
- explictly enable autocommit for your connection (`autocommit=True`).

If you don't do anything of the above, your transaction will be rolled back and all data you thought you did insert will be discarded.
{{< /callout >}}

## Executing Queries

Let's query the data we just inserted. We can retrieve multiple records by iterating over our cursor:

```python
with psycopg.connect(connstr) as conn:
    with conn.cursor() as cur:
        cur.execute(
            "SELECT ts, userid, message FROM chatlog"
        )

        chatline = "[{ts}]: User {usr} wrote message \"{msg}\""
        for record in cur:
            print(chatline.format(ts=record[0], usr=record[1], msg=record[2]))
```

You can also use your own data classes and row factories to construct your own objects for a much cleaner interface:

```python
from dataclasses import dataclass
from psycopg.rows import class_row

@dataclass
class Chatline:
    ts: datetime
    userid: int
    message: str


with psycopg.connect(connstr) as conn:
    with conn.cursor() as cur:        
        cur = conn.cursor(row_factory=class_row(Chatline))
        user42hist = cur.execute("select * from chatlog where userid = 42").fetchall()
        for chatline in user42hist:
            print(chatline)
```

```python
Chatline(ts=datetime.datetime(2024, 4, 8, 11, 47, 46, 135798, tzinfo=zoneinfo.ZoneInfo(key='Europe/Berlin')), userid=42, message='(╯°□°)╯︵ ┻━┻')
```

## Bulk Loading
If you need to load a lot of data at once (e.g., for an initial import of your existing data set), inserting tuples one by one is too slow:
psycopg has to do a full roundtrip to CedarDB and back for each single insert, making the whole loading process severely network latency bound, even on a local connection.

Use psycopg's `COPY TO` construct instead:

```python
with psycopg.connect(connstr) as conn:
    with conn.cursor() as cur:
        ts = datetime.datetime.now()
        with cur.copy("COPY chatlog (ts, userid, message) FROM STDIN") as copy:
            for i in range(0, 1000000):
                copy.write_row((ts + datetime.timedelta(seconds=i), i, "Hello!"))
        conn.commit()
```
This feature makes use of CedarDB's Postgres-compatible `COPY` mode to bulk transmit all data, leading to significantly higher throughput:

```
LOG:     1000000 rows (0.000013 s parsing, 0.000310 s compilation, 3.967416 s transmission, 0.023089 s execution)

```


For a moderate performance gain, you can also copy data formatted as raw binary stream. Just append `(FORMAT BINARY)` to the `COPY` statement and specify the data types:
```python
with cur.copy("COPY chatlog (ts, userid, message) FROM STDIN (FORMAT BINARY)") as copy:
    copy.set_types(["timestamp","int4","text"])
    for i in range(0, 1000000):
        copy.write_row((ts + datetime.timedelta(seconds=i), i, "Hello!"))
conn.commit()
```

```
LOG:     1000000 rows (0.000016 s parsing, 0.000344 s compilation, 3.677765 s transmission, 0.063557 s execution)
```

Please familiarize yourself with the limits of psycopg's binary copy support in the [official docs](https://www.psycopg.org/psycopg3/docs/basic/copy.html).


{{< callout type="info" >}}
`execute()` and `executeMany()` automatically *prepare* statements that are executed multiple times in sequence.
You can also override this setting by passing `prepare=True|False` to both methods. 
Take a look [here](../../references/advanced/prepare), why preparing your statements is a *very good thing*.
{{< /callout >}}

## Pipelining

Psycopg **version 3** and CedarDB support PostgreSQL's [*pipeline mode*](https://www.psycopg.org/psycopg3/docs/advanced/pipeline.html). In this mode, the client does not wait for a server response before the next query is sent.
Instead, client and server agree to batch responses and flush them at explicit synchronization points.
This approach significantly increases throughput.

The easiest ways to make use of pipeline mode is with the  `executemany()` method:

```python
# Let's create some data
ts = datetime.datetime.now()
new_messages = [(ts, 1, "Hello, I'm user 1")]
for i in range(0, 1000000):
    new_messages.append((ts + datetime.timedelta(seconds=i), i, "Hello, user 1"))


with psycopg.connect(connstr) as conn:
    with conn.cursor() as cur:
        cur.executemany("INSERT INTO chatlog(ts,userid,message) VALUES (%s, %s, %s)", new_messages)
        conn.commit() # throughput: ~6250 inserts/second
```

In comparison, the naive approach is quite slow:

```python
with psycopg.connect(connstr) as conn:
    with conn.cursor() as cur:
        for i in range(0,1000000): # don't do this!
            cur.execute("INSERT INTO chatlog(ts,userid,message) VALUES (%s, %s, %s)", new_messages[i]) 
            # throughput: ~4500 inserts/second
        conn.commit()
```

## Source Code

{{% details title="Open to show the complete sample code" closed="true" %}}

```python
import psycopg
import datetime
from dataclasses import dataclass
from psycopg.rows import class_row


@dataclass
class Chatline:
    ts: datetime
    userid: int
    message: str


if __name__ == '__main__':
    connstr = "host=localhost port=5432 dbname=<dbname> user=<username> password=<password>"
    with psycopg.connect(connstr) as conn:
        with conn.cursor() as cur:
            cur.execute("""CREATE TABLE IF NOT EXISTS chatlog(
            userid integer, 
            message text, 
            ts timestamp)""")

            conn.commit()

            cur.execute(
                "INSERT INTO chatlog VALUES (%s, %s, %s)", (7, "(☞ﾟ∀ﾟ)☞", datetime.datetime.now())
            )
            conn.commit()

            # Or, use named parameters
            cur.execute(
                "INSERT INTO chatlog VALUES (%(id)s, %(msg)s, %(ts)s)",
                {'id': 42, 'msg': "(╯°□°)╯︵ ┻━┻", 'ts': datetime.datetime.now()}
            )
            conn.commit()

            # Querying
            cur.execute(
                "SELECT ts, userid, message FROM chatlog"
            )

            chatline = "[{ts}]: User {usr} wrote message \"{msg}\""
            for record in cur:
                print(chatline.format(ts=record[0], usr=record[1], msg=record[2]))

        # Querying using a custom row factory
        with conn.cursor(row_factory=class_row(Chatline)) as cur:
            user42hist = cur.execute("select * from chatlog where userid = 42").fetchall()
            for chatline in user42hist:
                print(chatline)

        # Let's create some messages
        ts = datetime.datetime.now()
        new_messages = [(ts, 1, "Hello, I'm user 1")]
        for i in range(0, 1000000):
            new_messages.append((ts + datetime.timedelta(seconds=i), i, "Hello, user 1"))

        with conn.cursor() as cur:

            # Text bulk loading
            #with cur.copy("COPY chatlog (ts, userid, message) FROM STDIN") as copy:
            #    for i in range(0, 1000000):
            #        copy.write_row((ts + datetime.timedelta(seconds=i), i, "Hello!"))
            #conn.commit()

            # Binary bulk loading
            with cur.copy("COPY chatlog (ts, userid, message) FROM STDIN (FORMAT BINARY)") as copy:
                copy.set_types(["timestamp", "int4", "text"])
                for i in range(0, 1000000):
                    copy.write_row((ts + datetime.timedelta(seconds=i), i, "Hello!"))
            conn.commit()

            # Transactions with pipelining
            cur.executemany("INSERT INTO chatlog(ts,userid,message) VALUES (%s, %s, %s)", new_messages)
            conn.commit()
```

{{% /details %}}
