# OWASP Top 10:2025, and what changed since 2021

- Source: OWASP Top 10:2025 — https://top10.owasp.org/2025/ (accessed 2026-11-28)
- Supporting page: Introduction - OWASP Top 10:2025 — https://top10.owasp.org/2025/0x00_2025-Introduction/ (accessed 2026-11-28)
- Publisher: OWASP Foundation (OWASP Top 10 project)
- Licence: CC-BY-3.0 · Copy in repo: link only

Why this matters for security-engineer: the agent walks the Top 10 on every review. The 2025 list renumbers most
categories, so a finding labelled with a 2021 code (for example A06 for outdated packages) now points at the
wrong risk.

## Key facts
| 2025 | Category | 2021 position |
| --- | --- | --- |
| A01 | Broken Access Control (now includes SSRF) | 1 |
| A02 | Security Misconfiguration | 5 |
| A03 | Software Supply Chain Failures | widened from A06 Vulnerable and Outdated Components |
| A04 | Cryptographic Failures | 2 |
| A05 | Injection | 3 |
| A06 | Insecure Design | 4 |
| A07 | Authentication Failures (was Identification and Authentication Failures) | 7 |
| A08 | Software or Data Integrity Failures | 8 |
| A09 | Security Logging and Alerting Failures (was Logging and Monitoring) | 9 |
| A10 | Mishandling of Exceptional Conditions | new |
- A03 now covers compromise across dependencies, build systems and distribution infrastructure.
- A10 is new: 24 CWEs on improper error handling, logic errors and failing open.
- Method: 589 CWEs analysed (about 400 in 2021); the 10 categories hold 248 CWEs, 5 to 40 each, about 25 on
  average. About 175k CVE records were mapped to CWEs. Contributors supplied data on over 2.8 million applications.
- Ranking used prevalence (share of tested apps with at least one instance) plus exploitability and impact from
  CVSS v2 and v3 scores; CVSS v4 was not used.
- Eight categories come from data; A03 and A09 were promoted from the community survey.
- This is the eighth edition of the list.

## How to apply it here (static site, no functions, no accounts)
| Category | Where it bites in this repo | Check |
| --- | --- | --- |
| A01 | No accounts, but the sandboxed preview must not reach the app origin | `sandbox.html` header has no `allow-same-origin` |
| A02 | Headers and CSP in `netlify.toml` and the `index.html` meta tag | Response headers on a Deploy Preview |
| A03 | npm lockfile, Python build packages, WebLLM and Pyodide downloads | Lockfile review, pinned versions, `npm audit` output |
| A05 | Model output rendered as Markdown; generated pages | No raw HTML rendering; generated code only in the sandbox |
| A06 | Prompt injection paths through agent notes and user text | Threat model at each trust boundary |
| A08 | Build writes JSON the site trusts; model weights from outside hosts | Build output tests; fixed model IDs |
| A09 | No server logs; errors shown in the browser only | Errors are generic and never echo secrets |
| A10 | Model download or WebGPU failure, storage quota errors | App fails closed with a clear message, no half-loaded state |
- A04 and A07 are mostly "not applicable: no secrets, no sign-in"; say so explicitly in the report.
- Label every finding with the 2025 code; when quoting an older report, add the 2025 mapping beside it.
- Walk the separate OWASP Top 10 for LLM Applications for the chat features; it is a different list.

## Limits
- The index page gives titles only; descriptions, examples and CWE lists sit on each category page.
- Neither page states a release date or whether a later revision is planned.
- The licence was confirmed from the page footer (Creative Commons Attribution 3.0 Unported), not CC-BY-SA.
