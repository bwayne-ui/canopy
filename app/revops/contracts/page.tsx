'use client';

import { useEffect, useState, useMemo } from 'react';
import PageHeader from '@/components/PageHeader';
import MetricCard from '@/components/MetricCard';
import DataTable, { Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { fmtMoney } from '@/lib/utils';

interface ContractRow {
  id: string;
  contractId: string;
  name: string;
  accountName: string;
  contractType: string;
  status: string;
  annualValue: number | null;
  totalValue: number | null;
  billingFrequency: string;
  startDate: string | null;
  endDate: string | null;
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState<ContractRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/revops/contracts')
      .then((r) => r.json())
      .then((res) => setContracts(res.items ?? []))
      .finally(() => setLoading(false));
  }, []);

  const metrics = useMemo(() => {
    const total = contracts.length;
    const active = contracts.filter((c) => c.status === 'Active');
    const activeCount = active.length;
    const totalArr = active.reduce((s, c) => s + (c.annualValue ?? 0), 0);
    const avgArr = activeCount > 0 ? totalArr / activeCount : 0;
    return { total, activeCount, totalArr, avgArr };
  }, [contracts]);

  const columns: Column[] = [
    {
      key: 'contractId',
      label: 'Contract ID',
      sortable: true,
      render: (v: string) => (
        <span className="font-mono text-[10px] text-gray-500">{v}</span>
      ),
    },
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (v: string) => <span className="font-semibold text-gray-900">{v}</span>,
    },
    {
      key: 'accountName',
      label: 'Account',
      sortable: true,
      render: (v: string) => <span>{v}</span>,
    },
    {
      key: 'contractType',
      label: 'Type',
      sortable: true,
      render: (v: string) => <span>{v}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (v: string) => <StatusBadge status={v} />,
    },
    {
      key: 'annualValue',
      label: 'ARR',
      sortable: true,
      align: 'right',
      render: (v: number | null) =>
        v != null ? (
          <span className="font-mono text-emerald-600 font-semibold">{fmtMoney(v)}</span>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      key: 'totalValue',
      label: 'TCV',
      sortable: true,
      align: 'right',
      render: (v: number | null) =>
        v != null ? (
          <span className="font-mono font-semibold">{fmtMoney(v)}</span>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      key: 'billingFrequency',
      label: 'Billing Freq',
      sortable: true,
      render: (v: string) => <span>{v}</span>,
    },
    {
      key: 'startDate',
      label: 'Start–End',
      render: (_v, row: ContractRow) => (
        <span className="font-mono text-[10px] text-gray-500 whitespace-nowrap">
          {row.startDate ? row.startDate.slice(0, 10) : '—'}
          {' → '}
          {row.endDate ? row.endDate.slice(0, 10) : '—'}
        </span>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-gray-400 text-xs">Loading contracts…</div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Contracts"
        breadcrumbs={[{ label: 'Revenue Ops', href: '/revops' }, { label: 'Contracts' }]}
      />

      <div className="grid grid-cols-4 gap-3 mb-4">
        <MetricCard title="Total Contracts" value={metrics.total} color="teal" />
        <MetricCard title="Active" value={metrics.activeCount} color="green" />
        <MetricCard title="Total ARR" value={fmtMoney(metrics.totalArr)} color="signal" />
        <MetricCard title="Avg ARR" value={fmtMoney(metrics.avgArr)} color="amber" />
      </div>

      <DataTable
        columns={columns}
        data={contracts}
        searchable
        searchPlaceholder="Search contracts…"
        emptyMessage="No contracts found."
      />
    </div>
  );
}
