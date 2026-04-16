'use client';

import PageHeader from '@/components/PageHeader';
import MetricCard from '@/components/MetricCard';
import DataTable, { Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { BookOpen, ArrowUpRight, ArrowDownRight, AlertCircle } from 'lucide-react';
import { fmtMoney } from '@/lib/utils';

const entries = [
  { id: 'JE-2026-0401', date: '2026-04-01', journalId: 'JE-2026-0401', description: 'Management Fee Accrual — Walker III', account: '4010 — Mgmt Fee Revenue', debit: 425000, credit: 0, status: 'Posted' },
  { id: 'JE-2026-0402', date: '2026-04-01', journalId: 'JE-2026-0402', description: 'Management Fee Accrual — Walker III', account: '1200 — Fees Receivable', debit: 0, credit: 425000, status: 'Posted' },
  { id: 'JE-2026-0403', date: '2026-04-02', journalId: 'JE-2026-0403', description: 'Carried Interest Recognition — Campbell IV', account: '4020 — Carry Revenue', debit: 1850000, credit: 0, status: 'Posted' },
  { id: 'JE-2026-0404', date: '2026-04-02', journalId: 'JE-2026-0404', description: 'Carried Interest Recognition — Campbell IV', account: '2500 — Carry Payable', debit: 0, credit: 1850000, status: 'Posted' },
  { id: 'JE-2026-0405', date: '2026-04-03', journalId: 'JE-2026-0405', description: 'Partner Capital Allocation Q1', account: '3100 — Partner Capital', debit: 0, credit: 3200000, status: 'Under Review' },
  { id: 'JE-2026-0406', date: '2026-04-03', journalId: 'JE-2026-0406', description: 'Partner Capital Allocation Q1', account: '3200 — Retained Earnings', debit: 3200000, credit: 0, status: 'Under Review' },
  { id: 'JE-2026-0407', date: '2026-04-04', journalId: 'JE-2026-0407', description: 'Fund Expense Accrual — Sullivan Alpha', account: '5010 — Fund Admin Expense', debit: 87500, credit: 0, status: 'Posted' },
  { id: 'JE-2026-0408', date: '2026-04-04', journalId: 'JE-2026-0408', description: 'Unrealized Gain — Lopez RE III', account: '1500 — Investments', debit: 4500000, credit: 0, status: 'Pending' },
  { id: 'JE-2026-0409', date: '2026-04-04', journalId: 'JE-2026-0409', description: 'Unrealized Gain — Lopez RE III', account: '4500 — Unrl. Gain/Loss', debit: 0, credit: 4500000, status: 'Pending' },
  { id: 'JE-2026-0410', date: '2026-04-05', journalId: 'JE-2026-0410', description: 'Credit Facility Interest — Cruz II', account: '5200 — Interest Expense', debit: 62500, credit: 0, status: 'Posted' },
  { id: 'JE-2026-0411', date: '2026-04-05', journalId: 'JE-2026-0411', description: 'Distribution Payable — White Credit V', account: '2300 — Dist. Payable', debit: 0, credit: 2750000, status: 'Scheduled' },
  { id: 'JE-2026-0412', date: '2026-04-05', journalId: 'JE-2026-0412', description: 'Audit Fee Accrual — All Funds', account: '5300 — Audit & Tax', debit: 195000, credit: 0, status: 'Posted' },
  { id: 'JE-2026-0413', date: '2026-04-05', journalId: 'JE-2026-0413', description: 'FX Translation Adj — Rodriguez EM FoF', account: '3500 — OCI', debit: 0, credit: 340000, status: 'Under Review' },
  { id: 'JE-2026-0414', date: '2026-04-05', journalId: 'JE-2026-0414', description: 'Organizational Cost Amortization', account: '5400 — Org Costs', debit: 42000, credit: 0, status: 'Posted' },
  { id: 'JE-2026-0415', date: '2026-04-05', journalId: 'JE-2026-0415', description: 'Capital Call Receipt — Walker III', account: '1000 — Cash', debit: 18500000, credit: 0, status: 'Posted' },
];

const totalDebits = entries.reduce((s, e) => s + e.debit, 0);
const totalCredits = entries.reduce((s, e) => s + e.credit, 0);
const unreconciled = entries.filter((e) => e.status !== 'Posted').length;

const columns: Column[] = [
  { key: 'date', label: 'Date', sortable: true, render: (v) => <span className="text-xs">{v}</span> },
  { key: 'journalId', label: 'Journal ID', render: (v) => <span className="text-xs text-gray-400">{v}</span> },
  { key: 'description', label: 'Description', sortable: true, render: (v) => <span className="font-medium text-gray-900">{v}</span> },
  { key: 'account', label: 'Account', sortable: true },
  { key: 'debit', label: 'Debit', align: 'right', sortable: true, render: (v) => v > 0 ? <span className="text-xs">{fmtMoney(v)}</span> : <span className="text-gray-300">—</span> },
  { key: 'credit', label: 'Credit', align: 'right', sortable: true, render: (v) => v > 0 ? <span className="text-xs">{fmtMoney(v)}</span> : <span className="text-gray-300">—</span> },
  { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
];

export default function GLPage() {
  return (
    <div className="space-y-5">
      <PageHeader title="General Ledger" subtitle="Journal entries and accounting activity" breadcrumbs={[{ label: 'Activity' }, { label: 'GL' }]} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard title="Total Entries" value={entries.length} icon={<BookOpen className="w-4 h-4" />} color="teal" />
        <MetricCard title="Total Debits" value={fmtMoney(totalDebits)} icon={<ArrowUpRight className="w-4 h-4" />} color="green" />
        <MetricCard title="Total Credits" value={fmtMoney(totalCredits)} icon={<ArrowDownRight className="w-4 h-4" />} color="signal" />
        <MetricCard title="Unreconciled" value={unreconciled} icon={<AlertCircle className="w-4 h-4" />} color="amber" />
      </div>
      <DataTable columns={columns} data={entries} searchPlaceholder="Search journal entries..." />
    </div>
  );
}
