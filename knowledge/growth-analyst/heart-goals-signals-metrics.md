# HEART metrics and the Goals, Signals, Metrics process

- Source: Measuring the User Experience on a Large Scale: User-Centered Metrics for Web Applications (CHI 2010) — https://research.google/pubs/measuring-the-user-experience-on-a-large-scale-user-centered-metrics-for-web-applications/ (accessed 2026-11-28)
- Supporting page: full paper on the publisher's host — https://static.googleusercontent.com/media/research.google.com/en//pubs/archive/36299.pdf (accessed 2026-11-28)
- Publisher: Google Research
- Licence: unconfirmed · Copy in repo: link only

Why this matters for growth-analyst: HEART is the framework the agent names for UX quality. The paper gives the
exact meaning of each letter and a three-step way from a goal to a metric, which matters here because this site
has no analytics and every signal has to come from somewhere other than logs.

## Key facts
- HEART categories, as the paper defines them:
  - Happiness: attitudinal metrics such as satisfaction, perceived ease of use, likelihood to recommend.
    Example: a weekly in-product survey on a 7-point satisfaction scale.
  - Engagement: level of involvement, measured through proxies such as frequency or depth of use, per user.
    Example: share of active users who visited on five or more days in a week.
  - Adoption: new users starting to use the product (or a feature) in a period, such as the last seven days.
  - Retention: share of users from one period still present in a later one.
    Example: share of one week's active users still active three months later.
  - Task success: efficiency (time to finish), effectiveness (percent of tasks finished) and error rate.
- Not every category fits every product; pick the ones that match the goal.
- Goals, Signals, Metrics:
  1. Goals: what users need to do and what the change should achieve; do not worry yet about measurability.
  2. Signals: how success or failure shows in behaviour or attitude, and where the data comes from
     (logs, surveys, panels of judges). Pick signals that move only when the experience changes.
     Failure is often easier to see than success: abandonment, undo, visible frustration.
  3. Metrics: turn signals into numbers; use ratios, percentages or per-user averages, not raw counts.
- Metrics evaluate launched products and do not replace early research; triangulate with usability studies.
- The paper warns against PULSE-style metrics (page views, uptime, latency, seven-day actives, earnings) as the
  only measures: they are low-level and ambiguous. More page views can mean a confusing page.
- Totals mislead: a rise in engagement may only reflect more users.

## How to apply it here (no trackers, by design)
The site states it has no accounts, no analytics and no cookies, so log-based signals do not exist. Use:
| HEART | Goal on this site | Signal without trackers | Metric |
| --- | --- | --- | --- |
| Happiness | Visitors find answers useful | Short opt-in survey link, or moderated sessions | Mean rating on a stated scale, n reported |
| Engagement | People use the NLP Lab, not only read | Moderated test: tasks attempted per session | Tasks per participant |
| Adoption | New visitors can start a chat | Usability test: first message sent unaided | % of participants who succeed |
| Retention | Not measurable without IDs | Do not invent it; drop it or ask in a survey | Mark as not measured |
| Task success | NLP tools return correct output | Automated checks in the test suite and nlp-eval | % of checks passing, time to result |
- Netlify's own usage page counts requests and bandwidth in aggregate; use it only as a rough reach signal and say so.
- Never add a pixel, SDK or stored identifier to get a number; anything like that goes to privacy-compliance first.
- Every metric needs numerator, denominator, window and owner, and a guardrail (for example model load failures).
- Report small samples as counts ("4 of 6 participants"), not percentages that look precise.

## Limits
- The licence of the paper is not stated on the publication page; treat it as the publisher's terms.
- The paper is from 2010 and assumes large log volumes; it gives no sample-size or significance rules.
- It does not cover cookieless or on-device measurement; the table above is this repo's adaptation.
