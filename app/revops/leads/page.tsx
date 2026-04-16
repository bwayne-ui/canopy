'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/PageHeader';
import MetricCard from '@/components/MetricCard';
import DataTable, { Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';

interface LeadRow {
  id: string;
  leadId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  company: string | null;
  title: string | null;
  leadSource: string;
  status: string;
  ownerName: string | null;
  createdAt: string;
}

export default function LeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/revops/leads')
      .then((r) => r.json())
      .then((res) => setLeads(res.items ?? []))
      .finally(() => setLoading(false));
  }, []);

  const metrics = useMemo(() => {
    const total = leads.length;
    const newCount = leads.filter((l) => l.status === 'New').length;
    const working = leads.filter((l) => l.status === 'Working').length;
    const converted = leads.filter((l) => l.status === 'Converted').length;
    return { total, newCount, working, converted };
  }, [leads]);

  async function convertLead(id: string) {
    setConverting(id);
    const res = await fetch(`/api/revops/leads/${id}/convert`, { method: 'POST' });
    const data = await res.json();
    router.push(`/revops/opportunities/${data.opportunity.id}`);
  }

  const columns: Column[] = [
    {
      key: 'firstName',
      label: 'Name',
      sortable: true,
      render: (_v, row: LeadRow) => (
        <span className="font-semibold text-gray-900">
          {row.firstName} {row.lastName}
        </span>
      ),
    },
    {
      key: 'company',
      label: 'Company',
      sortable: true,
      render: (v: string | null) => <span>{v ?? '—'}</span>,
    },
    {
      key: 'title',
      label: 'Title',
      sortable: true,
      render: (v: string | null) => <span>{v ?? '—'}</span>,
    },
    {
      key: 'leadSource',
      label: 'Source',
      sortable: true,
      render: (v: string) => <span>{v}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (v: string) => <StatusBadge status={v} />,
    },
    {
      key: 'ownerName',
      label: 'Owner',
      sortable: true,
      render: (v: string | null) => <span>{v ?? '—'}</span>,
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (v: string) => (
        <span className="font-mono text-[10px] text-gray-500">
          {v ? v.slice(0, 10) : '—'}
        </span>
      ),
    },
    {
      key: 'id',
      label: 'Actions',
      render: (_v, row: LeadRow) =>
        row.status === 'New' || row.status === 'Working' ? (
          <button
            onClick={(e) => { e.stopPropagation(); convertLead(row.id); }}
            disabled={converting === row.id}
            className="text-[10px] font-semibold text-[#00C97B] hover:underline cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {converting === row.id ? 'Converting…' : 'Convert'}
          </button>
        ) : (
          <span className="text-[10px] text-gray-300">—</span>
        ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-gray-400 text-xs">Loading leads…</div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Leads"
        breadcrumbs={[{ label: 'Revenue Ops', href: '/revops' }, { label: 'Leads' }]}
      />

      <div className="grid grid-cols-4 gap-3 mb-4">
        <MetricCard title="Total Leads" value={metrics.total} color="teal" />
        <MetricCard title="New" value={metrics.newCount} color="green" />
        <MetricCard title="Working" value={metrics.working} color="amber" />
        <MetricCard
          title="Converted"
          value={`${metrics.converted} / ${metrics.total}`}
          color="signal"
        />
      </div>

      <DataTable
        columns={columns}
        data={leads}
        searchable
        searchPlaceholder="Search leads…"
        emptyMessage="No leads found."
      />
    </div>
  );
}
