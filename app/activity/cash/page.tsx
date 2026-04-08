'use client';

import PageHeader from '@/components/PageHeader';
import MetricCard from '@/components/MetricCard';
import DataTable, { Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { Wallet, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { fmtMoney } from '@/lib/utils';

const movements = [
  { id: 'CM-001', date: '2026-04-05', type: 'Inflow', description: 'Capital Call Receipt — Walker III', account: 'JPM Operating', amount: 18500000, currency: 'USD', counterparty: 'Walker LPs', status: 'Settled' },
  { id: 'CM-002', date: '2026-04-04', type: 'Outflow', description: 'Distribution Payment — White Credit V', account: 'Citi Dist. Acct', amount: -2750000, currency: 'USD', counterparty: 'White LPs', status: 'Pending' },
  { id: 'CM-003', date: '2026-04-04', type: 'Outflow', description: 'Management Fee — Campbell IV', account: 'JPM Operating', amount: -312000, currency: 'USD', counterparty: 'Campbell GP LLC', status: 'Settled' },
  { id: 'CM-004', date: '2026-04-03', type: 'Inflow', description: 'Interest Income — Money Market', account: 'Goldman Sachs MM', amount: 42500, currency: 'USD', counterparty: 'Goldman Sachs', status: 'Settled' },
  { id: 'CM-005', date: '2026-04-03', type: 'Outflow', description: 'Wire — PwC Audit Deposit', account: 'JPM Operating', amount: -75000, currency: 'USD', counterparty: 'PricewaterhouseCoopers', status: 'Settled' },
  { id: 'CM-006', date: '2026-04-02', type: 'Inflow', description: 'Fee Income — Sullivan Alpha', account: 'BofA Fee Acct', amount: 185000, currency: 'USD', counterparty: 'Sullivan Alpha LP', status: 'Settled' },
  { id: 'CM-007', date: '2026-04-02', type: 'Outflow', description: 'Credit Facility Repayment — Cruz II', account: 'JPM Operating', amount: -5000000, currency: 'USD', counterparty: 'Morgan Stanley', status: 'Settled' },
  { id: 'CM-008', date: '2026-04-01', type: 'Inflow', description: 'Dividend Income — Equity Portfolio', account: 'Goldman Sachs MM', amount: 127500, currency: 'USD', counterparty: 'Various', status: 'Settled' },
  { id: 'CM-009', date: '2026-04-01', type: 'Outflow', description: 'K&E Legal Retainer', account: 'JPM Operating', amount: -45000, currency: 'USD', counterparty: 'Kirkland & Ellis', status: 'Settled' },
  { id: 'CM-010', date: '2026-03-31', type: 'Inflow', description: 'Capital Call Receipt — Rodriguez EM FoF', account: 'BofA Fee Acct', amount: 8200000, currency: 'USD', counterparty: 'Rodriguez LPs', status: 'Settled' },
  { id: 'CM-011', date: '2026-03-31', type: 'Outflow', description: 'Payroll — March 2026', account: 'JPM Operating', amount: -892000, currency: 'USD', counterparty: 'ADP Payroll', status: 'Settled' },
  { id: 'CM-012', date: '2026-03-30', type: 'Inflow', description: 'FX Conversion — EUR to USD', account: 'Citi FX Acct', amount: 3400000, currency: 'USD', counterparty: 'Citibank FX Desk', status: 'Settled' },
];

const inflows = movements.filter((m) => m.amount > 0).reduce((s, m) => s + m.amount, 0);
const outflows = movements.filter((m) => m.amount < 0).reduce((s, m) => s + Math.abs(m.amount), 0);

const columns: Column[] = [
  { key: 'date', label: 'Date', sortable: true, render: (v) => <span className="font-mono text-[11px]">{v}</span> },
  { key: 'type', label: 'Type', render: (v) => <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${v === 'Inflow' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>{v}</span> },
  { key: 'description', label: 'Description', sortable: true, render: (v) => <span className="font-medium text-gray-900">{v}</span> },
  { key: 'account', label: 'Account', sortable: true },
  { key: 'amount', label: 'Amount', align: 'right', sortable: true, render: (v) => <span className={`font-mono text-[11px] ${v >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{v >= 0 ? '+' : ''}{fmtMoney(Math.abs(v))}</span> },
  { key: 'counterparty', label: 'Counterparty', sortable: true },
  { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
];

export default function CashActivityPage() {
  return (
    <div className="space-y-5">
      <PageHeader title="Cash Activity" subtitle="Cash movements and settlement tracking" breadcrumbs={[{ label: 'Activity' }, { label: 'Cash' }]} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard title="Total Movements" value={movements.length} icon={<Activity className="w-4 h-4" />} color="teal" />
        <MetricCard title="Total Inflows" value={fmtMoney(inflows)} icon={<ArrowUpRight className="w-4 h-4" />} color="green" />
        <MetricCard title="Total Outflows" value={fmtMoney(outflows)} icon={<ArrowDownRight className="w-4 h-4" />} color="red" />
        <MetricCard title="Net Flow" value={fmtMoney(inflows - outflows)} icon={<Wallet className="w-4 h-4" />} color="signal" />
      </div>
      <DataTable columns={columns} data={movements} searchPlaceholder="Search cash movements..." />
    </div>
  );
}
