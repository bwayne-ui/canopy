'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Building2, Users, Briefcase, TrendingUp } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import MetricCard from '@/components/MetricCard';
import DataTable, { Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { fmtMoney, toNum } from '@/lib/utils';

interface AccountRow {
  id: string;
  accountId: string;
  name: string;
  industry: string | null;
  hqCity: string | null;
  region: string | null;
  aumMm: number | null;
  status: string;
  ownerName: string | null;
  contactCount: number;
  oppCount: number;
}

function stageBadgeClass(stage: string): string {
  const map: Record<string, string> = {
    Prospecting: 'bg-gray-100 text-gray-600',
    Discovery: 'bg-blue-100 text-blue-700',
    Proposal: 'bg-amber-100 text-amber-700',
    Negotiation: 'bg-purple-100 text-purple-700',
    'Closed Won': 'bg-emerald-100 text-emerald-700',
    'Closed Lost': 'bg-red-100 text-red-700',
  };
  return map[stage] ?? 'bg-gray-100 text-gray-600';
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/revops/accounts')
      .then((r) => r.json())
      .then((res) => setAccounts(res.items ?? []))
      .finally(() => setLoading(false));
  }, []);

  const metrics = useMemo(() => {
    const total = accounts.length;
    const activeProspects = accounts.filter((a) => a.status === 'Prospect').length;
    const openOpps = accounts
      .filter((a) => a.status === 'Prospect')
      .reduce((s, a) => s + (a.oppCount ?? 0), 0);

    const withAum = accounts.filter((a) => a.aumMm != null);
    const avgAum =
      withAum.length > 0
        ? withAum.reduce((s, a) => s + toNum(a.aumMm), 0) / withAum.length
        : 0;

    return { total, activeProspects, openOpps, avgAum };
  }, [accounts]);

  const columns: Column[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (_v: string, row: AccountRow) => (
        <Link
          href={`/revops/accounts/${row.id}`}
          className="font-semibold text-gray-900 hover:text-[#00C97B] transition-colors"
        >
          {row.name}
        </Link>
      ),
    },
    {
      key: 'industry',
      label: 'Industry',
      sortable: true,
      render: (v: string | null) => <span>{v || '—'}</span>,
    },
    {
      key: 'hqCity',
      label: 'HQ',
      sortable: true,
      render: (v: string | null) => <span>{v || '—'}</span>,
    },
    {
      key: 'region',
      label: 'Region',
      sortable: true,
      render: (v: string | null) => <span>{v || '—'}</span>,
    },
    {
      key: 'aumMm',
      label: 'AUM',
      sortable: true,
      align: 'right',
      render: (v: number | null) =>
        v != null ? (
          <span className="font-mono">{`$${Math.round(toNum(v))}M`}</span>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      key: 'contactCount',
      label: 'Contacts',
      sortable: true,
      align: 'right',
      render: (v: number) => <span className="font-mono">{v ?? 0}</span>,
    },
    {
      key: 'oppCount',
      label: 'Open Opps',
      sortable: true,
      align: 'right',
      render: (v: number) => <span className="font-mono">{v ?? 0}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (v: string) => <StatusBadge status={v} />,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-gray-400 text-xs">Loading accounts…</div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Accounts"
        breadcrumbs={[
          { label: 'Revenue Ops', href: '/revops' },
          { label: 'Accounts' },
        ]}
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <MetricCard
          title="Total Accounts"
          value={metrics.total}
          icon={<Building2 className="w-5 h-5" />}
          color="teal"
        />
        <MetricCard
          title="Active Prospects"
          value={metrics.activeProspects}
          icon={<TrendingUp className="w-5 h-5" />}
          color="green"
        />
        <MetricCard
          title="Open Opps"
          value={metrics.openOpps}
          icon={<Briefcase className="w-5 h-5" />}
          color="amber"
        />
        <MetricCard
          title="Avg AUM"
          value={`$${Math.round(metrics.avgAum)}M`}
          icon={<Users className="w-5 h-5" />}
          color="signal"
        />
      </div>

      <DataTable
        columns={columns}
        data={accounts}
        searchable
        searchPlaceholder="Search accounts…"
        emptyMessage="No accounts found."
      />
    </div>
  );
}
