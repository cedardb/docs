---
title: "JavaScript"
linkTitle: "JavaScript"
weight: 10
---

CedarDB is compatible with [node-postgres](https://node-postgres.com/) (`pg`), the most widely used PostgreSQL client
for Node.js and TypeScript.

## Installing

```shell
npm install pg
```

For TypeScript projects, add the type definitions:

```shell
npm install --save-dev @types/pg
```

## Connecting

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

## Inserting data

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

## Executing queries

```typescript
const result = await pool.query('SELECT species, height FROM trees WHERE height > $1', [10]);

for (const row of result.rows) {
  console.log(`${row.species}: ${row.height} m`);
}
```

`result.rows` is an array of plain objects, keyed by column name.

## Bulk loading

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

## ORMs

If you prefer a higher-level interface, CedarDB works with two TypeScript ORMs:

- [Drizzle](drizzle) — SQL-like query builder with schema migration tooling
- [Prisma](prisma) — declarative schema with auto-generated type-safe client
