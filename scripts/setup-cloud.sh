#!/usr/bin/env bash
# Prepares a fresh Claude Code cloud session so ./scripts/gates.sh can run.
# Runs automatically at session start (.claude/settings.json) and is safe to run again.
set -u
cd "$(dirname "$0")/.."
log() { echo "[setup-cloud] $*"; }
# 1. Dependencies (skip if node_modules matches package-lock.json)
stamp=node_modules/.lock-hash
want=$(sha256sum package-lock.json | cut -c1-16)
if [ -f "$stamp" ] && [ "$(cat $stamp)" = "$want" ]; then log "dependencies up to date"
else log "installing dependencies (npm ci)…"; npm ci --no-audit --no-fund >/tmp/setup-npm.log 2>&1 && echo "$want" > $stamp && log "dependencies installed" || { log "npm ci FAILED: see /tmp/setup-npm.log"; exit 0; }; fi
# 2. A Chrome/Chromium for the end-to-end tests
if [ -n "${CHROME_PATH:-}" ] && [ -x "$CHROME_PATH" ]; then log "using CHROME_PATH=$CHROME_PATH"
elif command -v google-chrome >/dev/null; then log "found google-chrome: export CHROME_PATH=$(command -v google-chrome) for Playwright"
elif ls ~/.cache/ms-playwright/chromium-* >/dev/null 2>&1; then log "Playwright Chromium already installed"
else log "installing Playwright Chromium (needs Network access: Full)…"; npx playwright install --with-deps chromium >/tmp/setup-pw.log 2>&1 && log "Chromium installed" || log "Chromium install FAILED (e2e gate will fail; see /tmp/setup-pw.log)"; fi
# 3. Git identity for commits (only if none is set)
git config user.email >/dev/null || git config user.email "noreply@anthropic.com"
git config user.name >/dev/null || git config user.name "Claude"
# 4. Reachability of the live site (decides how verify-live works)
if curl -sS -o /dev/null --max-time 8 https://brainyapp2.netlify.app/ 2>/dev/null; then log "live site reachable: ./scripts/verify-live.sh will work"
else log "live site NOT reachable: set Network access to Full, or verify deploys in Chrome"; fi
exit 0
