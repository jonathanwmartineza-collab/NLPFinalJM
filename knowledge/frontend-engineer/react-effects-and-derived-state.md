# React: when you do and don't need an Effect

- Source: You Might Not Need an Effect — https://react.dev/learn/you-might-not-need-an-effect (accessed 2026-11-28)
- Publisher: React (react.dev, LF Projects)
- Licence: CC-BY-4.0 · Copy in repo: link only

Why this matters for frontend-engineer: the site's pages (Team, Studio, Library, the /nlp Lab) hold a lot
of client state, a WebLLM worker and a Pyodide worker. Wrong Effects cause extra renders, stale UI and
double work in Strict Mode; this page is React's own rulebook for removing them.

## Key facts
- Effects are an escape hatch for syncing with an external system (a non-React widget, the network, the
  browser DOM). No external system involved means you probably need no Effect.
- Rule: if a value can be calculated from props or state, calculate it during render; do not store it in
  state and update it from an Effect (no cascading second render).
- Expensive pure calculations: cache with `useMemo(fn, deps)`, not an Effect. React Compiler can memoize
  many cases automatically.
- Is it expensive? Wrap it in `console.time` / `console.timeEnd`; the page suggests memoizing when it adds
  up to roughly 1 ms or more. `useMemo` never speeds up the first render.
- Measure with CPU throttling and in a production build; dev mode and Strict Mode double rendering skew
  timings.
- Reset all state of a subtree when an id changes: pass `key={id}`, not an Effect on `[id]`.
- Reset part of the state on a prop change: prefer storing an id and deriving
  (`items.find(i => i.id === selectedId) ?? null`); setting state during render with a prev-value guard
  is the rare fallback and may only touch the same component's state.
- Code that runs because the user did something (click, submit, send) belongs in the event handler.
  Code that runs because the component was shown (an analytics ping on display) belongs in an Effect.
- Shared handler logic: extract a plain function called from each handler, not an Effect watching state.
- Chains of Effects that set state to trigger each other are slow and fragile; compute the next state in
  the handler. State inside a handler is a snapshot: after `setX(x + 1)`, `x` is still the old value.
- App-wide one-time setup: a module-level `didInit` flag or module top-level code, not `useEffect([])`
  (it runs twice in development).
- Telling a parent about a change: call `setState` and `onChange` in the same handler; React batches them
  into one render. Or lift state up and make the child controlled.
- Data flows down: let the parent fetch and pass props; a child calling `onFetched(data)` from an Effect
  is hard to trace.
- Subscribing to an external store (for example `navigator.onLine`): use `useSyncExternalStore(subscribe,
  getSnapshot, getServerSnapshot)`, usually inside a custom Hook.
- Fetching in an Effect is fine, but add cleanup to stop races: a local `ignore` flag set to `true` in the
  cleanup function so out-of-order responses are dropped.

## How to apply it here
| Situation in this repo | Do this |
|---|---|
| Filtered expert list, search results, counts from `team.json` | compute in render; `useMemo` only if timed ≥ ~1 ms |
| Switching the expert on `/expert/*` resets the chat panel | `key={slug}` on the panel |
| "Send" in chat, "Run" in the NLP live box | start the work in the click handler, not an Effect |
| Loading `nltk.json` / `spacy.json` for the /nlp page | Effect or small `useData(url)` Hook with the `ignore` flag, plus loading, empty and error states |
| Pyodide or WebLLM worker messages | subscribe in one Effect with cleanup, or wrap as an external store with `useSyncExternalStore` |
| Online/offline badge | `useSyncExternalStore` on `navigator.onLine` |
| One-time boot (version check, settings read) | module-level flag; survives Strict Mode double mount |
- Review checklist for a PR: search the diff for `useEffect(` and ask, for each one, which external
  system it syncs with. No answer means move it to render or a handler.
- Never start Pyodide from an Effect on mount: the project rule is "nothing loads before the visitor's
  click", which is exactly the "caused by an interaction" case above.
- Profile before memoizing (the agent's own rule matches the page's measuring advice).

## Limits
- The page is about client components; it does not cover React Server Components or framework data
  loaders, which this static Vite site does not use.
- The 1 ms figure is the page's rough guide, not a hard threshold.
- Licence: react.dev content is CC-BY-4.0 per the react.dev project's own README (LICENSE-DOCS); the page
  footer itself names no licence.
- React version: the page is the current react.dev text; the repo pins React ^19.3.1 (package.json).
