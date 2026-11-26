"""spaCy part of the NLP Lab (build time only, en_core_web_sm 3.8.0).

spaCy is not in the Pyodide distribution, so it runs once per Netlify build and its results ship as static JSON
(web/public/nlp/spacy.json). It does four jobs:
  1. Named entities, with an EntityRuler (nlp/patterns.jsonl) placed before the statistical NER so the app's own
     vocabulary (TECH, STANDARD, METHOD) is recognised: e.g. "WCAG 2.2", "Pyodide", "A/B test". The same ruler gets
     the team roster (36 names as PERSON, their job titles as ROLE, which is not shown), and a small filter drops
     statistical entities that are clearly common words (see entities()).
  2. Noun-chunk topics per expert (nouns lemmatised, determiners/stopwords and generic chunks removed).
  3. Dependency parses of the prompt library: what each prompt asks for (root verb -> its object), plus full arcs.
  4. A topic index (phrase -> experts) used live by the Prompt coach and the Team agreement map.
"""
from __future__ import annotations

import collections
import math
import re
from pathlib import Path

import spacy

MODEL = "en_core_web_sm"
RULER_LABELS = {"TECH", "STANDARD", "METHOD"}
LABELS_SHOWN = ["TECH", "STANDARD", "METHOD", "ORG", "PRODUCT", "PERSON", "GPE", "NORP", "LAW", "WORK_OF_ART"]
# Noun chunks that are true but say nothing about an expert's field (house wording of the agent prompts).
GENERIC = {
    "you", "it", "they", "them", "we", "i", "me", "us", "what", "which", "who", "that", "this", "these", "those",
    "one", "the user", "user", "the request", "request", "answer", "the answer", "output", "output template",
    "template", "notes", "note", "the notes", "hand-offs", "hand-off", "boundaries", "self-check", "method",
    "inputs", "input", "a line", "line", "lines", "file", "files", "the file", "step", "steps", "thing", "things",
    "way", "time", "part", "parts", "case", "cases", "name", "names", "list", "lists", "the team", "team",
    "the studio", "studio", "brainyapp2", "knowledge", "the knowledge", "readme.md", "the readme", "skill",
    "skills", "agent", "agents", "tool", "tools", "example", "examples", "question", "questions", "something",
    "everything", "anything", "nothing", "word", "words", "section", "sections", "reply", "replies", "rule",
    "rules", "check", "checks", "result", "results", "work", "change", "changes", "point", "points", "number",
    "numbers", "page", "pages", "job", "the job", "task", "tasks", "item", "items", "own words", "own",
    "lane", "lanes", "mission", "identity", "principles", "operating principles", "self", "people", "person",
}
DROP_POS = {"DET", "PRON", "PUNCT", "SPACE", "NUM", "SYM", "PART", "CCONJ", "ADP"}


def roster_patterns(experts: list[dict]) -> list[dict]:
    """The studio's own roster as ruler patterns: names -> PERSON (exact case, token patterns), job titles -> ROLE.

    The small model has never seen these names and tags many of them ORG or GPE ("Anouk Varga" ORG, "Imani" GPE);
    a gazetteer for a closed, known list is the standard fix. ROLE is not in LABELS_SHOWN, so titles such as
    "UX Writer & Content Designer" are simply kept out of the ORG list instead of being shown as organisations."""
    pats, seen = [], set()
    for e in experts:
        for name in (e["name"], e["name"].split()[0]):
            if name not in seen:
                seen.add(name)
                pats.append({"label": "PERSON", "pattern": [{"ORTH": w} for w in name.split()], "id": "team-name"})
        for title in re.split(r"\s*/\s*", re.sub(r"\s*\(.*?\)", "", e["title"])):
            if title and title.lower() not in seen:
                seen.add(title.lower())
                pats.append({"label": "ROLE", "pattern": title, "id": "team-role"})
    return pats


