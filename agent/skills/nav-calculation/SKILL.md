---
name: nav-calculation
description: Compute Net Asset Value for a fund entity for a given period. Aggregates portfolio market values, accruals, expenses, and management fees. Use for monthly close, ad-hoc valuation, or LP statement prep.
when_to_use: User asks "what's the NAV", "compute NAV for X", or workflow reaches the valuation step.
inputs: entity_id, period (YYYY-MM), optional fx_rate_override
outputs: structured NAV breakdown with citations
version: 1.0.0
---

See [prompt.md](./prompt.md) for the operating instructions and [examples/](./examples/) for golden cases.

## Inputs

| Field | Type | Required | Notes |
|---|---|---|---|
| `entity_id` | string | yes | Must exist in `Entity.entityId` |
| `period` | YYYY-MM | yes | Must be a closed accounting period |
| `fx_rate_override` | object | no | Manual FX rates for non-USD positions |

## Outputs

```json
{
  "entity_id": "WALKER-III",
  "period": "2026-03",
  "nav_total_mm": 487.3,
  "components": {
    "portfolio_market_value_mm": 502.1,
    "cash_and_equivalents_mm": 12.4,
    "accrued_income_mm": 1.8,
    "accrued_expenses_mm": -4.2,
    "management_fee_accrual_mm": -3.1,
    "carried_interest_accrual_mm": -21.7
  },
  "citations": ["Entity:WALKER-III", "Security:* where issuer=WALKER-III"],
  "confidence": 0.97
}
```

## Failure modes

- Missing prior-period NAV → cannot compute roll-forward → halt
- Stale prices (> 5 business days old) → WARN but proceed
- Unrecognized currency → halt and ask
