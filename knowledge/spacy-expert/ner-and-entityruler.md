# Named entities and the EntityRuler in spaCy

Why this matters for spacy-expert: the NER panel shows spaCy's statistical entities plus project-specific
names added by rules. Getting the ruler's placement and overlap behavior right decides which label wins.

## Reading entities
- `doc.ents` is a tuple of `Span` objects, in document order.
- Per span: `ent.text`, `ent.label_` (string), `ent.start_char`, `ent.end_char` (character offsets into
  `doc.text`), `ent.start`, `ent.end` (token indices), `ent.ent_id_` (pattern id, if set by a ruler).
- Per token: `token.ent_iob_` ("B" begin, "I" inside, "O" outside, "" unset) and `token.ent_type_`.
- Each token can belong to at most one entity; entities never overlap in `doc.ents`.
- `spacy.explain(label)` returns a human description for the legend.
- Setting entities by hand: `doc.set_ents([Span(doc, start_tok, end_tok, label="ORG")])`, or build a span
  from characters with `doc.char_span(start, end, label="ORG")` (returns None if not on token boundaries).

## JSON shape for the site
- `{"text": ..., "label": ..., "start": start_char, "end": end_char, "source": "model" | "rule"}`.
- Decide `source` by checking whether `ent.ent_id_` is set or whether the span matches a ruler pattern;
  giving every rule pattern an `id` makes this trivial.

## EntityRuler basics
- Factory name: `"entity_ruler"`. Add with
  `ruler = nlp.add_pipe("entity_ruler", before="ner", config={...})`, then `ruler.add_patterns(patterns)`.
- Each pattern is a dict with `label` and `pattern`, optionally `id`.
- Phrase pattern: `{"label": "ORG", "pattern": "Apple"}` (exact token text match).
- Token pattern: `{"label": "GPE", "pattern": [{"LOWER": "san"}, {"LOWER": "francisco"}]}`.
- Several patterns may share one `id` (for example "San Francisco" and "San Fran"), so variants map to
  one entity via `ent.ent_id_`.

## Config settings
| Setting | Default | Meaning |
|---|---|---|
| `phrase_matcher_attr` | None (ORTH) | set `"LOWER"` for case-insensitive phrase patterns |
| `validate` | False | check patterns against the JSON schema; turn on in the build |
| `overwrite_ents` | False | replace existing overlapping entities |
| `ent_id_sep` | `"\|\|"` | internal separator for ids |
| `matcher_fuzzy_compare` | levenshtein | fuzzy matching (v3.5+) |
| `scorer` | NER P/R/F scorer | used by `nlp.evaluate` |

## Placement decides who wins
| Placement | Behavior |
|---|---|
| `before="ner"` | ruler sets entities first; the statistical NER respects them and predicts around them. Docs say this can noticeably improve accuracy. |
| `after="ner"` | ruler only adds spans that do not overlap model entities, unless `overwrite_ents=True` |
| alone (no ner) | pure rule-based NER |
- Project decision: `before="ner"`, so course-specific names always get our label.
- Among overlapping rule matches: the longer match wins; for equal length, the earlier one wins.

## Useful ruler methods and properties
- `len(ruler)` = number of patterns; `"ORG" in ruler` checks a label exists.
- `ruler.labels`, `ruler.ent_ids`, `ruler.patterns`.
- `ruler.remove(id)` (v3.2.1+) removes patterns by id; raises ValueError if missing.
- `ruler.to_disk("patterns.jsonl")` / `ruler.from_disk(...)`: JSONL, one pattern per line. Keeping the
  project's patterns in a JSONL file in the repo makes them reviewable and testable.
- `ruler.initialize(...)` can load patterns from a file during `nlp.initialize`.

## Matcher token attributes usable in token patterns
- Text: `ORTH`/`TEXT`, `NORM`, `LOWER`, `LENGTH`.
- Flags: `IS_ALPHA`, `IS_DIGIT`, `IS_LOWER`, `IS_TITLE`, `IS_PUNCT`, `IS_SPACE`, `IS_STOP`, `LIKE_NUM`,
  `LIKE_URL`, `LIKE_EMAIL`.
- Linguistic: `POS`, `TAG`, `LEMMA`, `DEP`, `SHAPE`, `MORPH`, `ENT_TYPE`.
- Quantifier `OP`: `!`, `?`, `+`, `*`, `{n}`, `{n,m}`, `{n,}`, `{,m}`.
- Attribute names are case-insensitive keys.

## Custom labels
- A ruler may use a new label (for example "COURSE"); `displacy` needs a color for it via
  `options={"colors": {"COURSE": "#..."}}`, and the site legend must list it.
- Keep custom labels few and documented; explain on the page that they come from rules, not the model.

## Pitfalls
- Adding the ruler after ner without `overwrite_ents` and wondering why patterns do nothing.
- Phrase patterns are case-sensitive by default; set `phrase_matcher_attr="LOWER"` if needed.
- Adding patterns one at a time in a loop is slow; pass the whole list to `add_patterns`.
- UNVERIFIED (exact example code did not render on the fetched docs page): the canonical Apple/San
  Francisco example; the shapes above follow the documented pattern format.

## Sources
- https://spacy.io/usage/linguistic-features (accessed 2026-11-26)
- https://spacy.io/usage/rule-based-matching (accessed 2026-11-26)
- https://spacy.io/api/entityruler (accessed 2026-11-26)
- https://spacy.io/api/language (accessed 2026-11-26)