@spacy.language.Language.component("line_sentences")
def line_sentences(doc):
    """build_nlp.clean() writes one sentence, heading or list item per line: a new line always starts a sentence.
    Set before the parser, which keeps these boundaries (otherwise "...specifying.\nMethod." is one sentence)."""
    for tok in doc[1:]:
        if "\n" in doc[tok.i - 1].text:
            tok.is_sent_start = True
    return doc


def load(patterns: Path, experts: list[dict] | None = None) -> spacy.language.Language:
    nlp = spacy.load(MODEL)
    nlp.add_pipe("line_sentences", before="parser")
    ruler = nlp.add_pipe("entity_ruler", before="ner",
                         config={"phrase_matcher_attr": "LOWER", "overwrite_ents": True})
    ruler.from_disk(str(patterns))
    if experts:
        ruler.add_patterns(roster_patterns(experts))
    return nlp


def chunk_topic(chunk) -> str | None:
    """Lemmatised noun chunk without determiners/pronouns; None when it is generic or too long."""
    toks = [t for t in chunk if t.pos_ not in DROP_POS and not t.is_stop and (t.is_alpha or "-" in t.text or "/" in t.text) and not any(ch in t.text for ch in "<>[]{}=")]
    if not toks or len(toks) > 4:
        return None
    lemma = " ".join(t.lemma_.lower() if t.pos_ == "NOUN" else t.text.lower() for t in toks).strip()
    if len(lemma) < 3 or lemma in GENERIC or all(len(t.text) < 3 for t in toks):
        return None
    return lemma


# Keyboard keys, units and placeholders the small model tags as PERSON, ORG or GPE ("Tab", "MB", the "MM" of YYYY-MM-DD).
NOT_NAMES = {"tab", "enter", "escape", "esc", "shift", "space", "kb", "mb", "gb", "ms", "px", "mm", "dd", "yyyy", "tbc",
             "todo", "n/a"}


def not_a_name(e, lower_words: set[str]) -> bool:
    """True when a statistical (non-ruler) entity is clearly not a name. en_core_web_sm was trained on news text,
    so on these markdown-derived profiles it labels headings, list labels and common words as PERSON/ORG/GPE."""
    t = " ".join(e.text.split())
    if t == t.lower() or not t[0].isalnum() or any(ch in t for ch in "/_()×÷→&,;:"):
        return True                      # lower-case word, identifier, symbol, formula or list ("Reach × Impact", "Added, Changed")
    if t.lower() in NOT_NAMES:
        return True
    if all(tok.is_punct or tok.is_space or tok in e for tok in e.sent):
        return True                      # the entity is the whole sentence: a heading or table header ("Boundaries.")
    if len(e) == 1:
        tok = e[0]
        if any(c.isdigit() for c in t) and any(c.isalpha() for c in t):
            return True                  # a code or identifier ("0F766E", "LLM10", "E0")
        if t.lower() in lower_words and not (t.isupper() and len(t) <= 2):
            return True                  # also used in lower case in this text: a common word ("Tab"/"tab", "RUN"/"run")
        if tok.pos_ in ("VERB", "ADJ", "ADV", "AUX") or (tok.pos_ == "NOUN" and not t.isupper()):
            return True                  # the tagger reads it as a verb or common noun ("Maintained", "Refine", "Specialist")
    return False


def entities(doc) -> list[list]:
    """[[text, label, count]] most frequent first. Ruler labels (TECH, STANDARD, METHOD and the team's names) are
    kept as they are; statistical entities go through not_a_name()."""
    lower_words = {t.text for t in doc if t.is_lower}
    c, surface = collections.Counter(), {}
    for e in doc.ents:
        t = " ".join(e.text.split())
        if e.label_ not in LABELS_SHOWN or len(t) < 2 or any(ch in t for ch in "<>[]{}=\\"):
            continue
        if e.label_ not in RULER_LABELS and e.ent_id_ != "team-name" and not_a_name(e, lower_words):
            continue
        key = (t.lower(), e.label_)
        c[key] += 1
        surface.setdefault(key, collections.Counter())[t] += 1
    rows = [[surface[k].most_common(1)[0][0], k[1], n] for k, n in c.items()]
    return sorted(rows, key=lambda x: (-x[2], x[1], x[0].lower()))


