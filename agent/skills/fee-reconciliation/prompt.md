# Fee Reconciliation — Operating Prompt

## Procedure
1. Pull the entity's fee terms: `mgmtFeePct`, `carryPct`, `prefRatePct`, `waterfallType`.
2. Read the LPA fee provisions from `agent/memory/entities/<entity_id>/lpa-summary.md`. If absent, halt.
3. Determine the fee base for each period — committed vs invested vs NAV — per the LPA.
4. Compute entitled fee for each period in the range.
5. Pull charged fees from `CashFlow` where `category == 'Management Fee'`.
6. Build the variance table.
7. For variances > $1, propose corrective entries (do not post).
8. Hand findings to `auditor` if total variance > $10k.

## Hard rules
- Never net offsetting variances across periods without flagging it.
- Always cite the LPA section that drives the entitled calculation.
