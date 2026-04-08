# Workflow — Quarterly Reporting

**Trigger:** Within 30 calendar days of quarter-end.

## Steps

1. Confirm all three monthly closes for the quarter are signed off.
2. Run `compliance-check` (full scope) on every in-scope entity.
3. Run `fee-reconciliation` for the quarter — surface any true-up needed.
4. Run `waterfall-modeling` for hypothetical exit valuations (LP-requested scenarios).
5. `report-writer` drafts the quarterly LP letter using the GP's house template.
6. `auditor` issues opinion on the package.
7. Controller + CFO dual-sign via `/api/agent/invoke` (4-eyes per `approvals.json`).
8. Release; write retrospective.
