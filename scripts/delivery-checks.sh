#!/usr/bin/env bash
set -euo pipefail

run_if_script_exists() {
  local script_name="$1"
  if [ -f package.json ] && node -e "const p=require('./package.json'); process.exit(p.scripts && p.scripts['$script_name'] ? 0 : 1)"; then
    echo "== Running npm run $script_name =="
    npm run "$script_name"
  else
    echo "== Skipping $script_name: script not found =="
  fi
}

if [ -f package-lock.json ]; then
  echo "== Installing with npm ci =="
  npm ci
elif [ -f pnpm-lock.yaml ]; then
  echo "== Installing with pnpm =="
  corepack enable || true
  pnpm install --frozen-lockfile
elif [ -f yarn.lock ]; then
  echo "== Installing with yarn =="
  corepack enable || true
  yarn install --frozen-lockfile
else
  echo "== No known lockfile found; skipping install =="
fi

run_if_script_exists lint
run_if_script_exists typecheck
run_if_script_exists check
run_if_script_exists build
