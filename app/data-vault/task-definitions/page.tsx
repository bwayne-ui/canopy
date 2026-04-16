'use client';

import { useEffect, useState } from 'react';
import { ClipboardList, FolderOpen, Clock, UserCheck } from 'lucide-react';
import Link from 'next/link';
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
  const [searchInit, setSearchInit] = useState('');

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('search');
    if (q) setSearchInit(q);
  }, []);

  useEffect(() => {
    fetch('/api/task-definitions')
      .then((r) => r.json())
      .then((res) => setData(res.items ?? []))
      .finally(() => setLoading(false));
  }, []);

  const totalSops = data.length;
  const categories = new Set(data.map((r) => r.category)).size;
  const avgEstHours = totalSops > 0
    ? data.reduce((s, r) => s + (r.estMinutes ?? 0), 0) / totalSops / 60
    : 0;
  const activeAssignments = data.reduce((s, r) => s + (r.assignmentCount ?? 0), 0);

  function minsToHours(mins: number): string {
    const hrs = Math.round(mins / 15) / 4;
    return hrs % 1 === 0 ? `${hrs}.0` : hrs.toFixed(2).replace(/0$/, '');
  }

  const columns: Column[] = [
    { key: 'code', label: 'Code', sortable: true, render: (v) => <span className="">{v}</span> },
    { key: 'name', label: 'Name', sortable: true, render: (v: string, row: any) => (
      <Link href={`/data-vault/task-definitions/${row.taskCode}`} className="block group">
        <div className="font-semibold text-gray-900 group-hover:text-[#00C97B] transition-colors">{v}</div>
        <div className="text-[10px] text-gray-400">{row.taskCode}</div>
      </Link>
    ) },
    { key: 'category', label: 'Category', sortable: true },
    { key: 'frequency', label: 'Frequency', sortable: true },
    { key: 'estMinutes', label: 'Est. Hours', sortable: true, align: 'right', render: (v: number) => <span>{minsToHours(v)}</span> },
    {
      key: 'priority',
      label: 'Priority',
      sortable: true,
      render: (v) => (
        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${priorityColors[v] ?? 'bg-gray-100 text-gray-600'}`}>
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
        <MetricCard title="Avg Est. Hours" value={avgEstHours.toFixed(1)} icon={<Clock className="w-4 h-4" />} color="signal" />
        <MetricCard title="Active Assignments" value={activeAssignments.toLocaleString()} icon={<UserCheck className="w-4 h-4" />} color="amber" />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading task definitions...</div>
      ) : (
        <DataTable columns={columns} data={data} searchPlaceholder="Search task definitions..." initialSearch={searchInit} />
      )}
    </div>
  );
}
