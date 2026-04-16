'use client';

import { useEffect, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import MetricCard from '@/components/MetricCard';
import DataTable, { Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { fmtMoney, fmtDate } from '@/lib/utils';

const accountColumns: Column[] = [
  { key: 'accountId', label: 'Account ID', render: (v: string) => <span className="text-sm">{v}</span> },
  { key: 'accountName', label: 'Name', sortable: true, render: (v: string) => <span className="font-medium text-gray-900">{v}</span> },
  { key: 'accountType', label: 'Type', sortable: true },
  { key: 'institution', label: 'Institution', sortable: true },
  { key: 'currentBalance', label: 'Balance', align: 'right', sortable: true, render: (v: number) => <span className={`font-medium ${v >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fmtMoney(v)}</span> },
  { key: 'availableBalance', label: 'Available', align: 'right', render: (v: number) => <span className="">{fmtMoney(v)}</span> },
  { key: 'pendingInflows', label: 'Inflows', align: 'right', render: (v: number) => v > 0 ? <span className="text-emerald-600">{fmtMoney(v)}</span> : <span className="text-gray-300">—</span> },
  { key: 'pendingOutflows', label: 'Outflows', align: 'right', render: (v: number) => v > 0 ? <span className="text-red-600">{fmtMoney(v)}</span> : <span className="text-gray-300">—</span> },
  { key: 'entityName', label: 'Entity', render: (v: string | null) => v || '—' },
  { key: 'status', label: 'Status', render: (v: string) => <StatusBadge status={v} /> },
];

const cashFlowColumns: Column[] = [
  { key: 'transactionDate', label: 'Date', sortable: true, render: (v: string) => <span className="whitespace-nowrap">{fmtDate(v)}</span> },
  { key: 'flowType', label: 'Type', render: (v: string) => <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${v === 'Inflow' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{v}</span> },
  { key: 'category', label: 'Category', sortable: true },
  { key: 'amount', label: 'Amount', align: 'right', sortable: true, render: (v: number, row: any) => <span className={`font-medium ${row.flowType === 'Inflow' ? 'text-emerald-600' : 'text-red-600'}`}>{fmtMoney(Math.abs(v))}</span> },
  { key: 'accountName', label: 'Account', sortable: true },
  { key: 'entityName', label: 'Entity', render: (v: string | null) => v || '—' },
  { key: 'counterparty', label: 'Counterparty', render: (v: string | null) => v || '—' },
  { key: 'description', label: 'Description', render: (v: string | null) => v ? <span className="max-w-[200px] truncate block" title={v}>{v}</span> : '—' },
  { key: 'status', label: 'Status', render: (v: string) => <StatusBadge status={v} /> },
];

export default function TreasuryPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [cashFlows, setCashFlows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/treasury')
      .then((r) => r.json())
      .then((d) => { setAccounts(d.accounts ?? []); setCashFlows(d.cashFlows ?? []); })
      .finally(() => setLoading(false));
  }, []);

  const totalBalance = accounts.reduce((s, a) => s + a.currentBalance, 0);
  const totalInflows = accounts.reduce((s, a) => s + a.pendingInflows, 0);
  const totalOutflows = accounts.reduce((s, a) => s + a.pendingOutflows, 0);
  const activeAccounts = accounts.filter((a) => a.status === 'Active').length;

  if (loading) return <div className="flex items-center justify-center h-96"><div className="animate-pulse text-gray-400">Loading Treasury...</div></div>;

  return (
    <div className="space-y-5">
      <PageHeader title="Treasury Center" subtitle="Cash management and treasury operations" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard title="Total Balance" value={fmtMoney(totalBalance)} color="green" />
        <MetricCard title="Pending Inflows" value={fmtMoney(totalInflows)} color="signal" />
        <MetricCard title="Pending Outflows" value={fmtMoney(totalOutflows)} color="red" />
        <MetricCard title="Active Accounts" value={activeAccounts} color="teal" />
      </div>

      <div>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Treasury Accounts</h2>
        <DataTable columns={accountColumns} data={accounts} searchPlaceholder="Search accounts..." />
      </div>

      <div>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Recent Cash Flows</h2>
        <DataTable columns={cashFlowColumns} data={cashFlows} searchPlaceholder="Search cash flows..." />
      </div>
    </div>
  );
}
