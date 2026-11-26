"""spaCy part of the NLP Lab (build time only, en_core_web_sm 3.8.0).

spaCy is not in the Pyodide distribution, so it runs once per Netlify build and its results ship as static JSON
(web/public/nlp/spacy.json). It does four jobs:
  1. Named entities, with an EntityRuler (nlp/patterns.jsonl) placed before the statistical NER so the app's own
     vocabulary (TECH, STANDARD, METHOD) is recognised: e.g. "WCAG 2.2", "Pyodide", "A/B test".
  2. Noun-chunk topics per expert (lemmatised, generic chunks removed).
  3. Dependency parses of the prompt library: what each prompt asks for (root verb -> its object), plus full arcs.
  4. A topic index (phrase -> experts) used live by the Prompt coach and the Team agreement map.
"""
from __future__ import annotations

import collections
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


def load(patterns: Path) -> spacy.language.Language:
    nlp = spacy.load(MODEL)
    ruler = nlp.add_pipe("entity_ruler", before="ner",
                         config={"phrase_matcher_attr": "LOWER", "overwrite_ents": True})
    ruler.from_disk(str(patterns))
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


def entities(doc) -> list[list]:
    """[[text, label, count]] most frequent first, ruler labels included."""
    c, surface = collections.Counter(), {}
    for e in doc.ents:
        t = " ".join(e.text.split())
        if e.label_ not in LABELS_SHOWN or len(t) < 2 or any(ch in t for ch in "<>[]{}=/\\"):
            continue
        if e.label_ not in RULER_LABELS and t == t.lower():  # statistical NER on lower-case words is mostly noise
            continue
        key = (t.lower(), e.label_)
        c[key] += 1
        surface.setdefault(key, collections.Counter())[t] += 1
    rows = [[surface[k].most_common(1)[0][0], k[1], n] for k, n in c.items()]
    return sorted(rows, key=lambda x: (-x[2], x[1], x[0].lower()))


def topics(doc, n: int = 12) -> list[list]:
    c = collections.Counter(filter(None, (chunk_topic(ch) for ch in doc.noun_chunks)))
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


def run(experts: list[dict], prompts: list[dict], patterns: Path) -> dict:
    """experts: [{slug, name, title, department, text}], prompts: [{id, title, agent, text}]."""
    nlp = load(patterns)
    out_experts, index = [], collections.defaultdict(dict)
    label_totals = collections.Counter()
    docs = nlp.pipe([e["text"] for e in experts], batch_size=8)
    for e, doc in zip(experts, docs):
        ents = entities(doc)
        tops = topics(doc, 14)
        for t, l, n in ents:
            label_totals[l] += n
        out_experts.append({"slug": e["slug"], "name": e["name"], "title": e["title"], "department": e["department"],
                            "entities": ents[:14], "topics": tops,
                            "counts": {"tokens": len(doc), "sentences": sum(1 for _ in doc.sents),
                                       "entities": len(doc.ents), "noun_chunks": sum(1 for _ in doc.noun_chunks)}})
        # Topic index for the live Prompt coach: phrases (topics + ruler entities) -> expert weights.
        for t, k in topics(doc, 40):
            index[t][e["slug"]] = index[t].get(e["slug"], 0) + k
        for t, l, n in ents:
            if l in ("TECH", "STANDARD", "METHOD"):
                key = t.lower()
                index[key][e["slug"]] = index[key].get(e["slug"], 0) + 2 * n
    # Weight = share of the phrase that belongs to each expert (rare, specific phrases decide more).
    phrases = []
    for p, owners in index.items():
        total = sum(owners.values())
        spread = len(owners)
        if spread > 8:  # in most experts' profiles: not distinctive
            continue
        phrases.append([p, sorted([[s, round(c / total / spread * min(c, 5), 3)] for s, c in owners.items()],
                                  key=lambda x: (-x[1], x[0]))])
    phrases.sort(key=lambda x: (-len(x[0].split()), x[0]))

    out_prompts = []
    for p, doc in zip(prompts, nlp.pipe([p["text"] for p in prompts])):
        goal = next((l for l in p["text"].splitlines() if l.upper().startswith("GOAL:")), p["text"].splitlines()[0])
        goal = re.sub(r"\[([^\]]+)\]", lambda m: m.group(1).title(), goal.split(":", 1)[-1].strip())  # [PRODUCT] -> Product
        first = next(iter(nlp(goal).sents))
        out_prompts.append({"id": p["id"], "title": p["title"], "agent": p["agent"], **parse(first),
                            "entities": entities(doc)[:8], "topics": topics(doc, 6)})

    demo = nlp("Build a fast, accessible landing page for a bike repair shop in Portland with a booking form.")
    demo_sent = next(iter(demo.sents))
    all_labels = [l for e in out_experts for _, l, _ in e["entities"]] + [t["dep"] for p in out_prompts for t in p["tokens"]]
    return {
        "model": f"{MODEL} {spacy.util.get_package_version(MODEL)}", "spacy": spacy.__version__,
        "pipeline": nlp.pipe_names, "patterns": sum(1 for _ in open(patterns, encoding="utf-8") if _.strip()),
        "label_totals": sorted(([l, n] for l, n in label_totals.items()), key=lambda x: (-x[1], x[0])),
        "explain": explain(all_labels),
        "experts": out_experts, "prompts": out_prompts,
        "demo": {**parse(demo_sent), "entities": [[e.text, e.label_] for e in demo.ents],
                 "noun_chunks": [c.text for c in demo.noun_chunks]},
        "index": {"phrases": phrases,
                  "experts": {e["slug"]: {"name": e["name"], "title": e["title"]} for e in experts}},
    }
