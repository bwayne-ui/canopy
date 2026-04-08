'use client';

import { useEffect, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import MetricCard from '@/components/MetricCard';
import DataTable, { Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { fmtDate } from '@/lib/utils';

const priorityStyles: Record<string, string> = {
  Critical: 'bg-red-100 text-red-700',
  High: 'bg-amber-100 text-amber-700',
  Medium: 'bg-blue-100 text-blue-700',
  Low: 'bg-gray-100 text-gray-700',
};

const columns: Column[] = [
  { key: 'projectId', label: 'Project ID', render: (v: string) => <span className="font-mono text-sm">{v}</span> },
  { key: 'name', label: 'Name', sortable: true, render: (v: string) => <span className="font-medium text-gray-900">{v}</span> },
  { key: 'projectType', label: 'Type', sortable: true },
  { key: 'clientName', label: 'Client', sortable: true, render: (v: string | null) => v || '—' },
  { key: 'status', label: 'Status', render: (v: string) => <StatusBadge status={v} /> },
  { key: 'priority', label: 'Priority', render: (v: string) => <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${priorityStyles[v] || 'bg-gray-100 text-gray-700'}`}>{v}</span> },
  { key: 'leadName', label: 'Lead', sortable: true, render: (v: string | null) => v || '—' },
  { key: 'startDate', label: 'Start', sortable: true, render: (v: string) => <span className="whitespace-nowrap">{fmtDate(v)}</span> },
  { key: 'targetEndDate', label: 'Target End', sortable: true, render: (v: string) => <span className="whitespace-nowrap">{fmtDate(v)}</span> },
  { key: 'completionPct', label: 'Completion', sortable: true, render: (v: number) => (
    <div className="flex items-center gap-2">
      <div className="h-2 w-20 rounded-full bg-gray-200"><div className="h-2 rounded-full bg-[#00C97B]" style={{ width: `${Math.min(v, 100)}%` }} /></div>
      <span className="text-xs font-mono text-gray-600">{v}%</span>
    </div>
  )},
  { key: 'totalTasks', label: 'Tasks', render: (_v: number, row: any) => <span className="text-sm font-mono">{row.completedTasks}/{row.totalTasks}</span> },
];

export default function ProjectsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/projects').then((r) => r.json()).then((d) => setItems(d.items ?? [])).finally(() => setLoading(false));
  }, []);

  const inProgress = items.filter((p: any) => p.status === 'In Progress').length;
  const complete = items.filter((p: any) => p.status === 'Complete').length;
  const avgCompletion = items.length > 0 ? Math.round(items.reduce((s: number, p: any) => s + p.completionPct, 0) / items.length) : 0;

  if (loading) return <div className="flex items-center justify-center h-96"><div className="animate-pulse text-gray-400">Loading Projects...</div></div>;

  return (
    <div className="space-y-5">
      <PageHeader title="Projects" subtitle="Project tracking and management" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard title="Total Projects" value={items.length} color="teal" />
        <MetricCard title="In Progress" value={inProgress} color="signal" />
        <MetricCard title="Complete" value={complete} color="green" />
        <MetricCard title="Avg Completion" value={`${avgCompletion}%`} />
      </div>
      <DataTable columns={columns} data={items} searchPlaceholder="Search projects..." />
    </div>
  );
}
