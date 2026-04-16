'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import MetricCard from '@/components/MetricCard';
import DataTable, { Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import {
  Layers, AlertTriangle, TrendingUp, BarChart3, ChevronRight,
  Clock, Loader2, Wrench, Building2, ArrowRight,
} from 'lucide-react';
import { fmtMoney } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WfFundEntity {
  id: string;
  name: string;
  entityId: string;
  client: { id: string; name: string; shortName: string };
}

interface WfFund {
  id: string;
  name: string;
  shortName: string;
  strategy: string;
  waterfallType: string;
  status: string;
  vintage: number;
  totalCommitment: number;
  totalNav: number;
  totalDistributed: number;
  exceptionCount: number;
  validationStatus: string;
  entity: WfFundEntity | null;
  _count?: { exceptions: number };
}

interface WfException {
  id: string;
  fundId: string;
  exceptionType: string;
  severity: string;
  title: string;
  description: string;
  impactAmount: number;
  status: string;
  createdAt: string;
  fund: { id: string; name: string; shortName: string };
  actions: Array<{
    id: string;
    status: string;
    diuBatches: Array<{ id: string; batchRef: string; status: string }>;
  }>;
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

interface ClientEntity {
  id: string;
  name: string;
  entityId: string;
  strategy: string | null;
  vintage: number | null;
  waterfallType: string | null;
  wfFund: { id: string } | null;
}

interface Client {
  id: string;
  name: string;
  shortName: string;
  primaryStrategy: string | null;
  entities: ClientEntity[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  low: 'bg-gray-100 text-gray-600 border-gray-200',
};

const WATERFALL_COLORS: Record<string, string> = {
  european: 'bg-blue-50 text-blue-700',
  american: 'bg-purple-50 text-purple-700',
  hybrid: 'bg-teal-50 text-teal-700',
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function WaterfallPage() {
  const router = useRouter();

  const [funds, setFunds]           = useState<WfFund[]>([]);
  const [exceptions, setExceptions] = useState<WfException[]>([]);
  const [audit, setAudit]           = useState<WfAuditLog[]>([]);
  const [clients, setClients]       = useState<Client[]>([]);
  const [loading, setLoading]       = useState(true);

  const [selectedClientId, setSelectedClientId]   = useState('');
  const [selectedEntityId, setSelectedEntityId]   = useState('');
  const [opening, setOpening]                     = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const [fundsRes, excRes, auditRes, clientsRes] = await Promise.all([
        fetch('/api/toolbox/waterfall/funds').then((r) => r.json()),
        fetch('/api/toolbox/waterfall/exceptions').then((r) => r.json()),
        fetch('/api/toolbox/waterfall/audit').then((r) => r.json()),
        fetch('/api/toolbox/waterfall/clients').then((r) => r.json()),
      ]);
      setFunds(Array.isArray(fundsRes) ? fundsRes : []);
      setExceptions(Array.isArray(excRes) ? excRes : []);
      setAudit(Array.isArray(auditRes) ? auditRes : []);
      setClients(Array.isArray(clientsRes) ? clientsRes : []);
    } catch (e) {
      console.error('[waterfall page] loadData error:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  // When client changes, reset entity selection
  function handleClientChange(clientId: string) {
    setSelectedClientId(clientId);
    setSelectedEntityId('');
  }

  async function handleOpenWaterfall() {
    if (!selectedEntityId) return;
    setOpening(true);
    try {
      const res = await fetch('/api/toolbox/waterfall/funds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityId: selectedEntityId }),
      });
      const data = await res.json() as { fundId?: string; error?: string };
      if (data.fundId) {
        router.push(`/toolbox/waterfall/funds/${data.fundId}`);
      }
    } catch (e) {
      console.error('[waterfall] open error:', e);
    } finally {
      setOpening(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-2 text-gray-400 text-xs">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading waterfall data…
        </div>
      </div>
    );
  }

  const totalCommitment = funds.reduce((s, f) => s + f.totalCommitment, 0);
  const totalNav = funds.reduce((s, f) => s + f.totalNav, 0);
  const openExceptions = exceptions.filter((e) => e.status === 'open' || e.status === 'in_progress');
  const criticalCount = openExceptions.filter((e) => e.severity === 'critical').length;

  const selectedClient = clients.find((c) => c.id === selectedClientId);
  const entityOptions = selectedClient?.entities ?? [];

  // Fund table columns — include client name from linked entity
  const fundCols: Column[] = [
    {
      key: 'shortName',
      label: 'Fund',
      sortable: true,
      render: (v: string, row: WfFund) => (
        <Link href={`/toolbox/waterfall/funds/${row.id}`} className="block group">
          <div className="font-semibold text-gray-900 group-hover:text-[#00C97B] transition-colors">{v}</div>
          <div className="text-[10px] text-gray-400 font-mono">Vintage {row.vintage}</div>
        </Link>
      ),
    },
    {
      key: 'entity',
      label: 'Client',
      render: (_v: unknown, row: WfFund) =>
        row.entity ? (
          <div>
            <div className="font-semibold text-gray-800">{row.entity.client.shortName}</div>
            <div className="text-[10px] text-gray-400 truncate max-w-[160px]">{row.entity.name}</div>
          </div>
        ) : (
          <span className="text-gray-300 text-[10px]">—</span>
        ),
    },
    { key: 'strategy', label: 'Strategy', sortable: true },
    {
      key: 'waterfallType',
      label: 'Waterfall',
      sortable: true,
      render: (v: string) => (
        <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${WATERFALL_COLORS[v] ?? 'bg-gray-50 text-gray-600'}`}>
          {v}
        </span>
      ),
    },
    {
      key: 'totalCommitment',
      label: 'Committed',
      sortable: true,
      render: (v: number) => <span className="font-mono">{fmtMoney(v)}</span>,
    },
    {
      key: 'totalNav',
      label: 'NAV',
      sortable: true,
      render: (v: number) => <span className="font-mono">{fmtMoney(v)}</span>,
    },
    {
      key: 'totalDistributed',
      label: 'Distributed',
      sortable: true,
      render: (v: number) => <span className="font-mono text-emerald-600">{fmtMoney(v)}</span>,
    },
    {
      key: 'exceptionCount',
      label: 'Issues',
      sortable: true,
      render: (v: number) =>
        v > 0 ? (
          <Link href="/toolbox/waterfall/exceptions">
            <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 border border-red-100 rounded-full px-2 py-0.5 text-[10px] font-semibold">
              <AlertTriangle className="w-2.5 h-2.5" /> {v}
            </span>
          </Link>
        ) : (
          <span className="text-gray-300 text-[10px]">—</span>
        ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (v: string) => <StatusBadge status={v} />,
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Waterfall Engine"
        subtitle="Fund portfolio management, exception tracking, and DIU generation"
        breadcrumbs={[
          { label: 'Agentic Center' },
          { label: 'Toolbox', href: '/toolbox' },
          { label: 'Waterfall Engine' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/toolbox/waterfall/exceptions"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 bg-white border border-gray-200 hover:border-gray-300 px-3 py-1.5 rounded-md transition-colors"
            >
              <AlertTriangle className="w-3 h-3" /> Exceptions
              {criticalCount > 0 && (
                <span className="ml-0.5 bg-red-100 text-red-700 rounded-full px-1.5 text-[10px] font-bold">{criticalCount}</span>
              )}
            </Link>
            <Link
              href="/toolbox/waterfall/actions"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 bg-white border border-gray-200 hover:border-gray-300 px-3 py-1.5 rounded-md transition-colors"
            >
              <Wrench className="w-3 h-3" /> Actions
            </Link>
          </div>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard title="Funds" value={String(funds.length)} icon={<Layers className="w-4 h-4" />} color="teal" />
        <MetricCard title="Total AUM" value={`$${(totalCommitment / 1e9).toFixed(1)}B`} icon={<TrendingUp className="w-4 h-4" />} color="green" />
        <MetricCard title="Total NAV" value={`$${(totalNav / 1e9).toFixed(1)}B`} icon={<BarChart3 className="w-4 h-4" />} color="signal" />
        <MetricCard title="Open Exceptions" value={String(openExceptions.length)} icon={<AlertTriangle className="w-4 h-4" />} color={criticalCount > 0 ? 'red' : 'amber'} />
      </div>

      {/* Alert strips */}
      {criticalCount > 0 && (
        <div className="flex flex-wrap gap-2">
          <Link
            href="/toolbox/waterfall/exceptions"
            className="inline-flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs font-semibold text-red-700 hover:bg-red-100 transition-colors"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            {criticalCount} critical exception{criticalCount > 1 ? 's' : ''} require attention
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      )}

      {/* Entity picker */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="w-4 h-4 text-[#00C97B]" />
          <h3 className="text-sm font-semibold text-gray-900">Start Waterfall Analysis</h3>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">GP Client</label>
            <select
              value={selectedClientId}
              onChange={(e) => handleClientChange(e.target.value)}
              className="w-full text-xs border border-gray-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#00C97B] bg-white"
              title="Select GP client"
            >
              <option value="">Select a GP client…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Entity</label>
            <select
              value={selectedEntityId}
              onChange={(e) => setSelectedEntityId(e.target.value)}
              disabled={!selectedClientId}
              className="w-full text-xs border border-gray-200 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#00C97B] bg-white disabled:bg-gray-50 disabled:text-gray-400"
              title="Select entity"
            >
              <option value="">Select an entity…</option>
              {entityOptions.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}{e.wfFund ? ' ✓' : ''}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={handleOpenWaterfall}
            disabled={!selectedEntityId || opening}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#00C97B] hover:bg-[#00A866] disabled:opacity-40 px-4 py-1.5 rounded-md transition-colors"
          >
            {opening ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
            {opening ? 'Opening…' : 'Open Waterfall'}
          </button>
        </div>
        {selectedClient && entityOptions.length === 0 && (
          <p className="mt-2 text-[10px] text-amber-600">No entities with carry economics found for this client.</p>
        )}
        {selectedEntityId && entityOptions.find((e) => e.id === selectedEntityId)?.wfFund && (
          <p className="mt-2 text-[10px] text-[#00835A] font-semibold">
            ✓ This entity already has an active waterfall analysis — clicking Open will load it directly.
          </p>
        )}
      </div>

      {/* Fund table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Analyzed Funds</h3>
          <span className="text-[10px] text-gray-400">{funds.length} fund{funds.length !== 1 ? 's' : ''}</span>
        </div>
        {funds.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <Layers className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-xs text-gray-400">No waterfall analyses yet — select a GP client and entity above to get started.</p>
          </div>
        ) : (
          <DataTable columns={fundCols} data={funds} searchPlaceholder="Search funds…" />
        )}
      </div>

      {/* Exceptions + Audit log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Open exceptions */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Open Exceptions</h3>
            <Link href="/toolbox/waterfall/exceptions" className="text-[10px] text-[#00C97B] hover:underline font-semibold">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {openExceptions.slice(0, 5).map((exc) => {
              const sc = SEVERITY_COLORS[exc.severity] ?? 'bg-gray-50 text-gray-600 border-gray-200';
              return (
                <Link
                  key={exc.id}
                  href="/toolbox/waterfall/exceptions"
                  className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group"
                >
                  <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold border flex-shrink-0 mt-0.5 ${sc}`}>
                    {exc.severity}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 group-hover:text-[#00C97B] truncate">{exc.title}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{exc.fund.shortName} · {exc.exceptionType.replace(/_/g, ' ')}</p>
                  </div>
                </Link>
              );
            })}
            {openExceptions.length === 0 && (
              <p className="px-4 py-8 text-xs text-gray-400 text-center">No open exceptions — all clear</p>
            )}
          </div>
        </div>

        {/* Audit log */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Recent Activity</h3>
            <Link href="/toolbox/waterfall/actions" className="text-[10px] text-[#00C97B] hover:underline font-semibold">
              Full audit trail →
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {audit.slice(0, 8).map((log) => (
              <div key={log.id} className="flex items-start gap-3 px-4 py-3">
                <div
                  className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                    log.action === 'posted'    ? 'bg-purple-400' :
                    log.action === 'refreshed' ? 'bg-emerald-400' :
                    log.action === 'generated' ? 'bg-[#00C97B]' :
                    log.action === 'resolved'  ? 'bg-blue-400' :
                    log.action === 'created'   ? 'bg-teal-400' : 'bg-gray-300'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-700 truncate">{log.note ?? `${log.entityType} ${log.action}`}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1 font-mono">
                    <Clock className="w-2.5 h-2.5" />
                    {new Date(log.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            {audit.length === 0 && (
              <p className="px-4 py-8 text-xs text-gray-400 text-center">No activity yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
