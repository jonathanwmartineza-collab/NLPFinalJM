"""NLP build step (runs on Netlify before the Vite build; also runs locally).

Reads the corpus (web/public/team.json, generated from .claude/agents by scripts/build-team.mjs, and
prompts/library.json), runs spaCy (nlp/spacy_core.py) and NLTK (nlp/nltk_core.py), and writes static files to
web/public/nlp/:

  spacy.json        entities, noun-chunk topics, dependency parses        (spaCy)
  topic-index.json  phrase -> experts index for the live Prompt coach     (spaCy, used live by NLTK)
  nltk.json         word frequencies, collocations, VADER per expert      (NLTK; expert profiles only)
  corpus-stats.json document and word counts, versions, build time
  nltk_data.zip     the NLTK data the browser needs (punkt_tab/english, stopwords/english, vader_lexicon)
  nltk_core.py      the same NLTK module the worker runs in Pyodide

Fails loudly (non-zero exit) when anything is missing or empty, so a broken NLP build never deploys.
"""
from __future__ import annotations

import datetime as dt
import json
import re
import shutil
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "web" / "public" / "nlp"
DATA = ROOT / ".nltk_data"
PACKAGES = ["punkt_tab", "stopwords", "vader_lexicon"]
sys.path.insert(0, str(ROOT / "nlp"))


def fail(msg: str) -> None:
    print(f"build_nlp: FAILED: {msg}", file=sys.stderr)
    sys.exit(1)


def clean(md: str) -> str:
    """Markdown -> plain prose for the NLP tools.

    Each heading, list item and table row becomes its own sentence (a final full stop is added when it has none),
    so headings such as "## Boundaries" do not run into the next line and confuse the sentence splitter, the
    parser and the NER. Underscores inside identifiers (en_core_web_sm, punkt_tab) are kept; only markdown marks
    are removed.
    """
    md = re.sub(r"```.*?```", " ", md, flags=re.S)          # code blocks
    md = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", md)       # [text](link) -> text
    md = re.sub(r"https?://\S+", " ", md)                    # bare URLs
    md = re.sub(r"\(?accessed \d{4}-\d\d-\d\d\)?", " ", md)  # source dates
    blocks, cur = [], []
    for line in md.splitlines():
        starts_block = re.match(r"\s*(#{1,6}\s|[-*+]\s|\d+[.)]\s|[A-Z][.)]\s|\|)", line)
        if not line.strip() or starts_block:
            if cur:
                blocks.append(" ".join(cur))
            cur = []
        if line.strip():
            # Drop the block marker itself: "## ", "- ", "3. ", "A. " (an option letter), "| ".
            cur.append(re.sub(r"^\s*(#{1,6}\s|[-*+]\s|\d+[.)]\s|[A-Z][.)]\s)", "", line).strip())
        if re.match(r"\s*#{1,6}\s", line):  # a heading is always one line on its own
            blocks.append(" ".join(cur))
            cur = []
    if cur:
        blocks.append(" ".join(cur))
    out = []
    for b in blocks:
        b = re.sub(r"[`*#>|]+", " ", b)                      # markdown marks
        b = re.sub(r"(?<![A-Za-z0-9])_+|_+(?![A-Za-z0-9])", " ", b)  # _emphasis_, not snake_case
        b = re.sub(r"[ \t]+", " ", b).strip()
        if re.search(r"[A-Za-z0-9]", b):
            out.append(b if b[-1] in ".!?:;" else b + ".")
    return "\n".join(out)


