'use client';

import { useEffect, useState } from 'react';
import { Users, DollarSign, TrendingUp, UserCheck } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import MetricCard from '@/components/MetricCard';
import DataTable, { Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { fmtMoney, fmtPct } from '@/lib/utils';

interface ClientRow {
  id: string;
  name: string;
  strategy: string;
  hqCity: string;
  region: string;
  entities: number;
  totalNavMm: number;
  revenueL12m: number;
  marginPct: number;
  status: string;
}

export default function ClientsPage() {
  const [data, setData] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/clients')
      .then((r) => r.json())
      .then((res) => setData(res.items ?? []))
      .finally(() => setLoading(false));
  }, []);

  const totalClients = data.length;
  const totalAum = data.reduce((s, r) => s + (r.totalNavMm ?? 0), 0);
  const avgMargin = totalClients > 0 ? data.reduce((s, r) => s + (r.marginPct ?? 0), 0) / totalClients : 0;
  const activeClients = data.filter((r) => r.status === 'Active').length;

  const columns: Column[] = [
    { key: 'name', label: 'Name', sortable: true, render: (v) => <span className="font-semibold">{v}</span> },
    { key: 'strategy', label: 'Strategy', sortable: true },
    { key: 'hqCity', label: 'HQ City', sortable: true },
    { key: 'region', label: 'Region', sortable: true },
    { key: 'entities', label: 'Entities', sortable: true, align: 'right' },
    {
      key: 'totalNavMm',
      label: 'NAV ($MM)',
      sortable: true,
      align: 'right',
      render: (v) => <span className="font-mono">{fmtMoney(v ?? 0)}</span>,
    },
    {
      key: 'revenueL12m',
      label: 'Revenue L12M',
      sortable: true,
      align: 'right',
      render: (v) => <span className="font-mono">{fmtMoney(v ?? 0)}</span>,
    },
    {
      key: 'marginPct',
      label: 'Margin %',
      sortable: true,
      align: 'right',
      render: (v) => <span className="font-mono">{fmtPct(v ?? 0)}</span>,
    },
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
        title="GPs"
        subtitle="General Partner portfolio overview"
        breadcrumbs={[
          { label: 'Data Vault', href: '/data-vault' },
          { label: 'GPs' },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
        <MetricCard title="Total Clients" value={totalClients.toLocaleString()} icon={<Users className="w-4 h-4" />} color="teal" />
        <MetricCard title="Total AUM" value={fmtMoney(totalAum)} icon={<DollarSign className="w-4 h-4" />} color="green" />
        <MetricCard title="Avg Margin" value={fmtPct(avgMargin)} icon={<TrendingUp className="w-4 h-4" />} color="signal" />
        <MetricCard title="Active Clients" value={activeClients.toLocaleString()} icon={<UserCheck className="w-4 h-4" />} color="amber" />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading clients...</div>
      ) : (
        <DataTable columns={columns} data={data} searchPlaceholder="Search clients..." />
      )}
    </div>
  );
}
