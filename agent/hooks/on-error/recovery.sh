#!/usr/bin/env bash
# on-error/recovery.sh
# When a tool call errors, record context and suggest a recovery path.

set -euo pipefail
PAYLOAD="$(cat)"
AUDIT_DIR="${CANOPY_AUDIT_LOG_DIR:-./agent/governance/audit-log}"
RETRO_DIR="${CANOPY_AGENT_ROOT:-./agent}/learning/retrospectives"
mkdir -p "$AUDIT_DIR" "$RETRO_DIR"
TODAY="$(date +%F)"
NOW="$(date -u +%FT%TZ)"

printf '{"ts":"%s","event":"ERROR","payload":%s}\n' "$NOW" "$(printf '%s' "$PAYLOAD" | head -c 2000 | python3 -c 'import sys,json;print(json.dumps(sys.stdin.read()))' 2>/dev/null || echo \"redacted\")" >> "$AUDIT_DIR/$TODAY.jsonl"

# Append a stub retrospective for human review.
RETRO_FILE="$RETRO_DIR/$TODAY-error-$(date +%s).md"
{
  echo "# Error Retrospective — $NOW"
  echo
  echo "## What happened"
  echo "Tool call failed. See audit log."
  echo
  echo "## Recovery suggestions"
  echo "- Re-run with verbose flag"
  echo "- Check upstream data validity"
  echo "- Consult relevant SKILL.md"
  echo
  echo "## Action items"
  echo "- [ ] Triage"
  echo "- [ ] Root cause"
  echo "- [ ] Update skill or hook if pattern recurs"
} > "$RETRO_FILE"

exit 0
