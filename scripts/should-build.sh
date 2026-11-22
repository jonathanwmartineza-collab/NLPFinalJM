#!/usr/bin/env bash
# Netlify "ignore" command. Exit 0 = SKIP the build, exit 1 = BUILD.
# Builds when any path in scripts/build-paths.txt changed since the last deployed commit.
set -u
paths=$(grep -v '^#' scripts/build-paths.txt | grep -v '^$' | tr '\n' ' ')
base="${CACHED_COMMIT_REF:-}"
head="${COMMIT_REF:-HEAD}"
if [ -z "$base" ] || [ "$base" = "$head" ] || ! git cat-file -e "$base" 2>/dev/null; then
  echo "should-build: no usable previous deploy commit, building"; exit 1
fi
if git diff --quiet "$base" "$head" -- $paths; then
  echo "should-build: only docs/reports changed since $base, skipping the deploy"; exit 0
fi
echo "should-build: site files changed since $base, building"; exit 1
