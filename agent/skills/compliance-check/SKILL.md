---
name: compliance-check
description: Run the regulatory compliance battery for an entity — Form ADV, FATCA/CRS, AML/KYC, marketing rule, side-letter MFN. Returns red/yellow/green per item.
when_to_use: Annual review, new investor onboarding, marketing material approval, audit prep.
inputs: entity_id, scope (full|incremental)
outputs: compliance scorecard
version: 1.0.0
---

Checks driven by [agent/governance/policies.md](../../governance/policies.md). New checks are added there, not here.
