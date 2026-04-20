# CedarDB Documentation Content Structure

How documentation is organized, where content belongs, and how to decide
where new pages go.

---

## Top-Level Layout

```
content/
├── _index.md                    # Landing page
├── community_edition.md         # Community edition info
├── technology.md                # Architecture and internals
├── roadmap.md                   # Feature roadmap
├── database_upgrade.md          # Upgrade procedures
├── licensing.md                 # License information
├── releases.md                  # Release notes
│
├── get_started/                 # First-time setup
├── cookbook/                    # Task-oriented how-to guides
├── example_datasets/            # Worked examples with real data
├── clients/                     # Drivers, ORMs, GUI tools (see below)
├── best_practices/              # Optimization, strengths, recommendations
├── references/                  # Feature reference (see below)
├── compatibility/               # PostgreSQL compatibility matrices
```

---

## Section Purposes

### get_started/

First-time setup. Get CedarDB running as fast as possible.

One page per deployment method (Docker, local install, cloud). Minimal
explanation. Link to reference pages for deeper understanding. Do not add
feature documentation here.

### cookbook/

Task-oriented guides answering "how do I do X with CedarDB?"

One page per task. Each page is self-contained: the reader follows it from
top to bottom and completes the task without consulting other pages. Include
prerequisites at the top.

Add a page when a task involves multiple steps, requires specific tooling,
or combines multiple features in a non-obvious way. Simple single-feature
usage belongs in the reference section.

Name pages with verb phrases: "Importing from PostgreSQL", "Working with
CSV Files", "Replicating via Debezium."

### example_datasets/

In-depth worked examples with real or realistic datasets. Demonstrate
CedarDB capabilities (especially HTAP, mixed workloads, analytical queries
over transactional data). These are showcases, not primary references. Link
to reference pages for feature details.

### clients/

Organized into three sub-sections:

- **Language folders** (`python/`, `javascript/`, `java/`, etc.) — one folder per
  programming language. The folder's `_index.md` covers the primary driver or
  adapter for that language. Additional pages in the same folder cover
  language-specific ORMs and frameworks (e.g., `javascript/drizzle.md`).
- **`tools/`** — GUI clients, CLI tools, and observability integrations that are
  not tied to a specific programming language (DBeaver, DataGrip, psql, Grafana).

Each page covers installation, connection setup, and a minimal working example.
Focus on what is specific to CedarDB. Do not rewrite the client library's own
documentation.

Add a new language folder when a language gets its first client page. Add
further pages within the folder as additional drivers, ORMs, or frameworks are
documented for that language. Language-specific ORMs always live inside the
relevant language folder, not in a separate top-level ORMs section.

### best_practices/

Optimization guidelines, recommended patterns, and where CedarDB excels.
Separate from reference docs. May highlight strengths and include benchmarks.
Cover topics like query optimization, schema design for HTAP workloads, bulk
loading strategies, and when to use CedarDB-specific features.

### clients/ layout

```
clients/
├── python/
│   └── _index.md            # psycopg driver
├── javascript/              # Node.js / TypeScript ecosystem
│   ├── _index.md            # node-postgres (pg) driver
│   ├── drizzle.md
│   └── prisma.md
├── java/
│   └── _index.md            # JDBC driver
├── rust/
│   └── _index.md
├── cpp/
│   └── _index.md
├── csharp/
│   └── _index.md
├── r/
│   └── _index.md
└── tools/                   # Not language-specific
    ├── psql.md
    ├── dbeaver.md
    ├── datagrip.md
    └── grafana.md
```

### references/

Authoritative feature reference. Object-first organization (see below).

### compatibility/

At-a-glance PostgreSQL compatibility matrices. Lookup tables, not explanations.
Every entry with a reference page must link to it. Use Yes / Partial / No.
See the Styleguide for rules on maintaining accuracy.

---

## Reference Section: Object-First Organization

DDL documentation is organized by database object, not by SQL command. All
operations on an object (CREATE, ALTER, DROP) live on the same page or in
tightly linked pages within the same directory.

