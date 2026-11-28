"""Quality checks for the team agreement map, the coach's limit check and the live collocations, from a red-team
review: realistic multi-expert answers must get sensible verdicts. Uses the NLTK data the browser uses."""
import sys
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


def pair(a: str, b: str) -> dict:
    m = N.agreement([{"name": "A", "text": a}, {"name": "B", "text": b}])
    return {**m["pairs"][0], "ra": m["experts"][0]["recommends"], "rb": m["experts"][1]["recommends"]}


def recs(text: str) -> list[str]:
    return N.recommendations(N.plain(text))


# ---------------------------------------------------------------- 1. gerund lead-ins
@pytest.mark.parametrize("text,want", [
    ("I recommend starting with a PWA.", ["pwa"]),
    ("I'd recommend going with Astro.", ["astro"]),
    ("I recommend using Supabase for auth.", ["supabase"]),
    ("I recommend building it with Remix.", ["remix"]),
    ("I recommend building the habit tracker as a progressive web app.", ["progressive web app"]),
    ("I recommend sticking with pgvector.", ["pgvector"]),
    ("I suggest switching to Vite.", ["vite"]),
    ("I recommend that you use Supabase.", ["supabase"]),
])
def test_gerund_and_clause_lead_ins_are_skipped(text, want):
    assert recs(text) == want


@pytest.mark.parametrize("text", ["I recommend caching responses in Redis.", "I recommend reading the WCAG 2.2 guidelines.",
                                  "I recommend you check the logs first.", "I suggest we talk to users."])
def test_an_action_or_a_clause_is_not_a_pick(text):
    assert recs(text) == []


def test_starting_with_a_pwa_agrees_with_go_with_a_pwa():
    p = pair("I recommend starting with a PWA.", "Go with a PWA.")
    assert p["ra"] == ["pwa"] and not p["conflict"] and p["verdict"] == "agree"


def test_names_ending_in_ing_are_kept():
    assert recs("I recommend Spring Boot.") == ["spring boot"]
    assert recs("I recommend Hugging Face for model hosting.") == ["hugging face"]


# ---------------------------------------------------------------- 2. tone never overrides the same pick
def test_same_pick_with_different_tone_agrees_with_a_note():
    p = pair("I recommend Postgres. It is great, reliable and wonderful, I love it!",
             "I recommend Postgres. MongoDB failed badly and caused terrible outages and data loss.")
    assert p["verdict"] == "agree" and not p["conflict"] and p["tone_gap"] >= 0.5
    assert "tone" in p["note"].lower()


def test_tone_alone_with_nothing_in_common_is_not_disagreement():
    p = pair("For RAG, I recommend pgvector since you already run Postgres. One database is simpler to back up.",
             "Whichever store you choose, never send personal data to a third-party embedding API without consent.")
    assert p["verdict"] != "disagree" and not p["conflict"]


def test_opposite_tone_about_the_same_ideas_is_a_note_not_a_disagreement():
    """"disagree" means conflicting recommendations only; VADER tone goes in the note."""
    p = pair("Push notifications are a great, wonderful way to boost retention!",
             "Push notifications are annoying, users hate them and they hurt retention.")
    assert p["verdict"] in ("agree", "different angles") and not p["conflict"] and p["note"] == "Opposite tone."


@pytest.mark.parametrize("a,b", [
    ("This is wonderful, great and delightful. I love the camera flow!", "The camera flow is terrible, broken and awful."),
    ("Great idea, works beautifully.", "Awful idea, it fails badly and hurts users."),
])
def test_tone_never_produces_disagree(a, b):
    p = pair(a, b)
    assert not p["conflict"] and p["verdict"] != "disagree" and "tone" in p["note"].lower()


def test_every_pair_has_a_note_string():
    m = N.agreement([{"name": "A", "text": "Use Postgres."}, {"name": "B", "text": "Use Postgres."}])
    assert m["pairs"][0]["note"] == ""


def test_pair_says_when_it_agrees_because_of_the_same_recommendation():
    # Low word overlap but the same pick: the verdict is agree, and the pair says why, so the map never shows
    # "Agree, overlap 10%" with no reason next to an intro that asks for 20%.
    p = pair("I recommend Postgres. The reporting queries need joins and the team already knows the query language.",
             "I recommend Postgres. Hosting is cheap, backups are automatic and upgrades are painless.")
    assert p["same_pick"] is True and p["verdict"] == "agree"
    q = pair("Use Postgres.", "Pick SQLite for this.")
    assert q["same_pick"] is False and q["conflict"] is True


