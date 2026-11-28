# netlify.toml and the ignore-build command

- Source: File-based configuration — https://docs.netlify.com/build/configure-builds/file-based-configuration/ (accessed 2026-11-28)
- Supporting page: Ignore builds — https://docs.netlify.com/build/configure-builds/ignore-builds/ (accessed 2026-11-28)
- Publisher: Netlify
- Licence: proprietary (publisher's terms) · Copy in repo: link only

Why this matters for devops-engineer: this repo's whole Netlify setup (build command, Python and Node versions,
SPA redirects, security headers and the skip-the-build rule) lives in one netlify.toml, so every deploy question
starts by reading that file against these rules.

## Key facts
- The file is `netlify.toml`, normally in the repository root, which is the base directory by default.
- Settings in `netlify.toml` override the same settings in the Netlify UI.
- `[build]` keys: `base`, `publish`, `command` (run in Bash), `environment`, `processing`.
- `[build.environment]` sets build-time variables. Writing `key = "$VARIABLENAME"` does not inject a value.
- Variables with scopes must include the Builds scope to work in build settings.
- Netlify recommends the UI, not the file, for sensitive values, to keep them out of the repository.
- Deploy contexts: `[context.production]`, `[context.deploy-preview]`, `[context.branch-deploy]`, `[context.dev]`,
  and `[context.<branchname>]`, which is the most specific and wins.
- `[[redirects]]` fields: `from`, `to`, `status` (default 301), `force` (apply even if a file exists at `from`).
- `[[headers]]` fields: `for` (path) and a `[headers.values]` table of name/value pairs.
- Redirects and headers are global: they ignore deploy contexts wherever they sit in the file.
- Optional editor validation: `"$schema" = "https://open-api.netlify.com/netlify.schema.json"` (ignored in builds).

### Ignore builds (supporting page)
- Default: Netlify compares the base directory with the last known version and skips the build if nothing changed.
- `ignore` replaces that check with your own Bash or Node.js command, run from the base directory.
- Exit code `1` means changed, so the build continues. Exit code `0` means no change, so the build stops.
- Git metadata variables: `$CACHED_COMMIT_REF` (last deployed commit) and `$COMMIT_REF` (current commit).
- Paths in the command are relative to the base directory; a separate script file path should start with `./`.
- The ignore command never cancels a build started by a build hook, whatever its exit code.
- Node.js ignore commands run on Node.js 18 (fixed) and cannot use packages from `package.json`.

## How to apply it here
- This repo's `[build]` runs `node scripts/build-team.mjs && python3 nlp/build_nlp.py && npm run build`
  and publishes `web/dist`; check both paths still exist after any folder move.
- `[build.environment]` pins `NODE_VERSION = "22"` and `PYTHON_VERSION = "3.13"`; a version bump is a
  netlify.toml change, so it triggers a build on purpose.
- `ignore = "bash scripts/should-build.sh"`. The script:
  - reads the path list in `scripts/build-paths.txt` (web, scripts, .claude/agents, knowledge, nlp,
    requirements.txt, package files, netlify.toml and more);
  - exits 1 (build) when `CACHED_COMMIT_REF` is empty, equals `COMMIT_REF`, or is not in the clone;
  - exits 0 (skip) when `git diff --quiet` finds no change in those paths; otherwise exits 1.
- So a push that only touches `docs/` or `reports/` skips the build. A push touching `knowledge/` builds,
  because notes feed the site.
- When you add a top-level folder that ships to the site, add it to `scripts/build-paths.txt` in the same commit,
  or its changes will silently not deploy.
- The script path is written `bash scripts/should-build.sh`, not `./scripts/...`. Calling bash with a relative
  path works from the repo root; if a build ever reports the script missing, try the `./` form the docs show.
- The SPA routes are listed one by one with `status = 200` and no catch-all, so unknown paths return a real 404.
  Add a new route here when the app gains one.
- `/sandbox.html` has its own Content-Security-Policy header; `/assets/*` is immutable for a year;
  `version.json` and `team.json` are `no-cache`.
- To check a header change, deploy a preview and read the response headers there before merging.

## Limits
- The file page does not list `ignore` among the `[build]` keys; it only says the attribute exists.
- Neither page gives the order in which several matching headers or redirects apply (see Netlify's
  request processing order page).
- The pages do not say whether `[build.environment]` values reach functions at runtime (this site has none).
- Neither page says how a skipped build is shown in the UI or whether it uses credits: UNVERIFIED, not stated.
