# Knowledge index: data-engineer

Read this index first, then the notes that fit the task. Name the notes you used in your answer.

## Quick reference
- Model for the queries you need; plan migrations from day one.
- Netlify Blobs for small JSON and counters; Postgres for relational data.
- Minimise personal data; define retention.

## Notes
- [Netlify Blobs: stores, keys, consistency and limits](netlify-blobs.md): getStore vs getDeployStore, strong reads, conditional writes, key and size limits. Read before putting any data in Blobs.
- [PostgreSQL 19 constraints and safe index builds](postgres-constraints-and-indexes.md): CHECK, NOT NULL, UNIQUE, foreign keys and ON DELETE, CREATE INDEX CONCURRENTLY. Read when designing tables or writing migrations.
- [Supabase Row Level Security for data models](supabase-row-level-security.md): enabling RLS, one policy per operation, roles, keys, policy performance. Read before exposing any Supabase table.
- [Netlify platform for our apps](../_shared/netlify-platform.md)
- [Privacy basics (general information, not legal advice)](../_shared/privacy-basics.md)

Maintained by the knowledge-curator (source-notes skill). Last reviewed 2026-11-28.
