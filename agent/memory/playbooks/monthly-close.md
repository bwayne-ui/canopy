---
name: monthly-close-playbook
type: playbook
description: Validated month-end close sequence after Jan 2026 retrospective. Cuts close time by ~30%.
---

## Sequence (validated)

1. **T-3**: data-validator over all in-scope entities (parallel)
2. **T-2**: reconciler for cash + custodian (parallel per entity)
3. **T-2**: portfolio mark-to-market (skill: nav-calculation step 3)
4. **T-1**: NAV calc full run (depends on 1-3)
5. **T-1**: fee accrual + carry accrual (depends on 4)
6. **T-0**: report-writer drafts LP statements
7. **T-0**: auditor subagent reviews and issues opinion
8. **T+1**: human controller signs off via app/api/agent/invoke approval
9. **T+1**: deliverables released; retrospective written

## Why this order
- Steps 1-3 are independent and parallelize well — saves ~4 hours
- Steps 4-7 are strictly sequential
- Step 8 is the only human gate; everything before is reviewable but automated
