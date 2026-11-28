# How the Lighthouse Performance score is calculated

- Source: Lighthouse performance scoring — https://developer.chrome.com/docs/lighthouse/performance/performance-scoring (accessed 2026-11-28); supporting page from the same publisher: Introduction to Lighthouse — https://developer.chrome.com/docs/lighthouse/overview/ (accessed 2026-11-28)
- Publisher: Google (Chrome for Developers)
- Licence: CC-BY-4.0 (code samples Apache-2.0), stated in the page footer · Copy in repo: link only

Why this matters for performance-seo-engineer: the studio budget is "Lighthouse mobile, median of 3,
Performance ≥ 90". Knowing the weights and the curve tells the agent which metric to fix first and why a
single run is not evidence.

## Key facts
- Lighthouse audits a page for performance, accessibility, SEO and more; it runs in Chrome DevTools, from
  the command line, or as a Node module, and Lighthouse CI can block regressions (overview page).
- The Performance score is a weighted average of metric scores; Opportunities and Diagnostics do not
  count directly (they only help by improving metrics).
- Weights in Lighthouse 10:
  | Metric | Weight |
  |---|---|
  | Total Blocking Time (TBT) | 30 % |
  | Largest Contentful Paint (LCP) | 25 % |
  | Cumulative Layout Shift (CLS) | 25 % |
  | First Contentful Paint (FCP) | 10 % |
  | Speed Index (SI) | 10 % |
- Lighthouse 8 differed: CLS 15 % and Time to Interactive 10 %; TTI is gone in version 10.
- Each raw metric becomes a 0–100 score on a log-normal curve from HTTP Archive data: the 25th
  percentile of real sites maps to 50, the 8th percentile to 90. Example: LCP about 1,220 ms scores 99.
- Between 50 and 92 the score moves almost linearly; above about 96, each point costs much more.
  Going from 99 to 100 takes about as much improvement as from 90 to 94.
- Bands: 0–49 red (poor), 50–89 orange (needs improvement), 90–100 green (good).
- Desktop has its own curves since Lighthouse v6; do not compare desktop and mobile scores.
- Scores vary run to run: A/B tests and changing ads, network routing, different devices, browser
  extensions, antivirus. Treat performance as a distribution, not one number.
- The Lighthouse scoring calculator shows which metric values give a target score.

## How to apply it here
- Fix order when Performance < 90: TBT first (30 %), then LCP and CLS (25 % each), then FCP and SI.
- TBT on this site comes from main-thread JavaScript on load; keep WebLLM and Pyodide out of the initial
  route (they start only after a click) and split heavy pages with `React.lazy`.
- Run in a clean profile (no extensions), against the production build (`npm run build` then a preview
  server, or the live URL), mobile preset, 3 runs, report the median and all three values.
- Report each metric value, not only the score, so a change can be traced to a weight.
- A 99 → 100 chase is not worth a budget exception; stop at the budget.
- If DevTools shows the Lighthouse panel moved or changed, run the CLI instead; scoring is the same.

## Limits
- The scoring page's own last-updated date could not be confirmed; it lists Lighthouse 10 weights, so
  check the current Lighthouse version's weights in its scoring calculator before quoting them
  (UNVERIFIED for any version after 10).
- The page does not cover the Accessibility, Best Practices or SEO category scoring.
- Lab scores do not prove field Core Web Vitals (see web-vitals-program.md).
