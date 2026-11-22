# Skills matrix

Generated from agent `skills:` lists. ✓ = preloaded into that agent. Third-party skills are marked † (see skills-lock.md).

| Skill | Description | Used by |
|---|---|---|
| adr-writer | Use when an architectural or technology decision is made: records it as a short Architecture Decision Record with context, options, decision, consequences and verified limits. | Marco |
| api-design | Use when designing or reviewing an HTTP API or serverless endpoint: resource shapes, validation with schemas, errors, auth, idempotency, pagination, rate limits and versioning. | Diego, Felix |
| brand-brief | Use when a product needs an identity: writes positioning, naming options, brand personality, voice, visual direction (palette, type, imagery, logo concept as simple SVG) and the landing-page story. | Valentina |
| competitor-teardown | Use when positioning or designing against existing products: tears down 3–5 competitors' onboarding, core flow, pricing, UX strengths and weaknesses, and finds the gap to win on. | Ravi |
| data-modeling | Use when designing or changing how an app stores data: new entities, a schema, a Netlify Blobs key layout, Postgres or Supabase tables, migrations, retention or a storage choice | Felix |
| design-tokens | Use when a product needs a consistent visual foundation: defines colour, type, spacing, radius, shadow and motion tokens in W3C Design Tokens-style JSON and CSS variables, with light and dark themes and verified contrast. | Lena, Kai |
| docs-style | Use when writing READMEs, guides, resources pages or release notes: a plain-language style and structure that a busy, non-expert reader can follow on the first read. | Milo |
| experiment-design | Use when deciding between product options with data: writes a hypothesis, picks the metric, estimates sample size and duration, defines guardrails and the decision rule for an A/B test or a lightweight experiment. | Lucas |
| frontend-design † | Guidance for distinctive, intentional visual design when building new UI or reshaping an existing one | Valentina, Kai |
| game-loop | Use when building or fixing a browser game, canvas or WebGL animation, simulation or any real-time interactive piece that must run smoothly on phones and desktops | Juno |
| grill-me † | A relentless interview to sharpen a plan or design. | user-invoked (/grill-me) |
| handoff † | Compact the current conversation into a handoff document for another agent to pick up. | user-invoked (/handoff) |
| llm-feature-safety | Use when building or reviewing any feature that calls an AI model: prompt-injection defences, output sanitising, sandboxing generated code, spend controls, server-chosen parameters and privacy-safe logging. | Quinn, Rhea |
| metrics-plan | Use when a product or feature needs success measurement: defines a north-star metric, input metrics, guardrails, funnel events and a privacy-friendly tracking plan. | Lucas |
| microcopy-review | Use when reviewing or writing interface text: buttons, labels, errors, empty states, confirmations and onboarding | Jonah |
| motion-guidelines | Use when adding animation or micro-interactions: defines purposeful motion (feedback, orientation, continuity), durations, easing, choreography and reduced-motion fallbacks. | Sasha |
| netlify-deploy-check | Use after a Netlify deploy or when one fails: reads the deploy log, verifies build settings, functions, rate-limit rules, environment variables (names only), headers and routing on the live site, and proposes the smallest fix. | Tess |
| netlify-functions | Use when writing or reviewing Netlify Functions: modern handler and config, routing with config.path, streaming responses within the 60-second limit, environment variables and secrets, Blobs, AI Gateway and code-based rate limits. | Diego, Tess |
| one-shot-build | Use when someone wants a complete web page or small app delivered in one pass (landing page, dashboard, game, tool, portfolio) | Juno, Zara, Sage |
| one-shot-spec | Use when an idea must become a buildable spec before a one-shot build or a Claude Code project: turns a one-line brief into users, screens/sections, content, features, states, design tokens and acceptance criteria (JSON + short markdown). | Maya, Iris, Sage |
| perf-budget | Use when making a site fast or checking it before launch: sets budgets for Core Web Vitals and asset sizes, measures with Lighthouse (median of 3), and lists the fixes that matter most. | Arjun |
| personas-jtbd | Use when a product needs to be grounded in real users: produces evidence-based proto-personas, jobs-to-be-done statements, a journey map with pain points, and a short usability-test script. | Ravi |
| prd-writer | Use when an app or feature idea needs a product requirements document: problem, users, jobs-to-be-done, MVP scope, user stories with acceptance criteria, success metrics, risks and out-of-scope. | Maya |
| privacy-checklist | Use when a product collects, stores or sends any personal data, uses AI, or adds analytics, cookies or voice: data inventory, minimisation, consent, notices, storage disclosure, AI disclosure and licences | Amara |
| prompt-evals | Use when a prompt, agent system prompt, model choice, tool definition or retrieval setup is created or changed and you must prove it got better, not worse | Quinn, Sage |
| pwa-checklist | Use when building a mobile-first or installable web app: manifest, service worker caching strategy, offline states, touch targets, safe areas, performance on mid-range phones, and when to go native instead. | Hana |
| release-gate | Use when a deliverable, plan or release must be approved: scores it against its requirements with pass / partial / fail, separates blockers from notes, and enforces the evidence rule (no check counts without its command and output). | Owen, Nova, Morgan |
| security-review | Use when reviewing an app before release or after risky changes: threat model plus OWASP Top 10 and LLM Top 10 checks, secrets scan of the build output, headers/CSP, cookies, rate limits and dependency audit, with evidence. | Rhea |
| seo-checklist | Use when a public page must be findable and share well: titles and descriptions, headings, canonical URLs, Open Graph/Twitter cards, robots and sitemap, structured data and crawlable content. | Arjun |
| skill-creator † | Create new skills, modify and improve existing skills, and measure skill performance | Orion |
| source-notes | Use when filling or refreshing an agent's knowledge folder: writes short, accurate notes from primary sources in your own words, with URLs and access dates, an index README, and a 60-day freshness review. | Elise |
| stack-selector | Use when choosing technology for a new app of any kind: picks a boring, proven stack by app type, notes whether it fits Netlify, and lists the alternatives and trade-offs. | Hana, Marco |
| team-routing | Use when a request is addressed to the whole studio, spans more than one discipline, or it is unclear which experts should answer | Nova |
| test-plan | Use when a feature, fix or release needs to be proven working: writing a test plan, adding unit (Vitest), end-to-end (Playwright) or accessibility (axe) tests, or running quality gates | Ivy |
| ui-polish-pass | Use when a screen works but doesn't feel finished: runs a concrete polish pass on spacing rhythm, type scale, alignment, hierarchy, states, focus, motion and dark mode, and returns precise fixes. | Sasha, Kai |
| ux-flow-and-states | Use when designing or reviewing how a product works: produces information architecture, task flows, and a state inventory (empty, loading, partial, error, success, offline, permission) with copy for each, checked against Nielsen's heuristics. | Iris |
| validate-team | Use when adding or changing agents or skills: runs npm run validate:team and check:skills, explains each failure, fixes it, and follows the checklist for adding a new expert end to end. | Orion |
| vercel-composition-patterns † | React composition patterns that scale | Lena, Zara |
| vercel-react-best-practices † | React and Next.js performance optimization guidelines from Vercel Engineering | Zara |
| voice-and-tone | Use when a product needs a consistent way of speaking: defines voice principles, a tone map by situation (success, error, waiting, onboarding), word list and do/don't examples. | Jonah |
| wcag-22-audit | Use when checking accessibility: audits a page or component against WCAG 2.2 AA with keyboard, screen-reader and automated (axe) checks, and reports each issue with criterion, severity, location and an exact fix. | Noor |
| web-design-guidelines † | Review UI code for Web Interface Guidelines compliance | Noor, Morgan |
| webapp-testing † | Toolkit for interacting with and testing local web applications using Playwright | Ivy |