def load_corpus() -> tuple[list[dict], list[dict]]:
    team_file = ROOT / "web" / "public" / "team.json"
    if not team_file.exists():
        fail("web/public/team.json is missing: run `node scripts/build-team.mjs` first")
    team = json.loads(team_file.read_text(encoding="utf-8"))
    experts = []
    for a in team["agents"]:
        profile = f"{a['name']}, {a['title']}. {a['mission']} {a['personality']} " + " ".join(a["examplePrompts"])
        # The agent's system prompt (after the YAML frontmatter) and its knowledge notes, without URLs or code.
        md = (ROOT / ".claude" / "agents" / f"{a['slug']}.md").read_text(encoding="utf-8").split("\n---", 1)[-1]
        notes = [f.read_text(encoding="utf-8") for f in sorted((ROOT / "knowledge" / a["slug"]).glob("*.md"))]
        text = clean("\n\n".join([md, *notes]))
        experts.append({"slug": a["slug"], "name": a["name"], "title": a["title"], "department": a["department"],
                        "mission": a["mission"], "profile": profile, "text": profile + "\n\n" + text})
    lib = json.loads((ROOT / "prompts" / "library.json").read_text(encoding="utf-8"))
    prompts = [{"id": p["id"], "title": p["title"], "agent": p.get("agent", ""), "text": p["prompt"]} for p in lib]
    return experts, prompts


def nltk_setup() -> None:
    import nltk
    DATA.mkdir(exist_ok=True)
    for pkg in PACKAGES:
        if not nltk.download(pkg, download_dir=str(DATA), quiet=True, raise_on_error=True):
            fail(f"nltk.download('{pkg}') failed")
    nltk.data.path.insert(0, str(DATA))


def nltk_zip(dest: Path) -> int:
    """Only what the browser needs (English), about 0.2 MB instead of 15 MB."""
    picks = []
    for f in sorted((DATA / "tokenizers" / "punkt_tab" / "english").rglob("*")):
        picks.append(f)
    picks.append(DATA / "corpora" / "stopwords" / "english")
    picks.append(DATA / "sentiment" / "vader_lexicon.zip")
    with zipfile.ZipFile(dest, "w", zipfile.ZIP_DEFLATED) as z:
        for f in picks:
            if f.is_file():
                info = zipfile.ZipInfo(str(f.relative_to(DATA)), date_time=(2026, 1, 1, 0, 0, 0))
                info.compress_type = zipfile.ZIP_DEFLATED
                z.writestr(info, f.read_bytes())
    return dest.stat().st_size


def corpus_collocations(token_docs: list[list[str]], drop: set[str], n: int = 20, min_freq: int = 4) -> list[list]:
    """Bigram collocations over the expert profiles, scored with Dunning's log-likelihood ratio
    (BigramAssocMeasures.likelihood_ratio). The finder is built per document on the real token sequence, then
    stopwords, house words and non-words are filtered out (NLTK's apply_word_filter), so a pair is only counted
    when the two words really stand next to each other in one profile."""
    from nltk.collocations import BigramAssocMeasures, BigramCollocationFinder
    finder = BigramCollocationFinder.from_documents([[t.lower() for t in d] for d in token_docs])
    finder.apply_word_filter(lambda w: len(w) < 2 or w in drop or not any(c.isalpha() for c in w))
    finder.apply_freq_filter(min_freq)
    scored = sorted(finder.score_ngrams(BigramAssocMeasures.likelihood_ratio), key=lambda x: (-round(x[1], 6), x[0]))[:n]
    return [[a, b, round(s, 2), finder.ngram_fd[(a, b)]] for (a, b), s in scored]


