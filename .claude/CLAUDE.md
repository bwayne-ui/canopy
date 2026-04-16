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

## UI Standards

### Typography — 4-size scale only (do not add sizes outside this list without explicit user approval)

| Class | px | Use |
|---|---|---|
| `text-[10px]` | 10px | Micro only: badge/chip labels, tag text, avatar initials, timestamps in tight spaces |
| `text-xs` | 12px | Everything else: table cells, field labels, field values, section headers, nav items, buttons, body copy |
| `text-sm` | 14px | Prominent UI only: sidebar nav items, modal titles, page sub-headers |
| `text-lg` / `text-2xl` / `text-3xl` / `text-4xl` | 18–36px | KPI/metric display numbers only — used sparingly |

**Rules:**
- Never introduce `text-[11px]`, `text-[12px]`, `text-[13px]`, `text-[15px]`, `text-base`, or any other arbitrary px size.
- `font-mono` on all numeric/ID/date values in tables and cards.
- `font-semibold` for section headers and labels; `font-bold` for metric values.

### Font weights — 3-weight scale only (do not add weights outside this list without explicit user approval)

| Class | Use |
|---|---|
| `font-medium` | Body copy, secondary labels, general text |
| `font-semibold` | Section headers, primary labels, buttons, nav items |
| `font-bold` | Metric display numbers, strong emphasis, logo/brand text |

- Do not use `font-mono` — the standard system font is used everywhere.
- Never use `font-black`, `font-extrabold`, `font-light`, or `font-thin`.
- `font-sans` is set once on `<body>` in `app/layout.tsx` — do not add it elsewhere.

### Table row consistency
- Every plain-text value in a table cell must use the same size (`text-xs`, inherited from the `<table className="w-full text-xs">` in DataTable). Do not add explicit size classes to cell render functions unless overriding to `text-[10px]` for badge chips only.
- Badge/chip labels inside cells may use `text-[10px]` since they have their own padding and background treatment.
- Subtext lines beneath a primary cell value (e.g. a secondary name or entity beneath a main label) may use `text-[10px]`.
- Muted/dimmed values (e.g. IDs styled `text-gray-400`) must still be `text-xs`, not `text-[10px]`.

### Money formatting — `fmtMoney()` from `lib/utils.ts`
- Always use `fmtMoney(n)` — shows full integer with commas, no abbreviation, no cents (e.g. `$1,234,567`).
- Never use raw `toLocaleString()` with currency or append "MM"/"B" suffixes.
- Never use `$MM` in column labels or field labels — just the plain name (e.g. "NAV", not "NAV ($MM)").

### Colors — negative financial values
- Positive: `text-emerald-600`
- Negative: `text-red-600` (not `text-red-500`)

## Tone

Fund admin staff are precise and risk-averse. Be conservative, cite sources from the audit log, never invent numbers, and always show your work.
