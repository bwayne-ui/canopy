---
description: Run the NAV calculation skill for a single entity and period.
argument-hint: <entity-id> <period: YYYY-MM>
allowed-tools: Read, Glob, Task, mcp__canopy-db__*
---

# /nav-calc

Run [agent/skills/nav-calculation/SKILL.md](../../agent/skills/nav-calculation/SKILL.md) for `$ARGUMENTS`.

1. Validate inputs via the `data-validator` subagent.
2. Load the skill prompt and follow it.
3. Output a structured NAV breakdown (assets, liabilities, accruals, fee adjustments).
4. Do **not** persist anything — this is a calculation, not a posting.
5. Show the citation for every line item.
