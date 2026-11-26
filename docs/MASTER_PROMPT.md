# BrainyApp2: master build prompt (v2, audited)

> **Changing the live project?** Use `docs/OPERATING_MANUAL.md` (or the `ship-change` skill): it turns any request into a tested push and a verified Netlify deploy. This file is the original build specification; its hard constraints (§3) still apply to every change.

BrainyApp2 is the free, public edition of the BrainyApp agent studio. It has the same expert team and the same website (team chat, "Ask the whole team", One-shot Studio, Prompt Library, guides), but every AI answer is generated **inside the visitor's own browser** by a free open model (WebLLM on WebGPU). There are no API keys, no server-side AI, no password and no per-answer cost.

**Do the model files need to be downloaded and uploaded to Netlify?** No. Each visitor's browser downloads the chosen model directly from Hugging Face the first time they turn the AI on (after they click to agree), then keeps it cached. Netlify only hosts a small static site.

---

## 1. Audit of v1 and what changed

| # | v1 flaw or missed opportunity | Severity | Fix in v2 |
|---|---|---|---|
| 1 | Linked to the owner's private, paid edition of the studio (README, Resources page, Quick answers). | Blocker | All links and mentions are removed. A gate fails the build if the private site's address appears in `web/dist`. |
| 2 | Offered Qwen2.5-3B as the "Quality" model. Its licence is Qwen Research (non-commercial). | Blocker | Tiers now use only permissive licences: Lite = Llama-3.2-1B (Llama 3.2 Community Licence, "Built with Llama"), Balanced = Qwen2.5-1.5B (Apache-2.0), Quality = Phi-4-mini (MIT). Licences are shown next to the picker. |
| 3 | Model IDs were left for the builder to guess. | High | IDs, sizes and hosts were checked in the pinned `@mlc-ai/web-llm@0.2.89` `prebuiltAppConfig.model_list`. A unit test fails if any ID is missing from the installed package. |
| 4 | Told the builder "never use a wildcard" in the CSP, but model downloads redirect to changing `*.hf.co` CDN hosts. That rule would break downloads. | High | The CSP lists exact origins: `https://huggingface.co`, `https://*.hf.co`, `https://*.huggingface.co` (subdomain wildcards only, scoped to Hugging Face), and `https://raw.githubusercontent.com` (model .wasm). No bare `*`. |
| 5 | The 4K-context budget was described in words, not enforced. | High | Budgets are enforced in code and tested: system ≤ 1,800 characters, history ≤ 3,200, question ≤ 2,400, answer ≤ 700 tokens. A unit test checks every agent prompt. |
| 6 | The Studio asked for 8–12 hand-written HTML templates: heavy to build, and hard to keep accessible and safe. | Medium | One schema-driven renderer with 12 accessible blocks and 6 palettes. The model fills a short JSON object, zod validates it, a repair step tolerates messy output and a fallback still renders a page from the brief. Escaping is tested with hostile input. |
| 7 | Repo setup and deploy were manual steps, but the owner wants Claude to do them in their Chrome as last time. | Medium | Section 4 has two run paths. Path A: Claude creates the repo, grants access, pushes, imports into Netlify and makes the site public, in the owner's Chrome with the owner's approval at each sensitive step. Path B: paste the prompt into Claude Code. |
| 8 | Two browser tabs could each load a 1–3 GB model and run out of memory. | Medium | A Web Lock (`navigator.locks`) allows one engine per browser. A second tab shows "The AI is running in another tab". |
| 9 | Storage eviction wasn't handled, so the cache could be cleared and the model downloaded again. | Medium | The app calls `navigator.storage.persist()` after consent, shows used and free space (`storage.estimate()`), and has a "Delete downloaded models" button. |
| 10 | The privacy page didn't say that Hugging Face sees the download request (IP address). | Medium | The Privacy page and consent dialog now disclose it. |
| 11 | The no-WebGPU state said "Chrome/Edge only". Support changes (Safari has since added WebGPU). | Low | Support is detected, not assumed by browser. The message names browsers only as examples. |
| 12 | There was no watchdog for a hung GPU, and no recovery after the GPU device is lost. | Low | 90 s with no tokens → stop the answer and offer a reload. If the device is lost, the engine is unloaded and recreated on the next request. |
| 13 | "Benchmark the models yourself" isn't possible in a cloud session with no GPU. | Low | Real-model checks are marked NOT RUN, with a 6-step manual smoke test for the owner. |
| 14 | No budget for page weight. | Low | Initial JS ≤ 250 KB gzip. WebLLM loads lazily, only after consent. Lighthouse is run without the model downloaded. |
| 15 | The agent team had no experts for on-device AI or for template generation. | Medium | Two new agents: **Greta**, Edge AI Engineer, and **Odessa**, Template Systems Engineer. The team grows to 31 experts. |
| 16 | Found in the live test: JSON mode crashed the Studio on the real model, and the picker showed memory needs as download sizes. | High | JSON-mode fallback to plain text (constraint 8); sizes relabelled (constraint 3). Verified live. |

