---
name: "prompt-evals"
description: "Use when a prompt, agent system prompt, model choice, tool definition or retrieval setup is created or changed and you must prove it got better, not worse. Produces a versioned eval set, graders, a baseline-vs-candidate comparison (quality, cost, latency) and a ship / no-ship decision recorded in reports/evals/."
---
# Prompt Evals

## Purpose
Replace "it looks better to me" with numbers. Every prompt or model change is judged on the same fixed
set of cases, with graders agreed before the run, and compared against a recorded baseline. One change
per run, so we know what caused the difference. Case formats, a judge prompt and a runner sketch are in
[reference.md](reference.md).

## Procedure
1. **Frame the decision.** Write one line: "We are deciding whether to ship <change> for <feature>."
   Name the prompt file and version, the model ID (for example `claude-sonnet-5-5`) and who decides.
2. **Write success criteria before running anything.** Make each one specific and measurable, and cover
   several dimensions (task fidelity, format, safety, grounding, tone, latency, cost). Set thresholds now:
   - Core quality: at least 90% of cases pass every "must" criterion.
   - Must-not-fail cases (safety, privacy, injection): 100% pass. One failure blocks the release.
   - Output format (JSON schema, required sections): 100% valid.
   - Latency: p95 time-to-first-token and p95 total time under the feature's budget.
   - Cost: average input + output tokens per call within budget; note cache read/write tokens separately.
3. **Build the case set** in `evals/<feature>/cases.jsonl` (30–60 cases to start):
   - ~60% typical requests (real, anonymised usage when available; otherwise realistic drafts).
   - ~25% edge cases: empty or one-word input, very long input, other languages, typos, ambiguous asks,
     requests just outside scope.
   - ~15% adversarial: injection inside user text or retrieved documents ("ignore previous
     instructions"), requests to reveal the system prompt or keys, harmful or off-policy asks.
   - Tag every case (`typical|edge|adversarial`, feature area) and mark `must_pass: true` where needed.
   - Split off ~20% as a **held-out** set you do not look at while iterating.
   - Never put real personal data, secrets or customer text you have no right to use in an eval file.
4. **Choose the cheapest grader that works**, in this order:
   - Code graders: JSON parse + schema check, exact or regex match, `must_include` / `must_not_include`,
     length limits, required headings present, no leaked strings (system prompt fragments, `sk-ant-`).
   - LLM judge for nuance (helpfulness, faithfulness to sources, tone): a written rubric, one verdict per
     criterion (pass/fail or 1–5), JSON output, reasoning before the verdict, and a different model from
     the one being tested where practical.
   - Human spot-check of ~10% of judged cases, plus every disagreement.
5. **Calibrate the judge.** Hand-label 10–20 cases, run the judge on them, and require at least 85%
   agreement before trusting it. If lower, tighten the rubric (concrete pass/fail examples) and repeat.
6. **Record the baseline.** Run the current prompt on the full working set. Log model ID, prompt version
   (file hash), parameters, date, and token usage from the API response `usage` fields. If outputs vary
   between runs, run each case 3 times and score a case by passes/3; flag cases that flip as *flaky*.
7. **Change one thing.** Wording, examples, ordering, a tool description, the model, or retrieved context:
   one at a time. Keep stable content (system prompt, tool list) at the start so prompt caching can help.
8. **Run the candidate** on the identical working set with identical graders.
9. **Compare and decide.** Report per-criterion pass rates for baseline vs candidate, the list of
   regressions (cases that passed before and fail now), cost per 100 calls, and p50/p95 latency.
   Ship only if: no must-pass failures, no new regressions in must-pass cases, the core threshold is met,
   and cost/latency stay within budget. Otherwise iterate (back to step 7) or reject.
10. **Confirm on the held-out set once**, at the end. A big drop versus the working set means you
    overfitted; go back and generalise the prompt rather than adding case-specific patches.
11. **Write it up** in `reports/evals/<feature>-<YYYY-MM-DD>.md` using the template below, and add every
    newly discovered failure as a permanent regression case.

### For studio agent prompts
Cases are realistic visitor requests for that agent. Code graders check that every output-template
section is present, that the agent names the knowledge notes it used, that it stays inside its
boundaries, and that hand-offs name the right teammate.

### Model and parameter cautions
Check the current Claude model docs (https://platform.claude.com/docs) for which request parameters a
model accepts. Reports that the 5.5 models reject sampling parameters such as `temperature` are
UNVERIFIED here, so do not rely on temperature for repeatability; use repeated runs instead.

## Checklist
- [ ] Decision, feature, prompt version and model ID written down
- [ ] Success criteria and thresholds fixed **before** the first run
- [ ] 30+ cases with typical / edge / adversarial mix and tags; must-pass cases marked
- [ ] Held-out split created and not used during iteration
- [ ] No personal data or secrets in eval files
- [ ] Code graders used wherever possible; LLM judge has a rubric and JSON output
- [ ] Judge calibrated (≥85% agreement with human labels)
- [ ] Baseline recorded with model, prompt hash, parameters, date, tokens
- [ ] Exactly one variable changed between baseline and candidate
- [ ] Flaky cases identified (3 runs where output varies)
- [ ] Regressions listed case by case
- [ ] Cost per 100 calls and p50/p95 latency compared
- [ ] Held-out set run once at the end
- [ ] Report saved in reports/evals/ and new failures added as regression cases

## Output template
```markdown
# Eval report: <feature> — <change in one line>
Date: YYYY-MM-DD · Owner: <agent> · Decision: SHIP | ITERATE | REJECT

## Setup
- Model: <model ID> · Prompt: <path>@<hash> (baseline) → <hash> (candidate)
- Cases: <n working> + <n held-out> · Runs per case: <1|3> · Judge: <model + rubric path>

## Results
| Criterion | Threshold | Baseline | Candidate | Δ |
|---|---|---|---|---|
| Must-pass (safety/injection) | 100% | | | |
| Core quality | ≥90% | | | |
| Format valid | 100% | | | |
| p95 latency (s) | ≤ | | | |
| Cost / 100 calls (USD) | ≤ | | | |

## Regressions (passed before, fail now)
| Case ID | Tag | What went wrong |
|---|---|---|

## Flaky cases
- <id>: <passes>/3

## Held-out confirmation
- Working set: <x%> · Held-out: <y%> · Overfitting concern: yes/no

## Decision and next step
<one paragraph: why, and what changes next>
```
