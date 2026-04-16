'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Link2, CheckCircle, Tags, Users, Eye, EyeOff,
  Plus, X, ChevronDown, Building2,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import MetricCard from '@/components/MetricCard';
import DataTable, { Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import RelationshipExplorer from '@/components/RelationshipExplorer';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RelationshipEdge {
  relationshipId: string;
  sourceType: string;
  sourceId: string;
  sourceName: string;
  targetType: string;
  targetId: string;
  targetName: string;
  relationshipType: string;
  status: string;
  ownershipPct?: number | null;
}

interface ClientOption {
  id: string;
  name: string;
  shortName: string | null;
}

interface FamilyTag {
  id: string;
  tag: string;
  description: string | null;
  color: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const typeBadgeColors: Record<string, string> = {
  ownership: 'bg-emerald-100 text-emerald-700',
  management: 'bg-blue-100 text-blue-700',
  advisory: 'bg-purple-100 text-purple-700',
  custodial: 'bg-amber-100 text-amber-700',
  investment: 'bg-indigo-100 text-indigo-700',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function RelationshipsPage() {
  const [data, setData] = useState<RelationshipEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'table' | 'graph'>('graph');
  const [showInvestors, setShowInvestors] = useState(false);

  // Client picker
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  // Fund family tags
  const [familyTags, setFamilyTags] = useState<FamilyTag[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showTagManager, setShowTagManager] = useState(false);
  const [newTagName, setNewTagName] = useState('');

  // Initial load: clients + tags
  useEffect(() => {
    Promise.all([
      fetch('/api/clients').then((r) => r.ok ? r.json() : { items: [] }),
      fetch('/api/fund-family-tags').then((r) => r.ok ? r.json() : { items: [] }),
    ]).then(([clientRes, tagRes]) => {
      const cl = (clientRes.items ?? []) as ClientOption[];
      setClients(cl);
      setFamilyTags(tagRes.items ?? []);
      if (cl.length > 0) setSelectedClientId(cl[0].id);
    });
  }, []);

  // Load relationships when client changes
  useEffect(() => {
    if (!selectedClientId) return;
    setLoading(true);
    fetch(`/api/relationships?clientId=${selectedClientId}`)
      .then((r) => r.json())
      .then((res) => setData(res.items ?? []))
      .finally(() => setLoading(false));
  }, [selectedClientId]);

  const investorCount = useMemo(
    () => data.filter((r) => r.sourceType.toLowerCase() === 'investor' || r.targetType.toLowerCase() === 'investor').length,
    [data],
  );

  const visibleData = useMemo(
    () => showInvestors
      ? data
      : data.filter((r) => r.sourceType.toLowerCase() !== 'investor' && r.targetType.toLowerCase() !== 'investor'),
    [data, showInvestors],
  );

  const metrics = useMemo(() => {
    const total = visibleData.length;
    const active = visibleData.filter((r) => r.status.toLowerCase() === 'active').length;
    const types = new Set(visibleData.map((r) => r.relationshipType)).size;
    const entities = new Set(visibleData.flatMap((r) => [r.sourceName, r.targetName])).size;
    return { total, active, types, entities };
  }, [visibleData]);

  async function addTag() {
    const tag = newTagName.startsWith('#') ? newTagName : `#${newTagName}`;
    if (!tag || tag === '#') return;
    const res = await fetch('/api/fund-family-tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tag }),
    });
    if (res.ok) {
      const created = await res.json();
      setFamilyTags((prev) => [...prev, created].sort((a, b) => a.tag.localeCompare(b.tag)));
      setNewTagName('');
    }
  }

  async function deleteTag(id: string) {
    await fetch(`/api/fund-family-tags?id=${id}`, { method: 'DELETE' });
    setFamilyTags((prev) => prev.filter((t) => t.id !== id));
    if (selectedTag && familyTags.find((t) => t.id === id)?.tag === selectedTag) {
      setSelectedTag(null);
    }
  }

  const columns: Column[] = [
    {
      key: 'relationshipId',
      label: 'ID',
      sortable: true,
      render: (v: string) => <span className="font-mono text-gray-400">{v}</span>,
    },
    {
      key: 'sourceName',
      label: 'Source',
      sortable: true,
      render: (v: string, row: RelationshipEdge) => {
        const t = row.sourceType?.toLowerCase();
        const href = t === 'investor' ? `/data-vault/investors?search=${encodeURIComponent(v)}`
          : t === 'entity' ? `/data-vault/entities?search=${encodeURIComponent(v)}`
          : `/data-vault/clients?search=${encodeURIComponent(v)}`;
        return <Link href={href} className="font-semibold text-gray-900 hover:text-[#00C97B] transition-colors">{v}</Link>;
      },
    },
    {
      key: 'targetName',
      label: 'Target',
      sortable: true,
      render: (v: string, row: RelationshipEdge) => {
        const t = row.targetType?.toLowerCase();
        const href = t === 'investor' ? `/data-vault/investors?search=${encodeURIComponent(v)}`
          : t === 'entity' ? `/data-vault/entities?search=${encodeURIComponent(v)}`
          : `/data-vault/clients?search=${encodeURIComponent(v)}`;
        return <Link href={href} className="font-semibold text-gray-900 hover:text-[#00C97B] transition-colors">{v}</Link>;
      },
    },
    {
      key: 'relationshipType',
      label: 'Type',
      sortable: true,
      render: (v: string) => {
        const color = typeBadgeColors[v?.toLowerCase()] ?? 'bg-gray-100 text-gray-600';
        return <span className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded-full ${color}`}>{v}</span>;
      },
    },
    {
      key: 'ownershipPct',
      label: '%',
      sortable: true,
      align: 'right',
      render: (v: number | null) => v != null && v > 0
        ? <span className="font-mono text-xs">{v}%</span>
        : <span className="text-gray-300">—</span>,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (v: string) => <StatusBadge status={v} />,
    },
  ];

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  return (
    <div>
      <PageHeader
        title="Entity Map"
        subtitle="Fund structure &amp; relationship explorer"
        breadcrumbs={[{ label: 'Org & Assignments', href: '/relationships' }, { label: 'Entity Map' }]}
      />

      {/* ── Filter Bar ──────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        {/* Client picker */}
        <div className="relative">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            <Building2 className="w-3 h-3" /> Client
          </div>
          <div className="relative">
            <select
              value={selectedClientId ?? ''}
              onChange={(e) => setSelectedClientId(e.target.value)}
              aria-label="Select client"
              className="appearance-none bg-white border border-gray-200 rounded-lg px-3 py-1.5 pr-8 text-xs font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#00C97B]/30 focus:border-[#00C97B]"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.shortName ?? c.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Fund Family tag chips */}
        <div>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Fund Family</div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-colors ${
                selectedTag === null
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {familyTags.map((ft) => (
              <button
                key={ft.id}
                onClick={() => setSelectedTag(selectedTag === ft.tag ? null : ft.tag)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-colors ${
                  selectedTag === ft.tag
                    ? 'text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                style={selectedTag === ft.tag && ft.color ? { backgroundColor: ft.color } : undefined}
              >
                {ft.tag}
              </button>
            ))}
            <button
              onClick={() => setShowTagManager(!showTagManager)}
              className="w-6 h-6 rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600 flex items-center justify-center transition-colors"
              aria-label="Manage tags"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Investor toggle */}
        <div className="ml-auto">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">&nbsp;</div>
          <button
            onClick={() => setShowInvestors((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold border transition-colors ${
              showInvestors
                ? 'bg-[#6366f1]/10 text-[#6366f1] border-[#6366f1]/30'
                : 'bg-white text-gray-500 border-gray-200 hover:border-[#6366f1]/40'
            }`}
          >
            {showInvestors
              ? <><EyeOff className="w-3 h-3" /> Hide investors</>
              : <><Eye className="w-3 h-3" /> Investors
                {investorCount > 0 && (
                  <span className="ml-0.5 bg-[#6366f1]/15 text-[#6366f1] text-[10px] font-bold px-1.5 py-0.5 rounded-full">{investorCount}</span>
                )}
              </>
            }
          </button>
        </div>
      </div>

      {/* ── Inline Tag Manager ─────────────────────────────────── */}
      {showTagManager && (
        <div className="bg-white border border-gray-200 rounded-lg p-3 mb-4 space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-gray-700">Manage Fund Family Tags</h3>
            <button onClick={() => setShowTagManager(false)} className="text-gray-400 hover:text-gray-600" aria-label="Close tag manager">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') addTag(); }}
              placeholder="#NewFundFamily"
              className="flex-1 border border-gray-200 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#00C97B]/30 focus:border-[#00C97B]"
            />
            <button
              onClick={addTag}
              disabled={!newTagName.trim()}
              className="bg-[#00C97B] text-white text-xs font-semibold px-3 py-1.5 rounded-md hover:bg-[#00835A] transition-colors disabled:opacity-40"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {familyTags.map((ft) => (
              <div key={ft.id} className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-full px-2.5 py-1">
                {ft.color && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ft.color }} />}
                <span className="text-[10px] font-semibold text-gray-700">{ft.tag}</span>
                {ft.description && <span className="text-[10px] text-gray-400">{ft.description}</span>}
                <button onClick={() => deleteTag(ft.id)} className="text-gray-300 hover:text-red-500 ml-0.5" aria-label={`Delete ${ft.tag}`}>
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Metrics ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <MetricCard title="Relationships" value={metrics.total.toLocaleString()} icon={<Link2 className="w-4 h-4" />} color="teal" />
        <MetricCard title="Active" value={metrics.active.toLocaleString()} icon={<CheckCircle className="w-4 h-4" />} color="green" />
        <MetricCard title="Types" value={metrics.types.toLocaleString()} icon={<Tags className="w-4 h-4" />} color="signal" />
        <MetricCard title="Entities" value={metrics.entities.toLocaleString()} icon={<Users className="w-4 h-4" />} color="amber" />
      </div>

      {/* ── View Toggle ────────────────────────────────────────── */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 w-fit mb-4">
        <button
          className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            view === 'graph' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setView('graph')}
        >
          Structure Chart
        </button>
        <button
          className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            view === 'table' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setView('table')}
        >
          Table
        </button>
      </div>

      {/* ── Chart / Table ──────────────────────────────────────── */}
      {loading ? (
        <div className="text-center py-12 text-gray-400 text-xs">Loading entity structure…</div>
      ) : view === 'table' ? (
        <DataTable columns={columns} data={visibleData} searchPlaceholder="Search relationships…" />
      ) : (
        <RelationshipExplorer relationships={visibleData} />
      )}
    </div>
  );
}
