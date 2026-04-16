/**
 * PositionBot — TypeScript port of PositionBot/webapp/src/utils/fileParser.js
 *
 * Parses JSQ Position Export and Ownership Transfer Report files (xlsx/csv).
 * All parsing is done on the server side from Buffer input (Node runtime).
 */

import * as XLSX from 'xlsx';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface JsqPosition {
  position_id: string;
  account_id: string;
  account_name: string;
  entity: string;
  committed: number;
  currency: string;
  commitment_date: string;
  investor_group: string;
  status: string;
  contacts: string;
  account_street: string;
  account_city: string;
  account_state: string;
  account_postal: string;
  account_country: string;
}

export interface OwnershipRow {
  entity: string;
  change_type: string;
  investor_group: string;
  ownership_metric: string;
  to_position_id: string;
  to_account_name: string;
  from_position_id: string;
  from_account_name: string;
  date: string;
  change_amount: number;
  notes: string;
}

export interface InvestranRosterRow {
  legal_entity_domain: string;
  legal_entity: string;
  vehicle: string;
  investor: string;
  jsq_position_id: string;
  jsq_arena_id: string;
  specific_investor_id: string;
}

export interface InvestranLegalEntity {
  legal_entity_id: string | null;
  legal_entity: string;
  legal_entity_domain: string;
  legal_entity_currency: string;
  fiscal_year_end: string;
}

export interface ValidationIssue {
  positionId: string;
  accountName: string;
  issueType: 'duplicate' | 'soft_duplicate' | 'missing_required' | 'invalid_amount' | 'fuzzy_match';
  severity: 'error' | 'warning';
  message: string;
  autoResolved?: boolean;
  resolution?: string;
}

export interface ValidationResult {
  total: number;
  passed: number;
  issues: ValidationIssue[];
  canProceed: boolean;
}

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

function formatDateValue(val: unknown): string {
  if (!val) return '';
  if (val instanceof Date) {
    return val.toISOString().slice(0, 10);
  }
  const s = String(val);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return '';
}

// ---------------------------------------------------------------------------
// Parsers (server-side, Buffer input)
// ---------------------------------------------------------------------------

export function parseJsqPositions(buffer: Buffer): JsqPosition[] {
  const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: null });

  return raw.map((row) => ({
    position_id: String(row['Position ID'] ?? ''),
    account_id: String(row['Account ID'] ?? ''),
    account_name: String(row['Account legal name'] ?? ''),
    entity: String(row['Entity'] ?? ''),
    committed: Number(row['Committed'] ?? 0),
    currency: String(row['Currency'] ?? 'USD'),
    commitment_date: formatDateValue(row['Initial commitment date']),
    investor_group: String(row['Investor group'] ?? 'LP'),
    status: String(row['Status'] ?? 'Active'),
    contacts: String(row['Contacts'] ?? ''),
    account_street: String(row['Account street'] ?? ''),
    account_city: String(row['Account city'] ?? ''),
    account_state: String(row['Account state'] ?? ''),
    account_postal: String(row['Account postal code'] ?? ''),
    account_country: String(row['Account country'] ?? ''),
  }));
}

export function parseOwnershipReport(buffer: Buffer): OwnershipRow[] {
  const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: null });

  return raw.map((row) => ({
    entity: String(row['Entity'] ?? ''),
    change_type: String(row['Change type'] ?? ''),
    investor_group: String(row['Investor Group'] ?? ''),
    ownership_metric: String(row['Ownership metric'] ?? ''),
    to_position_id: String(row['To position ID'] ?? ''),
    to_account_name: String(row['To account name'] ?? ''),
    from_position_id: String(row['From position ID'] ?? ''),
    from_account_name: String(row['From account name'] ?? ''),
    date: formatDateValue(row['Date']),
    change_amount: Number(row['Change amount'] ?? 0),
    notes: String(row['Notes'] ?? ''),
  }));
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function validateEntities(
  positions: JsqPosition[],
  roster: InvestranRosterRow[]
): ValidationResult {
  const issues: ValidationIssue[] = [];
  const entityName = positions[0]?.entity ?? '';
  const entityRoster = roster.filter((r) => r.legal_entity === entityName);
  const existingPosIds = new Set(entityRoster.map((r) => r.jsq_position_id).filter(Boolean));

  for (const pos of positions) {
    // Duplicate position ID
    if (existingPosIds.has(pos.position_id)) {
      issues.push({
        positionId: pos.position_id,
        accountName: pos.account_name,
        issueType: 'duplicate',
        severity: 'error',
        message: `Position ${pos.position_id} already exists in Investran for entity ${entityName}`,
      });
      continue;
    }

    // Soft duplicate (same investor name, different ID)
    const softDup = entityRoster.find(
      (r) =>
        r.jsq_position_id !== pos.position_id &&
        normalize(r.investor) === normalize(pos.account_name)
    );
    if (softDup) {
      issues.push({
        positionId: pos.position_id,
        accountName: pos.account_name,
        issueType: 'soft_duplicate',
        severity: 'warning',
        message: `Possible duplicate: "${pos.account_name}" matches existing investor "${softDup.investor}" (different Position ID)`,
      });
    }

    // Missing required fields
    if (!pos.account_name || !pos.position_id || !pos.entity) {
      issues.push({
        positionId: pos.position_id,
        accountName: pos.account_name || '(blank)',
        issueType: 'missing_required',
        severity: 'error',
        message: 'Missing required field: account_name, position_id, or entity',
      });
    }

    // Invalid amount
    if (pos.committed <= 0) {
      issues.push({
        positionId: pos.position_id,
        accountName: pos.account_name,
        issueType: 'invalid_amount',
        severity: 'warning',
        message: `Commitment amount is ${pos.committed} — expected positive value`,
      });
    }
  }

  return {
    total: positions.length,
    passed: positions.length - issues.filter((i) => i.severity === 'error').length,
    issues,
    canProceed: !issues.some((i) => i.severity === 'error'),
  };
}
