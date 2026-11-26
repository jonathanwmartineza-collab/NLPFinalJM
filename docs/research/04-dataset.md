# 04 — Dataset: the BrainyApp2 Expert & Prompt Corpus

## What it is
A small English text corpus made from the app's own content, so every NLP result is about something the
user can see in the app.

| Part | Files | Documents | What each document is |
|---|---|---|---|
| Expert profiles | `.claude/agents/*.md` (not `README.md`) | **31 at time of writing + 5 NLP experts being added = 36** | One expert persona: frontmatter `display.mission`, `display.personality`, `display.examplePrompts` (3 each) and the Markdown body (identity, principles, workflows). |
| One-shot prompt library | `prompts/library.json` | **12** | One copy-paste build prompt per app type (`id`, `title`, `category`, `agent`, `prompt`, …). |

### Counts (measured 2026-11-26 with a small Python script over the repo, whitespace word split)
| Measure | Value |
|---|---|
| Expert profiles present now | 31 (7 departments: Engineering 10, Design 7, Governance 4, Product 3, Quality 3, Leadership 2, Launch 2) |
| Example prompts across those profiles | 93 (3 per expert) |
| Words in expert text used (mission + personality + example prompts + body) | ~35,000 (35,032) — about 1,130 per expert |
| Prompt library entries | 12 (10 categories) |
| Words in the 12 `prompt` fields | ~2,000 (1,990; ~2,060 including titles and other string fields) |
| **Total corpus (31 experts + library)** | **43 documents, ~37,000 words** |

When the 5 NLP experts land, the build script recounts automatically; expect roughly 48 documents and
~42,000 words. The final numbers are written into `web/public/nlp/corpus-stats.json` at build time, and
the NLP Lab page reads them from there, so the page never shows stale counts.

### Fields used, per expert
- `display.displayName`, `display.title`, `display.department` — labels only (not analysed).
- `display.mission`, `display.personality`, `display.examplePrompts` — analysed (short, user-facing).
- Markdown body — analysed (long, domain-rich: the best source of TECH/STANDARD entities).

## Licence and access
- The repository is **public** and licensed **MIT** (`LICENSE`, "Copyright (c) 2026 BrainyApp2").
  The corpus is the project's own text, so there is no third-party licence or consent question.
- No personal data: personas are fictional; the app's privacy rule keeps real names off the site.
- Reproducible: the corpus is versioned in Git; each Netlify build analyses exactly the deployed commit.

## Pre-processing (done in `nlp/build_nlp.py`)
1. Parse YAML frontmatter; keep the fields above; strip Markdown syntax (headings, tables, code fences, links).
2. One document per expert and one per library prompt; keep `id`, `department`/`category` for grouping.
3. spaCy: full text → entities, EntityRuler TECH/STANDARD, noun chunks, one sample dependency parse.
4. NLTK: tokenize → lowercase → remove English stopwords and punctuation → `FreqDist`, bigram
   collocations (PMI, likelihood ratio), VADER per sentence and per document.

## Alternatives considered

| Dataset | Size / licence | Why not chosen |
|---|---|---|
| **NLTK `movie_reviews`** (Sentiment Polarity Dataset v2.0, Pang & Lee 2004) | ~4.0 MB zip; CC BY 4.0 per the NLTK data index | Good for sentiment teaching, but unrelated to the app: movie reviews say nothing about the experts or chats, so the NLP Lab would feel bolted on. |
| **Hugging Face `stanfordnlp/imdb`** | 100k rows (25k train, 25k test, 50k unlabelled); 84 MB download / 217 MB on disk; licence listed as "other", card says "More Information Needed" | Too big for a quick build step and for shipping results; licence terms unclear; again unrelated to the app. |

## Why the app's own corpus fits better
- **Relevance:** results describe the same experts users chat with, so the analysis is useful, not a demo.
- **Licence clarity:** MIT, owned by the project — nothing to attribute or clear.
- **Size:** ~37–42k words processes in seconds with spaCy `sm` during the Netlify build and produces
  small JSON files (tens of KB), well within build-time and page-weight budgets.
- **Living data:** when an expert is edited or added, the next deploy updates the analysis automatically.

## Weaknesses (state them in the report)
- Small and single-author style: frequency statistics are less stable than on a large corpus.
- Mostly neutral, instructional tone: VADER scores cluster near neutral, which is itself a finding.
- Technical vocabulary: the pretrained NER misses many terms, which is why we add an EntityRuler.

## Sources
- Repository files `.claude/agents/*.md`, `prompts/library.json`, `LICENSE` — counted 2026-11-26.
- NLTK data index (movie_reviews size, licence) — https://www.nltk.org/nltk_data/ (accessed 2026-11-26)
- NLTK book ch. 6 (movie_reviews labelled pos/neg) — https://www.nltk.org/book/ch06.html (accessed 2026-11-26)
- Hugging Face IMDB card — https://huggingface.co/datasets/stanfordnlp/imdb (accessed 2026-11-26)
- UNVERIFIED: the exact number of documents in `movie_reviews` (commonly cited as 2,000) was not stated
  on the pages fetched.
