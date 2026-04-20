# CedarDB Documentation Style Guide

Style principles, page structure, and writing rules for all CedarDB documentation.

---

## 1. Audience and Tone

### Who we write for

Readers are technical: developers, DBAs, and data engineers comfortable with SQL
and database concepts. Assume SQL familiarity. Do not explain foundational database
concepts (what a table is, what a transaction does). Do explain what CedarDB does,
how each feature works, and where behavior differs from PostgreSQL.

### Tone

Precise and factual. Think: a senior engineer explaining something clearly.
Confident, concise, helpful. Never condescending. Neutral in reference docs.
Strengths may be highlighted in best-practices content.

### Voice

- Address the reader as "you" -- most natural in tutorials, used sparingly in
  reference descriptions.
- Active voice by default. "CedarDB returns the result." Not "The result is
  returned by CedarDB."
- Never use "we" to describe product behavior. Use "CedarDB" or "the database."

| Avoid | Prefer |
|-------|--------|
| We recommend creating an index before querying. | Create an index before querying for better performance. |
| The user should call SELECT after INSERT. | Call SELECT after INSERT to verify the result. |
| We fixed the bug in version 2.3. | CedarDB 2.3 fixes the issue where ... |
| The result is returned by CedarDB. | CedarDB returns the result. |

---

## 2. Language and Formatting

- **American English.** "analyze" not "analyse", "behavior" not "behaviour."
- **Oxford comma.** "tables, views, and indexes."
- **SQL keywords** in uppercase in both prose and code blocks: `SELECT`, `ALTER TABLE`.
- **Backticks** for inline technical names: `statement_timeout`, `psql`, `pg_catalog`.
- **"CedarDB"** (not "Cedar DB", "cedar"). **"PostgreSQL"** (not "Postgres", "PG")
  in prose. Technical names like `pg_catalog` or `psql` are fine as-is.
- **Page titles:** title case. **Subsection headings:** sentence case.
- **Sentences:** keep them short. One idea per sentence. Under 25 words as a target.

---

## 3. Page Structure

### 3.1 Reference pages

Every SQL reference page follows this structure. Omit a section only if it
genuinely does not apply. Do not leave sections empty or include placeholders.

| Section | Required? | Purpose |
|---------|-----------|---------|
| One-paragraph summary | Yes | What the feature does. No examples yet. |
| Quick example | Yes | Short, self-contained SQL showing the core concept. |
| Syntax | Yes | Railroad diagram of the supported syntax, followed by a plain-text fallback block with `<placeholders>` and `[optional]` parts. Options listed as a table. |
| Parameters and options | If applicable | Table of parameters, types, defaults, descriptions. |
| Permissions | If applicable | Which roles can execute this and under what conditions. |
| PostgreSQL differences | If any exist | Bulleted list of behavioral differences. See Section 5. |
| Further examples | Recommended | Realistic scenarios covering edge cases. |

Railroad diagrams are the primary way to communicate syntax. Use the
`{{</* railroad */>}}` shortcode. Only document syntax that CedarDB actually
supports — omit clauses that are not yet implemented rather than greying them
out. Follow the diagram with a plain-text syntax block as a fallback for
readers who prefer text, and as the source of truth for the options table below.

### 3.2 Tutorial and cookbook pages

Same opening structure (summary, quick example) but replace the formal syntax
section with step-by-step instructions. Each step must be independently
executable -- the reader should be able to copy-paste the code block for that
step without needing to have read previous steps.

Start with the simplest correct path (happy path first). Introduce complexity
and edge cases later, clearly labeled.

### 3.3 Compatibility pages

Use tables with a traffic-light status column using inline emoji:

| Status | Emoji | Meaning |
|--------|-------|---------|
| Full | 🟢 | Core PostgreSQL functionality works. |
| Partial | 🟡 | Meaningful, commonly-used functionality is missing. |
| No | 🔴 | The feature is not supported at all. |

