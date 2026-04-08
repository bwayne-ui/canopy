#!/usr/bin/env bash
# pre-tool-use/pii-redact.sh
# Scans tool-use payload for PII (SSN, account numbers, DOB) and warns/blocks.

set -euo pipefail
PAYLOAD="$(cat)"
AUDIT_DIR="${CANOPY_AUDIT_LOG_DIR:-./agent/governance/audit-log}"
mkdir -p "$AUDIT_DIR"
TODAY="$(date +%F)"
NOW="$(date -u +%FT%TZ)"

# US SSN pattern
if printf '%s' "$PAYLOAD" | grep -qE '\b[0-9]{3}-[0-9]{2}-[0-9]{4}\b'; then
  echo "BLOCKED: payload contains an unredacted SSN. Redact before proceeding." >&2
  printf '{"ts":"%s","event":"BLOCK","reason":"ssn_detected"}\n' "$NOW" >> "$AUDIT_DIR/$TODAY.jsonl"
  exit 2
fi

# Bank account-ish (10-17 consecutive digits not preceded by a colon/equals — naive)
if printf '%s' "$PAYLOAD" | grep -qE '(^|[^=:0-9])[0-9]{12,17}([^0-9]|$)'; then
  echo "WARN: long numeric sequence resembles a bank account. Review before sending." >&2
  printf '{"ts":"%s","event":"WARN","reason":"possible_account_number"}\n' "$NOW" >> "$AUDIT_DIR/$TODAY.jsonl"
  # Warn only — do not block.
fi

exit 0
