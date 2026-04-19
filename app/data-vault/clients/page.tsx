'use client';

import { useEffect, useState } from 'react';
import { Users, DollarSign, TrendingUp, UserCheck } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import MetricCard from '@/components/MetricCard';
import DataTable, { Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { fmtMoney, fmtPct } from '@/lib/utils';
import Link from 'next/link';

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

const STATUS_FILTERS = ['All', 'Active', 'Prospect', 'Churned', 'Onboarding'] as const;
type StatusFilter = typeof STATUS_FILTERS[number];

export default function ClientsPage() {
  const [data, setData] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInit, setSearchInit] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('search');
    if (q) setSearchInit(q);
  }, []);

  useEffect(() => {
    fetch('/api/clients')
      .then((r) => r.json())
      .then((res) => setData(res.items ?? []))
      .finally(() => setLoading(false));
  }, []);

  const filteredData = statusFilter === 'All' ? data : data.filter((r) => r.status === statusFilter);

  const totalClients = data.length;
  const totalAum = data.reduce((s, r) => s + (r.totalNavMm ?? 0), 0);
  const avgMargin = totalClients > 0 ? data.reduce((s, r) => s + (r.marginPct ?? 0), 0) / totalClients : 0;
  const activeClients = data.filter((r) => r.status === 'Active').length;

  const countsByStatus: Record<string, number> = {
    All: data.length,
    Active: data.filter((r) => r.status === 'Active').length,
    Prospect: data.filter((r) => r.status === 'Prospect').length,
    Churned: data.filter((r) => r.status === 'Churned').length,
    Onboarding: data.filter((r) => r.status === 'Onboarding').length,
  };

  const columns: Column[] = [
    { key: 'name', label: 'Name', sortable: true, render: (v: string, row: any) => (
      <Link href={`/data-vault/clients/${row.id}`} className="block group">
        <div className="font-semibold text-gray-900 group-hover:text-[#00C97B] transition-colors">{v}</div>
      </Link>
    ) },
    { key: 'strategy', label: 'Strategy', sortable: true },
    { key: 'hqCity', label: 'HQ City', sortable: true },
    { key: 'region', label: 'Region', sortable: true },
    { key: 'entities', label: 'Entities', sortable: true, align: 'right' },
    {
      key: 'totalNavMm',
      label: 'NAV',
      sortable: true,
      align: 'right',
      render: (v) => <span className="">{fmtMoney(v ?? 0)}</span>,
    },
    {
      key: 'revenueL12m',
      label: 'Revenue L12M',
      sortable: true,
      align: 'right',
      render: (v) => <span className="">{fmtMoney(v ?? 0)}</span>,
    },
    {
      key: 'marginPct',
      label: 'Margin %',
      sortable: true,
      align: 'right',
      render: (v) => <span className="">{fmtPct(v ?? 0)}</span>,
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

      {/* Status filter pills */}
      <div className="flex items-center gap-1 mb-3">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              statusFilter === s
                ? 'bg-[#00AA6C] text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {s}
            <span className={`ml-1.5 text-[10px] font-semibold ${statusFilter === s ? 'text-white/80' : 'text-gray-400'}`}>
              {countsByStatus[s] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading clients...</div>
      ) : (
        <DataTable columns={columns} data={filteredData} searchPlaceholder="Search clients..." initialSearch={searchInit} />
      )}
    </div>
  );
}
