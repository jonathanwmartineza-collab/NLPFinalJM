"""NLTK part of the NLP Lab: one module, run twice.

* At build time on Netlify (CPython 3.13, nltk 3.9.4) by nlp/build_nlp.py, which writes web/public/nlp/nltk.json.
* Live in the visitor's browser (Pyodide 314.0.8, which ships nltk 3.9.4) by the module worker web/src/nlp/nltk.worker.ts (+ boot.ts),
  which copies this exact file into Pyodide's file system.

Rules: standard library + nltk only, no printing, no file or network access, deterministic output (sorted,
rounded) and plain JSON-ready return values. NLTK data (punkt_tab, stopwords, vader_lexicon) must already be on
nltk.data.path: the build downloads it, the browser unpacks /nlp/nltk_data.zip.
"""
from __future__ import annotations

import re

from nltk import FreqDist
from nltk.collocations import BigramAssocMeasures, BigramCollocationFinder
from nltk.corpus import stopwords
from nltk.sentiment.vader import SentimentIntensityAnalyzer
from nltk.stem import PorterStemmer
from nltk.tokenize import sent_tokenize, word_tokenize

VERSION = "1"
_STOP: set[str] | None = None
_VADER: SentimentIntensityAnalyzer | None = None
_STEM = PorterStemmer()

# Words that look like content but carry little meaning in this app's texts.
EXTRA_STOP = {"use", "using", "used", "would", "could", "also", "one", "make", "get", "like", "need", "want", "e.g",
              "i.e", "etc", "via", "per", "within", "without", "every", "each", "may", "might", "must", "shall"}


# ---------------------------------------------------------------- basics
def _stop() -> set[str]:
    global _STOP
    if _STOP is None:
        _STOP = set(stopwords.words("english")) | EXTRA_STOP
    return _STOP


def _vader() -> SentimentIntensityAnalyzer:
    global _VADER
    if _VADER is None:
        _VADER = SentimentIntensityAnalyzer()
    return _VADER


def tokenize(text: str) -> list[str]:
    """Word tokens (NLTK word_tokenize with punkt_tab), punctuation-only tokens removed."""
    return [t for t in word_tokenize(text) if any(c.isalnum() for c in t)]


def sentences(text: str) -> list[str]:
    return [s.strip() for s in sent_tokenize(text) if s.strip()]


def content_words(tokens: list[str]) -> list[str]:
    """Lower-cased tokens without stopwords, numbers-only tokens or one-letter tokens."""
    stop = _stop()
    out = []
    for t in tokens:
        w = t.lower().strip("'’`")
        if len(w) > 1 and w not in stop and any(c.isalpha() for c in w):
            out.append(w)
    return out


def top_words(words: list[str], n: int = 20) -> list[list]:
    fd = FreqDist(words)
    return sorted(([w, c] for w, c in fd.items()), key=lambda x: (-x[1], x[0]))[:n]


def collocations(words: list[str], n: int = 10, min_freq: int = 2) -> list[list]:
    """Bigram collocations ranked by Dunning's likelihood ratio (word pairs that occur together more than chance)."""
    if len(words) < 3:
        return []
    finder = BigramCollocationFinder.from_words(words)
    finder.apply_freq_filter(min_freq)
    scored = finder.score_ngrams(BigramAssocMeasures.likelihood_ratio)
    scored = sorted(scored, key=lambda x: (-round(x[1], 6), x[0]))[:n]
    return [[a, b, round(s, 2), finder.ngram_fd[(a, b)]] for (a, b), s in scored]


def label(compound: float) -> str:
    """VADER's recommended thresholds: >= 0.05 positive, <= -0.05 negative, otherwise neutral."""
    return "positive" if compound >= 0.05 else "negative" if compound <= -0.05 else "neutral"


def sentiment(text: str) -> dict:
    s = {k: round(v, 3) for k, v in _vader().polarity_scores(text).items()}
    s["label"] = label(s["compound"])
    return s


def analyze(text: str, top_n: int = 12, max_sentences: int = 40) -> dict:
    """Full NLTK breakdown of one text: counts, top words, collocations and VADER per sentence."""
    text = (text or "").strip()
    sents = sentences(text) if text else []
    tokens = tokenize(text) if text else []
    words = content_words(tokens)
    per = [{"text": s[:300], **sentiment(s)} for s in sents[:max_sentences]]
    return {
        "counts": {"characters": len(text), "sentences": len(sents), "tokens": len(tokens),
                   "content_words": len(words), "unique_content_words": len(set(words))},
        "top_words": top_words(words, top_n),
        "collocations": collocations(words, 8, 2 if len(words) > 60 else 1),
        "sentiment": sentiment(text) if text else sentiment(""),
        "sentences": per,
    }