- Every entry with a reference page must link to it.
- **Full** means core PostgreSQL functionality works. Minor missing sub-features
  (edge-case options, rarely-used clauses) do not prevent a Full rating. Document
  the gaps in the reference page's "PostgreSQL Differences" section, not here.
- **Partial** means meaningful, commonly-used functionality is missing. Link to
  the reference page only — do not list limitations inline in the matrix.
- **No** means the feature is not supported at all.
- All Partial and No entries must be verified by testing. Do not guess.
- Never link to PostgreSQL docs from compatibility entries.

### 3.4 Section index pages (_index.md)

Every directory that groups related pages must have an `_index.md`. It serves
as the landing page for that section in the navigation and is the first thing
a reader sees when arriving at a section from a search result or a cross-link.

Structure:

| Part | Required? | Notes |
|------|-----------|-------|
| One-paragraph overview | Yes | What this section covers and why it exists as a group. No syntax, no examples. |
| Member list | Yes | A bulleted or linked list of all pages in the section, each with a one-line description. |

Keep the overview to two or three sentences. It should answer "what will I find
here?" and orient the reader before they click into a specific page. Do not
repeat the section title verbatim as the first sentence.

The member list must stay in sync with the actual pages in the directory. When
a page is added or removed, update the `_index.md` in the same PR.

Example:

```markdown
CedarDB supports the standard SQL data types, with extensions for analytical
workloads. Each page covers the type's storage format, valid ranges, casting
rules, and any differences from PostgreSQL.

- [Integer types](integer) — `smallint`, `integer`, `bigint`, and serial variants
- [Numeric](numeric) — arbitrary-precision `numeric` and `decimal`
- [Text](text) — `text`, `varchar`, and `char`
- [JSON](json) — `json` and `jsonb` with operator and function reference
```

### 3.5 Best-practices pages

Separate from reference docs. Cover where CedarDB excels, known limitations
with recommended workarounds, and optimization guidelines. May highlight
strengths. Include benchmarks or explanations where relevant.

---

## 4. Examples

### Rules

1. **Self-contained.** Include the CREATE TABLE or equivalent setup needed to
   run the example. Do not assume state from elsewhere in the docs.
2. **Copy-pasteable.** The code block runs without modification in a CedarDB
   psql session.
3. **Show expected output** when the result is non-obvious or demonstrates
   specific behavior. Use the psql tabular format in a separate code block
   or as comments.
4. **No cross-page running examples.** Each page uses its own schema. Do not
   build on tables defined in other pages.
5. **Consistent naming theme.** Use plant and tree themed names where they fit
   naturally: `trees`, `forests`, `plants`, `species`, `growth_rate`, `height`,
   `bloom_date`. Fall back to other realistic domain names (`orders`, `customers`,
   `amount`) when a botanical theme would feel forced for the concept being
   demonstrated. Never use meaningless names like `t`, `a`, `b`, `foo`.
6. **One concept per example.** Do not combine unrelated features.
7. **Keep it short.** Under 10 lines preferred. 15 lines maximum for complex
   features (transactions with savepoints, multi-step migrations).

### Pattern

```sql
-- Create the table
CREATE TABLE trees (
    id          integer PRIMARY KEY,
    species     text    NOT NULL,
    height_m    numeric NOT NULL,
    planted     date    DEFAULT current_date
);

-- Insert a row
INSERT INTO trees VALUES (1, 'Oak', 12.4, '2015-03-10');

-- Verify
SELECT * FROM trees;
--  id | species | height_m |  planted
-- ----+---------+----------+------------
--   1 | Oak     |     12.4 | 2015-03-10
```

---

## 5. PostgreSQL Compatibility Handling

### Framing

CedarDB is PostgreSQL-compatible. Many readers arrive with PostgreSQL knowledge.
Leverage that, but never send readers away to read PostgreSQL docs.

