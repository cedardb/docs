---
title: "JavaScript"
linkTitle: "JavaScript"
weight: 10
---

CedarDB is compatible with [node-postgres](https://node-postgres.com/) (`pg`), the most widely used PostgreSQL client
for Node.js.

## Installing

```shell
npm install pg
```

For TypeScript projects, also add the type definitions:

```shell
npm install --save-dev @types/pg
```

## TypeScript

### Connecting

```typescript
import { Pool } from 'pg';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: '<dbname>',
  user: '<username>',
  password: '<password>',
});
```

Use a `Pool` rather than a single `Client` so that connections are reused across requests.

### Inserting data

```typescript
await pool.query(`
  CREATE TABLE IF NOT EXISTS trees (
    id      integer PRIMARY KEY,
    species text    NOT NULL,
    height  numeric NOT NULL
  )
`);

await pool.query(
  'INSERT INTO trees VALUES ($1, $2, $3)',
  [1, 'Oak', 12.4]
);
```

Use parameterized queries (`$1`, `$2`, …) for all user-supplied values — never interpolate values directly into query strings.

### Executing queries

```typescript
const result = await pool.query('SELECT species, height FROM trees WHERE height > $1', [10]);

for (const row of result.rows) {
  console.log(`${row.species}: ${row.height} m`);
}
```

`result.rows` is an array of plain objects, keyed by column name.

### Bulk loading

For large imports, use `COPY FROM STDIN` via the
[pg-copy-streams](https://github.com/brianc/pg-copy-streams) package:

```shell
npm install pg-copy-streams
```

```typescript
import { from as copyFrom } from 'pg-copy-streams';
import { Readable } from 'stream';

const client = await pool.connect();
try {
  const stream = client.query(copyFrom('COPY trees (id, species, height) FROM STDIN CSV'));
  const data = '2,Beech,18.1\n3,Pine,22.7\n4,Birch,9.3\n';
  await Readable.from([data]).pipe(stream);
} finally {
  client.release();
}
```

This uses CedarDB's `COPY` protocol and is significantly faster than individual `INSERT` statements for bulk data.

### ORMs

If you prefer a higher-level interface, CedarDB works with two TypeScript ORMs:

- [Drizzle](drizzle) — SQL-like query builder with schema migration tooling
- [Prisma](prisma) — declarative schema with auto-generated type-safe client

## JavaScript

### Connecting

```js
import pg from 'pg'
const { Client } = pg

const client = new Client({host: 'localhost', user: '<username>', password: '<password>', database: '<dbname>'})
await client.connect()
```

### Inserting data

```js
await client.query('create table chatlog(userid integer, message text, ts timestamp)');
await client.query({text: 'insert into chatlog values ($1, $2, $3)', values: [0, 'hello', new Date()]});
```

You can now query the data contained in the table:

```js
console.log((await client.query('select * from chatlog')).rows)
```

### Batching

To efficiently execute many queries, batch them into one async transaction to avoid repeated round-trip latency:

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

### Source code

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
