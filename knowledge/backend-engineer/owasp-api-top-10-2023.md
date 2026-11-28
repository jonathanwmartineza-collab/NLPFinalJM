# OWASP API Security Top 10 (2023 edition)

- Source: OWASP Top 10 API Security Risks – 2023 — https://api-security.owasp.org/editions/2023/en/0x11-t10/ (accessed 2026-11-28)
- Publisher: OWASP Foundation (OWASP API Security Project)
- Licence: CC-BY-SA-4.0 (stated on the project page https://owasp.org/www-project-api-security) · Copy in repo: link only

Why this matters for backend-engineer: every endpoint, webhook or password gate the agent designs must be
checked against these ten risks; the agent's own rule already cites risk #1. 2023 is the latest edition
listed on the project page on the access date.

## Key facts
- Edition: 2023, the second edition (the first was 2019). The project calls it an awareness document.
- API1:2023 Broken Object Level Authorization: any handler that takes an object id from the client must
  check that this caller may touch that object.
- API2:2023 Broken Authentication: flawed auth lets attackers steal tokens or impersonate users.
- API3:2023 Broken Object Property Level Authorization: merges 2019's Excessive Data Exposure and Mass
  Assignment; check access per field, both for reading and for writing.
- API4:2023 Unrestricted Resource Consumption: bandwidth, CPU, memory, storage and paid third-party
  calls (email, SMS, calls) per request; attacks cause denial of service or higher bills.
- API5:2023 Broken Function Level Authorization: unclear split between admin and normal functions.
- API6:2023 Unrestricted Access to Sensitive Business Flows: a flow (buying, posting a comment) can be
  automated and abused even with no code bug.
- API7:2023 Server Side Request Forgery: fetching a user-supplied URI without validation lets attackers
  reach internal targets, even behind a firewall or VPN.
- API8:2023 Security Misconfiguration: missed settings and skipped hardening across the stack.
- API9:2023 Improper Inventory Management: keep an inventory of hosts and deployed versions; old versions
  and debug endpoints stay exposed otherwise.
- API10:2023 Unsafe Consumption of APIs: data from third-party APIs is trusted more than user input;
  attackers target those integrations instead.

## How to apply it here
| Endpoint pattern the agent builds | Risks to check | Control |
|---|---|---|
| Contact form handler | API4, API6 | body size cap, per-IP rate limit, honeypot or challenge, timeout on the mail API |
| Password gate | API2, API4 | secret only in env vars, constant-time compare, lockout or rate limit |
| `GET /items/:id` | API1, API3 | load by id and owner; return an allow-listed set of fields |
| `PATCH` with a JSON body | API3 | zod schema with `.strict()` style unknown-key rejection; no role or price fields from the client |
| Admin route | API5 | separate role check on every handler, not hidden URLs |
| "Fetch this URL" feature | API7 | allow-list hosts, block private ranges, no redirects to new hosts |
| Payment or webhook callback | API10, API2 | verify the signature, re-fetch state from the provider, idempotency key |
| Preview and old deploys | API9, API8 | list live functions and versions; remove debug routes |
- Review order for a new endpoint: who may call it (API2, API5), on which object and fields (API1, API3),
  how often and how big (API4, API6), what it calls out to (API7, API10), and where it is deployed
  (API8, API9).
- This repo is a static site with no functions; apply the list when advising on a user's back end.

## Limits
- The list names risks; it is not a full testing guide (OWASP points to other projects for that).
- Per-risk pages hold examples and prevention steps; this note used only the summary page.
- A newer edition may appear later; recheck the project page before citing "latest".
