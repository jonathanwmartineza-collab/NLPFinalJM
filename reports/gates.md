# Quality gates

Run: 2026-11-26T05:33Z on commit 2879ac9

## Team validation: PASS

```
$ node scripts/validate-team.mjs
validate-team: 31 agents OK, 44 skills present, descriptions 10159 chars
```

## Generate team data (team.json, lite prompts, version): PASS

```
$ bash -c node scripts/build-team.mjs && node scripts/stamp-version.mjs
validate-team: 31 agents OK, 44 skills present, descriptions 10159 chars
build-team: 31 agents, 12 library prompts; largest lite prompt 892 chars
version.json → 2879ac9 (local)
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

 RUN  v5.1.1 /home/user/BrainyApp2


 Test Files  4 passed (4)
      Tests  19 passed (19)
   Start at  05:33:31
   Duration  442ms (import 51%, transform 37%, tests 9%, worker 3%)
```

## Production build: PASS

```
$ npm run build
✓ 391 modules transformed.
rendering chunks...
computing gzip size...
web/dist/index.html                     1.91 kB │ gzip:     0.83 kB
web/dist/assets/worker-HJiqo6PJ.js  6,124.96 kB
web/dist/assets/index-D0ZyqrJK.css     34.26 kB │ gzip:     7.52 kB
web/dist/assets/index-DX0o2faR.js     586.78 kB │ gzip:   183.75 kB
web/dist/assets/lib-DbM4P1Ls.js     6,139.64 kB │ gzip: 2,194.24 kB

[plugin builtin:vite-reporter] 
(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rolldownOptions.output.codeSplitting to improve chunking: https://rolldown.rs/reference/OutputOptions.codeSplitting
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
✓ built in 1.47s
```

## Initial JS budget (<= 250 KB gzip, WebLLM lazy): PASS

```
$ bash -c f=$(grep -o "assets/index-[^\"]*\.js" web/dist/index.html | head -1); s=$(gzip -c "web/dist/$f" | wc -c); echo "$f gzip $s bytes"; grep -q "web-llm\|CreateWebWorkerMLCEngine" web/dist/index.html && { echo "WebLLM in entry HTML"; exit 1; }; [ "$s" -le 256000 ]
assets/index-DX0o2faR.js gzip 181664 bytes
```

## End-to-end + axe (Playwright, mock engine): PASS

```
$ npx playwright test --reporter=line
[33/46] tests/e2e/site.spec.ts:243:5 › axe: no serious or critical issues on /studio (light)
[34/46] tests/e2e/clear.spec.ts:159:3 › axe: open Clear options panel and confirm dialog pass (dark)
[35/46] tests/e2e/site.spec.ts:243:5 › axe: no serious or critical issues on /studio (dark)
[36/46] tests/e2e/site.spec.ts:243:5 › axe: no serious or critical issues on /library (light)
[37/46] tests/e2e/clear.spec.ts:159:3 › axe: open Clear options panel and confirm dialog pass (dark, high contrast)
[38/46] tests/e2e/site.spec.ts:243:5 › axe: no serious or critical issues on /library (dark)
[39/46] tests/e2e/site.spec.ts:243:5 › axe: no serious or critical issues on /resources (light)
[40/46] tests/e2e/site.spec.ts:243:5 › axe: no serious or critical issues on /resources (dark)
[41/46] tests/e2e/site.spec.ts:243:5 › axe: no serious or critical issues on /guide (light)
[42/46] tests/e2e/site.spec.ts:243:5 › axe: no serious or critical issues on /guide (dark)
[43/46] tests/e2e/site.spec.ts:243:5 › axe: no serious or critical issues on /privacy (light)
[44/46] tests/e2e/site.spec.ts:243:5 › axe: no serious or critical issues on /privacy (dark)
[45/46] tests/e2e/site.spec.ts:254:1 › axe: a generated page passes in light and dark
[46/46] tests/e2e/site.spec.ts:268:1 › axe: every Studio block and palette passes in light and dark (rendered directly)
  46 passed (57.9s)
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

