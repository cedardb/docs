---
title: "Reference: SQL Syntax"
linkTitle: "SQL Syntax"
weight: 20
---

CedarDB processes SQL queries in multiple stages. The first stage validates the query for valid utf8 and splits it into tokens for further processing.
The tokens are the basis that form the SQL query.

```sql
-- get users older than 30
SELECT name, age FROM users WHERE age >= 30;
```

This query breaks down into the following tokens:
| Token | Type |
|--------|----------------|
| `get users older than 30` | Comment |
| `SELECT` | Keyword |
| `name` | Identifier |
| `,` | Separator |
| `age` | Identifier |
| `FROM` | Keyword |
| `users` | Identifier |
| `WHERE` | Keyword |
| `age` | Identifier |
| `>=` | Operator |
| `30` | Numeric Literal |
| `;` | Terminator |

## Keywords

## Identifiers
Each relation in CedarDB, like a table or a column has a name, like `student` or `"userName"`

#### unquoted identifier 
Identifiers in CedarDB:
- Must begin with a letter (A-z) or an underscore (_).
- Can contain letters, digits (0-9), underscores, and dollars.
- Can contain non-Ascii characters
- Are case-insensitive unless quoted (`"userName"` is different from `userName`)

Examples:
```sql
CREATE TABLE myUsers ( id int, text name); -- creates table `myusers`
SELECT * FROM myUsers; -- ✅ looks for `myusers`
SELECT * FROM MYUSERS; -- ✅ looks for `userlist`
SELECT * FROM "myUsers"; -- ❌ looks for `myUsers` with uppercase U

```

#### double quoted identifer

## Constants
CedarDB supports three categories of implicitly-typed contant literals: `string`, `integer`, and `bitstring`.
Constants can also be explicitely typed using `::type`, which is explained in section x.

### String Constant
All string constants support Unicode characters in UTF-8 encoding.
Every string is validated while parsing and processed as is without any changes to the byte representation.

#### Single Quoted
- Enclosed in single quotes (`'...'`).
- Use `''` (double single-quotes) to escape single quotes.
- `\` means literal backslash
- 
  ```sql
  SELECT 'Hello, world!';
  SELECT 'It''s a great day';
  ```

#### C-Style escaped
- Enclosed in single quotes prefixed with letter e (`e'...'`).
- Use `\'` to escape single quotes.
- `\\` means literal backslash

  ```sql
  SELECT 'Hello, world!';
  SELECT 'It''s a great day';
  ```

#### Unicode escaped
- Enclosed in single quotes prefixed with letter e (`e'...'`).

#### Dollar escaped


#### National characterset encoded
- Enclosed in single quotes prefixed with letter n (`n'...'`).
- Originally added to input files in regional encoding

Since CedarDB only supports UTF-8 encoding, national char string literals default to regular single quoted strings.

### Numeric Constants

#### Integer Literals
- Decimal Integers: `123`, `-456`
- Scientific notation: `2.5E4` (which is `25000`)
  ```sql
  SELECT 42, 3.14, -5, 2.5E4;
  ```
- Binary Integers: `0b11`, `0b1100_1111`
- Octal Integers: `0o755`, `0o123_456`

#### Floating Point Literals
- Floating-point: `3.14`, `-0.005`

### Bitstring Constants
`b'111'`

## Comments
- **Single-line comments** start with `--`:
  ```sql
  -- This is a comment
  SELECT * FROM users;
  ```
- **Multi-line comments** are enclosed with `/* ... */`:
  ```sql
  /* This is a 
     multi-line comment */
  SELECT * FROM users;
  ```
- **Multi-line comments** can be nested
  ```sql
  /* This is a 
     /* multi-line */
     comment */
  SELECT * FROM users;
  ```

### Reserved Keywords
Some words are reserved and cannot be used as identifiers unless quoted:
```sql
CREATE TABLE "SELECT" (
    id SERIAL PRIMARY KEY,
    value TEXT
);
```