---

## 2. The build crew (who owns what)

| Agent | Role in this build | Owns (only the owner edits) |
|---|---|---|
| Soraya · orchestrator | Plans phases, assigns owners, merges, final answer | `docs/decisions.md`, phase order |
| Benedikt · delivery-lead | Milestones, acceptance criteria, risk log, honest status | `reports/launch-readiness.md` (with Yusra) |
| Hiroshi · software-architect | Static-only architecture, ADRs | `docs/adr/0005–0008` |
| **Greta · edge-ai-engineer (new)** | WebLLM worker and engine, model tiers, capability check, token budgets, recovery | `web/src/ai/` (except `studio/`) |
| **Odessa · template-systems-engineer (new)** | Studio JSON schema, repair, renderer, blocks, palettes | `web/src/ai/studio/` |
| Jasper · prompt-engineer | Lite system prompts and task prompts sized for 4K context | `scripts/build-team.mjs` (lite prompt part), `web/src/ai/prompts.ts` |
| Pavel · frontend-engineer | Integrating the engine into the app; removing the password gate | `web/src/pages/`, `web/src/components/`, `web/src/App.tsx` |
| Ottilie · ux-architect + Anouk · content-designer | Engine states and their words: consent, download, ready, no WebGPU, out of memory, other tab | the state copy in `web/src/components/EngineGate.tsx` |
| Bastien · ui-designer + Camila · design-systems-lead | Model picker card, progress bar, on-device badge in the BrainyApp look | `web/src/styles/` |
| Xavi · devops-engineer | Static `netlify.toml`, CSP, headers, deploy, making the site public | `netlify.toml`, `web/index.html` CSP |
| Kofi · backend-engineer | Removing the server: functions, SDK, Blobs, env vars | deletions under `netlify/` |
| Ulla · qa-engineer | Mock engine tests, e2e, axe, gates | `tests/`, `scripts/gates.sh` |
| Rosalind · security-engineer | CSP review, sandbox isolation, escaping tests, audit | security findings in `reports/` |
| Tobias · performance-seo-engineer | Lazy loading, bundle budget, Lighthouse, meta and sitemap | `web/vite.config.ts`, `web/public/robots.txt`, `sitemap.xml` |
| Agnes · privacy-compliance | Privacy page; model licences and attributions | `web/src/pages/ContentPages.tsx` (Privacy section), `docs/models.md` |
| Wren · technical-writer | README, Guide, Resources, troubleshooting | `README.md`, Guide and Resources sections |
| Zuri · meta-agent + Hugo · knowledge-curator | New agents, knowledge notes, roster docs | `.claude/agents/`, `knowledge/` |
| Yusra · red-team-reviewer | Release gate against this prompt | pass / partial / fail table |

---

## 3. The prompt

