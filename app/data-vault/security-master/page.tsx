'use client';

import { useEffect, useState } from 'react';
import { Shield, DollarSign, TrendingUp, Layers } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import MetricCard from '@/components/MetricCard';
import DataTable, { Column } from '@/components/DataTable';
import { fmtMoney } from '@/lib/utils';

interface SecurityRow {
  id: string;
  securityId: string;
  name: string;
  securityType: string;
  ticker: string | null;
  marketValue: number | null;
  costBasis: number | null;
  unrealizedGain: number | null;
  sector: string;
  currency: string;
}

export default function SecurityMasterPage() {
  const [data, setData] = useState<SecurityRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/securities')
      .then((r) => r.json())
      .then((res) => setData(res.items ?? []))
      .finally(() => setLoading(false));
  }, []);

  const totalSecurities = data.length;
  const totalMarketValue = data.reduce((s, r) => s + (r.marketValue ?? 0), 0);
  const totalUnrealizedGain = data.reduce((s, r) => s + (r.unrealizedGain ?? 0), 0);
  const assetTypes = new Set(data.map((r) => r.securityType)).size;

  const columns: Column[] = [
    { key: 'securityId', label: 'Security ID', sortable: true },
    { key: 'name', label: 'Name', sortable: true, render: (v) => <span className="font-semibold">{v}</span> },
    { key: 'securityType', label: 'Type', sortable: true },
    { key: 'ticker', label: 'Ticker', sortable: true, render: (v) => v || '—' },
    {
      key: 'marketValue',
      label: 'Market Value',
      sortable: true,
      align: 'right',
      render: (v) => <span className="font-mono">{v != null ? fmtMoney(v) : '—'}</span>,
    },
    {
      key: 'costBasis',
      label: 'Cost Basis',
      sortable: true,
      align: 'right',
      render: (v) => <span className="font-mono">{v != null ? fmtMoney(v) : '—'}</span>,
    },
    {
      key: 'unrealizedGain',
      label: 'Unrealized Gain',
      sortable: true,
      align: 'right',
      render: (v) =>
        v != null ? (
          <span className={`font-mono ${v >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{fmtMoney(v)}</span>
        ) : (
          <span className="font-mono">—</span>
        ),
    },
    { key: 'sector', label: 'Sector', sortable: true },
    { key: 'currency', label: 'Currency', sortable: true },
  ];

  return (
    <div>
      <PageHeader
        title="Security Master"
        subtitle="Securities and positions overview"
        breadcrumbs={[
          { label: 'Data Vault', href: '/data-vault' },
          { label: 'Security Master' },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-3\">
        <MetricCard title="Total Securities" value={totalSecurities.toLocaleString()} icon={<Shield className="w-4 h-4" />} color="teal" />
        <MetricCard title="Total Market Value" value={fmtMoney(totalMarketValue)} icon={<DollarSign className="w-4 h-4" />} color="green" />
        <MetricCard title="Total Unrealized Gain" value={fmtMoney(totalUnrealizedGain)} icon={<TrendingUp className="w-4 h-4" />} color="signal" />
        <MetricCard title="Asset Types" value={assetTypes.toLocaleString()} icon={<Layers className="w-4 h-4" />} color="amber" />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading securities...</div>
      ) : (
        <DataTable columns={columns} data={data} searchPlaceholder="Search securities..." />
      )}
    </div>
  );
}
