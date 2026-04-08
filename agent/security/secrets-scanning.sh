#!/usr/bin/env bash
# Scan for accidentally committed secrets. Runs in CI and pre-commit.
set -euo pipefail
ROOT="${1:-.}"
PATTERNS=(
  'AKIA[0-9A-Z]{16}'                          # AWS Access Key
  'sk-[a-zA-Z0-9]{32,}'                       # OpenAI / Anthropic API key
  '-----BEGIN [A-Z ]+PRIVATE KEY-----'        # PEM private key
  'ghp_[A-Za-z0-9]{30,}'                      # GitHub PAT
  'xox[baprs]-[A-Za-z0-9-]{10,}'              # Slack token
)
FOUND=0
for p in "${PATTERNS[@]}"; do
  if grep -rEn --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git "$p" "$ROOT" 2>/dev/null; then
    FOUND=1
  fi
done
exit $FOUND
