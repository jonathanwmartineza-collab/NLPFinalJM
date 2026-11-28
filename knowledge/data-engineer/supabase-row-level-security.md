# Supabase Row Level Security for data models

- Source: Row Level Security | Supabase Docs — https://supabase.com/docs/guides/database/postgres/row-level-security (accessed 2026-11-28)
- Publisher: Supabase
- Licence: Apache-2.0 · Copy in repo: link only

Why this matters for data-engineer: with Supabase, the browser talks to the database through the API, so
the table's policies are the access rules. A data model is not finished until every exposed table has
row-level policies that match its access patterns.

## Key facts
- Enable RLS on every table in an exposed schema (the docs' examples use `public`):
  `alter table public.reports enable row level security;`
- With RLS on and no policy, no rows come back through the API with the publishable key.
- Grants are checked before policies: a missing grant fails with error `42501`. Revoke default grants
  from `anon` and `authenticated` and grant only what each role needs.
- `auth.uid()` returns the requesting user's id, and `null` for any request without a `sub` claim
  (every `anon` request).
- `auth.jwt()` returns the token. `raw_app_meta_data` cannot be changed by users and suits authorisation;
  `raw_user_meta_data` can be edited by the user and must not be used for it. Token claims can be stale
  until refresh.
- One policy per operation; the docs advise against `for all`:

| Operation | Clause |
|---|---|
| select | `using` |
| insert | `with check` |
| update | `using` (rows you may change) and `with check` (the new row); also needs a select policy |
| delete | `using` |

- Roles: `anon` (not signed in) and `authenticated` (signed in), named with `to`. A policy without `to`
  applies to `public`, which includes `anon`. Anonymous sign-ins are `authenticated`, marked by the
  `is_anonymous` claim.
- Secret keys act as `service_role`, which bypasses RLS (when no user token is sent); keep them
  server-side, never in the browser. The JWT-style `service_role` key is the legacy form.
- Performance: index the columns policies filter on (only the leading column of a B-tree counts); write
  `(select auth.uid())` so the value is computed once per statement; add `to` roles; match fixed
  predicates with a partial index; use `security definer` functions with `search_path = ''` for checks
  that read other tables or would recurse.
- Event triggers can turn RLS on automatically for new tables.

## How to apply it here
- This site is static and has no database today. Use this note when a feature adds Supabase; the anon
  key may then sit in the Vite bundle, which is by design only if RLS covers every exposed table.
- Per table, write the access-pattern row first (who reads, who writes), then one policy per operation
  that encodes it, for example `using ((select auth.uid()) = user_id)` with an index on `user_id`.
- Put ownership in a NOT NULL `user_id uuid` column with a foreign key; never in user-editable metadata.
- Ship policies in the same versioned migration as the table, so a fresh database is never open.
- Checklist before calling a schema done:
  - [ ] RLS enabled on every table in an exposed schema
  - [ ] grants trimmed for `anon` and `authenticated`
  - [ ] separate select / insert / update / delete policies, each with `to`
  - [ ] policy columns indexed
  - [ ] tested as user A, user B and an anonymous visitor (expect 0 rows or `42501`), output recorded
- Hand the policy review to security-engineer; retention and consent questions go to privacy-compliance.

## Limits
- The page gives no measured speed-ups; it refers to a separate RLS performance guide (not read here).
- It does not say whether tables made in the Table Editor get RLS on by default (UNVERIFIED); always
  enable it in the migration yourself.
- Supabase key names and formats change over time (publishable / secret vs the legacy anon /
  service_role); confirm against the current API keys page before writing setup steps.
