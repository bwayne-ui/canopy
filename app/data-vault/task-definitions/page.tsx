'use client';

import { useEffect, useState } from 'react';
import { ClipboardList, FolderOpen, Clock, UserCheck } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import MetricCard from '@/components/MetricCard';
import DataTable, { Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';

interface TaskDefinitionRow {
  id: string;
  code: string;
  name: string;
  category: string;
  frequency: string;
  estMinutes: number;
  priority: string;
  department: string;
  assignmentCount: number;
}

const priorityColors: Record<string, string> = {
  Critical: 'bg-red-100 text-red-700',
  High: 'bg-orange-100 text-orange-700',
  Medium: 'bg-blue-100 text-blue-700',
  Low: 'bg-gray-100 text-gray-600',
};

export default function TaskDefinitionsPage() {
  const [data, setData] = useState<TaskDefinitionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/task-definitions')
      .then((r) => r.json())
      .then((res) => setData(res.items ?? []))
      .finally(() => setLoading(false));
  }, []);

  const totalSops = data.length;
  const categories = new Set(data.map((r) => r.category)).size;
  const avgEstMinutes = totalSops > 0 ? data.reduce((s, r) => s + (r.estMinutes ?? 0), 0) / totalSops : 0;
  const activeAssignments = data.reduce((s, r) => s + (r.assignmentCount ?? 0), 0);

  const columns: Column[] = [
    { key: 'code', label: 'Code', sortable: true, render: (v) => <span className="font-mono">{v}</span> },
    { key: 'name', label: 'Name', sortable: true, render: (v) => <span className="font-semibold">{v}</span> },
    { key: 'category', label: 'Category', sortable: true },
    { key: 'frequency', label: 'Frequency', sortable: true },
    { key: 'estMinutes', label: 'Est. Minutes', sortable: true, align: 'right' },
    {
      key: 'priority',
      label: 'Priority',
      sortable: true,
      render: (v) => (
        <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${priorityColors[v] ?? 'bg-gray-100 text-gray-600'}`}>
          {v}
        </span>
      ),
    },
    { key: 'department', label: 'Department', sortable: true },
    { key: 'assignmentCount', label: 'Assignments', sortable: true, align: 'right' },
  ];

  return (
    <div>
      <PageHeader
        title="Task Definitions"
        subtitle="Standard operating procedures and task catalog"
        breadcrumbs={[
          { label: 'Data Vault', href: '/data-vault' },
          { label: 'Task Definitions' },
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
        <MetricCard title="Total SOPs" value={totalSops.toLocaleString()} icon={<ClipboardList className="w-4 h-4" />} color="teal" />
        <MetricCard title="Categories" value={categories.toLocaleString()} icon={<FolderOpen className="w-4 h-4" />} color="green" />
        <MetricCard title="Avg Est. Minutes" value={avgEstMinutes.toFixed(0)} icon={<Clock className="w-4 h-4" />} color="signal" />
        <MetricCard title="Active Assignments" value={activeAssignments.toLocaleString()} icon={<UserCheck className="w-4 h-4" />} color="amber" />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading task definitions...</div>
      ) : (
        <DataTable columns={columns} data={data} searchPlaceholder="Search task definitions..." />
      )}
    </div>
  );
}
