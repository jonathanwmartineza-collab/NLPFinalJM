"""Edge cases for the live NLTK entry points (analyze, coach, agreement), with the NLTK data the browser uses.

The browser unpacks web/public/nlp/nltk_data.zip and reads web/public/nlp/topic-index.json (see web/src/nlp/boot.ts);
these tests do the same, so they check what visitors get. Run `python nlp/build_nlp.py` first.
"""
import json
import sys
import time
import zipfile
from pathlib import Path

import nltk
import pytest

ROOT = Path(__file__).resolve().parents[2]
PUB = ROOT / "web" / "public" / "nlp"
sys.path.insert(0, str(ROOT / "nlp"))
nltk.data.path.insert(0, str(ROOT / ".nltk_data"))
import nltk_core as N  # noqa: E402


@pytest.fixture(scope="module", autouse=True)
def live_nltk_data(tmp_path_factory):
    """Put the shipped nltk_data.zip first on nltk.data.path, exactly as the worker does."""
    z = PUB / "nltk_data.zip"
    if not z.exists():
        yield
        return
    d = tmp_path_factory.mktemp("nltk_data")
    zipfile.ZipFile(z).extractall(d)
    nltk.data.path.insert(0, str(d))
    N._STOP = N._VADER = None
    yield
    nltk.data.path.remove(str(d))


@pytest.fixture(scope="module")
def index():
    f = PUB / "topic-index.json"
    return json.loads(f.read_text(encoding="utf-8")) if f.exists() else {"phrases": [], "experts": {}}


@pytest.fixture(scope="module")
def phrases(index):
    return [p for p, _ in index["phrases"] if " " in p]


WEIRD = {
    "empty": "", "whitespace": "  \n\t ", "single word": "website", "stopwords": "the and of to is it",
    "punctuation": "?!... ,,, ;;; --- !!!", "spanish": "¿Puedes mejorar mi página de inicio para que sea más bonita?",
    "chinese": "你能帮我改进我的网站吗？我想要更好的设计。", "arabic": "هل يمكنك تحسين موقعي على الإنترنت؟",
    "emoji": "😀😀🔥🚀", "mixed emoji": "make my app better 🚀🔥 for kids", "json": '{"a": 1, "b": [1, 2], "c": {"d": "e"}}',
    "python": "def foo(x):\n    return x * 2  # fix this thing\n", "html": "<script>alert('x')</script><b>improve</b> it",
    "url": "https://example.com/some/path?x=1&y=2 fix this asap", "numbers": "1 2 3 42 3.14",
    "regex chars": r"improve? fix* stuff+ (things) \ a\1 \g<0>", "lone surrogate": "fix \ud83d this",
    "only hedges": "maybe just really basically", "brackets": "Make it [better] for {users}",
}


@pytest.mark.parametrize("name", list(WEIRD))
def test_no_crash_and_json_ready(name, index, phrases):
    t = WEIRD[name]
    a, c = N.analyze(t), N.coach(t, index)
    m = N.agreement([{"name": "A", "text": t}, {"name": "B", "text": t}], phrases)
    for out in (a, c, m):
        json.dumps(out)
    assert 0 <= c["score"] <= 100 and isinstance(c["score"], int)
    assert isinstance(c["note"], str) and isinstance(a["note"], str) and isinstance(m["note"], str)


@pytest.mark.parametrize("name", [k for k, v in WEIRD.items() if v.strip()])
def test_sharper_never_empty_or_nonsense(name, index):
    s = N.coach(WEIRD[name], index)["sharper"]
    assert s and any(c.isalpha() for c in s)
    assert not s.lstrip().startswith((".", ",", ";"))            # was ". It's for [who]" for a hedge-only question
    assert "[[" not in s and ", ." not in s and ".." not in s.replace("...", "")
    assert "。." not in s and "؟." not in s and "？." not in s     # no ASCII full stop after CJK/Arabic punctuation


def test_empty_input_keeps_empty_sharper_and_zero_score():
    for t in ["", "   ", None]:
        c = N.coach(t)
        assert c["score"] == 0 and c["sharper"] == "" and c["note"] == ""


@pytest.mark.parametrize("text", ["?!... ,,, ;;;", "😀😀🔥", "1 2 3 42", "$", "the and of to is it", '{"a": 1}'])
def test_no_words_scores_zero_with_a_note(text):
    c = N.coach(text)
    assert c["score"] == 0 and c["note"]


