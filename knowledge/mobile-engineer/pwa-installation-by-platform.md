# How PWA installation works on each platform

- Source: Installation (Learn PWA) — https://web.dev/learn/pwa/installation (accessed 2026-11-28)
- Publisher: Google (web.dev)
- Licence: CC-BY-4.0 (code samples Apache-2.0), stated in the page footer · Copy in repo: link only

Why this matters for mobile-engineer: "make it installable on iPhone and Android" means different things
on each platform. This page lists what each browser and OS does with an installed web app, which sets
what the agent can honestly promise.

## Key facts
- Most browsers that install web apps require a Web App Manifest with the app name and the installed
  experience settings. Chrome has its own criteria (separate web.dev article); users can still install
  in Chrome when a site fails them.
- Safari on macOS does not support installability (as stated on the page).
- Desktop Chrome and Edge (Windows, macOS, Linux, ChromeOS): install badge in the address bar; only
  `standalone` and `minimal-ui` display modes. Installed apps get a launcher/dock icon, appear in app
  search, can use the Badging API and App Shortcuts. Chromium lists them at `about:apps`.
- iOS and iPadOS: there is no browser install prompt. Users add a "home screen web app" from the
  Share menu with Add to Home Screen.
- iOS icon: add `<link rel="apple-touch-icon">` in `<head>`; without it the home-screen icon is a
  screenshot of the page.
- iOS display: only `standalone`; `minimal-ui` falls back to a plain browser shortcut and `fullscreen`
  falls back to `standalone`. No badging and no app shortcuts.
- iOS lets the same app be installed several times, each copy with its own isolated storage.
- Android has three install types:
  - WebAPK: Chrome on devices with Google Mobile Services, Samsung Internet on Samsung devices; supports
    badging, shortcuts, link capture and icon/metadata updates.
  - Shortcuts: Firefox, Edge, Opera, Brave, and Samsung Internet on other devices; Chrome falls back to
    this too. No launcher icon in the app drawer, no metadata updates.
  - QuickApps: some Huawei and ZTE devices.
- Installed apps open in their own window and can unlock capabilities a tab lacks.
- Only Chromium browsers on desktop and Android can show an install dialog triggered by the app itself.
- Stores: Google Play via Trusted Web Activity, Apple App Store via WKWebView with App-Bound Domains,
  Microsoft Store via APPX, Samsung Galaxy Store via WebAPK, Huawei AppGallery via QuickApp. Tools named:
  BubbleWrap CLI and PWA Builder.

## How to apply it here
| User's device | What to build | What to tell them |
|---|---|---|
| Android, Chrome | manifest + icons; optional in-app install button | installs as a WebAPK app |
| Android, Firefox/others | same manifest | becomes a home-screen shortcut |
| iPhone/iPad | manifest + `apple-touch-icon` (180×180 per the agent's PWA rules) + `display: "standalone"` | Share → Add to Home Screen; no prompt |
| Windows/macOS/Linux, Chrome or Edge | manifest | install icon in the address bar |
| Mac, Safari | nothing extra | not installable from Safari (per this page) |
- Never show a custom "Install" button on iOS; show Share → Add to Home Screen steps instead.
- Store listing wanted: wrap the PWA (Trusted Web Activity for Play) before choosing Capacitor or Expo.
- This site's WebLLM model cache lives in browser storage; tell iOS users that each home-screen copy has
  separate storage, so a second install downloads the model again.

## Limits
- The page links out for Chrome's exact install criteria and the install-prompt event; this note does not
  restate them.
- It does not say which iOS version lets browsers other than Safari add web apps (UNVERIFIED).
- No mention of service worker requirements or offline behaviour; see the agent's offline rules.
