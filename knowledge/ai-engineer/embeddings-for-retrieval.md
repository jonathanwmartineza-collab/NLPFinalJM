# Embeddings for retrieval (RAG) with Claude

- Source: Embeddings — https://platform.claude.com/docs/en/build-with-claude/embeddings (accessed 2026-11-28)
- Publisher: Anthropic
- Licence: proprietary (publisher's terms) · Copy in repo: link only

Why this matters for ai-engineer: Claude has no embedding endpoint of its own, so any "answer from my docs" feature in this repo needs a second provider, a second key on the server and a vector search step that Claude's own docs describe.

## Key facts
- Anthropic does not offer its own embedding model. Its docs recommend Voyage AI (now part of MongoDB) and say to compare other vendors too.
- Choosing a provider: weigh dataset size and domain (more and more domain-specific data gives better in-domain vectors), lookup speed and end-to-end latency, and whether the model can be tuned on private data.
- Current text models, all with a 32,000-token context:
  - `voyage-4-large`: best general and multilingual retrieval quality.
  - `voyage-4`: balance of quality and cost.
  - `voyage-4-lite`: tuned for latency and cost.
  - `voyage-code-4`: code retrieval and agentic coding.
  - `voyage-4-nano`: open weights (Apache-2.0), self-hosted only, not on the hosted API; default 2048 dimensions.
- Dimensions for the hosted v4 models: 1024 by default, or 256, 512, 2048.
- Previous generation still listed: `voyage-3-large`, `voyage-3.5`, `voyage-3.5-lite`, `voyage-code-3` (32k), `voyage-finance-2` (32k, 1024 dims) and `voyage-law-2` (16k, 1024 dims).
- Contextualized chunk embeddings: `voyage-context-4` via `contextualized_embed()`; 120,000 tokens with `enable_auto_chunking: true`, otherwise 32,000 across all inputs. Each chunk vector carries whole-document context.
- Multimodal: `voyage-multimodal-3.5` via `multimodal_embed()` (text, images, video).
- Rerankers via `rerank()`: `rerank-3` (most accurate, recommended default) and `rerank-3-lite` (cheaper, faster), both 32,000 tokens.
- Keys come from MongoDB Atlas ("AI Model APIs" → "Create model API key") and live in `VOYAGE_API_KEY`. The Python package is `voyageai`; Atlas keys need version 0.3.7 or later.
- HTTP endpoint: `POST https://ai.mongodb.com/v1/embeddings` with `input`, `model`, `input_type`; reply has `data[].embedding`, `data[].index`, `model`, `usage.total_tokens`. The official TypeScript client needs its `environment` option set to `https://ai.mongodb.com/v1`.
- Embed stored passages with `input_type: "document"` and the user question with `input_type: "query"`.
- The page's quickstart, in three steps:
  1. `vo.embed(documents, model="voyage-4", input_type="document")` for the corpus.
  2. `vo.embed([query], model="voyage-4", input_type="query")` for the question.
  3. Dot product of the query vector against every document vector; take the highest.
- Voyage vectors are normalized to length 1, so dot product and cosine similarity rank results identically.
- Pricing is not on the page; it points to MongoDB's model pricing.

## How to apply it here
- First ask whether RAG is needed at all: if the corpus fits comfortably in a cached system prompt, skip embeddings (see the prompt caching note).
- If it is needed, embed at build time, not in the browser: a build step embeds the notes or help pages with `input_type: "document"` and writes vectors to the data store.
- At question time, a Netlify Function embeds the question with `input_type: "query"`, runs nearest-neighbour search with dot product, then optionally calls `rerank-3` on the top hits.
- Keep `VOYAGE_API_KEY` server-side only, next to the Anthropic key; never ship it to the static site.
- Use the same model and the same dimension for documents and queries; re-embed everything when either changes.
- Pass retrieved chunks to Claude inside tagged document blocks with their source, and require "I couldn't find that" when similarity is low.
- Treat retrieved text as data, never as instructions; it can carry injected text.

| Decision | Default here | Switch when |
|---|---|---|
| Model | `voyage-4` | Quality short of evals → `voyage-4-large`; cost or latency → `voyage-4-lite` |
| Dimensions | 1024 | Storage is tight → 512 or 256, after re-running evals |
| Long documents | Chunk by heading | Chunks lose meaning out of context → `voyage-context-4` |
| Ranking | Vector top-k | Wrong passage ranked first → add `rerank-3` |

## Limits
- The page's FAQ answers (similarity choice, truncating Matryoshka vectors, quantized output types, characters versus tokens) were not in the fetched text: UNVERIFIED, read Voyage AI's own docs before using those options.
- No batch size limits, rate limits or prices are given on this page.
- Model names and endpoints moved once already (to MongoDB Atlas); confirm them before coding against them.
