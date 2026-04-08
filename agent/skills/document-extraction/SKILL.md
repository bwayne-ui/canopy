---
name: document-extraction
description: Extract structured data from fund documents — LPAs, side letters, subscription agreements, PCAPs. Returns typed JSON with citations to page/paragraph.
when_to_use: New document upload to docs-vault; LPA term lookup; side-letter MFN comparison.
inputs: document_id (or path), schema (LPA|SideLetter|SubAgmt|PCAP)
outputs: extracted JSON + page/paragraph citations
version: 1.0.0
---

Each schema is defined in `agent/skills/document-extraction/schemas/`. The output must be 100% citation-backed — no inferred fields.
