'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import { fundDocuments } from '@/lib/docs-vault-data';

function FieldRow({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex items-start py-1.5 border-b border-gray-50 last:border-0">
      <span className="w-40 flex-shrink-0 text-xs text-gray-500 font-medium">{label}</span>
      <span className="text-xs text-gray-800 font-medium">{value ?? '—'}</span>
    </div>
  );
}

export default function FundDocumentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const doc = fundDocuments.find((d) => d.id === id);

  if (!doc) return (
    <div className="text-center py-16">
      <div className="text-gray-400 text-xs">Document not found.</div>
      <Link href="/docs-vault/fund-documents" className="mt-4 inline-flex items-center gap-1 text-xs text-[#00C97B] hover:underline">
        <ArrowLeft className="w-3 h-3" /> Back to Fund Documents
      </Link>
    </div>
  );

  const confColors: Record<string, string> = {
    Restricted: 'bg-red-50 text-red-700',
    Confidential: 'bg-amber-50 text-amber-700',
    Internal: 'bg-gray-100 text-gray-600',
  };

  return (
    <div>
      <PageHeader
        title={doc.name}
        subtitle={`${doc.type} · ${doc.fund}`}
        breadcrumbs={[
          { label: 'Document Library', href: '/docs-vault' },
          { label: 'Fund Documents', href: '/docs-vault/fund-documents' },
          { label: doc.id },
        ]}
        actions={
          <Link href="/docs-vault/fund-documents" className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-md">
            <ArrowLeft className="w-3 h-3" /> Back
          </Link>
        }
      />

      <div className="flex items-center gap-3 bg-white rounded-lg shadow-sm px-4 py-2.5 mb-3">
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-600">{doc.type}</span>
        <StatusBadge status={doc.status} />
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${confColors[doc.confidentiality] ?? 'bg-gray-100 text-gray-600'}`}>{doc.confidentiality}</span>
        <span className="ml-auto text-[10px] text-gray-400">{doc.id}</span>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 max-w-xl">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-[#00C97B]" />
          <span className="font-semibold text-gray-800">{doc.name}</span>
        </div>
        <FieldRow label="Document ID" value={doc.id} />
        <FieldRow label="Fund" value={doc.fund} />
        <FieldRow label="Document Type" value={doc.type} />
        <FieldRow label="Version" value={doc.version} />
        <FieldRow label="Last Updated" value={doc.lastUpdated} />
        <FieldRow label="Status" value={doc.status} />
        <FieldRow label="Confidentiality" value={doc.confidentiality} />
      </div>
    </div>
  );
}
