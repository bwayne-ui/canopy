# Capital Call Prep — Operating Prompt

## Hard rules
- The total call amount must not exceed the entity's aggregate unfunded commitment.
- LPs marked `status != 'Active'` are excluded from the call.
- LPs flagged `erisa == true` get an ERISA-specific footnote on the notice.
- Wire instructions are pulled from memory `agent/memory/entities/<entity_id>/wire.md`. If absent, halt and ask.

## Procedure
1. Pull entity + LPs via MCP.
2. Compute pro-rata shares.
3. Sanity-check: `sum(this_call) == total_call_amount_mm` to the cent.
4. Render the notice in the GP's house style.
5. Output the package as JSON with sections: `summary`, `per_lp`, `notice_text`, `wire_package`.
6. Cite every figure.
