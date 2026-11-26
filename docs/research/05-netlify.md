# 05 — Netlify: exactly what it can run, and what that means for NLP

## 1. Build image
- Current build image: **Ubuntu 24.04 "Noble Numbat"**.
- The build command runs in **Bash**, so a command can chain steps (`python … && npm run build`).

## 2. Python at build time
| Question | Answer from the docs |
|---|---|
| Is Python available? | Yes. Default `3.x`; "Any" official Python version can be selected. |
| How to pick a version | Environment variable **`PYTHON_VERSION`**, a **`runtime.txt`** file (version only, `x.y`, no trailing newline) or a **`Pipfile`**, in the base directory. If both `runtime.txt` and `Pipfile` exist, `runtime.txt` wins. |
| How dependencies install | Put a **`requirements.txt`** in the **base directory**; Netlify runs **`pip install`** on it. With a `Pipfile` Netlify runs `pipenv install` (and honours `Pipfile.lock`). If both `requirements.txt` and `Pipfile` exist, `requirements.txt` is used and the `Pipfile` deps are ignored. |
| Base directory | Where Netlify looks for dependency files, installs them and runs the build command. Defaults to the repo root (our case). |

**Our setting:** `PYTHON_VERSION = "3.13"` in `[build.environment]` of `netlify.toml`, and
`requirements.txt` at the repo root with `nltk==3.9.4`, `spacy` 3.8.x and the `en_core_web_sm` 3.8.0
wheel URL. Netlify installs them automatically before running our build command.

## 3. Build command and publish directory (`netlify.toml`)
- **Build command:** what Netlify runs to build the site (today `npm run build`).
- **Publish directory:** the folder that holds the finished site; **only files in it are deployed**
  (today `web/dist`). Relative to the base directory.
- Plan for the NLP final:
  ```toml
  [build]
    command = "python nlp/build_nlp.py && npm run build"
    publish = "web/dist"
  [build.environment]
    NODE_VERSION = "22"
    PYTHON_VERSION = "3.13"
  ```
  `build_nlp.py` writes to `web/public/nlp/`; Vite copies `web/public/` into `web/dist/`, so the JSON and
  the NLTK data zip are published as static files.
- **Watch out — the existing `ignore` script:** `netlify.toml` has `ignore = "bash scripts/should-build.sh"`,
  which **skips the build** unless a path listed in `scripts/build-paths.txt` changed. That list does not
  yet contain `nlp/` or `requirements.txt`. Add both, or a push that only changes the Python code will
  not deploy.

## 4. Build time limit
- The official docs pages fetched (build overview, troubleshooting tips) **do not state a build timeout**.
  → **UNVERIFIED in docs.**
- Netlify support staff on the official forum state the default is **15 minutes** for the build command
  (plus time for post-processing/upload), and that support can raise it on request.
- Our extra Python step is small: install spaCy + a 12 MB model (cached between builds by pip/Netlify)
  and process ~40 short documents — expected well under 2 minutes. Low risk.

## 5. Netlify Functions — languages
- The "Get started with functions" guide covers **TypeScript and JavaScript**, and **Go** through the
  Lambda-compatible API. **Python is not offered** for Functions.
- So spaCy cannot run in a Netlify Function. (The current app uses no Functions at all: it is fully
  static by design, see `netlify.toml`.)

## 6. Static hosting
- Everything in the publish directory is served from Netlify's CDN with the headers in `netlify.toml`.
- Python output (JSON, SVG, ZIP) is just more static files — no server needed at run time.
- Headers: the current `/*` rules set no CSP header (the app's CSP is a `<meta>` tag in `index.html`).
  Add a `Cache-Control` rule for `/nlp/*` if the JSON should refresh on each deploy.

## 7. What this means for NLP

| Need | Can Netlify do it? | Our choice |
|---|---|---|
| Run Python + spaCy + NLTK once per deploy | **Yes**, at build time | `nlp/build_nlp.py` precomputes all corpus results |
| Run Python per user request on the server | **No** (Functions: JS/TS/Go only) | Not used |
| Analyse the user's own text live | Only in the visitor's browser | NLTK in Pyodide (Web Worker) |
| Serve results | Yes, static files | `web/public/nlp/*.json` |

## Checklist
- [ ] `PYTHON_VERSION = "3.13"` in `netlify.toml`
- [ ] `requirements.txt` at the repo root (base directory)
- [ ] Build command runs `nlp/build_nlp.py` before the Vite build
- [ ] `nlp/` and `requirements.txt` added to `scripts/build-paths.txt`
- [ ] `/nlp` SPA redirect added next to the existing `/expert/*`, `/team`, … redirects
- [ ] Deploy log shows the Python step and its summary line

## Sources
- Available software at build time — https://docs.netlify.com/build/configure-builds/available-software-at-build-time/ (accessed 2026-11-26)
- Manage build dependencies (Python) — https://docs.netlify.com/build/configure-builds/manage-dependencies/ (accessed 2026-11-26)
- Build configuration overview — https://docs.netlify.com/build/configure-builds/overview/ (accessed 2026-11-26)
- Build troubleshooting tips — https://docs.netlify.com/build/configure-builds/troubleshooting-tips/ (accessed 2026-11-26)
- Get started with functions — https://docs.netlify.com/build/functions/get-started/ (accessed 2026-11-26)
- Functions overview — https://docs.netlify.com/build/functions/overview/ (accessed 2026-11-26)
- Forum (staff answer, 15-minute default; not official docs) — https://answers.netlify.com/t/support-guide-how-long-should-netlify-builds-take/151 (found via search 2026-11-26; page not opened)
- Repository files `netlify.toml`, `scripts/should-build.sh`, `scripts/build-paths.txt`, read 2026-11-26.
