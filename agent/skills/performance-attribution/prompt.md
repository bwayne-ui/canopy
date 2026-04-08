# Performance Attribution — Operating Prompt

## Procedure

1. Pull positions and prices for `period_start` and `period_end` via MCP.
2. Compute total period return: `(end_nav - start_nav - net_capital_flows) / start_nav_adjusted`.
3. For each requested dimension:
   - Group holdings by the dimension key
   - Compute each group's contribution: `(group_end - group_start - group_flows) / start_nav_total`
   - Verify contributions sum to total period return ± 0.05bps tolerance
4. Output a table per dimension:
   ```
   dimension: sector
   total: +6.42%
   - Software:      +3.81%
   - Healthcare:    +1.44%
   - Industrials:   +0.92%
   - Cash:          +0.25%
   ```
5. If FX is in scope, separate local-return vs FX-translation contributions.

## Hard rules
- Sum-check is mandatory. If contributions don't sum to total, halt and surface.
- Cite the start-of-period and end-of-period mark for each holding.
- Never present gross when LP letter requires net (use `agent/memory/clients/<gp>.md` to check).
