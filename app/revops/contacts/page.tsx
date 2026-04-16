'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import MetricCard from '@/components/MetricCard';
import DataTable, { Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';

interface ContactRow {
  id: string;
  contactId: string;
  firstName: string;
  lastName: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  accountId: string | null;
  accountName: string | null;
  contactType: string;
  status: string;
  isPrimary: boolean;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/revops/contacts')
      .then((r) => r.json())
      .then((res) => setContacts(res.items ?? []))
      .finally(() => setLoading(false));
  }, []);

  const metrics = useMemo(() => {
    const total = contacts.length;
    const decisionMakers = contacts.filter((c) => c.contactType === 'Decision Maker').length;
    const champions = contacts.filter((c) => c.contactType === 'Champion').length;
    return { total, decisionMakers, champions };
  }, [contacts]);

  const columns: Column[] = [
    {
      key: 'firstName',
      label: 'Name',
      sortable: true,
      render: (_v, row: ContactRow) => (
        <span className="text-xs font-semibold text-gray-900">
          {row.firstName} {row.lastName}
        </span>
      ),
    },
    {
      key: 'title',
      label: 'Title',
      sortable: true,
      render: (v: string | null) => <span>{v ?? '—'}</span>,
    },
    {
      key: 'accountName',
      label: 'Account',
      sortable: true,
      render: (v: string | null, row: ContactRow) =>
        row.accountId ? (
          <Link
            href={`/revops/accounts/${row.accountId}`}
            className="text-[#00C97B] hover:underline"
          >
            {v ?? '—'}
          </Link>
        ) : (
          <span>{v ?? '—'}</span>
        ),
    },
    {
      key: 'contactType',
      label: 'Contact Type',
      sortable: true,
      render: (v: string) => (
        <span className="inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold bg-blue-100 text-blue-700">
          {v}
        </span>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      render: (v: string | null) =>
        v ? (
          <a href={`mailto:${v}`} className="text-[#00C97B] hover:underline">
            {v}
          </a>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (v: string) => <StatusBadge status={v} />,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-gray-400 text-xs">Loading contacts…</div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Contacts"
        breadcrumbs={[{ label: 'Revenue Ops', href: '/revops' }, { label: 'Contacts' }]}
      />

      <div className="grid grid-cols-3 gap-3 mb-4">
        <MetricCard title="Total Contacts" value={metrics.total} color="teal" />
        <MetricCard title="Decision Makers" value={metrics.decisionMakers} color="green" />
        <MetricCard title="Champions" value={metrics.champions} color="signal" />
      </div>

      <DataTable
        columns={columns}
        data={contacts}
        searchable
        searchPlaceholder="Search contacts…"
        emptyMessage="No contacts found."
      />
    </div>
  );
}