def run_nltk(experts: list[dict], prompts: list[dict]) -> dict:
    import nltk
    import nltk_core as N
    all_words, per, docs, token_docs = [], [], [], []
    for e in experts:
        token_docs.append(N.tokenize(e["text"]))
        docs.append(N.content_words(token_docs[-1]))
    # Words in more than half of the expert profiles are the profiles' shared house wording ("notes", "output"),
    # not what an expert knows: leave them out of the corpus frequencies and collocations.
    df = {}
    for words in docs:
        for w in set(words):
            df[w] = df.get(w, 0) + 1
    house = {w for w, n in df.items() if n > len(docs) / 2}
    roster = {w.lower() for e in experts for w in e["name"].split()} | {e["slug"] for e in experts}
    for e, words, toks in zip(experts, docs, token_docs):
        words = [w for w in words if w not in house]
        all_words += words
        per.append({"slug": e["slug"], "name": e["name"], "title": e["title"], "department": e["department"],
                    "tone": N.sentiment(e["profile"]), "top_words": N.top_words(words, 8),
                    "tokens": len(toks), "sentences": len(N.sentences(e["text"]))})
    lib = []
    for p in prompts:
        a = N.analyze(p["text"], top_n=6, max_sentences=0)
        lib.append({"id": p["id"], "title": p["title"], "counts": a["counts"], "top_words": a["top_words"],
                    "sentiment": a["sentiment"]})
    sample = ("I love how quickly the team answered, but the second answer was not helpful at all. "
              "The landing page looks great! Still, the pricing table is confusing and a bit too long.")
    return {
        "nltk": nltk.__version__, "module_version": N.VERSION,
        "house_words": sorted(house),
        # The corpus panel (frequencies, collocations, tone) covers the expert profiles only; the library prompts
        # are analysed one by one in "prompts".
        "corpus": {"documents": len(experts), "tokens": sum(len(t) for t in token_docs),
                   "content_words": len(all_words), "unique_content_words": len(set(all_words))},
        "top_words": N.top_words(all_words, 30),
        # Team names and agent handles ("ui-designer (Bastien)") are hand-off wording, not collocations.
        "collocations": corpus_collocations(token_docs, N._stop() | house | roster, 20, 4),
        "experts": sorted(per, key=lambda x: (-x["tone"]["compound"], x["name"])),
        "prompts": lib,
        "sample": {"text": sample, **N.analyze(sample)},
    }


def write(name: str, data: dict) -> int:
    p = OUT / name
    p.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    return p.stat().st_size


def check(spacy_out: dict, nltk_out: dict) -> None:
    if len(spacy_out["experts"]) < 30 or not all(e["topics"] for e in spacy_out["experts"]):
        fail("spaCy: an expert has no topics")
    if sum(len(e["entities"]) for e in spacy_out["experts"]) < 50:
        fail("spaCy: too few entities")
    if not any(l == "TECH" for l, _ in spacy_out["label_totals"]):
        fail("spaCy: the EntityRuler found no TECH entities")
    if len(spacy_out["index"]["phrases"]) < 200:
        fail("spaCy: topic index too small")
    if len(nltk_out["top_words"]) < 30 or len(nltk_out["collocations"]) < 5:
        fail("NLTK: frequencies or collocations are empty")
    labels = {e["tone"]["label"] for e in nltk_out["experts"]}
    if "positive" not in labels:
        fail("NLTK: VADER found no positive profile (lexicon not loaded?)")


def main() -> None:
    t0 = dt.datetime.now(dt.timezone.utc)
    OUT.mkdir(parents=True, exist_ok=True)
    experts, prompts = load_corpus()
    nltk_setup()
    import spacy_core
    spacy_out = spacy_core.run(experts, prompts, ROOT / "nlp" / "patterns.jsonl")
    nltk_out = run_nltk(experts, prompts)
    check(spacy_out, nltk_out)
    index = spacy_out.pop("index")
    sizes = {
        "spacy.json": write("spacy.json", spacy_out),
        "topic-index.json": write("topic-index.json", index),
        "nltk.json": write("nltk.json", nltk_out),
        "nltk_data.zip": nltk_zip(OUT / "nltk_data.zip"),
    }
    shutil.copyfile(ROOT / "nlp" / "nltk_core.py", OUT / "nltk_core.py")
    # "words" = whitespace-separated words of the cleaned texts (expert profiles + library prompts), before tokenizing.
    words = sum(len(e["text"].split()) for e in experts) + sum(len(p["text"].split()) for p in prompts)
    stats = {"experts": len(experts), "prompts": len(prompts), "documents": len(experts) + len(prompts),
             "words": words, "nltk": nltk_out["nltk"], "spacy": spacy_out["spacy"], "model": spacy_out["model"],
             "python": sys.version.split()[0], "built": t0.strftime("%Y-%m-%dT%H:%M:%SZ"),
             "seconds": round((dt.datetime.now(dt.timezone.utc) - t0).total_seconds(), 1), "files": sizes}
    write("corpus-stats.json", stats)
    print(f"build_nlp: OK {stats['documents']} documents, {words} words, "
          f"{len(index['phrases'])} topic phrases, {stats['seconds']} s; " +
          ", ".join(f"{k} {v // 1024} KB" for k, v in sizes.items()))


if __name__ == "__main__":
    main()