# ---------------------------------------------------------------- prompt coach
# Vague words and what to say instead. Matched on lower-cased NLTK tokens (single words) or token sequences.
VAGUE = {
    "thing": "name the exact feature, page or document",
    "things": "list the items you mean",
    "stuff": "list the items you mean",
    "something": "say what kind of result you want",
    "good": "say what good means here: faster, cheaper, clearer, more sales?",
    "better": "better than what, and measured how?",
    "best": "best for whom, judged on what?",
    "nice": "describe the look or effect you want",
    "improve": "say what to improve and by how much",
    "optimize": "say what to optimise for: speed, cost, conversions?",
    "fix": "describe what is wrong now and what should happen",
    "various": "name them",
    "some": "give a number or name them",
    "etc": "finish the list",
    "somehow": "say what you have tried",
    "stuff like that": "finish the list",
    "and so on": "finish the list",
    "a lot": "give a number",
    "asap": "give a date",
    "soon": "give a date",
    "modern": "name a site or style you like",
    "simple": "say what can be left out",
}
HEDGES = ["maybe", "perhaps", "kind of", "sort of", "i think", "i guess", "probably", "just", "basically", "really"]
FORMAT_WORDS = {"list", "table", "steps", "step", "bullet", "bullets", "checklist", "example", "examples", "code",
                "outline", "template", "draft", "plan", "summary", "words", "sentences", "paragraph", "json", "email"}
CONSTRAINT_WORDS = {"budget", "deadline", "by", "under", "within", "limit", "max", "maximum", "minimum", "only",
                    "must", "without", "before", "less", "fewer", "words", "minutes", "hours", "days", "weeks", "$"}
AUDIENCE_RE = re.compile(r"\bfor (?:a |an |the |my |our )?([a-z][a-z\- ]{2,40}?)(?:[,.?!]|\bwho\b|\bthat\b|$)", re.I)


def _stems(words: list[str]) -> list[str]:
    return [_STEM.stem(w) for w in words]


def match_topics(text: str, index: dict | None, n_topics: int = 6, n_experts: int = 3) -> dict:
    """Match a question against the spaCy topic index built at deploy time (noun-chunk phrases per expert).

    index = {"phrases": [[phrase, [[slug, weight], ...]], ...], "experts": {slug: {"name", "title"}}}
    A phrase matches when every one of its stemmed words appears in the question (NLTK Porter stems).
    """
    if not index:
        return {"topics": [], "experts": []}
    q = set(_stems(content_words(tokenize(text))))
    if not q:
        return {"topics": [], "experts": []}
    hits, scores = [], {}
    for phrase, owners in index.get("phrases", []):
        ps = _stems(content_words(phrase.split()))
        if not ps or not all(s in q for s in ps):
            continue
        weight = sum(w for _, w in owners)
        hits.append((len(ps), weight, phrase))
        for slug, w in owners:
            scores[slug] = scores.get(slug, 0.0) + w * len(ps)
    hits.sort(key=lambda h: (-h[0], -h[1], h[2]))
    topics, seen = [], set()
    for _, _, p in hits:
        # Skip a single word already covered by a longer matched phrase.
        if any(p in t for t in seen):
            continue
        seen.add(p)
        topics.append(p)
        if len(topics) >= n_topics:
            break
    experts = sorted(scores.items(), key=lambda x: (-x[1], x[0]))[:n_experts]
    meta = index.get("experts", {})
    return {"topics": topics,
            "experts": [{"slug": s, "name": meta.get(s, {}).get("name", s), "title": meta.get(s, {}).get("title", ""),
                         "score": round(v, 2)} for s, v in experts]}


def coach(text: str, index: dict | None = None) -> dict:
    """Prompt coach: flags vague wording with NLTK, scores how specific the question is, suggests a sharper one."""
    text = (text or "").strip()
    tokens = tokenize(text)
    low = [t.lower() for t in tokens]
    joined = " " + " ".join(low) + " "
    words = content_words(tokens)

    vague = []
    for phrase, tip in VAGUE.items():
        n = joined.count(" " + phrase + " ")
        if n:
            vague.append({"word": phrase, "count": n, "tip": tip})
    vague.sort(key=lambda v: (-v["count"], v["word"]))
    hedges = [h for h in HEDGES if (" " + h + " ") in joined]

    has_number = any(any(c.isdigit() for c in t) for t in tokens)
    has_format = any(w in FORMAT_WORDS for w in low)
    has_constraint = any(w in CONSTRAINT_WORDS for w in low) or "$" in text
    audience = AUDIENCE_RE.search(text)
    checks = [
        {"id": "length", "ok": len(words) >= 6, "label": "Enough detail",
         "tip": "Add the context: what you are building and for whom." if len(words) < 6 else ""},
        {"id": "audience", "ok": bool(audience), "label": "Says who it's for",
         "tip": "" if audience else "Add who it is for, e.g. 'for first-time home buyers'."},
        {"id": "format", "ok": has_format, "label": "Asks for a format",
         "tip": "" if has_format else "Say the shape of the answer: a 5-step list, a table, a short email…"},
        {"id": "constraint", "ok": has_constraint or has_number, "label": "Gives a limit or number",
         "tip": "" if (has_constraint or has_number) else "Add a limit: budget, deadline, length or a number."},
        {"id": "vague", "ok": not vague, "label": "No vague words",
         "tip": "" if not vague else "Replace: " + ", ".join(v["word"] for v in vague[:4]) + "."},
    ]
    score = 0
    if text:
        score = round(100 * sum(1 for c in checks if c["ok"]) / len(checks) - 5 * len(hedges))
        score = max(0, min(100, score))

    topics = match_topics(text, index)
    # A sharper version: keep the question, swap vague words for [what to fill in] and add what is missing.
    sharper = text
    for v in vague[:5]:
        sharper = re.sub(r"\b" + re.escape(v["word"]) + r"\b", "[" + v["tip"].split(":")[0].split(",")[0] + "]",
                         sharper, count=1, flags=re.I)
    for h in hedges:
        sharper = re.sub(r"\b" + re.escape(h) + r"\b\s*", "", sharper, flags=re.I)
    sharper = re.sub(r"\s{2,}", " ", sharper).strip()
    adds = []
    if not audience:
        adds.append("It's for [who].")
    if not (has_constraint or has_number):
        adds.append("Limits: [budget, deadline or length].")
    if not has_format:
        adds.append("Answer as [a short numbered list / a table].")
    if topics["topics"]:
        adds.append("Focus on " + ", ".join(topics["topics"][:3]) + ".")
    if text and adds:
        sharper = (sharper.rstrip() + ("" if sharper.rstrip().endswith((".", "?", "!")) else ".") + " " + " ".join(adds))

    return {"score": score, "vague": vague, "hedges": hedges, "checks": checks,
            "sentiment": sentiment(text), "keywords": top_words(words, 8),
            "topics": topics["topics"], "experts": topics["experts"], "sharper": sharper if text else ""}


