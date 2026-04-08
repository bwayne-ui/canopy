# Workflow — Monthly Close

**Trigger:** First business day of the month, or on-demand via `/monthly-close`.

**Owner:** Controller (human) + Canopy agent (automated steps)

## Steps

| # | Step | Actor | Skill / Subagent | Gate |
|---|---|---|---|---|
| 1 | Freeze prior month | Controller | manual | n/a |
| 2 | Validate inputs | Agent | `data-validator` | FAIL → halt |
| 3 | Cash recon | Agent | `reconciler` | variance > $10k → human |
| 4 | Custodian recon | Agent | `reconciler` | variance > $10k → human |
| 5 | Mark portfolio | Agent | `nav-calculation` (steps 3) | stale price > 5BD → WARN |
| 6 | Compute NAV | Agent | `nav-calculation` (full) | confidence < 0.9 → human |
| 7 | Accrue mgmt fee | Agent | `fee-reconciliation` (forward calc) | n/a |
| 8 | Accrue carry | Agent | `waterfall-modeling` | n/a |
| 9 | Draft LP letter | Agent | `report-writer` | n/a |
| 10 | Audit opinion | Agent | `auditor` subagent | non-CLEAN → human |
| 11 | Approval | Controller | manual via `/api/agent/invoke` | required |
| 12 | Release | Controller | manual | required |
| 13 | Retrospective | Agent | writes to `learning/retrospectives/` | n/a |
| 14 | Eval | Agent | `agent/evaluation/runner.ts monthly-close` | regression → propose skill update |

## Failure handling
- Any HALT: surface, log to audit, page on-call controller.
- Any human gate: pause workflow, notify Slack channel `#canopy-close`, resume on approval.

## Audit trail
Every step writes a JSONL line to `agent/governance/audit-log/$(date +%F).jsonl` via the post-tool-use hook.
