'use client';

import { useEffect, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import MetricCard from '@/components/MetricCard';
import DataTable, { Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { fmtPct } from '@/lib/utils';
import { Brain, Activity, Target, Play } from 'lucide-react';

interface AISkillRow {
  id: number;
  name: string;
  description: string;
  category: string;
  status: string;
  accuracy: number | null;
  model: string;
  runCount: number;
  lastRun: string | null;
}

const accuracyBar = (accuracy: number | null) => {
  if (accuracy === null) return <span className="text-gray-400">—</span>;
  const color = accuracy >= 95 ? 'bg-emerald-500' : accuracy >= 85 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 bg-gray-200 rounded-full h-2">
        <div className={`${color} h-2 rounded-full`} style={{ width: `${Math.min(accuracy, 100)}%` }} />
      </div>
      <span className="text-xs font-mono text-gray-600">{fmtPct(accuracy)}</span>
    </div>
  );
};

const columns: Column[] = [
  { key: 'name', label: 'Name', sortable: true, render: (v) => <span className="font-medium text-gray-900">{v}</span> },
  { key: 'category', label: 'Category', sortable: true },
  { key: 'model', label: 'Model', sortable: true },
  { key: 'accuracy', label: 'Accuracy', sortable: true, align: 'right', render: (v) => accuracyBar(v) },
  { key: 'status', label: 'Status', sortable: true, render: (v) => <StatusBadge status={v} /> },
  { key: 'runCount', label: 'Run Count', sortable: true, align: 'right', render: (v) => <span className="font-mono">{Number(v).toLocaleString()}</span> },
  { key: 'lastRun', label: 'Last Run', sortable: true, render: (v) => v || '—' },
];

export default function AISkillsPage() {
  const [items, setItems] = useState<AISkillRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/ai-skills')
      .then((r) => r.json())
      .then((data) => setItems(data.items))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-96"><div className="animate-pulse text-gray-400">Loading AI skills...</div></div>;
  }

  const total = items.length;
  const active = items.filter((i) => i.status === 'Active').length;
  const accuracies = items.map((i) => i.accuracy).filter((a): a is number => a !== null);
  const avgAccuracy = accuracies.length > 0 ? accuracies.reduce((s, a) => s + a, 0) / accuracies.length : 0;
  const totalRuns = items.reduce((s, i) => s + i.runCount, 0);

  return (
    <div className="space-y-3">
      <PageHeader
        title="AI Skills"
        subtitle="Machine learning models and automation skills"
        breadcrumbs={[
          { label: 'Data Vault', href: '/data-vault' },
          { label: 'AI Skills' },
        ]}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
        <MetricCard title="Total Skills" value={String(total)} icon={<Brain className="w-4 h-4" />} color="teal" />
        <MetricCard title="Active" value={String(active)} icon={<Activity className="w-4 h-4" />} color="green" />
        <MetricCard title="Avg Accuracy" value={fmtPct(avgAccuracy)} icon={<Target className="w-4 h-4" />} color="signal" />
        <MetricCard title="Total Runs" value={totalRuns.toLocaleString()} icon={<Play className="w-4 h-4" />} color="teal" />
      </div>

      <DataTable columns={columns} data={items} searchPlaceholder="Search skills..." />
    </div>
  );
}
