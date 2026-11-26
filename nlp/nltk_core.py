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

# Size caps, so a huge paste never freezes the visitor's browser: VADER's polarity_scores is quadratic in the
# number of words, and 200,000 characters already take seconds in Pyodide. Longer input is cut at a word
# boundary and the result says so in "note".
MAX_ANALYZE_CHARS = 100_000
MAX_COACH_CHARS = 20_000
MAX_ANSWER_CHARS = 20_000
MAX_ANSWERS = 20


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


def _str(x) -> str:
    """Any input as text: None becomes "", other non-strings their str()."""
    return x if isinstance(x, str) else "" if x is None else str(x)


def clip(text: str, limit: int) -> tuple[str, bool]:
    """Cut text to at most `limit` characters, at the last whitespace when there is one. Returns (text, was_cut)."""
    if len(text) <= limit:
        return text, False
    cut = text[:limit]
    space = max(cut.rfind(" "), cut.rfind("\n"))
    return (cut[:space] if space > limit // 2 else cut).rstrip(), True


def _cut_note(limit: int, total: int) -> str:
    return (f"Only the first {limit:,} of {total:,} characters were used, so your browser stays fast. "
            "Paste a shorter part to analyse the rest.")


# Links: with a scheme or www., protocol-relative ("//cdn.example/x.js"), or a bare host with a path
# ("evil.example/steal"). A dotted name without a path ("Next.js", "Vue.js") is left alone.
_URL_TAIL = r"[^\s<>\"'`]*"
_URL_RE = re.compile(r"(?:https?://|www\.)" + _URL_TAIL + r"|(?<![\w:/])//[\w-]+(?:\.[\w-]+)+" + _URL_TAIL +
                     r"|\b(?:[A-Za-z0-9-]+\.)+[A-Za-z]{2,}/" + _URL_TAIL, re.I)
_MD_LINK_RE = re.compile(r"\[([^\]]*)\]\([^)]*\)")
_TAG_RE = re.compile(r"</?[A-Za-z][^>]{0,200}>")
_FENCE_RE = re.compile(r"```[^\n]*")


def plain(text: str) -> str:
    """Text without the Markdown, HTML tags and URLs that model answers and pasted chats carry, so that
    "**Next.js**", "<script>" or "https://..." do not become words or hide a recommendation."""
    text = _MD_LINK_RE.sub(r"\1", text)
    text = _TAG_RE.sub(" ", text)       # tags first: a link inside <script src="..."> goes with its tag
    text = _URL_RE.sub(" ", text)
    text = _FENCE_RE.sub(" ", text)
    text = re.sub(r"[*`#>|~]+", " ", text)
    text = re.sub(r"(?<![\w])_+|_+(?![\w])", " ", text)
    return re.sub(r"[ \t]{2,}", " ", text)


# Speaker labels at the start of a line in a pasted chat: "User:", "Expert:", "SYSTEM:", "Nora Lindahl:".
_LABEL_RE = re.compile(r"^[ \t]*([A-Za-z][\w'.-]*(?: [A-Za-z][\w'.-]*){0,2})[ \t]*:[ \t]+", re.M)
ROLE_LABELS = {"user", "assistant", "system", "expert", "human", "ai", "bot", "claude", "model", "me", "you", "q", "a",
               "question", "answer", "developer", "moderator"}


def strip_speakers(text: str) -> str:
    """Text without chat speaker labels at line starts, so "User:" and "Expert:" do not top the word counts.
    A label is a known role word ("User", "SYSTEM"), a one-to-three-word name that starts two or more lines, or,
    once the text looks like a transcript (two or more labelled lines), any capitalised name ("Santiago Reyes").
    A single "Note: ..." line in ordinary text is kept."""
    found = [m.group(1) for m in _LABEL_RE.finditer(text)]
    starts = [l.lower() for l in found]
    transcript = sum(1 for l in starts if l in ROLE_LABELS or starts.count(l) >= 2) >= 2 or len(found) >= 3
    labels = {l.lower() for l in found if l.lower() in ROLE_LABELS or starts.count(l.lower()) >= 2 or
              (transcript and all(w[:1].isupper() for w in l.split()))}
    if not labels:
        return text
    # Each labelled turn becomes its own paragraph, so a sentence never runs from one speaker into the next.
    return _LABEL_RE.sub(lambda m: "\n" if m.group(1).lower() in labels else m.group(0), text)


def paragraph_sentences(text: str) -> list[str]:
    """Sentences (NLTK punkt) within paragraphs: a blank line always ends a sentence."""
    return [s for para in re.split(r"\n[ \t]*\n", text) for s in sentences(para)]


def readable(text: str) -> str:
    """What a person reads in a pasted chat or answer: no Markdown, HTML tags, links or speaker labels."""
    return strip_speakers(plain(text))


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


def _not_collocation_word(w: str) -> bool:
    """True for the words a collocation may not contain: stopwords, punctuation, numbers, one-letter tokens."""
    return len(w) < 2 or w in _stop() or not any(c.isalpha() for c in w)


def collocations(tokens: list[str] | list[list[str]], n: int = 10, min_freq: int = 2) -> list[list]:
    """Bigram collocations ranked by Dunning's likelihood ratio (word pairs that occur together more than chance).

    `tokens` is the real token sequence (punctuation included), or one such list per sentence. The finder is built
    on that order and stopwords, punctuation and numbers are then removed with NLTK's apply_word_filter, so a
    pair is only counted when the two words really stand next to each other: in "speed of the build", "speed" and
    "build" are not a pair, and no pair runs across a comma or a sentence end."""
    docs = [tokens] if not tokens or isinstance(tokens[0], str) else tokens
    docs = [[t.lower().strip("'’`") for t in d] for d in docs]
    if sum(len(d) for d in docs) < 3:
        return []
    finder = BigramCollocationFinder.from_documents(docs)
    finder.apply_word_filter(_not_collocation_word)
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
    original = _str(text).strip()
    text, cut = clip(original, MAX_ANALYZE_CHARS)
    # Words, collocations and sentence tones come from the readable text: Markdown, HTML tags, links and chat
    # speaker labels removed, so "/script", "//evil.example" or "User" never become top words.
    clean = readable(text).strip() if text else ""
    sents = paragraph_sentences(clean) if clean else []
    tokens = tokenize(clean) if clean else []
    words = content_words(tokens)
    per = [{"text": s[:300], **sentiment(s)} for s in sents[:max_sentences]]
    return {
        "counts": {"characters": len(text), "sentences": len(sents), "tokens": len(tokens),
                   "content_words": len(words), "unique_content_words": len(set(words))},
        "top_words": top_words(words, top_n),
        "collocations": collocations([word_tokenize(s) for s in sents], 8, 2 if len(words) > 60 else 1),
        "sentiment": sentiment(clean) if clean else sentiment(""),
        "sentences": per,
        "note": _cut_note(MAX_ANALYZE_CHARS, len(original)) if cut else "",
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
# Words that are a limit wherever they stand ("on a budget", "must work offline", "only free tools").
CONSTRAINT_WORDS = {"budget", "deadline", "limit", "limits", "max", "maximum", "minimum", "only", "must", "without",
                    "words", "minutes", "hours", "days", "weeks", "months", "$"}
# Words that are a limit only before a date, a time, an amount or a unit: "by Friday", "within a week",
# "under budget", "no more than ten" count, but "made by students", "under the hood" or "less jargon" do not.
# (A digit anywhere already counts as a number, so "by 5pm" or "under 200 words" pass that way too.)
_LIMIT_WORD = (r"(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|today|tonight|tomorrow|noon|midnight|"
               r"eod|eow|eom|launch|deadline|budget|january|february|march|april|june|july|august|september|october|"
               r"november|december|jan|feb|aug|sept|oct|nov|dec|q[1-4]|two|three|four|five|six|seven|eight|nine|ten|"
               r"eleven|twelve|fifteen|twenty|thirty|forty|fifty|hundred|thousand|million|half)")
# A time unit is a limit only in a deadline or duration phrase ("within a week", "by the end of the month",
# "by next week"), never in "day by day" or "paid by the hour".
_LIMIT_UNIT = r"(?:week|weekend|month|year|quarter|sprint|day|hour|minute)\b"
LIMIT_RE = re.compile(
    r"\b(?:(?:by|under|within|before|below|less than|fewer than|no more than|no later than|at most|at least|up to|"
    r"not exceed|not to exceed|capped at)\s+(?:(?:the|this|next|our|my|end of|start of)\s+)*(?:[\d$€£]|" + _LIMIT_WORD + r"\b)"
    r"|(?:by|before)\s+(?:the\s+)?(?:end|start) of\s+(?:the\s+|this\s+|next\s+)?" + _LIMIT_UNIT +
    r"|(?:by|before)\s+(?:this|next)\s+" + _LIMIT_UNIT +
    r"|(?:under|within|in less than|less than|no more than|at most|up to)\s+(?:a|an|one|the|this)\s+" + _LIMIT_UNIT + r")",
    re.I)

# Who the answer is for: "for" (or "aimed at", "targeting") and a word that names someone, so "for blind users"
# and "for night nurses about patient handover safety" count but "for example", "for now" or "for 2 weeks" do not.
AUDIENCE_RE = re.compile(r"\b(?:for|aimed at|targeted at|targeting)\s+(?:(?:a|an|the|my|our|their|your|all|new)\s+)*"
                         r"([A-Za-z][A-Za-z\-']*)", re.I)
NOT_AUDIENCE = {"example", "instance", "now", "free", "sure", "real", "ever", "good", "long", "while", "today",
                "tomorrow", "later", "once", "year", "years", "day", "days", "week", "weeks", "month", "months",
                "hour", "hours", "minute", "minutes", "second", "seconds", "more", "less", "everyone", "anyone"}
# Common function words of other languages written in Latin script (Spanish, French, German, Portuguese, Italian).
FOREIGN_WORDS = {"de", "la", "que", "el", "los", "las", "del", "por", "una", "para", "con", "es", "mi", "pero",
                 "como", "muy", "le", "les", "des", "est", "et", "pour", "une", "dans", "avec", "je", "vous", "nous",
                 "pas", "der", "und", "ist", "nicht", "ich", "mit", "für", "ein", "eine", "das", "não", "um", "os",
                 "com", "di", "che", "il", "per", "non", "sono", "qué", "cómo", "más", "est-ce"}
NOT_ENGLISH_NOTE = ("This does not look like English. NLTK's tokenizer, stopword list and VADER lexicon used here are "
                    "English, so treat the score and tone as a rough guide.")
_STEM_CACHE: dict[str, str] = {}


def _stem(w: str) -> str:
    s = _STEM_CACHE.get(w)
    if s is None:
        if len(_STEM_CACHE) > 50_000:
            _STEM_CACHE.clear()
        s = _STEM_CACHE[w] = _STEM.stem(w)
    return s


def _stems(words: list[str]) -> list[str]:
    return [_stem(w) for w in words]


def _audience(text: str) -> bool:
    for m in AUDIENCE_RE.finditer(text):
        w = m.group(1).lower().strip("'-")
        if w and w not in _stop() and w not in NOT_AUDIENCE:
            return True
    return False


def looks_english(tokens: list[str]) -> bool:
    """False when most letters are not Latin (Chinese, Arabic, ...) or other languages' function words
    outnumber English stopwords (Spanish, French, ...). Only used to warn that the English tools may be off."""
    import unicodedata
    letters = [c for t in tokens for c in t if c.isalpha()]
    if not letters:
        return True
    latin = sum(1 for c in letters if unicodedata.name(c, "").startswith("LATIN"))
    if latin < 0.7 * len(letters):
        return False
    low = [t.lower() for t in tokens]
    foreign = sum(1 for w in low if w in FOREIGN_WORDS)
    english = sum(1 for w in low if w in _stop())
    return not (foreign >= 2 and foreign > english)


def match_topics(text: str, index: dict | None, n_topics: int = 6, n_experts: int = 3,
                 skip: set[str] | frozenset = frozenset()) -> dict:
    """Match a question against the spaCy topic index built at deploy time (noun-chunk phrases and EntityRuler
    terms per expert, BM25-weighted).

    index = {"phrases": [[phrase, [[slug, weight], ...]], ...], "experts": {slug: {"name", "title"}},
             optional "aliases": {form: phrase}}  (EntityRuler synonyms: "named entity recognition" -> "ner")
    A phrase matches when every one of its stemmed words appears in the question (NLTK Porter stems, lower case,
    so "RAG", "rag" and "Rag" are the same), or when one of its aliases does. Against Porter's over-stemming, the
    question's word and the phrase's word must also be of comparable length ("access" does not match
    "accessibility"). An expert's score is the sum, over
    matched phrases, of its weight times the phrase's number of words (a two-word phrase is more specific than
    either word). The weights already carry specificity: BM25 idf over whole profiles, and the build drops words
    that more than half of the profiles use ("production", "second") unless they are in an expert's own title.
    Phrases that stem to the same words ("persona", "personas") count once. Phrases in `skip` (for example the
    vague words the coach already flags) are ignored.
    """
    if not index:
        return {"topics": [], "experts": []}
    q: dict[str, list[str]] = {}          # stem -> the question's words with that stem
    for w in content_words(tokenize(text)):
        q.setdefault(_stem(w), []).append(w)
    if not q:
        return {"topics": [], "experts": []}

    def has(word: str, stem: str) -> bool:
        # Porter over-stems some words ("accessibility" and "access" both become "access"): a stem match counts
        # only when the two words are of comparable length (the shorter at least half the longer).
        return any(2 * min(len(w), len(word)) >= max(len(w), len(word)) for w in q.get(stem, ()))

    alt: dict[str, list[str]] = {}
    for form, phrase in (index.get("aliases") or {}).items():
        alt.setdefault(phrase, []).append(form)
    found = []
    for phrase, owners in index.get("phrases", []):
        if phrase.lower() in skip:
            continue
        for form in [phrase, *sorted(alt.get(phrase, []))]:
            pw = content_words(form.split())
            ps = _stems(pw)
            if ps and all(has(w, s) for w, s in zip(pw, ps)):
                found.append((len(ps), sum(w for _, w in owners), phrase, tuple(sorted(set(ps))), owners))
                break
    # Longer phrases first, then the most specific (used by the fewest profiles: the index's "df"), so the coach's
    # "Focus on ..." names "rag" and "pgvector" before "policy" or "second".
    df = index.get("df") or {}
    found.sort(key=lambda h: (-h[0], df.get(h[2], 0), -h[1], h[2]))
    hits, scores, keys = [], {}, set()
    for n, weight, phrase, key, owners in found:
        if key in keys:          # same stems as a phrase already counted
            continue
        keys.add(key)
        hits.append(phrase)
        for slug, w in owners:
            scores[slug] = scores.get(slug, 0.0) + w * n
    topics, seen = [], set()
    for p in hits:
        # Skip a single word already covered by a longer matched phrase.
        if any(all(w in t.split() for w in p.split()) for t in seen):
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


def _phrase_re(phrase: str) -> str:
    """A word or phrase as a regex that matches whole words only (not inside "just-in-time" or "[better]")."""
    return r"(?<![\w\[\-'])" + r"\s+".join(re.escape(w) for w in phrase.split()) + r"(?![\w\]\-'])"


def sharpen(text: str, vague: list[dict], hedges: list[str]) -> str:
    """The question with vague words swapped for [what to fill in] and hedges removed. Never empty."""
    s, hints = text, []
    for v in sorted(vague[:5], key=lambda v: (-len(v["word"]), v["word"])):  # "stuff like that" before "stuff"
        hint = "[" + v["tip"].split(":")[0].split(",")[0].rstrip("?") + "]"
        s, n = re.subn(_phrase_re(v["word"]), f"\x00{len(hints)}\x00", s, count=1, flags=re.I)
        if n:
            hints.append(hint)
    if hedges:
        for h in sorted(hedges, key=len, reverse=True):
            s = re.sub(_phrase_re(h) + r",?", "", s, flags=re.I)
        s = re.sub(r"[ \t]{2,}", " ", s)
        s = re.sub(r"[ \t]+([,.;:?!])", r"\1", s)              # "nurses , ." -> "nurses, ."
        s = re.sub(r"([,;:])(?:\s*[,;:])+", r"\1", s)          # ", ," -> ","
        s = re.sub(r"[,;:]\s*([.?!])", r"\1", s)               # "safety, ." -> "safety."
        s = re.sub(r"^[\s,;:.!?\-]+", "", s)
    s = re.sub(r"[ \t]{2,}", " ", s).strip()
    if s and text[:1].isupper() and s[:1].islower():
        s = s[0].upper() + s[1:]
    for i, hint in enumerate(hints):
        s = s.replace(f"\x00{i}\x00", hint)
    s = re.sub(r"(\[[^\[\]]+\])(?:\s+\1)+", r"\1", s)  # "with stuff like that and so on" -> one [finish the list]
    return s if any(c.isalnum() for c in s) else "[Say what you want]"


def coach(text: str, index: dict | None = None) -> dict:
    """Prompt coach: flags vague wording with NLTK, scores how specific the question is, suggests a sharper one."""
    original = _str(text).strip()
    text, cut = clip(original, MAX_COACH_CHARS)
    tokens = tokenize(text)
    low = [t.lower() for t in tokens]
    joined = " " + " ".join(low) + " "
    words = content_words(tokens)
    has_words = any(any(c.isalpha() for c in t) for t in tokens)

    # Multi-word phrases first; a phrase found is blanked out so "stuff like that" is not also counted as "stuff".
    vague, rest = [], joined
    for phrase in sorted(VAGUE, key=lambda p: (-len(p.split()), p)):
        n = rest.count(" " + phrase + " ")
        if n:
            vague.append({"word": phrase, "count": n, "tip": VAGUE[phrase]})
            if " " in phrase:
                rest = rest.replace(" " + phrase + " ", " | ")
    vague.sort(key=lambda v: (-v["count"], v["word"]))
    hedges = [h for h in HEDGES if (" " + h + " ") in joined]

    has_number = any(any(c.isdigit() for c in t) for t in tokens)
    has_format = any(w in FORMAT_WORDS for w in low)
    has_constraint = any(w in CONSTRAINT_WORDS for w in low) or "$" in text or bool(LIMIT_RE.search(text))
    audience = _audience(text)
    checks = [
        {"id": "length", "ok": len(words) >= 6, "label": "Enough detail",
         "tip": "Add the context: what you are building and for whom." if len(words) < 6 else ""},
        {"id": "audience", "ok": audience, "label": "Says who it's for",
         "tip": "" if audience else "Add who it is for, e.g. 'for first-time home buyers'."},
        {"id": "format", "ok": has_format, "label": "Asks for a format",
         "tip": "" if has_format else "Say the shape of the answer: a 5-step list, a table, a short email…"},
        {"id": "constraint", "ok": has_constraint or has_number, "label": "Gives a limit or number",
         "tip": "" if (has_constraint or has_number) else "Add a limit: budget, deadline, length or a number."},
        {"id": "vague", "ok": not vague, "label": "No vague words",
         "tip": "" if not vague else "Replace: " + ", ".join(v["word"] for v in vague[:4]) + "."},
    ]
    score = 0
    hedge_words = {w for h in HEDGES for w in h.split()}
    if any(w not in hedge_words for w in words):  # only stopwords, hedges, numbers, symbols or emoji score 0
        score = round(100 * sum(1 for c in checks if c["ok"]) / len(checks) - 5 * len(hedges))
        score = max(0, min(100, score))

    notes = []
    if cut:
        notes.append(_cut_note(MAX_COACH_CHARS, len(original)))
    if text and not has_words:
        notes.append("No words found, only symbols, numbers or emoji. Write your question in words.")
    elif text and not words:
        notes.append("Only very common words or numbers: say what you want and what it is about.")
    if has_words and not looks_english(tokens):
        notes.append(NOT_ENGLISH_NOTE)

    # Topics from the question's words, not from URLs, HTML tags or Markdown, nor the vague or format words checked above.
    topics = match_topics(plain(text), index, skip=set(VAGUE) | set(HEDGES) | FORMAT_WORDS)
    sharper = ""
    if text:
        # A sharper version: keep the question, swap vague words for [what to fill in] and add what is missing.
        sharper = sharpen(text, vague, hedges) if has_words else "[Say what you want, in words]"
        adds = []
        if not audience:
            adds.append("It's for [who].")
        if not (has_constraint or has_number):
            adds.append("Limits: [budget, deadline or length].")
        if not has_format:
            adds.append("Answer as [a short numbered list / a table].")
        if topics["topics"]:
            adds.append("Focus on " + ", ".join(topics["topics"][:3]) + ".")
        if adds:
            end = "" if sharper.rstrip().endswith((".", "?", "!", "。", "？", "！", "؟", "…")) else "."
            sharper = sharper.rstrip() + end + " " + " ".join(adds)

    return {"score": score, "vague": vague, "hedges": hedges, "checks": checks,
            "sentiment": sentiment(text), "keywords": top_words(words, 8),
            "topics": topics["topics"], "experts": topics["experts"], "sharper": sharper, "note": " ".join(notes)}


# ---------------------------------------------------------------- team agreement map
_REC_WORD = r"[A-Za-z][\w\-]*(?:\.[A-Za-z0-9][\w\-]*)*"   # "PWA", "Next.js", "Vue.js"; never runs past a full stop
_REC_STOP = (r"(?:to|for|with|instead|later|because|and|or|but|so|that|first|now|if|in|on|is|are|over|than|from|as|"
             r"at|of|since|which|when|will|can|inside|into|via|within|under|across|behind|alongside|here|there|"
             r"today|too|while|unless|until|rather|plus|everywhere|anywhere|throughout|again|by|like|such)")
_REC_TAKE = r"(" + _REC_WORD + r"(?: (?!" + _REC_STOP + r"\b)" + _REC_WORD + r"){0,2})"
# "build it as", "build the habit tracker with", "build on": an object, if any, must be followed by a preposition.
_BUILD_OBJ = (r"(?: (?:it|this|everything|(?:the|your|our) [\w\-]+(?: [\w\-]+)?) (?:as|with|on|in|using|around)"
              r"| (?:as|with|on|in|using|around))")
# What may stand between "recommend" and the pick: "starting with", "going with", "using", "building it as",
# "switching to", "that you use" ... so "I recommend starting with a PWA" recommends the PWA, not "starting".
_REC_LEADIN = (r"(?:(?:that )?(?:you |we |they |teams? )?(?:should |could )?"
               r"(?:(?:start|go|stick|stay|begin)(?:ing)? with|start(?:ing)? on|(?:settl|standardiz)(?:e|ing) on|"
               r"(?:switch(?:ing)?|mov(?:e|ing)|migrat(?:e|ing)|port(?:ing)?) to|opt(?:ing)? for|"
               r"(?:us(?:e|ing)|adopt(?:ing)?|try(?:ing)?|choos(?:e|ing)|pick(?:ing)?|"
               r"build(?:ing)?" + _BUILD_OBJ + r"?)"
               r") )?")
# "a framework like React Native", "a managed database such as Supabase", "something like Postgres": the pick is
# the named example, not the kind of thing ("framework like react"). Only these kind-of-thing nouns may stand before
# "like", so "Use Postgres like everyone else" still picks Postgres.
_EXAMPLE_HEAD = (r"(?:(?:a |an |the |some )?(?:[\w\-]+ )?(?:framework|library|librar|tool|platform|service|database|"
                 r"db|stack|solution|option|provider|engine|store|cms|orm|runtime|language|host|backend|frontend|sdk|"
                 r"something|anything)(?:s|ies)?,? (?:like|such as|e\.g\.,?) )?")
RECOMMEND_RE = re.compile(
    r"\b(?:(?P<verb>recommend(?:ing|ed|s)?) " + _REC_LEADIN + r"|suggest(?:ing|ed|s)? " + _REC_LEADIN +
    r"|go with |prefer |opt for |"
    r"(?:would|'d|’d|i'll|we'll) (?:build" + _BUILD_OBJ + r"?|use|pick|choose|go with) |"
    r"stick with |(?P<weak>start with |switch to |move to |choose |pick ))"
    r"(?:the [\w\-]+(?: [\w\-]+)? as )?" + _EXAMPLE_HEAD + r"(?:a |an |the )?" + _REC_TAKE,
    re.I)
# "Recommended AI Platform" as a table header or a heading, and "the recommended database" as an adjective, name
# a column or a kind of thing, not a pick: "recommended" counts only after someone who recommends ("I recommended").
_REC_ADJ_BEFORE = re.compile(r"(?:^|\b(?:the|a|an|our|my|your|their|its|this|that|these|those|most|is|are|was|were|"
                             r"be|been|not|as))$", re.I)
# A pick followed by "is not needed", "isn't required", "is unnecessary" is ruled out, not recommended.
_NOT_NEEDED_RE = re.compile(r"^\s*(?:(?:is|are)(?: not|n't|n’t| never)|isn’t|aren’t)\s+(?:\w+\s+)?"
                            r"(?:needed|required|necessary|recommended|essential)\b|^\s*(?:is|are) unnecessary\b", re.I)
# "Start with", "switch to", "move to", "choose" and "pick" also start plain steps ("start with the information
# architecture", "switch to dark mode", "pick one metric", "choose a name users remember"): after those a pick
# must look like a name. ("I'd pick ..." and "I would choose ..." are the speaker's own choice and need not.)
# A recommendation that is negated just before it ("I would not pick Remix", "wouldn't recommend MongoDB") is none.
_NEGATED_RE = re.compile(r"(?:\bnot|n't|n’t|\bnever|\bno longer|\bavoid|\bagainst)\s+(?:\w+\s+){0,2}$", re.I)
# Imperatives at the start of a sentence: "Use Postgres.", "For RAG, use pgvector.", "Build it with Remix."
# Instructions such as "Use caution" or "Use it wisely" share the form, so these count only when the pick
# looks like a name (a capital letter, a digit or a dot inside: "Postgres", "Vue3", "Next.js") or a known acronym.
IMPERATIVE_RE = re.compile(
    r"^(?:[\-–•*\d.)\s]+)?(?:[^,;:]{1,40}[,:] )?(?:(?:just|simply|definitely|then|instead),? )?"
    r"(?:use|ship|deploy (?:on|to)|host (?:it )?on|launch (?:with|as|on)|"
    r"build" + _BUILD_OBJ + r") " + _EXAMPLE_HEAD +
    r"(?:a |an |the )?" + _REC_TAKE, re.I)
_REC_LEAD = {"this", "that", "these", "those", "it", "them", "your", "our", "my", "their", "its", "one",
             "something", "whatever", "what", "which", "whichever", "either", "both"}
# A pick that starts with one of these is a clause ("I recommend you check the logs"), not a choice.
_REC_CLAUSE = {"you", "we", "they", "i", "he", "she", "that", "everyone", "people", "what", "whatever", "which",
               "whichever", "how", "whether"}
# Recommendations that name no concrete choice ("start with the basics", "move to the next step", "use caution").
GENERIC_REC = {"basics", "basic", "next", "step", "steps", "plan", "list", "idea", "ideas", "approach", "option",
               "options", "way", "ways", "solution", "thing", "things", "part", "first", "goal", "goals", "users",
               "user", "simple", "small", "best", "right", "same", "other", "different", "version", "lot",
               "caution", "care", "judgment", "judgement", "sense", "common", "discretion", "following", "tools",
               "tool", "something", "anything", "everything", "whatever", "mvp", "prototype", "checklist", "template",
               "gut", "instinct", "flow",
               # good practice that every answer may mention, not a choice between products
               "https", "http", "tls", "ssl", "html", "semantic", "aria", "wcag", "alt", "text"}
# Common acronyms in this studio's answers, so "PWA" and "progressive web app" count as one recommendation.
REC_ALIASES = {"pwa": "progressive web app", "spa": "single page app", "ssr": "server side rendering",
               "ssg": "static site generation", "cms": "content management system", "llm": "large language model"}
# Other spellings of one product, word by word: "PostgreSQL" is "Postgres", "Mongo" is "MongoDB".
REC_WORD_ALIASES = {"postgresql": "postgres", "mongo": "mongodb", "k8s": "kubernetes", "golang": "go",
                    "tailwindcss": "tailwind", "ts": "typescript", "gcp": "google cloud", "rn": "react native"}
# Extra words that leave a pick the same thing: "Tailwind" / "Tailwind CSS", "Express" / "Express.js",
# "Postgres" / "Postgres database", "native app" / "native apps".
GENERIC_EXTRA = {"app", "apps", "application", "applications", "framework", "frameworks", "js", "library", "lib",
                 "stack", "tool", "tooling", "platform", "service", "services", "database", "databases", "db",
                 "engine", "sdk", "api", "apis", "server", "site", "website", "solution", "setup", "version",
                 "project", "css", "ui", "approach", "option", "route", "system", "store", "instance", "cluster",
                 "hosting", "backend", "frontend", "orm", "client", "plugin", "extension", "build", "code", "based",
                 "managed", "hosted", "self", "official", "latest", "new", "modern", "plain", "simple", "good",
                 "existing", "current", "single", "proper", "full", "dedicated", "separate", "own"}
# Extra words that make it another product for another platform: "React" / "React Native", "Vue" / "Vue Native",
# "TensorFlow" / "TensorFlow Lite", "web app" / "native app".
PLATFORM_EXTRA = {"native", "web", "mobile", "desktop", "multiplatform", "lite", "ios", "android"}
# Words that say someone recommends, not what: they would otherwise show up as a "shared idea".
AGREE_STOP = {"recommend", "recommended", "recommending", "recommends", "go", "going", "pick", "choose", "prefer",
              "opt", "start", "starting", "switch", "move", "stick", "suggest", "suggests", "think", "build",
              "building", "instead", "recommendation", "recommendations"}


def _is_gerund(w: str) -> bool:
    """A lower-case -ing verb form ("caching", "reading"), not a name that ends in -ing ("Spring", "String")."""
    return w.islower() and len(w) >= 6 and w.endswith("ing") and _stem(w) != w


def _clean_rec(r: str) -> str:
    """Drop leading pronouns/determiners and trailing stopwords; "" when nothing concrete is left ("it", "wisely",
    "the basics") or when the pick is an action ("caching responses") or a clause ("you check the logs")."""
    raw = r.strip(" .").split()
    if raw and (raw[0].lower() in _REC_CLAUSE or raw[0].lower() in {"no", "none", "nothing", "neither"}
                or _is_gerund(raw[0])):
        return ""
    ws = [w.lower() for w in raw]
    while ws and (ws[0] in _REC_LEAD or ws[0] in _stop()):
        ws.pop(0)
    while ws and ws[-1] in _stop():
        ws.pop()
    if not ws or (len(ws) == 1 and len(ws[0]) >= 6 and ws[0].endswith("ly")) or all(w in GENERIC_REC for w in ws):
        return ""
    return " ".join(ws)


def _name_like(r: str) -> bool:
    """True for a pick written like a product name ("Postgres", "SQLite", "Vue3", "Next.js", "PWA") or a kind of
    app ("a native app", "a progressive web app"), not for a plain noun phrase ("caution", "the plan")."""
    ws = r.split()
    low = {w.lower().strip(".,") for w in ws}
    # "device APIs", "a UI library": a capital in a generic word does not make the pick a name.
    return (any((any(c.isupper() or c.isdigit() for c in w) or "." in w.strip(".") or w.lower() in REC_ALIASES)
                and w.lower().strip(".,") not in GENERIC_EXTRA for w in ws)
            or bool(low & PLATFORM_EXTRA and low & {"app", "apps"}))


def recommendations(text: str) -> list[str]:
    """What one answer recommends, in order, without repeats: "I recommend X", "go with X", "I'd use X",
    and sentence-initial imperatives that name a product ("Use Postgres.")."""
    def line_before(i: int) -> str:
        return text[text.rfind("\n", 0, i) + 1:i].strip(" \t-–•*#>\"'“”")

    found = [(m.start(), m.groups()[-1]) for m in RECOMMEND_RE.finditer(text)   # the pick is the last group
             if not _NEGATED_RE.search(text[max(0, m.start() - 40):m.start()])
             and not (m.group("weak") and not _name_like(m.groups()[-1]))
             and not (m.group("verb") and m.group("verb").lower() == "recommended"
                      and _REC_ADJ_BEFORE.search(line_before(m.start())))
             and not _NOT_NEEDED_RE.search(text[m.end():m.end() + 60])]
    pos = 0
    for line in text.splitlines():
        start = text.find(line, pos)
        pos = start + len(line)
        for s in sent_tokenize(line) if line.strip() else []:
            m = IMPERATIVE_RE.match(s.strip())
            if m and _name_like(m.group(1)) and not _NOT_NEEDED_RE.search(s.strip()[m.end():]):
                found.append((start + max(line.find(s), 0), m.group(1)))
    recs = []
    for _, r in sorted(found, key=lambda x: x[0]):
        r = _clean_rec(r)
        if r and not any(same_recommendation(r, x) for x in recs):
            recs.append(r)
    return recs


def _rec_words(r: str) -> list[str]:
    r = REC_ALIASES.get(r.lower().strip(), r)
    out = []
    for w in re.findall(r"[a-z0-9]+", r.lower()):
        if len(w) > 4 and w.endswith("js"):            # "nextjs", "reactjs" -> "next js", "react js"
            out += [w[:-2], "js"]
        else:
            out += REC_WORD_ALIASES.get(w, w).split()
    return [w for w in out if w not in _stop()]


def same_recommendation(a: str, b: str) -> bool:
    """True when two recommendations name the same thing: the same stems; one inside the other when the extra
    words are generic ("Tailwind" / "Tailwind CSS") or only narrow it ("web app" / "progressive web app",
    "AWS" / "AWS Lambda"), but not when they move it to another platform ("React" / "React Native");
    or one is the acronym of the other ("PWA" / "progressive web app")."""
    wa, wb = _rec_words(a), _rec_words(b)
    if not wa or not wb:
        return False
    sa, sb = set(_stems(wa)), set(_stems(wb))
    if sa == sb:
        return True
    if sa < sb or sb < sa:
        small, big, big_words = (sa, sb, wb) if sa < sb else (sb, sa, wa)
        extra = {w for w in big_words if _stem(w) not in small}
        return not (extra & PLATFORM_EXTRA)
    ia, ib = "".join(w[0] for w in wa), "".join(w[0] for w in wb)
    ca, cb = "".join(wa), "".join(wb)
    return (len(wa) == 1 and len(ca) >= 2 and ca == ib) or (len(wb) == 1 and len(cb) >= 2 and cb == ia)


# A persona line that a model answer quotes or writes ("Act as Ines Abernathy, AI/LLM Integration Engineer.",
# "Role: senior engineer") says who is speaking, not what is said: it is left out of the main ideas.
_PERSONA_RE = re.compile(r"^\W*(?:[A-Za-z]+(?: [A-Za-z]+)?:\s*)?\W*(?:(?:act|acting|pretend|roleplay|role-play) as|"
                         r"pretend to be|you are now)\b|^\W*(?:role|persona)\s*:", re.I)


def _name_tokens(names: list[str]) -> set[str]:
    """The answer authors' own names, word by word ("Ines Abernathy" -> ines, abernathy): an expert's name in an
    answer (a signature, a quoted persona) is not one of its ideas. Only the name proper counts, not a role in
    brackets ("Maya (Frontend)") or a lower-case slug ("ux-writer")."""
    out = set()
    for n in names:
        proper = re.split(r"[(\[,|/—–]| - ", n, maxsplit=1)[0]
        out |= {w.lower() for w in re.findall(r"[^\W\d_][\w'’-]*", proper) if w[:1].isupper() and len(w) > 1}
    return out


def _key_terms(text: str, phrases: list[tuple[str, list[str], str]], n: int = 10,
               skip: set[str] | None = None) -> list[str]:
    skip = skip or set()
    text = " ".join(s for s in paragraph_sentences(text) if not _PERSONA_RE.search(s))
    words = [w for w in content_words(tokenize(text)) if w not in AGREE_STOP and w not in skip]
    stems = set(_stems(words))
    low = text.lower()
    found = []
    for p, ps, pl in phrases:  # spaCy topic phrases (multi-word first) that occur in this answer
        if len(ps) > 1 and all(s in stems for s in ps) and pl in low and not set(pl.split()) & skip:
            found.append(p)
    singles = [w for w, _ in top_words(words, n * 2) if not any(w in f.split() for f in found)]
    return (found[: n // 2] + singles)[:n]


def agreement(answers: list[dict], phrases: list[str] | None = None) -> dict:
    """Agreement map for team answers: NLTK main ideas + VADER tone per expert, shared and unique ideas,
    pairwise overlap, and conflicting recommendations. answers = [{"name": str, "text": str}, ...]."""
    phrases = sorted(phrases or [], key=lambda p: (-len(p.split()), p))
    prepared = [(p, _stems(content_words(p.split())), p.lower()) for p in phrases]
    answers = list(answers) if isinstance(answers, (list, tuple)) else []
    notes = []
    if len(answers) > MAX_ANSWERS:
        notes.append(f"Only the first {MAX_ANSWERS} of {len(answers)} answers were mapped.")
        answers = answers[:MAX_ANSWERS]
    answers = [a if isinstance(a, dict) else {"text": a} for a in answers]
    skip = _name_tokens([_str(a.get("name")) for a in answers])
    experts, names, clipped = [], set(), 0
    for i, a in enumerate(answers):
        a = a if isinstance(a, dict) else {"text": a}
        name = _str(a.get("name")).strip() or f"Expert {i + 1}"
        base, k = name, 2
        while name in names:  # two experts with one name would be impossible to tell apart in the map
            name, k = f"{base} ({k})", k + 1
        names.add(name)
        text, cut = clip(_str(a.get("text")), MAX_ANSWER_CHARS)
        clipped += cut
        # Table cells ("Feature | Recommended AI Platform | Reason") are read one per line, so a header cell is
        # not run together with its neighbours into a sentence.
        text = plain(re.sub(r"[ \t]*\|[ \t]*", "\n", text))
        terms = _key_terms(text, prepared, skip=skip)
        experts.append({"name": name, "terms": terms, "sentiment": sentiment(text), "recommends": recommendations(text)[:3]})
    if clipped:
        notes.append(f"{clipped} long answer{'s were' if clipped > 1 else ' was'} cut to the first "
                     f"{MAX_ANSWER_CHARS:,} characters, so your browser stays fast.")
    # Ideas shared by two or more experts (compared by stem, shown by the first surface form).
    owners: dict[str, list[int]] = {}
    surface: dict[str, str] = {}
    keys = [[" ".join(_stems(t.split())) for t in e["terms"]] for e in experts]
    for i, e in enumerate(experts):
        for t, key in zip(e["terms"], keys[i]):
            surface.setdefault(key, t)
            if i not in owners.setdefault(key, []):
                owners[key].append(i)
    shared = sorted(([surface[k], [experts[i]["name"] for i in v]] for k, v in owners.items() if len(v) > 1),
                    key=lambda x: (-len(x[1]), x[0]))
    pairs = []
    for i in range(len(experts)):
        for j in range(i + 1, len(experts)):
            a, b = experts[i], experts[j]
            sa, sb = set(keys[i]), set(keys[j])
            jac = len(sa & sb) / len(sa | sb) if (sa | sb) else 0.0
            tone_gap = abs(a["sentiment"]["compound"] - b["sentiment"]["compound"])
            same_pick = any(same_recommendation(x, y) for x in a["recommends"] for y in b["recommends"])
            rec_conflict = bool(a["recommends"] and b["recommends"] and not same_pick)
            tone_split = a["sentiment"]["label"] != b["sentiment"]["label"] and tone_gap >= 0.5
            opposite = tone_split and {a["sentiment"]["label"], b["sentiment"]["label"]} == {"positive", "negative"}
            # "disagree" means conflicting recommendations, nothing else. Tone alone never decides the verdict:
            # VADER scores wording ("no AI is needed" reads as negative), not a position, so a tone gap is a note.
            if rec_conflict:
                verdict = "disagree"
            elif same_pick:
                verdict = "agree"   # the same recommendation is agreement on the decision, whatever the wording
            else:
                verdict = "agree" if jac >= 0.2 else "different angles"
            note = ""
            if tone_split:
                note = ("Same recommendation, different tone." if same_pick and not rec_conflict else
                        "Opposite tone." if opposite else "Different tone.")
            pairs.append({"a": a["name"], "b": b["name"], "overlap": round(jac, 2), "tone_gap": round(tone_gap, 2),
                          "conflict": rec_conflict, "verdict": verdict, "note": note})
    for i, e in enumerate(experts):
        e["unique"] = [t for t, key in zip(e["terms"], keys[i]) if len(owners.get(key, [])) == 1][:5]
    return {"experts": experts, "shared": shared[:10], "pairs": pairs, "note": " ".join(notes)}
