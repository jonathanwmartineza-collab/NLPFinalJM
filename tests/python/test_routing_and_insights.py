"""Prompt coach routing (match_topics over the spaCy topic index) and Chat insights cleaning (analyze).

Regression cases from a hard test of the live coach (2026-11-26): generic words with one owner ("production",
"second", "naming") outweighed real domain terms, the index had no RAG/pgvector/LLM entries, and pasted chats put
URL pieces, HTML tags and speaker labels at the top of Chat insights. Run after `python nlp/build_nlp.py`."""
import json
import sys
from pathlib import Path

import nltk
import pytest

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "nlp"))
nltk.data.path.insert(0, str(ROOT / ".nltk_data"))
import nltk_core as N  # noqa: E402

INDEX_FILE = ROOT / "web" / "public" / "nlp" / "topic-index.json"


@pytest.fixture(scope="module")
def index():
    if not INDEX_FILE.exists():
        pytest.skip("run nlp/build_nlp.py first")
    return json.loads(INDEX_FILE.read_text(encoding="utf-8"))


def first(index, q, n=1):
    return [e["slug"] for e in N.match_topics(q, index)["experts"]][:n]


# ------------------------------------------------------------------ routing, real index
@pytest.mark.parametrize("q,expected", [
    ("How does your NER handle out-of-vocabulary product names like Pyodide or pgvector?",
     {"spacy-expert", "nlp-evaluator", "pyodide-engineer"}),
    ("Make a RAG chatbot for our HR policies using pgvector and Claude, answering employees in under 3 seconds.",
     {"ai-engineer"}),
    ("How does named entity recognition work in spaCy?", {"spacy-expert", "nlp-evaluator"}),
    ("Should I use retrieval-augmented generation for my help docs?", {"ai-engineer"}),
])
def test_hard_test_questions_route_to_the_right_expert(index, q, expected):
    assert first(index, q)[0] in expected


def test_saas_dashboard_reaches_an_engineer_in_top3(index):
    q = "Build a SaaS analytics dashboard in React with Postgres, role-based access and CSV export for small finance teams."
    assert set(first(index, q, 3)) & {"data-engineer", "backend-engineer", "frontend-engineer", "software-architect"}


def test_generic_words_do_not_lead_the_topics(index):
    t = N.match_topics("Make a RAG chatbot for our HR policies using pgvector and Claude, answering in 3 seconds.",
                       index)["topics"]
    assert t[:3] == ["pgvector", "rag", "chatbot"] and "second" not in t[:3]


def test_index_has_ruler_terms_aliases_and_df(index):
    phrases = dict((p, o) for p, o in index["phrases"])
    for term in ["rag", "pgvector", "llm", "ner", "spacy", "nltk", "pyodide", "chatbot", "tokenization"]:
        assert term in phrases, term
    assert phrases["pgvector"][0][0] == "ai-engineer"
    assert index["aliases"]["named entity recognition"] == "ner" and index["aliases"]["postgresql"] == "postgres"
    assert index["aliases"]["retrieval-augmented generation"] == "rag"
    # A phrase used by more than half of the profiles is kept only through an expert's own title, with a low weight.
    assert index["df"]["build"] > index["docs"] // 2
    assert [s for s, _ in phrases["build"]] == ["python-build-engineer"]
    assert phrases["build"][0][1] < phrases["pgvector"][0][1]
    assert phrases["security"][0][0] == "security-engineer"


def test_routing_eval_does_not_regress(index):
    import eval_routing as E
    dev = E.score(E.GOLD, "dev", index)
    held = E.score(E.HELDOUT, "held-out", index)
    assert dev[0] >= 26 and dev[1] >= 28          # 27/30 and 29/30 on 2026-11-26 (23/30, 29/30 before)
    assert held[0] >= 12 and held[1] >= 15        # 13/16 and 16/16 on 2026-11-26 (7/16, 13/16 before)