```text
ROLE
You are Soraya, studio director of BrainyApp2 (.claude/agents/orchestrator.md). Delegate each part to the
owner in the crew table in docs/MASTER_PROMPT.md §2 with the Agent tool; if an agent type isn't loaded,
start a general-purpose subagent whose prompt begins with the full text of .claude/agents/<slug>.md.
Only a path's owner edits it.

GOAL
Build BrainyApp2: a free, public, fully static website on Netlify
(https://brainyapp2.netlify.app) where 31 AI experts (the 29 originals + Greta, edge-ai-engineer, and Odessa,
template-systems-engineer) answer IN THE VISITOR'S BROWSER through WebLLM on WebGPU. No API keys, no
server-side AI, no password, no budgets, no per-answer cost. Same layout and features as the source studio:
sidebar by department, chat with one expert, "Ask the whole team", One-shot Studio, Prompt Library,
Resources, Guide, Privacy, light/dark, mobile drawer, voice input/output, chats saved in the browser.

HARD CONSTRAINTS
1. Never link to, name or describe any private or paid edition of the studio, in the product or the docs.
2. Pin @mlc-ai/web-llm to an exact version (0.2.89 or newer, re-verified). Copy model IDs from that
   version's prebuiltAppConfig.model_list; a unit test fails if any configured ID is missing.
3. Model tiers (permissive licences only):
   - Lite: Llama-3.2-1B-Instruct (needs ≈0.9 GB graphics memory), Llama 3.2 Community Licence — show "Built with Llama".
   - Balanced (default when the GPU allows): Qwen2.5-1.5B-Instruct (≈1.6 GB; download measured ≈0.84 GB), Apache-2.0.
   - Quality: Phi-4-mini-instruct (≈3.4 GB), MIT. Label sizes as graphics-memory needs, not download size.
   Use the q4f16_1 build when the adapter has "shader-f16", else q4f32_1.
   Never Qwen2.5-3B (non-commercial licence).
4. Nothing downloads before a click that names the model, its size, where it comes from (Hugging Face)
   and that it is cached on this device. Show progress (%, MB, phase), allow Cancel, request persistent
   storage after consent, show storage use, offer "Delete downloaded models".
5. Engine in a Web Worker (CreateWebWorkerMLCEngine), lazy-loaded only after consent, one per browser
   (Web Locks; a second tab shows a clear message). Stop = interruptGenerate. 90 s without tokens →
   abort + "Reload the AI". Out of memory → offer the Lite model. Lost device → recreate on next use.
6. Token budget enforced in code (4,096 context): system ≤ 1,800 chars, history (last turns) ≤ 3,200
   chars, user input ≤ 2,400 chars, max_tokens ≤ 700. Lite agent prompts are generated at build time from
   .claude/agents (identity + mission + top 5 principles + web rules) and unit-tested against the cap.
7. Team mode: a deterministic keyword router picks 2–3 experts (no model call); experts answer one after
   another (≤ 300 tokens each); Yusra adds a short review when money/security/legal/release words appear;
   Soraya synthesises (≤ 600 tokens) from inputs truncated to fit. Progress chips as before.
8. One-shot Studio: the model never writes HTML. It fills a small JSON content object (zod schema with
   defaults). Try WebLLM JSON mode first; if the engine rejects it (0.2.89 + Qwen2.5 throws
   GrammarMatcherInitError), fall back to plain text for the session. A repair step extracts and coerces JSON; on failure a fallback spec is built from the brief.
   A pure renderer turns the object into one self-contained, accessible, responsive, light/dark HTML page
   from ~12 blocks and 6 palettes, escaping every string. Refine edits the JSON. "Get the Claude Code
   prompt" is built deterministically from the brief + JSON (no model). Preview only in /sandbox.html
   with its own strict CSP. Scope: website pages (landing, portfolio, shop front, small business); library
   items that are apps, dashboards or games are marked "Claude Code prompt only".
9. Static site only: delete netlify/functions, the auth/budget/model server code, @anthropic-ai/sdk and
   @netlify/blobs. No environment variables are needed.
10. App CSP (meta tag): default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self' blob:;
    connect-src 'self' https://huggingface.co https://*.hf.co https://*.huggingface.co
    https://raw.githubusercontent.com; plus the existing style/img/font/frame rules. No bare "*".
11. No WebGPU: friendly state naming what's needed (detected, not browser-sniffed), plus "Copy this
    expert's prompt" for use in any AI chat. Team, Library, Guide and Privacy work everywhere.
12. Model output is data: Markdown without raw HTML; JSON validated; strings escaped in pages.
13. Privacy page: processing is local; the model download request goes to Hugging Face (they see the IP
    address); chats live in this browser; how to delete chats and models. Resources page lists WebLLM,
    MLC and each model with its licence (licence attributions only: no credits, "made by" or "built with" lines and no links to any code
    repository). The only personal information is the owner logo and the footer copyright line.
14. Evidence rule: every check has its command and the last 15 lines of output in reports/gates.md.
    Anything not run is NOT RUN, never "passed". A real-model test needs WebGPU: if the session has none,
    mark it NOT RUN and list the owner's manual smoke test.

PHASES (finish, verify, commit, `git push origin HEAD:main`, show `git log origin/main --oneline -3`)
1. Copy: clone SOURCE_REPO (the agent-studio repository the owner names in chat) without .git; rename to
   BrainyApp2 (studio.config.json, README, CLAUDE.md, meta tags, sitemap, robots, OG image text); add Greta and Odessa with knowledge indexes and a
   sourced note knowledge/_shared/webllm-on-device.md. DONE WHEN validate-team passes with 31 agents.
2. Decide: ADRs 0005 static + on-device AI, 0006 model tiers and licences, 0007 context budget and team
   mode, 0008 schema-driven Studio. DONE WHEN each ADR states verified facts with dates.
3. Build: engine + worker + capability + EngineGate UI; local implementation of the existing
   streamModel(body, onText, signal) interface so pages change minimally; router; lite prompts;
   Studio schema/renderer/repair; remove the server; static netlify.toml with the CSP; docs pages.
   DONE WHEN the site builds, the mock engine drives every flow, and no file references /api/.
4. Test & harden: Vitest (budgets, model IDs, router, schema repair, renderer escaping, cc prompt);
   Playwright with VITE_MOCK_ENGINE=1 (consent → progress → ready; chat stream + Stop + reload
   persistence; team chips; Studio generate → sandbox preview → refine → download; no-WebGPU state;
   library; mobile drawer; axe 0 serious/critical on every page and on every Studio block × palette in
   light and dark); Lighthouse (median of 3, model not downloaded) if available, else NOT RUN; gates incl.
   "no private-edition link", "no /api/ calls", "no secrets", npm audit. DONE WHEN all gates pass or are
   NOT RUN with a reason.
5. Ship: push; create/import the Netlify project "brainyapp2" (static; no env vars); make it public;
   verify live: pages load, CSP header/meta present, /sandbox.html CSP, 404 works, consent dialog appears
   and nothing downloads before the click. Red-team release gate → reports/launch-readiness.md.

SELF-CHECK BEFORE YOU REPLY
- Is there any link to or mention of a private edition? Any download before consent? Any bare "*" in a CSP?
- Does every agent prompt + history + answer fit the budget? Do all model IDs exist in the pinned package?
- Can hostile model output break or script a generated page?
- Is every "passed" backed by a command and output, and every unrun check marked NOT RUN?

REPLY FORMAT
Readiness table (requirement · pass/partial/fail · evidence) · live URL · what the owner must test on a
WebGPU computer (6 steps) · known limits.
```

