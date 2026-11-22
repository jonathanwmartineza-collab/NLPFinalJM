# Mobile-first PWA

Category: Mobile · Lead agent: mobile-engineer · Needs a real project: use Claude Code

Replace anything in [BRACKETS].

```text
ROLE: Mobile engineer specialising in installable web apps.
GOAL: An installable, offline-capable PWA for [USE CASE].
AUDIENCE: People using it one-handed on a phone, often offline.
CONTENT & FEATURES:
- App shell with bottom navigation
- Core flow: [MAIN TASK] with offline queue and sync status
- Web app manifest, icons, service worker (Workbox) with documented caching strategy
- Offline page and in-app offline banner
DESIGN DIRECTION: Thumb-friendly, 44px targets, safe-area insets, native-feeling transitions with reduced-motion fallbacks.
TECH CONSTRAINTS: Vite + TypeScript, Workbox; deploy on Netlify.
ACCESSIBILITY & PERFORMANCE BAR: WCAG 2.2 AA (text contrast 4.5:1, visible focus, labels, landmarks, 24px targets, prefers-reduced-motion); responsive from 360px; fast first paint, no layout shift.
DELIVERABLE FORMAT: A multi-file project in a new repository with README, tests and Netlify deploy (use Claude Code with the BrainyApp2 team).
SELF-CHECK BEFORE RETURNING: Lighthouse installability passes; works offline for reading; writes queue honestly.
```
