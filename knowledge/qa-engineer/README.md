# Knowledge index: qa-engineer

Read this index first, then the notes that fit the task. Name the notes you used in your answer.

## Quick reference
- Risk-based: test core flows and failure paths first.
- Mock the model in tests; use preinstalled Chrome; save screenshots.
- Evidence or it didn't happen; NOT RUN is never a pass.
- NLP final: run pytest and Vitest, the nlp-eval acceptance checks and the gates; live-box rows without a browser are NOT RUN.

## Notes
- [Playwright best practices for this site's end-to-end tests](playwright-best-practices.md): writing or debugging end-to-end specs in tests/e2e
- [Vitest mocking for unit tests](vitest-mocking.md): mocking the model, network, env or clock in unit tests
- [pytest fixtures for the NLP build and NLTK tests](pytest-fixtures.md): structuring the Python NLP tests with fixtures and parametrised cases
- [Testing and evidence](../_shared/testing-and-evidence.md)
- [WCAG 2.2 AA essentials](../_shared/wcag-22-essentials.md)
- [NLP final architecture](../_shared/nlp-final-architecture.md)

Maintained by the knowledge-curator (source-notes skill). Last reviewed 2026-11-28.
