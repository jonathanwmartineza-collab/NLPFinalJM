# 09 — Reference teardown: experts21.netlify.app

What this is: a description of the reference app's layout, parts and behaviour, so our studio site can
use the same *pattern* (sidebar of experts + whole-team chat) in **our own brand**. Their name, words,
people, colours and look stay theirs.

## Sources and method

| # | Page | URL | How it was read |
|---|------|-----|-----------------|
| R1 | Live app | https://experts21.netlify.app/ | Opened in a real browser on 2026-11-21 at 1280×900 and 500×900. Plain fetch returned only the `<head>` (title "Experts21 Team"), as expected for a JS-rendered page. |
| R2 | Build guide | https://experts21.netlify.app/guide/ | Fetched and opened in the browser on 2026-11-21. |
| R3 | BRIEF description | /home/claude/work/BRIEF.md | Captured from the live page 2026-11-21; matches what R1 showed. |

What was **not** done: no question was sent (each answer costs the owner money and the guide asks
visitors to keep it to one or two). So the answer view, streaming, the "watch each expert work" view and
error states are known only from the guide's screenshot captions (R2) — marked *(from R2)*.

## 1. Page layout (desktop)

```
┌──────────────── sidebar ≈ 300 px ───────────┬───────────────── main panel ─────────────────────┐
│ App name (bold)                              │ [avatar] Title + model badge                     │
│ one-line team description                    │ Short description / personality / working style │
│ Resources · How it was built · Source code   │ Voice: <name> · traits · accent  [Change voice]  │
│ ┌─ pinned card: Ask the whole team [opus] ─┐ │ (o) Read answers aloud                           │
│ └──────────────────────────────────────────┘ ├──────────────────────────────────────────────────┤
│ DEPARTMENT LABEL (small caps)                │ Intro line + 1–2 example questions (grey text)    │
│ (A) Name [model]                             │                                                  │
│     Job title                                │           (conversation appears here)            │
│     personality, cut with "…"                │                                                  │
│ … 11 departments, scrolls on its own …       ├──────────────────────────────────────────────────┤
│                                              │ (mic)  [ textarea: Ask …  Enter / Shift+Enter ] [Send]│
│                                              │ disclaimer · Resources · How it was built · GitHub│
└──────────────────────────────────────────────┴──────────────────────────────────────────────────┘
```

- Two columns: a warm, light-neutral sidebar that scrolls separately; a white main panel (R1).
- Sidebar: app name, a one-line team description, three text links, then a **pinned "Ask the whole
  team" card** (orchestrator, Opus badge, one-line explainer), then agents grouped under small
  uppercase department labels (R1, R3).
- 11 department groups, 27 expert rows plus the orchestrator card on the day of the visit (R1).
  The guide's own count is 26 agents (R2) — the roster grew after the guide was written.
- Typeface: system UI stack; rounded cards and buttons (≈ 10 px radius) (R3, R1 screenshots).

## 2. Components

| Component | What it shows / does | Notes |
|-----------|----------------------|-------|
| Agent row (button) | Coloured circle with initial, first name, model badge, job title, one-line personality cut with an ellipsis | Whole row is one button; full text is in its accessible name (R1) |
| Model badge | Small outlined pill: opus = purple, sonnet = blue, haiku = green | Avatar colour is per agent, **not** per model (R1) |
| Selected row | White card with soft border on the beige sidebar | The pinned whole-team card keeps a tinted background even when not selected, so two cards look "active" (R1) |
| Header (agent) | Avatar, "Name, Title" + badge, Personality, Working style, knowledge-folder status ("no documents yet" if empty) | Gives trust: you see who you're talking to and what they know (R1) |
| Header (team) | Orchestrator explainer: picks experts, they answer in parallel, a reviewer stress-tests big decisions, then one combined answer | (R1) |
| Voice line + picker | Current voice with traits and accent; "Change voice" opens a select (~40 named voices) + Preview button; "Done" closes | Voice is per agent (R1) |
| Read-aloud switch | Toggle, off by default | (R1) |
| Empty state | "Ask … anything in their area" + the agent's routing description; for the team, two long example questions | Examples are plain text, not clickable (R1) |
| Composer | Round mic button ("Ask by voice"), resizable textarea, Send button disabled until text is typed | Placeholder explains Enter vs Shift+Enter (R1) |
| Status region | Empty `status` element under the composer | Likely announces progress/errors to screen readers (R1) |
| Footer | "General information, not professional advice", research date, links | (R1) |

## 3. Interaction model

1. Land on "Ask the whole team" by default (R1).
2. Click any agent → the main panel header, empty-state text, placeholder and voice switch to that
   agent; the conversation area is per agent (R1).
3. Type → Send enables; Enter sends, Shift+Enter adds a line (R1).
4. One-agent answer: the agent replies in character and names the knowledge documents it used *(from R2)*.
5. Whole-team answer: the orchestrator picks experts, you can **watch each expert work**, then it
   combines them into one answer with risks, next steps, owners and open questions *(from R2)*.
6. Optional: mic input, read-aloud output with the chosen voice (R1).

## 4. Narrow screens (500 px)

