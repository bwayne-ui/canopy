'use client';

import { useEffect, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import MetricCard from '@/components/MetricCard';
import DataTable, { Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { ClipboardCheck, CheckCircle2, Loader, AlertTriangle } from 'lucide-react';

interface TaskAssignmentRow {
  id: number;
  taskName: string;
  taskCode: string;
  entityName: string;
  assignedTo: string | null;
  status: string;
  dueDate: string;
  periodEnd: string;
  priority: string;
}

const priorityBadge = (priority: string) => {
  const colors: Record<string, string> = {
    Critical: 'bg-red-100 text-red-700',
    High: 'bg-orange-100 text-orange-700',
    Medium: 'bg-blue-100 text-blue-700',
    Low: 'bg-gray-100 text-gray-500',
  };
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${colors[priority] || 'bg-gray-100 text-gray-600'}`}>
      {priority}
    </span>
  );
};

const columns: Column[] = [
  { key: 'taskName', label: 'Task', sortable: true, render: (v) => <span className="font-medium text-gray-900">{v}</span> },
  { key: 'entityName', label: 'Entity', sortable: true },
  { key: 'assignedTo', label: 'Assigned To', sortable: true, render: (v) => v || '—' },
  { key: 'status', label: 'Status', sortable: true, render: (v) => <StatusBadge status={v} /> },
  { key: 'dueDate', label: 'Due Date', sortable: true },
  { key: 'periodEnd', label: 'Period', sortable: true },
  { key: 'priority', label: 'Priority', sortable: true, render: (v) => priorityBadge(v) },
];

export default function TaskAssignmentsPage() {
  const [items, setItems] = useState<TaskAssignmentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/task-assignments')
      .then((r) => r.json())
      .then((data) => setItems(data.items))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-96"><div className="animate-pulse text-gray-400">Loading task assignments...</div></div>;
  }

  const total = items.length;
  const complete = items.filter((i) => i.status === 'Complete').length;
  const inProgress = items.filter((i) => i.status === 'In Progress').length;
  const overdue = items.filter((i) => i.status === 'Overdue').length;

  return (
    <div className="space-y-3">
      <PageHeader
        title="Task Assignments"
        subtitle="Active task assignments across all entities"
        breadcrumbs={[
          { label: 'Data Vault', href: '/data-vault' },
          { label: 'Task Assignments' },
        ]}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3\">
        <MetricCard title="Total Assignments" value={String(total)} icon={<ClipboardCheck className="w-4 h-4" />} color="teal" />
        <MetricCard title="Complete" value={String(complete)} icon={<CheckCircle2 className="w-4 h-4" />} color="green" />
        <MetricCard title="In Progress" value={String(inProgress)} icon={<Loader className="w-4 h-4" />} color="signal" />
        <MetricCard title="Overdue" value={String(overdue)} icon={<AlertTriangle className="w-4 h-4" />} color="red" />
      </div>

      <DataTable columns={columns} data={items} searchPlaceholder="Search assignments..." />
    </div>
  );
}