# ---------------------------------------------------------------- 3. imperatives
@pytest.mark.parametrize("text,want", [
    ("Use Postgres.", ["postgres"]),
    ("Pick SQLite for this.", ["sqlite"]),
    ("For auth, use Clerk.", ["clerk"]),
    ("Instead of MongoDB, use Postgres.", ["postgres"]),
    ("Build it as a native app.", ["native app"]),
    ("Build the frontend with SvelteKit.", ["sveltekit"]),
    ("Ship a PWA first.", ["pwa"]),
    ("- Use Next.js\n- Use Tailwind", ["next.js", "tailwind"]),
    ("Don't use Redux. Use Zustand.", ["zustand"]),
])
def test_sentence_initial_imperatives_are_recommendations(text, want):
    assert recs(text) == want


@pytest.mark.parametrize("text", [
    "Use caution with migrations.", "Use it wisely.", "Use the following steps.", "Use a checklist.",
    "Use clear labels and visible focus states.", "Use HTTPS everywhere.", "Use semantic HTML and ARIA only where needed.",
    "In short, use caution.", "Pick one metric and track it weekly.", "Choose a name your users remember.",
    "Go with your gut.", "Start with the information architecture.", "You can pick any color you like.",
    "Never use eval.", "Build the habit tracker.",
])
def test_generic_instructions_are_not_recommendations(text):
    assert recs(text) == []


def test_postgres_vs_sqlite_imperatives_conflict():
    p = pair("Use Postgres.", "Pick SQLite for this.")
    assert p["conflict"] and p["verdict"] == "disagree"


def test_generic_instruction_does_not_conflict_with_a_pick():
    p = pair("Use caution with migrations. Use it wisely.", "Pick SQLite for this.")
    assert not p["conflict"]


# ---------------------------------------------------------------- negation
@pytest.mark.parametrize("text,want", [
    ("I wouldn't recommend MongoDB for this. Postgres is the safer choice.", []),
    ("I would not pick Remix here.", []),
    ("I don't recommend Firebase, I recommend Supabase.", ["supabase"]),
    ("I'd avoid choosing Firebase.", []),
])
def test_negated_recommendations_are_not_picks(text, want):
    assert recs(text) == want


# ---------------------------------------------------------------- 4. same or different pick
@pytest.mark.parametrize("a,b", [
    ("progressive web app", "pwa"), ("progressive web app", "web app"), ("pwa", "web app"),
    ("tailwind", "tailwind css"), ("express", "express.js"), ("postgres", "postgresql"), ("next.js", "nextjs"),
    ("react", "react.js"), ("native app", "native apps"), ("mongo", "mongodb"), ("aws", "aws lambda"),
])
def test_same_pick(a, b):
    assert N.same_recommendation(a, b) and N.same_recommendation(b, a)


@pytest.mark.parametrize("a,b", [
    ("react", "react native"), ("vue", "vue native"), ("tensorflow", "tensorflow lite"), ("native app", "web app"),
    ("native app", "pwa"), ("next.js", "remix"), ("postgres", "mongodb"), ("pgvector", "pinecone"), ("next.js", "react"),
])
def test_different_pick(a, b):
    assert not N.same_recommendation(a, b) and not N.same_recommendation(b, a)


def test_react_vs_react_native_is_a_conflict():
    assert pair("I recommend React.", "I recommend React Native.")["conflict"]
    assert pair("Go with Vue.", "Go with Vue Native.")["conflict"]