def topics(doc, n: int = 12, skip: set[str] | frozenset = frozenset()) -> list[list]:
    """Most frequent noun-chunk topics; `skip` holds phrases to leave out (the team's own names and job titles)."""
    c = collections.Counter(t for t in (chunk_topic(ch) for ch in doc.noun_chunks) if t and t not in skip)
    return [[t, k] for t, k in sorted(c.items(), key=lambda x: (-x[1], -len(x[0].split()), x[0]))[:n]]


def parse(sent) -> dict:
    """Arcs for one sentence (for the dependency view) and its root verb -> direct object summary."""
    toks = [{"i": t.i - sent.start, "text": t.text, "lemma": t.lemma_, "pos": t.pos_, "tag": t.tag_,
             "dep": t.dep_, "head": t.head.i - sent.start} for t in sent]
    root = sent.root
    objs = [c for c in root.children if c.dep_ in ("dobj", "obj", "attr", "oprd")]
    if not objs:  # "Create a landing page for ...": object can hang off an xcomp/conj verb
        for v in root.children:
            if v.dep_ in ("xcomp", "ccomp", "conj") and v.pos_ == "VERB":
                objs = [c for c in v.children if c.dep_ in ("dobj", "obj")]
                if objs:
                    break
    head = objs[0] if objs else root if root.pos_ in ("NOUN", "PROPN") else None
    thing, describers, for_whom = "", [], ""
    if head is not None:
        thing = " ".join(t.text for t in sorted([c for c in head.children if c.dep_ == "compound"] + [head], key=lambda t: t.i))
        describers = [c.text for c in head.children if c.dep_ in ("amod", "nummod") and c.pos_ != "DET"]
        for prep in head.children:
            if prep.dep_ == "prep" and prep.lower_ in ("for", "to"):
                pobj = [c for c in prep.children if c.dep_ == "pobj"]
                if pobj:
                    for_whom = " ".join(t.text for t in sent.doc[pobj[0].left_edge.i: pobj[0].i + 1] if t.pos_ != "DET")
    return {"text": sent.text, "root": root.lemma_, "root_pos": root.pos_, "object": thing, "describers": describers,
            "for": for_whom, "tokens": toks}


def explain(labels) -> dict:
    out = {}
    custom = {"TECH": "Technology, framework or tool (EntityRuler pattern)",
              "STANDARD": "Standard, regulation or metric (EntityRuler pattern)",
              "METHOD": "Research or product method (EntityRuler pattern)"}
    for l in sorted(set(labels)):
        out[l] = custom.get(l) or spacy.explain(l) or l
    return out


# Topic index weights (BM25, Robertson & Zaragoza 2009): saturating term frequency, normalised by profile length,
# times inverse document frequency over the expert profiles. Long profiles (the NLP experts have the most notes)
# do not win just by having more text, and a phrase used by many experts counts for less.
# Term and document frequencies are counted over each WHOLE profile: an earlier version counted only the phrases in an
# expert's top 60 noun chunks, so "production" looked specific (one owner) although most profiles use the word.
# The job title is a second field with its own idf over the 36 titles (see run()); a title term adds
# TITLE_WEIGHT x title idf to the expert's profile score for that phrase.
BM25_K1, BM25_B = 1.2, 0.75
TITLE_WEIGHT = 4    # title field weight (x idf); chosen on the 30 dev questions from 1.5, 2, 3, 4 (held-out not used)
MISSION_BONUS = 2   # noun chunks of the one-line mission count as 2 extra mentions
INDEX_TOPICS = 60   # noun-chunk topics per expert that become index phrases (their weights use every profile)
ENTITY_WEIGHT = 2   # each EntityRuler mention (TECH/STANDARD/METHOD) counts twice: a curated term, not house wording
MAX_OWNERS = 10     # experts kept per phrase, highest weight first (the coach shows three)


