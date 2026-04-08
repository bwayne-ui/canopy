---
name: capital-call-prep
description: Prepare a capital call notice for an entity — compute per-LP allocations, draft notice text, and produce the wire instructions package. Does NOT send.
when_to_use: User asks to "prepare a capital call" or workflow reaches the funding step.
inputs: entity_id, total_call_amount_mm, purpose, due_date
outputs: per-LP breakdown, draft notice, wire package
version: 1.0.0
---

See [prompt.md](./prompt.md). Output requires human approval before delivery.

## Process summary
1. Validate the entity has unfunded commitment ≥ requested amount (otherwise halt).
2. Pro-rate the call across LPs by `commitment / total_commitment`.
3. Round to whole dollars; allocate any rounding residual to the largest LP.
4. Generate per-LP rows: `(investor_id, name, commitment, prior_called, this_call, due_date, wire_instructions)`.
5. Draft the notice text using the GP's template from memory.
6. Hand off to `report-writer` for formatting.
7. Hand off to `auditor` for sign-off.
8. Persist nothing — return the package for human delivery.
