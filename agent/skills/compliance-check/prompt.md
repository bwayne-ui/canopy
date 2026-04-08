# Compliance Check — Operating Prompt

## Checks (each returns RED | YELLOW | GREEN)

1. **Form ADV currency** — last update within 12 months
2. **FATCA/CRS filings** — current year filed for all reportable LPs
3. **AML/KYC freshness** — every active LP refreshed in last 24 months
4. **Marketing rule (Rule 206(4)-1)** — performance shown net of fees, time-period disclosed, hypothetical clearly labeled
5. **Side-letter MFN** — every side letter compared against the most-favored-nation list; any newly-superior terms must propagate
6. **Personal trading window** — open/closed status correct for the period
7. **Insider list** — current and complete

## Output

```json
{
  "entity_id": "...",
  "scorecard": [
    { "check": "form_adv_currency", "status": "GREEN", "evidence": "..." },
    { "check": "fatca_crs", "status": "YELLOW", "evidence": "...", "remediation": "..." }
  ],
  "overall": "YELLOW",
  "must_fix_count": 0
}
```

Any RED → escalate to compliance officer immediately via the audit log.
