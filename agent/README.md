# Canopy Agent Layer

This is the **operating layer** for Canopy — configuration, workflows, memory, security, governance, and continuous self-improvement, all in one place. It treats agent setup like infrastructure, not a clever demo.

It runs in two modes that share the same primitives:

1. **Claude Code mode** — fund-admin staff with Claude Code installed. Configured by [`../.claude/`](../.claude/). Slash commands, subagents, hooks, MCP server.
2. **SDK service mode** — non-technical staff click buttons in the existing Canopy Next.js UI. Backed by [`../app/api/agent/*`](../app/api/) routes that import [`../lib/agent-client.ts`](../lib/agent-client.ts).

Both modes load skills from `agent/skills/`, write to `agent/governance/audit-log/`, and follow the rules in `agent/governance/policies.md`. Edit once, both improve.

## Layout

```
agent/
├── skills/           composable capabilities (NAV, K-1, fees, waterfall, …)
├── memory/           persistent context — clients, entities, feedback, playbooks
├── workflows/        multi-step orchestrations (monthly close, quarterly, onboarding)
├── hooks/            guardrails — PII redaction, approval gate, audit log, recovery
├── governance/       policies, approvals, data classification, audit log
├── security/         PII scrubbing, secrets scan, allowlists
├── evaluation/       eval runner + suites + metrics — drives self-improvement
├── learning/         skill proposals, optimization log, retrospectives
└── mcp/canopy-db/    stdio MCP server exposing the Prisma DB read-only
```

## Self-improvement loop

```
workflow run ─▶ retrospective ─▶ eval runner
                                     │
                                     ▼
                              metrics.jsonl
                                     │
                          regression detected?
                              │           │
                              no          yes
                              │           ▼
                              │      skill proposal drafted
                              │           │
                              │      human review
                              │           │
                              ▼           ▼
                       optimization-log promoted to skills/
```

The loop is concrete, not magical: the eval runner is just a TypeScript file that scores cases, appends JSONL, and writes a markdown proposal when a skill regresses. Humans always approve before any change moves into `skills/`.

## Governance highlights

- **Hooks enforce, prompts don't.** The approval gate is a shell script the agent cannot bypass.
- **Audit log is append-only JSONL.** One file per day under `governance/audit-log/`. Easy to grep, easy to ship to a SIEM.
- **Read-only by default.** The MCP server starts in `read-only` mode. Mutations go through `app/api/agent/invoke/` which checks `governance/approvals.json` thresholds and 4-eyes requirements.
- **PII never leaves.** `security/pii-redaction.ts` scrubs every payload before any external LLM call. The `pii-redact.sh` hook blocks SSNs at the tool boundary.

## Quick start

```bash
# 1. Install deps (adds SDK + MCP packages)
npm install

# 2. Make sure hooks are executable
chmod +x agent/hooks/**/*.sh agent/security/*.sh

# 3. Try the eval runner
npx tsx agent/evaluation/runner.ts nav-calculation

# 4. List skills via the API
npm run dev
curl localhost:3001/api/agent/skills

# 5. Invoke a skill (stub mode — no API key needed)
curl -X POST localhost:3001/api/agent/invoke \
  -H 'content-type: application/json' \
  -d '{"skill":"nav-calculation","user":"billywayne","input":{"entity_id":"WALKER-III","period":"2026-03"}}'

# 6. View today's audit log
curl localhost:3001/api/agent/audit | jq

# 7. From Claude Code: /monthly-close WALKER-III 2026-03
```

## Adding a new skill

1. `mkdir agent/skills/<my-skill>/` with `SKILL.md`, `prompt.md`, `examples/`.
2. Add an eval suite under `agent/evaluation/eval-suites/<my-skill>/`.
3. Run `npx tsx agent/evaluation/runner.ts <my-skill>` — should pass.
4. (Optional) Add a slash command under `.claude/commands/<my-skill>.md`.
5. (Optional) Reference it from a workflow in `agent/workflows/`.

That's it. Both Claude Code mode and the SDK service pick it up automatically.

## What's deliberately stubbed

- `lib/agent-client.ts invoke()` does not yet make real LLM calls. It loads the skill, runs the approval gate, audits, and returns a stub. Setting `ANTHROPIC_API_KEY` and uncommenting the SDK block enables live execution.
- `agent/evaluation/runner.ts runCase()` is a stub. With `CANOPY_LLM_KEY` set it would dispatch via the SDK.
- No production auth on `/api/agent/*` — the `user` field is trusted for now. Wire your SSO before exposing to humans.
- `agent/security/secrets-scanning.sh` is wired but not in CI yet.
