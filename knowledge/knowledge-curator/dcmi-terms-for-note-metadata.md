# DCMI Metadata Terms for knowledge-note headers

- Source: DCMI Metadata Terms — https://www.dublincore.org/specifications/dublin-core/dcmi-terms/ (accessed 2026-11-28)
- Publisher: Dublin Core Metadata Initiative (DCMI)
- Licence: CC-BY-4.0 · Copy in repo: link only

Why this matters for knowledge-curator: every note in knowledge/ opens with the same metadata (source, publisher,
licence, dates). Mapping those fields to a published vocabulary keeps them consistent across 36 folders and lets
a script read and check them.

## Key facts
- Version: the 2020-01-20 issue, a DCMI Recommendation, maintained by the DCMI Usage Board.
- Namespace for the terms: `http://purl.org/dc/terms/` (others: `/elements/1.1/`, `/dcmitype/`, `/dcam/`).
- Outside RDF (Markdown front matter, JSON, databases) you may ignore the formal semantics, treat domain and range
  as suggestions, and follow the definitions, usage notes and examples.
- Term definitions that matter here:
  | Term | Meaning (paraphrased from the spec) |
  | --- | --- |
  | `title` | a name given to the resource |
  | `creator` | an entity responsible for making it |
  | `publisher` | an entity responsible for making it available |
  | `source` | a related resource it is derived from |
  | `license` | a legal document giving permission to do something with it |
  | `rights` | information about rights held in and over it |
  | `rightsHolder` | a person or organisation owning or managing those rights |
  | `date` | a point or period tied to an event in its lifecycle |
  | `issued` / `modified` | date of formal issue / date it was changed |
  | `valid` | date, often a range, of validity |
  | `identifier` | an unambiguous reference within a context |
  | `references` | a resource it cites or points to |
  | `isVersionOf` / `hasVersion` | version, edition or adaptation links |
  | `replaces` / `isReplacedBy` | supersession links |
  | `format`, `language`, `subject`, `description`, `abstract` | file type, language, topic, account, summary |
- DCMI documents are under CC BY 4.0 unless a document says otherwise.

## How to apply it here
| Note header line in this repo | DCMI term | Rule |
| --- | --- | --- |
| `# <Title>` | `title` | Plain words, names the topic |
| `Source: <page title> — <URL> (accessed …)` | `source` | The exact URL read, not a search result |
| `Publisher:` | `publisher` | An organisation, never a person |
| `Licence:` | `license` | SPDX id, "proprietary (publisher's terms)" or "unconfirmed" |
| accessed date | `date` | ISO 8601, YYYY-MM-DD |
| README "Last reviewed" | `modified` | Updated on every edit of the folder |
| "Review by" (agent template) | `valid` | End of the validity window by volatility |
| a replaced note | `isReplacedBy` | Say which note replaces it; never delete silently |
- Use `creator` only for an organisation; notes in this repo never name individual people.
- `rights` is not the same as `license`: a footer notice is rights information, not a licence.
- When a page states no licence, record that fact; do not fill `license` from guesswork.
- Keep the header block identical in shape across folders so a script can parse it.

## Limits
- DCMI defines terms, not a Markdown layout; the header shape above is this repo's convention.
- There is no DCMI term named "accessed"; `date` is the closest general term.
- The spec page itself did not show a licence; it was confirmed on DCMI's own licence page for its documents.
