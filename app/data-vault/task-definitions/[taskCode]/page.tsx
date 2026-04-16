'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import DataTable, { Column } from '@/components/DataTable';

function FieldRow({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex items-start py-1.5 border-b border-gray-50 last:border-0">
      <span className="w-44 flex-shrink-0 text-xs text-gray-500 font-medium">{label}</span>
      <span className="text-xs text-gray-800 font-medium">{value ?? '—'}</span>
    </div>
  );
}

function FieldSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{title}</div>
      {children}
    </div>
  );
}

const TABS = ['Definition', 'Process Steps', 'Active Assignments'] as const;
type Tab = typeof TABS[number];

const priorityColors: Record<string, string> = {
  Critical: 'bg-red-50 text-red-700', High: 'bg-orange-50 text-orange-700',
  Medium: 'bg-amber-50 text-amber-700', Low: 'bg-gray-50 text-gray-600',
};

export default function TaskDefinitionDetailPage() {
  const { taskCode } = useParams<{ taskCode: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('Definition');

  useEffect(() => {
    fetch(`/api/task-definitions/${taskCode}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [taskCode]);

  if (loading) return <div className="text-center py-16 text-gray-400">Loading task definition…</div>;
  if (!data?.taskDefinition) return <div className="text-center py-16 text-red-400">Task definition not found.</div>;

  const td = data.taskDefinition;
  const assignments: any[] = data.assignments ?? [];

  const assignmentColumns: Column[] = [
    { key: 'entityName', label: 'Entity', sortable: true },
    {
      key: 'assignedTo', label: 'Assignee', sortable: false,
      render: (v: any) => v ? (
        <Link href={`/data-vault/internal-users/${v.employeeId}`} className="text-[#00C97B] hover:underline text-xs font-semibold">{v.name}</Link>
      ) : <span className="text-gray-300">—</span>,
    },
    { key: 'status', label: 'Status', sortable: true, render: (v: string) => <StatusBadge status={v} /> },
    { key: 'priority', label: 'Priority', sortable: true, render: (v: string) => <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${priorityColors[v] ?? priorityColors.Medium}`}>{v}</span> },
    { key: 'dueDate', label: 'Due Date', sortable: true, render: (v: string) => <span className="text-xs">{v}</span> },
    { key: 'periodEnd', label: 'Period', sortable: true },
  ];

  return (
    <div>
      <PageHeader
        title={td.name}
        subtitle={`${td.taskCode} · ${td.category} · ${td.department}`}
        breadcrumbs={[
          { label: 'Data Vault', href: '/data-vault' },
          { label: 'Task Definitions', href: '/data-vault/task-definitions' },
          { label: td.taskCode },
        ]}
        actions={
          <Link href="/data-vault/task-definitions" className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-md">
            <ArrowLeft className="w-3 h-3" /> Back
          </Link>
        }
      />

      <div className="flex items-center gap-3 bg-white rounded-lg shadow-sm px-4 py-2.5 mb-3">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${priorityColors[td.priority] ?? priorityColors.Medium}`}>{td.priority} Priority</span>
        <span className="text-xs text-gray-500">{td.frequency}</span>
        <div className="h-3 w-px bg-gray-200" />
        <span className="text-xs text-gray-500">{td.estimatedMinutes} min est.</span>
        <span className="ml-auto text-[10px] text-gray-400">{assignments.length} assignments</span>
      </div>

      <div className="flex gap-1 mb-3 bg-white rounded-lg shadow-sm p-1">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${tab === t ? 'bg-[#00C97B]/10 text-[#00C97B]' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Definition' && (
        <div className="bg-white rounded-lg shadow-sm p-4 max-w-xl">
          <FieldSection title="Definition">
            <FieldRow label="Task Code" value={td.taskCode} />
            <FieldRow label="Name" value={td.name} />
            <FieldRow label="Category" value={td.category} />
            <FieldRow label="Frequency" value={td.frequency} />
            <FieldRow label="Department" value={td.department} />
            <FieldRow label="Priority" value={td.priority} />
            <FieldRow label="Est. Minutes" value={td.estimatedMinutes} />
          </FieldSection>
          <FieldSection title="Description">
            <p className="text-xs text-gray-700">{td.description}</p>
          </FieldSection>
        </div>
      )}

      {tab === 'Process Steps' && (
        <div className="bg-white rounded-lg shadow-sm p-4 max-w-2xl">
          {!td.steps?.length && <div className="text-center py-8 text-gray-400 text-xs">No steps defined.</div>}
          <ol className="space-y-3">
            {td.steps?.map((step: string, i: number) => (
              <li key={i} className="flex gap-3 items-start">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#00C97B]/10 text-[#00C97B] text-xs font-bold flex items-center justify-center">{i + 1}</span>
                <span className="text-xs text-gray-700 pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {tab === 'Active Assignments' && (
        <DataTable columns={assignmentColumns} data={assignments} searchPlaceholder="Search assignments…" />
      )}
    </div>
  );
}