---

## 4. How to run it

**Path A: Claude builds and ships it for you (recommended).** Claude builds the site in its own workspace, then in your Chrome:
1. Creates the public GitHub repository **BrainyApp2**.
2. Adds BrainyApp2 to the Claude GitHub App's repository access.
3. Pushes the code.
4. Imports the repository into Netlify as **brainyapp2**.
5. Clicks **Make public**.

You approve each sensitive step when asked. Claude never types passwords or keys, and this version needs none.

**Path B: run it yourself in Claude Code.**
1. Create the public repo **BrainyApp2** and give the Claude GitHub App access to it.
2. Open it at claude.ai/code and set Network access to Full.
3. Paste the prompt in section 3.
4. Import the repo into Netlify (no settings or env vars needed) and click **Make public**.

**Owner smoke test (needs a WebGPU computer, about 10 minutes):**
1. Open the site, choose **Balanced** and click **Download**. Watch the progress bar.
2. Ask one expert a question, press Stop, then reload the page. The chat should still be there.
3. Ask the whole team. The chips should fill in one after another.
4. In the Studio, generate a page, refine it once, then download it.
5. Turn off Wi-Fi and ask again. It still answers.
6. Open a second tab. It should say the AI is running in another tab.

## 5. Honest limits
- It needs WebGPU and enough GPU memory. Many phones and older computers can't run it, but the rest of the site still works.
- The first use downloads the model once per browser: about 0.85 GB for Balanced (measured 2026-11-22); Lite is smaller and Quality larger. The sizes shown in the picker are graphics-memory needs.
- Small models give short, simpler answers. They are good for advice, outlines, copy and filling page templates, and weak at complex reasoning and long code.
