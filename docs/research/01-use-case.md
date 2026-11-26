# 01 — Use case: what NLP adds to BrainyApp2

## The app today
BrainyApp2 is a static React/Vite website on Netlify. Visitors chat with AI expert personas (one expert,
or the whole team) and the language model runs inside their own browser (WebLLM on WebGPU). There is no
server, no account and no API key. The exam copy (repo `NLPFinalJM`) adds one new page: **NLP Lab** at `/nlp`.

## The problem NLP solves
The chat produces a lot of text, but the app gives the user no way to *look at* that text:

- Users cannot see what their own conversation was about, which words dominate it, or how its tone shifts.
- Users choose an expert from a card and a one-line mission. They cannot see, at a glance, which
  technologies, standards and topics each expert actually knows about.

Classic NLP (not another LLM) is a good fit: it is fast, deterministic, explainable and free to run.

## Two features, two libraries (clearly labelled on the page)

| Part of the NLP Lab | Library | Where it runs | What the user gets |
|---|---|---|---|
| **"Analyse your chat" (live)** | **NLTK** | In the browser (Pyodide in a Web Worker) | Paste or pick a chat; see tokens, top words after stopword removal, frequency chart, top bigram collocations (PMI and likelihood ratio), and VADER sentiment per message with a compound score. |
| **"What each expert knows" (explore)** | **spaCy** | At build time on Netlify; results shipped as static JSON | Pick an expert; see named entities, custom TECH/STANDARD entities (EntityRuler), noun-chunk topics and a sample dependency parse. Compare experts side by side. |

The page also runs the same NLTK pipeline at build time over the whole corpus, so the "explore" view can
show NLTK statistics (top words, collocations, tone) next to the spaCy results.

## Users
1. **Visitors / builders** who chat with the experts and want to understand or summarise a conversation.
2. **People choosing an expert** who want evidence of what each persona covers before asking.
3. **The course examiner**, who needs to see NLTK and spaCy each doing a clearly labelled job, live on Netlify.
4. **The app maintainer**, who can spot overlapping or thin expert profiles from the topic and entity data.

## How users benefit
- **Privacy kept:** chat analysis runs in the visitor's browser; no chat text is sent anywhere.
- **Instant and free:** no server cost per request; the spaCy results are precomputed.
- **Explainable:** every number links to a visible rule (word counts, PMI, VADER lexicon), unlike an LLM summary.
- **Better expert choice:** entities and topics show what an expert really talks about.

## Scope (in / out)
- In: English text only; the BrainyApp2 expert and prompt corpus; the user's own pasted or current chat.
- Out: training new models, server-side processing, non-English text, storing user text.

## Success criteria (checklist for the exam)
- [ ] `/nlp` is live on the Netlify site and linked from the app navigation.
- [ ] The page has two clearly labelled sections: **"NLTK"** and **"spaCy"**, each saying what it does.
- [ ] NLTK section works live: typing/pasting text returns tokens, top words, collocations and VADER scores.
- [ ] NLTK first load shows a progress state and finishes in a reasonable time on a normal laptop
      (target: under ~10 s on first visit, under ~2 s on repeat visits from cache).
- [ ] spaCy section shows entities, custom TECH/STANDARD entities, noun-chunk topics and a dependency
      parse for every expert, loaded from `web/public/nlp/*.json` produced during the Netlify build.
- [ ] The Netlify build log shows `nlp/build_nlp.py` running with spaCy and NLTK before `vite build`.
- [ ] The dataset, its size and licence are documented (see [04-dataset](04-dataset.md)).
- [ ] Automated tests cover the Python NLP functions and the `/nlp` page renders (existing test suite passes).
- [ ] The page meets the app's existing accessibility bar (keyboard use, labels, contrast).

## Risks
| Risk | Mitigation |
|---|---|
| Pyodide first load is large (~15 MB before compression) | Load only when the user opens the NLTK tab; show progress; browser caches it. |
| NLTK data missing in the browser | Ship one small zip with only the three needed packages; unpack into Pyodide's file system. |
| spaCy model drift between builds | Pin spaCy 3.8.x and `en_core_web_sm` 3.8.0 in `requirements.txt`. |
| Build skipped by the "ignore" script | Add `nlp/` and `requirements.txt` to `scripts/build-paths.txt` (see [07-architecture](07-architecture.md)). |

## Sources
- BrainyApp2 repository files (`README.md`, `netlify.toml`, `docs/README.md`), read 2026-11-26.
- NLTK sentiment how-to — https://www.nltk.org/howto/sentiment.html (accessed 2026-11-26)
- spaCy linguistic features — https://spacy.io/usage/linguistic-features (accessed 2026-11-26)
- Pyodide in a web worker — https://pyodide.org/en/stable/usage/webworker.html (accessed 2026-11-26)
