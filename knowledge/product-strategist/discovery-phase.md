# Running a discovery before you specify

- Source: How the discovery phase works — https://www.gov.uk/service-manual/agile-delivery/how-the-discovery-phase-works (accessed 2026-11-28)
- Publisher: Government Digital Service (GOV.UK Service Manual)
- Licence: OGL-UK-3.0 · Copy in repo: link only

Why this matters for product-strategist: a one-line idea arrives as a solution ("build a chat for X"). Discovery
turns it back into a problem, names who has it and what limits apply, and ends with a clear go or no-go before
anyone writes a PRD for alpha.

## Key facts
- Discovery is for learning about the problem before committing to build: users and their goals, constraints,
  the policy intent behind the request, and opportunities to improve things.
- The page is blunt: you should not start building the service in discovery.
- Question any preset solution and restate it as a problem; break down assumptions and agree what is not part
  of the problem. The problem definition shapes the options explored next.
- Consider putting a value on solving the problem, including what it costs today.
- What to find out:
  - Users: what they are trying to achieve, how they do it now, and the wider journey around it.
  - Constraints: legislation, contracts, legacy technology, existing processes. Separate hard constraints (you can
    barely change them) from soft ones (work to change them rather than around them).
  - Opportunities: reuse of data, and alternatives to building (publish content, run a campaign, partner, offer data).
  - Success: plan the data you will collect and the performance metrics you will use.
- Inclusion: learn users' accessibility needs early; the page notes 1 in 5 people in the UK report a permanent
  disability. Consider digital skills and internet access too.
- Length: no fixed period; around 4 to 8 weeks is typical. Set a clear goal at the start so you know when it ends.
- Team: involve several disciplines.
- Discovery ends when you decide whether to move to alpha. Ask: could a viable service make the job easier for
  users, and is solving it cost-effective?
- Stopping after discovery is not a failure when research shows that is the best option.
- Ready for alpha when you: understand the wider context and similar work; know how your work fits; have a list
  of ideas to test and have picked the first; know roughly who is needed; know how you will measure success.
- Share what you learn openly (blog posts, open show and tells) unless confidentiality prevents it.

## How to apply it here
- For a new idea, write the problem statement and job stories first (Method steps 1–2), then list hard and soft
  constraints before any MVP cut.
- Hard constraints for this project: fully static site on Netlify, no functions, no secrets; AI runs in the
  visitor's browser (WebLLM); NLTK runs in the browser through Pyodide; spaCy runs only at build time.
- Soft constraints: credit budget for production deploys, model download size, time to the exam deadline.
- Turn each request "add feature X" into "who needs X, to do what, and how do they do it today?" If you cannot
  name today's workaround, mark the problem as unproven.
- Put "alternatives to building" in every spec: a guide page or a better example in the NLP Lab may solve the
  need with no new code.
- Close each discovery with a go/no-go line and the five readiness checks above as a checklist.
- Keep metric definitions to growth-analyst; record only which outcomes matter and why.
- Add accessibility needs (keyboard, screen reader, low bandwidth for model downloads) to the user list, not later.

## Limits
- Written for UK public services: spend controls and cross-government duties do not apply to this project.
- The page lists no formal deliverables and no review meeting at the end of discovery.
- It does not cover pricing, positioning or market sizing.
- Last updated by the publisher on 21 June 2021; check for changes when re-reviewing.
