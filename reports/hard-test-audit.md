# Hard-test audit before practitioner and professor testing (2026-11-26)

Branch `claude/hard-test-audit`, built on `b5e4eaa` (the live commit). Not shipped: waiting for the owner's go-ahead.

## Evidence

| Check | Result |
|---|---|
| Gates (`./scripts/gates.sh`, Chrome) | 11/11 PASS: 61 end-to-end + axe tests, 20 unit tests |
| Firefox, WebKit (Safari stand-in), iPhone 15 and Pixel 7 emulation (`PW_ALL_BROWSERS=1`) | 244/244 PASS (61 tests × 4). The first run on the live build failed 43: product bugs 1, 5, 6 below plus test-portability issues |
| Hostile input and failure paths (`tests/e2e/hostile.spec.ts`, 15 tests) | PASS in all five browsers |
| Security headers and CSP (live) | HSTS with preload, nosniff, X-Frame-Options, Referrer-Policy, Permissions-Policy; strict CSP (no bare `*`); sandbox page: opaque origin, no network |
| Slow 3G + 4× CPU (live) | Was a blank page for 5–8 s; now a loading message (bug 8) |
| Lighthouse | **NOT RUN.** Local run blocked by session permissions; PageSpeed Insights API returned "quota exceeded" |
| Real model, real Safari, real phones, screen readers | **NOT RUN** (no GPU or devices here). See `docs/real-model-test-script.md` |

## Bugs (ranked), all fixed on the branch

| # | Severity | Bug | Steps to reproduce (before the fix) |
|---|---|---|---|
| 1 | High | Firefox: the model download froze at 0% "Starting…" while Firefox's storage-permission prompt was open (the app waited for `navigator.storage.persist()`). | Firefox with WebGPU → any expert → Download. |
| 2 | High | Free up space (or Delete models) while an answer was generating left the AI "still answering" for the rest of the session: the worker was terminated but the stream was never ended. A hung worker after the 90 s watchdog did the same. | Real model → ask a long question → Clear options → Free up space → confirm → ask again. |
| 3 | Medium | A full disk was reported as "Your device ran out of graphics memory" with a "Use the Lite model" button. | Fill the disk → Download a model. |
| 4 | Medium | About half of the expert principles sent to the on-device model (and copied by "Copy this expert's prompt") were cut off mid-sentence; some told the browser model to make "Agent calls" or "Use Read". | Read `web/src/ai/_generated/agents.json`: e.g. "(4.1.1 Parsing is obsolete and". |
| 5 | Medium | Double-clicking Send stopped the answer at once (the second click landed on Stop). | Type a question → double-click Send. |
| 6 | Medium | Studio: Clear, then a quick Undo, then reload could lose the restored page (the delete could run after the restore). | Studio → generate → Clear options → Clear → Undo → reload (seen in WebKit). |
| 7 | Medium | HTML tags in answers vanished silently: "Use `<button>` instead of `<div>`" written without backticks showed as "Use instead of". | Ask the front-end expert about buttons on a small model. |
| 8 | Low–Medium | On slow connections the page was blank for 5–8 s. | Slow 3G → open the site. |
| 9 | Low | A question interrupted by a reload stayed unanswered with no explanation. | Ask → reload during the answer. |
| 10 | Low | Switching experts mid-answer could make the next question fail with "The AI is still answering". | Ask a long question → pick another expert → ask at once. |
| 11 | Low | A very long paste was cut to 4,200 characters silently; only a counter showed. | Paste 50,000 characters into the chat box. |
| 12 | Low | "Read answers aloud" kept talking after leaving the expert's page. | Turn on read-aloud → ask → switch page while it speaks. |
| 13 | Low | Free up space could stay on "Freeing space…" if a step threw. | Code review (no repro needed). |

Expert content (fixed): the security expert had no "authorised testing only" caveat; the DevOps expert stated
Netlify pricing without a date; the UX researcher stated the "5 participants" rule without its limits.

Checked and fine: scripts, `onerror` images, iframes and `javascript:` links in answers never run; prompt-injection
text is answered as a normal question; emoji, Arabic, Hebrew and long unbroken words fit at 390 px; empty and
whitespace sends do nothing; a second tab explains that the AI runs in the other one; a lost GPU, an interrupted
download (retry resumes), going offline (a loaded model keeps answering) and a failed team-data load all show clear
messages.

## Enhancements (need a decision)

1. **Lighthouse**: run https://pagespeed.web.dev on the live URL (mobile and desktop), or allow Lighthouse in this environment.
2. **Netlify badge script**: blocked by the CSP and logs one console error per page. Turn it off in the Netlify dashboard, or leave it.
3. **CSP as an HTTP header** (netlify.toml) instead of a meta tag: allows `frame-ancestors` and covers the 404 page.
4. **Tell visitors when saving fails** (browser storage full): chats are not saved today and nothing says so.
5. **Keep the team-chat question across a reload** (only finished team answers are saved).
6. **Differentiate QA and Red Team wording**: both say "Evidence or it did not happen".
7. **Guide note** explaining why experts may recommend server-side AI (Claude API) for the visitor's own apps while this site runs on-device.
8. **Manual contrast check on a projector**: axe cannot measure contrast through frosted glass (it reports "incomplete"); tokens were checked by hand.
9. **Add the cross-browser projects to CI** (they need `npx playwright install firefox webkit` and system libraries).
