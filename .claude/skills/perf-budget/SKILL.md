---
name: "perf-budget"
description: "Use when making a site fast or checking it before launch: sets budgets for Core Web Vitals and asset sizes, measures with Lighthouse (median of 3), and lists the fixes that matter most."
---
# Performance budget

## Procedure
1. Budgets (p75, mobile): LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1; first-load JS ≤ 170 KB gzipped; CSS ≤ 50 KB; hero image ≤ 150 KB.
2. Measure: Lighthouse mobile, median of 3 runs, on the production build; record scores and the top opportunities.
3. Fix in order of impact: render-blocking resources, oversized JS (code-split routes, remove unused deps), images (modern formats, width/height set, lazy below the fold), fonts (system stack or `font-display: swap`, preconnect), long tasks (break up work, defer non-critical JS), layout shifts (reserve space).
4. Cache: hashed assets `Cache-Control: public, max-age=31536000, immutable`; HTML no-cache.
5. Re-measure and record before/after.

## Checklist
- [ ] Median-of-3 numbers recorded with the command used.
- [ ] Every budget met or a reason and plan written.
- [ ] No layout shift from fonts, images or late UI.

## Output template
| Metric | Budget | Before | After | Fix |
