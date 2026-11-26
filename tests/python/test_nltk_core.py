"""NLTK module tests (same module runs live in Pyodide). Run after `python nlp/build_nlp.py` (it downloads the data)."""
import sys
from pathlib import Path

import nltk
import pytest

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "nlp"))
nltk.data.path.insert(0, str(ROOT / ".nltk_data"))
import nltk_core as N  # noqa: E402


@pytest.mark.parametrize("text,label", [
    ("I love this app, it is great!", "positive"),
    ("This is terrible and I hate it.", "negative"),
    ("The page has three sections.", "neutral"),
    ("The answer was not bad.", "positive"),        # VADER handles negation
    ("The answer was not good.", "negative"),
    ("GREAT work!!!", "positive"),                   # caps + exclamation boost
])
def test_vader_signs(text, label):
    assert N.sentiment(text)["label"] == label


def test_vader_boost():
    assert N.sentiment("GREAT work!!!")["compound"] > N.sentiment("great work")["compound"]


def test_tokenize_and_stopwords():
    toks = N.tokenize("Don't remove the user's data, please.")
    assert "remove" in toks and "," not in toks
    assert N.content_words(["The", "user", "data", "is", "a"]) == ["user", "data"]


def test_frequencies_and_collocations_deterministic():
    words = N.content_words(N.tokenize("machine learning helps. machine learning scales. deep learning too. machine learning wins."))
    assert N.top_words(words, 1) == [["learning", 4]]
    col = N.collocations(words, 3, 2)
    assert col[0][:2] == ["machine", "learning"] and col[0][3] == 3
    assert N.collocations(words, 3, 2) == col


def test_analyze_shape():
    a = N.analyze("The team is fast. The answers are clear and helpful!")
    assert a["counts"]["sentences"] == 2 and a["counts"]["tokens"] == 10
    assert a["sentiment"]["label"] == "positive" and len(a["sentences"]) == 2
    assert N.analyze("")["counts"]["tokens"] == 0


INDEX = {"phrases": [["landing page", [["brand-director", 0.9]]], ["accessibility", [["accessibility-specialist", 1.0]]],
                     ["page", [["frontend-engineer", 0.2]]]],
         "experts": {"brand-director": {"name": "Farrah", "title": "Brand"},
                     "accessibility-specialist": {"name": "Desta", "title": "Accessibility"},
                     "frontend-engineer": {"name": "Pavel", "title": "Front-end"}}}


def test_coach_flags_vague_and_scores():
    vague = N.coach("Can you make my landing page better and add some stuff?", INDEX)
    words = {v["word"] for v in vague["vague"]}
    assert {"better", "some", "stuff"} <= words
    assert vague["topics"][0] == "landing page" and vague["experts"][0]["slug"] == "brand-director"
    sharp = N.coach("Write a 5-step checklist to check the accessibility of a landing page for blind users, under 200 words.", INDEX)
    assert sharp["score"] > vague["score"] and sharp["score"] == 100
    assert "[" in vague["sharper"] and vague["sharper"] != "Can you make my landing page better and add some stuff?"
    assert N.coach("")["score"] == 0


def test_coach_hedges_lower_score():
    a = N.coach("Write a 5-step checklist for night nurses about patient handover safety.")
    b = N.coach("Maybe write a 5-step checklist for night nurses about patient handover safety, I think.")
    assert b["hedges"] and b["score"] < a["score"]


def test_agreement_map():
    answers = [
        {"name": "Imani", "text": "I recommend a native app. Push notifications matter for habit reminders. Native apps feel great."},
        {"name": "Mireille", "text": "I recommend a PWA. Push notifications work on Android, and a PWA is cheaper to build."},
        {"name": "Agnes", "text": "Whatever you build, keep habit data on the device. Push notifications must not leak private habits."},
    ]
    m = N.agreement(answers, ["push notification", "habit data"])
    shared = {s[0] for s in m["shared"]}
    assert any("push" in s for s in shared)
    pair = next(p for p in m["pairs"] if p["a"] == "Imani" and p["b"] == "Mireille")
    assert pair["conflict"] and pair["verdict"] == "disagree"
    assert m["experts"][0]["recommends"][0].startswith("native")
