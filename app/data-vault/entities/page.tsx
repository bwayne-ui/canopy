'use client';

import { useEffect, useState } from 'react';
import { Building2, DollarSign, CheckCircle, BarChart3 } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import MetricCard from '@/components/MetricCard';
import DataTable, { Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { fmtMoney, fmtPct } from '@/lib/utils';

interface EntityRow {
  id: string;
  entityId: string;
  name: string;
  type: string;
  strategy: string;
  client: string;
  domicile: string;
  navMm: number | null;
  grossIrr: number | null;
  dataQualityScore: number;
  status: string;
}

export default function EntitiesPage() {
  const [data, setData] = useState<EntityRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/entities')
      .then((r) => r.json())
      .then((res) => setData(res.items ?? []))
      .finally(() => setLoading(false));
  }, []);

  const totalEntities = data.length;
  const totalNav = data.reduce((s, r) => s + (r.navMm ?? 0), 0);
  const activeEntities = data.filter((r) => r.status === 'Active').length;
  const avgDqScore = totalEntities > 0 ? data.reduce((s, r) => s + (r.dataQualityScore ?? 0), 0) / totalEntities : 0;

  const columns: Column[] = [
    { key: 'entityId', label: 'Entity ID', sortable: true },
    { key: 'name', label: 'Name', sortable: true, render: (v) => <span className="font-semibold">{v}</span> },
    { key: 'type', label: 'Type', sortable: true },
    { key: 'strategy', label: 'Strategy', sortable: true },
    { key: 'client', label: 'Client', sortable: true },
    { key: 'domicile', label: 'Domicile', sortable: true },
    {
      key: 'navMm',
      label: 'NAV ($MM)',
      sortable: true,
      align: 'right',
      render: (v) => <span className="font-mono">{v != null ? fmtMoney(v) : '—'}</span>,
    },
    {
      key: 'grossIrr',
      label: 'Gross IRR',
      sortable: true,
      align: 'right',
      render: (v) => <span className="font-mono">{v != null ? fmtPct(v) : '—'}</span>,
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
        title="Entities"
        subtitle="Fund and entity management"
        breadcrumbs={[
          { label: 'Data Vault', href: '/data-vault' },
          { label: 'Entities' },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <MetricCard title="Total Entities" value={totalEntities.toLocaleString()} icon={<Building2 className="w-4 h-4" />} color="teal" />
        <MetricCard title="Total NAV" value={fmtMoney(totalNav)} icon={<DollarSign className="w-4 h-4" />} color="green" />
        <MetricCard title="Active Entities" value={activeEntities.toLocaleString()} icon={<CheckCircle className="w-4 h-4" />} color="signal" />
        <MetricCard title="Avg DQ Score" value={fmtPct(avgDqScore)} icon={<BarChart3 className="w-4 h-4" />} color="amber" />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading entities...</div>
      ) : (
        <DataTable columns={columns} data={data} searchPlaceholder="Search entities..." />
      )}
    </div>
  );
}
