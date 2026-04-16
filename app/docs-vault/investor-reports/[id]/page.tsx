'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Eye } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import { investorReports } from '@/lib/docs-vault-data';

function FieldRow({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex items-start py-1.5 border-b border-gray-50 last:border-0">
      <span className="w-40 flex-shrink-0 text-xs text-gray-500 font-medium">{label}</span>
      <span className="text-xs text-gray-800 font-medium">{value ?? '—'}</span>
    </div>
  );
}

export default function InvestorReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const report = investorReports.find((r) => r.id === id);

  if (!report) return (
    <div className="text-center py-16">
      <div className="text-gray-400 text-xs">Report not found.</div>
      <Link href="/docs-vault/investor-reports" className="mt-4 inline-flex items-center gap-1 text-xs text-[#00C97B] hover:underline">
        <ArrowLeft className="w-3 h-3" /> Back to Investor Reports
      </Link>
    </div>
  );

  return (
    <div>
      <PageHeader
        title={report.name}
        subtitle={`${report.type} · ${report.period}`}
        breadcrumbs={[
          { label: 'Document Library', href: '/docs-vault' },
          { label: 'Investor Reports', href: '/docs-vault/investor-reports' },
          { label: report.id },
        ]}
        actions={
          <Link href="/docs-vault/investor-reports" className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-md">
            <ArrowLeft className="w-3 h-3" /> Back
          </Link>
        }
      />

      <div className="flex items-center gap-3 bg-white rounded-lg shadow-sm px-4 py-2.5 mb-3">
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">{report.type}</span>
        <StatusBadge status={report.status} />
        <span className="text-xs text-gray-500">{report.period}</span>
        <span className="ml-auto text-[10px] text-gray-400">{report.id}</span>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 max-w-xl">
        <div className="flex items-center gap-2 mb-4">
          <Eye className="w-5 h-5 text-[#00C97B]" />
          <span className="font-semibold text-gray-800">{report.name}</span>
        </div>
        <FieldRow label="Report ID" value={report.id} />
        <FieldRow label="Fund" value={report.fund} />
        <FieldRow label="Report Type" value={report.type} />
        <FieldRow label="Period" value={report.period} />
        <FieldRow label="Due Date" value={report.dueDate} />
        <FieldRow label="Status" value={report.status} />
      </div>
    </div>
  );
}
