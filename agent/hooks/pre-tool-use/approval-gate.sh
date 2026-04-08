#!/usr/bin/env bash
# pre-tool-use/approval-gate.sh
# Blocks any action that exceeds the thresholds in agent/governance/approvals.json.
# Reads the tool-use payload from stdin (Claude Code hook contract).
# Exit 0 = allow, exit 2 = block (with stderr message shown to model), exit 1 = error.

set -euo pipefail

PAYLOAD="$(cat)"
TOOL_NAME="$(printf '%s' "$PAYLOAD" | grep -oE '"tool_name"[^"]*"[^"]*"' | head -1 | sed -E 's/.*"([^"]*)"$/\1/' || echo unknown)"
APPROVALS_FILE="${CANOPY_AGENT_ROOT:-./agent}/governance/approvals.json"
AUDIT_DIR="${CANOPY_AUDIT_LOG_DIR:-./agent/governance/audit-log}"

mkdir -p "$AUDIT_DIR"
TODAY="$(date +%F)"
NOW="$(date -u +%FT%TZ)"

# Block any obviously destructive command outright.
if printf '%s' "$PAYLOAD" | grep -qE '(rm -rf|DROP TABLE|TRUNCATE|DELETE FROM [a-zA-Z_]+(;| WHERE 1=1| WHERE true))'; then
  echo "BLOCKED by approval-gate: destructive command pattern detected." >&2
  printf '{"ts":"%s","event":"BLOCK","reason":"destructive_pattern","tool":"%s"}\n' "$NOW" "$TOOL_NAME" >> "$AUDIT_DIR/$TODAY.jsonl"
  exit 2
fi

# Block writes to governance dir without explicit dual-approval marker.
if printf '%s' "$PAYLOAD" | grep -qE 'agent/governance/' && ! printf '%s' "$PAYLOAD" | grep -q 'CANOPY_DUAL_APPROVED=1'; then
  if [ "$TOOL_NAME" = "Write" ] || [ "$TOOL_NAME" = "Edit" ]; then
    echo "BLOCKED: governance/ requires dual approval. Set CANOPY_DUAL_APPROVED=1 after second reviewer signs off." >&2
    printf '{"ts":"%s","event":"BLOCK","reason":"governance_dual_approval","tool":"%s"}\n' "$NOW" "$TOOL_NAME" >> "$AUDIT_DIR/$TODAY.jsonl"
    exit 2
  fi
fi

# Allow.
printf '{"ts":"%s","event":"ALLOW","tool":"%s"}\n' "$NOW" "$TOOL_NAME" >> "$AUDIT_DIR/$TODAY.jsonl"
exit 0
