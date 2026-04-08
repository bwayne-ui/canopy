---
name: side-letter-mfn-scan
description: Compare a new (or existing) side letter against all other side letters in the same fund family to identify Most-Favored-Nation triggers. Surfaces terms that must be propagated.
when_to_use: New side letter signed, annual side-letter review, audit prep.
inputs: entity_id, target_side_letter_id (optional — if absent, scans the full set)
outputs: MFN findings table with propagation recommendations
version: 1.0.0
---

Reads side-letter terms from `Document` rows where `documentType == 'Side Letter'` and structured-extracted via the `document-extraction` skill.
