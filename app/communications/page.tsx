'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import MetricCard from '@/components/MetricCard';
import DataTable, { Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { fmtDate } from '@/lib/utils';

interface CommunicationRow {
  id: string;
  communicationId: string;
  channel: string;
  direction: string;
  subject: string;
  summary: string | null;
  fromName: string;
  toName: string;
  clientName: string | null;
  sentiment: string | null;
  urgency: string;
  status: string;
  communicationDate: string;
  hasAttachments: boolean;
}

const channelStyles: Record<string, string> = {
  Email: 'bg-blue-100 text-blue-700',
  Phone: 'bg-green-100 text-green-700',
  Meeting: 'bg-purple-100 text-purple-700',
  Slack: 'bg-amber-100 text-amber-700',
};

const directionStyles: Record<string, string> = {
  Inbound: 'bg-cyan-100 text-cyan-700',
  Outbound: 'bg-indigo-100 text-indigo-700',
  Internal: 'bg-gray-100 text-gray-600',
};

const sentimentDot: Record<string, string> = {
  Positive: 'bg-green-500',
  Neutral: 'bg-gray-400',
  Negative: 'bg-red-500',
  Concerned: 'bg-amber-500',
};

const urgencyStyles: Record<string, string> = {
  Urgent: 'bg-red-100 text-red-700',
  High: 'bg-amber-100 text-amber-700',
  Normal: 'bg-gray-100 text-gray-600',
  Low: 'bg-gray-100 text-gray-500',
};

const columns: Column[] = [
  { key: 'communicationDate', label: 'Date', sortable: true, render: (v: string) => <span className="text-sm whitespace-nowrap">{fmtDate(v)}</span> },
  { key: 'channel', label: 'Channel', render: (v: string) => <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${channelStyles[v] || 'bg-gray-100 text-gray-700'}`}>{v}</span> },
  { key: 'direction', label: 'Direction', render: (v: string) => <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${directionStyles[v] || 'bg-gray-100 text-gray-700'}`}>{v}</span> },
  { key: 'subject', label: 'Subject', sortable: true, render: (v: string) => <span className="font-medium text-gray-900 block max-w-[240px] truncate" title={v}>{v}</span> },
  { key: 'fromName', label: 'From', sortable: true, render: (v: string) => <Link href={`/data-vault/internal-users?search=${encodeURIComponent(v)}`} className="text-[#00C97B] hover:underline hover:text-[#00A866] transition-colors">{v}</Link> },
  { key: 'toName', label: 'To', sortable: true, render: (v: string) => <Link href={`/data-vault/internal-users?search=${encodeURIComponent(v)}`} className="text-[#00C97B] hover:underline hover:text-[#00A866] transition-colors">{v}</Link> },
  { key: 'clientName', label: 'Client', sortable: true, render: (v: string | null) => v ? <Link href={`/data-vault/clients?search=${encodeURIComponent(v)}`} className="text-[#00C97B] hover:underline hover:text-[#00A866] transition-colors">{v}</Link> : '—' },
  { key: 'sentiment', label: 'Sentiment', render: (v: string | null) => v ? (
    <div className="flex items-center gap-2"><span className={`inline-block h-2.5 w-2.5 rounded-full ${sentimentDot[v] || 'bg-gray-400'}`} /><span className="text-xs text-gray-600">{v}</span></div>
  ) : <span className="text-gray-300">—</span> },
  { key: 'urgency', label: 'Urgency', render: (v: string) => <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${urgencyStyles[v] || 'bg-gray-100 text-gray-700'}`}>{v}</span> },
  { key: 'status', label: 'Status', render: (v: string) => <StatusBadge status={v} /> },
];

export default function CommunicationsPage() {
  const [items, setItems] = useState<CommunicationRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/communications')
      .then((res) => res.json())
      .then((data) => setItems(data.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const open = items.filter((c) => c.status === 'Open').length;
  const urgent = items.filter((c) => c.urgency === 'Urgent').length;
  const withAttachments = items.filter((c) => c.hasAttachments).length;

  return (
    <div className="space-y-5">
      <PageHeader title="Communications" subtitle="Track all client and internal communications" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total Communications" value={items.length} href="/communications" />
        <MetricCard title="Open" value={open} color="signal" href="/communications" />
        <MetricCard title="Urgent" value={urgent} color="red" href="/communications" />
        <MetricCard title="With Attachments" value={withAttachments} href="/communications" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="animate-pulse text-gray-400">Loading communications...</div></div>
      ) : (
        <DataTable columns={columns} data={items} searchPlaceholder="Search communications..." />
      )}
    </div>
  );
}
