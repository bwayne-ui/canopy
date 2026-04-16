'use client';

import PageHeader from '@/components/PageHeader';
import MetricCard from '@/components/MetricCard';
import DataTable, { Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { Shield, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { complianceDocs as docs } from '@/lib/docs-vault-data';

const columns: Column[] = [
  { key: 'name', label: 'Document', sortable: true, render: (v: string, row: any) => (
    <Link href={`/docs-vault/compliance/${row.id}`} className="block group">
      <div className="font-semibold text-gray-900 group-hover:text-[#00C97B] transition-colors">{v}</div>
      <div className="text-[10px] text-gray-400">{row.regulation}</div>
    </Link>
  ) },
  { key: 'category', label: 'Category', render: (v) => <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">{v}</span> },
  { key: 'regulation', label: 'Regulation', sortable: true },
  { key: 'lastFiled', label: 'Last Filed', sortable: true, render: (v) => <span className="text-xs">{v}</span> },
  { key: 'nextDue', label: 'Next Due', sortable: true, render: (v) => <span className="text-xs">{v}</span> },
  { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
];

export default function ComplianceDocsPage() {
  return (
    <div className="space-y-3">
      <PageHeader title="Compliance Documents" subtitle="Regulatory filings, certifications, and compliance records" breadcrumbs={[{ label: 'Document Library', href: '/docs-vault' }, { label: 'Compliance' }]} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
        <MetricCard title="Total Filings" value={docs.length} icon={<Shield className="w-4 h-4" />} color="teal" />
        <MetricCard title="Current" value={docs.filter(d => d.status === 'Current').length} icon={<CheckCircle2 className="w-4 h-4" />} color="green" />
        <MetricCard title="Due Soon" value={docs.filter(d => d.status === 'Due Soon').length} icon={<AlertCircle className="w-4 h-4" />} color="red" />
        <MetricCard title="Scheduled" value={docs.filter(d => d.status === 'Scheduled').length} icon={<Clock className="w-4 h-4" />} color="amber" />
      </div>
      <DataTable columns={columns} data={docs} searchPlaceholder="Search compliance documents..." />
    </div>
  );
}
