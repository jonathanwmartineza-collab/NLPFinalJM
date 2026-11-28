# One error shape for HTTP APIs (RFC 9457 Problem Details)

- Source: RFC 9457: Problem Details for HTTP APIs — https://www.rfc-editor.org/rfc/rfc9457.html (accessed 2026-11-28)
- Publisher: IETF (published by the RFC Editor)
- Licence: proprietary (publisher's terms: IETF Trust Legal Provisions; code components BSD-3-Clause) · Copy in repo: link only

Why this matters for backend-engineer: the agent's rule is "one consistent error shape; never leak
internals". RFC 9457 is the IETF standard for exactly that, so any endpoint this studio designs for a
user's app should use it instead of inventing a format. (This repo itself has no endpoints.)

## Key facts
- Status: IETF Standards Track, July 2023. It obsoletes RFC 7807.
- Format: a JSON object served as `application/problem+json` (XML form: `application/problem+xml`).
- Members (a member with the wrong JSON type must be ignored by consumers):
  - `type` (string, URI reference): the primary identifier of the problem type. Absent means
    `about:blank`. Absolute URIs are recommended; consumers should not auto-dereference it.
  - `status` (number): advisory copy of the HTTP status; it must equal the real response status.
  - `title` (string): short summary of the type; stays the same between occurrences except for
    localization.
  - `detail` (string): explanation of this occurrence, aimed at helping the client fix it, not at
    debugging. Clients should not parse it for data.
  - `instance` (string, URI reference): identifies this occurrence; may be an opaque id.
- Extension members are allowed; clients must ignore ones they do not recognise. Names should start with
  a letter, use letters, digits and underscores only, and be at least 3 characters.
- Multiple problems of the same type: one response with an extension array. The spec's 422 validation
  example uses `errors: [{ detail, pointer }]`, where `pointer` is a JSON Pointer (RFC 6901) into the
  request body. With different types, return the most relevant or urgent one.
- `about:blank` means "nothing beyond the status code"; its title should be the standard status phrase.
- Defining a new type must document: a type URI, a short title, and the status code. It may say to send
  `Retry-After`. The type URI should resolve to human-readable documentation.
- Do not create a type for generic cases a status code already explains (a plain 403 is enough).
- Security: never expose implementation details such as stack dumps through problem details.
  Proxies and firewalls ignore the `status` member, so the real status code must be right.

## How to apply it here
- Template for a validation failure (matches the agent's zod pattern):
  `422`, `Content-Type: application/problem+json`,
  `{ "type": "https://<app>/problems/validation", "title": "Your request is not valid", "status": 422,
  "errors": [{ "detail": "must be an email", "pointer": "#/email" }] }`.
- Map zod issues: `issue.path` → `pointer` (`"#/" + path.join("/")`), `issue.message` → `detail`.
- Body too large: `413` with `about:blank` or a `too_large` type; rate limited: `429` with `Retry-After`.
- Upstream failure: log the real error server-side; return a generic `detail` and an `instance` id the
  user can quote to support. No upstream bodies, no stack traces.
- Keep `title` fixed per type; put the variable text in `detail`.
- Front end reading errors: branch on `type` and `status`, never on `detail` wording.
- This repo is a static site (CLAUDE.md: no Netlify Functions, no server, no secrets). Use this note
  when advising on a user's app, not to add an endpoint here.

## Limits
- The RFC defines the format only; it does not say which status code to use for which case (that is
  HTTP Semantics, RFC 9110) or define 429 (RFC 6585).
- The `errors` + `pointer` shape is an example in the RFC, not a registered standard extension.
- Licence: RFC text is under the IETF Trust Legal Provisions (not an open content licence); only code
  components carry the Revised BSD licence. Link, do not copy.
