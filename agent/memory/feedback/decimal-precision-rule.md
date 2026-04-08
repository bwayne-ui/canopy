---
name: decimal-precision-rule
type: feedback
description: Never round monetary values until the final output line. Reason — Q4 2025 fee recon was off by $7k due to mid-calc rounding.
---

**Rule:** Carry full Decimal precision through every calculation. Format only on the last step.

**Why:** In Q4 2025 fee recon for Sullivan Alpha, mid-calc rounding to 2 decimals compounded across 12 monthly fee accruals and produced a $7,142 false variance. Auditor flagged it.

**How to apply:** Use Prisma `Decimal` types end-to-end. Convert via `toNum` from [lib/utils.ts](../../../lib/utils.ts) only when emitting the final JSON / display string.
