# Diátaxis: four kinds of documentation and the compass

- Source: Start here - Diátaxis in five minutes — https://diataxis.fr/start-here/ (accessed 2026-11-28)
- Supporting page: Diátaxis home — https://diataxis.fr/ (accessed 2026-11-28)
- Publisher: Diátaxis (diataxis.fr)
- Licence: unconfirmed · Copy in repo: link only

Why this matters for technical-writer: the agent keeps doc types separate (its Diátaxis rule). This page gives the
exact definitions and a two-question test, so a README, a guide page and a knowledge note each get the right shape.

## Key facts
- Diátaxis is a systematic approach to technical documentation: what to write, how to write it, how to organise it.
- Four needs, four forms:
  - Tutorial: a lesson that takes a learner through a practical experience, to build skill and confidence.
  - How-to guide: practical directions toward a real-world goal, for someone already competent and at work.
  - Reference: accurate, complete, reliable technical description; neutral, not task-led; its structure mirrors
    the structure of the thing it describes.
  - Explanation: context and background that answers "why?"; it can weigh several angles.
- The compass, two questions:
  - Action or cognition? Tutorials and how-to guides inform action; reference and explanation inform knowing.
  - Acquisition or application of skill? Tutorials and explanation serve study; how-to guides and reference serve work.
- Blurring the four kinds causes many documentation problems; a common one is a tutorial overloaded with
  explanation. Keep explanation minimal in the flow and link to it.
- Start small and work iteratively: look at what is there, ask if it could be better, make one small
  improvement, repeat.
- It imposes no implementation constraints; it is a way of thinking about quality.

## How to apply it here
| Page or file in this repo | Kind | Test |
| --- | --- | --- |
| README quick start | Tutorial (first run) | Can a newcomer follow it start to finish and see a result? |
| README deploy and troubleshooting | How-to | Does each section reach one goal for someone who knows the basics? |
| Configuration table, scripts list | Reference | Does it mirror the real files and stay neutral? |
| Guide page "How it was built", ADRs | Explanation | Does it answer why, not how? |
| knowledge/<slug> notes | Reference plus a short how-to | Key facts are reference; "How to apply it here" is how-to |
| NLP Lab help text | How-to | One goal per panel (tokenise, tag, compare) |
- When a page mixes kinds, split it rather than rewriting all of it: move the "why" paragraphs into an
  explanation page and link to it.
- Use the compass as a review question: "Is this paragraph for doing or for knowing; for learning or for working?"
- Reference pages are complete and neutral: no advice and no story; put opinions in explanation.
- How-to titles name the goal ("Run the Python build locally"), so a reader can scan for theirs.
- Tutorials promise one visible result at the end and avoid branches and options.
- Inside a tutorial, keep explanation to a line and link to the explanation page for later, as the page advises.
- Reference mirrors the thing described: list scripts in `package.json` order and settings in `netlify.toml` order.
- Apply one small fix per review round, as the page advises, instead of a full rewrite.

## Limits
- The start page defines the kinds but not the writing rules for each; those are on each type's own page.
- No licence statement was found on the pages read (only a notice in the footer): unconfirmed.
- It says nothing about Markdown syntax or style; see the CommonMark and Google style notes.
