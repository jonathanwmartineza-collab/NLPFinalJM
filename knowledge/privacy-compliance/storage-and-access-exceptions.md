# Device storage without consent: the PECR exceptions

- Source: What are the exceptions? (Guidance on the use of storage and access technologies) — https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/what-are-the-exceptions/ (accessed 2026-11-28)
- Publisher: Information Commissioner's Office (UK regulator)
- Licence: OGL-UK-3.0 · Copy in repo: link only

Why this matters for privacy-compliance: the site stores chats, Studio pages, preferences and the model on the
visitor's device. Whether it needs a consent banner depends on whether each use fits an exception to the
consent rule. General information, not legal advice.

## Key facts
- The rules cover any technology that stores or reads information on a device, not only cookies.
- Five exceptions to the consent requirement:
  1. Communication: used solely to transmit a communication that could not happen without it
     (for example load-balancing session cookies).
  2. Strictly necessary: essential to provide the service the user requested, judged from the user's side.
     Likely examples: a shopping basket, a logged-in session, security for an activity the user asked for,
     session preferences not linked to a persistent identifier.
  3. Statistical purposes: solely aggregate statistics to improve the service, never identifying, tracking or
     profiling anyone. Likely examples: page visit totals, browser type, referrer, A/B tests, load speed.
     Not: individual visitor logs, ad tracking, linking visits to conversions, profiling.
  4. Appearance: solely adapting appearance or functionality to the user's preferences. Likely examples:
     remembering a chosen language, detecting dark mode, responsive design, external font libraries.
     Not: changing content based on inferred interests.
  5. Emergency assistance: locating a device only after a request for help.
- Any secondary purpose (advertising, cross-site tracking, social media tracking) removes the exception.
- Statistical and appearance exceptions need clear and comprehensive information about the purpose plus a simple,
  free way to object; without them, consent is needed. If someone objects, stop; browser settings alone are not enough.
- Third-party analytics fit the statistical exception only if the provider acts as a processor and only helps
  improve your service.

## How to apply it here
| Storage on this site | Likely exception | What the notice must say |
| --- | --- | --- |
| Chat history and Studio pages the visitor creates | Strictly necessary (a feature they use and asked for) | What is kept, where, and how to clear it |
| Theme, language or tier preference keys | Appearance | Purpose, plus a free way to object (the clear control) |
| Downloaded model in browser storage | Strictly necessary for the on-device chat they start | Size, location, how to delete it |
| Any future visit counter | Statistical, only if aggregate and with an objection route | Purpose, aggregate only, how to object |
| Any ad, pixel or cross-site tag | None | Needs prior consent: do not add |
- Keep every key free of persistent identifiers; an ID turns a preference into tracking.
- Font libraries from outside hosts count under appearance: disclose them and offer a way to object, or self-host.
- The "Free up space" and "Clear" controls are the objection and deletion route: keep them easy to find.
- Review trigger: any new key in `web/src/lib/storage.ts`, any new outside host, or any new embed means
  this table is re-checked before release.
- If a feature cannot fit an exception, the choice is consent before storage, or not building it.
- These rows are this repo's reading of the examples; label them "likely", as the ICO does.

## Limits
- UK rules under PECR; EU ePrivacy rules are similar in aim but were not read for this note.
- The page gives no localStorage or IndexedDB example and no last-updated date (page data shows 29 April 2026).
- It does not mention the Data (Use and Access) Act, though the wider guidance was revised for it: UNVERIFIED here.
