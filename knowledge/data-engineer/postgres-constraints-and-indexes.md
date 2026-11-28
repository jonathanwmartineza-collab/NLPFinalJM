# PostgreSQL 19 constraints and safe index builds

- Source: PostgreSQL 19 documentation: Constraints — https://www.postgresql.org/docs/current/ddl-constraints.html (accessed 2026-11-28)
- Publisher: The PostgreSQL Global Development Group
- Licence: PostgreSQL · Copy in repo: link only

Why this matters for data-engineer: the agent's rule is that the database enforces what it can. This
page says exactly what each constraint does, including the null and index behaviour that trips people
up; the supporting CREATE INDEX page covers building indexes on a live table.

## Key facts
- Version: the "current" docs are PostgreSQL 19 (released 2026-11-19, per the site header).
- CHECK passes when the expression is true or null; add NOT NULL to stop nulls. Name it with
  `CONSTRAINT name CHECK (...)`, or the system picks a name.
- CHECK may not look at other rows or tables; the docs point to UNIQUE, EXCLUDE, FOREIGN KEY or a trigger
  instead. Functions used in a CHECK are assumed immutable.
- NOT NULL is more efficient than `CHECK (col IS NOT NULL)`; a column has at most one explicit one.
- UNIQUE builds a unique B-tree index automatically. Nulls are distinct by default, so two null rows do
  not clash; `UNIQUE NULLS NOT DISTINCT` makes them clash. A unique partial index covers "unique among
  some rows".
- PRIMARY KEY = unique and not null, builds a unique B-tree index, one per table. The docs advise every
  table should have one, though it is not enforced.
- FOREIGN KEY targets a primary key, a unique constraint or a non-partial unique index.
- A foreign key does not create an index on the referencing columns; the docs say indexing them is often a
  good idea (deletes and updates on the parent must find child rows).
- A referencing row with any null in its key columns skips the check unless `MATCH FULL` or NOT NULL.
- Actions: `NO ACTION` (default, can be deferred), `RESTRICT` (cannot be deferred), `CASCADE`,
  `SET NULL`, `SET DEFAULT`; a column list for SET NULL/DEFAULT works for ON DELETE only.
- EXCLUDE constraints (for example `EXCLUDE USING gist (c WITH &&)`) create an index of that type; useful
  for non-overlapping bookings.

## Supporting page: CREATE INDEX (https://www.postgresql.org/docs/current/sql-createindex.html, accessed 2026-11-28)
- A plain build blocks writes (not reads) until done. `CREATE INDEX CONCURRENTLY` does not block
  inserts, updates or deletes.
- CONCURRENTLY cannot run inside a transaction block, scans the table twice and waits for open
  transactions, so it is slower overall. Only one concurrent build per table at a time.
- A failed concurrent build leaves an INVALID index that still costs write overhead (and, if unique,
  still enforces uniqueness): drop it and retry, or `REINDEX INDEX CONCURRENTLY`.
- Not supported on partitioned tables: build each partition's index concurrently, then the parent index.
- Multicolumn: B-tree, GiST, GIN and BRIN; up to 32 columns including INCLUDE columns. Only B-tree
  supports unique indexes. A partial index's WHERE may use only the table's own columns.
- INCLUDE adds non-key columns for index-only scans, at the cost of a bigger index.

## How to apply it here
- Write each rule as a constraint first, app validation second: status → CHECK (or lookup table),
  required → NOT NULL, natural key → UNIQUE, ownership → FOREIGN KEY with an explicit ON DELETE.
- Add a NOT NULL beside every CHECK that must reject missing values.
- Index every foreign key column yourself; the database will not.
- Case-insensitive unique email: unique index on `lower(email)` (or `citext`); decide null handling.
- On a live table, use the expand → migrate → contract plan and `CREATE INDEX CONCURRENTLY` in its own
  migration file outside a transaction; check for INVALID indexes afterwards (`\d+ table`).
- Prove it: insert rows that must fail (null in NOT NULL, duplicate key, orphan child) and show the error
  output; anything not run is NOT RUN.

| Rule | Constraint |
|---|---|
| Price above zero | `CHECK (price > 0)` plus NOT NULL |
| One open booking per slot | EXCLUDE with gist, or a unique partial index |
| Deleting a user removes their drafts | FK `ON DELETE CASCADE` |
| Keep invoices when a customer goes | FK `ON DELETE RESTRICT` |

## Limits
- The constraints page does not say in which version `NULLS NOT DISTINCT` arrived; check the release
  notes before relying on it with an older managed host (UNVERIFIED).
- Managed hosts (Supabase, Neon) may run an older major version than 19; check `select version();`.
- Neither page covers lock timeouts or backfill batch sizes; those come from the agent's own method.
