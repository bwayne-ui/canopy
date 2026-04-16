'use client';

import PageHeader from '@/components/PageHeader';
import MetricCard from '@/components/MetricCard';
import DataTable, { Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { Scale, FileText, Clock, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { legalDocs as docs } from '@/lib/docs-vault-data';

const columns: Column[] = [
  { key: 'name', label: 'Document', sortable: true, render: (v: string, row: any) => (
    <Link href={`/docs-vault/legal/${row.id}`} className="block group">
      <div className="font-semibold text-gray-900 group-hover:text-[#00C97B] transition-colors">{v}</div>
      <div className="text-[10px] text-gray-400">{row.counsel}</div>
    </Link>
  ) },
  { key: 'category', label: 'Category', render: (v) => <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-50 text-purple-700">{v}</span> },
  { key: 'counsel', label: 'Counsel', sortable: true, render: (v: string) => v === 'Internal' ? <span className="text-gray-500">{v}</span> : <Link href={`/data-vault/external-contacts?search=${encodeURIComponent(v)}`} className="text-[#00C97B] hover:underline hover:text-[#00A866] transition-colors">{v}</Link> },
  { key: 'date', label: 'Date', sortable: true, render: (v) => <span className="text-xs">{v}</span> },
  { key: 'expiry', label: 'Expiry', render: (v) => <span className="text-xs text-gray-400">{v}</span> },
  { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
];

export default function LegalPage() {
  return (
    <div className="space-y-3">
      <PageHeader title="Legal Documents" subtitle="Engagement letters, opinions, NDAs, and resolutions" breadcrumbs={[{ label: 'Document Library', href: '/docs-vault' }, { label: 'Legal' }]} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
        <MetricCard title="Total Legal Docs" value={docs.length} icon={<Scale className="w-4 h-4" />} color="teal" />
        <MetricCard title="Active" value={docs.filter(d => d.status === 'Active').length} icon={<CheckCircle2 className="w-4 h-4" />} color="green" />
        <MetricCard title="Pending" value={docs.filter(d => d.status === 'Draft' || d.status === 'Under Review').length} icon={<Clock className="w-4 h-4" />} color="amber" />
        <MetricCard title="Counsel Firms" value={new Set(docs.map(d => d.counsel)).size} icon={<FileText className="w-4 h-4" />} color="teal" />
      </div>
      <DataTable columns={columns} data={docs} searchPlaceholder="Search legal documents..." />
    </div>
  );
}
