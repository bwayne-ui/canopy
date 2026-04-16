'use client';

import PageHeader from '@/components/PageHeader';
import MetricCard from '@/components/MetricCard';
import DataTable, { Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { Eye, FileText, Clock, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { investorReports as reports } from '@/lib/docs-vault-data';

const columns: Column[] = [
  { key: 'name', label: 'Report', sortable: true, render: (v: string, row: any) => (
    <Link href={`/docs-vault/investor-reports/${row.id}`} className="block group">
      <div className="font-semibold text-gray-900 group-hover:text-[#00C97B] transition-colors">{v}</div>
      <div className="text-[10px] text-gray-400">{row.fund}</div>
    </Link>
  ) },
  { key: 'fund', label: 'Fund', sortable: true, render: (v: string) => v === 'All Funds' ? <span className="text-gray-500">{v}</span> : <Link href={`/data-vault/entities?search=${encodeURIComponent(v)}`} className="text-[#00C97B] hover:underline hover:text-[#00A866] transition-colors">{v}</Link> },
  { key: 'type', label: 'Type', render: (v: string) => <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700">{v}</span> },
  { key: 'period', label: 'Period', sortable: true },
  { key: 'dueDate', label: 'Due Date', sortable: true, render: (v) => <span className="text-xs">{v}</span> },
  { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
];

export default function InvestorReportsPage() {
  return (
    <div className="space-y-3">
      <PageHeader title="Investor Reports" subtitle="Quarterly letters, K-1s, performance reports, and board materials" breadcrumbs={[{ label: 'Document Library', href: '/docs-vault' }, { label: 'Investor Reports' }]} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
        <MetricCard title="Total Reports" value={reports.length} icon={<Eye className="w-4 h-4" />} color="teal" />
        <MetricCard title="Distributed" value={reports.filter(r => r.status === 'Distributed').length} icon={<CheckCircle2 className="w-4 h-4" />} color="green" />
        <MetricCard title="In Progress" value={reports.filter(r => r.status === 'In Progress' || r.status === 'Draft').length} icon={<FileText className="w-4 h-4" />} color="signal" />
        <MetricCard title="Upcoming" value={reports.filter(r => r.status === 'Scheduled' || r.status === 'Not Started').length} icon={<Clock className="w-4 h-4" />} color="amber" />
      </div>
      <DataTable columns={columns} data={reports} searchPlaceholder="Search investor reports..." />
    </div>
  );
}