def bm25_idf(df: int, n: int) -> float:
    """BM25 idf with Lucene's +1, so it stays positive; phrases in more than half of the profiles are dropped before
    this is used (that is where the classic Robertson-Sparck Jones idf log((n-df+.5)/(df+.5)) reaches zero)."""
    return math.log((n - df + 0.5) / (df + 0.5) + 1)


def ruler_groups(patterns: Path) -> dict[str, list[str]]:
    """EntityRuler id -> the lower-cased surface forms of its TECH/STANDARD/METHOD patterns, in file order.

    Patterns that share an id are synonyms (spaCy's ent_id_): an acronym and its expansion ("NER", "named entity
    recognition"), or two spellings ("PostgreSQL", "Postgres"). The first form is the group's canonical topic phrase."""
    import json
    groups: dict[str, list[str]] = {}
    for line in open(patterns, encoding="utf-8"):
        if not line.strip():
            continue
        r = json.loads(line)
        if r["label"] not in RULER_LABELS:
            continue
        pat = r["pattern"]
        form = (pat if isinstance(pat, str) else " ".join(next(iter(d.values())) for d in pat)).lower()
        forms = groups.setdefault(r.get("id") or form, [])
        if form not in forms:
            forms.append(form)
    return groups


def term_form(t) -> str:
    """A token as chunk_topic() writes it: nouns lemmatised, other words as written, lower case."""
    return t.lemma_.lower() if t.pos_ == "NOUN" else t.text.lower()


def profile_counts(doc, n_max: int = 4) -> tuple[collections.Counter, set[str]]:
    """How often a profile uses every phrase of up to n_max content words (per sentence, written as chunk_topic()
    writes topics), and the set of those phrases plus each word's plain and lemma form. These give term and
    document frequency over the whole profile, not only over the expert's top noun chunks."""
    counts: collections.Counter = collections.Counter()
    seen: set[str] = set()
    for sent in doc.sents:
        seq = [term_form(t) for t in sent if t.pos_ not in DROP_POS and not t.is_stop and
               (t.is_alpha or "-" in t.text or "/" in t.text)]
        for n in range(1, n_max + 1):
            counts.update(" ".join(seq[i:i + n]) for i in range(len(seq) - n + 1))
        seen.update(w for t in sent for w in (t.text.lower(), t.lemma_.lower()) if any(c.isalpha() for c in w))
    return counts, seen | set(counts)


def own_terms(nlp, text: str) -> set[str]:
    """Topic phrases (cleaned noun chunks) of a short text such as a job title or a mission."""
    doc = nlp(text)
    out = {t for t in (chunk_topic(ch) for ch in doc.noun_chunks) if t}
    return out


