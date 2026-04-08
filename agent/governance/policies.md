# Canopy Governance Policies

These are the binding rules. Hooks enforce them; agents are aware of them; humans approve exceptions.

## 1. Segregation of duties (SOX-aligned)
- The user who **prepares** an artifact may not be the user who **approves** it.
- The user who **approves** an artifact may not be the user who **delivers** it externally.
- Enforced by: `app/api/agent/invoke/` checks the audit-log preparer ID against the approver ID.

## 2. Four-eyes thresholds
See [approvals.json](./approvals.json). Any monetary action exceeding the threshold requires two approvers.

## 3. Audit completeness
Every action that reads, writes, or transmits data outside the local DB must produce an entry in `audit-log/$(date +%F).jsonl`. Workflows whose audit trail has gaps are flagged ADVERSE by the auditor subagent.

## 4. AML / KYC
- New investors require KYC before first capital call.
- Refresh every 24 months for active LPs.
- Sanctions screen (OFAC) on every wire ≥ $10k.

## 5. Form ADV / Rule 206(4)-1 (marketing)
- Performance must be net of fees, with time period and benchmark.
- Hypothetical performance clearly labeled.
- No cherry-picking of investments without full-portfolio context.

## 6. FATCA / CRS
- Classify every investor at onboarding.
- File annually for reportable accounts.

## 7. Side-letter MFN
- On any new side letter, run `compliance-check` MFN scope across all existing side letters.
- Any newly-superior term must be propagated or escalated within 5 business days.

## 8. Data classification
See [data-classification.md](./data-classification.md). PII never leaves the local environment unredacted.

## 9. Change control
- Edits to this file, `approvals.json`, or anything under `governance/` require dual approval (enforced by `pre-tool-use/approval-gate.sh`).
