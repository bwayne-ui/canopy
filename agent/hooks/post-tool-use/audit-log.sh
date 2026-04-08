#!/usr/bin/env bash
# post-tool-use/audit-log.sh
# Append-only JSONL audit trail of every tool call.

set -euo pipefail
PAYLOAD="$(cat)"
AUDIT_DIR="${CANOPY_AUDIT_LOG_DIR:-./agent/governance/audit-log}"
mkdir -p "$AUDIT_DIR"
TODAY="$(date +%F)"
NOW="$(date -u +%FT%TZ)"
USER_ID="${USER:-unknown}"

TOOL_NAME="$(printf '%s' "$PAYLOAD" | grep -oE '"tool_name"[^"]*"[^"]*"' | head -1 | sed -E 's/.*"([^"]*)"$/\1/' || echo unknown)"
EXIT_CODE="$(printf '%s' "$PAYLOAD" | grep -oE '"exit_code":[0-9]+' | head -1 | sed -E 's/.*:([0-9]+)/\1/' || echo 0)"

# One JSONL line per tool call.
printf '{"ts":"%s","user":"%s","tool":"%s","exit":%s,"event":"COMPLETE"}\n' \
  "$NOW" "$USER_ID" "$TOOL_NAME" "${EXIT_CODE:-0}" >> "$AUDIT_DIR/$TODAY.jsonl"

exit 0
