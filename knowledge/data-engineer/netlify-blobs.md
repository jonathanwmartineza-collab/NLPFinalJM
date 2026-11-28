# Netlify Blobs: stores, keys, consistency and limits

- Source: Netlify Blobs — https://docs.netlify.com/build/data-and-storage/netlify-blobs/ (accessed 2026-11-28)
- Publisher: Netlify
- Licence: proprietary (publisher's terms) · Copy in repo: link only

Why this matters for data-engineer: Netlify Blobs is the first store to consider for this Netlify-hosted
studio, but it is a key-value store with last-write-wins and edge caching, so key design and the
consistency choice decide whether data stays correct.

## Key facts
- Package `@netlify/blobs`; exports `getStore`, `getDeployStore` and `listStores`.
- `getStore(name, { region, siteID, token })`: site-wide store, kept across deploys and shared by all deploy
  contexts. Region defaults to `us-east-2` and does not follow the functions region.
- `getDeployStore(name, { deployID, region, siteID, token })`: scoped to one deploy; deleting the deploy
  deletes it, and rollbacks keep it in step. Build plugins can write only to deploy-specific stores.
- Regions: `ap-southeast-1`, `ap-southeast-2`, `eu-central-1`, `us-east-1`, `us-east-2`. Changing region
  does not move data; pass `region` on every `getStore` call if you set one.
- Writes: `set(key, value, { metadata, onlyIfMatch, onlyIfNew })` (ArrayBuffer, Blob or string) and
  `setJSON(key, value, {...})`; both return `{ modified, etag? }`.
- Reads: `get(key, { consistency, type })` with type `text` (default), `arrayBuffer`, `blob`, `json` or
  `stream`; returns `null` when missing. `getWithMetadata` and `getMetadata` also return the `etag`.
- `list({ prefix, directories, paginate })`: pages of up to 1,000 entries, all pages fetched by default;
  `paginate: true` gives an async iterator. Use a trailing slash in `prefix` (`users/`).
- `delete(key)`, `deleteAll()` (returns `{ deletedBlobs }`).
- Consistency: eventual by default; updates and deletes reach all edge locations within 60 seconds.
  Opt in to strong reads per store (`consistency: "strong"`) or per `get`. The CLI is always strong.
- Concurrency: the last write wins; there is no locking or transaction. Conditional writes are the only
  guard: `onlyIfNew: true` (create only) and `onlyIfMatch: etag` (update only if unchanged). Check
  `modified` afterwards.
- Limits: store name max 64 bytes, no `/` or `:`; key max 600 bytes, not empty, no leading `/`; object
  max 5 GB; metadata max 2 KB. Some UTF-8 characters take 2 bytes.
- Access from Functions, Edge Functions, build plugins and the Netlify CLI; Go functions cannot use it.
- File-based uploads: files written to `.netlify/blobs/deploy` during the build are uploaded to the
  deploy store; committed files there are not uploaded; `$<file>.json` holds metadata.
- Blobs are encrypted at rest and in transit; not covered by Netlify's HIPAA-compliant offering.
- Local `netlify dev` uses a sandboxed store and cannot read production data.
- Site-wide stores have no built-in expiry; you write the cleanup yourself.

## How to apply it here
- This site is static: no Netlify Functions today. Any Blobs read or write needs a Function, Edge
  Function or build step, which is a design change to raise with software-architect first.
- Build-time data (like the NLP Lab's JSON) belongs in the published folder, not in Blobs; reach for a
  deploy store only if a build must hand data to a later Function.
- Key layout: one key per record, paths such as `users/{userId}/projects/{projectId}.json`; never one
  big JSON document that many writers rewrite.
- Decision table:

| Need | Choice |
|---|---|
| Read right after your own write | `consistency: "strong"` on that read |
| Create once, never overwrite | `set(..., { onlyIfNew: true })`, then check `modified` |
| Safe update of a shared record | read `etag`, write with `onlyIfMatch`, retry on `modified: false` |
| Counts, joins, reports across records | Postgres, not Blobs |
| Data that must expire | your own `deleteAll` / `delete` job (scheduled function) |

- Privacy: store the minimum; keep personal data out of keys (keys show up in listings and logs);
  never accept an arbitrary key from a visitor, as the docs advise.
- Test: write, read strongly, list with the prefix, and show the `modified` result for a conditional
  write that must fail.

## Limits
- The page gives no prices or plan limits for storage or requests; check the pricing page before
  promising capacity (UNVERIFIED here).
- No guidance on schema versioning of stored JSON; add a `version` field yourself.
- Upgrading from `@netlify/blobs` 6.5.0 or earlier needs the documented `netlify recipes blobs-migrate`
  step; the page does not say how long it takes.
