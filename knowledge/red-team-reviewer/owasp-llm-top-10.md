# OWASP Top 10 for LLM applications: review checklist

- Source: 2025 Top 10 Risk & Mitigations for LLMs and Gen AI Apps — https://genai.owasp.org/llm-top-10/ (accessed 2026-11-28); supporting page: LLM01:2025 Prompt Injection — https://genai.owasp.org/llmrisk/llm01-prompt-injection/ (accessed 2026-11-28)
- Publisher: OWASP Foundation (OWASP Gen AI Security Project)
- Licence: CC-BY-SA-4.0 · Copy in repo: link only

Why this matters for red-team-reviewer: the release gate's "abuse" step needs a named, current list to attack against; every LLM feature in this repo (server chat, on-device chat, generated code) is scored against these ten risks.

## Key facts
- The 2025 edition, with a detail page per risk:
  1. LLM01:2025 Prompt Injection
  2. LLM02:2025 Sensitive Information Disclosure
  3. LLM03:2025 Supply Chain
  4. LLM04:2025 Data and Model Poisoning
  5. LLM05:2025 Improper Output Handling
  6. LLM06:2025 Excessive Agency
  7. LLM07:2025 System Prompt Leakage
  8. LLM08:2025 Vector and Embedding Weaknesses
  9. LLM09:2025 Misinformation
  10. LLM10:2025 Unbounded Consumption
- The site also has a page titled "2026 Top 10 Critical Security Risks for LLM Applications" (last modified 2026-11-03) listing a reordered set: Prompt Injection, Sensitive Information Disclosure, Excessive Agency, Supply Chain, Data and Model Poisoning, Unbounded Consumption, Misinformation, Hidden Context Exposure, Vector and Embedding Weaknesses, Improper Output Handling. It shows no release status or date and its download buttons still lead to the 2025 guide.
- Prompt injection (LLM01): input changes model behaviour in ways the developer did not intend; it can be invisible to people as long as the model reads it. RAG and fine-tuning do not fully prevent it.
  - Direct: the user's own prompt changes behaviour, on purpose or by accident.
  - Indirect: instructions arrive inside content the model reads (web pages, files, retrieved notes).
  - Jailbreaking is a form of injection aimed at dropping safety rules entirely.
- Impacts listed for LLM01: leaking sensitive data or the system prompt, manipulated or biased output, unauthorised use of functions the model can reach, command execution in connected systems, swayed decisions. Severity grows with the model's agency.
- OWASP says there may be no fool-proof prevention; its seven mitigations reduce impact:
  1. Constrain behaviour in the system prompt (role, scope, ignore override attempts).
  2. Define output formats and check them with deterministic code.
  3. Filter inputs and outputs (semantic and string checks; context relevance, groundedness, answer relevance).
  4. Least privilege: the app holds its own tokens; privileged functions run in code, not through the model.
  5. Human approval for high-risk actions.
  6. Separate and label untrusted content.
  7. Regular adversarial testing that treats the model as an untrusted user.
- Attack scenarios named: direct override, hidden instructions in a summarised page that add a leaking link, payload splitting across fragments, multimodal hidden prompts in images, adversarial suffixes, and other languages or encodings (Base64, emoji) to dodge filters.
- Related MITRE ATLAS techniques: AML.T0051.000 (direct), AML.T0051.001 (indirect), AML.T0054 (jailbreak).

## How to apply it here
- Score each LLM surface of the release against all ten; any untested item is Unverifiable, not Met.

| Risk | What to probe in this repo | Typical Blocker |
|---|---|---|
| LLM01 | Visitor text and condensed notes that say "ignore your rules" | Agent obeys injected text |
| LLM02 / LLM07 | Ask the chat to print its system prompt or keys | Secret or key in a prompt or bundle |
| LLM03 | Pinned web-llm version, model hosts, third-party skills | Unpinned or unreviewed dependency |
| LLM05 | Model Markdown rendered as HTML; generated code run on the site's origin | Raw HTML or script executes |
| LLM06 | Tools or skills that send, publish or delete | Side effect without confirmation |
| LLM08 | Any retrieval index | Poisoned or cross-user chunks |
| LLM09 | NLP Lab claims, model answers stated as fact | Wrong fact on a core page with no caveat |
| LLM10 | Server chat with no cap; download loops | No quota, rate limit or kill switch |

- Attack scripts to run: one direct injection, one indirect (instruction hidden in a note or pasted page), one encoded (Base64), one split payload, one "show your instructions".
- Evidence for each: the input used, the output captured, and the file or setting that stopped it.

## Limits
- Detail pages for LLM02–LLM10 were not fetched in this round; the table's probes come from the risk names plus the studio's own threat model.
- Status of the 2026 list is UNVERIFIED (no release date or document); cite 2025 IDs in findings and add the 2026 name where it differs.
- The list is not a full test standard; it does not replace the web OWASP Top 10 checks in the shared security note.
