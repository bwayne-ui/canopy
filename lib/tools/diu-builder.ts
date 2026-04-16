/**
 * DIU Builder — TypeScript port of PositionBot/webapp/src/utils/diuBuilder.js
 *
 * Transforms validated JSQ positions into a 4-tab DIU Excel workbook.
 */

import * as XLSX from 'xlsx';
import type { JsqPosition, OwnershipRow, InvestranLegalEntity } from './position-parser';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DiuArena {
  name: string;
  id?: string;
}

export interface DiuData {
  'Investor Account': Record<string, unknown>[];
  'Vehicle Account': Record<string, unknown>[];
  'Legal Account': Record<string, unknown>[];
  'Contact': Record<string, unknown>[];
}

export interface CheckResult {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
}

// ---------------------------------------------------------------------------
// Build DIU data object from positions + ownership
// ---------------------------------------------------------------------------

export function buildDiuData(
  positions: JsqPosition[],
  ownership: OwnershipRow[],
  arena: DiuArena,
  legalEntities?: InvestranLegalEntity[]
): DiuData | null {
  if (!positions || positions.length === 0) return null;

  const domain = arena.name || 'Unknown';
  const entityName = positions[0].entity;
  const investorGroup = positions[0].investor_group || 'LP';
  const vehicleName = `${entityName}-${investorGroup}`;

  // Fiscal year-end fallback
  let fiscalYearEnd = '2026-12-31';
  if (legalEntities && legalEntities.length > 0) {
    const fy = legalEntities[0].fiscal_year_end;
    if (fy) fiscalYearEnd = fy;
  }

  // Date lookup from ownership (Initial commitment records)
  const dateLookup: Record<string, string> = {};
  if (ownership) {
    ownership
      .filter((o) => o.entity === entityName && o.change_type === 'Initial commitment')
      .forEach((o) => {
        if (o.to_position_id && o.date) dateLookup[o.to_position_id] = o.date;
      });
  }

  const positionsWithDates = positions.map((p) => ({
    ...p,
    effective_date: dateLookup[p.position_id] || p.commitment_date || '',
  }));

  // ── Contact Tab ──
  const contacts: Record<string, unknown>[] = [];
  let contactId = 1;

  // Row 1: entity organisation
  contacts.push({
    'Contact Import ID': contactId++,
    'Contact ID': '',
    'Contact Type': 'Organization',
    'Contact File As': entityName,
    'Contact Domain': domain,
  });

  // Row 2: vehicle organisation
  const vehicleContactId = contactId;
  contacts.push({
    'Contact Import ID': contactId++,
    'Contact ID': '',
    'Contact Type': 'Organization',
    'Contact File As': vehicleName,
    'Contact Domain': domain,
  });

  // Rows 3+: one per investor
  const investorContactMap: Record<string, number> = {};
  for (const p of positions) {
    investorContactMap[p.position_id] = contactId;
    contacts.push({
      'Contact Import ID': contactId++,
      'Contact ID': '',
      'Contact Type': 'Organization',
      'Contact File As': p.account_name,
      'Contact Domain': domain,
    });
  }

  // ── Legal Entity Tab ──
  const legalAccount: Record<string, unknown>[] = [
    {
      'Legal Entity ID': '',
      'JSQ Entity ID': '',
      'Legal Entity': entityName,
      'Legal Entity Domain': domain,
      'Linked Organization Import ID': 1,
      'Linked Organization': entityName,
      'Linked Organization Domain': domain,
      'Legal Entity Currency': '',
      'Requires Investor Allocation': 'Yes',
      'Double-Entry Accounting': 'Yes',
      'Use Year-End Close Process': 'Yes',
      'Fiscal Year-End': fiscalYearEnd,
      'Billing Entity': '',
    },
  ];

  // ── Vehicle Account Tab ──
  const uniqueDates = Array.from(
    new Set(positionsWithDates.map((p) => p.effective_date).filter(Boolean))
  ).sort();

  const vehicleAccount: Record<string, unknown>[] = uniqueDates.map((dt) => ({
    'Legal Entity ID': '',
    'Legal Entity': entityName,
    'Vehicle': vehicleName,
    'Vehicle Domain': domain,
    'Vehicle Linked Contact Import ID': vehicleContactId,
    'Vehicle Linked Contact Domain': domain,
    'Vehicle Account Close Date': dt,
    'Vehicle Display Name': '',
  }));

  // ── Investor Account Tab — sorted by effective_date ──
  const sortedPositions = [...positionsWithDates].sort((a, b) =>
    a.effective_date < b.effective_date ? -1 : a.effective_date > b.effective_date ? 1 : 0
  );

  const investorAccount: Record<string, unknown>[] = sortedPositions.map((p) => ({
    'Legal Entity ID': '',
    'Legal Entity': entityName,
    'Vehicle': vehicleName,
    'JSQ Position ID': Number(p.position_id),
    'Investor': p.account_name,
    'Investor Linked Contact Import ID': investorContactMap[p.position_id],
    'Investor Domain': domain,
    'Investor Commitment Closing Date': p.effective_date,
    'Investor Commitment Commitment Date': p.effective_date,
    'Investor Commitment Amount': p.committed,
    'JSQ Account ID': Number(p.account_id),
    'Is Active': 'Active',
  }));

  return {
    'Investor Account': investorAccount,
    'Vehicle Account': vehicleAccount,
    'Legal Account': legalAccount,
    'Contact': contacts,
  };
}

