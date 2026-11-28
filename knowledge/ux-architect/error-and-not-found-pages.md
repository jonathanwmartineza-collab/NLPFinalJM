# Designing "problem with the service" and "page not found" states

- Source: There is a problem with the service pages — https://design-system.service.gov.uk/patterns/problem-with-the-service-pages/ (accessed 2026-11-28)
- Supporting: Page not found pages — https://design-system.service.gov.uk/patterns/page-not-found-pages/ (accessed 2026-11-28)
- Publisher: GOV.UK Design System, Government Digital Service (UK)
- Licence: OGL-UK-3.0 · Copy in repo: link only

Why this matters for ux-architect: this site has a static /404 page and several things that can fail
without warning (the WebLLM model download, the Pyodide worker, a JSON fetch). These two tested
patterns give a ready structure for the error and not-found rows of every state inventory.

## Key facts: problem with the service (unexpected error)
- Use one page for all unexpected problems; log every error and fix it quickly; show the page only briefly.
- If the problem cannot be fixed quickly, close the service and show a service unavailable page instead.
- Page title: "Sorry, there is a problem with the service" followed by the service name.
- H1: "Sorry, there is a problem with the service". Body: a plain sentence telling people to try again later.
- If the person was partway through a task, say what happened to their answers.
- Add contact details only if they exist and meet a user need; add a link to another service if
  people can finish their task there.
- Avoid: breadcrumbs, jargon such as "500" or "bad request", "We are experiencing technical
  difficulties", and red warning text.
- Keep what people already entered for a reasonable period so they can resume with answers filled in.
- Research (5 users) found two needs: knowing when it will work again (often unknowable) and
  knowing how to finish the task another way (the page can meet this one).

## Key facts: page not found
- Use when a page does not exist: a broken link or button, or a mistyped or partly copied address.
- Test all links and make sure old addresses redirect to pages that exist.
- Page title "Page not found" plus the service name; H1 "Page not found".
- Keep it clear and concise; do not blame the person.
- Avoid: breadcrumbs, "404" or other jargon, informal or humorous words such as "oops", red text.
- Example content: if you typed the address, check it is correct; if you pasted it, check you
  copied the whole address; otherwise contact the service if you need help.

## How to apply it here
| Failure in this repo | Pattern to base the state on | Must say |
|---|---|---|
| Unknown route (static 404 page) | Page not found | Check the address; link to home or library |
| WebLLM model fails to download or start | Problem with the service, scoped to chat | Try again later; the NLP Lab still works |
| Pyodide worker or NLTK data fails to load | Problem with the service, scoped to the live box | Static NLTK and spaCy panels still work |
| Static JSON (`nltk.json`, `spacy.json`) fails to fetch | Problem with the service, scoped to the panel | Reload; nothing the visitor typed is lost |
- For every in-page failure, keep the text the visitor typed in the box (the "saving data" rule)
  and give one primary action: Try again.
- Offer the other working route, the equivalent of "link to another service".
- Error copy wording belongs to the content designer; you define where it appears and what action follows.

## Limits
- Both patterns are written for full-page server errors on government services; scoping them to
  one panel of a static site is an adaptation (mark it ASSUMPTION in specs).
- The not-found page does not mention a search box or a home link; adding one is our choice.
- Neither page covers offline states, permission errors or browser-capability failures (for
  example no WebGPU); design those separately.
