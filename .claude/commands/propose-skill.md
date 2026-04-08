---
description: Draft a new skill proposal based on a recurring pattern you've observed.
argument-hint: <skill-name> <one-line-description>
allowed-tools: Read, Glob, Write
---

# /propose-skill

You've noticed a repeated workflow that doesn't yet have a skill. Draft a proposal in [agent/learning/skill-proposals/](../../agent/learning/skill-proposals/) for human review.

**Arguments:** `$ARGUMENTS`

## Steps

1. Confirm no existing skill in [agent/skills/](../../agent/skills/) covers this — search by name AND description.
2. Read 2-3 existing `SKILL.md` files to mirror the structure.
3. Draft `agent/learning/skill-proposals/<skill-name>/SKILL.md` with:
   - Frontmatter (`name`, `description`, `when_to_use`)
   - Mission
   - Inputs/outputs
   - Step-by-step process
   - Example invocation
   - Justification: why this pattern is worth promoting (cite specific past sessions or audit-log entries)
4. Append a one-line entry to [agent/learning/optimization-log.md](../../agent/learning/optimization-log.md).
5. Do NOT promote into `agent/skills/` — that requires human approval.