# ---------------------------------------------------------------- realistic multi-expert answers
REAL = {
    "frontend": [
        ("Hiroshi", "For a content-heavy marketing site with a dashboard, I'd go with Next.js. Server components keep the "
                    "bundle small, and Vercel previews help the team review changes. I would not pick Remix here, "
                    "because the team already knows Next."),
        ("Pavel", "I recommend Remix. Nested routes and loaders make data loading predictable, and forms work without "
                  "JavaScript. Next.js is fine too, but its caching rules confuse people."),
        ("Ottilie", "Whatever framework you choose, start with the information architecture: list the pages, the user "
                    "tasks and the empty states before writing code."),
    ],
    "database": [
        ("Liesl", "Use PostgreSQL. Orders, invoices and users are relational, and you need transactions. Don't use MongoDB for money."),
        ("Kofi", "I'd use Postgres too, with Prisma as the ORM. Add read replicas later if traffic grows."),
        ("Ines", "I would avoid a relational database at this stage. Go with MongoDB: the schema will change weekly and "
                 "documents map to the JSON API."),
    ],
    "mobile": [
        ("Mireille", "Build it as a native app with SwiftUI and Kotlin. Widgets, background reminders and HealthKit need native APIs."),
        ("Imani", "Ship a PWA first. It is cheaper, one codebase, and web push works on iOS 16.4 and later. Measure retention "
                  "before going native."),
        ("Greta", "I recommend starting with a PWA and keeping the data layer portable so a native client can come later."),
    ],
    "rag": [
        ("Ines", "For RAG, I recommend pgvector since you already run Postgres. One database is simpler to back up and secure."),
        ("Liesl", "I would use Pinecone. A managed vector database scales to millions of embeddings without tuning HNSW indexes."),
        ("Greta", "Stick with pgvector until you pass about five million vectors; then reconsider a dedicated store like Pinecone."),
        ("Rosalind", "Whichever store you choose, never send personal data to a third-party embedding API without consent."),
    ],
}
EXPECTED = {
    "frontend": {("Hiroshi", "Pavel"): "disagree", ("Hiroshi", "Ottilie"): "!disagree", ("Pavel", "Ottilie"): "!disagree"},
    "database": {("Liesl", "Kofi"): "agree", ("Liesl", "Ines"): "disagree", ("Kofi", "Ines"): "disagree"},
    "mobile": {("Mireille", "Imani"): "disagree", ("Mireille", "Greta"): "disagree", ("Imani", "Greta"): "agree"},
    "rag": {("Ines", "Liesl"): "disagree", ("Ines", "Greta"): "agree", ("Liesl", "Greta"): "disagree",
            ("Ines", "Rosalind"): "!disagree", ("Greta", "Rosalind"): "!disagree"},
}


@pytest.mark.parametrize("name", list(REAL))
def test_realistic_team_answers_get_sensible_verdicts(name):
    m = N.agreement([{"name": n, "text": t} for n, t in REAL[name]])
    got = {(p["a"], p["b"]): p["verdict"] for p in m["pairs"]}
    for key, want in EXPECTED[name].items():
        assert (got[key] != want[1:]) if want.startswith("!") else (got[key] == want), (key, got[key], m["experts"])


def test_realistic_recommendations():
    m = N.agreement([{"name": n, "text": t} for n, t in REAL["frontend"]])
    assert [e["recommends"] for e in m["experts"]] == [["next.js"], ["remix"], []]   # "would not pick Remix" is no pick
    m = N.agreement([{"name": n, "text": t} for n, t in REAL["database"]])
    assert [e["recommends"] for e in m["experts"]] == [["postgresql"], ["postgres"], ["mongodb"]]


# ---------------------------------------------------------------- 5. coach: a limit is a limit
def _limit_ok(text: str) -> bool:
    return next(c for c in N.coach(text)["checks"] if c["id"] == "constraint")["ok"]


@pytest.mark.parametrize("text", [
    "Write a landing page made by students for students", "Write the post step by step for nurses",
    "Explain how it works under the hood", "Pay me by the hour", "Plan it day by day", "Use less jargon please",
    "Draft it before I start the meeting", "Test them one by one",
])
def test_by_under_before_in_other_senses_are_not_limits(text):
    assert not _limit_ok(text)


@pytest.mark.parametrize("text", [
    "Plan the launch by Friday", "Write it by the end of the month", "Finish within a week", "Keep it under budget",
    "Write no more than ten bullets", "Ship it by next week", "Done by 5pm", "Cost under $50", "Need it before launch",
    "Answer in under 200 words", "Must work offline", "Keep the deadline in mind",
])
def test_deadlines_and_limits_count(text):
    assert _limit_ok(text)


# ---------------------------------------------------------------- 6. collocations on the real token order
def test_collocations_only_pair_adjacent_words():
    t = ("The speed of the build matters. The speed of the build is slow. Push notifications, retention. "
         "Push notifications help retention.")
    pairs = {(a, b) for a, b, _, _ in N.analyze(t)["collocations"]}
    assert ("push", "notifications") in pairs
    assert ("speed", "build") not in pairs                 # "speed of the build": not next to each other
    assert ("notifications", "retention") not in pairs     # across a comma
    assert ("retention", "push") not in pairs              # across a sentence end


def test_collocations_shape_and_input_forms():
    toks = N.tokenize("machine learning helps. machine learning scales. deep learning too. machine learning wins.")
    col = N.collocations(toks, 3, 2)
    assert col[0][:2] == ["machine", "learning"] and col[0][3] == 3 and isinstance(col[0][2], float)
    assert N.collocations([toks], 3, 2) == col           # one list per sentence or one flat list
    assert N.collocations([], 3, 1) == [] and N.collocations([[]], 3, 1) == [] and N.collocations(["a"], 3, 1) == []


# ---------------------------------------------------------------- live team-chat answers (on-device model)
def _live_phrases() -> list[str]:
    import json
    idx = json.loads((PUB / "topic-index.json").read_text())
    return [p for p, _ in idx["phrases"] if " " in p]   # exactly as web/src/nlp/boot.ts


