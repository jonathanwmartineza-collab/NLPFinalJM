# Vitest mocking for unit tests

- Source: Mocking (Vitest guide, v5.1.2) — https://vitest.dev/guide/mocking (accessed 2026-11-28)
- Publisher: Vitest project (VoidZero)
- Licence: MIT · Copy in repo: link only

Why this matters for qa-engineer: tests/unit covers the router, safety filters, storage clearing, model choice and
the NLP client. Each test must replace the model, the network and the clock so it gives the same answer every run.

## Key facts
- The guide shown is for Vitest v5.1.2 (versions 1.x to 4.x have their own docs).
- Import `vi` from `vitest`, or use it globally when the `globals` option is on.
- `vi.fn()` makes a mock function: set return values, async results or a custom implementation, and inspect calls.
- `vi.spyOn(obj, 'method')` watches an existing method or export; add `.mockImplementation(...)` to replace it.
- `vi.mock(path, factory)` replaces a module. It is hoisted: it always runs before every import in the file.
- With `importOriginal` in the factory you keep the real module and replace only some exports.
- `vi.mock` affects outside access only: a function that calls another function in the same module still calls
  the real one.
- Getters: `vi.spyOn(exports, 'getter', 'get').mockReturnValue(...)` (not in Browser Mode).
- Classes: return `vi.fn(class Fake { ... })` from a factory, or spy on the class export.
- Globals: `vi.stubGlobal(name, value)` does not reset between tests unless `unstubGlobals` is on or you call
  `vi.unstubAllGlobals()`.
- Env: assigning to `import.meta.env` does not reset; use `vi.stubEnv` with `unstubEnvs`, or
  `vi.unstubAllEnvs()` in `beforeEach`.
- Time: `vi.setSystemTime(date)` sets `Date` (and `Temporal`) and does not reset by itself;
  `vi.useFakeTimers()` also changes the date; `vi.useRealTimers()` restores real time.
- Clear or restore mocks before or after each test so one test cannot leak into the next.

## How to apply it here
- Config: `vitest.config.ts` includes `tests/unit/**/*.test.ts` with `environment: 'node'`. Code that touches
  `localStorage`, `IndexedDB` or `window` needs a stub (`vi.stubGlobal`) or a per-file DOM environment.
- Run `npm test` (it runs `vitest run` once, after `pretest` rebuilds team data); never watch mode in a gate.
- Model engine: mock the WebLLM wrapper module with `vi.mock`, returning canned replies, so no download happens.
- Network: stub `fetch` with `vi.stubGlobal('fetch', vi.fn(...))` and unstub after each test.
- Mock-engine flag: set it with `vi.stubEnv('VITE_MOCK_ENGINE', '1')` and call `vi.unstubAllEnvs()` in `beforeEach`.
- Dates in logs or version stamps: fix them with `vi.setSystemTime` so snapshots stay stable.
- Add an `afterEach` that calls `vi.unstubAllGlobals()` and `vi.unstubAllEnvs()` in files that stub.
- Clear or restore spies between tests as the guide's linked `mockReset` docs describe.
- One behaviour per test: for the router, one input text and one expected agent slug.
- Safety and leak-guard tests should assert both what is blocked and what still passes.
- Gate evidence: name the command, its exit code and the passed/failed counts from the summary line.
- A mocked module must match the real module's exported names; when the real one changes, update the mock
  in the same change, or the test passes against a fake that no longer exists.
- If a test only passes when run alone, a stub is leaking: treat it as a defect, not a flake to retry.

## Limits
- This page does not cover `fetch`-specific helpers, `vi.advanceTimersByTime`, `vi.mocked` or the
  `clearMocks`/`restoreMocks` options; read the API pages before relying on them.
- The page shows no setup for DOM environments; check the environment docs before switching from `node`.
- The docs footer names no licence; MIT comes from the project repository's LICENSE file.