# ---------------------------------------------------------------- team agreement map
RECOMMEND_RE = re.compile(
    r"\b(?:i(?:'d| would)? recommend(?:ing)?|we recommend|recommend(?:ed)?|go with|choose|pick|prefer|opt for|use)\s+"
    r"(?:a |an |the |using |building )?([A-Za-z][\w\-\.]*(?: [A-Za-z][\w\-\.]*)?)", re.I)


def _key_terms(text: str, phrases: list[str], n: int = 10) -> list[str]:
    words = content_words(tokenize(text))
    stems = set(_stems(words))
    found = []
    for p in phrases:  # spaCy topic phrases (multi-word first) that occur in this answer
        ps = _stems(content_words(p.split()))
        if len(ps) > 1 and all(s in stems for s in ps) and p.lower() in text.lower():
            found.append(p)
    singles = [w for w, _ in top_words(words, n * 2) if not any(w in f.split() for f in found)]
    return (found[: n // 2] + singles)[:n]


def agreement(answers: list[dict], phrases: list[str] | None = None) -> dict:
    """Agreement map for team answers: NLTK main ideas + VADER tone per expert, shared and unique ideas,
    pairwise overlap, and conflicting recommendations. answers = [{"name": str, "text": str}, ...]."""
    phrases = sorted(phrases or [], key=lambda p: (-len(p.split()), p))
    experts = []
    for a in answers:
        text = a.get("text", "") or ""
        terms = _key_terms(text, phrases)
        recs = []
        for m in RECOMMEND_RE.finditer(text):
            r = m.group(1).strip(" .").lower()
            if r not in recs and r not in _stop():
                recs.append(r)
        experts.append({"name": a.get("name", "Expert"), "terms": terms, "stems": sorted(set(_stems(terms))),
                        "sentiment": sentiment(text), "recommends": recs[:3]})
    # Ideas shared by two or more experts (compared by stem, shown by the first surface form).
    owners: dict[str, list[int]] = {}
    surface: dict[str, str] = {}
    for i, e in enumerate(experts):
        for t in e["terms"]:
            key = " ".join(_stems(t.split()))
            surface.setdefault(key, t)
            if i not in owners.setdefault(key, []):
                owners[key].append(i)
    shared = sorted(([surface[k], [experts[i]["name"] for i in v]] for k, v in owners.items() if len(v) > 1),
                    key=lambda x: (-len(x[1]), x[0]))
    pairs = []
    for i in range(len(experts)):
        for j in range(i + 1, len(experts)):
            a, b = experts[i], experts[j]
            sa = {" ".join(_stems(t.split())) for t in a["terms"]}
            sb = {" ".join(_stems(t.split())) for t in b["terms"]}
            jac = len(sa & sb) / len(sa | sb) if (sa | sb) else 0.0
            tone_gap = abs(a["sentiment"]["compound"] - b["sentiment"]["compound"])
            rec_conflict = bool(a["recommends"] and b["recommends"] and not set(a["recommends"]) & set(b["recommends"]))
            if rec_conflict or (a["sentiment"]["label"] != b["sentiment"]["label"] and tone_gap >= 0.5):
                verdict = "disagree"
            elif jac >= 0.2:
                verdict = "agree"
            else:
                verdict = "different angles"
            pairs.append({"a": a["name"], "b": b["name"], "overlap": round(jac, 2), "tone_gap": round(tone_gap, 2),
                          "conflict": rec_conflict, "verdict": verdict})
    for e in experts:
        e.pop("stems", None)
        e["unique"] = [t for t in e["terms"] if len(owners.get(" ".join(_stems(t.split())), [])) == 1][:5]
    return {"experts": experts, "shared": shared[:10], "pairs": pairs}
