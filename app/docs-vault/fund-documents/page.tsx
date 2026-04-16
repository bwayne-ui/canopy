'use client';

import PageHeader from '@/components/PageHeader';
import MetricCard from '@/components/MetricCard';
import DataTable, { Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { FileText, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { fundDocuments as docs } from '@/lib/docs-vault-data';

const columns: Column[] = [
  { key: 'name', label: 'Document', sortable: true, render: (v: string, row: any) => (
    <Link href={`/docs-vault/fund-documents/${row.id}`} className="block group">
      <div className="font-semibold text-gray-900 group-hover:text-[#00C97B] transition-colors">{v}</div>
      <div className="text-[10px] text-gray-400">{row.fund}</div>
    </Link>
  ) },
  { key: 'fund', label: 'Fund', sortable: true, render: (v: string) => <Link href={`/data-vault/entities?search=${encodeURIComponent(v)}`} className="text-[#00C97B] hover:underline hover:text-[#00A866] transition-colors">{v}</Link> },
  { key: 'type', label: 'Type', render: (v) => <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{v}</span> },
  { key: 'version', label: 'Ver', render: (v) => <span>{v}</span> },
  { key: 'lastUpdated', label: 'Updated', sortable: true, render: (v) => <span className="text-xs">{v}</span> },
  { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
];

export default function FundDocumentsPage() {
  return (
    <div className="space-y-3">
      <PageHeader title="Fund Documents" subtitle="LPAs, PPMs, subscription agreements, and side letters" breadcrumbs={[{ label: 'Document Library', href: '/docs-vault' }, { label: 'Fund Documents' }]} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
        <MetricCard title="Total" value={docs.length} icon={<FileText className="w-4 h-4" />} color="teal" />
        <MetricCard title="Executed" value={docs.filter(d => d.status === 'Executed').length} icon={<CheckCircle2 className="w-4 h-4" />} color="green" />
        <MetricCard title="Draft / Review" value={docs.filter(d => d.status === 'Draft' || d.status === 'Under Review').length} icon={<Clock className="w-4 h-4" />} color="amber" />
        <MetricCard title="Restricted" value={docs.filter(d => d.confidentiality === 'Restricted').length} icon={<AlertCircle className="w-4 h-4" />} color="red" />
      </div>
      <DataTable columns={columns} data={docs} searchPlaceholder="Search fund documents..." />
    </div>
  );
}
