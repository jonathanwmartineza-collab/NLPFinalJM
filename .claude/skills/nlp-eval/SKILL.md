---
name: "nlp-eval"
description: "Use when the NLP Lab or its Python build changes, or before calling the NLP final exam done: runs the acceptance checks (every panel labelled NLTK or spaCy, NLTK and spaCy JSON present and non-empty, VADER sign tests, NER gold examples, CPython/Pyodide parity, live box answers in time) and produces a pass/fail table with evidence."
---
# NLP evaluation

## Purpose
Decide, with evidence, whether the NLP Lab does what the final exam asks. Gold examples and fixed
thresholds, not impressions. Every row is PASS, FAIL or NOT RUN (with the reason); NOT RUN never counts as a
pass, and a FAIL in a required check makes the whole verdict FAIL.

## Procedure
1. **Build first.** `python nlp/build_nlp.py` must exit 0. Record the exit code and the last lines of output.
2. **A. JSON present and non-empty** (required). For `web/public/nlp/nltk.json` and `spacy.json`:
   file exists, parses, `engine` is exactly "NLTK" / "spaCy", and these are non-empty:
   NLTK `corpus.top_words`, `corpus.collocations`, `sentiment`; spaCy `entities`, `topics`, `parses`.
   `meta.json` lists Python, nltk, spaCy and model versions.
   ```bash
   python -c "import json;d=json.load(open('web/public/nlp/nltk.json'));assert d['engine']=='NLTK' and d['corpus']['top_words']"
   ```
3. **B. VADER sign tests** (required). `nltk_core.sentiment(text)["compound"]`; thresholds ±0.05:
   | ID | Sentence | Expected |
   |---|---|---|
   | V1 | "I love this app, it is wonderful!" | compound ≥ 0.05 |
   | V2 | "This is terrible and I hate it." | compound ≤ −0.05 |
   | V3 | "It is not bad." | compound ≥ 0.05 (negation flips "bad") |
   | V4 | "It is not good." | compound ≤ −0.05 |
   | V5 | "The page has three panels." | −0.05 < compound < 0.05 |
   | V6 | "GREAT work!!!" vs "great work" | first compound > second (caps and "!" boost) |
4. **C. NER gold examples** (required). Run `spacy.load("en_core_web_sm")` plus the EntityRuler from
   `nlp/patterns.jsonl` (labels below assume the patterns file; read it and adjust the expected labels to it):
   | ID | Sentence | Must contain (text → label) |
   |---|---|---|
   | N1 | "Apple is looking at buying U.K. startup for $1 billion." | Apple → ORG, U.K. → GPE, $1 billion → MONEY |
   | N2 | "We parse text with NLTK and spaCy on Netlify." | NLTK → TECH, spaCy → TECH, Netlify → ORG |
   | N3 | "Pyodide runs Python in the browser." | Pyodide → TECH |
   Score hits / expected entities; required: all ruler entities (N2, N3) and at least 2 of 3 in N1 (statistical).
5. **D. Panel labels** (required). On `/nlp`, every results panel has a visible heading or badge containing
   exactly "NLTK" or "spaCy", and no panel claims both. Check with Playwright
   (`page.getByRole("region")` or the panel selector) or, if no browser is available, by reading
   `web/src/pages/NlpPage.tsx` and marking the live check NOT RUN.
6. **E. Parity** (recommended). The same three texts through `nltk_core.analyze` in CPython and in Pyodide give
   identical JSON (or the differences are listed with the two NLTK versions).
7. **F. Live box timing** (required on a device with network). Fresh profile, broadband desktop: from the
   consent click to the first result ≤ 30 s (cold); a second analyze on 100 words ≤ 2 s; an error shows a
   retry. No network or no browser → NOT RUN with the reason; the verdict is then PARTIAL.
8. **G. Tests.** `python -m pytest tests/python -q` and `npx vitest run` both exit 0; quote the counts.
9. **Verdict.** PASS only if A–D, F and G pass. Write the table, then append it to `reports/gates.md`
   (dated, never overwrite earlier entries) if you have write access; otherwise hand it to qa-engineer.

## Checklist
- [ ] Build ran first; exit code recorded.
- [ ] Every required row has a command and its real result, or NOT RUN with a reason.
- [ ] VADER rows use the ±0.05 thresholds; NER labels checked against `nlp/patterns.jsonl`.
- [ ] Panel labels checked in a browser, or the browser check marked NOT RUN.
- [ ] Timings name the browser, network and whether the cache was empty.
- [ ] Verdict follows the rule: any required FAIL → FAIL; any required NOT RUN → PARTIAL.

## Output template
```markdown
## NLP Lab evaluation — <YYYY-MM-DD>
Verdict: PASS | FAIL | PARTIAL · Build: python nlp/build_nlp.py → exit <n>
| Check | Command / method | Result | Evidence |
|---|---|---|---|
| A. JSON present, non-empty | python -c … | <PASS/FAIL> | <field counts> |
| B. VADER signs V1–V6 | pytest tests/python -k vader | <PASS n/6> | <compounds> |
| C. NER gold N1–N3 | pytest tests/python -k ner | <PASS n/7> | <entities found> |
| D. Panel labels | Playwright on /nlp | <PASS n/n panels> | <screenshot path> |
| E. Parity CPython/Pyodide | 3 texts | NOT RUN — no browser | — |
| F. Live box timing | Playwright, fresh profile | cold <s>, warm <s> | browser, network |
| G. Tests | pytest · vitest | <n> passed · <n> passed | exit 0 · exit 0 |
Failures and owners: <check → slug>
```
