---
name: "pwa-checklist"
description: "Use when building a mobile-first or installable web app: manifest, service worker caching strategy, offline states, touch targets, safe areas, performance on mid-range phones, and when to go native instead."
---
# PWA checklist

## Procedure
1. Manifest: name, short_name, icons (192, 512, maskable), start_url, display standalone, theme/background colours.
2. Service worker (Workbox): precache the shell; network-first for HTML, stale-while-revalidate for assets, cache-first for fonts/images with limits; versioned caches.
3. Offline: an offline page and in-app offline banner; queue writes and retry; never pretend a write succeeded.
4. Touch: targets ≥ 44px where possible (WCAG minimum 24px), no hover-only actions, `env(safe-area-inset-*)` padding, `inputmode` and `autocomplete` on fields.
5. Performance on a mid-range phone: JS ≤ ~170 KB gzipped for first load, LCP ≤ 2.5 s, INP ≤ 200 ms.
6. Go native (Expo) when you need background tasks, deep OS integration, push on all iOS versions, or app-store presence.

## Checklist
- [ ] Lighthouse PWA/installability checks pass.
- [ ] Works offline for core reading tasks; writes are queued honestly.
- [ ] Usable one-handed at 360px.

## Output template
Manifest · Caching table (route · strategy · max age) · Offline UX · Native-or-not decision
