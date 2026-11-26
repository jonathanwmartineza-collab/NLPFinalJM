#!/usr/bin/env bash
# Runs every quality gate and writes the command + last 15 lines of output to reports/gates.md (evidence rule).
set -u
fails=0
out=reports/gates.md
mkdir -p reports
{ echo "# Quality gates"; echo; echo "Run: $(date -u +%Y-%m-%dT%H:%MZ) on commit $(git rev-parse --short HEAD 2>/dev/null)"; echo; } > $out
gate() { local name="$1"; shift; local log; log=$("$@" 2>&1); local code=$?; local res=PASS; [ $code -ne 0 ] && { res=FAIL; fails=$((fails+1)); }
  { echo "## $name: $res"; echo; echo '```'; echo "\$ $*"; echo "$log" | tail -15; echo '```'; echo; } >> $out; echo "$name: $res"; }
gate "Team validation" node scripts/validate-team.mjs
gate "Generate team data (team.json, lite prompts, version)" bash -c "node scripts/build-team.mjs && node scripts/stamp-version.mjs"
gate "Skills check" node scripts/check-skills.mjs
gate "NLP build: NLTK + spaCy to static JSON" python3 nlp/build_nlp.py
gate "NLP tests (pytest: NLTK core, spaCy gold, build output)" python3 -m pytest -q tests/python
gate "Type check" npx tsc -p tsconfig.json --noEmit
gate "Unit tests (Vitest)" npx vitest run
gate "Production build" npm run build
gate "Initial JS budget (<= 250 KB gzip, WebLLM lazy)" bash -c 'f=$(grep -o "assets/index-[^\"]*\.js" web/dist/index.html | head -1); s=$(gzip -c "web/dist/$f" | wc -c); echo "$f gzip $s bytes"; grep -q "web-llm\|CreateWebWorkerMLCEngine" web/dist/index.html && { echo "WebLLM in entry HTML"; exit 1; }; [ "$s" -le 256000 ]'
gate "End-to-end + axe (Playwright, mock engine)" npx playwright test --reporter=line
gate "No server AI, secrets or private-edition links in the bundle" bash -c '! grep -rlE "[^A-Za-z0-9.]/api/|sk-ant-|ANTHROPIC_API_KEY|APP_PASSWORD|SESSION_SECRET|brainyapp-stud[i]o" web/dist --include=*.html --include=index-*.js && echo "clean: no relative /api/ calls, secrets or private-edition links in web/dist (external docs such as spacy.io/api/ are allowed)"'
gate "No bare wildcard in the CSP" bash -c 'c=$(grep -o "Content-Security-Policy\" content=\"[^\"]*" web/index.html); echo "$c"; ! echo "$c" | grep -qE "(^|[ ;])\*( |;|$)|https://\*( |;|$)"'
gate "Dependency audit (production)" npm audit --omit=dev --audit-level=high
echo "gates failed: $fails"; exit $fails
