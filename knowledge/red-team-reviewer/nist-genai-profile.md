# NIST AI 600-1: generative AI risks and test actions

- Source: Artificial Intelligence Risk Management Framework: Generative Artificial Intelligence Profile (NIST AI 600-1) — https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf (accessed 2026-11-28); supporting page: publication record — https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence (accessed 2026-11-28)
- Publisher: National Institute of Standards and Technology (US Department of Commerce)
- Licence: public domain in the United States (work of NIST staff; worldwide reprint right granted, per NIST's licensing statements) · Copy in repo: link only

Why this matters for red-team-reviewer: it gives a government-backed list of generative AI risks and named test actions, so a gate finding can cite a recognised control instead of the reviewer's opinion.

## Key facts
- Published 26 July 2024 (record updated 8 April 2026); DOI 10.6028/NIST.AI.600-1. A cross-sector profile of and companion to AI RMF 1.0, for voluntary use.
- Actions are grouped under the four AI RMF functions: Govern (GV), Map (MP), Measure (MS) and Manage (MG), with IDs such as GV-1.2-002.
- The twelve generative AI risks:
  1. CBRN information or capabilities.
  2. Confabulation: confident but false output.
  3. Dangerous, violent or hateful content.
  4. Data privacy: leaks, misuse or re-identification of personal data.
  5. Environmental impacts of heavy compute.
  6. Harmful bias or homogenization (gaps across groups or languages, overly uniform output).
  7. Human-AI configuration: over-reliance, automation bias, anthropomorphizing, emotional entanglement.
  8. Information integrity: mis- and disinformation at scale.
  9. Information security: lower barriers to attacks and a larger attack surface, including prompt injection and data poisoning.
  10. Intellectual property: reproducing protected or licensed content, exposing trade secrets.
  11. Obscene, degrading or abusive content.
  12. Value chain and component integration: unvetted third-party components and data.
- The working group's four primary considerations: governance, content provenance, pre-deployment testing, incident disclosure.
- Test and review actions useful at a gate:
  - GV-1.2-002: evaluate risky capabilities and safety measures before deployment and on an ongoing basis.
  - MS-2.3-003: share pre-deployment test results with whoever approves release.
  - MS-2.5-006: review safety and security guardrails regularly, especially in new situations.
  - MS-2.7-007: red-team resilience to prompt injection, data poisoning and model extraction.
  - MS-2.10-001: red-team privacy risks such as training-data output.
  - MP-5.1-005: adversarial role-play or chaos testing for unforeseen failures.
  - MS-1.3-003: people running structured feedback exercises should not be the model's developers.
  - MS-4.2-001: adversarial testing at a regular cadence.
  - MS-4.2-002: evaluate in real-world conditions, since issues may not show in controlled tests.
  - MS-4.2-005: document how feedback results feed go/no-go, monitoring and decommissioning decisions.
  - MG-4.3-002 and MG-4.3-003: record errors, near misses and harms; report incidents as law requires.
  - GV-4.3-002: set minimum criteria for incident reports.

## How to apply it here
- Use the twelve risks as a coverage check in the pre-mortem: for each LLM feature, mark which risks apply and what evidence covers them.

| Risk | Where it shows up here | Evidence to ask for |
|---|---|---|
| Confabulation | Chat answers, NLP Lab explanations | Eval cases with gold answers; visible "may be wrong" notice |
| Data privacy | Visitor text sent to a server model | Data-flow note from privacy-compliance; logs without content |
| Information security | Injection through notes or pasted text | Red-team transcripts (MS-2.7-007 style) |
| Human-AI configuration | Advice stated with confidence | AI disclosure and limits shown to visitors |
| Intellectual property | Model and dataset licences | Licence list with conditions |
| Value chain | web-llm, model hosts, Pyodide, spaCy models | Pinned versions and sources |
| Environmental impacts | Large model downloads | Consent screen with size; smallest tier first |

- Independence (MS-1.3-003) matches this agent's rule: never review work it helped build.
- A finding can cite the action ID, for example "MS-4.2-002 not met: tested only on one laptop".

## Limits
- Appendix A (detail on the four considerations and on red-teaming types) was not in the fetched text: UNVERIFIED; do not quote it.
- The profile is voluntary guidance, not a law or a pass/fail standard; it does not set numeric thresholds.
- Check the NIST publication record for a newer revision before citing; this note reflects the July 2024 text.
