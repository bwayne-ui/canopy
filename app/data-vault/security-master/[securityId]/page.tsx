'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Eye, BookOpen, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import ActivityFeed from '@/components/ActivityFeed';

/* ─── helpers ──────────────────────────────────────────── */
function FieldRow({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex items-start py-1.5 border-b border-[#e5e7eb] last:border-0">
      <span className="w-44 flex-shrink-0 text-xs text-[#6b7280] font-medium">{label}</span>
      <span className="text-xs text-[#1a1a1a] font-medium">{value ?? '—'}</span>
    </div>
  );
}

function FieldSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-2">{title}</div>
      {children}
    </div>
  );
}

function StatBox({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-[#F0FBF6] rounded-[14px] border border-[#e5e7eb] p-4">
      <div className="text-[10px] font-bold text-[#005868] uppercase tracking-widest mb-1">{label}</div>
      <div className="text-2xl font-bold text-[#00AA6C] leading-none">{value}</div>
      {sub && <div className="text-[10px] text-[#6b7280] mt-1">{sub}</div>}
    </div>
  );
}

function fmt(n: number | null | undefined, prefix = '$') {
  if (n == null) return '—';
  return `${prefix}${Math.abs(n).toLocaleString()}`;
}

/* ─── entity holding card ─────────────────────────────── */
function HoldingCard({ link }: { link: any }) {
  const [open, setOpen] = useState(false);
  const gain = link.currentCarryingValue != null && link.costAtAcquisition != null
    ? link.currentCarryingValue - link.costAtAcquisition : null;
  const gainPct = gain != null && link.costAtAcquisition
    ? ((gain / link.costAtAcquisition) * 100).toFixed(1) : null;

  return (
    <div className={`bg-white rounded-[14px] border ${link.watchlistFlag ? 'border-[#d97706]' : 'border-[#e5e7eb]'} shadow-[0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden`}>
      {/* header */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest">{link.clientShortName ?? link.clientName}</div>
            <Link href={`/data-vault/entities/${link.entityId}`} className="text-xs font-semibold text-[#005868] hover:text-[#00AA6C] transition-colors leading-tight">
              {link.entityName}
            </Link>
            <div className="text-[10px] text-[#9ca3af] mt-0.5">{link.entityType}{link.strategy ? ` · ${link.strategy}` : ''}</div>
          </div>
          <div className="flex items-center gap-1.5">
            {link.watchlistFlag && (
              <span className="flex items-center gap-1 text-[10px] font-bold bg-[#fffbeb] text-[#b45309] px-1.5 py-0.5 rounded-full border border-[#d97706]/30">
                <AlertTriangle className="w-2.5 h-2.5" /> WATCH
              </span>
            )}
            {link.isActiveHolding
              ? <span className="text-[10px] font-bold bg-[#F0FBF6] text-[#00AA6C] px-1.5 py-0.5 rounded-full">Active</span>
              : <span className="text-[10px] font-bold bg-[#f3f4f6] text-[#6b7280] px-1.5 py-0.5 rounded-full">Exited</span>}
          </div>
        </div>

        {/* custom names row */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-[#f3f4f6] rounded-lg p-2">
            <div className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-0.5">FS Name</div>
            <div className="text-xs font-semibold text-[#1a1a1a] leading-tight">{link.financialStatementName ?? '—'}</div>
          </div>
          <div className="bg-[#f3f4f6] rounded-lg p-2">
            <div className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-0.5">Client Nickname</div>
            <div className="text-xs font-semibold text-[#1a1a1a]">{link.clientNickname ?? '—'}</div>
          </div>
        </div>

        {/* economics mini-row */}
        <div className="flex items-center gap-4 text-xs">
          <div>
            <span className="text-[#9ca3af]">Cost </span>
            <span className="font-semibold text-[#1a1a1a]">{fmt(link.costAtAcquisition)}</span>
          </div>
          <div>
            <span className="text-[#9ca3af]">Carrying </span>
            <span className="font-semibold text-[#1a1a1a]">{fmt(link.currentCarryingValue)}</span>
          </div>
          {gain != null && (
            <div>
              <span className="text-[#9ca3af]">G/L </span>
              <span className={`font-semibold ${gain >= 0 ? 'text-[#00AA6C]' : 'text-[#ef4444]'}`}>
                {gain >= 0 ? '+' : ''}{fmt(gain)} {gainPct && `(${gain >= 0 ? '+' : ''}${gainPct}%)`}
              </span>
            </div>
          )}
          {link.ownershipPct != null && (
            <div>
              <span className="text-[#9ca3af]">Ownership </span>
              <span className="font-semibold text-[#1a1a1a]">{link.ownershipPct}%</span>
            </div>
          )}
        </div>

        {link.dealPartner && (
          <div className="mt-2 text-xs">
            <span className="text-[#9ca3af]">Deal Partner </span>
            <span className="font-semibold text-[#1a1a1a]">{link.dealPartner}</span>
            {link.acquisitionDate && <span className="text-[#9ca3af] ml-3">Acquired {link.acquisitionDate}</span>}
          </div>
        )}
      </div>

      {/* expandable thesis + notes */}
      {(link.investmentThesis || link.notes) && (
        <>
          <button
            onClick={() => setOpen(!open)}
            className="w-full flex items-center gap-1.5 text-[10px] font-semibold text-[#6b7280] hover:text-[#005868] px-4 py-2 border-t border-[#e5e7eb] hover:bg-[#FAFAFA] transition-colors"
          >
            <BookOpen className="w-3 h-3" />
            {open ? 'Hide' : 'Show'} thesis & notes
          </button>
          {open && (
            <div className="border-t border-[#e5e7eb] px-4 py-3 space-y-2 bg-[#FAFAFA]">
              {link.investmentThesis && (
                <div>
                  <div className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-1">Investment Thesis</div>
                  <p className="text-xs text-[#1a1a1a] leading-relaxed">{link.investmentThesis}</p>
                </div>
              )}
              {link.notes && (
                <div>
                  <div className="text-[10px] font-bold text-[#9ca3af] uppercase tracking-widest mb-1">Notes</div>
                  <p className="text-xs text-[#6b7280] leading-relaxed">{link.notes}</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ─── page ──────────────────────────────────────────────── */
const TABS = ['Overview', 'Valuation', 'Identifiers', 'Entity Holdings'] as const;
type Tab = typeof TABS[number];

export default function SecurityDetailPage() {
  const { securityId } = useParams<{ securityId: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('Overview');

  useEffect(() => {
    fetch(`/api/securities/${securityId}`)
      .then((r) => r.json())
      .then((d) => { if (d?.error) setData({ _error: d.error }); else setData(d); })
      .finally(() => setLoading(false));
  }, [securityId]);

  if (loading) return <div className="text-center py-16 text-[#9ca3af]">Loading security…</div>;
  if (data?._error) return <div className="bg-[#fef2f2] border border-[#ef4444]/20 rounded-[14px] p-5 text-[#b91c1c] text-xs">{data._error}</div>;
  if (!data?.security) return <div className="text-center py-16 text-[#ef4444]">Security not found.</div>;

  const s = data.security;
  const links: any[] = data.entityLinks ?? [];
  const recentActivity: any[] = data.recentActivity ?? [];
  const gainPositive = (s.unrealizedGain ?? 0) >= 0;

  return (
    <div>
      <PageHeader
        title={s.name}
        subtitle={`${s.securityType}${s.issuer ? ` · ${s.issuer}` : ''}`}
        breadcrumbs={[
          { label: 'Data Vault', href: '/data-vault' },
          { label: 'Security Master', href: '/data-vault/security-master' },
          { label: s.securityId },
        ]}
        actions={
          <Link href="/data-vault/security-master" className="flex items-center gap-1.5 text-xs text-[#6b7280] hover:text-[#005868] bg-white border border-[#e5e7eb] px-3 py-1.5 rounded-lg transition-colors">
            <ArrowLeft className="w-3 h-3" /> Back
          </Link>
        }
      />

      {/* identity bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white rounded-[14px] border border-[#e5e7eb] shadow-[0_1px_3px_rgba(0,0,0,0.04)] px-4 py-2.5 mb-3">
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#eff6ff] text-[#2563eb]">{s.securityType}</span>
        <span className="text-xs text-[#6b7280]">{s.securityId}</span>
        {s.ticker && <><div className="h-3 w-px bg-[#e5e7eb]" /><span className="text-xs font-bold text-[#005868]">{s.ticker}</span></>}
        {s.creditRating && <><div className="h-3 w-px bg-[#e5e7eb]" /><span className="text-xs text-[#6b7280]">Rating: <span className="font-semibold text-[#1a1a1a]">{s.creditRating}</span></span></>}
        {links.length > 0 && (
          <><div className="h-3 w-px bg-[#e5e7eb]" />
          <button onClick={() => setTab('Entity Holdings')} className="flex items-center gap-1 text-xs font-semibold text-[#00AA6C] hover:text-[#008F5A] transition-colors">
            <Eye className="w-3 h-3" /> {links.length} holding{links.length !== 1 ? 's' : ''}
          </button></>
        )}
      </div>

      {/* tabs */}
      <div className="flex gap-1 mb-3 bg-white rounded-[14px] border border-[#e5e7eb] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-1">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${tab === t ? 'bg-[#F0FBF6] text-[#00AA6C]' : 'text-[#6b7280] hover:text-[#1a1a1a] hover:bg-[#f3f4f6]'}`}>
            {t}{t === 'Entity Holdings' && links.length > 0 ? ` (${links.length})` : ''}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {tab === 'Overview' && (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-2 items-start">
          <div className="xl:col-span-3 bg-white rounded-[14px] border border-[#e5e7eb] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 max-w-xl">
            <FieldSection title="Security Details">
              <FieldRow label="Security ID" value={<span className="">{s.securityId}</span>} />
              <FieldRow label="Name" value={s.name} />
              <FieldRow label="Type" value={s.securityType} />
              <FieldRow label="Issuer" value={s.issuer} />
              <FieldRow label="Sector" value={s.sector} />
              <FieldRow label="Country" value={s.country} />
              <FieldRow label="Currency" value={s.currency} />
            </FieldSection>
          </div>
          <div className="space-y-2">
            {recentActivity.length > 0 && <ActivityFeed items={recentActivity} />}
          </div>
        </div>
      )}

      {/* ── Valuation ── */}
      {tab === 'Valuation' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatBox label="Market Value" value={`$${(s.marketValue ?? 0).toLocaleString()}`} />
            <StatBox label="Cost Basis" value={`$${(s.costBasis ?? 0).toLocaleString()}`} />
            <StatBox
              label="Unrealized Gain / Loss"
              value={`${gainPositive ? '+' : ''}$${Math.abs(s.unrealizedGain ?? 0).toLocaleString()}`}
            />
            {s.quantity && <StatBox label="Quantity" value={(s.quantity).toLocaleString()} />}
            {s.pricePerUnit && <StatBox label="Price / Unit" value={`$${Number(s.pricePerUnit).toFixed(4)}`} />}
          </div>
          {s.lastPriceDate && <div className="text-[10px] text-[#9ca3af]">Last price date: {s.lastPriceDate}</div>}
        </div>
      )}

      {/* ── Identifiers ── */}
      {tab === 'Identifiers' && (
        <div className="bg-white rounded-[14px] border border-[#e5e7eb] shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 max-w-xl">
          <FieldSection title="Market Identifiers">
            <FieldRow label="Ticker" value={s.ticker} />
            <FieldRow label="CUSIP" value={<span className="">{s.cusip ?? '—'}</span>} />
            <FieldRow label="ISIN" value={<span className="">{s.isin ?? '—'}</span>} />
          </FieldSection>
          <FieldSection title="Fixed Income">
            <FieldRow label="Maturity Date" value={s.maturityDate} />
            <FieldRow label="Credit Rating" value={s.creditRating} />
            <FieldRow label="Rating Agency" value={s.ratingAgency} />
          </FieldSection>
        </div>
      )}

      {/* ── Entity Holdings ── */}
      {tab === 'Entity Holdings' && (
        <div className="space-y-3">
          {links.length === 0 ? (
            <div className="text-center py-16 text-[#9ca3af] text-sm">No entity holdings configured for this security.</div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="text-xs text-[#6b7280]">{links.length} holding{links.length !== 1 ? 's' : ''} across {new Set(links.map((l: any) => l.clientName)).size} client{new Set(links.map((l: any) => l.clientName)).size !== 1 ? 's' : ''}</div>
                {links.some((l: any) => l.watchlistFlag) && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-[#b45309] bg-[#fffbeb] px-2 py-0.5 rounded-full border border-[#d97706]/30">
                    <AlertTriangle className="w-3 h-3" /> {links.filter((l: any) => l.watchlistFlag).length} on watchlist
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {links.map((link: any) => <HoldingCard key={link.id} link={link} />)}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
