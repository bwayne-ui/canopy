# Workflow — Investor Onboarding

**Trigger:** New LP commits to a fund.

## Steps

1. KYC/AML check (external service or manual upload).
2. `document-extraction` on subscription agreement → structured fields.
3. `compliance-check` for FATCA/CRS classification.
4. Create `Investor` row via `/api/agent/invoke` (writes are gated).
5. Side-letter MFN comparison: run `compliance-check` MFN scope; if any existing LP has superior terms, propagate or flag.
6. Add wire instructions to `agent/memory/entities/<entity_id>/lp-wires/<investor_id>.md`.
7. `auditor` confirms file completeness.
8. Welcome packet drafted by `report-writer`; controller approves and sends.
