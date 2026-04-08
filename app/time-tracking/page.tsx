'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import MetricCard from '@/components/MetricCard';
import DataTable, { Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { fmtDate } from '@/lib/utils';
import { Clock, CheckCircle2, FileEdit, Send, Plus } from 'lucide-react';

interface TimesheetRow {
  id: string;
  timesheetId: string;
  userName: string;
  weekStarting: string;
  status: string;
  totalHours: number;
  billableHours: number;
  utilizationPct: number | null;
  entryCount: number;
  approvedByName: string | null;
}

export default function TimeTrackingPage() {
  const [sheets, setSheets] = useState<TimesheetRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => fetch('/api/timesheets').then((r) => r.json()).then((d) => { setSheets(d.items ?? []); setLoading(false); });
  useEffect(() => { load(); }, []);

  const draft = sheets.filter((s) => s.status === 'Draft').length;
  const submitted = sheets.filter((s) => s.status === 'Submitted').length;
  const approved = sheets.filter((s) => s.status === 'Approved').length;
  const totalHours = sheets.reduce((s, t) => s + t.totalHours, 0);
  const totalBillable = sheets.reduce((s, t) => s + t.billableHours, 0);
  const avgUtil = sheets.length ? sheets.reduce((s, t) => s + (t.utilizationPct ?? 0), 0) / sheets.length : 0;

  const columns: Column[] = [
    { key: 'timesheetId', label: 'Timesheet ID', sortable: true, render: (v: string, row: TimesheetRow) => (
      <Link href={`/time-tracking/${row.timesheetId}`} className="font-mono text-xs text-[#00C97B] hover:underline">{v}</Link>
    )},
    { key: 'userName', label: 'Employee', sortable: true, render: (v: string) => <span className="font-semibold">{v}</span> },
    { key: 'weekStarting', label: 'Week Starting', sortable: true, render: (v: string) => fmtDate(v) },
    { key: 'totalHours', label: 'Total Hrs', sortable: true, align: 'right', render: (v: number) => <span className="font-mono text-[11px]">{v.toFixed(2)}</span> },
    { key: 'billableHours', label: 'Billable Hrs', sortable: true, align: 'right', render: (v: number) => <span className="font-mono text-[11px] text-emerald-600">{v.toFixed(2)}</span> },
    { key: 'utilizationPct', label: 'Util %', sortable: true, align: 'right', render: (v: number | null) => v ? <span className="font-mono text-[11px]">{v.toFixed(1)}%</span> : '—' },
    { key: 'entryCount', label: 'Entries', sortable: true, align: 'right' },
    { key: 'status', label: 'Status', sortable: true, render: (v: string) => <StatusBadge status={v} /> },
    { key: 'approvedByName', label: 'Approver', render: (v: string | null) => v ?? <span className="text-gray-300">—</span> },
  ];

  if (loading) return <div className="flex items-center justify-center h-96 text-gray-400 text-xs">Loading timesheets...</div>;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Time Tracking"
        subtitle="Weekly timesheets, billable hours, and utilization"
        actions={
          <Link href="/time-tracking/new" className="bg-[#00C97B] hover:bg-[#00A866] text-white text-xs font-semibold px-3 py-1.5 rounded-md flex items-center gap-1.5">
            <Plus className="w-3 h-3" /> New Timesheet
          </Link>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
        <MetricCard title="Total Sheets" value={String(sheets.length)} icon={<Clock className="w-4 h-4" />} color="teal" />
        <MetricCard title="Draft" value={String(draft)} icon={<FileEdit className="w-4 h-4" />} color="amber" />
        <MetricCard title="Submitted" value={String(submitted)} icon={<Send className="w-4 h-4" />} color="signal" />
        <MetricCard title="Approved" value={String(approved)} icon={<CheckCircle2 className="w-4 h-4" />} color="green" />
        <MetricCard title="Total Hours" value={totalHours.toFixed(0)} color="teal" />
        <MetricCard title="Avg Util %" value={`${avgUtil.toFixed(1)}%`} change={`${totalBillable.toFixed(0)} billable`} changeType="up" color="green" />
      </div>

      <DataTable columns={columns} data={sheets} searchable searchPlaceholder="Search by employee or status..." />
    </div>
  );
}