```
references/
├── datatypes/                   # One page per type family
│   ├── _index.md
│   ├── integer.md               # smallint, integer, bigint, serial variants
│   ├── numeric.md               # numeric, decimal
│   ├── float.md                 # real, double precision
│   ├── text.md                  # text, varchar, char
│   ├── boolean.md
│   ├── date.md
│   ├── time.md                  # time, time with time zone
│   ├── timestamp.md             # timestamp, timestamp with time zone
│   ├── interval.md
│   ├── json.md                  # json, jsonb
│   ├── array.md
│   ├── uuid.md
│   ├── bit.md                   # bit, bit varying
│   ├── blob.md                  # bytea
│   ├── vector.md                # pgvector-compatible
│   └── enums.md                 # user-defined enum types
│
├── objects/                     # One page per database object
│   ├── _index.md
│   ├── tables.md                # CREATE, ALTER, DROP TABLE, constraints, partitioning
│   ├── indexes.md               # CREATE, DROP INDEX, types, partial, expression
│   ├── views.md                 # CREATE, DROP VIEW, materialized views, REFRESH
│   ├── schemas.md               # CREATE, ALTER, DROP SCHEMA, search_path
│   ├── databases.md             # CREATE, ALTER, DROP DATABASE
│   ├── roles.md                 # CREATE, ALTER, DROP ROLE, GRANT, REVOKE
│   ├── sequences.md             # CREATE, ALTER, DROP SEQUENCE, nextval, currval
│   ├── functions.md             # CREATE, ALTER, DROP FUNCTION/PROCEDURE, DO, CALL
│   ├── triggers.md              # CREATE, ALTER, DROP TRIGGER
│   └── types.md                 # CREATE, ALTER, DROP TYPE, domains, enums, composites
│
├── sqlreference/
│   ├── _index.md
│   ├── queries/                 # SELECT query syntax (one page per clause)
│   │   ├── _index.md
│   │   ├── select.md            # SELECT clause, DISTINCT, column aliases
│   │   ├── from.md              # FROM clause, all JOIN types, LATERAL
│   │   ├── where.md             # WHERE clause, filter conditions
│   │   ├── groupby.md           # GROUP BY, HAVING
│   │   ├── orderby.md           # ORDER BY, LIMIT, OFFSET
│   │   ├── with.md              # CTEs, recursive CTEs
│   │   ├── setops.md            # UNION, INTERSECT, EXCEPT
│   │   └── window.md            # Window functions, OVER clause
│   ├── dml/                     # Data manipulation (one page per statement)
│   │   ├── _index.md
│   │   ├── insert.md            # INSERT INTO, INSERT ... SELECT
│   │   ├── copy.md              # COPY TO / FROM
│   │   ├── update.md            # UPDATE ... SET
│   │   ├── delete.md            # DELETE FROM
│   │   └── upsert.md            # INSERT ... ON CONFLICT (upsert / MERGE)
│   ├── transactions.md          # BEGIN, COMMIT, ROLLBACK, savepoints, isolation levels
│   └── expressions/             # SQL expression features
│       ├── _index.md
│       └── try.md               # CedarDB-specific TRY expression
│
├── functions/                   # One page per function category
│   ├── _index.md
│   ├── aggregation.md           # count, sum, avg, array_agg, string_agg, ...
│   ├── window.md                # row_number, rank, lag, lead, ...
│   ├── text.md                  # String functions and operators
│   ├── timestamp.md             # Date/time functions
│   ├── json.md                  # JSON/JSONB functions and operators
│   ├── math.md                  # Mathematical functions
│   ├── array.md                 # Array functions and operators
│   ├── system.md                # pg_backend_pid, version, has_*_privilege, ...
│   ├── bitstring.md             # Bit string functions
│   └── conditional.md           # CASE, COALESCE, NULLIF, GREATEST, LEAST
│
├── advanced/                    # CedarDB-specific and non-standard features
│   ├── _index.md
│   ├── parquet.md               # Parquet import
│   ├── s3.md                    # Tables on AWS S3
│   ├── gs.md                    # Tables on Google Cloud Storage
│   ├── pgvector.md              # Vector similarity search
│   ├── asof_join.md             # AsOf join
│   ├── prepare.md               # Prepared statements
│   └── benchmarking.md          # Interactive benchmarking
│
├── configuration.md             # Server configuration parameters
└── writecache.md                # Write caching behavior
```

### Why object-first?

When a user is working with tables, they want to find CREATE TABLE, ALTER TABLE,
constraints, and partitioning in one place. Command-first organization (separate
pages for CREATE TABLE, ALTER TABLE, DROP TABLE) scatters related information
and forces the reader to navigate multiple pages for a single concept.

