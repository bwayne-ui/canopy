# Canopy Agent Memory — Index

This directory persists context the agent has learned across sessions. Each entry is a standalone file; this index is the discovery surface.

## How to use
- **Read first.** Before starting work on a client/entity, scan the relevant entries below.
- **Write often.** Each new fact, correction, or validated playbook → its own file → indexed here.
- **Update, don't append.** If a fact changes, edit the existing file rather than creating a new one.
- **Index lines are ≤ 150 chars.** Format: `- [Title](path) — one-line hook`.

## Clients (per-GP)
- [Walker Capital](clients/walker-capital.md) — primary contact Diana Smith; uses European waterfall standard
- [Sullivan Asset Mgmt](clients/sullivan-asset-mgmt.md) — quarterly NAV; multi-currency; deal-by-deal carry

## Entities (per-fund)
- [WALKER-III](entities/walker-iii.md) — $487M NAV; PE growth; 8% pref / 20% carry / 100% catchup
- [CRUZ-II](entities/cruz-ii.md) — VC fund; deal-by-deal; SAFE-heavy portfolio

## Feedback (user corrections)
- [decimal-precision-rule](feedback/decimal-precision-rule.md) — never round before final output
- [waterfall-cite-lpa](feedback/waterfall-cite-lpa.md) — always cite LPA section, not generic templates

## Playbooks (validated workflows)
- [monthly-close-playbook](playbooks/monthly-close.md) — refined sequence after Jan 2026 retrospective
