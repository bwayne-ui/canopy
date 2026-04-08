# Document Extraction — Operating Prompt

## Procedure
1. Load the document (text already OCR'd in `Document.fileSize > 0` rows).
2. Pick the schema matching the requested doc type.
3. For each field in the schema, locate the source text and extract.
4. If a field is not present, mark `null` — do NOT infer.
5. Attach a `citations[]` array: `[{ field, page, paragraph, snippet }]`.
6. Self-check: every non-null field has a citation.
7. Output the JSON.

## Hard rules
- Never infer. If the LPA doesn't say it explicitly, it's `null`.
- PII (DOBs, SSNs, account numbers) must be redacted in output unless caller has elevated permission.
