// agent/security/pii-redaction.ts
// Scrub PII from any string before it leaves the local environment.
// Used by lib/agent-client.ts to sanitize prompts/tool payloads sent to external LLMs.

const SSN = /\b\d{3}-\d{2}-\d{4}\b/g;
const EIN = /\b\d{2}-\d{7}\b/g;
const ACCT = /(?<![=:0-9])\d{12,17}(?!\d)/g;
const EMAIL = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
const PHONE = /\b\(?\d{3}\)?[-. ]?\d{3}[-. ]?\d{4}\b/g;
const DOB = /\b(0[1-9]|1[0-2])[\/\-](0[1-9]|[12]\d|3[01])[\/\-](19|20)\d{2}\b/g;

export interface RedactionReport {
  redacted: string;
  counts: Record<string, number>;
}

export function redactPII(input: string): RedactionReport {
  const counts: Record<string, number> = { ssn: 0, ein: 0, acct: 0, email: 0, phone: 0, dob: 0 };
  let out = input;
  out = out.replace(SSN, () => { counts.ssn++; return '[REDACTED-SSN]'; });
  out = out.replace(EIN, () => { counts.ein++; return '[REDACTED-EIN]'; });
  out = out.replace(ACCT, () => { counts.acct++; return '[REDACTED-ACCT]'; });
  out = out.replace(EMAIL, () => { counts.email++; return '[REDACTED-EMAIL]'; });
  out = out.replace(PHONE, () => { counts.phone++; return '[REDACTED-PHONE]'; });
  out = out.replace(DOB, () => { counts.dob++; return '[REDACTED-DOB]'; });
  return { redacted: out, counts };
}

export function isClean(input: string): boolean {
  const r = redactPII(input);
  return Object.values(r.counts).every((c) => c === 0);
}
