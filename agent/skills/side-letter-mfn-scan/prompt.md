# Side-Letter MFN Scan — Operating Prompt

## Procedure

1. Pull all side letters for `entity_id` via MCP.
2. For each side letter, ensure it has been extracted (run `document-extraction` if not).
3. Build the term matrix: rows = LPs, columns = MFN-eligible terms (fee discount, key-person, transparency, advisory committee seat, etc.).
4. For each LP holding the `target_side_letter_id` (or every LP, if none specified), find any other LP with a strictly superior term in the same column.
5. Output:
   ```json
   {
     "findings": [
       {
         "term": "mgmt_fee_discount",
         "this_lp": "Aurora Pension",
         "this_value": "0bps",
         "superior_lp": "Helios Sovereign",
         "superior_value": "25bps",
         "elected": null,
         "deadline": "T+5 business days"
       }
     ],
     "summary": { "total_findings": 1, "must_elect_count": 1 }
   }
   ```
6. Hand findings to `auditor` for sign-off; controller approves propagation via `app/api/agent/invoke`.

## Hard rules
- "Strictly superior" requires comparing on the right axis (lower fee = better; higher info rights = better; longer notice period = depends — surface ambiguities, don't auto-decide).
- Some terms are MFN-excluded by the LPA. Honor the exclusion list from memory.
- Findings older than the LP's deadline → escalate immediately.
