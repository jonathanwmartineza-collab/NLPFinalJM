# pytest fixtures for the NLP build and NLTK tests

- Source: How to use fixtures — https://docs.pytest.org/en/stable/how-to/fixtures.html (accessed 2026-11-28)
- Supporting page: License — https://docs.pytest.org/en/stable/license.html (accessed 2026-11-28)
- Publisher: pytest project (pytest-dev)
- Licence: MIT · Copy in repo: link only

Why this matters for qa-engineer: tests/python checks NLTK behaviour, edge cases, routing and the JSON the build
writes. Fixtures let each test load corpora or build output once, cleanly, and tear it down safely.

## Key facts
- A fixture is a function decorated with `pytest.fixture`; a test asks for it by naming it as an argument.
- Fixtures can ask for other fixtures; within one test a fixture's value is cached and runs once.
- Each test gets its own fixture result, so tests do not affect one another.
- `autouse=True` makes every test in scope use the fixture automatically.
- Scopes: `function` (default), `class`, `module`, `package`, `session`. A callable can choose the scope.
- Only one instance of a parametrised fixture is cached at a time, so it may run more than once per scope.
- Put shared fixtures in `conftest.py`; tests in that directory can use them. Override at directory or module level.
- Teardown: prefer `yield` fixtures; code after `yield` runs at teardown in reverse setup order.
  If a fixture fails before `yield`, its own teardown does not run, but earlier fixtures still tear down.
- `request.addfinalizer(fn)` is the other teardown route; finalizers run last in, first out.
- Safe teardown: one state-changing action per fixture, paired with its own cleanup.
- Parametrised fixtures: `params=[...]` with `request.param`; `ids=` names the cases; `pytest.param(...,
  marks=pytest.mark.skip)` skips one value.
- The `pytest.mark.usefixtures("name")` decorator applies a fixture without an argument; not on fixture functions.
- Factory fixtures return a function that makes test data on demand.
- pytest is distributed under the MIT licence (License page).

## How to apply it here
- Run `npm run test:py` (`python3 -m pytest -q tests/python`). Record the command, exit code and pass/fail counts.
- Expensive setup, such as loading NLTK data or reading `web/public/nlp/*.json`, belongs in a `session` or
  `module` fixture, so the suite does not reload it per test.
- Build-output tests should not rebuild inside each test; build once (or require a fresh build) and point a
  session fixture at the output folder.
- Use `params` to run the same check over several sample texts (empty string, punctuation only, non-English,
  very long input) instead of copying tests.
- Give parametrised cases readable `ids` so a failure names the input that broke.
- Anything a fixture writes (temporary files) is cleaned up after `yield`.
- If NLTK data or spaCy is missing, the run fails or skips: report those tests as NOT RUN with the reason.
- Fixture placement for this repo:
  | Fixture need | Scope | Where |
  | --- | --- | --- |
  | Build output JSON loaded once | session | a conftest.py in tests/python (none exists yet) |
  | Sample texts per case | function, parametrised | the test module |
  | Temporary files | function, with yield cleanup | the test module |
- Never weaken a fixture to make a failing check pass; fix the cause or report it.

## Limits
- The page does not document built-in fixtures such as `tmp_path`, `monkeypatch` or `capsys`.
- The License page covers pytest itself and states no separate licence for the documentation.
- Version shown in the page's sample output is a placeholder, not a pinned release.