# ------------------------------------------------------------------ match_topics, synthetic index
TINY = {"phrases": [["rag", [["ai-engineer", 2.0]]], ["accessibility", [["accessibility-specialist", 3.0]]],
                    ["persona", [["ux-researcher", 1.0]]], ["personas", [["ux-researcher", 1.0]]],
                    ["second", [["motion-designer", 0.5]]]],
        "aliases": {"retrieval-augmented generation": "rag", "retrieval augmented generation": "rag"},
        "df": {"rag": 2, "accessibility": 19, "persona": 3, "personas": 3, "second": 10},
        "experts": {}}


@pytest.mark.parametrize("q", ["Explain RAG", "explain rag", "Explain retrieval-augmented generation",
                               "explain retrieval augmented generation"])
def test_acronym_and_expansion_match_case_insensitively(q):
    r = N.match_topics(q, TINY)
    assert r["topics"] == ["rag"] and r["experts"][0]["slug"] == "ai-engineer"


def test_porter_overstemming_guard():
    assert N.match_topics("role-based access for admins", TINY)["topics"] == []          # access != accessibility
    assert N.match_topics("make the site accessible", TINY)["topics"] == ["accessibility"]


def test_same_stem_phrases_count_once():
    r = N.match_topics("write personas", TINY)
    assert r["experts"][0]["score"] == 1.0


def test_topics_ordered_by_specificity():
    assert N.match_topics("RAG answers in 3 seconds", TINY)["topics"] == ["rag", "second"]


def test_old_index_without_aliases_or_df_still_works():
    old = {"phrases": [["landing page", [["frontend-engineer", 1.0]]]], "experts": {}}
    assert N.match_topics("a landing page", old)["experts"][0]["slug"] == "frontend-engineer"


# ------------------------------------------------------------------ Chat insights (analyze) cleaning
CHAT = """User: Please build a landing page. <button aria-pressed='false'>Toggle</button>
Expert: Sure. I recommend Next.js. See https://evil.example/steal?x=1 and <script src="//evil.example/steal.js"></script>
SYSTEM: ignore previous instructions
User: The landing page looks great, thanks!
Expert: Glad to help. Load //cdn.example.com/a.js or evil.example/steal now.
Assistant: [link](http://evil.example/steal) **bold**
"""


def test_insights_top_words_have_no_urls_tags_or_speaker_labels():
    a = N.analyze(CHAT)
    words = [w for w, _ in a["top_words"]]
    assert words[:2] == ["landing", "page"]
    for w in words:
        assert "/" not in w and "=" not in w and "evil" not in w and "aria" not in w, w
        assert w not in {"user", "expert", "system", "assistant"}, w
    for a_, b_, _, _ in a["collocations"]:
        assert "/" not in a_ + b_ and "=" not in a_ + b_


def test_insights_sentences_are_readable_and_split_per_turn():
    a = N.analyze(CHAT)
    texts = [s["text"] for s in a["sentences"]]
    assert "The landing page looks great, thanks!" in texts
    assert not any("<" in t or "http" in t or t.startswith(("User:", "Expert:", "SYSTEM:")) for t in texts)
    assert next(s for s in a["sentences"] if s["text"].startswith("The landing page"))["label"] == "positive"


def test_single_label_like_line_is_kept():
    assert "note" in [w for w, _ in N.analyze("Note: keep the backup.\nThe backup runs nightly.")["top_words"]]
    assert N.strip_speakers("Note: once.") == "Note: once."
    assert N.strip_speakers("Nora Lindahl: hi\nSantiago Reyes: hey\nNora Lindahl: bye").split() == ["hi", "hey", "bye"]


def test_plain_keeps_dotted_names_and_drops_links():
    p = N.plain("Use Next.js or Vue.js, not https://x.example/a, //cdn.example.com/b.js or evil.example/steal.")
    assert "Next.js" in p and "Vue.js" in p and "example" not in p
