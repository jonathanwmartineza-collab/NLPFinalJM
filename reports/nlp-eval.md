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

## Red-team review of the NLP claims (2026-11-26, local, not yet deployed)
Reviewed the way an NLP lecturer would: every panel's wording against the code and the JSON it shows.

| Finding | Fix | Evidence after the fix |
|---|---|---|
| Corpus panel said "NLTK over 48 documents" but the frequencies, collocations and tone cover only the 36 expert profiles | `nltk.json` `corpus.documents` is now 36 and adds `tokens`; the panel names the profiles and explains what "content words" removes | `corpus`: 36 documents, 47,206 tokens, 24,681 content words |
| The page's "N words" (whitespace split) and "content words" (NLTK, after stopwords and house words) were shown without saying how each is counted | Both are now defined on the page | corpus line and corpus panel copy |
| Corpus collocations were counted on the stopword-stripped word stream joined across documents, so words that were never adjacent became "pairs"; the Markdown cleaner also split `en_core_web_sm` into "en core", "core sm" | Build-time collocations now use `BigramCollocationFinder.from_documents` on the real token order, then `apply_word_filter` (stopwords, house words, team names); the cleaner keeps snake_case identifiers | top pairs: acceptance criteria, live box, application security, one-shot prompting, legal advice |
| Markdown headings ran into the next line ("Boundaries You are …"), which spaCy tagged as GPE/ORG in almost every profile ("Boundaries", "Inputs", "Identity", "Method") | The cleaner ends each heading, list item and table row as its own sentence; a `line_sentences` component makes a new line start a sentence before the parser | "Boundaries"/"Inputs" no longer appear as entities |
| Obvious NER errors shown prominently: "Tab" PERSON, "CI"/"AI"/"VRAM" GPE, "A. Audit" ORG, team members as ORG/GPE ("Anouk Varga" ORG, "Imani" GPE), job titles as ORG, "EntityRuler"/"FreqDist"/"VADER" as ORG | EntityRuler gets the 36-person roster (PERSON) and job titles (hidden ROLE), 53 more TECH/METHOD/STANDARD patterns (API, UI, CI, VADER, FreqDist, NER, PMI, F1…); `not_a_name()` drops statistical entities that are a whole heading line, a verb or common noun per the tagger, a word also used in lower case in the same text, a code ("0F766E", "LLM10"), or contain symbols | GPE mentions 144 → 25, ORG 672 → 230; remaining errors are mostly acronyms labelled ORG (PRD, ADR, PII), stated on the page |
| `A/B test` was recognised by the ruler but then hidden by the "/" filter, although the page names it as an example | The symbol filter only applies to statistical entities | Dario Feldmann: "A/B test" METHOD ×3 |
| "N entities" per expert counted every spaCy label (dates, numbers) while the list shows ten labels | Count is now the mentions shown, after the filter | `counts.entities` |
| Topic index weighted phrases as share ÷ spread × min(count, 5); an off-topic expert with one stray noun chunk could win ("accessibility" → Performance & SEO first, "measure retention" → Pyodide Engineer) | BM25 weights (k1 = 1.2, b = 0.75, normalised by profile length) over the top 60 noun chunks and ruler terms per expert, each expert's own job title counted as 5 extra mentions and mission chunks as 2; team names and agent handles are no longer topics | `python nlp/eval_routing.py` (30 hand-written questions): top-1 19/30 → 23/30, top-3 28/30 → 29/30 |
| Dependency panel labelled the object "builds", though most GOAL lines are noun phrases with no verb | Label is "asks for"; copy says the labels are spaCy's English (ClearNLP-style) scheme | Parse panel |
| Coach, insights and agreement copy did not say how the score, collocations and verdicts are computed | Copy now states: 5 rule checks × 20 − 5 per hedge; LLR on stopword-filtered words, up to 40 sentences; Jaccard ≥ 0.2 on stems and recommendation patterns (later changed: tone never decides the verdict, it only adds a note; see the hard-test section) | NLP Lab intros |

Checks after the fix: `python nlp/build_nlp.py` OK (48 documents, 50,531 words, 1,699 topic phrases),
`python -m pytest tests/python -q` 91 passed, `npm run typecheck` PASS, `npx vitest run` 50 passed. The Pyodide
parity test and the e2e tests were NOT RUN here (no network to jsDelivr or the live site from this container).

Still open (owned elsewhere, see the review notes): the live `collocations()` in `nlp/nltk_core.py` still scores
the stopword-stripped stream; the agreement map's recommendation pattern reads "I recommend starting with a PWA"
as recommending "starting" and "I would use React. Pick React." as "react. pick react", which can produce a false
"disagree"; the coach's constraint check accepts the word "by" in any sense.

## Hard test of the Prompt coach routing and Chat insights (2026-11-26, local, not yet deployed)
A hard test of the live coach with real questions routed badly: "How does your NER handle out-of-vocabulary product
names like Pyodide or pgvector?" went to Netlify DevOps and Brand ("production", "naming"); "Make a RAG chatbot for
our HR policies using pgvector and Claude…" went to the Motion designer ("second"); a SaaS dashboard prompt went to
Growth and Red team. Chat insights put URL pieces, HTML tags and speaker labels among the top words.

