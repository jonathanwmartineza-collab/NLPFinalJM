# Core Web Vitals and performance budgets
Why this matters: speed affects conversion, accessibility on slow devices, and search ranking.

## Thresholds ("good" at the 75th percentile of page loads)
| Metric | Measures | Good | Poor |
|---|---|---|---|
| LCP (Largest Contentful Paint) | loading | ≤ 2.5 s | > 4 s |
| INP (Interaction to Next Paint) | responsiveness | ≤ 200 ms | > 500 ms |
| CLS (Cumulative Layout Shift) | visual stability | ≤ 0.1 | > 0.25 |

## Budgets we use
- First-load JS ≤ 170 KB gzipped; CSS ≤ 50 KB; hero image ≤ 150 KB; fonts: system stack or 1 family with `font-display: swap`.
- Lighthouse (mobile) median of 3 runs ≥ 90 for Performance, Accessibility, Best Practices, SEO.

## Usual fixes, by impact
1. Remove render-blocking resources; code-split by route.
2. Size and lazy-load images; set width/height to prevent shifts.
3. Break long tasks; defer non-critical JS.
4. Cache hashed assets immutably; HTML no-cache.

Sources: https://web.dev/articles/vitals (accessed 2026-11-21); https://web.dev/articles/inp (accessed 2026-11-21)
