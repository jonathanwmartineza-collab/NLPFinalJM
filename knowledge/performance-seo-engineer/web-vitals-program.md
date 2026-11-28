# Web Vitals: how the metrics are chosen, measured and changed

- Source: Web Vitals — https://web.dev/articles/vitals (accessed 2026-11-28)
- Publisher: Google (web.dev)
- Licence: CC-BY-4.0 (code samples Apache-2.0), stated in the page footer · Copy in repo: link only

Why this matters for performance-seo-engineer: the shared Core Web Vitals note gives the thresholds; this
note adds what the programme itself says about which tools give field versus lab numbers, how a "pass" is
judged, and how metrics change over time, so reports from this agent use the right method and words.

## Key facts
- Web Vitals: Google's initiative giving unified guidance on quality signals for user experience.
  Core Web Vitals: the subset that applies to every page and appears across Google's tools.
- Current Core Web Vitals and "good" targets:
  - LCP (loading) ≤ 2.5 s from when the page starts loading.
  - INP (interactivity) ≤ 200 ms.
  - CLS (visual stability) ≤ 0.1.
- Judge at the 75th percentile of page loads, segmented by mobile and desktop; a page passes when all
  three meet the target at that percentile.
- Lifecycle: experimental → pending → stable. Pending lasts at least six months. Stable metrics change
  at most once a year, with changes in the docs and changelog; a stable metric can still be retired.
- INP became pending in 2023 and a stable Core Web Vital in 2024, replacing FID.
- Field tools: Chrome User Experience Report (CrUX), PageSpeed Insights, Search Console's Core Web Vitals
  report, Chrome DevTools; the `web-vitals` JavaScript library measures the same way as these tools.
- Lab tools: Chrome DevTools and Lighthouse. Lighthouse cannot measure INP (no user interacts), so it uses
  Total Blocking Time (TBT) as the proxy. Lab data does not replace field data.
- Diagnostic metrics: TTFB and FCP help explain slow LCP (slow server, render-blocking resources); TBT
  helps catch interactivity problems but is not a Core Web Vital because it is lab-only.
- `web-vitals` usage: import `onLCP`, `onINP`, `onCLS` and pass each a callback (for example one that
  reports to analytics).

## How to apply it here
- Field data for `nlpfinaljm.netlify.app` may not exist in CrUX (low traffic). Then say "lab only" in the
  report, as the agent's rules require, and do not call it a Core Web Vitals pass.
- Lab runs: report LCP, TBT (as the INP stand-in) and CLS from Lighthouse mobile, median of 3.
- INP risks on this site come from clicks that start heavy work: "Run" in the NLP live box (Pyodide
  load), sending a chat message (WebLLM). Keep that work in the Web Workers so the main thread can paint
  the next frame quickly.
- CLS risks: loading, empty and error panels that change height; reserve space for them.
- LCP: the home hero text and the /nlp first panel; no model or Pyodide bytes may load before a click.
- Adding the `web-vitals` library would be a dependency and a data flow; the site has no analytics
  endpoint and a privacy rule, so it needs the privacy-compliance agent first. Use it locally in a test
  page or DevTools instead.
- Wording in reports: "field" only for CrUX, PageSpeed Insights field section or Search Console; anything
  from Lighthouse is "lab".
- Re-check this page once a year for metric changes (the programme's own cadence).

## Limits
- The page text states only the "good" targets; the needs-improvement and poor bands are in images
  (the shared note and the per-metric web.dev pages give them).
- No guidance on budgets for JS or images; those are the studio's own budgets.
- The page does not say how much traffic CrUX needs before a site appears (UNVERIFIED here).
