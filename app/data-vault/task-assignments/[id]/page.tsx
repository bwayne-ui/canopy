'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Clock, User } from 'lucide-react';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';

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

const TABS = ['Assignment', 'SOP Details', 'History'] as const;
type Tab = typeof TABS[number];

const priorityColors: Record<string, string> = {
  Critical: 'bg-red-50 text-red-700 border-red-200',
  High: 'bg-orange-50 text-orange-700 border-orange-200',
  Medium: 'bg-amber-50 text-amber-700 border-amber-200',
  Low: 'bg-gray-50 text-gray-600 border-gray-200',
};

export default function TaskAssignmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('Assignment');

  useEffect(() => {
    fetch(`/api/task-assignments/${id}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-center py-16 text-gray-400">Loading assignment…</div>;
  if (!data?.assignment) return <div className="text-center py-16 text-red-400">Assignment not found.</div>;

  const a = data.assignment;
  const td = data.taskDefinition;
  const emp = data.assignedTo;

  return (
    <div>
      <PageHeader
        title={a.taskName}
        subtitle={`${a.taskCode} · ${a.entityName}`}
        breadcrumbs={[
          { label: 'Data Vault', href: '/data-vault' },
          { label: 'Task Assignments', href: '/data-vault/task-assignments' },
          { label: a.taskCode },
        ]}
        actions={
          <Link href="/data-vault/task-assignments" className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-md">
            <ArrowLeft className="w-3 h-3" /> Back
          </Link>
        }
      />

      <div className="flex items-center gap-3 bg-white rounded-lg shadow-sm px-4 py-2.5 mb-3 flex-wrap">
        <StatusBadge status={a.status} />
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${priorityColors[a.priority] ?? priorityColors.Medium}`}>{a.priority}</span>
        {emp && (
          <><div className="h-3 w-px bg-gray-200" />
          <Link href={`/data-vault/internal-users/${emp.employeeId}`} className="flex items-center gap-1 text-xs text-[#00C97B] hover:underline font-semibold">
            <User className="w-3 h-3" />{emp.name}
          </Link></>
        )}
        <div className="h-3 w-px bg-gray-200" />
        <span className="flex items-center gap-1 text-xs text-gray-500"><Clock className="w-3 h-3" /> Due {a.dueDate}</span>
      </div>

      <div className="flex gap-1 mb-3 bg-white rounded-lg shadow-sm p-1">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${tab === t ? 'bg-[#00C97B]/10 text-[#00C97B]' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Assignment' && (
        <div className="grid grid-cols-4 gap-3">
          <div className="col-span-3 bg-white rounded-lg shadow-sm p-4">
            <FieldSection title="Assignment Details">
              <FieldRow label="Task Name" value={a.taskName} />
              <FieldRow label="Task Code" value={a.taskCode} />
              <FieldRow label="Entity" value={a.entityName} />
              <FieldRow label="Period End" value={a.periodEnd} />
              <FieldRow label="Status" value={a.status} />
              <FieldRow label="Priority" value={a.priority} />
              <FieldRow label="Due Date" value={a.dueDate} />
              <FieldRow label="Completed Date" value={a.completedDate} />
            </FieldSection>
            {a.notes && (
              <FieldSection title="Notes">
                <p className="text-xs text-gray-700">{a.notes}</p>
              </FieldSection>
            )}
          </div>
          <div className="space-y-3">
            {emp && (
              <div className="bg-white rounded-lg shadow-sm p-3">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Assigned To</div>
                <Link href={`/data-vault/internal-users/${emp.employeeId}`} className="block group">
                  <div className="font-semibold text-gray-800 group-hover:text-[#00C97B] text-xs">{emp.name}</div>
                  <div className="text-[10px] text-gray-500">{emp.title}</div>
                  <div className="text-[10px] text-gray-400">{emp.department}</div>
                  <div className="text-[10px] text-gray-400">{emp.email}</div>
                </Link>
              </div>
            )}
            <div className="bg-white rounded-lg shadow-sm p-3">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Task Def</div>
              <Link href={`/data-vault/task-definitions/${a.taskCode}`} className="text-xs text-[#00C97B] hover:underline font-semibold">{a.taskCode}</Link>
              <div className="text-[10px] text-gray-500 mt-1">{td?.category} · {td?.frequency}</div>
              <div className="text-[10px] text-gray-400">{td?.estimatedMinutes} min est.</div>
            </div>
          </div>
        </div>
      )}

      {tab === 'SOP Details' && td && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <FieldSection title="Task Definition">
            <FieldRow label="Name" value={td.name} />
            <FieldRow label="Code" value={td.taskCode} />
            <FieldRow label="Category" value={td.category} />
            <FieldRow label="Frequency" value={td.frequency} />
            <FieldRow label="Department" value={td.department} />
            <FieldRow label="Est. Minutes" value={td.estimatedMinutes} />
          </FieldSection>
          <FieldSection title="Description">
            <p className="text-xs text-gray-700">{td.description}</p>
          </FieldSection>
          {td.steps?.length > 0 && (
            <FieldSection title="Process Steps">
              <ol className="space-y-2 mt-1">
                {td.steps.map((step: string, i: number) => (
                  <li key={i} className="flex gap-2.5">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#00C97B]/10 text-[#00C97B] text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                    <span className="text-xs text-gray-700">{step}</span>
                  </li>
                ))}
              </ol>
            </FieldSection>
          )}
        </div>
      )}

      {tab === 'History' && (
        <div className="bg-white rounded-lg shadow-sm p-4 max-w-lg">
          <FieldSection title="Timeline">
            <FieldRow label="Created" value={a.createdAt?.slice(0, 10)} />
            <FieldRow label="Last Updated" value={a.updatedAt?.slice(0, 10)} />
            <FieldRow label="Completed" value={a.completedDate} />
          </FieldSection>
        </div>
      )}
    </div>
  );
}
