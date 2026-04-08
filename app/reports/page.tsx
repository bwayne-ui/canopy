'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import MetricCard from '@/components/MetricCard';
import DataTable, { Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { fmtDate } from '@/lib/utils';
import { FileBarChart, Lock, Users, Globe2, Building, Plus } from 'lucide-react';

interface ReportRow {
  id: string;
  reportId: string;
  name: string;
  category: string;
  format: string;
  frequency: string;
  recipients: string;
  querySource: string;
  ownerName: string;
  visibility: string;
  requiredRole: string | null;
  status: string;
  version: string;
  lastRunAt: string | null;
  nextRunAt: string | null;
  runCount: number;
}

const visibilityIcon = (v: string) => {
  if (v === 'Private') return <Lock className="w-3 h-3" />;
  if (v === 'Team') return <Users className="w-3 h-3" />;
  if (v === 'Org') return <Building className="w-3 h-3" />;
  return <Globe2 className="w-3 h-3" />;
};

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reports').then((r) => r.json()).then((d) => { setReports(d.items ?? []); setLoading(false); });
  }, []);

  const scheduled = reports.filter((r) => r.frequency !== 'On-Demand').length;
  const onDemand = reports.filter((r) => r.frequency === 'On-Demand').length;
  const skillBacked = reports.filter((r) => r.querySource === 'skill').length;

  const columns: Column[] = [
    { key: 'reportId', label: 'Report ID', sortable: true, render: (v: string, row: ReportRow) => (
      <Link href={`/reports/${row.reportId}`} className="font-mono text-xs text-[#00C97B] hover:underline">{v}</Link>
    )},
    { key: 'name', label: 'Name', sortable: true, render: (v: string) => <span className="font-semibold text-gray-900">{v}</span> },
    { key: 'category', label: 'Category', sortable: true, render: (v: string) => (
      <span className="inline-block rounded-full bg-gray-100 text-gray-700 px-2 py-0.5 text-[10px] font-medium">{v}</span>
    )},
    { key: 'querySource', label: 'Source', render: (v: string) => (
      <span className="font-mono text-[10px] text-gray-500">{v}</span>
    )},
    { key: 'frequency', label: 'Frequency', sortable: true },
    { key: 'visibility', label: 'Visibility', render: (v: string) => (
      <span className="inline-flex items-center gap-1 text-[11px] text-gray-600">{visibilityIcon(v)}{v}</span>
    )},
    { key: 'requiredRole', label: 'Min Role', render: (v: string | null) => v ?? <span className="text-gray-300">—</span> },
    { key: 'ownerName', label: 'Owner', sortable: true, render: (v: string) => <span className="text-[11px]">{v}</span> },
    { key: 'runCount', label: 'Runs', sortable: true, align: 'right', render: (v: number) => <span className="font-mono text-[11px]">{v}</span> },
    { key: 'lastRunAt', label: 'Last Run', sortable: true, render: (v: string | null) => v ? fmtDate(v) : '—' },
    { key: 'status', label: 'Status', sortable: true, render: (v: string) => <StatusBadge status={v} /> },
  ];

  if (loading) return <div className="flex items-center justify-center h-96 text-gray-400 text-xs">Loading reports...</div>;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Reports"
        subtitle="Reusable query logic, parameter framework, and permissioned execution"
        actions={
          <Link href="/reports/new" className="bg-[#00C97B] hover:bg-[#00A866] text-white text-xs font-semibold px-3 py-1.5 rounded-md flex items-center gap-1.5">
            <Plus className="w-3 h-3" /> New Report
          </Link>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard title="Total Reports" value={String(reports.length)} icon={<FileBarChart className="w-4 h-4" />} color="teal" />
        <MetricCard title="Scheduled" value={String(scheduled)} color="green" />
        <MetricCard title="On-Demand" value={String(onDemand)} color="amber" />
        <MetricCard title="Skill-Backed" value={String(skillBacked)} color="signal" />
      </div>

      <DataTable columns={columns} data={reports} searchable searchPlaceholder="Search reports..." />
    </div>
  );
}
