# Google SEO Starter Guide: what to do and what to ignore

- Source: SEO Starter Guide — https://developers.google.com/search/docs/fundamentals/seo-starter-guide (accessed 2026-11-28)
- Publisher: Google (Google Search Central)
- Licence: CC-BY-4.0 (code samples Apache-2.0), stated in the page footer · Copy in repo: link only

Why this matters for performance-seo-engineer: "How do I get my site to show up on Google?" is one of the
agent's example prompts, and the site in `web/` ships its own title, description, canonical, robots.txt
and sitemap. This is Google's own baseline for those choices.

## Key facts
- Check indexing with a `site:` search for the domain; Google finds pages mainly through links from
  other sites. A sitemap is optional but helps.
- Google must be able to fetch the same CSS and JavaScript a browser uses, or pages may not show or rank.
  Test with the URL Inspection Tool in Search Console.
- URLs: readable words describing the topic, not random ids. Group topics in directories on large sites.
  Do not reorganise a site just for SEO.
- Duplicates: one URL per piece of content; redirect other versions, or use `rel="canonical"` when a
  redirect is not possible. Duplicates are not a spam violation, only inefficient.
- Content: clear, organised with headings, original, up to date, written for people; think about the
  different words searchers use. Avoid ads or interstitials that block content.
- Links: descriptive anchor text; `nofollow` (or similar) on links you do not trust, and automatically on
  user-generated links.
- Title: unique, clear, concise and accurate `<title>` per page.
- Meta description: short and unique per page; Google may use it as the snippet or draw from the page.
- Images: sharp, near related text, with descriptive alt text. Videos: on their own page, near related
  text, with a descriptive title and description.
- Not worth focusing on: meta keywords (not used), keyword stuffing (against spam policies), keywords in
  domains or paths, TLD choice (country targeting only), content length, subdomain vs subdirectory,
  PageRank alone, a "duplicate content penalty", heading count and order (they help screen readers,
  not Search), E-E-A-T as a ranking factor (it is not one).
- Timing: changes can show in hours or take months; wait a few weeks before judging.

## How to apply it here
| Check | This repo (read 2026-11-28) | Action |
|---|---|---|
| robots.txt | `Allow: /` plus the sitemap URL | fine |
| sitemap.xml | lists /, /studio, /library, /nlp, /resources, /guide, /privacy | add /team if it should rank; keep in step with netlify.toml routes |
| `<title>` per route | `App.tsx` sets `document.title` per section | fine; keep titles unique |
| canonical | `web/index.html` hard-codes `https://nlpfinaljm.netlify.app/` for every route | flag: on /nlp it claims the home page is the preferred URL; set it per route or remove it |
| description | one static description for all routes | consider per-route text for /nlp |
| JS rendering | routes are client-rendered | confirm with URL Inspection that /nlp content is seen |
| Links | in-app links use real `<a href>` | keep; descriptive anchor text |
- Never add meta keywords or stuff "NLP", "NLTK", "spaCy" into copy; describe the Lab in plain words.
- Alt text: every chart or panel image on /nlp needs alt text that says what it shows.
- Raise the canonical issue with the frontend-engineer (owner of the page code) rather than editing
  `web/index.html` from this agent's advice alone.

## Limits
- A starter guide: it does not cover structured data, Open Graph, hreflang or JavaScript SEO details;
  those have their own Search Central pages.
- Ranking effects are not quantified.
- The table's repo column is from reading the files on the access date; recheck before acting.
