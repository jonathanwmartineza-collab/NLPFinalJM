# Data Modeling — reference

Linked from [SKILL.md](SKILL.md).

## 1. Storage decision table
| Need | Browser storage | Netlify Blobs | Postgres / Supabase |
|---|---|---|---|
| Data shared between users or devices | No | Yes | Yes |
| Lookup by exact key or key prefix | Yes | Yes | Yes |
| Filter / sort / aggregate on fields | Manual, small data only | Manual (list + read), small data only | Yes (SQL, indexes) |
| Joins and transactions | No | No | Yes |
| Many concurrent writers to the same record | n/a | Risky: last write wins; use ETag checks | Yes (row locks, constraints) |
| Built-in per-user access rules | n/a | No: enforce in your function | Supabase RLS / DB roles |
| Setup cost | None | None on Netlify | Provision a database and manage credentials |
| Good fit | Settings, drafts, local history | Chat transcripts, uploads, caches, small JSON docs | Accounts, orders, anything relational or reported on |

Rule of thumb: if you will ever write "find all X where Y, sorted by Z" over more than a few hundred
records, choose Postgres.

## 2. Netlify Blobs facts (source: https://docs.netlify.com/build/data-and-storage/netlify-blobs.md, accessed 2026-11-21)
- Key-value store per site, organised in named stores; tuned for frequent reads and infrequent writes.
- Default consistency is eventual: new blobs are available at once, but updates and deletes can take up
  to 60 seconds to reach every edge location. Strong consistency can be chosen per store or per read,
  with slower reads. The CLI always reads strongly.
- Overlapping writes to one key: the last write wins; there is no built-in locking. `set` supports
  `onlyIfNew` and `onlyIfMatch` (ETag) for conditional writes.
- Limits: store names ≤64 bytes with no `/` or `:`; keys ≤600 bytes and must not start with `/`;
  objects ≤5 GB; metadata ≤2 KB per object.
- `getStore` stores are site-wide and shared by all deploys, including Deploy Previews, so a preview can
  change production data. `getDeployStore` stores are scoped to one deploy and are removed when the
  deploy is deleted.
- Site-wide stores default to region `us-east-2` unless a region is passed; changing region does not move
  existing data.
- Local `netlify dev` uses a sandboxed store and cannot read production data.
- Netlify advises scoping keys with values callers cannot tamper with and not serving arbitrary keys.
- Upgrading `@netlify/blobs` from 6.5.0 or earlier changes namespacing; follow the docs' migration
  command before upgrading.

## 3. Browser storage notes
- localStorage: synchronous, strings only, roughly 5 MB per origin in common browsers (UNVERIFIED as a
  fixed number; browsers differ), cleared by the user at any time. Wrap writes in try/catch for quota errors.
- IndexedDB: asynchronous, structured data, larger quotas; use a small wrapper library (e.g. idb).
- Disclose browser storage in the privacy notice (see privacy-checklist skill).

## 4. SQL patterns
```sql
-- 0001_create_chats.sql
create table chats (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references users(id) on delete cascade,
  title       text not null check (char_length(title) between 1 and 200),
  status      text not null default 'active' check (status in ('active','archived')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index chats_owner_recent on chats (owner_id, created_at desc);

-- Supabase row level security: owners only
alter table chats enable row level security;
create policy "owner can read"   on chats for select using (auth.uid() = owner_id);
create policy "owner can insert" on chats for insert with check (auth.uid() = owner_id);
create policy "owner can update" on chats for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "owner can delete" on chats for delete using (auth.uid() = owner_id);
```
`gen_random_uuid()` gives v4 UUIDs; generate v7 in the application if time ordering matters.

Keyset pagination:
```sql
select id, title, created_at from chats
where owner_id = $1 and created_at < $2      -- $2 = created_at of the last row on the previous page
order by created_at desc limit 50;
```

## 5. Expand → contract example (rename `name` to `display_name`)
| Deploy | Database change | App change |
|---|---|---|
| 1 Expand | add nullable `display_name` | write both columns, read `name` |
| 2 Backfill | `update users set display_name = name where display_name is null` (in batches) | unchanged |
| 3 Switch | add `not null` to `display_name` | read and write `display_name` only |
| 4 Contract | drop `name` | none |
Each step must be safe to roll back on its own.

## 6. Blobs document pattern
```ts
type ChatDocV2 = { schemaVersion: 2; id: string; ownerId: string; title: string;
                   messages: { role: "user" | "assistant"; text: string; at: string }[]; updatedAt: string };
// read: if doc.schemaVersion === 1, upgrade in memory, then write back with onlyIfMatch: etag
```
