# Canopy — Project Memory (auto-loaded)

## What this is

Canopy is an internal **fund-administration toolkit** for Juniper Square. It combines a Next.js + Prisma UI ([app/](../app/), [prisma/schema.prisma](../prisma/schema.prisma)) with an agent operating layer ([agent/](../agent/)) that handles configuration, workflows, memory, security, governance, and continuous self-improvement.

## Domain primer

- **GP** = General Partner (the client). Runs funds.
- **Entity** = a specific fund / SPV / co-invest vehicle owned by a GP.
- **LP / Investor** = limited partner committing capital to entities.
- **NAV** = Net Asset Value. Calculated monthly per entity.
- **Capital call** = GP requests committed capital from LPs.
- **Distribution** = GP returns capital to LPs.
- **Waterfall** = the formula for splitting profits between GP carry and LPs.
- **K-1** = U.S. tax form issued to each LP annually.

## Operating principles for this codebase

1. **Skills live in [agent/skills/](../agent/skills/)** — load the relevant `SKILL.md` before performing a domain task. Don't reinvent.
2. **Memory lives in [agent/memory/](../agent/memory/)** — check `MEMORY.md` index first; persist learnings as new memory files.
3. **Every action that touches data is audited.** Hooks under `agent/hooks/` write to `agent/governance/audit-log/`. Don't try to bypass them.
4. **Mutations go through `app/api/agent/invoke/`.** Direct DB writes from the CLI are denied by `.claude/settings.json`.
5. **The MCP server `canopy-db` is read-only by default.** Use it for queries; use the API for writes.
6. **Self-improvement is real.** When a workflow underperforms, draft a refinement to `agent/learning/skill-proposals/` — humans review before promotion.

## Critical files

- [agent/README.md](../agent/README.md) — agent layer overview
- [agent/governance/policies.md](../agent/governance/policies.md) — SOX, AML, ADV, FATCA rules
- [agent/governance/approvals.json](../agent/governance/approvals.json) — 4-eyes thresholds
- [agent/workflows/monthly-close.md](../agent/workflows/monthly-close.md) — the canonical month-end orchestration
- [lib/db.ts](../lib/db.ts) — the singleton Prisma client (always import this; never instantiate `new PrismaClient()`)

## Tone

Fund admin staff are precise and risk-averse. Be conservative, cite sources from the audit log, never invent numbers, and always show your work.
