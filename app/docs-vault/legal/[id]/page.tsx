'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Scale } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import { legalDocs } from '@/lib/docs-vault-data';

function FieldRow({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex items-start py-1.5 border-b border-gray-50 last:border-0">
      <span className="w-40 flex-shrink-0 text-xs text-gray-500 font-medium">{label}</span>
      <span className="text-xs text-gray-800 font-medium">{value ?? '—'}</span>
    </div>
  );
}

export default function LegalDocDetailPage() {
  const { id } = useParams<{ id: string }>();
  const doc = legalDocs.find((d) => d.id === id);

  if (!doc) return (
    <div className="text-center py-16">
      <div className="text-gray-400 text-xs">Document not found.</div>
      <Link href="/docs-vault/legal" className="mt-4 inline-flex items-center gap-1 text-xs text-[#00C97B] hover:underline">
        <ArrowLeft className="w-3 h-3" /> Back to Legal
      </Link>
    </div>
  );

  const categoryColors: Record<string, string> = {
    Engagement: 'bg-blue-50 text-blue-700',
    Resolution: 'bg-purple-50 text-purple-700',
    NDA: 'bg-amber-50 text-amber-700',
    Opinion: 'bg-teal-50 text-teal-700',
    Amendment: 'bg-indigo-50 text-indigo-700',
    POA: 'bg-orange-50 text-orange-700',
    Indemnity: 'bg-red-50 text-red-700',
  };

  return (
    <div>
      <PageHeader
        title={doc.name}
        subtitle={`${doc.category} · ${doc.counsel}`}
        breadcrumbs={[
          { label: 'Document Library', href: '/docs-vault' },
          { label: 'Legal', href: '/docs-vault/legal' },
          { label: doc.id },
        ]}
        actions={
          <Link href="/docs-vault/legal" className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-md">
            <ArrowLeft className="w-3 h-3" /> Back
          </Link>
        }
      />

      <div className="flex items-center gap-3 bg-white rounded-lg shadow-sm px-4 py-2.5 mb-3">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${categoryColors[doc.category] ?? 'bg-gray-100 text-gray-600'}`}>{doc.category}</span>
        <StatusBadge status={doc.status} />
        <span className="text-xs text-gray-500">{doc.counsel}</span>
        <span className="ml-auto text-[10px] text-gray-400">{doc.id}</span>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 max-w-xl">
        <div className="flex items-center gap-2 mb-4">
          <Scale className="w-5 h-5 text-[#00C97B]" />
          <span className="font-semibold text-gray-800">{doc.name}</span>
        </div>
        <FieldRow label="Document ID" value={doc.id} />
        <FieldRow label="Category" value={doc.category} />
        <FieldRow label="Counsel" value={doc.counsel} />
        <FieldRow label="Status" value={doc.status} />
        <FieldRow label="Date" value={doc.date} />
        <FieldRow label="Expiry" value={doc.expiry} />
      </div>
    </div>
  );
}
