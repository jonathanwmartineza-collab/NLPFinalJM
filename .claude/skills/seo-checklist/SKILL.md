---
name: "seo-checklist"
description: "Use when a public page must be findable and share well: titles and descriptions, headings, canonical URLs, Open Graph/Twitter cards, robots and sitemap, structured data and crawlable content."
---
# SEO checklist

## Procedure
1. One unique `<title>` (≤ 60 chars) and meta description (≤ 155 chars) per page, written for people.
2. One h1 matching intent; logical h2/h3; descriptive link text.
3. Canonical URL; `lang` attribute; mobile viewport.
4. Open Graph (og:title, og:description, og:image 1200×630, og:url) and `twitter:card`.
5. `robots.txt` (allow public pages; disallow `/api/`) and `sitemap.xml` for public routes.
6. Structured data (JSON-LD) where it fits: Organization, WebSite, SoftwareApplication, FAQ.
7. Content is server-rendered or present in the HTML for key pages; SPAs at least ship meaningful title/description/OG in index.html.
8. Performance and accessibility count: fast, accessible pages rank and convert better.

## Checklist
- [ ] Title, description, canonical and OG present and unique.
- [ ] robots.txt and sitemap.xml valid; private areas excluded.
- [ ] Lighthouse SEO ≥ 90.

## Output template
| Page | Title | Description | Canonical | OG image | Issues |
