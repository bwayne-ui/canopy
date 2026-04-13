'use client';

import PageHeader from '@/components/PageHeader';
import MetricCard from '@/components/MetricCard';
import DataTable, { Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { FileText, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

const docs = [
  { id: 'FD-001', name: 'Walker III — Limited Partnership Agreement', fund: 'Walker Enterprise Fund III', type: 'LPA', version: 'v3.2', lastUpdated: '2026-03-15', status: 'Executed', confidentiality: 'Restricted' },
  { id: 'FD-002', name: 'Campbell IV — PPM', fund: 'Campbell Growth Fund IV', type: 'PPM', version: 'v2.1', lastUpdated: '2025-11-20', status: 'Executed', confidentiality: 'Restricted' },
  { id: 'FD-003', name: 'Sullivan Alpha — Subscription Agreement', fund: 'Sullivan Alpha Fund', type: 'Subscription', version: 'v1.4', lastUpdated: '2026-02-28', status: 'Executed', confidentiality: 'Confidential' },
  { id: 'FD-004', name: 'Rodriguez EM FoF I — LPA Draft', fund: 'Rodriguez EM FoF I', type: 'LPA', version: 'v0.7', lastUpdated: '2026-04-03', status: 'Draft', confidentiality: 'Restricted' },
  { id: 'FD-005', name: 'White Credit V — Side Letter Compendium', fund: 'White Senior Credit Fund V', type: 'Side Letter', version: 'v2.0', lastUpdated: '2026-01-12', status: 'Executed', confidentiality: 'Restricted' },
  { id: 'FD-006', name: 'Lopez RE III — Investment Advisory Agreement', fund: 'Lopez RE Opportunities III', type: 'Advisory', version: 'v1.1', lastUpdated: '2025-09-30', status: 'Executed', confidentiality: 'Confidential' },
  { id: 'FD-007', name: 'Cruz II — Capital Call Notice Template', fund: 'Cruz Ventures Fund II', type: 'Notice', version: 'v3.0', lastUpdated: '2026-03-22', status: 'Active', confidentiality: 'Internal' },
  { id: 'FD-008', name: 'Walker I — Wind-Down Distribution Plan', fund: 'Walker Enterprise Fund I', type: 'Distribution', version: 'v1.0', lastUpdated: '2026-04-01', status: 'Under Review', confidentiality: 'Restricted' },
];

const columns: Column[] = [
  { key: 'name', label: 'Document', sortable: true, render: (v) => <span className="font-medium text-gray-900">{v}</span> },
  { key: 'fund', label: 'Fund', sortable: true },
  { key: 'type', label: 'Type', render: (v) => <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{v}</span> },
  { key: 'version', label: 'Ver', render: (v) => <span className="font-mono text-[10px]">{v}</span> },
  { key: 'lastUpdated', label: 'Updated', sortable: true, render: (v) => <span className="font-mono text-[11px]">{v}</span> },
  { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
];

export default function FundDocumentsPage() {
  return (
    <div className="space-y-3">
      <PageHeader title="Fund Documents" subtitle="LPAs, PPMs, subscription agreements, and side letters" breadcrumbs={[{ label: 'Docs Vault', href: '/docs-vault' }, { label: 'Fund Documents' }]} />
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
