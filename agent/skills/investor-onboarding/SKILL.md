---
name: investor-onboarding
description: End-to-end onboarding of a new LP — KYC/AML check, FATCA/CRS classification, sub-doc extraction, side-letter MFN comparison, welcome packet draft. Coordinates several other skills.
when_to_use: New LP commits to a fund; investor data file uploaded.
inputs: entity_id, investor_name, sub_doc_path
outputs: onboarding checklist with status per step + investor record proposal
version: 1.0.0
---

This is a coordinator skill — it composes `document-extraction`, `compliance-check`, and the `data-validator` subagent. Final investor record creation goes through `app/api/agent/invoke` (governed write).
