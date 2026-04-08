# Waterfall Modeling — Operating Prompt

## Procedure (European with 8% pref + 100% catch-up + 80/20)

1. **Return of capital tier.** Pay LPs until `cumulative_distribution >= cumulative_called_capital`.
2. **Preferred return tier.** Pay LPs the `prefRatePct` (compounded) on contributed capital.
3. **GP catch-up tier.** Pay GP until GP has received `carryPct` of total profits to date.
4. **Carry tier.** Split remaining 80% LP / 20% GP (or per LPA).

For American (deal-by-deal): apply the four tiers per realized investment.

## Output

```json
{
  "tiers": [
    { "name": "Return of capital", "lp": ..., "gp": 0 },
    { "name": "Preferred return", "lp": ..., "gp": 0 },
    { "name": "GP catch-up", "lp": 0, "gp": ... },
    { "name": "Carry", "lp": ..., "gp": ... }
  ],
  "totals": { "lp": ..., "gp": ... },
  "irr_check": { "lp_irr": ..., "pref_threshold": 0.08, "passes": true }
}
```

## Hard rules
- Never apply European logic to a deal-by-deal LPA.
- Always model both pre-tax and after-clawback views if a clawback provision exists.
