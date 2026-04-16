'use client';

import { useEffect, useState, useMemo } from 'react';
import PageHeader from '@/components/PageHeader';
import {
  ChevronDown, ChevronRight, Filter, RefreshCw, Pencil, Check, X,
  ArrowDownCircle, ArrowUpCircle, ArrowLeftRight, Minus,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FundOverride {
  id: string;
  fundId: string;
  fundName: string | null;
  glDebit: string | null;
  glCredit: string | null;
  journalType: string | null;
  recallable: boolean | null;
  feeOffset: boolean | null;
  feeOffsetType: string | null;
  waterfallTier: string | null;
  settlementDays: string | null;
  notes: string | null;
}

interface TransParam {
  id: string;
  code: string;
  name: string;
  ilpaCategory: string;
  ilpaSubtype: string | null;
  ilpaTemplateRef: string | null;
  direction: string;
  insideFund: boolean;
  recallable: boolean;
  navImpact: string;
  glDebit: string | null;
  glCredit: string | null;
  journalType: string | null;
  perfTemplateClass: string | null;
  perfTemplateMethod: string | null;
  feeOffset: boolean;
  feeOffsetType: string | null;
  waterfallTier: string | null;
  commitmentImpact: string | null;
  settlementDays: string | null;
  autoReconcile: boolean;
  approvalRequired: boolean;
  taxReporting: string | null;
  notes: string | null;
  isActive: boolean;
  fundOverrides: FundOverride[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  'All',
  'Capital Call',
  'Distribution',
  'Fee & Expense',
  'Carried Interest',
  'Facility / Debt',
  'Other',
];

const CATEGORY_COLORS: Record<string, string> = {
  'Capital Call':    'bg-[#F0FBF6] text-[#005868] border border-[#00AA6C]/30',
  'Distribution':    'bg-blue-50 text-blue-700 border border-blue-200',
  'Fee & Expense':   'bg-amber-50 text-amber-700 border border-amber-200',
  'Carried Interest':'bg-purple-50 text-purple-700 border border-purple-200',
  'Facility / Debt': 'bg-gray-100 text-gray-600 border border-gray-200',
  'Other':           'bg-slate-50 text-slate-600 border border-slate-200',
};

const DIRECTION_ICON: Record<string, React.ReactNode> = {
  Inflow:    <ArrowDownCircle className="w-3.5 h-3.5 text-emerald-500" />,
  Outflow:   <ArrowUpCircle className="w-3.5 h-3.5 text-red-400" />,
  Bilateral: <ArrowLeftRight className="w-3.5 h-3.5 text-amber-500" />,
  'N/A':     <Minus className="w-3.5 h-3.5 text-gray-300" />,
};

const WATERFALL_COLORS: Record<string, string> = {
  'Return of Capital': 'bg-sky-50 text-sky-700',
  'Preferred Return':  'bg-indigo-50 text-indigo-700',
  'Catch-Up':          'bg-violet-50 text-violet-700',
  'Carried Interest':  'bg-purple-50 text-purple-700',
  'N/A':               'bg-gray-50 text-gray-400',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function Tag({ label, color = 'bg-gray-100 text-gray-500' }: { label: string; color?: string }) {
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${color}`}>
      {label}
    </span>
  );
}

function Bool({ v, trueLabel = 'Yes', falseLabel = 'No' }: { v: boolean | null; trueLabel?: string; falseLabel?: string }) {
  if (v === null || v === undefined) return <span className="text-gray-300 text-xs">—</span>;
  return v
    ? <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">{trueLabel}</span>
    : <span className="text-[10px] font-semibold text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">{falseLabel}</span>;
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 py-1 border-b border-gray-50 last:border-0">
      <span className="w-40 shrink-0 text-[10px] font-semibold text-gray-400 uppercase tracking-wide pt-0.5">{label}</span>
      <span className="text-xs text-gray-700">{children}</span>
    </div>
  );
}

function GLFlow({ debit, credit }: { debit: string | null; credit: string | null }) {
  if (!debit && !credit) return <span className="text-gray-300">—</span>;
  return (
    <span className="inline-flex items-center gap-1 text-[10px]">
      <span className="bg-red-50 text-red-700 px-1.5 py-0.5 rounded border border-red-100">{debit ?? '—'}</span>
      <span className="text-gray-300">→</span>
      <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-100">{credit ?? '—'}</span>
    </span>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────

function EditModal({
  param,
  onClose,
  onSaved,
}: {
  param: TransParam;
  onClose: () => void;
  onSaved: (updated: Partial<TransParam>) => void;
}) {
  const [fundId, setFundId] = useState('');
  const [fundName, setFundName] = useState('');
  const [glDebit, setGlDebit] = useState(param.glDebit ?? '');
  const [glCredit, setGlCredit] = useState(param.glCredit ?? '');
  const [journalType, setJournalType] = useState(param.journalType ?? '');
  const [recallable, setRecallable] = useState(param.recallable);
  const [feeOffset, setFeeOffset] = useState(param.feeOffset);
  const [feeOffsetType, setFeeOffsetType] = useState(param.feeOffsetType ?? 'None');
  const [waterfallTier, setWaterfallTier] = useState(param.waterfallTier ?? 'N/A');
  const [settlementDays, setSettlementDays] = useState(param.settlementDays ?? '');
  const [notes, setNotes] = useState(param.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const body: Record<string, unknown> = {
        glDebit, glCredit, journalType, recallable, feeOffset,
        feeOffsetType, waterfallTier, settlementDays, notes,
      };
      if (fundId.trim()) {
        body.fundId = fundId.trim();
        body.fundName = fundName.trim() || fundId.trim();
      }
      const res = await fetch(`/api/trans-parameters/${param.code}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Save failed');
      onSaved({ glDebit, glCredit, journalType, recallable, feeOffset, feeOffsetType, waterfallTier, settlementDays, notes });
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full border border-gray-200 rounded-md px-2.5 py-1.5 text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#00AA6C] focus:border-[#00AA6C]';
  const labelCls = 'block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4 flex flex-col max-h-[90vh]">
        {/* header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <div className="text-xs font-bold text-gray-900">Edit Parameters — <span className="text-[#005868]">{param.code}</span></div>
            <div className="text-xs text-gray-500 mt-0.5">{param.name}</div>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* body */}
        <div className="overflow-y-auto px-5 py-4 space-y-4 flex-1">
          {/* Fund override section */}
          <div className="bg-[#F0FBF6] rounded-lg p-3 border border-[#00AA6C]/20">
            <div className="text-[10px] font-bold text-[#005868] uppercase tracking-wide mb-2">Fund Override (optional)</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Fund ID</label>
                <input className={inputCls} placeholder="e.g. FUND-001" value={fundId} onChange={e => setFundId(e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>Fund Name</label>
                <input className={inputCls} placeholder="e.g. Walker PE Fund III" value={fundName} onChange={e => setFundName(e.target.value)} />
              </div>
            </div>
            <div className="text-[10px] text-[#005868]/70 mt-1.5">Leave blank to update the global default for all funds.</div>
          </div>

          {/* GL Mapping */}
          <div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-2">GL Account Mapping</div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelCls} htmlFor="edit-gl-debit">Debit Account</label>
                <input id="edit-gl-debit" className={inputCls} title="GL Debit Account" placeholder="e.g. Cash & Cash Equivalents" value={glDebit} onChange={e => setGlDebit(e.target.value)} />
              </div>
              <div>
                <label className={labelCls} htmlFor="edit-gl-credit">Credit Account</label>
                <input id="edit-gl-credit" className={inputCls} title="GL Credit Account" placeholder="e.g. Capital Contributions — LP" value={glCredit} onChange={e => setGlCredit(e.target.value)} />
              </div>
              <div>
                <label className={labelCls} htmlFor="edit-journal-type">Journal Type</label>
                <input id="edit-journal-type" className={inputCls} title="Journal Type Code" placeholder="e.g. JE-CC-INV" value={journalType} onChange={e => setJournalType(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Flags */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-2">Transaction Flags</div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={recallable} onChange={e => setRecallable(e.target.checked)}
                    className="rounded border-gray-300 text-[#00AA6C] focus:ring-[#00AA6C]" />
                  <span className="text-xs text-gray-700">Recallable Distribution</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={feeOffset} onChange={e => setFeeOffset(e.target.checked)}
                    className="rounded border-gray-300 text-[#00AA6C] focus:ring-[#00AA6C]" />
                  <span className="text-xs text-gray-700">Generates Fee Offset</span>
                </label>
              </div>
            </div>
            <div>
              <label className={labelCls} htmlFor="edit-fee-offset-type">Fee Offset Type</label>
              <select id="edit-fee-offset-type" className={inputCls} title="Fee Offset Type" value={feeOffsetType} onChange={e => setFeeOffsetType(e.target.value)}>
                {['None', 'Management Fee Base', 'Carry Basis', 'Both'].map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Waterfall & Settlement */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls} htmlFor="edit-waterfall">Waterfall Tier</label>
              <select id="edit-waterfall" className={inputCls} title="Waterfall Tier" value={waterfallTier} onChange={e => setWaterfallTier(e.target.value)}>
                {['Return of Capital', 'Preferred Return', 'Catch-Up', 'Carried Interest', 'N/A'].map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls} htmlFor="edit-settlement">Settlement Days</label>
              <select id="edit-settlement" className={inputCls} title="Settlement Days" value={settlementDays} onChange={e => setSettlementDays(e.target.value)}>
                {['T+0', 'T+1', 'T+2', 'T+3', 'T+5', 'T+10', 'T+30'].map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className={labelCls} htmlFor="edit-notes">Config Notes</label>
            <textarea id="edit-notes" className={`${inputCls} resize-none h-16`} title="Configuration notes" placeholder="Optional notes for this transaction type…" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>

          {error && <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</div>}
        </div>

        {/* footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-100">
          <button type="button" onClick={onClose} className="px-4 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50">
            Cancel
          </button>
          <button type="button" onClick={handleSave} disabled={saving}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-[#00AA6C] rounded-md hover:bg-[#008F5A] disabled:opacity-50 flex items-center gap-1.5">
            {saving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Expanded row panel ───────────────────────────────────────────────────────

function ExpandedRow({ p }: { p: TransParam }) {
  return (
    <div className="grid grid-cols-3 gap-5 px-6 py-4 bg-gray-50/50 border-t border-gray-100">
      {/* GL & Journal */}
      <div>
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">GL Mapping (Investran)</div>
        <DetailRow label="Debit Account">
          <span className="text-red-700 bg-red-50 px-1 rounded">{p.glDebit ?? '—'}</span>
        </DetailRow>
        <DetailRow label="Credit Account">
          <span className="text-emerald-700 bg-emerald-50 px-1 rounded">{p.glCredit ?? '—'}</span>
        </DetailRow>
        <DetailRow label="Journal Type">
          <span className="text-[#005868] bg-[#F0FBF6] px-1 rounded">{p.journalType ?? '—'}</span>
        </DetailRow>
        <DetailRow label="Settlement">{p.settlementDays ?? '—'}</DetailRow>
        <DetailRow label="Auto-Reconcile"><Bool v={p.autoReconcile} /></DetailRow>
        <DetailRow label="Approval Req'd"><Bool v={p.approvalRequired} /></DetailRow>
      </div>

      {/* Flags & Classification */}
      <div>
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">ILPA Classification</div>
        <DetailRow label="Inside Fund"><Bool v={p.insideFund} trueLabel="Inside Fund" falseLabel="Outside Fund" /></DetailRow>
        <DetailRow label="Recallable"><Bool v={p.recallable} /></DetailRow>
        <DetailRow label="NAV Impact">
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
            p.navImpact === 'Increase NAV' ? 'bg-emerald-50 text-emerald-700' :
            p.navImpact === 'Decrease NAV' ? 'bg-red-50 text-red-700' :
            p.navImpact === 'GP Allocation' ? 'bg-purple-50 text-purple-700' :
            'bg-gray-50 text-gray-500'
          }`}>{p.navImpact}</span>
        </DetailRow>
        <DetailRow label="Commitment">{p.commitmentImpact ?? '—'}</DetailRow>
        <DetailRow label="Perf Template">{p.perfTemplateClass ?? '—'}</DetailRow>
        <DetailRow label="Perf Method">{p.perfTemplateMethod ?? '—'}</DetailRow>
      </div>

      {/* Fee & Waterfall */}
      <div>
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Fee & Waterfall Config</div>
        <DetailRow label="Fee Offset"><Bool v={p.feeOffset} /></DetailRow>
        <DetailRow label="Offset Type">{p.feeOffsetType ?? '—'}</DetailRow>
        <DetailRow label="Waterfall Tier">
          {p.waterfallTier ? (
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${WATERFALL_COLORS[p.waterfallTier] ?? 'bg-gray-50 text-gray-400'}`}>
              {p.waterfallTier}
            </span>
          ) : '—'}
        </DetailRow>
        <DetailRow label="Tax Reporting">{p.taxReporting ?? '—'}</DetailRow>
        <DetailRow label="ILPA Ref">
          <span className="text-[10px] text-gray-400 leading-tight">{p.ilpaTemplateRef ?? '—'}</span>
        </DetailRow>

        {p.fundOverrides?.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <div className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1">Fund Overrides ({p.fundOverrides.length})</div>
            {p.fundOverrides.map((ov) => (
              <div key={ov.id} className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 mb-1">
                {ov.fundName ?? ov.fundId} — {ov.glDebit ?? p.glDebit} → {ov.glCredit ?? p.glCredit}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notes full width */}
      {p.notes && (
        <div className="col-span-3 text-xs text-gray-500 bg-white border border-gray-100 rounded-md px-3 py-2 leading-relaxed">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mr-2">Notes:</span>
          {p.notes}
        </div>
      )}
    </div>
  );
}

// ─── Main row ─────────────────────────────────────────────────────────────────

function ParamRow({
  p,
  expanded,
  onToggle,
  onEdit,
}: {
  p: TransParam;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
}) {
  const catColor = CATEGORY_COLORS[p.ilpaCategory] ?? 'bg-gray-100 text-gray-500';
  const wtColor = p.waterfallTier ? (WATERFALL_COLORS[p.waterfallTier] ?? '') : '';

  return (
    <>
      <tr
        className={`border-b transition-colors cursor-pointer ${expanded ? 'bg-[#F0FBF6]/40 border-[#00AA6C]/20' : 'hover:bg-gray-50/60 border-gray-100'}`}
        onClick={onToggle}
      >
        {/* Expand chevron */}
        <td className="pl-3 pr-1 py-2.5 w-7">
          {expanded
            ? <ChevronDown className="w-3.5 h-3.5 text-[#00AA6C]" />
            : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
        </td>

        {/* Code */}
        <td className="px-2 py-2.5">
          <span className="text-xs font-bold text-[#005868] bg-[#F0FBF6] px-2 py-0.5 rounded">{p.code}</span>
        </td>

        {/* Name */}
        <td className="px-2 py-2.5 max-w-[220px]">
          <div className="text-xs font-semibold text-gray-800 truncate">{p.name}</div>
          {p.ilpaSubtype && <div className="text-[10px] text-gray-400 truncate">{p.ilpaSubtype}</div>}
        </td>

        {/* Category */}
        <td className="px-2 py-2.5">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${catColor}`}>{p.ilpaCategory}</span>
        </td>

        {/* Direction */}
        <td className="px-2 py-2.5">
          <div className="flex items-center gap-1">
            {DIRECTION_ICON[p.direction] ?? <Minus className="w-3.5 h-3.5 text-gray-300" />}
            <span className="text-[10px] text-gray-600">{p.direction}</span>
          </div>
        </td>

        {/* Inside/Outside */}
        <td className="px-2 py-2.5">
          {p.insideFund
            ? <Tag label="Inside Fund" color="bg-[#F0FBF6] text-[#005868] border border-[#00AA6C]/20" />
            : <Tag label="Outside Fund" color="bg-slate-100 text-slate-600 border border-slate-200" />}
        </td>

        {/* Recallable */}
        <td className="px-2 py-2.5">
          {p.recallable ? <Tag label="Recallable" color="bg-amber-50 text-amber-700 border border-amber-200" /> : <span className="text-gray-300 text-[10px]">—</span>}
        </td>

        {/* GL Flow */}
        <td className="px-2 py-2.5">
          <GLFlow debit={p.glDebit} credit={p.glCredit} />
        </td>

        {/* Waterfall */}
        <td className="px-2 py-2.5">
          {p.waterfallTier && p.waterfallTier !== 'N/A'
            ? <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${wtColor}`}>{p.waterfallTier}</span>
            : <span className="text-gray-300 text-[10px]">—</span>}
        </td>

        {/* Fee offset */}
        <td className="px-2 py-2.5">
          {p.feeOffset
            ? <Tag label={p.feeOffsetType ?? 'Yes'} color="bg-violet-50 text-violet-700 border border-violet-200" />
            : <span className="text-gray-300 text-[10px]">—</span>}
        </td>

        {/* Edit */}
        <td className="px-2 py-2.5" onClick={e => { e.stopPropagation(); onEdit(); }}>
          <button type="button" aria-label={`Edit parameters for ${p.code}`} className="p-1.5 rounded-md text-gray-400 hover:text-[#005868] hover:bg-[#F0FBF6] transition-colors">
            <Pencil className="w-3 h-3" />
          </button>
        </td>
      </tr>

      {expanded && (
        <tr className="border-b border-gray-100">
          <td colSpan={11} className="p-0">
            <ExpandedRow p={p} />
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Metric card ──────────────────────────────────────────────────────────────

function MetricCard({ value, label, sub }: { value: string | number; label: string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-3 flex flex-col gap-0.5">
      <div className="text-2xl font-bold text-[#005868] leading-none">{value}</div>
      <div className="text-xs font-semibold text-gray-700">{label}</div>
      {sub && <div className="text-[10px] text-gray-400">{sub}</div>}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TransParametersPage() {
  const [params, setParams] = useState<TransParam[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCodes, setExpandedCodes] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [editTarget, setEditTarget] = useState<TransParam | null>(null);

  const load = () => {
    setLoading(true);
    fetch('/api/trans-parameters')
      .then(r => r.json())
      .then(d => setParams(d.params ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let list = params;
    if (activeCategory !== 'All') list = list.filter(p => p.ilpaCategory === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.code.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        (p.ilpaSubtype ?? '').toLowerCase().includes(q) ||
        (p.glDebit ?? '').toLowerCase().includes(q) ||
        (p.glCredit ?? '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [params, activeCategory, search]);

  const toggleExpand = (code: string) => {
    setExpandedCodes(prev => {
      const next = new Set(prev);
      next.has(code) ? next.delete(code) : next.add(code);
      return next;
    });
  };

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const p of params) m[p.ilpaCategory] = (m[p.ilpaCategory] ?? 0) + 1;
    return m;
  }, [params]);

  const handleSaved = (code: string, updates: Partial<TransParam>) => {
    setParams(prev => prev.map(p => p.code === code ? { ...p, ...updates } : p));
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96 text-gray-400 text-sm animate-pulse">Loading transaction parameters…</div>;
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Transaction Parameters"
        subtitle="ILPA-aligned transaction config layer — GL mapping, waterfall tiers, and reporting flags per transaction type"
        breadcrumbs={[{ label: 'Data Vault' }, { label: 'Trans Parameters' }]}
        actions={
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-400 bg-gray-50 border border-gray-200 px-2 py-1 rounded-md">
              ILPA CC&D Sept 2025 · RT v2.0 Jan 2025
            </span>
            <button type="button" onClick={load} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 bg-white border border-gray-200 px-3 py-1.5 rounded-md hover:bg-gray-50">
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>
        }
      />

      {/* Metric cards */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        <MetricCard value={params.length} label="Total Types" sub="Across all categories" />
        <MetricCard value={counts['Capital Call'] ?? 0} label="Capital Call" sub="CC-* codes" />
        <MetricCard value={counts['Distribution'] ?? 0} label="Distribution" sub="DIST-* codes" />
        <MetricCard value={counts['Fee & Expense'] ?? 0} label="Fees & Expenses" sub="ILPA RT v2.0 (22 cat)" />
        <MetricCard value={counts['Carried Interest'] ?? 0} label="Carried Interest" sub="CARRY-* codes" />
        <MetricCard value={(counts['Facility / Debt'] ?? 0) + (counts['Other'] ?? 0)} label="Facility & Other" sub="FACIL-* / INC-* / ADJ-*" />
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 flex flex-wrap items-center gap-2">
        <Filter className="w-3.5 h-3.5 text-gray-400 shrink-0" />
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCategory(cat)}
            className={`text-[10px] font-semibold px-2.5 py-1 rounded-full transition-colors ${
              activeCategory === cat
                ? 'bg-[#005868] text-white'
                : 'text-gray-500 bg-gray-50 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {cat}{cat !== 'All' && counts[cat] ? ` (${counts[cat]})` : ''}
          </button>
        ))}
        <div className="ml-auto">
          <input
            type="text"
            placeholder="Search code, name, GL account…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-52 border border-gray-200 rounded-md px-2.5 py-1.5 text-xs text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#00AA6C] focus:border-[#00AA6C]"
          />
        </div>
      </div>

      {/* Master table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th scope="col" aria-label="Expand" className="w-7" />
              <th scope="col" className="px-2 py-2.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Code</th>
              <th scope="col" className="px-2 py-2.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Transaction Name</th>
              <th scope="col" className="px-2 py-2.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Category</th>
              <th scope="col" className="px-2 py-2.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Direction</th>
              <th scope="col" className="px-2 py-2.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Scope</th>
              <th scope="col" className="px-2 py-2.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Recallable</th>
              <th scope="col" className="px-2 py-2.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">GL Flow (Dr → Cr)</th>
              <th scope="col" className="px-2 py-2.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Waterfall Tier</th>
              <th scope="col" className="px-2 py-2.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Fee Offset</th>
              <th scope="col" aria-label="Actions" className="px-2 py-2.5 w-10" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-12 text-center text-xs text-gray-400">No transaction types match your filter.</td>
              </tr>
            ) : (
              filtered.map(p => (
                <ParamRow
                  key={p.code}
                  p={p}
                  expanded={expandedCodes.has(p.code)}
                  onToggle={() => toggleExpand(p.code)}
                  onEdit={() => setEditTarget(p)}
                />
              ))
            )}
          </tbody>
        </table>

        {/* Table footer */}
        <div className="border-t border-gray-100 px-4 py-2 bg-gray-50/50 flex items-center justify-between">
          <span className="text-[10px] text-gray-400">
            Showing {filtered.length} of {params.length} transaction types
          </span>
          <span className="text-[10px] text-gray-400">
            Click any row to expand · Pencil icon to edit config
          </span>
        </div>
      </div>

      {/* Edit modal */}
      {editTarget && (
        <EditModal
          param={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={(updates) => { handleSaved(editTarget.code, updates); setEditTarget(null); }}
        />
      )}
    </div>
  );
}
