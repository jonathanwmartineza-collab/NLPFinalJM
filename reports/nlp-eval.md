# NLP evaluation and QA report (NLP final)

Owners: Esther Kwon (NLP evaluator) and Ulla Brennan (QA). Date: 2026-11-26.
Live site: https://nlpfinaljm.netlify.app/nlp · Repo: https://github.com/jonathanwmartineza-collab/NLPFinalJM

## Netlify build (deploy of commit 495b853, then 9a57b9e)
| Check | Result | Evidence |
|---|---|---|
| Python installed from `PYTHON_VERSION`, `requirements.txt` pip-installed | PASS | Deploy log: "Installing pip dependencies from requirements.txt" … "Pip dependencies installed" |
| NLTK + spaCy build step | PASS | Deploy log: `build_nlp: OK 48 documents, 51746 words, 992 topic phrases` |
| Site published | PASS | Deploy log: "Site is live"; build time 37 s |
| Page footer data | PASS | /nlp shows "Built 2026-11-26 18:51:23 UTC with Python 3.13.18, NLTK 3.9.4, spaCy 3.8.18 and en_core_web_sm 3.8.0" |

## Live test of /nlp (Chrome, desktop)
| Panel | Library label shown | Result |
|---|---|---|
| Prompt coach | NLTK live (Pyodide) + spaCy build | PASS: "Try an example" returned clarity score 15, flagged vague words (better, some, stuff) and the hedge "maybe", topic "accessibility", 3 matching experts, a sharper question; NLTK call 33 ms after load |
| Chat insights | NLTK live (Pyodide) | PASS: sample text gave 12 sentences, 152 tokens, FreqDist top words, 3 collocations, VADER per sentence; 8 ms |
| Team agreement map | NLTK live + spaCy build | PASS: shared ideas, pairwise verdicts and per-expert tone; 61 ms. Follow-up fix: recommendation extraction now flags the PWA vs native conflict (test `test_agreement_flags_opposite_recommendations`) |
| What each expert knows | spaCy build | PASS: entities with EntityRuler labels (e.g. WCAG 2.2 STANDARD ×8, HTML TECH ×4), noun-chunk topics, label totals |
| Dependency parse | spaCy build | PASS: root "build VERB", object "landing page", describers "fast, accessible", for "bike repair shop", arc diagram and token table |
| Words and tone across the studio | NLTK build | PASS: FreqDist, collocations (likelihood ratio), VADER tone per expert |

Header links "NLP Lab" and "Resources" are visible on every page; Resources links the repo, the guide, every docs file, the agents, skills and knowledge notes.

## Automated checks (local, same versions as Netlify)
| Gate | Result |
|---|---|
| `python3 -m pytest -q tests/python` (NLTK core, spaCy gold labels, build output) | 18 passed |
| `node tests/node/pyodide-nltk.mjs` (Pyodide 314.0.8 + NLTK 3.9.4 vs CPython output) | PASS |
| `npm run typecheck` | PASS |
| `npx vitest run` | 41 passed |
| `node scripts/validate-team.mjs` / `check-skills.mjs` | 36 agents, 49 skills OK |
| `npm run build` | PASS |
| Playwright e2e + axe | Not run in the build container (browser downloads are blocked there); the new `/nlp` e2e tests are in `tests/e2e/site.spec.ts` and run with `PW_BASE_URL=https://nlpfinaljm.netlify.app npx playwright test -g "NLP Lab"` |

## Known limits
- spaCy's small model mislabels a few words in the profiles (for example "Tab" as PERSON); the EntityRuler patterns take priority for the studio's own terms.
- VADER reads words like "risk" or "fail" as negative, so careful experts score as "cautious"; the page says so.
- The first live NLTK load downloads Pyodide and NLTK from jsDelivr (about 15 MB, then cached).