- Sidebar is hidden; a "☰ Experts" button sits top-right and opens it as a left drawer over the chat
  (R1). No dimmed backdrop was visible.
- The header did **not** reflow fully: text and the voice select ran past the right edge and a
  horizontal scrollbar appeared (R1). The composer and footer did fit.

## 5. Architecture as described (R2, R3)

- React app in `web/`; agents read from `.claude/agents/` and knowledge folders **at build time**.
- Claude is called from a Netlify Function so the key stays server-side; key in `ANTHROPIC_API_KEY`
  (marked secret); optional `APP_PASSWORD` to limit who can spend credit.
- `netlify.toml` at repo root sets the build (`npm run build`, `dist`); push to main = auto redeploy.
- Streaming and voice internals are not explained in the guide (R2) — **UNVERIFIED** how they work.

## 6. The guide page (/guide/)

- Top bar: back link, centred page label, source link. Hero: big headline with a highlighted phrase,
  intro, chips ("No coding needed", "About 1 hour", demo link, example size), two outline buttons, and
  a six-box flow diagram (repo → research → roster → agents → knowledge → web app) (R2).
- A horizontally scrolling numbered step bar, then 12 numbered steps. Each step: heading, one-line
  "why", numbered actions, copyable prompt boxes ("Paste this into Claude Code" + Copy), screenshots
  that enlarge on click with captions, and "Good to know" / "Check it worked" callouts (R2).
- Steps 9–10 are marked optional; step 11 is split into build / deploy / try; step 12 suggests five
  starter app ideas with the agents each needs (R2).
- Setup prerequisites box: accounts needed, connector, and which model/effort to pick (R2).

## Keep (the pattern, rebuilt in our own words and brand)

- [ ] Two-column layout: scrolling sidebar of experts grouped by department + main chat panel.
- [ ] A pinned "whole team" entry at the top that routes through the orchestrator.
- [ ] Agent row = avatar initial + name + model badge + title + one-line personality.
- [ ] Model badge colour coding by model tier (choose our own three colours).
- [ ] Header that tells you who you're talking to, how they work, and what knowledge they have.
- [ ] Empty state with example prompts for each agent (from our `display.examplePrompts`).
- [ ] Composer: textarea, Enter to send, Shift+Enter new line, Send disabled until text.
- [ ] Visible "watch each expert work" progress for team answers, then one combined answer.
- [ ] Answers name the knowledge notes used.
- [ ] Disclaimer + research date in the footer; a "How it was built" guide with copyable prompts,
      screenshots and "check it worked" callouts.
- [ ] Agents and knowledge compiled at build time; key only in a function; optional password.

## Improve

- [ ] **Clickable example prompts** (chips that fill the composer) instead of grey text.
- [ ] **One clear selected state**: only the active row is highlighted; the pinned card is styled as
      pinned (icon/border), not as selected.
- [ ] **Mobile**: no horizontal scroll; header collapses to name + badge with a "details" toggle; drawer
      gets a dimmed backdrop, focus trap, Esc to close, and closes after choosing an agent.
- [ ] **Search/filter** box at the top of a 29-agent sidebar; collapsible departments.
- [ ] **Streaming text** with a Stop button, and per-expert status chips (waiting / thinking / done /
      failed) during team answers.
- [ ] **Clear error and limit messages**: wrong password, rate-limited (429), busy (529), refusal,
      answer cut short (`max_tokens`) with a Continue button.
- [ ] **Cost awareness**: show which model will answer and a rough cost hint; Opus only where needed.
- [ ] **Keep conversations** per agent across reloads (local storage), with "New chat" and "Copy answer".
- [ ] **Accessibility**: visible focus rings, AA contrast for grey helper text and the disabled Send
      button, `aria-live` for streamed text, `aria-current` on the selected agent.
- [ ] Voice features only if cheap and reliable; otherwise ship text first and add voice later.
- [ ] A "Build" mode for one-shot HTML apps that runs as a background job with progress (see docs/07).

## Do not copy

- [ ] Their **name** ("Experts21"), page titles, team description, guide headline and any wording.
- [ ] Their **people**: names, job titles, personalities, working styles, voices, example questions,
      the coffee-shop domain and department names. Our roster comes only from `roster.seed.json`.
- [ ] Their **colours and look**: the beige sidebar tone, their badge/avatar palette, the yellow
      highlighter style of the guide. We use `studio.config.json` (accent `#C2410C`) and our own tokens.
- [ ] Their **screenshots, diagrams and icons**, and the disclaimer sentence word for word.
- [ ] Their code: we write our own (their repo is linked publicly, but we do not lift files from it).

## What this means for our build

| Their element | Our version |
|---------------|-------------|
| Orchestrator card | Pinned card for our orchestrator (Nova in the roster seed), our wording |
| 11 departments | Our departments from `roster.seed.json` (29 agents) |
| Per-agent voice picker | Optional, phase 2 |
| Plain example text | Clickable chips from each agent's `examplePrompts` |
| Single function call | Streaming `/api/chat` per agent; browser drives route → experts → synthesis (docs/07, docs/08) |
