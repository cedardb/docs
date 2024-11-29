---
title: "JavaScript Client"
linkTitle: "JavaScript"
weight: 10
---

You can use [node-postgres](https://node-postgres.com/) to connect to CedarDB.

## Installing

You can install the node-postgres library directly from [npm](https://www.npmjs.com/package/pg):

```shell
npm install pg
```

Now you can use node-postgres:

```js
import pg from 'pg'
const { Client } = pg
```

## Connecting

Connect to CedarDB like this:

```js
const client = new Client({host: 'localhost', user: '<username>', password: '<password>', database: '<dbname>'})
await client.connect()
```

## Inserting Data

You can insert entries using queries:

```js
await client.query('create table chatlog(userid integer, message text, ts timestamp)');
await client.query({text: 'insert into chatlog values ($1, $2, $3)', values: [0, 'hello', new Date()]});
```

You can now query the data contained in the table:

```js
console.log((await client.query('select * from chatlog')).rows)
```

## Batching

To efficiently execute many queries, you can batch the queries into one async transaction to avoid the repeated
round-trip latency.
Or insert a set of data:

```js
let promises = []
promises.push(client.query('begin'))
for (let i = 1; i < 100; i++) {
    const query = {name: 'do-insert', text: 'insert into chatlog values ($1, $2, $3)', values: [i, 'hello', new Date()]}
    promises.push(client.query(query));
}
promises.push(client.query('commit'))
await Promise.all(promises)
```

## Source Code

{{% details title="Open to show the complete sample code" closed="true" %}}

```js
'use strict';

// Install dependencies with:
// $ npm install pg
const { default: pg } = await import("pg");
const { Client } = pg;

// Connect to CedarDB
const client = new Client({host: 'localhost', user: 'postgres', database: 'postgres'});
await client.connect();

// Create a table and insert some data
await client.query('create table chatlog(userid integer, message text, ts timestamp)');
await client.query({text: 'insert into chatlog values ($1, $2, $3)', values: [0, 'hello', new Date()]});

// Execute a query
console.log(await client.query('select * from chatlog'))

// Insert many values asynchronously
let promises = []
promises.push(client.query('begin'))
for (let i = 1; i < 100; i++) {
    const query = {name: 'do-insert', text: 'insert into chatlog values ($1, $2, $3)', values: [i, 'hello', new Date()]}
    promises.push(client.query(query));
}
promises.push(client.query('commit'))
await Promise.all(promises)

// Read all values back again
console.log(await client.query('select * from chatlog'))

await client.end()
```

{{% /details %}}
