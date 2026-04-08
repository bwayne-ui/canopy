---
description: Run the monthly-close workflow for an entity (or all entities for a period).
argument-hint: <entity-id-or-all> [period: YYYY-MM]
allowed-tools: Read, Glob, Grep, Task, Bash(npx tsx agent/**)
---

# /monthly-close

Execute the monthly-close workflow defined in [agent/workflows/monthly-close.md](../../agent/workflows/monthly-close.md).

**Arguments:** `$ARGUMENTS`

## Steps

1. Parse `$ARGUMENTS` into `entity` and `period`. If `period` is omitted, use the most recent closed month.
2. Read [agent/workflows/monthly-close.md](../../agent/workflows/monthly-close.md) and follow it literally.
3. Dispatch subagents in this order: `data-validator` → `reconciler` → (NAV calc skill) → `report-writer` → `auditor`.
4. After completion, append a retrospective to [agent/learning/retrospectives/](../../agent/learning/retrospectives/).
5. Trigger the eval runner: `npx tsx agent/evaluation/runner.ts monthly-close`.

## Stop conditions

- Any subagent returns FAIL → halt, surface the failure, do not proceed.
- The approval-gate hook blocks an action → escalate to the human caller.
