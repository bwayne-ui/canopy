'use client';

import { useEffect, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import MetricCard from '@/components/MetricCard';
import DataTable, { Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { fmtDate } from '@/lib/utils';

const confidentialityStyles: Record<string, string> = {
  Restricted: 'bg-red-100 text-red-700',
  Confidential: 'bg-amber-100 text-amber-700',
  Internal: 'bg-blue-100 text-blue-700',
  Public: 'bg-emerald-100 text-emerald-700',
};

const columns: Column[] = [
  { key: 'documentId', label: 'Doc ID', render: (v: string) => <span>{v}</span> },
  { key: 'name', label: 'Name', sortable: true, render: (v: string) => <span className="font-medium text-gray-900">{v}</span> },
  { key: 'documentType', label: 'Type', sortable: true },
  { key: 'entityName', label: 'Entity / Client', render: (_v: any, row: any) => <span>{row.entityName || row.clientName || '—'}</span> },
  { key: 'status', label: 'Status', render: (v: string) => <StatusBadge status={v} /> },
  { key: 'uploadedBy', label: 'Uploaded By', sortable: true },
  { key: 'uploadDate', label: 'Upload Date', sortable: true, render: (v: string) => <span className="whitespace-nowrap">{fmtDate(v)}</span> },
  { key: 'version', label: 'Version' },
  { key: 'confidentiality', label: 'Confidentiality', render: (v: string) => <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${confidentialityStyles[v] || 'bg-gray-100 text-gray-700'}`}>{v}</span> },
];

export default function DocsVaultPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/documents').then((r) => r.json()).then((d) => setItems(d.items ?? [])).finally(() => setLoading(false));
  }, []);

  const executed = items.filter((d) => d.status === 'Executed').length;
  const underReview = items.filter((d) => d.status === 'Under Review').length;
  const draft = items.filter((d) => d.status === 'Draft').length;

  if (loading) return <div className="flex items-center justify-center h-96"><div className="animate-pulse text-gray-400">Loading Document Library...</div></div>;

  return (
    <div className="space-y-3">
      <PageHeader title="Document Library" subtitle="Document management and storage" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
        <MetricCard title="Total Documents" value={items.length} color="teal" />
        <MetricCard title="Executed" value={executed} color="green" />
        <MetricCard title="Under Review" value={underReview} color="amber" />
        <MetricCard title="Draft" value={draft} />
      </div>
      <DataTable columns={columns} data={items} searchPlaceholder="Search documents..." />
    </div>
  );
}
