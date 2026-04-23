---
title: "Drizzle ORM"
linkTitle: "Drizzle"
weight: 10
---

[Drizzle ORM](https://orm.drizzle.team/) is a TypeScript-first ORM with a SQL-like query API and schema migration tooling.

{{< callout type="info" >}}
Drizzle support is currently **under active development**, already offering **full query API support**. 
However, certain advanced features are not yet available. Schema migrations (e.g. via `drizzle-kit push`) might not work as expected.
{{< /callout >}}

The [official getting-started tutorial](https://orm.drizzle.team/docs/get-started/postgresql-new) works out of the box with CedarDB:

## Setting up CedarDB

Start CedarDB in server mode and create a user and database:

```shell
./cedardb --createdb mydb
psql -h /tmp -U postgres
```

```sql
create user myuser with password 'mypassword' superuser;
create database mydb;
```

Then enable TCP connections:

```shell
./cedardb mydb --address=::
```

For more details, see the [install guide]({{< relref "/get_started/install_locally.md" >}}).

## Installing

Install Drizzle ORM, the `pg` driver, and the Drizzle Kit CLI:

```shell
npm install drizzle-orm pg dotenv
npm install --save-dev drizzle-kit tsx @types/pg
```

## Connecting

Create a `.env` file with your CedarDB connection string:

```shell {filename=".env"}
DATABASE_URL=postgresql://myuser:mypassword@localhost:5432/mydb
```

Initialize the Drizzle client in `src/index.ts`:

```typescript {filename="src/index.ts"}
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';

const db = drizzle(process.env.DATABASE_URL!);
```

## Defining a Schema

Create a schema file at `src/db/schema.ts`:

```typescript {filename="src/db/schema.ts"}
import { integer, pgTable, varchar } from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  age: integer().notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
});
```

Create a `drizzle.config.ts` in your project root:

```typescript {filename="drizzle.config.ts"}
import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

## Applying the Schema

Push the schema to CedarDB using Drizzle Kit:

```shell
npx drizzle-kit push
```

This creates the `users` table directly in CedarDB without generating migration files.

## Querying

The full range of Drizzle's query API works with CedarDB:

```typescript
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { and, avg, count, desc, eq, gt, like } from 'drizzle-orm';
import { usersTable } from './db/schema';

const db = drizzle(process.env.DATABASE_URL!);

// Insert a single row
await db.insert(usersTable).values({ name: 'Alice', age: 28, email: 'alice@example.com' });

// Batch insert with RETURNING
const inserted = await db
  .insert(usersTable)
  .values([
    { name: 'Bob',   age: 35, email: 'bob@example.com'   },
    { name: 'Carol', age: 22, email: 'carol@example.com' },
  ])
  .returning({ id: usersTable.id, name: usersTable.name });

// Filtered select
const result = await db
  .select()
  .from(usersTable)
  .where(and(gt(usersTable.age, 30), like(usersTable.name, '%o%')));

// Ordered select with LIMIT
const top2 = await db
  .select({ name: usersTable.name, age: usersTable.age })
  .from(usersTable)
  .orderBy(desc(usersTable.age))
  .limit(2);

// Aggregates
const [{ userCount }] = await db.select({ userCount: count() }).from(usersTable);
const [{ avgAge }]    = await db.select({ avgAge: avg(usersTable.age) }).from(usersTable);

// Update
await db.update(usersTable).set({ age: 36 }).where(eq(usersTable.email, 'bob@example.com'));

// Upsert
await db
  .insert(usersTable)
  .values({ name: 'Bob', age: 99, email: 'bob@example.com' })
  .onConflictDoUpdate({ target: usersTable.email, set: { age: 99 } });

// Transaction
await db.transaction(async (tx) => {
  const [user] = await tx
    .insert(usersTable)
    .values({ name: 'Dave', age: 40, email: 'dave@example.com' })
    .returning({ id: usersTable.id });
  await tx.update(usersTable).set({ age: 41 }).where(eq(usersTable.id, user.id));
});

// Delete
await db.delete(usersTable).where(eq(usersTable.email, 'alice@example.com'));
```

## Known Limitations

CedarDB's Drizzle support is actively being developed. The following are known limitations:

**Schema migrations** (`drizzle-kit push`) are not fully supported. While Drizzle can read an existing CedarDB schema and generate TypeScript definitions from it, it may sometimes not be able to automatically update the schema of an existing database.

**Raw DDL via `db.execute`** is available as a workaround for schema migrations:

```typescript
import { sql } from 'drizzle-orm';

await db.execute(sql`ALTER TABLE users ADD COLUMN phone text`);
await db.execute(sql`ALTER TABLE users DROP COLUMN phone`);
```
