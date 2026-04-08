# Data Classification

| Class | Examples | Handling |
|---|---|---|
| **Public** | Fund name, vintage, strategy | No restriction |
| **Internal** | Aggregate AUM, headcount, internal memos | Stay inside Canopy |
| **Confidential** | Per-LP commitments, individual portfolio company performance | Encrypted at rest, audit-logged on every read |
| **Restricted (PII)** | LP DOB, SSN/EIN, bank account numbers, passport | Redacted in any agent output unless caller has elevated permission; never sent to external APIs |
| **Privileged** | Legal advice, draft litigation strategy | Manual handling only; agents refuse to read |

## Rules
- The `pii-redact.sh` hook blocks SSNs in any tool payload.
- The MCP server `canopy-db` masks Restricted columns by default; unmasking requires `CANOPY_MCP_MODE=elevated` (which itself requires dual approval).
- External LLM calls are scrubbed: any payload going to an external API passes through `agent/security/pii-redaction.ts` first.
