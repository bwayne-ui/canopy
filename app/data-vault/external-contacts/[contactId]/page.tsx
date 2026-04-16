'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';

function FieldRow({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex items-start py-1.5 border-b border-gray-50 last:border-0">
      <span className="w-40 flex-shrink-0 text-xs text-gray-500 font-medium">{label}</span>
      <span className="text-xs text-gray-800 font-medium">{value ?? '—'}</span>
    </div>
  );
}

function FieldSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">{title}</div>
      {children}
    </div>
  );
}

const TABS = ['Profile', 'Entity Links', 'Activity'] as const;
type Tab = typeof TABS[number];

export default function ExternalContactDetailPage() {
  const { contactId } = useParams<{ contactId: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('Profile');

  useEffect(() => {
    fetch(`/api/external-contacts/${contactId}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [contactId]);

  if (loading) return <div className="text-center py-16 text-gray-400">Loading contact…</div>;
  if (!data?.contact) return <div className="text-center py-16 text-red-400">Contact not found.</div>;

  const c = data.contact;
  const linkedEntities: any[] = data.linkedEntities ?? [];

  const typeColors: Record<string, string> = {
    Auditor: 'bg-blue-50 text-blue-700',
    'Legal Counsel': 'bg-purple-50 text-purple-700',
    'Fund Administrator': 'bg-teal-50 text-teal-700',
    'Tax Advisor': 'bg-amber-50 text-amber-700',
    Consultant: 'bg-gray-100 text-gray-600',
    Custodian: 'bg-indigo-50 text-indigo-700',
  };

  return (
    <div>
      <PageHeader
        title={c.name}
        subtitle={`${c.role} · ${c.organization}`}
        breadcrumbs={[
          { label: 'Data Vault', href: '/data-vault' },
          { label: 'External Contacts', href: '/data-vault/external-contacts' },
          { label: c.contactId },
        ]}
        actions={
          <Link href="/data-vault/external-contacts" className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-md">
            <ArrowLeft className="w-3 h-3" /> Back
          </Link>
        }
      />

      <div className="flex items-center gap-3 bg-white rounded-lg shadow-sm px-4 py-2.5 mb-3">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${typeColors[c.contactType] ?? 'bg-gray-100 text-gray-600'}`}>{c.contactType}</span>
        <StatusBadge status={c.status} />
        <span className="text-xs text-gray-500">{c.contactId}</span>
      </div>

      <div className="flex gap-1 mb-3 bg-white rounded-lg shadow-sm p-1">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${tab === t ? 'bg-[#00C97B]/10 text-[#00C97B]' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Profile' && (
        <div className="bg-white rounded-lg shadow-sm p-4 max-w-xl">
          <FieldSection title="Contact Details">
            <FieldRow label="Contact ID" value={c.contactId} />
            <FieldRow label="Full Name" value={c.name} />
            <FieldRow label="Organization" value={c.organization} />
            <FieldRow label="Role" value={c.role} />
            <FieldRow label="Type" value={c.contactType} />
            <FieldRow label="Status" value={c.status} />
          </FieldSection>
          <FieldSection title="Contact Information">
            <FieldRow label="Email" value={c.email} />
            <FieldRow label="Phone" value={c.phone} />
            <FieldRow label="City" value={c.city} />
            <FieldRow label="Country" value={c.country} />
          </FieldSection>
        </div>
      )}

      {tab === 'Entity Links' && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">
            Linked Entities ({linkedEntities.length})
          </div>
          {linkedEntities.length === 0 && (
            <div className="py-8 text-center text-gray-400 text-xs">No entities linked.</div>
          )}
          <div className="flex flex-wrap gap-2">
            {linkedEntities.map((e) => (
              <Link
                key={e.entityId}
                href={`/data-vault/entities/${e.entityId}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 hover:border-[#00C97B] hover:bg-[#00C97B]/5 transition-colors group"
              >
                <span className="text-xs font-semibold text-gray-700 group-hover:text-[#00C97B]">{e.name}</span>
                <span className="text-[10px] text-gray-400">{e.entityType}</span>
                <ExternalLink className="w-2.5 h-2.5 text-gray-400 group-hover:text-[#00C97B]" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {tab === 'Activity' && (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-400 text-xs">
          Communication and interaction history coming soon.
        </div>
      )}
    </div>
  );
}
