# Netlify credits, and how to avoid spending them on deploys

- Source: How credits work — https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/how-credits-work/ (accessed 2026-11-28)
- Supporting page: Manage deploys — https://docs.netlify.com/deploy/manage-deploys/manage-deploys-overview/ (accessed 2026-11-28)
- Publisher: Netlify
- Licence: proprietary (publisher's terms) · Copy in repo: link only

Why this matters for devops-engineer: this site is on a credit-based plan, so every push to main that builds is
a 15-credit production deploy. Knowing what is metered, what is free and how to skip a deploy keeps the project
from pausing mid-term.

## Key facts
- Each successful production deploy costs 15 credits.
- Free (0 credits): Deploy Previews, branch deploys, failed deploys, and rolling back to an earlier production
  deploy. Netlify Forms submissions are also free on credit-based plans.
- Web requests to Deploy Previews and branch deploys still count on the web requests meter.
- Other meters: compute 10 credits per GB-hour; AI inference 180 credits per USD of model usage;
  bandwidth 20 credits per GB; web requests 2 credits per 10,000 requests.
- Monthly allotments: Free 300 credits (hard limit); Personal 1,000; Pro from 3,000. Personal and Pro can buy more.
- At zero credits all web projects on the team pause and visitors see a "Site not available" page.
- Credits are spent soonest-expiring first; credit packs and leftover auto-recharge credits do not expire and go last.
- Monthly credits reset each cycle; Pro plans with 5,000 or more monthly credits roll over unused credits one month.
- Auto recharge: Personal 500 credits for $5, Pro 1,500 credits for $10; off by default; Team Owners only.

### Skipping and controlling deploys (supporting page)
- Put `[skip ci]` or `[skip netlify]` anywhere in a commit message to stop the branch or production deploy for it.
- For a push of several commits, put the marker on the most recent commit; it covers the whole push.
- The same marker in a pull request title stops its Deploy Preview; remove it and push again to get one back.
- The next unmarked commit deploys and includes every skipped change.
- "Lock to stop auto publishing" keeps building new deploys but does not publish them to the main site.
- Rollback: Publish Deploy on any earlier successful deploy; it is instant and is not a new deploy. With Git
  auto publishing on, the next Git-triggered production deploy replaces the rolled-back version.
- Deploy list filters: Successful; Unsuccessful (Failed, Canceled or Skipped); Enqueued; review states.
- "Fix with agent" uses credits; "Why did it fail?" does not.

## How to apply it here
| Situation | Do this | Credit effect (per the pages) |
| --- | --- | --- |
| Only `docs/` or `reports/` changed | Push; `scripts/should-build.sh` exits 0 | Not stated (see Limits) |
| Several small site fixes | Batch into one push per milestone | One deploy = 15 credits |
| Want a review build | Open a pull request for a Deploy Preview | Free (requests still metered) |
| A deploy broke production | Publish the last good deploy | Rollback is free |
| Push you do not want deployed | Add `[skip netlify]` to the last commit | Not stated (see Limits) |
| Bad build fails | Fix and push again | Failed deploy is free |
- Free plan budget: 300 ÷ 15 = at most 20 production deploys a month with no other usage; this static site has
  no functions, so compute should stay near zero, but bandwidth and requests still count.
- The WebLLM model files load from outside hosts in the visitor's browser, not from Netlify, so they should not
  add Netlify bandwidth; confirm in the usage page rather than assume.
- Before a busy week, read the team's credit balance and write it in the release plan.
- Never enable auto recharge or buy credits yourself; that is a billing change for the owner.

## Limits
- Neither page says whether a build skipped by an `ignore` command or by `[skip ci]` / `[skip netlify]` uses
  credits. Only failed deploys and rollbacks are named as free. Treat it as not stated: UNVERIFIED.
- The page does not list credit pack sizes or prices; read the pricing page when needed.
- Prices and allotments change; re-check this page every 30 to 60 days.