// ---------------------------------------------------------------------------
// Validation checks (5 checks)
// ---------------------------------------------------------------------------

export function runValidationChecks(data: DiuData): CheckResult[] {
  const investors = data['Investor Account'];
  const vehicles = data['Vehicle Account'];
  const contacts = data['Contact'];

  // Check 1: No duplicate investors
  const investorIds = investors.map((r) => r['JSQ Position ID']);
  const dupIds = investorIds.filter((id, idx) => investorIds.indexOf(id) !== idx);
  const check1: CheckResult = {
    id: 'no_dupes',
    label: 'No duplicate positions',
    passed: dupIds.length === 0,
    detail: dupIds.length === 0
      ? `All ${investors.length} positions are unique`
      : `Duplicate Position IDs: ${dupIds.join(', ')}`,
  };

  // Check 2: Required fields
  const missingRequired = investors.filter(
    (r) => !r['Investor'] || !r['JSQ Position ID'] || !r['Legal Entity']
  );
  const check2: CheckResult = {
    id: 'required_fields',
    label: 'All required fields present',
    passed: missingRequired.length === 0,
    detail: missingRequired.length === 0
      ? 'All investor records have required fields'
      : `${missingRequired.length} record(s) missing required fields`,
  };

  // Check 3: Amount reconciliation (all committed > 0)
  const zeroAmt = investors.filter((r) => Number(r['Investor Commitment Amount'] ?? 0) <= 0);
  const check3: CheckResult = {
    id: 'amount_recon',
    label: 'Commitment amounts valid',
    passed: zeroAmt.length === 0,
    detail: zeroAmt.length === 0
      ? 'All commitment amounts are positive'
      : `${zeroAmt.length} record(s) have zero or negative commitment amounts`,
  };

  // Check 4: Vehicle assignments
  const check4: CheckResult = {
    id: 'vehicle_assignments',
    label: 'Vehicle accounts configured',
    passed: vehicles.length > 0,
    detail: vehicles.length > 0
      ? `${vehicles.length} vehicle account closing date(s) configured`
      : 'No vehicle accounts found — check position dates',
  };

  // Check 5: Contact count matches
  const expectedContacts = investors.length + 2; // entity + vehicle + investors
  const check5: CheckResult = {
    id: 'investor_count',
    label: 'Contact count matches',
    passed: contacts.length === expectedContacts,
    detail: contacts.length === expectedContacts
      ? `${contacts.length} contacts match expected count`
      : `Expected ${expectedContacts} contacts, found ${contacts.length}`,
  };

  return [check1, check2, check3, check4, check5];
}

// ---------------------------------------------------------------------------
// Build Excel buffer
// ---------------------------------------------------------------------------

export function buildDiuExcel(data: DiuData): Buffer {
  const wb = XLSX.utils.book_new();
  const tabs: (keyof DiuData)[] = ['Investor Account', 'Vehicle Account', 'Legal Account', 'Contact'];

  for (const name of tabs) {
    const ws = XLSX.utils.json_to_sheet(data[name]);
    XLSX.utils.book_append_sheet(wb, ws, name);
  }

  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
  return Buffer.from(buf);
}
