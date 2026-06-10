#!/usr/bin/env bash
set -euo pipefail

echo "== Delivery Status =="
echo "Date: $(date -u +%Y-%m-%dT%H:%M:%SZ)"

echo ""
echo "== Git status =="
git status --short

echo ""
echo "== Current branch =="
git branch --show-current

echo ""
echo "== Recent commits =="
git log --oneline -n 5

if command -v gh >/dev/null 2>&1; then
  echo ""
  echo "== GitHub PR status =="
  gh pr status || true

  echo ""
  echo "== Current PR view =="
  gh pr view --json url,state,mergeable,baseRefName,headRefName,statusCheckRollup 2>/dev/null || true

  echo ""
  echo "== Current PR checks =="
  gh pr checks 2>/dev/null || true
else
  echo ""
  echo "== GitHub CLI not available =="
fi

if [ -n "${LIVE_URL:-}" ]; then
  echo ""
  echo "== Live URL HEAD =="
  curl -fsSI "$LIVE_URL" || exit 1
fi
