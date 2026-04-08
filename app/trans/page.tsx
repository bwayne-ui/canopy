'use client';

import { useState, useEffect, useMemo } from 'react';
import PageHeader from '@/components/PageHeader';
import MetricCard from '@/components/MetricCard';
import DataTable, { Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { fmtMoney, fmtDate } from '@/lib/utils';

interface CashFlow {
  cashFlowId: string;
  flowType: string;
  category: string;
  amount: number;
  accountName: string;
  entityName: string;
  counterparty: string;
  description: string;
  transactionDate: string;
  status: string;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<CashFlow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/treasury')
      .then((r) => r.json())
      .then((d) => setTransactions(d.cashFlows ?? []))
      .catch(() => setTransactions([]))
      .finally(() => setLoading(false));
  }, []);

  const totalCount = transactions.length;
  const settledCount = useMemo(() => transactions.filter((t) => t.status === 'Settled').length, [transactions]);
  const pendingCount = useMemo(() => transactions.filter((t) => t.status === 'Pending').length, [transactions]);
  const totalVolume = useMemo(() => transactions.reduce((s, t) => s + Math.abs(t.amount), 0), [transactions]);

  const columns: Column[] = [
    {
      key: 'transactionDate',
      label: 'Date',
      sortable: true,
      render: (v: string) => fmtDate(v),
    },
    {
      key: 'flowType',
      label: 'Flow Type',
      sortable: true,
      render: (v: string) => (
        <span
          className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${
            v === 'Inflow' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
          }`}
        >
          {v}
        </span>
      ),
    },
    { key: 'category', label: 'Category', sortable: true },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      align: 'right',
      render: (v: number) => (
        <span className={v >= 0 ? 'text-emerald-600' : 'text-red-600'}>{fmtMoney(v)}</span>
      ),
    },
    { key: 'accountName', label: 'Account', sortable: true },
    { key: 'entityName', label: 'Entity', sortable: true },
    { key: 'counterparty', label: 'Counterparty', sortable: true },
    { key: 'description', label: 'Description' },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (v: string) => <StatusBadge status={v} />,
    },
  ];

  if (loading) {
    return (
      <div className="p-6">
        <PageHeader title="Transactions" subtitle="Unified transaction ledger across all fund accounts" />
        <div className="text-gray-400 text-sm mt-8">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      <PageHeader title="Transactions" subtitle="Unified transaction ledger across all fund accounts" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard title="Total Transactions" value={String(totalCount)} color="teal" />
        <MetricCard title="Settled" value={String(settledCount)} color="green" />
        <MetricCard title="Pending" value={String(pendingCount)} color="amber" />
        <MetricCard title="Total Volume" value={fmtMoney(totalVolume)} color="teal" />
      </div>

      <DataTable
        columns={columns}
        data={transactions}
        searchable
        searchPlaceholder="Search transactions..."
      />
    </div>
  );
}
