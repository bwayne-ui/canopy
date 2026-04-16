'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText, Download } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { templates } from '@/lib/docs-vault-data';

function FieldRow({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex items-start py-1.5 border-b border-gray-50 last:border-0">
      <span className="w-40 flex-shrink-0 text-xs text-gray-500 font-medium">{label}</span>
      <span className="text-xs text-gray-800 font-medium">{value ?? '—'}</span>
    </div>
  );
}

const categoryColors: Record<string, string> = {
  Notices: 'bg-blue-50 text-blue-700',
  'Investor Relations': 'bg-indigo-50 text-indigo-700',
  Governance: 'bg-purple-50 text-purple-700',
  Legal: 'bg-amber-50 text-amber-700',
  Tax: 'bg-emerald-50 text-emerald-700',
  Onboarding: 'bg-teal-50 text-teal-700',
  Compliance: 'bg-red-50 text-red-700',
  'Fund Accounting': 'bg-cyan-50 text-cyan-700',
  Valuations: 'bg-orange-50 text-orange-700',
  Operations: 'bg-gray-100 text-gray-700',
};

export default function TemplateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const template = templates.find((t) => t.id === id);

  if (!template) return (
    <div className="text-center py-16">
      <div className="text-gray-400 text-xs">Template not found.</div>
      <Link href="/docs-vault/templates" className="mt-4 inline-flex items-center gap-1 text-xs text-[#00C97B] hover:underline">
        <ArrowLeft className="w-3 h-3" /> Back to Templates
      </Link>
    </div>
  );

  return (
    <div>
      <PageHeader
        title={template.name}
        subtitle={`${template.category} · ${template.version}`}
        breadcrumbs={[
          { label: 'Document Library', href: '/docs-vault' },
          { label: 'Templates', href: '/docs-vault/templates' },
          { label: template.id },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[#00C97B] hover:bg-[#00A866] px-3 py-1.5 rounded-md transition-colors">
              <Download className="w-3 h-3" /> Use Template
            </button>
            <Link href="/docs-vault/templates" className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-md">
              <ArrowLeft className="w-3 h-3" /> Back
            </Link>
          </div>
        }
      />

      <div className="flex items-center gap-3 bg-white rounded-lg shadow-sm px-4 py-2.5 mb-3">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${categoryColors[template.category] ?? 'bg-gray-100 text-gray-600'}`}>{template.category}</span>
        <span className="text-xs text-gray-500">{template.version}</span>
        <div className="h-3 w-px bg-gray-200" />
        <span className="text-xs text-gray-500">{template.usageCount} uses</span>
        <span className="ml-auto text-[10px] text-gray-400">{template.id}</span>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 max-w-xl">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-[#00C97B]" />
          <span className="font-semibold text-gray-800">{template.name}</span>
        </div>
        <FieldRow label="Template ID" value={template.id} />
        <FieldRow label="Category" value={template.category} />
        <FieldRow label="Version" value={template.version} />
        <FieldRow label="Owner" value={template.owner} />
        <FieldRow label="Last Updated" value={template.lastUpdated} />
        <FieldRow label="Total Uses" value={template.usageCount} />
      </div>
    </div>
  );
}
