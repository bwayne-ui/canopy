'use client';

import PageHeader from '@/components/PageHeader';
import MetricCard from '@/components/MetricCard';
import DataTable, { Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { Scale, FileText, Clock, CheckCircle2 } from 'lucide-react';

const docs = [
  { id: 'LG-001', name: 'K&E Engagement Letter — Walker III', category: 'Engagement', counsel: 'Kirkland & Ellis', date: '2026-01-15', expiry: '2027-01-15', status: 'Active' },
  { id: 'LG-002', name: 'Board Resolution — Credit Facility Draw', category: 'Resolution', counsel: 'Internal', date: '2026-03-28', expiry: '—', status: 'Executed' },
  { id: 'LG-003', name: 'NDA — Potential Co-Investor (Blackstone)', category: 'NDA', counsel: 'Simpson Thacher', date: '2026-02-10', expiry: '2027-02-10', status: 'Active' },
  { id: 'LG-004', name: 'Regulatory Opinion — FATCA Classification', category: 'Opinion', counsel: 'Kirkland & Ellis', date: '2025-11-20', expiry: '—', status: 'Final' },
  { id: 'LG-005', name: 'Side Letter — MFN Amendment (CalPERS)', category: 'Amendment', counsel: 'Kirkland & Ellis', date: '2026-03-10', expiry: '—', status: 'Under Review' },
  { id: 'LG-006', name: 'Power of Attorney — Fund Dissolution (Walker I)', category: 'POA', counsel: 'Ropes & Gray', date: '2026-04-01', expiry: '2026-12-31', status: 'Active' },
  { id: 'LG-007', name: 'Indemnification Agreement — GP', category: 'Indemnity', counsel: 'Internal', date: '2024-06-01', expiry: '—', status: 'Active' },
  { id: 'LG-008', name: 'Investment Advisory Amendment — Lopez RE III', category: 'Amendment', counsel: 'Simpson Thacher', date: '2026-03-22', expiry: '—', status: 'Draft' },
];

const columns: Column[] = [
  { key: 'name', label: 'Document', sortable: true, render: (v) => <span className="font-medium text-gray-900">{v}</span> },
  { key: 'category', label: 'Category', render: (v) => <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-50 text-purple-700">{v}</span> },
  { key: 'counsel', label: 'Counsel', sortable: true },
  { key: 'date', label: 'Date', sortable: true, render: (v) => <span className="font-mono text-[11px]">{v}</span> },
  { key: 'expiry', label: 'Expiry', render: (v) => <span className="font-mono text-[11px] text-gray-400">{v}</span> },
  { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
];

export default function LegalPage() {
  return (
    <div className="space-y-5">
      <PageHeader title="Legal Documents" subtitle="Engagement letters, opinions, NDAs, and resolutions" breadcrumbs={[{ label: 'Docs Vault', href: '/docs-vault' }, { label: 'Legal' }]} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard title="Total Legal Docs" value={docs.length} icon={<Scale className="w-4 h-4" />} color="teal" />
        <MetricCard title="Active" value={docs.filter(d => d.status === 'Active').length} icon={<CheckCircle2 className="w-4 h-4" />} color="green" />
        <MetricCard title="Pending" value={docs.filter(d => d.status === 'Draft' || d.status === 'Under Review').length} icon={<Clock className="w-4 h-4" />} color="amber" />
        <MetricCard title="Counsel Firms" value={new Set(docs.map(d => d.counsel)).size} icon={<FileText className="w-4 h-4" />} color="teal" />
      </div>
      <DataTable columns={columns} data={docs} searchPlaceholder="Search legal documents..." />
    </div>
  );
}
