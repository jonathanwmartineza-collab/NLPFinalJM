# JSON Schema validation keywords for model-filled specs

- Source: JSON Schema Validation: A Vocabulary for Structural Validation of JSON (draft 2020-12) — https://json-schema.org/draft/2020-12/json-schema-validation (accessed 2026-11-28)
- Publisher: JSON Schema project (json-schema.org; document published as an IETF Internet-Draft)
- Licence: proprietary (publisher's terms: IETF Trust Legal Provisions; code components BSD-3-Clause) · Copy in repo: link only

Why this matters for template-systems-engineer: the Studio sends `SPEC_JSON_SCHEMA`
(`web/src/ai/studio/spec.ts`) to WebLLM's grammar-constrained JSON mode, and zod then validates the same
shape. Knowing exactly what each keyword means keeps the two in step and the schema small.

## Key facts
- Version: 2020-12 is the current JSON Schema release; this document is the 2020-12 Validation
  Internet-Draft, revision 01, dated 16 June 2022.
- `type`: a string or an array of unique strings from `null`, `boolean`, `object`, `array`, `number`,
  `string`, `integer` (a number with zero fractional part).
- `enum`: valid if the value equals one element; `const`: same as a one-element enum.
- Numbers: `minimum` / `maximum` (inclusive), `exclusiveMinimum` / `exclusiveMaximum` (strict),
  `multipleOf` (> 0).
- Strings: `minLength` / `maxLength` count characters (as RFC 8259 defines them), not bytes; `pattern`
  is an ECMA-262 regex and is not anchored (it matches anywhere unless you add `^` and `$`).
- Arrays: `minItems` / `maxItems`, `uniqueItems` (default false), `minContains` / `maxContains` (only
  with `contains`).
- Objects: `required` (array of names), `minProperties` / `maxProperties`, `dependentRequired`.
- `additionalProperties`, `properties` and `items` are applicator keywords defined in JSON Schema Core,
  not in this document.
- `format` (for example `email`, `uri`, `date-time`, `uuid`) is an annotation by default; asserting it
  is optional and implementation-specific.
- Annotations: `title`, `description`, `default`, `examples`, `deprecated`, `readOnly`, `writeOnly`.
  `default` supplies a value but nothing says a validator fills it in.

## How to apply it here
- Keep choices as `enum` (`palette`, `kind` already are): a constrained decoder can only emit valid
  values, and zod's `.catch()` covers anything else.
- Add `maxLength` to strings and `maxItems` (8) to `sections` and `items` only if WebLLM's grammar
  supports them; zod already trims to 80/200/240/280 characters and slices to 8, so zod stays the
  source of truth either way. UNVERIFIED: which keywords WebLLM 0.2.89's grammar engine honours.
- Do not rely on `default` in the JSON Schema to fill missing fields; defaults live in zod (`str(max, def)`).
- Do not use `format` to enforce anything; it may be ignored.
- If you add a `pattern`, anchor it with `^...$`, or it matches substrings.
- A new enum value (a block kind or palette) must be added to `KINDS` / `PALETTES`, which feed both
  schemas, and to the renderer's switch, or the decoder can emit a kind nothing renders.
- Every field in `required` costs output tokens; keep the schema short so prompt plus answer fit a
  4,096-token context (the agent's self-check).
- Change both `SpecSchema` (zod) and `SPEC_JSON_SCHEMA` in the same commit, and run the repair tests
  (truncated, fenced, chatty, wrong-typed output).

## Limits
- This document covers validation keywords only; structure keywords (`properties`, `items`,
  `additionalProperties`, `$ref`) are in the Core document.
- It says nothing about grammar-constrained decoding; WebLLM's support must be checked in its own docs.
- Internet-Draft status: the project treats 2020-12 as current, but the document is not an RFC.
