#!/usr/bin/env bash
# Waits until the live site serves the expected commit, then checks the main pages.
# Usage: ./scripts/verify-live.sh [timeout_seconds]   (default 600)
# Needs network access to brainyapp2.netlify.app (Claude Code: Network access = Full).
# Exit 0 = live and healthy · 1 = deploy not live in time or page check failed · 2 = site unreachable from here.
set -u
SITE="https://brainyapp2.netlify.app"
BADGE="https://api.netlify.com/api/v1/badges/a6a02317-dcbb-4207-9494-b610da373266/deploy-status"
timeout="${1:-600}"
paths=$(grep -v '^#' scripts/build-paths.txt | grep -v '^$' | tr '\n' ' ')
git fetch -q origin main 2>/dev/null
want=$(git log -1 --format=%H origin/main -- $paths)
echo "expected live commit: ${want:0:7} (last commit on origin/main that touches site files)"
if ! curl -sS -o /dev/null --max-time 15 "$SITE/" 2>/dev/null; then
  echo "UNREACHABLE: this session can't reach $SITE (set Network access to Full, or verify in Chrome: https://app.netlify.com/projects/brainyapp2/deploys)"; exit 2
fi
start=$(date +%s)
while :; do
  live=$(curl -sS --max-time 15 "$SITE/version.json?t=$(date +%s)" | sed -n 's/.*"commit": *"\([0-9a-f]*\)".*/\1/p')
  state=$(curl -sS --max-time 15 "$BADGE" | grep -oE 'success|failed|building|canceled|enqueued' | head -1)
  echo "live: ${live:0:7} · Netlify badge: ${state:-unknown} · $(( $(date +%s) - start ))s"
  [ "$live" = "$want" ] && break
  [ "$state" = "failed" ] && { echo "DEPLOY FAILED: read the log at https://app.netlify.com/projects/brainyapp2/deploys"; exit 1; }
  [ $(( $(date +%s) - start )) -ge "$timeout" ] && { echo "TIMEOUT: ${want:0:7} is not live after ${timeout}s"; exit 1; }
  sleep 20
done
fail=0
for p in / /team /studio /library /resources /guide /privacy /expert/edge-ai-engineer /sandbox.html /team.json /version.json; do
  code=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 15 "$SITE$p"); echo "$code $p"; [ "$code" = 200 ] || fail=1
done
code=$(curl -sS -o /dev/null -w "%{http_code}" --max-time 15 "$SITE/this-page-does-not-exist"); echo "$code /this-page-does-not-exist (expect 404)"; [ "$code" = 404 ] || fail=1
curl -sS --max-time 15 -D - -o /dev/null "$SITE/sandbox.html" | grep -qi "content-security-policy: sandbox" && echo "sandbox CSP header present" || { echo "sandbox CSP header MISSING"; fail=1; }
[ $fail = 0 ] && echo "LIVE OK: ${want:0:7} is serving at $SITE" || echo "LIVE CHECK FAILED"
exit $fail
