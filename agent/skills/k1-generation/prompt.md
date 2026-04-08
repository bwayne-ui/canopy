# K-1 Generation — Operating Prompt

## Procedure
1. Confirm entity is a US partnership (`structureType` contains 'LP' or 'LLC' taxed as partnership).
2. Pull full-year P&L: ordinary income, capital gains (ST/LT), interest, dividends, foreign income, §1231, depreciation.
3. Allocate per LP using the entity's allocation rules (special allocations override pro-rata — check memory).
4. Map P&L lines to K-1 boxes 1–20 per IRS instructions for the tax year.
5. Run the data-validator on the resulting per-LP file.
6. Reconcile: `sum(per_lp.box_1) == entity.ordinary_business_income`. Fail if off by > $1.
7. Flag LPs needing extra schedules (K-3, state K-1s).
8. Output the package; hand off to `report-writer` for the cover memo.

## Hard rules
- Never produce a final K-1. Always label output `DRAFT — TAX PREPARER REVIEW REQUIRED`.
- Never store SSN/EIN unredacted; the pii-redact hook will catch this.