| Finding | Fix | Evidence after the fix |
|---|---|---|
| Document frequency was counted only over each expert's top 60 noun chunks, so a word most profiles use looked specific ("production": 1 owner, but 15 of 36 profiles use it; "second": 1 owner, 10 profiles) and got a full idf | `nlp/spacy_core.py`: term and document frequency are counted over each whole profile (phrases of up to 4 content words per sentence, written as the noun-chunk topics are); phrases in more than half of the profiles are dropped from the profile field (where the classic Robertson–Spärck Jones idf reaches 0); each phrase keeps its 10 best experts | "production" weight 5.8 → 1.8; index 1,699 → 1,684 phrases (195 KB, 45 KB gzipped) |
| The job title bonus fought with the new df: title words are frequent in profiles because experts name each other's lanes ("security" is in 21 profiles, but in 1 title) | Title is a second field with its own idf over the 36 titles, combined with the profile idf by geometric mean (so "pyodide" stays strong, "build" of "Python Build Engineer", in 35 profiles, stays weak); weight 4, chosen on the dev set from 1.5, 2, 3, 4 | `index.weighting` in `topic-index.json` |
| No index entries for RAG, pgvector, chatbot, LLM, spaCy, NLTK, Pyodide (ruler terms were cut by the old 8-profile spread limit or had no pattern) | 72 EntityRuler patterns added (232 in all): RAG / retrieval-augmented generation, LLM / large language model, pgvector, Pinecone, LangChain, embeddings, vector database, chatbot, GPT-4o, Whisper and Gemini (case-sensitive token patterns), stemming, lemmatization, tokenisation, POS tagging, TF-IDF, BM25, Cohen's kappa, common web stack names; OpenAI and Anthropic as ORG (shown, not indexed). Synonyms share an EntityRuler id (spaCy `ent_id_`): their counts add up under one canonical phrase (the shortest form: "ner", "rag", "llm", "postgres") and the index lists the other forms as `aliases` | index has "rag" (ai-engineer), "pgvector" (ai-engineer), "ner", "spacy", "nltk", "pyodide", "llm", "chatbot"; `aliases["named entity recognition"] == "ner"` |
| `match_topics` matched only the canonical words; "access" matched "accessibility" (Porter stems both to "access"); "persona" and "personas" both scored; topics were listed by total weight, so "policy" and "second" came first | `nlp/nltk_core.py` `match_topics`: an alias form matching counts as its phrase (case-insensitive, so RAG/rag); a stem match also needs words of comparable length (shorter ≥ half the longer); phrases with the same stems count once; topics are listed longest first, then by fewest profiles (`df`). Coach output shape unchanged | "Focus on pgvector, rag, chatbot." |
| Chat insights: "//evil.example", "/script", "aria-pressed='false", "user", "expert" among top words; sentences ran from one speaker into the next | `analyze` counts words, collocations and sentence tones on `readable()` text: `plain()` (tags now removed before links, links include protocol-relative and bare host/path forms, dotted names like Next.js kept) plus `strip_speakers()` (role words such as User/SYSTEM, a name that starts two or more lines, or any capitalised name once the text is a transcript); each speaker turn is its own paragraph and a blank line ends a sentence | `tests/python/test_routing_and_insights.py` (20 tests) |

Routing, `python nlp/eval_routing.py` (top-1 / top-3; the expected set may hold several experts):

| Set | Before | After |
|---|---|---|
| Dev, 30 questions (weights tuned here) | 23/30 · 29/30 | 27/30 · 29/30 |
| Held-out, 16 questions written before the changes | 7/16 · 13/16 | 13/16 · 16/16 |

The held-out set was not used to choose a weight. One change was made after looking at it: the over-stemming
guard, prompted by the SaaS prompt (one of the three known failures that motivated the work); without the guard
held-out is 12/16 · 16/16 and dev is unchanged. Remaining misses: "Map the onboarding flow and error states" (UX
architect expected, Content designer first), "Build a landing page for my yoga studio" (Orchestrator first, via
"studio"), "Chrome extension … with an LLM" and "data visualization … with D3" (no profile mentions Chrome extensions
or D3, so only top-3). The Orchestrator, whose profile routes every topic, often appears third.

Checks after the fix: `python nlp/build_nlp.py` OK (1,684 topic phrases), `python -m pytest tests/python -q`
207 passed, `node tests/node/pyodide-nltk.mjs` PASS (Pyodide matches CPython), `npm run typecheck` PASS,
`npx vitest run` 50 passed.

## Known limits
- spaCy's small model is trained on news text; even after the filter it labels some technical acronyms as ORG
  (PRD, ADR, PII) and a few imperative verbs at the start of a line as PERSON ("Mark milestones…").
- VADER reads words like "risk" or "fail" as negative, so careful experts score as "cautious"; the page says so.
- The expert matching is lexical (stemmed noun phrases and EntityRuler terms), so a question with no known topic
  gets no match, and terms no profile uses (D3, Chrome extension) cannot route; the 30-question check is a
  development set, the 16-question one is held out but small.
- Lower-casing makes ruler acronyms that are also English words ambiguous in questions ("the rest of the app"
  matches REST, "how users react" matches React).
- The first live NLTK load downloads Pyodide and NLTK from jsDelivr (about 15 MB, then cached).
