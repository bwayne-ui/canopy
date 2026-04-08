'use client';

import { useEffect, useState, useMemo } from 'react';
import { Link2, CheckCircle, Tags, Users } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import MetricCard from '@/components/MetricCard';
import DataTable, { Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import RelationshipExplorer from '@/components/RelationshipExplorer';

interface RelationshipEdge {
  relationshipId: string;
  sourceType: string;
  sourceName: string;
  targetType: string;
  targetName: string;
  relationshipType: string;
  status: string;
}

const typeBadgeColors: Record<string, string> = {
  ownership: 'bg-emerald-100 text-emerald-700',
  management: 'bg-blue-100 text-blue-700',
  advisory: 'bg-purple-100 text-purple-700',
  custodial: 'bg-amber-100 text-amber-700',
  investment: 'bg-indigo-100 text-indigo-700',
};

export default function RelationshipsPage() {
  const [data, setData] = useState<RelationshipEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'table' | 'graph'>('table');

  useEffect(() => {
    fetch('/api/relationships')
      .then((r) => r.json())
      .then((res) => setData(res.items ?? []))
      .finally(() => setLoading(false));
  }, []);

  const metrics = useMemo(() => {
    const total = data.length;
    const active = data.filter((r) => r.status.toLowerCase() === 'active').length;
    const types = new Set(data.map((r) => r.relationshipType)).size;
    const entities = new Set(data.flatMap((r) => [r.sourceName, r.targetName])).size;
    return { total, active, types, entities };
  }, [data]);

  const columns: Column[] = [
    {
      key: 'relationshipId',
      label: 'Relationship ID',
      sortable: true,
      render: (v) => <span className="font-mono text-xs">{v}</span>,
    },
    {
      key: 'sourceName',
      label: 'Source',
      sortable: true,
      render: (v) => <span className="font-semibold">{v}</span>,
    },
    {
      key: 'targetName',
      label: 'Target',
      sortable: true,
      render: (v) => <span className="font-semibold">{v}</span>,
    },
    {
      key: 'relationshipType',
      label: 'Type',
      sortable: true,
      render: (v) => {
        const color = typeBadgeColors[v?.toLowerCase()] ?? 'bg-gray-100 text-gray-600';
        return (
          <span className={`inline-block px-2 py-0.5 text-[11px] font-medium rounded-full ${color}`}>
            {v}
          </span>
        );
      },
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
      <PageHeader title="Relationship Manager" subtitle="Entity Relationship Explorer" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <MetricCard title="Total Relationships" value={metrics.total.toLocaleString()} icon={<Link2 className="w-4 h-4" />} color="teal" />
        <MetricCard title="Active" value={metrics.active.toLocaleString()} icon={<CheckCircle className="w-4 h-4" />} color="green" />
        <MetricCard title="Relationship Types" value={metrics.types.toLocaleString()} icon={<Tags className="w-4 h-4" />} color="signal" />
        <MetricCard title="Entities Involved" value={metrics.entities.toLocaleString()} icon={<Users className="w-4 h-4" />} color="amber" />
      </div>

      {/* Tab toggle */}
      <div className="flex items-center gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
            view === 'table' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setView('table')}
        >
          Table View
        </button>
        <button
          className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
            view === 'graph' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setView('graph')}
        >
          Graph View
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading relationships...</div>
      ) : view === 'table' ? (
        <DataTable columns={columns} data={data} searchPlaceholder="Search relationships..." />
      ) : (
        <RelationshipExplorer relationships={data} />
      )}
    </div>
  );
}
