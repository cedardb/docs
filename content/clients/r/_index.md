---
title: "R Client"
linkTitle: "R"
weight: 10
---

You can use [RPostgres](https://rpostgres.r-dbi.org/) to connect to CedarDB.

## Installing

You can install the RPostgres library directly from
[CRAN](https://cran.r-project.org/web/packages/RPostgres/index.html):

```R
install.packages("RPostgres")
```

You can verify the installation by loading the library and viewing the included docs:

```R
library(RPostgres)
help(RPostgres)
```

## Connecting

Connect to CedarDB like this:

```R
con <- dbConnect(RPostgres::Postgres(), host="localhost", user="<username>", password="<password>", dbname="<dbname>")

# Close the connection on function exit
on.exit(dbDisconnect(con))
```

Now you have an open connection to CedarDB, and you can list the available tables:

```R
dbExecute(con, "create table chatlog(userid integer, message text, ts timestamp)")
dbListTables(con)
```

```
[1] "chatlog"
```

## Inserting Data

You can insert individual entries using raw queries:

```R
dbExecute(con, "insert into chatlog values ($1, $2, $3)", list(0, "hello", Sys.time()))
```

Or insert a set of data:

```R
chats <- data.frame(
  userid = c(1:10),
  message = rep("hello", 10),
  ts = rep(Sys.time(), 10)
)
dbExecute(con, "insert into chatlog values ($1, $2, $3)", list(chats$userid, chats$message, chats$ts))
```

## Bulk Operations

The previous methods insert rows one at a time, which can be slow for large data sets.
Bulk operation in `copy` mode can be much faster.

E.g., let's now insert some of R's included example data, `mtcars`:

```R
dbWriteTable(con, "mtcars", mtcars, copy = TRUE) # Use append=TRUE to insert if the table already exists
dbExistsTable(con, "mtcars")

# You can also read it back with bulk operations
dbReadTable(con, "mtcars")
```

## Executing Queries

Queries in RPostgres return a `data.frame`, which you can use with all the familiar R functionality:

```R
smallCars <- dbGetQuery(con, "select * from mtcars where wt < $1", 20)

# Use regular R functionality for the result data
ggplot(smallCars, aes(x=hp, y=mpg, color=factor(cyl), shape=factor(cyl))) +
  geom_point()
```

## Source Code

{{% details title="Open to show the complete sample code" closed="true" %}}

```R
#!/usr/bin/Rscript
# SPDX-License-Identifier: MIT-0

# Install dependencies with:
# install.packages(c("RPostgres", "ggplot2"))
library(RPostgres)
library(ggplot2)

# Connect to CedarDB
con <- dbConnect(RPostgres::Postgres(), host="localhost", user="<username>", password="<password>", dbname="<dbname>")
on.exit(dbDisconnect(con))

# Get all available tables
dbExecute(con, "create table chatlog(userid integer, message text, ts timestamp)")
dbListTables(con)

# Insert individual values
dbExecute(con, "insert into chatlog values ($1, $2, $3)", list(0, "hello", Sys.time()))

# Insert many values
chats <- data.frame(
  userid = c(1:10),
  message = rep("hello", 10),
  ts = rep(Sys.time(), 10)
)
dbExecute(con, "insert into chatlog values ($1,$2,$3)", list(chats$userid, chats$message, chats$ts))

# Bulk insert a whole table
dbWriteTable(con, "mtcars", mtcars, copy = TRUE)
dbExistsTable(con, "mtcars")

# And read it back with bulk operation
dbReadTable(con, "mtcars")

# Execute a query returning a data.frame
smallCars <- dbGetQuery(con, "select * from mtcars where wt < $1", 20)

# Use regular R functionality for the result data
ggplot(smallCars, aes(x=hp, y=mpg, color=factor(cyl), shape=factor(cyl))) +
  geom_point()
```

{{% /details %}}
