"""Checks the files nlp/build_nlp.py wrote (run the build first). Same checks as the nlp-eval skill (A, C, D)."""
import json
import zipfile
from pathlib import Path

OUT = Path(__file__).resolve().parents[2] / "web" / "public" / "nlp"


def load(name):
    return json.loads((OUT / name).read_text(encoding="utf-8"))


def test_files_present_and_non_empty():
    for f in ["spacy.json", "nltk.json", "topic-index.json", "corpus-stats.json", "nltk_data.zip", "nltk_core.py"]:
        assert (OUT / f).stat().st_size > 200, f


def test_spacy_output():
    s = load("spacy.json")
    assert s["model"].startswith("en_core_web_sm 3.8")
    assert s["pipeline"].index("entity_ruler") < s["pipeline"].index("ner")
    assert len(s["experts"]) >= 36 and all(e["topics"] for e in s["experts"])
    labels = dict(s["label_totals"])
    assert labels.get("TECH", 0) > 50 and labels.get("STANDARD", 0) > 10
    desta = next(e for e in s["experts"] if e["slug"] == "accessibility-specialist")
    assert any(t.startswith("WCAG") and l == "STANDARD" for t, l, _ in desta["entities"])   # NER gold N1
    demo = s["demo"]
    assert ["Portland", "GPE"] in demo["entities"]                                            # NER gold N2
    assert demo["root"] == "build" and "landing page" in demo["object"]                       # parse gold
    assert all(p["object"] for p in s["prompts"])


def test_nltk_output():
    n = load("nltk.json")
    assert n["nltk"] == "3.9.4"
    assert len(n["top_words"]) == 30 and len(n["collocations"]) >= 5
    assert {e["tone"]["label"] for e in n["experts"]} >= {"positive"}
    assert n["sample"]["sentiment"]["label"] == "positive"


def test_topic_index_and_zip():
    idx = load("topic-index.json")
    assert len(idx["phrases"]) > 200 and len(idx["experts"]) >= 36
    names = zipfile.ZipFile(OUT / "nltk_data.zip").namelist()
    assert "corpora/stopwords/english" in names and "sentiment/vader_lexicon.zip" in names
    assert any(n.startswith("tokenizers/punkt_tab/english/") for n in names)