def test_symbols_only_gets_a_template_not_an_echo():
    c = N.coach("?!... ,,, ;;; --- !!!")
    assert c["sharper"].startswith("[Say what you want")


def test_hedges_removed_cleanly_and_capitalised():
    c = N.coach("Maybe write a 5-step checklist for night nurses about patient handover safety, I think.")
    assert c["sharper"].startswith("Write a 5-step checklist") and "safety." in c["sharper"] and ", ." not in c["sharper"]
    hedged = N.coach("maybe just really basically")
    assert hedged["sharper"].startswith("[Say what you want]") and hedged["score"] == 0


def test_hedge_inside_a_hyphenated_word_is_kept():
    c = N.coach("Just build a just-in-time inventory page for shop owners, a 3-step list.")
    assert "just-in-time" in c["sharper"] and "just" in c["hedges"]


def test_longer_vague_phrase_is_not_double_counted():
    c = N.coach("Add pages and stuff like that for my bakery")
    words = [v["word"] for v in c["vague"]]
    assert "stuff like that" in words and "stuff" not in words
    assert c["sharper"].count("[finish the list]") == 1


def test_user_brackets_are_not_wrapped_twice():
    assert "[[" not in N.coach("Make it [better] for my users")["sharper"]


def test_audience_check_accepts_long_audiences_and_rejects_for_example():
    assert next(k for k in N.coach("Write a checklist for night nurses about patient handover safety.")["checks"]
                if k["id"] == "audience")["ok"]
    assert not next(k for k in N.coach("Write a checklist for example about handover.")["checks"] if k["id"] == "audience")["ok"]


@pytest.mark.parametrize("text", ["¿Puedes mejorar mi página de inicio para que sea más bonita?", "你能帮我改进我的网站吗？",
                                  "هل يمكنك تحسين موقعي على الإنترنت؟", "Bonjour, je voudrais une page pour mon restaurant avec le menu"])
def test_non_english_gets_a_warning(text):
    assert "English" in N.coach(text)["note"]


@pytest.mark.parametrize("text", ["Build landing page React Tailwind dark mode",
                                  "Write a 5-step checklist for night nurses, under 200 words."])
def test_english_gets_no_language_warning(text):
    assert "English" not in N.coach(text)["note"]


def test_topics_ignore_urls_html_and_vague_words(index):
    c = N.coach("https://example.com/some/path fix this <script>x</script> asap", index)
    assert not {"https", "fix", "script", "asap"} & set(c["topics"])


def test_long_inputs_are_capped_fast_and_say_so(index, phrases):
    big = ("The landing page needs a clear call to action and better contrast for older readers. " * 3000)[:200_000]
    t0 = time.time()
    a, c = N.analyze(big), N.coach(big, index)
    m = N.agreement([{"name": "A", "text": big}, {"name": "B", "text": big[::-1]}], phrases)
    assert time.time() - t0 < 10
    assert a["counts"]["characters"] <= N.MAX_ANALYZE_CHARS and "200,000" in a["note"]
    assert len(c["sharper"]) < N.MAX_COACH_CHARS + 500 and c["note"]
    assert m["note"]
    assert N.analyze("short text")["note"] == "" and N.coach("short text")["note"] == ""


def test_clip_cuts_at_a_word():
    t, cut = N.clip("alpha beta gamma delta", 13)
    assert cut and t == "alpha beta"
    assert N.clip("short", 10) == ("short", False)


# ---------------------------------------------------------------- agreement map
def test_agreement_zero_and_one_answer(phrases):
    assert N.agreement([], phrases) == {"experts": [], "shared": [], "pairs": [], "note": ""}
    one = N.agreement([{"name": "A", "text": "I recommend a PWA."}], phrases)
    assert len(one["experts"]) == 1 and one["pairs"] == []


def test_agreement_identical_answers_agree(phrases):
    t = "I recommend a PWA. Push notifications work on Android and cost less."
    m = N.agreement([{"name": "A", "text": t}, {"name": "B", "text": t}], phrases)
    assert m["pairs"][0]["verdict"] == "agree" and m["pairs"][0]["overlap"] == 1.0 and not m["pairs"][0]["conflict"]


