# Dependency parse, noun chunks and displaCy

Why this matters for spacy-expert: the parse and noun-chunk panels turn spaCy's syntax into something a
reader can see. Output must be plain JSON the React page renders itself, which also keeps it XSS-safe.

## Dependency parse basics
- Check a parse exists: `doc.has_annotation("DEP")`. Without it, `doc.sents` and `noun_chunks` raise.
- Per token:

| Attribute | Meaning |
|---|---|
| `token.dep_` | relation label to its head (nsubj, dobj, prep, pobj, amod, ROOT, ...) |
| `token.head` | the governing token; the ROOT token's head is itself |
| `token.children` | direct dependents |
| `token.lefts` / `token.rights` | dependents to the left / right |
| `token.subtree` | the token and all its descendants, in order |
| `token.i` | index in the doc, use it as a stable id in JSON |
| `token.pos_` / `token.tag_` / `token.lemma_` | coarse POS, fine tag, lemma |

- `spacy.explain("nsubj")` gives a readable gloss for a legend.
- Find the main verb of a sentence: the token whose `dep_ == "ROOT"` in `sent`.

## Noun chunks
- `doc.noun_chunks` yields base noun phrases (a noun plus its modifiers, not nested phrases).
- Per chunk: `chunk.text`, `chunk.root.text`, `chunk.root.dep_` (role of the phrase), and
  `chunk.root.head.text` (the word the phrase attaches to).
- Noun chunks depend on the parser; they disappear if the parser is excluded.
- Count chunk texts (lowercased) across the corpus to show "most frequent noun phrases".

## Recommended JSON for one sentence
- `tokens`: list of `{"i", "text", "pos", "dep", "head"}` where `head` is the head's `i`.
- `chunks`: list of `{"text", "root", "rootDep", "rootHead"}`.
- `ents`: as in the NER note.
- Keep per-sentence objects small; cap the number of sentences shown (for example the first 5) to keep
  the JSON and the page light.

## displaCy (spaCy's visualizer)
| Call | Output |
|---|---|
| `displacy.render(doc, style="dep")` | SVG string of arcs |
| `displacy.render(doc, style="ent")` | HTML string with highlighted entities |
| `displacy.render(doc, style="span", options={"spans_key": "sc"})` | HTML for span groups |
| `displacy.serve(doc, style=...)` | local web server, for exploration only |

- Options for dep: `compact` (square arrows, smaller), `color`, `bg`, `font`, `offset_x`, `distance`.
- Options for ent: `ents` (which labels to show), `colors` (label to color map; needed for custom labels).
- `page=True` wraps output in a full HTML page; `minify=True` compacts it.
- Long texts: render sentence by sentence (`for sent in doc.sents`), each SVG is standalone.
- `manual=True` plus `parse_deps` / `parse_ents` convert a Doc into displaCy's data format; that dict is
  a ready-made JSON shape for client-side drawing.

## Security and accessibility choice for this project
- spaCy's docs warn that sending raw server-made HTML to a web page invites cross-site scripting, and
  recommend sending JSON and drawing on the client (displaCy.js builds DOM nodes, no raw HTML).
- Project rule: do NOT inject displaCy HTML/SVG with `dangerouslySetInnerHTML`. Emit JSON at build time
  and draw with React. If a static SVG is ever shipped, serve it as an image file with alt text.
- displaCy's docs give no accessibility guidance; the page must add its own: a text/table alternative
  listing token, relation and head, and color plus text labels (never color alone) for entities.

## Common relation labels to explain on the page (UNVERIFIED glosses from general knowledge; confirm each with spacy.explain)
- `nsubj` nominal subject, `dobj` direct object, `prep` preposition, `pobj` object of preposition,
  `amod` adjective modifier, `det` determiner, `compound` compound noun, `aux` auxiliary, `ROOT` root.
- Use `spacy.explain` at build time to generate the glossary instead of hand-typing it.

## Pitfalls
- Excluding the parser to "save time" removes sentences, noun chunks and the dependency panel.
- `token.head` is a Token object; serialize its index, not the object.
- Very long sentences make unreadable arc diagrams; prefer short example sentences for the visual.

## Sources
- https://spacy.io/usage/linguistic-features (accessed 2026-11-26; code cells did not render, API names
  checked against the same page's text)
- https://spacy.io/usage/visualizers (accessed 2026-11-26)
- https://spacy.io/usage/processing-pipelines (accessed 2026-11-26)
