---
title: "Prisma ORM"
linkTitle: "Prisma"
weight: 20
---

[Prisma ORM](https://www.prisma.io/) is a TypeScript-first ORM with a declarative schema, auto-generated type-safe client, and visual database browser.

{{< callout type="info" >}}
Prisma support is currently **under active development**. Automatic schema migrations via `prisma migrate` are not yet supported. Use `npx prisma db push` from a clean database instead.
{{< /callout >}}

The [official getting-started tutorial](https://www.prisma.io/docs/prisma-orm/quickstart/postgresql) works out of the box with CedarDB, with minor adjustments noted below.

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

Create a new Node.js project and install Prisma with the PostgreSQL adapter:

```shell
mkdir hello-prisma && cd hello-prisma
npm init -y
npm install typescript tsx @types/node --save-dev
npx tsc --init
npm install prisma @types/pg --save-dev
npm install @prisma/client @prisma/adapter-pg pg dotenv
```

Set `"type": "module"` in `package.json` and configure `tsconfig.json` for ESM:

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

## Connecting

Initialize Prisma:

```shell
npx prisma init --datasource-provider postgresql --output ../generated/prisma
```

This creates a `prisma/schema.prisma` and a `.env` file. Set your CedarDB connection string in `.env`:

```shell {filename=".env"}
DATABASE_URL="postgresql://myuser:mypassword@localhost:5432/mydb?schema=public"
```

Instantiate the Prisma client in `lib/prisma.ts`:

```typescript {filename="lib/prisma.ts"}
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

export { prisma };
```

## Defining a Schema

Edit `prisma/schema.prisma` to define your models:

```prisma {filename="prisma/schema.prisma"}
generator client {
  provider = "prisma-client"
  output   = "../generated/prisma"
}

datasource db {
  provider = "postgresql"
}

model User {
  id    Int     @id @default(autoincrement())
  email String  @unique
  name  String?
  posts Post[]
}

model Post {
  id        Int     @id @default(autoincrement())
  title     String
  content   String?
  published Boolean @default(false)
  author    User    @relation(fields: [authorId], references: [id])
  authorId  Int
}
```

## Applying the Schema

Push the schema to CedarDB using `prisma db push` (note: `prisma migrate` is not yet supported):

```shell
npx prisma db push
```

Then generate the Prisma client:

```shell
npx prisma generate
```

## Querying

Create a `script.ts` to run queries against CedarDB:

```typescript {filename="script.ts"}
import { prisma } from "./lib/prisma";

async function main() {
  // Create a user with a related post
  const user = await prisma.user.create({
    data: {
      name: "Alice",
      email: "alice@prisma.io",
      posts: {
        create: {
          title: "Hello World",
          content: "This is my first post!",
          published: true,
        },
      },
    },
    include: {
      posts: true,
    },
  });
  console.log("Created user:", user);

  // Fetch all users with their posts
  const allUsers = await prisma.user.findMany({
    include: { posts: true },
  });
  console.log("All users:", JSON.stringify(allUsers, null, 2));
}

main()
  .then(async () => { await prisma.$disconnect(); })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
```

Run the script:

```shell
$ npx tsx script.ts
User created successfully.
All users:  [
  {
    "id": 1,
    "email": "alice@prisma.io",
    "name": "Alice",
    "posts": [
      {
        "id": 1,
        "title": "Hello World",
        "content": "This is my first post!",
        "published": true,
        "authorId": 1
      }
    ]
  }
]
```

## Known Limitations

CedarDB's Prisma support is actively being developed. The following are known limitations:

**Schema migrations** (`prisma migrate dev`) are not supported. Use `npx prisma db push` to apply schema changes directly to the database instead.

**Drop database** of non-empty databases is not supported. To reset your database, manually drop all contained objects and recreate it via `psql`:

```sql
<drop all contained objects>
drop database mydb;
create database mydb;
```
