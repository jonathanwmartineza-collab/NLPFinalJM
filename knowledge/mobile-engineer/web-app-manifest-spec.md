# Web Application Manifest: members and defaults

- Source: Web Application Manifest (W3C Working Draft) — https://www.w3.org/TR/appmanifest/ (accessed 2026-11-28)
- Publisher: W3C (Web Applications Working Group)
- Licence: W3C-20150513 (W3C Software and Document License; the spec's "permissive document license" link points to the 2023 edition of that licence) · Copy in repo: link only

Why this matters for mobile-engineer: making a web app installable starts with a correct manifest. The
spec says what each member means and, just as important, what a browser does when a member is missing
or wrong. The site in `web/` has no manifest yet (only `theme-color` meta tags in `web/index.html`).

## Key facts
- Status: W3C Working Draft on the Recommendation track, dated 18 November 2026; the spec says it is not
  stable and may change.
- File: JSON. Registered extension `.webmanifest`; media type `application/manifest+json` (any JSON
  type is accepted). Linked with `<link rel="manifest" href="...">`; it is fetched on every page load.
- Cross-origin manifests need CORS; credentials mode comes from the link's `crossorigin` attribute.
- Members:
  - `name`, `short_name`: full and short app name (localizable).
  - `start_url`: advisory launch URL, resolved against the manifest URL; must be same origin as the
    document, otherwise the document URL is used.
  - `id`: the app's identity. Absent or invalid → derived from `start_url` (fragment removed, same origin).
  - `scope`: which URLs belong to the app; one path only. Absent, empty or invalid → the start URL's
    directory (filename, query, fragment removed). If `start_url` is outside the given scope, the scope
    is dropped, not the start URL. Navigating out of scope returns to normal browser UI.
  - `display`: preferred display mode; trimmed and lowercased; missing or unknown → `"browser"`.
  - `orientation`: one of `any`, `natural`, `landscape`, `portrait`, `portrait-primary`,
    `portrait-secondary`, `landscape-primary`, `landscape-secondary`.
  - `icons`: image resources with `src`, `sizes` (for example `"192x192"`, space-separated list) and
    `type`; `purpose` includes `maskable` and `monochrome`.
  - `theme_color`: default theme colour; an in-scope `<meta name="theme-color">` may override it.
  - `background_color`: only for the loading moment; not used once the stylesheet is available.
  - `color_scheme_dark`: dark-theme overrides for `theme_color` and `background_color`.
  - `shortcuts`: items with name, description, URL and optional icons.
  - `dir`, `lang`, and `*_localized` per-language values.
- Colours are processed as sRGB; the alpha part may be ignored.
- UNVERIFIED: install prompt events (`beforeinstallprompt`, `appinstalled`) do not appear in the fetched text of
  this spec; where they are now defined was not confirmed on this page.

## How to apply it here
- If the owner asks for "installable": add `web/public/manifest.webmanifest` and a
  `<link rel="manifest">` in `web/index.html`. Minimum set: `name`, `short_name`, `id: "/"`,
  `start_url: "/"`, `scope: "/"`, `display: "standalone"`, `theme_color`, `background_color`, icons.
- Set `id` explicitly so a later `start_url` change does not create a "new" app on users' devices.
- Match the existing theme-color pair (light `#eef1f8`, dark `#0c0f1c`): use the light value for
  `theme_color`/`background_color` and put the dark ones in `color_scheme_dark`, or rely on the
  media-scoped meta tags that already exist.
- Keep `scope: "/"` so `/nlp`, `/team`, `/studio` and the other SPA routes stay inside the app window.
- The CSP in `web/index.html` sets `default-src 'self'`; a same-origin manifest needs no CSP change.
- Check the parsed result in Chromium DevTools → Application → Manifest before claiming it works.

## Limits
- The fetched text did not show the full display-modes list or the fallback chain, the default icon
  `purpose`, or the maskable safe-zone size; those are UNVERIFIED here (see the web.dev PWA note and
  the spec's linked definitions).
- A Working Draft can change; recheck member names before shipping.
- Browser support differs per member; the spec does not say what each browser implements.