def test_recommendation_stops_at_the_sentence_end():
    m = N.agreement([{"name": "A", "text": "I recommend a PWA. Push notifications work on Android."},
                     {"name": "B", "text": "Go with Next.js. It renders on the server."}])
    assert m["experts"][0]["recommends"] == ["pwa"]            # was "pwa. push notifications"
    assert m["experts"][1]["recommends"] == ["next.js"]


def test_no_recommendation_is_no_conflict():
    m = N.agreement([{"name": "A", "text": "Push notifications matter for reminders."},
                     {"name": "B", "text": "Offline sync is the hard part. Choose wisely, and I recommend it."}])
    assert [e["recommends"] for e in m["experts"]] == [[], []]
    assert m["pairs"][0]["conflict"] is False


@pytest.mark.parametrize("a,b", [("I recommend a progressive web app.", "Go with a PWA."),
                                 ("I recommend a progressive web app.", "I'd pick a web app."),
                                 ("Go with a PWA.", "I'd pick a web app."),
                                 ("I recommend React.", "Go with react."),
                                 ("I recommend native apps.", "I would build a native app.")])
def test_same_recommendation_in_different_words_is_not_a_conflict(a, b):
    m = N.agreement([{"name": "A", "text": a}, {"name": "B", "text": b}])
    assert m["pairs"][0]["conflict"] is False and m["pairs"][0]["verdict"] != "disagree"


def test_generic_start_with_is_not_a_recommendation():
    m = N.agreement([{"name": "A", "text": "Start with the basics. Start with a list of users."},
                     {"name": "B", "text": "Move to the next step and switch to the plan."}])
    assert m["pairs"][0]["conflict"] is False


def test_markdown_does_not_hide_recommendations_or_add_noise():
    m = N.agreement([{"name": "A", "text": "**I recommend** **Next.js** for this. See https://nextjs.org/docs."},
                     {"name": "B", "text": "I recommend `Astro`. <script>alert(1)</script>"}])
    assert m["experts"][0]["recommends"] == ["next.js"] and m["experts"][1]["recommends"] == ["astro"]
    assert m["pairs"][0]["conflict"] is True
    terms = {t for e in m["experts"] for t in e["terms"]}
    assert not {"https", "script", "/script", "recommend"} & terms


def test_recommendation_verbs_are_not_shared_ideas():
    m = N.agreement([{"name": "A", "text": "I recommend building a PWA."}, {"name": "B", "text": "I recommend building native."}])
    assert not {"recommend", "building"} & {s[0] for s in m["shared"]}


def test_agreement_survives_bad_input():
    m = N.agreement([{"name": None, "text": None}, {"text": 123}, "plain string answer", {"name": "A", "text": "x"},
                     {"name": "A", "text": "y"}])
    names = [e["name"] for e in m["experts"]]
    assert names == ["Expert 1", "Expert 2", "Expert 3", "A", "A (2)"]   # unique, so the map can tell them apart
    assert N.agreement(None)["experts"] == []


def test_agreement_caps_answer_count_and_length(phrases):
    many = [{"name": f"E{i}", "text": "I recommend a PWA."} for i in range(N.MAX_ANSWERS + 5)]
    m = N.agreement(many, phrases)
    assert len(m["experts"]) == N.MAX_ANSWERS and "answers" in m["note"]
    long = N.agreement([{"name": "A", "text": "word " * 10_000}, {"name": "B", "text": "short"}], phrases)
    assert "cut" in long["note"]


def test_sample_answers_still_disagree_where_they_should(phrases):
    """The NLP Lab's built-in sample (web/src/nlp/samples.ts): PWA vs native is a conflict, Ana bridges both."""
    a = [{"name": "Maya", "text": "I recommend building the habit tracker as a progressive web app. Push notifications now work on iOS too."},
         {"name": "Leo", "text": "I would build a native app instead. A PWA is weak at widgets."},
         {"name": "Ana", "text": "Start with a progressive web app to test retention. If reminders fail, move to a native app later."}]
    m = N.agreement(a, phrases)
    verdict = {(p["a"], p["b"]): p for p in m["pairs"]}
    assert verdict[("Maya", "Leo")]["conflict"] and not verdict[("Maya", "Ana")]["conflict"]
    assert not verdict[("Leo", "Ana")]["conflict"]
