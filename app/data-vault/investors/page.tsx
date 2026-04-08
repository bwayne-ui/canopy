'use client';

import { useEffect, useState } from 'react';
import { Users, DollarSign, TrendingUp, UserCheck } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import MetricCard from '@/components/MetricCard';
import DataTable, { Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { fmtMoney } from '@/lib/utils';

interface InvestorRow {
  id: string;
  investorId: string;
  name: string;
  type: string;
  commitmentMm: number;
  navMm: number | null;
  domicile: string;
  entity: string;
  status: string;
}

export default function InvestorsPage() {
  const [data, setData] = useState<InvestorRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/investors')
      .then((r) => r.json())
      .then((res) => setData(res.items ?? []))
      .finally(() => setLoading(false));
  }, []);

  const totalInvestors = data.length;
  const totalCommitments = data.reduce((s, r) => s + (r.commitmentMm ?? 0), 0);
  const avgCommitment = totalInvestors > 0 ? totalCommitments / totalInvestors : 0;
  const activeInvestors = data.filter((r) => r.status === 'Active').length;

  const columns: Column[] = [
    { key: 'investorId', label: 'Investor ID', sortable: true },
    { key: 'name', label: 'Name', sortable: true, render: (v) => <span className="font-semibold">{v}</span> },
    { key: 'type', label: 'Type', sortable: true },
    {
      key: 'commitmentMm',
      label: 'Commitment ($MM)',
      sortable: true,
      align: 'right',
      render: (v) => <span className="font-mono">{fmtMoney(v ?? 0)}</span>,
    },
    {
      key: 'navMm',
      label: 'NAV ($MM)',
      sortable: true,
      align: 'right',
      render: (v) => <span className="font-mono">{v != null ? fmtMoney(v) : '—'}</span>,
    },
    { key: 'domicile', label: 'Domicile', sortable: true },
    { key: 'entity', label: 'Entity', sortable: true },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (v) => <StatusBadge status={v} />,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Investors"
        subtitle="Investor commitments and allocations"
        breadcrumbs={[
          { label: 'Data Vault', href: '/data-vault' },
          { label: 'Investors' },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <MetricCard title="Total Investors" value={totalInvestors.toLocaleString()} icon={<Users className="w-4 h-4" />} color="teal" />
        <MetricCard title="Total Commitments" value={fmtMoney(totalCommitments)} icon={<DollarSign className="w-4 h-4" />} color="green" />
        <MetricCard title="Avg Commitment" value={fmtMoney(avgCommitment)} icon={<TrendingUp className="w-4 h-4" />} color="signal" />
        <MetricCard title="Active Investors" value={activeInvestors.toLocaleString()} icon={<UserCheck className="w-4 h-4" />} color="amber" />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading investors...</div>
      ) : (
        <DataTable columns={columns} data={data} searchPlaceholder="Search investors..." />
      )}
    </div>
  );
}
