---
title: "Prisma ORM"
linkTitle: "Prisma"
weight: 20
---

[Prisma ORM](https://www.prisma.io/) is a TypeScript ORM with a declarative schema, a generated type-safe client, and
the migration tool Prisma Migrate.
CedarDB works with Prisma's `postgresql` provider and the `@prisma/adapter-pg` driver adapter, so you can define your
schema, manage it with migrations, and query it like a PostgreSQL database.
Apply schema changes with `prisma db push`, or create versioned migrations with `prisma migrate dev` and apply them
with `prisma migrate deploy`.

This page was tested with `prisma`, `@prisma/client`, and `@prisma/adapter-pg` 7.10.0 and `pg` 8.23.1.

This page is a self-contained example that you can follow from start to finish.
It points out what is specific to CedarDB.
For all features, see Prisma's documentation of
[the Prisma schema](https://www.prisma.io/docs/orm/prisma-schema),
[Prisma Migrate](https://www.prisma.io/docs/orm/prisma-migrate), and
[Prisma Client](https://www.prisma.io/docs/orm/prisma-client).

## Prerequisites

* Node.js 20 or later.
* A running CedarDB server that accepts TCP connections (see [Install CedarDB locally](/docs/get_started/install_locally/) or [CedarDB Cloud](https://cedardb.com/cloud/)).
* A CedarDB superuser to create the application role and database.

## Set up CedarDB

Connect to CedarDB as a superuser and create a role for your application that owns its database:

```sql
CREATE ROLE myuser WITH LOGIN CREATEDB PASSWORD 'CorrectHorseBatteryStaple';
CREATE DATABASE mydb OWNER myuser;
```

As the database owner, Prisma can create tables, types, and indexes without further privileges.
`CREATEDB` allows `prisma migrate dev` to create and drop a temporary
[shadow database](https://www.prisma.io/docs/orm/prisma-migrate/understanding-prisma-migrate/shadow-database).
If you only use `prisma db push` or `prisma migrate deploy`, you can omit it.
This works in every CedarDB edition.
Granting privileges with `GRANT` instead requires a CedarDB [enterprise license](/docs/licensing/).

## Set up the project

{{% steps %}}

### Install Prisma

Create a Node.js project and install Prisma 7 with the PostgreSQL driver adapter:

```shell
mkdir hello-prisma && cd hello-prisma
npm init -y
npm pkg set type=module
npm install --save-dev prisma@7 typescript tsx @types/node @types/pg
npm install @prisma/client@7 @prisma/adapter-pg@7 pg dotenv
```

Pin the major version: the `latest` tag of the `prisma` package can point to a release candidate of the next major
version.

Create a `tsconfig.json`:

```json {filename="tsconfig.json"}
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "target": "ES2023",
    "strict": true,
    "esModuleInterop": true,
    "ignoreDeprecations": "6.0"
  }
}
```

### Configure the connection

Initialize Prisma:

```shell
npx prisma init --datasource-provider postgresql --output ../generated/prisma
```

Set your CedarDB connection string in `.env`:

```shell {filename=".env"}
DATABASE_URL="postgresql://myuser:CorrectHorseBatteryStaple@localhost:5432/mydb?schema=public"
```

Make sure `prisma.config.ts` loads the connection string:

```typescript {filename="prisma.config.ts"}
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
```

### Define the schema

Edit `prisma/schema.prisma` to define your models:

``` {filename="prisma/schema.prisma"}
generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
}

datasource db {
  provider = "postgresql"
}

enum Role {
  ADMIN
  MEMBER
}

model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  name  String?
  role  Role    @default(MEMBER)
  posts Post[]
}

model Post {
  id        Int     @id @default(autoincrement())
  title     String
  content   String?
  published Boolean @default(false)
  price     Decimal @default(0) @db.Decimal(10, 2)
  author    User    @relation(fields: [authorId], references: [id], onDelete: Cascade)
  authorId  Int

  @@index([authorId])
}
```

### Create the client

Instantiate Prisma Client with the driver adapter in `lib/prisma.ts`:

```typescript {filename="lib/prisma.ts"}
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export { prisma };
```

{{% /steps %}}

## Create and change the schema

Choose one of two workflows:

* **Push the schema** with `prisma db push` to apply it directly, without migration files.
  Use it for prototyping.
* **Use versioned migrations** with `prisma migrate dev` to keep every change as a SQL file that you review and commit.
  `prisma migrate deploy` applies them to other environments, such as production.

### Push the schema

Push the schema to CedarDB and generate Prisma Client:

```shell
npx prisma db push
npx prisma generate
```

After you change `prisma/schema.prisma`, run both commands again.
Prisma compares the schema with the tables in CedarDB and applies only the difference, for example with
`ALTER TABLE ... ADD COLUMN` or `DROP COLUMN`.
If a change can lose data, Prisma asks for confirmation.

### Use versioned migrations

{{% steps %}}

#### Create the first migration

Create a migration from the schema, apply it, and generate Prisma Client:

```shell
npx prisma migrate dev --name init
npx prisma generate
```

Prisma Migrate writes the SQL to `prisma/migrations/<timestamp>_init/migration.sql` and records the applied migration
in the table `_prisma_migrations`.

#### Change the schema

Edit `prisma/schema.prisma`, for example add a field to `User`:

``` {filename="prisma/schema.prisma"}
model User {
  // ...
  createdAt DateTime @default(now()) @db.Timestamp(6)
}
```

{{< callout type="warning" >}}
CedarDB stores timestamps with microsecond precision.
Declare `DateTime` fields with `@db.Timestamp(6)`. Prisma uses `timestamp(3)` by default, so without it every
`prisma migrate dev` creates a new migration that changes the column type again.
{{< /callout >}}

Create and apply a migration for the change:

```shell
npx prisma migrate dev --name add_created_at
npx prisma generate
```

Review each migration before you commit it.

#### Deploy the migrations

Apply all pending migrations to another database, for example in production:

```shell
npx prisma migrate deploy
```

`prisma migrate deploy` does not need a shadow database.

{{% /steps %}}

### Reset a development database

To start over, drop and recreate the database, then push the schema or apply the migrations again:

```sql
DROP DATABASE mydb;
CREATE DATABASE mydb OWNER myuser;
```

## Query data

Create a `script.ts` that runs queries against CedarDB:

```typescript {filename="script.ts"}
import { prisma } from "./lib/prisma";

async function main() {
  // Start from empty tables, deletes cascade to the posts
  await prisma.user.deleteMany();

  // Create a user with related posts
  const alice = await prisma.user.create({
    data: {
      name: "Alice",
      email: "alice@prisma.io",
      posts: {
        create: [
          { title: "Hello World", content: "This is my first post!", published: true, price: "9.99" },
          { title: "Draft" },
        ],
      },
    },
  });

  // Filter on a relation and count related records
  const authors = await prisma.user.findMany({
    where: { posts: { some: { published: true } } },
    select: { email: true, _count: { select: { posts: true } } },
  });

  // Aggregate and group
  const stats = await prisma.post.aggregate({ _sum: { price: true }, _count: true });
  const byRole = await prisma.user.groupBy({ by: ["role"], _count: { _all: true } });

  // Interactive transaction
  await prisma.$transaction(async (tx) => {
    const bob = await tx.user.create({ data: { email: "bob@prisma.io", name: "Bob" } });
    await tx.post.create({ data: { title: "Bob's post", authorId: bob.id } });
  });

  // Upsert
  await prisma.user.upsert({
    where: { email: "bob@prisma.io" },
    update: { role: "ADMIN" },
    create: { email: "bob@prisma.io", role: "ADMIN" },
  });

  // Fetch all users with their posts
  const allUsers = await prisma.user.findMany({ include: { posts: true }, orderBy: { id: "asc" } });

  // Delete, cascades to the posts
  await prisma.user.delete({ where: { id: alice.id } });

  console.log(JSON.stringify({ authors, stats, byRole, allUsers }, null, 2));
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
```

Run the script:

```shell
npx tsx script.ts
```

## CedarDB limitations

* `Decimal` fields without a native type are created as `decimal(65,30)`, which exceeds the maximum precision of 38
  (see [Numeric](/docs/references/datatypes/numeric/)).
  Add a native type with a precision of at most 38, for example `@db.Decimal(10, 2)`.
* The isolation level `Serializable` is not supported.
  CedarDB runs all transactions with snapshot isolation and accepts lower isolation levels for compatibility without
  changing behaviour (see [Transactions](/docs/references/transactions/)).
