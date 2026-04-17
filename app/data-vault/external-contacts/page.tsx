'use client';

import { useEffect, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import MetricCard from '@/components/MetricCard';
import DataTable, { Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { Contact, UserCheck, Tag } from 'lucide-react';
import Link from 'next/link';

interface ExternalContactRow {
  id: number;
  contactId: string;
  name: string;
  organization: string;
  role: string;
  contactType: string;
  email: string;
  city: string;
  status: string;
}

const typeBadgeColors: Record<string, string> = {
  Auditor: 'bg-purple-100 text-purple-700',
  'Legal Counsel': 'bg-indigo-100 text-indigo-700',
  Custodian: 'bg-teal-100 text-teal-700',
  Broker: 'bg-blue-100 text-blue-700',
  Consultant: 'bg-cyan-100 text-cyan-700',
  Regulator: 'bg-red-100 text-red-700',
  Vendor: 'bg-orange-100 text-orange-700',
  Counterparty: 'bg-amber-100 text-amber-700',
};

const typeBadge = (type: string) => {
  const color = typeBadgeColors[type] || 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
      {type}
    </span>
  );
};

const columns: Column[] = [
  { key: 'contactId', label: 'Contact ID', sortable: true, render: (v) => <span className="text-gray-600">{v}</span> },
  { key: 'name', label: 'Name', sortable: true, render: (v: string, row: any) => (
    <Link href={`/data-vault/external-contacts/${row.contactId}`} className="block group">
      <div className="font-semibold text-gray-900 group-hover:text-[#00C97B] transition-colors">{v}</div>
      <div className="text-[10px] text-gray-400">{row.organization}</div>
    </Link>
  ) },
  { key: 'organization', label: 'Organization', sortable: true },
  { key: 'role', label: 'Role', sortable: true },
  { key: 'contactType', label: 'Type', sortable: true, render: (v) => typeBadge(v) },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'city', label: 'City', sortable: true },
  { key: 'status', label: 'Status', sortable: true, render: (v) => <StatusBadge status={v} /> },
];

export default function ExternalContactsPage() {
  const [items, setItems] = useState<ExternalContactRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInit, setSearchInit] = useState('');

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('search');
    if (q) setSearchInit(q);
  }, []);

  useEffect(() => {
    fetch('/api/external-contacts')
      .then((r) => r.json())
      .then((data) => setItems(data.items))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-96"><div className="animate-pulse text-gray-400">Loading external contacts...</div></div>;
  }

  const total = items.length;
  const active = items.filter((i) => i.status === 'Active').length;
  const contactTypes = new Set(items.map((i) => i.contactType)).size;

  return (
    <div className="space-y-3">
      <PageHeader
        title="External Contacts"
        subtitle="Third-party contacts and service providers"
        breadcrumbs={[
          { label: 'Data Vault', href: '/data-vault' },
          { label: 'External Contacts' },
        ]}
      />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3\">
        <MetricCard title="Total Contacts" value={String(total)} icon={<Contact className="w-4 h-4" />} color="teal" href="/data-vault/external-contacts" />
        <MetricCard title="Active" value={String(active)} icon={<UserCheck className="w-4 h-4" />} color="green" href="/data-vault/external-contacts" />
        <MetricCard title="Contact Types" value={String(contactTypes)} icon={<Tag className="w-4 h-4" />} color="signal" href="/data-vault/external-contacts" />
      </div>

      <DataTable columns={columns} data={items} searchPlaceholder="Search contacts..." initialSearch={searchInit} />
    </div>
  );
}
