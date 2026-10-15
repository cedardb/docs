---
title: "Drizzle ORM"
linkTitle: "Drizzle"
weight: 10
---

[Drizzle ORM](https://orm.drizzle.team/) is a TypeScript ORM with a SQL-like query API and the schema migration tool
Drizzle Kit.
CedarDB works with Drizzle's PostgreSQL dialect and the `node-postgres` (`pg`) driver, so you can define your schema,
manage it with migrations, and query it like a PostgreSQL database.
Create and change the schema with `drizzle-kit generate` and `drizzle-kit migrate`.

This page was tested with `drizzle-orm` 0.45.4, `drizzle-kit` 0.31.11, `pg` 8.23.1, and CedarDB v2026-10-08.

This page is a self-contained example that you can follow from start to finish.
It points out what is specific to CedarDB.
For all features, see Drizzle's documentation of
[schemas](https://orm.drizzle.team/docs/sql-schema-declaration),
[migrations](https://orm.drizzle.team/docs/migrations), and
[queries](https://orm.drizzle.team/docs/select).

## Prerequisites

* Node.js 20 or later.
* A running CedarDB server that accepts TCP connections (see [Install CedarDB locally](/docs/get_started/install_locally/)).
* A CedarDB superuser to create the application role and database.

## Set up CedarDB

Connect to CedarDB as a superuser and create a role for your application that owns its database:

```sql
CREATE ROLE myuser WITH LOGIN PASSWORD 'CorrectHorseBatteryStaple';
CREATE DATABASE mydb OWNER myuser;
```

As the database owner, Drizzle can create schemas, tables, and types without further privileges.
This works in every CedarDB edition.
Granting privileges with `GRANT` instead requires a CedarDB [enterprise license](/docs/licensing/).

## Set up the project

{{% steps %}}

### Install Drizzle

Create a project and install Drizzle ORM, the `pg` driver, and Drizzle Kit:

```shell
mkdir hello-drizzle && cd hello-drizzle
npm init -y
npm install drizzle-orm pg dotenv
npm install --save-dev drizzle-kit tsx @types/pg
```

### Configure the connection

Create a `.env` file with your CedarDB connection string:

```shell {filename=".env"}
DATABASE_URL=postgresql://myuser:CorrectHorseBatteryStaple@localhost:5432/mydb
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

### Define the schema

Create a schema file at `src/db/schema.ts`:

```typescript {filename="src/db/schema.ts"}
import { boolean, index, integer, pgEnum, pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('role', ['admin', 'member']);

export const usersTable = pgTable('users', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: varchar({ length: 255 }).notNull(),
  age: integer().notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
  role: roleEnum().default('member').notNull(),
});

export const postsTable = pgTable('posts', {
  id: serial().primaryKey(),
  title: text().notNull(),
  published: boolean().default(false).notNull(),
  createdAt: timestamp().defaultNow().notNull(),
  authorId: integer().notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
}, (t) => [index('posts_author_idx').on(t.authorId)]);
```

{{% /steps %}}

## Create and change the schema

Drizzle Kit compares your schema file with its own snapshots in the `drizzle` folder and writes the difference as a
SQL migration.
It does not read the CedarDB schema for this, so it works with CedarDB like with PostgreSQL.

{{% steps %}}

### Generate the first migration

```shell
npx drizzle-kit generate
```

Drizzle Kit writes the migration to a file such as `drizzle/0000_jazzy_bromley.sql`.
Review the SQL and commit it together with your schema.

### Apply the migration

```shell
npx drizzle-kit migrate
```

Drizzle Kit runs all migrations that are not applied yet and records them in the table
`drizzle.__drizzle_migrations`.

### Change the schema

Edit `src/db/schema.ts`, for example add a column to `users` and remove one from `posts`:

```typescript {filename="src/db/schema.ts"}
export const usersTable = pgTable('users', {
  // ...
  phone: text(),
});

export const postsTable = pgTable('posts', {
  id: serial().primaryKey(),
  title: text().notNull(),
  createdAt: timestamp().defaultNow().notNull(),
  authorId: integer().notNull().references(() => usersTable.id, { onDelete: 'cascade' }),
}, (t) => [index('posts_author_idx').on(t.authorId)]);
```

Then generate and apply a new migration:

```shell
npx drizzle-kit generate
npx drizzle-kit migrate
```

The migration contains statements such as `ALTER TABLE "users" ADD COLUMN "phone" text` and
`ALTER TABLE "posts" DROP COLUMN "published"`.
CedarDB runs them in place, without recreating the tables.

{{% /steps %}}

To apply migrations when your application starts instead of with the CLI, call the migrator from code:

```typescript {filename="src/migrate.ts"}
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

async function main() {
  const db = drizzle(process.env.DATABASE_URL!);
  await migrate(db, { migrationsFolder: './drizzle' });
  await db.$client.end();
}

main();
```

## Query data

The Drizzle query API works with CedarDB, including relational queries and nested transactions:

```typescript {filename="src/index.ts"}
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { and, avg, count, desc, eq, gt, like, relations } from 'drizzle-orm';
import { postsTable, usersTable } from './db/schema';

const usersRelations = relations(usersTable, ({ many }) => ({ posts: many(postsTable) }));
const postsRelations = relations(postsTable, ({ one }) => ({
  author: one(usersTable, { fields: [postsTable.authorId], references: [usersTable.id] }),
}));

const db = drizzle(process.env.DATABASE_URL!, {
  schema: { usersTable, postsTable, usersRelations, postsRelations },
});

async function main() {
  // Batch insert with RETURNING
  const [alice] = await db
    .insert(usersTable)
    .values([
      { name: 'Alice', age: 28, email: 'alice@example.com' },
      { name: 'Bob',   age: 35, email: 'bob@example.com'   },
      { name: 'Carol', age: 22, email: 'carol@example.com' },
    ])
    .returning({ id: usersTable.id });
  await db.insert(postsTable).values([
    { title: 'Hello CedarDB', authorId: alice.id },
    { title: 'Second post',   authorId: alice.id },
  ]);

  // Filtered select
  const filtered = await db
    .select()
    .from(usersTable)
    .where(and(gt(usersTable.age, 25), like(usersTable.name, '%o%')));

  // Ordered select with LIMIT
  const oldest = await db
    .select({ name: usersTable.name, age: usersTable.age })
    .from(usersTable)
    .orderBy(desc(usersTable.age))
    .limit(2);

  // Aggregates
  const [{ userCount, avgAge }] = await db
    .select({ userCount: count(), avgAge: avg(usersTable.age) })
    .from(usersTable);

  // Relational query: users with their posts
  const usersWithPosts = await db.query.usersTable.findMany({ with: { posts: true } });

  // Upsert
  await db
    .insert(usersTable)
    .values({ name: 'Bob', age: 36, email: 'bob@example.com' })
    .onConflictDoUpdate({ target: usersTable.email, set: { age: 36 } });

  // Transaction with a nested transaction (savepoint) that rolls back
  await db.transaction(async (tx) => {
    await tx.update(usersTable).set({ age: 29 }).where(eq(usersTable.id, alice.id));
    try {
      await tx.transaction(async (nested) => {
        await nested.update(usersTable).set({ age: 99 }).where(eq(usersTable.id, alice.id));
        nested.rollback();
      });
    } catch {
      // Alice keeps age 29
    }
  });

  // Delete, cascades to the posts
  await db.delete(usersTable).where(eq(usersTable.email, 'alice@example.com'));

  console.log({ filtered, oldest, userCount, avgAge, usersWithPosts });
  await db.$client.end();
}

main();
```

Run the script:

```shell
npx tsx src/index.ts
```

## CedarDB limitations

* `cidr`, `macaddr`, `macaddr8`, and `time with time zone` (`time({ withTimezone: true })`) columns are not supported.
* `numeric` columns support a precision of at most 38, for example `numeric({ precision: 38, scale: 2 })`
  (see [Numeric](/docs/references/datatypes/numeric/)).
* Subqueries inside `insert().values()` and renaming enum values are not supported.
* The isolation level `serializable` is not supported.
  CedarDB runs all transactions with snapshot isolation and accepts the other isolation levels
  (see [Transactions](/docs/references/transactions/)).
