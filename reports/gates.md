# Quality gates

Run: 2026-11-26T14:36Z on commit 3fce219

## Team validation: PASS

```
$ node scripts/validate-team.mjs
validate-team: 31 agents OK, 44 skills present, descriptions 10159 chars
```

## Generate team data (team.json, lite prompts, version): PASS

```
$ bash -c node scripts/build-team.mjs && node scripts/stamp-version.mjs
validate-team: 31 agents OK, 44 skills present, descriptions 10159 chars
build-team: 31 agents, 12 library prompts; largest lite prompt 1197 chars
version.json → 3fce219 (local)
```

## Skills check: PASS

```
$ node scripts/check-skills.mjs
check-skills: 44 skills OK
```

## Type check: PASS

```
$ npx tsc -p tsconfig.json --noEmit

```

## Unit tests (Vitest): PASS

```
$ npx vitest run

 RUN  v5.1.1 /home/user/brainyapp2


 Test Files  6 passed (6)
      Tests  33 passed (33)
   Start at  14:36:57
   Duration  545ms (import 71%, tests 12%, transform 12%, worker 4%)
```

## Production build: PASS

```
$ npm run build
✓ 394 modules transformed.
rendering chunks...
computing gzip size...
web/dist/index.html                     2.55 kB │ gzip:     1.17 kB
web/dist/assets/worker-HJiqo6PJ.js  6,124.96 kB
web/dist/assets/index-D0ZyqrJK.css     34.26 kB │ gzip:     7.52 kB
web/dist/assets/index-jLqOezW7.js     601.45 kB │ gzip:   189.52 kB
web/dist/assets/lib-DbM4P1Ls.js     6,139.64 kB │ gzip: 2,194.24 kB

[plugin builtin:vite-reporter] 
(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rolldownOptions.output.codeSplitting to improve chunking: https://rolldown.rs/reference/OutputOptions.codeSplitting
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
✓ built in 2.16s
```

## Initial JS budget (<= 250 KB gzip, WebLLM lazy): PASS

```
$ bash -c f=$(grep -o "assets/index-[^\"]*\.js" web/dist/index.html | head -1); s=$(gzip -c "web/dist/$f" | wc -c); echo "$f gzip $s bytes"; grep -q "web-llm\|CreateWebWorkerMLCEngine" web/dist/index.html && { echo "WebLLM in entry HTML"; exit 1; }; [ "$s" -le 256000 ]
assets/index-jLqOezW7.js gzip 187417 bytes
```

## End-to-end + axe (Playwright, mock engine): FAIL

```
$ npx playwright test --reporter=line
    [chrome] › tests/e2e/site.spec.ts:252:5 › axe: no serious or critical issues on / (dark) ───────
    [chrome] › tests/e2e/site.spec.ts:252:5 › axe: no serious or critical issues on /expert/edge-ai-engineer (light) 
    [chrome] › tests/e2e/site.spec.ts:252:5 › axe: no serious or critical issues on /expert/edge-ai-engineer (dark) 
    [chrome] › tests/e2e/site.spec.ts:252:5 › axe: no serious or critical issues on /studio (light) 
    [chrome] › tests/e2e/site.spec.ts:252:5 › axe: no serious or critical issues on /studio (dark) ─
    [chrome] › tests/e2e/site.spec.ts:252:5 › axe: no serious or critical issues on /library (light) 
    [chrome] › tests/e2e/site.spec.ts:252:5 › axe: no serious or critical issues on /library (dark) 
    [chrome] › tests/e2e/site.spec.ts:252:5 › axe: no serious or critical issues on /resources (light) 
    [chrome] › tests/e2e/site.spec.ts:252:5 › axe: no serious or critical issues on /resources (dark) 
    [chrome] › tests/e2e/site.spec.ts:252:5 › axe: no serious or critical issues on /guide (light) ─
    [chrome] › tests/e2e/site.spec.ts:252:5 › axe: no serious or critical issues on /guide (dark) ──
    [chrome] › tests/e2e/site.spec.ts:252:5 › axe: no serious or critical issues on /privacy (light) 
    [chrome] › tests/e2e/site.spec.ts:252:5 › axe: no serious or critical issues on /privacy (dark) 
    [chrome] › tests/e2e/site.spec.ts:263:1 › axe: a generated page passes in light and dark ───────
    [chrome] › tests/e2e/site.spec.ts:277:1 › axe: every Studio block and palette passes in light and dark (rendered directly) 
```

## No server AI, secrets or private-edition links in the bundle: PASS

```
$ bash -c ! grep -rlE "/api/|sk-ant-|ANTHROPIC_API_KEY|APP_PASSWORD|SESSION_SECRET|brainyapp-stud[i]o" web/dist --include=*.html --include=index-*.js && echo "clean: no /api/ calls, secrets or private-edition links in web/dist"
clean: no /api/ calls, secrets or private-edition links in web/dist
```

## No bare wildcard in the CSP: PASS

```
$ bash -c c=$(grep -o "Content-Security-Policy\" content=\"[^\"]*" web/index.html); echo "$c"; ! echo "$c" | grep -qE "(^|[ ;])\*( |;|$)|https://\*( |;|$)"
Content-Security-Policy" content="default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://huggingface.co https://*.huggingface.co https://*.hf.co https://raw.githubusercontent.com; frame-src 'self'; media-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'
```

## Dependency audit (production): PASS

```
$ npm audit --omit=dev --audit-level=high
found 0 vulnerabilities
```

