'use client';

import { useState } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import MetricCard from '@/components/MetricCard';
import DataTable, { Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { ListChecks, Clock, CheckCircle2, AlertTriangle } from 'lucide-react';

const tasks = [
  { id: 'TL-001', task: 'Monthly NAV Calculation', client: 'Walker Enterprise Fund III', assignee: 'Megan Moore', priority: 'Critical', dueDate: '2026-04-30', status: 'In Progress' },
  { id: 'TL-002', task: 'K-1 Preparation (FY2025)', client: 'Campbell Growth IV', assignee: 'Diana Smith', priority: 'High', dueDate: '2026-04-15', status: 'In Progress' },
  { id: 'TL-003', task: 'Audit Support — PBC List', client: 'Sullivan Alpha Fund', assignee: 'Richard Thornton', priority: 'High', dueDate: '2026-04-12', status: 'Under Review' },
  { id: 'TL-004', task: 'Capital Call Processing', client: 'Cruz Ventures II', assignee: 'Steven Wright', priority: 'Critical', dueDate: '2026-04-08', status: 'Complete' },
  { id: 'TL-005', task: 'FATCA/CRS Filing', client: 'White Fund Management', assignee: 'Sarah Garcia', priority: 'Critical', dueDate: '2026-04-15', status: 'At Risk' },
  { id: 'TL-006', task: 'Investor Statement Distribution', client: 'Walker Asset Management', assignee: 'Jason Cooper', priority: 'High', dueDate: '2026-04-25', status: 'Not Started' },
  { id: 'TL-007', task: 'Quarterly Compliance Review', client: 'Lopez Asset Partners', assignee: 'Sarah Garcia', priority: 'Medium', dueDate: '2026-04-20', status: 'In Progress' },
  { id: 'TL-008', task: 'Fund Expense Reconciliation', client: 'White Advisors', assignee: 'Diana Smith', priority: 'Medium', dueDate: '2026-04-18', status: 'In Progress' },
  { id: 'TL-009', task: 'Waterfall Distribution Calc', client: 'Campbell Growth IV', assignee: 'Megan Moore', priority: 'High', dueDate: '2026-04-22', status: 'Not Started' },
  { id: 'TL-010', task: 'KYC Refresh — New Investors', client: 'Rodriguez Capital', assignee: 'Sarah Garcia', priority: 'High', dueDate: '2026-04-17', status: 'In Progress' },
  { id: 'TL-011', task: 'Management Fee Invoice', client: 'Walker Enterprise Fund III', assignee: 'Steven Wright', priority: 'Medium', dueDate: '2026-04-10', status: 'Complete' },
  { id: 'TL-012', task: 'Side Letter Compliance Check', client: 'Sullivan Alpha Fund', assignee: 'Richard Thornton', priority: 'Low', dueDate: '2026-04-28', status: 'Scheduled' },
];

const columns: Column[] = [
  { key: 'id', label: 'ID', width: 'w-20', render: (v) => <span className="text-xs text-gray-400">{v}</span> },
  { key: 'task', label: 'Task', sortable: true, render: (v: string) => <Link href={`/data-vault/task-definitions?search=${encodeURIComponent(v)}`} className="font-medium text-gray-900 hover:text-[#00C97B] transition-colors">{v}</Link> },
  { key: 'client', label: 'Client', sortable: true, render: (v: string) => <Link href={`/data-vault/clients?search=${encodeURIComponent(v)}`} className="text-[#00C97B] hover:underline hover:text-[#00A866] transition-colors">{v}</Link> },
  { key: 'assignee', label: 'Assignee', sortable: true, render: (v: string) => <Link href={`/data-vault/internal-users?search=${encodeURIComponent(v)}`} className="text-[#00C97B] hover:underline hover:text-[#00A866] transition-colors">{v}</Link> },
  { key: 'priority', label: 'Priority', sortable: true, render: (v) => <StatusBadge status={v} /> },
  { key: 'dueDate', label: 'Due Date', sortable: true, render: (v) => <span className="text-xs">{v}</span> },
  { key: 'status', label: 'Status', sortable: true, render: (v) => <StatusBadge status={v} /> },
];

export default function TaskListPage() {
  const inProgress = tasks.filter((t) => t.status === 'In Progress').length;
  const complete = tasks.filter((t) => t.status === 'Complete').length;
  const overdue = tasks.filter((t) => t.status === 'At Risk' || t.status === 'Overdue').length;

  return (
    <div className="space-y-5">
      <PageHeader title="Task List" subtitle="Active tasks across all clients and entities" breadcrumbs={[{ label: 'Activity' }, { label: 'Task List' }]} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard title="Total Tasks" value={tasks.length} icon={<ListChecks className="w-4 h-4" />} color="teal" />
        <MetricCard title="In Progress" value={inProgress} icon={<Clock className="w-4 h-4" />} color="signal" />
        <MetricCard title="Completed" value={complete} icon={<CheckCircle2 className="w-4 h-4" />} color="green" />
        <MetricCard title="At Risk" value={overdue} icon={<AlertTriangle className="w-4 h-4" />} color="red" />
      </div>
      <DataTable columns={columns} data={tasks} searchPlaceholder="Search tasks..." />
    </div>
  );
}
