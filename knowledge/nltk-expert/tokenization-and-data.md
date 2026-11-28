# NLTK tokenization, stopwords and data packages

- Source: nltk.tokenize package — https://www.nltk.org/api/nltk.tokenize.html (accessed 2026-11-26)
- Publisher: NLTK Project
- Licence: Apache-2.0 · Copy in repo: link only

Why this matters for nltk-expert: every NLTK feature in the NLP final (tokens, stopwords, VADER) depends on
data packages being found at runtime, both on the Netlify build machine and inside Pyodide in the browser.
A missing package is a `LookupError` at runtime, so the data layout must be planned, not guessed.

## Versions in play (checked 2026-11-26)
- The project pins `nltk==3.9.4` (PyPI release date 2026-03-24). PyPI's newest is 3.10.4 (2026-10-21),
  but Pyodide 314.0.8 ships nltk 3.9.4, so keep the pin at 3.9.4: build and browser then run identical code.
- The nltk.org API pages are built from 3.9.2 (shown in their header on 2026-11-28). UNVERIFIED: that no
  signature used here changed in 3.9.3 or 3.9.4; the project's pytest run on 3.9.4 is the real check.
- PyPI metadata: nltk 3.9.4 requires Python >=3.10 and lists 3.10 to 3.14 (3.9.2 required >=3.9);
  the Python 3.13 classifier first appears in 3.9.2.
- NLTK 3.9 (Aug 2024) removed the need for pickled models to fix CVE-2024-39705. This is why sentence
  splitting now uses the `punkt_tab` data package (plain parameter files) instead of the old pickled `punkt`.

## Tokenizer functions
| Function | Signature | What it uses | Data needed |
|---|---|---|---|
| `nltk.sent_tokenize` | `sent_tokenize(text, language='english')` | Punkt sentence tokenizer for the language | `punkt_tab` (tokenizers/punkt_tab/english) |
| `nltk.word_tokenize` | `word_tokenize(text, language='english', preserve_line=False)` | Improved Treebank word tokenizer, after Punkt sentence split | `punkt_tab` too, unless `preserve_line=True` |
| `PunktTokenizer` | `PunktTokenizer(lang='english')`, `load_lang(lang)` | Loads Punkt parameters from data files | `punkt_tab` |

- `word_tokenize` splits into sentences first by default, so it fails without the Punkt data even though
  you only asked for words. `preserve_line=True` skips the sentence split.