def run(experts: list[dict], prompts: list[dict], patterns: Path) -> dict:
    """experts: [{slug, name, title, department, mission, text}], prompts: [{id, title, agent, text}]."""
    nlp = load(patterns, experts)
    out_experts = []
    label_totals = collections.Counter()
    # An expert's own terms: noun chunks of the job title, each noun in it, and the agent handle ("frontend engineer").
    titles = {e["slug"]: own_terms(nlp, re.sub(r"[()/&]", " , ", e["title"])) | {e["slug"].replace("-", " ")} |
              {t.lemma_.lower() for t in nlp(re.sub(r"[()/&]", " ", e["title"])) if t.pos_ in ("NOUN", "PROPN") and len(t) > 2}
              for e in experts}
    roster = {n.lower() for e in experts for n in (e["name"], e["name"].split()[0])}
    # Names, job titles and agent handles say who an expert hands work to, not what they know: not topics.
    skip = roster | {t for ts in titles.values() for t in ts if len(t.split()) > 1}
    groups = ruler_groups(patterns)
    # Canonical phrase of a group: its shortest form, so the acronym ("ner", "rag", "llm", "postgres") names it.
    canon = {i: min(forms, key=lambda f: (len(f.split()), len(f), forms.index(f))) for i, forms in groups.items()}
    alias_of = {f: canon[i] for i, forms in groups.items() for f in forms}   # every form -> its canonical phrase
    forms_of = {canon[i]: forms for i, forms in groups.items()}
    titles = {s: {alias_of.get(t, t) for t in ts} for s, ts in titles.items()}
    vocab: set[str] = set()                       # the index phrases
    tf: dict[str, collections.Counter] = {}       # slug -> phrase -> term frequency in the whole profile
    ngrams: dict[str, collections.Counter] = {}   # slug -> every phrase of up to 4 content words -> count
    lengths, seen = {}, {}
    docs = nlp.pipe([e["text"] for e in experts], batch_size=8)
    for e, doc in zip(experts, docs):
        ents = entities(doc)
        tops = topics(doc, 14, skip)
        for t, l, n in ents:
            label_totals[l] += n
        out_experts.append({"slug": e["slug"], "name": e["name"], "title": e["title"], "department": e["department"],
                            "entities": ents[:14], "topics": tops,
                            "counts": {"tokens": len(doc), "sentences": sum(1 for _ in doc.sents),
                                       "entities": sum(n for _, _, n in ents), "noun_chunks": sum(1 for _ in doc.noun_chunks)}})
        # Topic index for the live Prompt coach. Phrases: each expert's top noun chunks, ruler terms, mission chunks
        # and title terms; a noun chunk that is also a ruler form ("postgresql") is filed under its canonical phrase.
        slug = e["slug"]
        lengths[slug] = len(doc)
        ngrams[slug], seen[slug] = profile_counts(doc)
        counts = ngrams[slug]
        c = tf[slug] = collections.Counter()
        for t, k in topics(doc, 10 ** 6, skip):   # every noun chunk: a phrase's tf is counted in every profile
            t = alias_of.get(t, t)
            c[t] = max(c[t], k, counts.get(t, 0))
        for t, _ in topics(doc, INDEX_TOPICS, skip):
            vocab.add(alias_of.get(t, t))
        for ent in doc.ents:  # ruler terms, counted per synonym group: "NER" and "named entity recognition" add up
            if ent.label_ in RULER_LABELS and ent.ent_id_ in canon:
                t = canon[ent.ent_id_]
                c[t] += ENTITY_WEIGHT
                seen[slug].add(t)
                vocab.add(t)
        for t in own_terms(nlp, e.get("mission", "")) - roster:
            t = alias_of.get(t, t)
            c[t] += MISSION_BONUS
            vocab.add(t)
        vocab |= titles[slug]
        tf[slug] = c
    n_docs, avg_len = len(experts), sum(lengths.values()) / len(lengths)
    title_df = collections.Counter(t for ts in titles.values() for t in ts)
    phrases, dfs = [], {}
    for p in vocab:
        forms = forms_of.get(p, [p])
        # Profile field: BM25 with document frequency over whole profiles (any synonym counts). A phrase in more
        # than half of the profiles is house wording, not a topic ("build", "design", "production" is in 15 and
        # stays with a low idf): there the classic Robertson-Sparck Jones idf would be zero or negative.
        df = sum(1 for s in seen.values() if any(f in s for f in forms))
        weights = collections.Counter()
        if df <= n_docs // 2:
            idf = bm25_idf(df, n_docs)
            for e in experts:
                s = e["slug"]
                # Ruler terms: mentions x ENTITY_WEIGHT. Other phrases: noun-chunk count, or the phrase's count
                # anywhere in the profile when larger ("production" in "ship to production").
                k = tf[s].get(p, 0) if p in forms_of else max(tf[s].get(p, 0), ngrams[s].get(p, 0))
                if k:
                    weights[s] += k * (BM25_K1 + 1) / (k + BM25_K1 * (1 - BM25_B + BM25_B * lengths[s] / avg_len)) * idf
        # Title field, with its own document frequency over the 36 titles (per-field statistics, as a multi-field
        # search engine keeps them). In profiles, title words are common because experts name each other's lanes
        # ("hand security to Rosalind"), so "security" is in 21 profiles but in one title; it keeps its title weight
        # even where the profile field drops it.
        # The title idf says how uniquely a word names one expert; the profile idf says how specific the word is
        # in this studio's language. A title word counts with their geometric mean, so it must be both: "pyodide"
        # (1 title, 9 profiles) keeps a high weight, "build" of "Python Build Engineer" (1 title, 35 profiles) a low one.
        if title_df[p]:
            t_idf = math.sqrt(bm25_idf(title_df[p], n_docs) * bm25_idf(df, n_docs))
            for s, ts in titles.items():
                if p in ts:
                    weights[s] += TITLE_WEIGHT * t_idf
        if weights:
            dfs[p] = df
            phrases.append([p, sorted(([s, round(w, 3)] for s, w in weights.items()),
                                      key=lambda x: (-x[1], x[0]))[:MAX_OWNERS]])
    phrases.sort(key=lambda x: (-len(x[0].split()), x[0]))
    kept = {p for p, _ in phrases}
    dfs = {p: dfs[p] for p in sorted(kept)}
    aliases = {f: c for f, c in sorted(alias_of.items()) if f != c and c in kept}

    out_prompts = []
    for p, doc in zip(prompts, nlp.pipe([p["text"] for p in prompts])):
        goal = next((l for l in p["text"].splitlines() if l.upper().startswith("GOAL:")), p["text"].splitlines()[0])
        goal = re.sub(r"\[([^\]]+)\]", lambda m: m.group(1).title(), goal.split(":", 1)[-1].strip())  # [PRODUCT] -> Product
        first = next(iter(nlp(goal).sents))
        out_prompts.append({"id": p["id"], "title": p["title"], "agent": p["agent"], **parse(first),
                            "entities": entities(doc)[:8], "topics": topics(doc, 6)})

    demo = nlp("Build a fast, accessible landing page for a bike repair shop in Portland with a booking form.")
    demo_sent = next(iter(demo.sents))
    all_labels = ([l for e in out_experts for _, l, _ in e["entities"]] + [l for l, _ in label_totals.items()] +
                  [t[k] for p in [*out_prompts, parse(demo_sent)] for t in p["tokens"] for k in ("dep", "pos")])
    return {
        "model": f"{MODEL} {spacy.util.get_package_version(MODEL)}", "spacy": spacy.__version__,
        "pipeline": nlp.pipe_names, "patterns": sum(1 for _ in open(patterns, encoding="utf-8") if _.strip()),
        "roster_patterns": len(roster_patterns(experts)),
        "label_totals": sorted(([l, n] for l, n in label_totals.items()), key=lambda x: (-x[1], x[0])),
        "explain": explain(all_labels),
        "experts": out_experts, "prompts": out_prompts,
        "demo": {**parse(demo_sent), "entities": [[e.text, e.label_] for e in demo.ents],
                 "noun_chunks": [c.text for c in demo.noun_chunks]},
        "index": {"phrases": phrases, "aliases": aliases, "df": dfs, "docs": n_docs,
                  "weighting": f"BM25 k1={BM25_K1} b={BM25_B}, df over whole profiles, ruler term +{ENTITY_WEIGHT} per "
                               f"mention, mission +{MISSION_BONUS}, title field x{TITLE_WEIGHT} with its own idf, "
                               f"profile phrases in more than half of the profiles dropped",
                  "experts": {e["slug"]: {"name": e["name"], "title": e["title"]} for e in experts}},
    }
