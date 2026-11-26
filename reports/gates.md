# Quality gates

Run: 2026-11-26T20:43Z on commit 572ebb2

## Team validation: PASS

```
$ node scripts/validate-team.mjs
validate-team: 36 agents OK, 49 skills present, descriptions 11309 chars
```

## Generate team data (team.json, lite prompts, version): PASS

```
$ bash -c node scripts/build-team.mjs && node scripts/stamp-version.mjs
validate-team: 36 agents OK, 49 skills present, descriptions 11309 chars
build-team: 36 agents, 12 library prompts; largest lite prompt 1197 chars
version.json → 572ebb2 (local)
```

## Skills check: PASS

```
$ node scripts/check-skills.mjs
check-skills: 49 skills OK
```

## NLP build: NLTK + spaCy to static JSON: PASS

```
$ python3 nlp/build_nlp.py
build_nlp: OK 48 documents, 50871 words, 1685 topic phrases, 11.3 s; spacy.json 47 KB, topic-index.json 196 KB, nltk.json 19 KB, nltk_data.zip 187 KB
```

## NLP tests (pytest: NLTK core, spaCy gold, build output): PASS

```
$ python3 -m pytest -q tests/python
........................................................................ [ 31%]
........................................................................ [ 63%]
........................................................................ [ 95%]
...........                                                              [100%]
227 passed in 1.41s
```

## Type check: PASS

```
$ npx tsc -p tsconfig.json --noEmit

```

## Unit tests (Vitest): PASS

```
$ npx vitest run

 RUN  v5.1.1 /home/user/NLPFinal-BrainyApp


 Test Files  11 passed (11)
      Tests  64 passed (64)
   Start at  20:43:40
   Duration  2.75s (tests 76%, import 19%, transform 4%, worker 1%)

    Isolate  11 workers spawned · ~144ms startup each (spawn + environment, per file)
             at least ~383ms faster with isolate: false — reuses workers across files instead of one per file
```

## Production build: PASS

```
$ npm run build
rendering chunks...
computing gzip size...
web/dist/assets/nltk.worker-XyE1pPJT.js      2.55 kB
web/dist/index.html                          2.62 kB │ gzip:     1.20 kB
web/dist/assets/worker-HJiqo6PJ.js       6,124.96 kB
web/dist/assets/index-CoJTIifu.css          44.10 kB │ gzip:     9.43 kB
web/dist/assets/index-CYbxQNJx.js          651.31 kB │ gzip:   204.77 kB
web/dist/assets/lib-DbM4P1Ls.js          6,139.64 kB │ gzip: 2,194.24 kB

[plugin builtin:vite-reporter] 
(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rolldownOptions.output.codeSplitting to improve chunking: https://rolldown.rs/reference/OutputOptions.codeSplitting
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
✓ built in 2.25s
```

## Initial JS budget (<= 250 KB gzip, WebLLM lazy): PASS

```
$ bash -c f=$(grep -o "assets/index-[^\"]*\.js" web/dist/index.html | head -1); s=$(gzip -c "web/dist/$f" | wc -c); echo "$f gzip $s bytes"; grep -q "web-llm\|CreateWebWorkerMLCEngine" web/dist/index.html && { echo "WebLLM in entry HTML"; exit 1; }; [ "$s" -le 256000 ]
assets/index-CYbxQNJx.js gzip 202604 bytes
```

## End-to-end + axe (Playwright, mock engine): FAIL

```
$ npx playwright test --reporter=line
    [chrome] › tests/e2e/site.spec.ts:256:5 › axe: no serious or critical issues on /studio (dark) ─
    [chrome] › tests/e2e/site.spec.ts:256:5 › axe: no serious or critical issues on /library (light) 
    [chrome] › tests/e2e/site.spec.ts:256:5 › axe: no serious or critical issues on /library (dark) 
    [chrome] › tests/e2e/site.spec.ts:256:5 › axe: no serious or critical issues on /nlp (light) ───
    [chrome] › tests/e2e/site.spec.ts:256:5 › axe: no serious or critical issues on /nlp (dark) ────
    [chrome] › tests/e2e/site.spec.ts:256:5 › axe: no serious or critical issues on /resources (light) 
    [chrome] › tests/e2e/site.spec.ts:256:5 › axe: no serious or critical issues on /resources (dark) 
    [chrome] › tests/e2e/site.spec.ts:256:5 › axe: no serious or critical issues on /guide (light) ─
    [chrome] › tests/e2e/site.spec.ts:256:5 › axe: no serious or critical issues on /guide (dark) ──
    [chrome] › tests/e2e/site.spec.ts:256:5 › axe: no serious or critical issues on /privacy (light) 
    [chrome] › tests/e2e/site.spec.ts:256:5 › axe: no serious or critical issues on /privacy (dark) 
    [chrome] › tests/e2e/site.spec.ts:267:1 › axe: a generated page passes in light and dark ───────
    [chrome] › tests/e2e/site.spec.ts:281:1 › axe: every Studio block and palette passes in light and dark (rendered directly) 
    [chrome] › tests/e2e/site.spec.ts:301:1 › NLP Lab: panels load with NLTK and spaCy labels ──────
    [chrome] › tests/e2e/site.spec.ts:316:1 › NLP Lab: the live NLTK prompt coach returns a result ─
```

## No server AI, secrets or private-edition links in the bundle: FAIL

```
$ bash -c ! grep -rlE "/api/|sk-ant-|ANTHROPIC_API_KEY|APP_PASSWORD|SESSION_SECRET|brainyapp-stud[i]o" web/dist --include=*.html --include=index-*.js && echo "clean: no /api/ calls, secrets or private-edition links in web/dist"
web/dist/assets/index-CYbxQNJx.js
```

## No bare wildcard in the CSP: PASS

```
$ bash -c c=$(grep -o "Content-Security-Policy\" content=\"[^\"]*" web/index.html); echo "$c"; ! echo "$c" | grep -qE "(^|[ ;])\*( |;|$)|https://\*( |;|$)"
Content-Security-Policy" content="default-src 'self'; script-src 'self' 'wasm-unsafe-eval' https://cdn.jsdelivr.net; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://huggingface.co https://*.huggingface.co https://*.hf.co https://raw.githubusercontent.com https://cdn.jsdelivr.net; frame-src 'self'; media-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'
```

## Dependency audit (production): PASS

```
$ npm audit --omit=dev --audit-level=high
found 0 vulnerabilities
```