- Treebank-style tokens split contractions and punctuation (for example "don't" becomes "do" + "n't").
  Filter punctuation before counting frequencies; nlp/nltk_core.py `tokenize()` drops tokens with no
  letter or digit, so "n't" stays a token and even survives `content_words()` (it is listed in
  nltk.json's `house_words`, which the build removes from corpus counts).
- `language` is the name of a Punkt model (lowercase English name such as `'english'`).
- UNVERIFIED (not stated on the fetched pages): the exact `LookupError` text when `punkt_tab` is missing.
  The fix is always to install `punkt_tab`, not `punkt`.

## Stopwords corpus
- Load with `from nltk.corpus import stopwords` then `stopwords.words('english')`.
- `stopwords.fileids()` lists the languages (arabic, azerbaijani, ..., english, ...).
- Turn the list into a `set` once and compare lowercased tokens: `w.lower() not in STOP`.
- UNVERIFIED: the exact count of English stopwords in the current package (the howto page does not show
  it). Never hard-code the count in tests; assert a few known members instead ("the", "and", "is").

## Data packages the project needs
| Package id | Folder in nltk_data | Zip size | Unzipped | Notes |
|---|---|---|---|---|
| `punkt_tab` | tokenizers/ | 4,319,076 B | 10,885,330 B | 19 languages; ship only `english/` to the browser |
| `stopwords` | corpora/ | 37,733 B | 89,446 B | ship only `english` to the browser |
| `vader_lexicon` | sentiment/ | 90,486 B | 434,147 B | MIT licence; stays zipped (index says unzip="0") |
| `punkt` (old) | tokenizers/ | 13,905,355 B | 37,245,719 B | pickled; NOT needed with NLTK 3.9+ |

## Installing data
- Python: `nltk.download('punkt_tab', download_dir=DIR, quiet=True, raise_on_error=True)`.
- Full signature: `download(info_or_id=None, download_dir=None, quiet=False, force=False, prefix='[nltk_data] ', halt_on_error=True, raise_on_error=False, print_error_to=<stderr>)`.
- Always pass `raise_on_error=True` in the build: the default only prints an error and carries on.
- Command line: `python -m nltk.downloader -d DATADIR -q punkt_tab stopwords vader_lexicon`.
- Default download dirs on Linux (first writable): /usr/share/nltk_data, /usr/local/share/nltk_data,
  /usr/lib/nltk_data, /usr/local/lib/nltk_data, ~/nltk_data. Do not rely on these in CI; pass `-d`.
- Manual layout: nltk_data/{corpora,tokenizers,sentiment,...}/<package>; unzip each package into its
  category folder, then point NLTK at the top `nltk_data` folder.

## How NLTK finds data (`nltk.data`)
- `nltk.data.path` is a plain Python list of directories (and zip files) searched in order.
- The data page says the `NLTK_DATA` environment variable points NLTK at a custom top-level folder.
- In code, prefer `nltk.data.path.insert(0, DIR)` so your bundled data wins over anything else.
- `nltk.data.find(resource)` tries each path entry; if nothing matches it retries with each component
  `p` replaced by `p.zip/p`, then raises `LookupError` naming the downloader.
- A `.zip` inside a resource name is opened as a zip: the VADER default lexicon path is
  `sentiment/vader_lexicon.zip/vader_lexicon/vader_lexicon.txt`, so `vader_lexicon.zip` can stay zipped.
- `nltk.data.load()` supports pickle, json, yaml, text, raw and others; only load data you shipped.

## Recipe for this project (build and browser share it)
1. Build (`nltk_setup()` in nlp/build_nlp.py): download the three packages into the repo's `.nltk_data/`
   folder with `raise_on_error=True`, then `nltk.data.path.insert(0, ...)`.
2. Build (`nltk_zip()`): zip a trimmed tree: `tokenizers/punkt_tab/english/*`, `corpora/stopwords/english`,
   `sentiment/vader_lexicon.zip`, each entry with the fixed date 2026-01-01, to
   `web/public/nlp/nltk_data.zip` (192,016 B zipped, 329,291 B of files, as built on 2026-11-26).
3. Browser (web/src/nlp/boot.ts): fetch `/nlp/nltk_data.zip`,
   `py.unpackArchive(zip, 'zip', { extractDir: '/nltk_data' })`.
4. Browser: the boot glue runs `nltk.data.path.insert(0, "/nltk_data")` before importing `nltk_core`.
5. Smoke test both sides: `sent_tokenize("Hi there. Bye.")` returns 2 sentences; `stopwords.words('english')`
   contains "the"; `SentimentIntensityAnalyzer()` constructs without error.
- The browser zip holds only the `english` stopwords file. tests/node/pyodide-nltk.mjs runs `coach` (which
  loads the stopword list) inside Pyodide against that zip; record its PASS output as the evidence.

## Pitfalls
- Downloading at import time in the browser: Pyodide has no direct network for `nltk.download`; ship data.
- Mixing `punkt` and `punkt_tab`: old tutorials say `nltk.download('punkt')`; NLTK 3.9 needs `punkt_tab`.
- Counting punctuation and stopwords as "top words": filter first (the app uses `content_words()`: stopwords, one-letter and letterless tokens out).

## Sources
- https://www.nltk.org/api/nltk.tokenize.html (accessed 2026-11-26)
- https://www.nltk.org/api/nltk.tokenize.punkt.html (accessed 2026-11-26)
- https://www.nltk.org/howto/corpus.html (accessed 2026-11-26)
- https://www.nltk.org/data.html (accessed 2026-11-26)
- https://www.nltk.org/api/nltk.data.html (accessed 2026-11-26)
- https://www.nltk.org/api/nltk.downloader.html (accessed 2026-11-26)
- https://www.nltk.org/nltk_data/ (accessed 2026-11-26)
- https://www.nltk.org/news.html (accessed 2026-11-26)
- https://pypi.org/project/nltk/ (accessed 2026-11-26)