**No external PostgreSQL links.** Never link to postgresql.org. If the reader
needs more context, document it in CedarDB docs. Linking externally signals
immaturity and causes drop-off.

### Highlighting additions

When CedarDB extends PostgreSQL, call it out positively: "In addition to standard
PostgreSQL behavior, CedarDB also supports ..." Do not frame additions as edge
cases.

### Differences on reference pages

If a reference page has any behavioral difference from PostgreSQL, include a
"PostgreSQL Differences" section. Use a bulleted list. If there are no
differences, omit the section entirely.

```markdown
## PostgreSQL Differences

- `ON CONFLICT DO UPDATE` is supported; `ON CONFLICT DO NOTHING` is not yet available.
- The `RETURNING` clause supports all column expressions.
```

### Features first, limitations second

Lead with what CedarDB can do. Limitations and PostgreSQL differences belong in
a clearly labeled section near the bottom of the page, not in a warning at the top.

| Avoid | Prefer |
|-------|--------|
| Warning: CedarDB does not support X. | CedarDB supports Y and Z. Note: X is not yet available; see the roadmap. |
| Partial support only -- see caveats. | Fully supported. The following options are not yet available: [list] |

---

## 6. Self-Contained Documentation

The CedarDB docs must function as a complete reference. Readers should never need
to leave the site to understand how to use a feature.

- Do not link to external documentation to explain a concept. Document it here.
- Internal cross-links are encouraged. Link to related CedarDB pages freely.
- If a concept needs context (e.g., what snapshot isolation means), explain it
  briefly in the description section rather than linking elsewhere.

---

## 7. What to Document

### Prioritize breadth over depth

A complete set of documentation, even for simple features, signals project maturity.
Do not skip documenting something because it seems basic or obvious.

Enterprise evaluators check for completeness, not sophistication. Document the
boring stuff.

### What not to document

- Features that are not yet implemented. The roadmap covers planned work.
- Internal implementation details unless they affect user-visible behavior.
- Workarounds for missing features. If a feature is missing, say so and stop.

---

## 8. Versioning

CedarDB does not maintain versioned documentation. All documentation describes
the current stable release. Versioned docs encourage users to stay on old
versions and create back-porting pressure.

When features change between versions, update the existing page. Release notes
in `releases.md` track what changed per version.

---

## 9. Maintenance

### Docs before code merge

Documentation must be written and approved before the corresponding code change
is merged. Submit a documentation PR alongside the code PR. The documentation PR
must be approved before the code PR can be merged.

### Fixing stale docs

If you discover a mismatch between docs and behavior during routine development,
fix it immediately in the same PR. Do not file "fix docs later" tickets.

---

## 10. Code Blocks

- SQL code blocks use the `sql` language tag.
- Shell commands use `bash` or no tag. Prefix with `$` only when mixing commands
  with output.
- Syntax definitions use no language tag. Use `<angle brackets>` for placeholders
  and `[square brackets]` for optional parts.

---

## 11. Admonitions and Tables

- Use Hugo admonitions sparingly. Two types: info (supplementary context) and
  warning (behavior that might surprise the reader or cause data loss).
- Limit to one admonition per page section. If you need more, revise the prose
  to incorporate the information directly.
- Use markdown tables for structured information. Keep cells simple. If a cell
  needs more than one sentence, use prose instead.

---

## Quick Reference

| Avoid | Prefer |
|-------|--------|
| Link to postgresql.org for more detail. | Document the detail here. |
| Put limitations in a callout at the top. | Lead with what the feature does; limitations at the bottom. |
| Write "we" for product behavior. | Write "CedarDB" or "the database." |
| Assume readers have context from another page. | Make every example self-contained. |
| Skip documenting simple features. | Document everything. Completeness signals maturity. |
| Leave "No" entries in the compatibility matrix untested. | Test it. Update the entry. Update the reference page. |
| Use passive voice by default. | Use active voice. |
| Commit audit results to main. | Always commit on a dated branch. |
