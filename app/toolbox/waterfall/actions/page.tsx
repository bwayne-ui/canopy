'use client';

import { useEffect, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import MetricCard from '@/components/MetricCard';
import DataTable, { Column } from '@/components/DataTable';
import { Wrench, Download, CheckCircle2, Clock, Loader2, AlertTriangle } from 'lucide-react';
import { fmtMoney } from '@/lib/utils';

interface WfDiuBatch {
  id: string;
  batchRef: string;
  fundName: string;
  status: string;
  generatedAt: string;
  postedAt?: string;
  totalLines: number;
  totalAmount: number;
}

interface WfAuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  actor: string;
  note?: string;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  generated: 'bg-[#F0FBF6] text-[#00835A]',
  posted: 'bg-purple-50 text-purple-700',
  refreshed: 'bg-emerald-50 text-emerald-700',
};

export default function ActionsPage() {
  const [batches, setBatches] = useState<WfDiuBatch[]>([]);
  const [audit, setAudit] = useState<WfAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState<string | null>(null);

  async function loadData() {
    const [excRes, auditRes] = await Promise.all([
      // Fetch all batches through exceptions
      fetch('/api/toolbox/waterfall/exceptions').then(async (r) => {
        const excs = await r.json();
        const batchMap = new Map<string, WfDiuBatch>();
        for (const exc of excs) {
          for (const action of exc.actions ?? []) {
            for (const batch of action.diuBatches ?? []) {
              if (!batchMap.has(batch.id)) batchMap.set(batch.id, batch);
            }
          }
        }
        return Array.from(batchMap.values());
      }),
      fetch('/api/toolbox/waterfall/audit').then((r) => r.json()),
    ]);
    setBatches(excRes);
    setAudit(auditRes);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  async function handlePost(batchId: string) {
    setPosting(batchId);
    try {
      await fetch(`/api/toolbox/waterfall/diu/${batchId}/post`, { method: 'POST' });
      await loadData();
    } finally {
      setPosting(null);
    }
  }

  function handleDownload(batchId: string) {
    window.open(`/api/toolbox/waterfall/diu/${batchId}/download`, '_blank');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-2 text-gray-400 text-xs">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading actions…
        </div>
      </div>
    );
  }

  const generated = batches.filter((b) => b.status === 'generated').length;
  const posted = batches.filter((b) => b.status === 'posted').length;

  const batchCols: Column[] = [
    {
      key: 'batchRef',
      label: 'Batch Ref',
      sortable: true,
      render: (v: string) => <span className="font-mono text-xs font-semibold text-gray-900">{v}</span>,
    },
    { key: 'fundName', label: 'Fund', sortable: true },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (v: string) => (
        <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${STATUS_COLORS[v] ?? 'bg-gray-50 text-gray-600'}`}>
          {v}
        </span>
      ),
    },
    {
      key: 'totalLines',
      label: 'Lines',
      sortable: true,
      render: (v: number) => <span className="font-mono">{v}</span>,
    },
    {
      key: 'totalAmount',
      label: 'Amount',
      sortable: true,
      render: (v: number) => <span className="font-mono">{fmtMoney(v)}</span>,
    },
    {
      key: 'generatedAt',
      label: 'Generated',
      sortable: true,
      render: (v: string) => (
        <span className="font-mono text-[10px] text-gray-500">
          {new Date(v).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </span>
      ),
    },
    {
      key: 'id',
      label: 'Actions',
      render: (_v: string, row: WfDiuBatch) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleDownload(row.id)}
            className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-md transition-colors"
          >
            <Download className="w-2.5 h-2.5" /> CSV
          </button>
          {row.status === 'generated' && (
            <button
              onClick={() => handlePost(row.id)}
              disabled={posting === row.id}
              className="inline-flex items-center gap-1 text-[10px] font-semibold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 px-2 py-0.5 rounded-md transition-colors"
            >
              {posting === row.id ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <CheckCircle2 className="w-2.5 h-2.5" />}
              Mark Posted
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="DIU Actions"
        subtitle="Manage DIU batches and review the full audit trail"
        breadcrumbs={[
          { label: 'Agentic Center' },
          { label: 'Toolbox', href: '/toolbox' },
          { label: 'Waterfall Engine', href: '/toolbox/waterfall' },
          { label: 'Actions' },
        ]}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard title="Total Batches" value={String(batches.length)} icon={<Wrench className="w-4 h-4" />} color="teal" />
        <MetricCard title="Pending Post" value={String(generated)} icon={<AlertTriangle className="w-4 h-4" />} color="amber" />
        <MetricCard title="Posted" value={String(posted)} icon={<CheckCircle2 className="w-4 h-4" />} color="green" />
        <MetricCard title="Audit Events" value={String(audit.length)} icon={<Clock className="w-4 h-4" />} color="signal" />
      </div>

      {/* DIU Batches */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">DIU Batches</h3>
        </div>
        {batches.length === 0 ? (
          <p className="px-4 py-10 text-xs text-gray-400 text-center">
            No DIU batches yet — generate one from the Exceptions page
          </p>
        ) : (
          <DataTable columns={batchCols} data={batches} searchPlaceholder="Search batches…" />
        )}
      </div>

      {/* Audit trail */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Audit Trail</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {audit.map((log) => (
            <div key={log.id} className="flex items-start gap-3 px-4 py-3">
              <div
                className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                  log.action === 'posted' ? 'bg-purple-400' :
                  log.action === 'refreshed' ? 'bg-emerald-400' :
                  log.action === 'generated' ? 'bg-[#00C97B]' :
                  log.action === 'resolved' ? 'bg-blue-400' : 'bg-gray-300'
                }`}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-700">{log.note ?? `${log.entityType} ${log.action}`}</p>
                <p className="text-[10px] text-gray-400 mt-0.5 font-mono flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  {new Date(log.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  <span className="ml-1 text-gray-300">·</span>
                  <span className="capitalize">{log.action}</span>
                  <span className="text-gray-300">·</span>
                  <span>{log.actor}</span>
                </p>
              </div>
            </div>
          ))}
          {audit.length === 0 && (
            <p className="px-4 py-8 text-xs text-gray-400 text-center">No audit events yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
