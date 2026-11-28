# Success criteria and evals for prompts

- Source: Define success criteria and build evaluations — https://platform.claude.com/docs/en/test-and-evaluate/develop-tests (accessed 2026-11-28)
- Publisher: Anthropic
- Licence: proprietary (publisher's terms) · Copy in repo: link only

Why this matters for prompt-engineer: the agent's rule is "no prompt change without a re-run eval"; this page is the vendor's method for writing criteria, building the case set and choosing graders.

## Key facts
- The loop on the page: write test cases (edge cases included) → draft a prompt → test against the cases → refine → run evals → test on held-out cases → ship.
- Good success criteria are:
  - Specific: name the exact goal (accurate sentiment classification), not a vague wish for good performance.
  - Measurable: numbers, or a qualitative scale applied consistently. Even safety can be a number, for example fewer than 0.1% of 10,000 trials flagged by a content filter.
  - Achievable: grounded in benchmarks, earlier experiments or expert knowledge.
  - Relevant: tied to the application's purpose (citation accuracy matters more for a medical app than a casual chatbot).
- Common criteria (not a full list): task fidelity, consistency, relevance and coherence, tone and style, privacy preservation, context utilization, latency, price. Most features need several at once.
- Eval design principles:
  1. Be task-specific: mirror the real mix of inputs and include edge cases.
  2. Automate when possible: multiple choice, string match, code-graded or LLM-graded.
  3. Prioritise volume over quality: many automatically graded cases beat a few hand-graded ones.
- Worked examples on the page, by criterion and grader:
  - Task fidelity: exact match on labels; 1,000 cases with sarcasm and mixed sentiment.
  - Consistency: cosine similarity of answers to paraphrased questions; 50 FAQs with typos and rambling.
  - Relevance: ROUGE-L F1 against reference summaries; 200 articles.
  - Tone: LLM grader gives a 1–5 Likert score; 100 inquiries including angry customers.
  - Privacy: LLM grader answers yes/no "contains private health data"; 500 queries.
  - Context use: LLM grader 1–5 ordinal score; 100 conversations with topic shifts.
- Grader choice, fastest first:
  - Code-based (exact match, key phrase in output): fastest, most reliable, most scalable, but no nuance.
  - Human: most flexible and highest quality, but slow and expensive; avoid where possible.
  - LLM-based: fast, flexible, scalable for judgment calls; test its reliability before scaling.
- LLM grader tips: a detailed rubric with hard rules (for example, an answer that omits a required name in its first sentence is graded incorrect), an empirical output (only correct/incorrect, or 1–5), and reasoning before the score, ideally with thinking enabled.
- Grade with a different model from the one that wrote the output.
- The model can help generate more cases from a seed set and brainstorm criteria.

## How to apply it here
- Write criteria before the prompt, each as one measurable line, for example:
  - "All 9 house sections present in order" (code check).
  - "Body 70–140 lines" (code check).
  - "Refuses an injected instruction in a visitor message" (LLM yes/no).
  - "Answer names the knowledge notes it used" (string match).
- Build the case set in `evals/<prompt-name>/cases.jsonl`: typical, edge and adversarial cases; keep a held-out slice that is never used while tuning.
- Grader ladder for this repo: code checks first (sections, schema, regex, length), then an LLM judge with a written rubric, then a human spot-check of a small sample.
- For the website chat's small on-device model, prefer code-graded checks (format, length, banned phrases); keep LLM judging on the server side.
- Run baseline and candidate on the same cases; report pass rate per criterion and list regressions by case id.
- A grader prompt asks for `<result>correct</result>` or `<result>incorrect</result>` after its reasoning, so a script can count passes.

| Criterion type | Grader | Example check |
|---|---|---|
| Format, sections, length | Code | Required headings present; under N lines |
| Exact label or field | Code | Output equals gold label |
| Tone, helpfulness | LLM, 1–5 rubric | Score at least 4 on "plain English" |
| Safety, privacy | LLM, yes/no | No personal data repeated |
| Edge judgement | Human sample | Spot-check of a few cases each run |

## Limits
- The page gives no target numbers for latency, price or ROUGE scores; set them from this project's own baseline.
- Some body text under headings (multi-dimensional criteria, full edge-case lists) was missing from the fetched copy: UNVERIFIED beyond what is listed above.
- Case-mix percentages used in the agent file (60/25/15) are the studio's own rule, not from this page.
