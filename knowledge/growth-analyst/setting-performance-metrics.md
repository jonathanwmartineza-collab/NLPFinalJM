# Setting performance metrics for a service

- Source: How to set performance metrics for your service — https://www.gov.uk/service-manual/measuring-success/how-to-set-performance-metrics-for-your-service (accessed 2026-11-28)
- Publisher: Government Digital Service (GOV.UK Service Manual)
- Licence: OGL-UK-3.0 · Copy in repo: link only

Why this matters for growth-analyst: it gives a short, tested routine from a service's purpose to 3 or 4 headline
KPIs, with baselines, segments and targets. It also says plainly not to rely on web analytics alone, which fits a
site that has none.

## Key facts
- Start from purpose: user needs plus any intended outcomes. Summarise why the service exists in one line.
- Derive a few "benefits" from user needs; each is a short outcome that serves the purpose.
- Write hypotheses as: doing or changing [something] will lead to [benefit] because of [assumption].
- Pick 3 or 4 KPIs that answer "is this service working?"; use further team metrics for detail.
- Every metric needs a clear meaning before you decide how to collect it.
- Bring a performance analyst in from discovery; plan measurement during the build, not after.
- Data sources listed: web analytics, user feedback such as satisfaction surveys, performance and uptime monitoring,
  call centre data, and financial data such as hosting costs. Do not rely on web analytics alone.
- The analyst checks accuracy, tests for errors, checks statistical significance and analyses in time to act.
- Context:
  - Segment by device or new versus repeat users; averages hide differences.
  - Set a baseline across all channels and judge change against it.
  - Measure continuously, not in snapshots, to separate real effects from seasonal swings.
  - Set a target per KPI, for example a 10% cut in application time within six months.
  - Benchmark against similar services.
- Share findings as dashboards (decisions), alerts (changes) or reports (scheduled snapshots); automate the routine ones.
- Revise metrics as the service changes.
- UK government services must also collect and publish four mandatory KPIs (named on a linked page).

## How to apply it here
1. Purpose line, for example: "Help a learner try NLP techniques and ask expert agents, privately, in the browser."
2. Benefits: correct NLP output; answers grounded in the agent's notes; works on a mid-range laptop; no data leaves.
3. Headline KPIs (pick 3 or 4), each from a source this site actually has:
   | KPI | Source here | Baseline from |
   | --- | --- | --- |
   | NLP Lab task success | Test suite and nlp-eval acceptance checks | Latest gate run in reports/ |
   | Time to first chat answer | Timed runs in a usability session or e2e test | First measured run |
   | Satisfaction | Short voluntary survey or session debrief | First round of sessions |
   | Hosting cost | Netlify credit usage per month | Current month |
4. Segment test runs by device class (desktop, phone) and model tier; never report one blended average.
5. Write each target with a date; review after each release, not only once.
6. Hypotheses go in the plan before a change ships, so the result can be judged honestly.

## Limits
- No guidance on privacy, cookies or consent in measurement; route those questions to privacy-compliance.
- No statistical thresholds or experiment design; see the experiment-design skill.
- Written for UK public services; the KPI table above is this repo's adaptation, not the page's.
- The four mandatory KPIs and data.gov.uk publishing apply to UK public services only.
- The visible text shows only the first-published date (5 December 2017); the page metadata gives a last update of 9 September 2026.
