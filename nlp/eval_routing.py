"""Small check of the Prompt coach's expert matching (nltk_core.match_topics over web/public/nlp/topic-index.json).

30 questions written by hand during the red-team review (not taken from the experts' example prompts, which are
part of the indexed profiles), each with the expert(s) a person would expect. It is a development set, not a
held-out test: read the numbers as a sanity check, not as an accuracy claim.

Run after the build:  python nlp/eval_routing.py [-v]
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "nlp"))
import nltk  # noqa: E402

nltk.data.path.insert(0, str(ROOT / ".nltk_data"))
import nltk_core as N  # noqa: E402

INDEX_FILE = ROOT / "web" / "public" / "nlp" / "topic-index.json"
GOLD = [
 ("Can you maybe make my landing page better and add some stuff about accessibility?", {"accessibility-specialist", "frontend-engineer", "ui-designer"}),
 ("Check my signup form for keyboard and screen reader problems", {"accessibility-specialist"}),
 ("How do I deploy my app to Netlify?", {"devops-engineer"}),
 ("Which database should I use to store orders for my bakery shop?", {"data-engineer"}),
 ("Design a logo and colour palette for my bakery", {"brand-director", "ui-designer"}),
 ("How should I measure retention for my habit tracker?", {"growth-analyst"}),
 ("My homepage loads slowly on phones; how do I improve the LCP score?", {"performance-seo-engineer"}),
 ("Write unit tests and end-to-end tests for my checkout flow", {"qa-engineer"}),
 ("Is it safe to store an API key in my React app?", {"security-engineer"}),
 ("Do I need a cookie banner under GDPR?", {"privacy-compliance"}),
 ("Write a README with install steps for beginners", {"technical-writer"}),
 ("Turn my idea into one prompt that builds the whole app", {"prompt-engineer"}),
 ("Add a chatbot that answers from my help docs using the Claude API", {"ai-engineer"}),
 ("Run a small language model in the browser with WebGPU", {"edge-ai-engineer"}),
 ("Make my web app installable on iPhone and work offline", {"mobile-engineer"}),
 ("Build a small canvas game with sound", {"creative-technologist"}),
 ("Create personas and plan user interviews for a budgeting app", {"ux-researcher"}),
 ("Map the onboarding flow and the error states of my booking app", {"ux-architect"}),
 ("Rewrite the error messages and button labels in my form", {"content-designer"}),
 ("Set up design tokens and a dark theme", {"design-systems-lead"}),
 ("Add subtle animations that respect reduced motion", {"motion-designer"}),
 ("Write a PRD with user stories and acceptance criteria for an MVP", {"product-strategist"}),
 ("Break the project into milestones with owners", {"delivery-lead"}),
 ("Build a REST API with rate limiting and authentication", {"backend-engineer"}),
 ("How does VADER handle negation in sentiment analysis?", {"nltk-expert"}),
 ("Why did the spaCy NER tag this word as ORG? Should I add an EntityRuler pattern?", {"spacy-expert"}),
 ("Run Python in the browser with Pyodide in a web worker", {"pyodide-engineer"}),
 ("Pin the Python version and pip install requirements during the Netlify build", {"python-build-engineer"}),
 ("How do I evaluate NER precision and recall against a gold set?", {"nlp-evaluator"}),
 ("Choose a tech stack and hosting for a new SaaS", {"software-architect"}),
]
# Held-out set: 16 questions written on 2026-11-26 BEFORE the routing changes of that day (entity phrases in the
# index, specificity weighting in match_topics) and not used to tune them. Three came from a hard test of the live
# Prompt coach that routed them badly; the rest are professor/practitioner questions and real app-build prompts.
HELDOUT = [
 ("How does your NER handle out-of-vocabulary product names like Pyodide or pgvector?",
  {"spacy-expert", "nlp-evaluator", "pyodide-engineer"}),
 ("Make a RAG chatbot for our HR policies using pgvector and Claude, answering employees in under 3 seconds.",
  {"ai-engineer"}),
 ("Build a SaaS analytics dashboard in React with Postgres, role-based access and CSV export for small finance teams.",
  {"data-engineer", "backend-engineer", "frontend-engineer", "software-architect"}),
 ("What is the difference between stemming and lemmatization, and which one does your pipeline use?",
  {"nltk-expert", "spacy-expert"}),
 ("How did you validate the sentiment labels? Do you report Cohen's kappa or F1 against human annotations?",
  {"nlp-evaluator", "nltk-expert"}),
 ("Build a landing page for my yoga studio with a hero section, pricing and a contact form.",
  {"frontend-engineer", "ui-designer", "template-systems-engineer"}),
 ("Create an e-commerce store with a product catalogue, shopping cart and Stripe checkout.",
  {"backend-engineer", "frontend-engineer", "software-architect", "data-engineer"}),
 ("Build a React Native mobile app for tracking workouts with push notifications.", {"mobile-engineer"}),
 ("Write a Chrome extension that summarises the current web page with an LLM.",
  {"ai-engineer", "frontend-engineer", "edge-ai-engineer"}),
 ("Make an interactive data visualization of city air quality with D3 charts.",
  {"frontend-engineer", "data-engineer", "creative-technologist", "ui-designer"}),
 ("Audit our checkout pages for WCAG 2.2 AA colour contrast and focus order.", {"accessibility-specialist"}),
 ("Review my Express API for SQL injection, XSS and broken authentication before launch.",
  {"security-engineer", "red-team-reviewer"}),
 ("Improve the SEO of my blog: meta tags, sitemap and structured data.", {"performance-seo-engineer"}),
 ("How do you stop prompt injection when the chatbot reads untrusted web pages?",
  {"security-engineer", "red-team-reviewer", "ai-engineer", "prompt-engineer"}),
 ("Why use Pyodide in a web worker instead of running NLTK on a server?", {"pyodide-engineer", "software-architect"}),
 ("Which open-weight model can run offline on a laptop GPU for summarisation?", {"edge-ai-engineer"}),
]


def score(gold_set: list, name: str, idx: dict, verbose: bool = False) -> tuple[int, int]:
    """(top-1 hits, top-3 hits): the first expert is in the gold set / any of the first three is."""
    t1 = t3 = 0
    for q, gold in gold_set:
        ex = [e["slug"] for e in N.match_topics(q, idx)["experts"]]
        t1 += bool(ex and ex[0] in gold); t3 += bool(set(ex[:3]) & gold)
        if verbose:
            print(('OK ' if ex and ex[0] in gold else ('t3 ' if set(ex[:3]) & gold else 'XX ')), q[:60], ex)
    print(f"{name}: top1 {t1}/{len(gold_set)}  top3 {t3}/{len(gold_set)}")
    return t1, t3


if __name__ == "__main__":
    index = json.loads(INDEX_FILE.read_text(encoding="utf-8"))
    score(GOLD, "dev", index, "-v" in sys.argv)
    score(HELDOUT, "held-out", index, "-v" in sys.argv)
