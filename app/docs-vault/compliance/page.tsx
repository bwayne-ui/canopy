'use client';

import PageHeader from '@/components/PageHeader';
import MetricCard from '@/components/MetricCard';
import DataTable, { Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { Shield, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

const docs = [
  { id: 'CD-001', name: 'FATCA/CRS Classification — All Funds', category: 'Tax Compliance', regulation: 'FATCA/CRS', lastFiled: '2025-03-15', nextDue: '2026-04-15', status: 'Due Soon' },
  { id: 'CD-002', name: 'Form PF — Annual Update', category: 'SEC Reporting', regulation: 'Dodd-Frank', lastFiled: '2025-04-30', nextDue: '2026-04-30', status: 'Due Soon' },
  { id: 'CD-003', name: 'ADV Annual Amendment', category: 'SEC Reporting', regulation: 'Advisers Act', lastFiled: '2025-05-15', nextDue: '2026-05-15', status: 'Scheduled' },
  { id: 'CD-004', name: 'AML/KYC Policy — Annual Review', category: 'AML', regulation: 'BSA/AML', lastFiled: '2025-09-01', nextDue: '2026-09-01', status: 'Current' },
  { id: 'CD-005', name: 'ERISA Compliance Certificate — White Credit V', category: 'ERISA', regulation: 'ERISA', lastFiled: '2025-12-31', nextDue: '2026-12-31', status: 'Current' },
  { id: 'CD-006', name: 'Insider Trading Policy Acknowledgments', category: 'Internal', regulation: 'Securities Act', lastFiled: '2026-01-15', nextDue: '2027-01-15', status: 'Current' },
  { id: 'CD-007', name: 'CalPERS Annual Compliance Questionnaire', category: 'Investor', regulation: 'CalPERS Policy', lastFiled: '2025-04-22', nextDue: '2026-04-22', status: 'Due Soon' },
  { id: 'CD-008', name: 'Beneficial Ownership Filings', category: 'FinCEN', regulation: 'CTA', lastFiled: '2025-06-30', nextDue: '2026-06-30', status: 'Current' },
  { id: 'CD-009', name: 'Code of Ethics Annual Certification', category: 'Internal', regulation: 'Advisers Act', lastFiled: '2026-01-31', nextDue: '2027-01-31', status: 'Current' },
];

const columns: Column[] = [
  { key: 'name', label: 'Document', sortable: true, render: (v) => <span className="font-medium text-gray-900">{v}</span> },
  { key: 'category', label: 'Category', render: (v) => <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">{v}</span> },
  { key: 'regulation', label: 'Regulation', sortable: true },
  { key: 'lastFiled', label: 'Last Filed', sortable: true, render: (v) => <span className="font-mono text-[11px]">{v}</span> },
  { key: 'nextDue', label: 'Next Due', sortable: true, render: (v) => <span className="font-mono text-[11px]">{v}</span> },
  { key: 'status', label: 'Status', render: (v) => <StatusBadge status={v} /> },
];

export default function ComplianceDocsPage() {
  return (
    <div className="space-y-5">
      <PageHeader title="Compliance Documents" subtitle="Regulatory filings, certifications, and compliance records" breadcrumbs={[{ label: 'Docs Vault', href: '/docs-vault' }, { label: 'Compliance' }]} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard title="Total Filings" value={docs.length} icon={<Shield className="w-4 h-4" />} color="teal" />
        <MetricCard title="Current" value={docs.filter(d => d.status === 'Current').length} icon={<CheckCircle2 className="w-4 h-4" />} color="green" />
        <MetricCard title="Due Soon" value={docs.filter(d => d.status === 'Due Soon').length} icon={<AlertCircle className="w-4 h-4" />} color="red" />
        <MetricCard title="Scheduled" value={docs.filter(d => d.status === 'Scheduled').length} icon={<Clock className="w-4 h-4" />} color="amber" />
      </div>
      <DataTable columns={columns} data={docs} searchPlaceholder="Search compliance documents..." />
    </div>
  );
}