LIVE_A = [
    ("Farrah Quintero", "Feature | Required Component | Recommended AI Platform\nCamera access | Device camera permissions | "
                        "Any (no AI needed)\n\nRecommendation: No AI platform is needed for core functionality. Use a "
                        "framework like React Native for cross-platform development. For image handling, use device APIs. "
                        "For backend, use Firebase or similar. AI is not required for this task."),
    ("Ines Abernathy", "Feature | Requirement | AI Platform Recommendation | Reason\nCamera access | Permissions, image "
                       "capture | Claude | Strong API for image processing and integration\nBefore/after proof | Image "
                       "comparison, storage | Claude | Capable of handling image data"),
    ("Xavi Montenegro", "Deploy the web app on Netlify with a backend API for image uploads. Camera capture uses the "
                        "browser's getUserMedia; no AI-dependent processing is needed at launch."),
]
LIVE_B = [
    ("Ines Abernathy", "Recommendation: Implement a streamlined API for Claude that supports streaming, prompt caching, "
                       "and tool use.\nPrompt: \"Act as Ines Abernathy, AI/LLM Integration Engineer. Evaluate and optimize "
                       "Claude API integration for BrainyApp2.\""),
    ("Jasper Moreau", "If someone has chest pain, call emergency services immediately. Clear, calm, actionable advice "
                      "beats medical guessing."),
]


def test_live_a_no_ai_needed_is_not_a_disagreement():
    m = N.agreement([{"name": n, "text": t} for n, t in LIVE_A], _live_phrases())
    assert all(p["verdict"] != "disagree" and not p["conflict"] for p in m["pairs"]), m["pairs"]
    farrah = m["experts"][0]["recommends"]
    assert "ai platform" not in farrah and "device apis" not in farrah and "react native" in farrah, farrah
    assert not any("like" in r.split() for r in farrah)
    assert m["experts"][1]["recommends"] == []      # "Recommended AI Platform" / "AI Platform Recommendation" are headers
    assert all(p["note"] in ("", "Different tone.", "Opposite tone.") for p in m["pairs"])


def test_live_b_terms_leave_out_names_and_persona_words():
    for names in (LIVE_B, [("Ines", LIVE_B[0][1]), ("Jasper", LIVE_B[1][1])]):
        m = N.agreement([{"name": n, "text": t} for n, t in names], _live_phrases())
        terms = [w for e in m["experts"] for t in e["terms"] for w in t.split()]
        assert not {"ines", "abernathy", "jasper", "moreau", "act", "engineer", "recommendation"} & set(terms), terms
        assert "claude api" in m["experts"][0]["terms"] or "claude" in " ".join(m["experts"][0]["terms"])


def test_author_names_are_not_ideas_but_roles_in_brackets_are_kept():
    m = N.agreement([{"name": "Maya (Frontend)", "text": "Maya here. Frontend performance matters: frontend bundles, frontend caching."},
                     {"name": "Leo", "text": "Leo again: frontend bundles should stay small."}])
    t0, t1 = m["experts"][0]["terms"], m["experts"][1]["terms"]
    assert "maya" not in t0 and "leo" not in t1 and "frontend" in t0
    assert N._name_tokens(["Maya (Frontend)", "ux-writer", "Ines Abernathy"]) == {"maya", "ines", "abernathy"}


@pytest.mark.parametrize("text,want", [
    ("Use a framework like React Native for cross-platform development.", ["react native"]),
    ("I'd go with a managed database such as Supabase.", ["supabase"]),
    ("I recommend something like Postgres.", ["postgres"]),
    ("Use Postgres like everyone else does.", ["postgres"]),
    ("For backend, use Firebase or similar.", ["firebase"]),
])
def test_named_example_after_like_or_such_as_is_the_pick(text, want):
    assert recs(text) == want


@pytest.mark.parametrize("text", [
    "For image handling, use device APIs.", "Use a UI library.", "Use the SDK.",
    "Recommended AI Platform", "Recommended stack: Next.js and Postgres",
    "The recommended database is whatever the team knows.",
    "Recommendation: No AI platform is needed for core functionality.",
    "I recommend no framework at all.", "I recommend Redis is not needed here.",
])
def test_headers_generic_objects_and_not_needed_are_not_picks(text):
    assert recs(text) == []


def test_real_recommendations_still_found_after_header_rules():
    assert recs("I recommended Postgres to the team.") == ["postgres"]
    assert recs("We have recommended Supabase.") == ["supabase"]
    assert recs("Use the Stripe API for payments.") == ["stripe api"]
    assert recs("Use AWS SDK v3.") == ["aws sdk v3"]
