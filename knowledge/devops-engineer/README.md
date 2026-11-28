# Knowledge index: devops-engineer

Read this index first, then the notes that fit the task. Name the notes you used in your answer.

## Quick reference
- Read the deploy log first; check rate-limit rules were accepted.
- Env var changes apply on the next deploy.
- 15 credits per production deploy on credit plans: batch pushes.
- NLP final: set PYTHON_VERSION 3.13 and the Python-then-Vite build command in netlify.toml, add jsDelivr to the CSP, add nlp and requirements.txt to the ignore-build paths.

## Notes
- [netlify.toml and the ignore-build command](netlify-toml-and-ignore-builds.md): editing netlify.toml or working out why a push did or did not build
- [Netlify credits, and how to avoid spending them on deploys](netlify-credits-and-skipping-deploys.md): planning production deploys against the credit budget, skipping or rolling back
- [Netlify platform for our apps](../_shared/netlify-platform.md)
- [Testing and evidence](../_shared/testing-and-evidence.md)
- [NLP final architecture](../_shared/nlp-final-architecture.md)

Maintained by the knowledge-curator (source-notes skill). Last reviewed 2026-11-28.
