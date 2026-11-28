# C4 model: architecture diagrams that stay readable

- Source: C4 model, Diagrams — https://c4model.com/diagrams (accessed 2026-11-28); supporting pages from the same publisher: Container diagram — https://c4model.com/diagrams/container and Notation — https://c4model.com/diagrams/notation (both accessed 2026-11-28)
- Publisher: c4model.com (the C4 model's official site)
- Licence: CC-BY-4.0 (website and example diagrams, stated on the site) · Copy in repo: link only

Why this matters for software-architect: the agent must "design the architecture and data flow" so the
team can build without guessing. C4 gives a small, fixed set of zoom levels and a notation checklist, so
every sketch the agent produces (for this repo or a user's app) reads the same way.

## Key facts
- Four core levels, each a zoom into the one above:
  1. System context: how the system in scope fits the world around it (people and other systems).
  2. Container: the applications and data stores inside the system.
  3. Component: the components inside one container.
  4. Code: how one component is implemented (for example a UML class diagram).
- You do not need all four. Context and container diagrams are enough for most teams; draw lower levels
  only when they add value.
- Supplementary diagrams: system landscape, dynamic, deployment.
- A container is "an application or a data store": server-side web app, client-side single-page app,
  desktop app, mobile app, database schema, file system folder, a cloud storage bucket.
- Container diagram: scope is one software system; primary elements are its containers; supporting
  elements are the people and systems connected to them. Audience: architects, developers, operations
  and support. Recommended for all teams.
- A container diagram says little about deployment (clustering, load balancers, replication, failover);
  those go in deployment diagrams, one per environment.
- Notation checklist:
  - Every diagram has a title stating its type and scope.
  - A key/legend explains shapes, colours, borders, line types and arrowheads.
  - Every element states its type (Person, Software System, Container, Component), a short description
    and, for containers and components, its technology.
  - Every line is one unidirectional relationship with a specific label (not just "Uses"); container-to-
    container lines also name the protocol or technology.
  - Explain acronyms; C4 prescribes no colours, but keep them consistent and safe for colour blindness
    and black-and-white printing.

## How to apply it here
- System context for this repo: Visitor (Person) → NLPFinalJM site (Software System); external systems:
  Netlify (hosting and build), the model host for WebLLM weights, jsDelivr (Pyodide and packages).
- Container diagram for this repo:
  | Container | Technology | Talks to |
  |---|---|---|
  | Single-page app (`web/`) | React + Vite + TypeScript | loads static JSON over HTTPS |
  | WebLLM worker | Web Worker + WebGPU, `@mlc-ai/web-llm` | downloads model files from the model host |
  | NLTK live box worker | Web Worker + Pyodide | loads Pyodide and an `nltk_data` zip from jsDelivr |
  | Static data (`team.json`, `nlp/nltk.json`, `nlp/spacy.json`) | files built by Node and Python at build time | read by the app |
  | Build pipeline | Netlify build: Node 22, Python 3.13, NLTK, spaCy | writes the static data |
- No server container exists; say so in the diagram's title or key, because it is the main design choice.
- Draw a deployment diagram only if a user's app has more than one environment or real infrastructure.
- Put diagrams next to the ADR that motivates them (`docs/adr/`), as Markdown text or a diagram file.
- Before handing off, run the notation checklist above; a diagram without a legend or technologies fails.

## Limits
- C4 is a notation and abstraction set, not a method for choosing a stack or a diagramming tool.
- The pages fetched do not define "person" or give audiences for the component and code levels.
- The container list for this repo comes from CLAUDE.md and package.json, not from the C4 site.
