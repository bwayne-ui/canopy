---
name: fee-reconciliation
description: Reconcile management and performance fees charged vs entitled per the LPA. Identifies over/under-charges and proposes catch-up entries.
when_to_use: Quarterly fee true-up, LP fee inquiry, or audit prep.
inputs: entity_id, period_start, period_end
outputs: fee table with variance analysis
version: 1.0.0
---

See [prompt.md](./prompt.md).

## Output

```
+--------------+-----------+----------+----------+----------+
| Period       | Entitled  | Charged  | Variance | Action   |
+--------------+-----------+----------+----------+----------+
| 2026-Q1      | 1,237,500 | 1,237,500|        0 | None     |
| 2025-Q4      | 1,237,500 | 1,250,000|  +12,500 | Refund   |
+--------------+-----------+----------+----------+----------+
```
