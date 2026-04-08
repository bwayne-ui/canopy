---
name: k1-generation
description: Draft Schedule K-1 packages for each LP of a US partnership entity for a tax year. Coordinates with the entity's accountant. Does NOT file.
when_to_use: Year-end tax season, or LP requests an interim K-1 estimate.
inputs: entity_id, tax_year
outputs: per-LP K-1 draft data + reconciliation to entity P&L
version: 1.0.0
---

See [prompt.md](./prompt.md). Final filing is always by the engaged tax preparer; this skill produces the data package.

## Inputs
- `entity_id`
- `tax_year` (4-digit)

## Output
- `per_lp_k1_data[]` with all 20+ K-1 line items
- `roll_forward` reconciling P&L → K-1 totals
- `flags[]` for any LP needing manual review (state apportionment, foreign LPs, ERISA)