Object pages should use clear subsection headings for each operation (Creating,
Altering, Dropping, etc.) so that readers who know the specific command can
jump directly to it.

---

## Content Placement Decision Tree

1. **Is it about a database object (table, index, view, role, schema, sequence, function, trigger, type)?**
   Go to `references/objects/<object>.md`

2. **Is it a data type?**
   Go to `references/datatypes/<type>.md`

3. **Is it a function or operator?**
   Go to `references/functions/<category>.md`

4. **Is it about a SELECT query clause (SELECT, FROM, JOIN, WHERE, GROUP BY, ORDER BY, CTE, set operations, window functions)?**
   Go to `references/sqlreference/queries/<clause>.md`

5. **Is it about writing data (INSERT, COPY, UPDATE, DELETE, upsert)?**
   Go to `references/sqlreference/dml/<statement>.md`

6. **Is it about transaction control?**
   Go to `references/sqlreference/transactions.md`

7. **Is it a CedarDB-specific feature with no PostgreSQL equivalent?**
   Go to `references/advanced/<feature>.md`

8. **Is it a configuration parameter?**
   Go to `references/configuration.md`

9. **Is it a multi-step procedure or integration task?**
   Go to `cookbook/<task>.md`

10. **Is it about connecting with a programming language driver or ORM?**
    Go to `clients/<language>/_index.md` (driver) or `clients/<language>/<orm>.md` (ORM/framework).

11. **Is it about a GUI client, CLI tool, or BI/observability integration?**
    Go to `clients/tools/<tool>.md`

12. **Is it an optimization guideline or recommended pattern?**
    Go to `best_practices/<topic>.md`

13. **Is it a compatibility status update?**
    Go to `compatibility/<area>.md`

14. **None of the above?**
    Flag for team discussion. Do not create new top-level sections without agreement.

---

## Combining vs. Splitting

### Combine when

- Operations are on the same object (CREATE/ALTER/DROP TABLE on one page)
- Features share a concept that needs explaining once (all integer variants
  share overflow behavior and casting rules)
- A feature has fewer than three distinct sub-topics

### Split when

- Each candidate page would stand alone: its own realistic schema, its own
  example, its own PostgreSQL differences section. If separating two sections
  leaves either without a self-contained example, keep them together.

### Never

- Do not create pages for features that are not supported
- Do not create empty placeholder pages for planned features
- Do not split compatibility matrices across multiple files per feature

---

## File Naming

- Lowercase, snake_case when more than one word is needed (`asof_join.md`,
  `importing_from_postgresql.md`). Single-word names have no separator (`tables.md`).
- Object pages by object name: `tables.md`, `indexes.md`, `roles.md`
- Data types by common name: `integer.md`, `json.md`, `text.md`
- Function categories by domain: `aggregation.md`, `timestamp.md`, `json.md`
- Cookbooks with descriptive slugs: `importing_from_postgresql.md`, `working_with_csv.md`
- Language client folders by language name: `python/`, `javascript/`, `java/`
- ORM pages within the language folder: `javascript/drizzle.md`, `javascript/prisma.md`
- Tool pages by tool name: `tools/grafana.md`, `tools/dbeaver.md`

---

## Relationship Between Compatibility and Reference Pages

The compatibility matrix and reference pages must stay in sync. They serve
different purposes:

- **Compatibility pages** answer "does CedarDB support X?" at a glance.
  They are lookup tables, not explanations.
- **Reference pages** answer "how do I use X?" with syntax, description,
  and examples.

When a feature's status changes:
1. Update the compatibility matrix entry.
2. Update (or create) the reference page.
3. Both changes go in the same PR.

Compatibility entries must link to the CedarDB reference page, never to
PostgreSQL documentation.

---

## CedarDB-Specific vs. PG-Compatible Features

Features that have a PostgreSQL equivalent live in the standard reference
structure (`objects/`, `functions/`, `sqlreference/`). CedarDB-specific
behavior or additions are noted inline using a "PostgreSQL Differences"
section on the same page.

Features with no PostgreSQL equivalent (AsOf Join, Write Caching, TRY
expressions, cloud storage tables) live in `references/advanced/`. If a
CedarDB-specific feature is closely related to a standard feature (e.g.,
vector types are a data type), it may live in the standard location instead
(`references/datatypes/vector.md`, `references/advanced/pgvector.md`).

The guiding question: where would a user look for it? If they would look
under "data types," put it there. If it is an entirely new concept, put it
under "advanced."
