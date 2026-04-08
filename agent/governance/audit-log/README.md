# Audit Log

Append-only JSONL files. One per day, named `YYYY-MM-DD.jsonl`.

## Schema

```json
{ "ts": "2026-04-08T14:32:11Z", "user": "billywayne", "tool": "Edit", "event": "ALLOW|BLOCK|WARN|COMPLETE|ERROR", "reason": "...", "exit": 0 }
```

## Queries

```bash
# All blocks today
grep '"event":"BLOCK"' agent/governance/audit-log/$(date +%F).jsonl

# Tool usage frequency this week
cat agent/governance/audit-log/2026-04-*.jsonl | grep -oE '"tool":"[^"]*"' | sort | uniq -c | sort -rn
```

## Retention
Keep on disk for 90 days; ship to long-term storage / SIEM weekly.
