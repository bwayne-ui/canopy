'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Building2, DollarSign, Users, BarChart3, MessageSquare, Network, ArrowLeft, TrendingUp, Briefcase } from 'lucide-react';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import DataTable, { Column } from '@/components/DataTable';
import ActivityFeed from '@/components/ActivityFeed';
import { fmtMoney } from '@/lib/utils';

/* ─── local helpers ───────────────────────────────────────────────── */

function FieldRow({ label, value, format }: { label: string; value: any; format?: 'money' | 'pct' | 'bool' | 'date' }) {
  let display: React.ReactNode = '—';
  if (value != null && value !== '') {
    if (format === 'money') display = fmtMoney(Number(value));
    else if (format === 'pct') display = `${Number(value).toFixed(1)}%`;
    else if (format === 'bool') display = value ? 'Yes' : 'No';
    else display = String(value);
  }
  return (
    <div className="flex items-start py-1.5 border-b border-gray-50 last:border-0">
      <span className="w-40 flex-shrink-0 text-xs text-gray-500 font-medium">{label}</span>
      <span className="text-xs text-gray-800 font-medium">{display}</span>
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

function anyPopulated(values: any[]): boolean {
  return values.some((v) => v != null && v !== '' && v !== false);
}

function ServicePill({ label, on }: { label: string; on: any }) {
  const isOn = on === true;
  const isOff = on === false;
  return (
    <span
      className={`px-2 py-1 rounded-md text-[10px] font-semibold border ${
        isOn
          ? 'bg-[#F0FBF6] text-[#00AA6C] border-[#00AA6C]/30'
          : isOff
            ? 'bg-gray-50 text-gray-400 border-gray-200'
            : 'bg-white text-gray-300 border-gray-100'
      }`}
    >
      {isOn ? '✓ ' : isOff ? '✗ ' : '— '}{label}
    </span>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">{label}</div>
      <div className="text-sm font-bold text-gray-900">{value}</div>
    </div>
  );
}

function LpSegment({ pct, color }: { pct: any; color: string; label: string }) {
  const p = typeof pct === 'number' ? pct : 0;
  if (p <= 0) return null;
  return <div className="h-full" style={{ width: `${p}%`, backgroundColor: color }} title={`${p.toFixed(0)}%`} />;
}

function RiskPill({ label, tier }: { label: string; tier: any }) {
  const t = tier as string | null;
  const styles: Record<string, string> = {
    Low: 'bg-[#F0FBF6] text-[#00AA6C] border-[#00AA6C]/30',
    Medium: 'bg-[#fffbeb] text-[#b45309] border-[#d97706]/30',
    High: 'bg-[#fef2f2] text-[#b91c1c] border-[#b91c1c]/30',
    Critical: 'bg-[#7f1d1d] text-white border-[#7f1d1d]',
  };
  const style = (t && styles[t]) || 'bg-gray-50 text-gray-400 border-gray-200';
  return (
    <span className={`px-2 py-1 rounded-md text-[10px] font-semibold border ${style}`}>
      {label}: {t ?? '—'}
    </span>
  );
}

function StatBox({ label, value, sub, color = 'teal' }: { label: string; value: string; sub?: string; color?: string }) {
  const colors: Record<string, string> = {
    teal: 'bg-teal-50 border-teal-100',
    green: 'bg-emerald-50 border-emerald-100',
    blue: 'bg-blue-50 border-blue-100',
    amber: 'bg-amber-50 border-amber-100',
    purple: 'bg-purple-50 border-purple-100',
  };
  return (
    <div className={`rounded-lg border p-3 ${colors[color] ?? colors.teal}`}>
      <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">{label}</div>
      <div className="text-xl font-bold text-gray-900">{value}</div>
      {sub && <div className="text-[10px] text-gray-500 mt-0.5">{sub}</div>}
    </div>
  );
}

const TABS = ['Overview', 'Entities', 'Financials', 'Team & Ops', 'Communications', 'Relationships'] as const;
type Tab = typeof TABS[number];

/* ─── page ────────────────────────────────────────────────────────── */

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('Overview');

  useEffect(() => {
    fetch(`/api/clients/${id}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-center py-16 text-gray-400">Loading client…</div>;
  if (!data?.client) return <div className="text-center py-16 text-red-400">Client not found.</div>;

  const c = data.client;
  const entities: any[] = data.entities ?? [];
  const comms: any[] = data.communications ?? [];
  const rels: any[] = data.relationships ?? [];
  const recentActivity: any[] = data.recentActivity ?? [];

  const entityColumns: Column[] = [
    {
      key: 'name', label: 'Entity', sortable: true,
      render: (v: string, row: any) => (
        <Link href={`/data-vault/entities/${row.entityId}`} className="block group">
          <div className="font-semibold text-gray-900 group-hover:text-[#00C97B] transition-colors">{v}</div>
          <div className="text-[10px] text-gray-400">{row.entityType}</div>
        </Link>
      ),
    },
    { key: 'assetClass', label: 'Asset Class', sortable: true, render: (v: string) => v ? <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-teal-50 text-teal-700">{v}</span> : <span className="text-gray-300">—</span> },
    { key: 'strategy', label: 'Strategy', sortable: true },
    { key: 'vintage', label: 'Vintage', sortable: true, align: 'center', render: (v: number) => <span className="text-gray-600">{v ?? '—'}</span> },
    { key: 'navMm', label: 'NAV', sortable: true, align: 'right', render: (v: number) => <span className="">{v != null ? fmtMoney(v) : '—'}</span> },
    { key: 'commitmentMm', label: 'Commitment', sortable: true, align: 'right', render: (v: number) => <span className="">{v != null ? fmtMoney(v) : '—'}</span> },
    { key: 'lifecycleStatus', label: 'Status', sortable: true, render: (v: string) => <StatusBadge status={v} /> },
  ];

  return (
    <div>
      <PageHeader
        title={c.name}
        subtitle={`${c.primaryStrategy} · ${c.hqCity}, ${c.hqCountry}`}
        breadcrumbs={[
          { label: 'Data Vault', href: '/data-vault' },
          { label: 'Clients', href: '/data-vault/clients' },
          { label: c.shortName ?? c.name },
        ]}
        actions={
          <Link href="/data-vault/clients" className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-md">
            <ArrowLeft className="w-3 h-3" /> Back
          </Link>
        }
      />

      {/* status bar */}
      <div className="flex items-center gap-3 bg-white rounded-lg shadow-sm px-4 py-2.5 mb-3 flex-wrap">
        <StatusBadge status={c.status} />
        <span className="text-xs text-gray-400">{c.serviceLine}</span>
        <div className="h-3 w-px bg-gray-200" />
        <span className="text-xs text-gray-600 font-semibold">{entities.length} Entities</span>
        <div className="h-3 w-px bg-gray-200" />
        <span className="text-xs text-gray-500">Lead: <span className="font-semibold text-gray-700">{c.teamLead}</span></span>
        {c.podId && <><div className="h-3 w-px bg-gray-200" /><span className="text-xs text-gray-500">Pod: <span className="font-semibold text-gray-700">{c.podId}</span></span></>}
        <span className="ml-auto text-[10px] text-gray-400">Client since {c.relationshipStart?.slice(0, 4)}</span>
      </div>

      {/* tabs */}
      <div className="flex gap-1 mb-3 bg-white rounded-lg shadow-sm p-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${tab === t ? 'bg-[#00C97B]/10 text-[#00C97B]' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* ─── OVERVIEW ─────────────────────────────── */}
      {tab === 'Overview' && (
        <div className="grid grid-cols-4 gap-3">
          {/* left 3/4 */}
          <div className="col-span-3 space-y-3">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="grid grid-cols-2 gap-6">
                <FieldSection title="Identity">
                  <FieldRow label="Full Name" value={c.name} />
                  <FieldRow label="Short Name" value={c.shortName} />
                  <FieldRow label="Primary Strategy" value={c.primaryStrategy} />
                  <FieldRow label="Service Line" value={c.serviceLine} />
                  <FieldRow label="Status" value={c.status} />
                  <FieldRow label="Year Founded" value={c.yearFounded} />
                  <FieldRow label="Employees (GP)" value={c.employeeCount} />
                </FieldSection>
                <FieldSection title="Location & Relationship">
                  <FieldRow label="HQ City" value={c.hqCity} />
                  <FieldRow label="HQ Country" value={c.hqCountry} />
                  <FieldRow label="Region" value={c.region} />
                  <FieldRow label="Relationship Start" value={c.relationshipStart} format="date" />
                  <FieldRow label="Website" value={c.website} />
                </FieldSection>
              </div>
              {c.notes && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Notes</div>
                  <p className="text-xs text-gray-700">{c.notes}</p>
                </div>
              )}
            </div>

            {/* ── Strategy & AUM ── */}
            {anyPopulated([c.aumMm, c.strategyMix, c.portfolioCompanyCount, c.typicalDealSizeMm, c.firstFundVintage, c.latestFundVintage]) && (
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="grid grid-cols-2 gap-6">
                  <FieldSection title="Strategy & AUM">
                    <FieldRow label="AUM" value={c.aumMm} format="money" />
                    <div className="flex items-start py-1.5 border-b border-gray-50">
                      <span className="w-40 flex-shrink-0 text-xs text-gray-500 font-medium">Strategy Mix</span>
                      <div className="flex flex-wrap gap-1">
                        {c.strategyMix ? c.strategyMix.split(',').map((s: string) => (
                          <span key={s} className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#F0FBF6] text-[#00AA6C]">{s.trim()}</span>
                        )) : <span className="text-xs text-gray-300">—</span>}
                      </div>
                    </div>
                    <FieldRow label="Portfolio Co. Count" value={c.portfolioCompanyCount} />
                  </FieldSection>
                  <FieldSection title="Deal & Vintage">
                    <FieldRow label="Typical Deal Size" value={c.typicalDealSizeMm} format="money" />
                    <FieldRow label="First Fund Vintage" value={c.firstFundVintage} />
                    <FieldRow label="Latest Fund Vintage" value={c.latestFundVintage} />
                  </FieldSection>
                </div>
              </div>
            )}

            {/* ── Fund Structure Defaults ── */}
            {anyPopulated([c.waterfallType, c.hurdleRatePct, c.mgmtFeePct, c.carriedInterestPct, c.gpCommitPct]) && (
              <div className="bg-white rounded-lg shadow-sm p-4">
                <FieldSection title="Fund Structure Defaults">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <FieldRow label="Waterfall Type" value={c.waterfallType} />
                      <FieldRow label="Hurdle Rate" value={c.hurdleRatePct} format="pct" />
                      <FieldRow label="Mgmt Fee" value={c.mgmtFeePct} format="pct" />
                    </div>
                    <div>
                      <FieldRow label="Carried Interest" value={c.carriedInterestPct} format="pct" />
                      <FieldRow label="GP Commit" value={c.gpCommitPct} format="pct" />
                    </div>
                  </div>
                </FieldSection>
              </div>
            )}

            {/* ── Operational Partners ── */}
            {anyPopulated([c.auditFirm, c.legalCounsel, c.primaryCustodian, c.taxAdvisor, c.bankingRelationship, c.dataRoomPlatform]) && (
              <div className="bg-white rounded-lg shadow-sm p-4">
                <FieldSection title="Operational Partners">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <FieldRow label="Audit Firm" value={c.auditFirm} />
                      <FieldRow label="Legal Counsel" value={c.legalCounsel} />
                      <FieldRow label="Primary Custodian" value={c.primaryCustodian} />
                    </div>
                    <div>
                      <FieldRow label="Tax Advisor" value={c.taxAdvisor} />
                      <FieldRow label="Banking" value={c.bankingRelationship} />
                      <FieldRow label="Data Room" value={c.dataRoomPlatform} />
                    </div>
                  </div>
                </FieldSection>
              </div>
            )}

            {/* ── Compliance ── */}
            {anyPopulated([c.secRegistered, c.advFilingDate, c.formPfRequired, c.amlRiskTier]) && (
              <div className="bg-white rounded-lg shadow-sm p-4">
                <FieldSection title="Compliance">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <FieldRow label="SEC Registered" value={c.secRegistered} format="bool" />
                      <FieldRow label="ADV Filing Date" value={c.advFilingDate} />
                    </div>
                    <div>
                      <FieldRow label="Form PF Required" value={c.formPfRequired} format="bool" />
                      <FieldRow label="AML Risk Tier" value={c.amlRiskTier} />
                    </div>
                  </div>
                </FieldSection>
              </div>
            )}

            {/* ── Relationship (stage or churn) ── */}
            {anyPopulated([c.relationshipStage, c.churnDate, c.churnReason, c.lastContactAt, c.nextMeetingAt, c.accountExecutive, c.nps]) && (
              <div className="bg-white rounded-lg shadow-sm p-4">
                <FieldSection title={c.status === 'Churned' ? 'Churn Details' : 'Relationship'}>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      {c.relationshipStage && <FieldRow label="Pipeline Stage" value={c.relationshipStage} />}
                      {c.churnDate && <FieldRow label="Churn Date" value={c.churnDate} />}
                      {c.churnReason && <FieldRow label="Churn Reason" value={c.churnReason} />}
                      <FieldRow label="Account Executive" value={c.accountExecutive} />
                    </div>
                    <div>
                      <FieldRow label="Last Contact" value={c.lastContactAt} />
                      <FieldRow label="Next Meeting" value={c.nextMeetingAt} />
                      {c.nps != null && <FieldRow label="NPS" value={c.nps} />}
                    </div>
                  </div>
                </FieldSection>
              </div>
            )}

            {/* ── Service Mix ── */}
            {anyPopulated([c.usesFundAdmin, c.usesInvestorPortal, c.usesTaxServices, c.usesComplianceSupport, c.usesTreasuryServices]) && (
              <div className="bg-white rounded-lg shadow-sm p-4">
                <FieldSection title="Service Mix">
                  <div className="flex flex-wrap gap-2">
                    <ServicePill label="Fund Admin" on={c.usesFundAdmin} />
                    <ServicePill label="Investor Portal" on={c.usesInvestorPortal} />
                    <ServicePill label="Tax Services" on={c.usesTaxServices} />
                    <ServicePill label="Compliance Support" on={c.usesComplianceSupport} />
                    <ServicePill label="Treasury" on={c.usesTreasuryServices} />
                  </div>
                </FieldSection>
              </div>
            )}

            {/* ── Billing (active clients only) ── */}
            {anyPopulated([c.billingFrequency, c.arAgingDays, c.lastInvoiceAt, c.paymentMethod]) && (
              <div className="bg-white rounded-lg shadow-sm p-4">
                <FieldSection title="Billing">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <FieldRow label="Billing Frequency" value={c.billingFrequency} />
                      <FieldRow label="AR Aging (days)" value={c.arAgingDays} />
                    </div>
                    <div>
                      <FieldRow label="Last Invoice" value={c.lastInvoiceAt} />
                      <FieldRow label="Payment Method" value={c.paymentMethod} />
                    </div>
                  </div>
                </FieldSection>
              </div>
            )}

            {/* ── ESG ── */}
            {anyPopulated([c.esgPolicy, c.diversityReporting, c.sasbAligned]) && (
              <div className="bg-white rounded-lg shadow-sm p-4">
                <FieldSection title="ESG & Reporting">
                  <div className="flex flex-wrap gap-2">
                    <ServicePill label="ESG Policy" on={c.esgPolicy} />
                    <ServicePill label="Diversity Reporting" on={c.diversityReporting} />
                    <ServicePill label="SASB Aligned" on={c.sasbAligned} />
                  </div>
                </FieldSection>
              </div>
            )}

            {/* ───────────────────────────────────────────── */}
            {/* v2 EXPANSION — 12 new theme cards */}
            {/* ───────────────────────────────────────────── */}

            {/* ── IR & Fundraising ── */}
            {anyPopulated([c.activeFundraise, c.currentFundTargetMm, c.lpCount, c.placementAgent]) && (
              <div className="bg-white rounded-lg shadow-sm p-4">
                <FieldSection title="IR & Fundraising">
                  {c.activeFundraise && c.currentFundTargetMm != null && (
                    <div className="mb-3">
                      <div className="flex justify-between mb-1">
                        <span className="text-[10px] font-bold text-[#00AA6C] uppercase tracking-widest">Current Raise</span>
                        <span className="text-[10px] text-gray-500">{fmtMoney(c.currentFundRaisedMm ?? 0)} / {fmtMoney(c.currentFundTargetMm)}</span>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#00AA6C]" style={{ width: `${Math.min(100, Math.round(((c.currentFundRaisedMm ?? 0) / c.currentFundTargetMm) * 100))}%` }} />
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <FieldRow label="Active Fundraise" value={c.activeFundraise} format="bool" />
                      <FieldRow label="Close Date" value={c.currentFundCloseDate} />
                      <FieldRow label="Cycle" value={c.fundraisingCycle} />
                      <FieldRow label="Placement Agent" value={c.placementAgent} />
                      <FieldRow label="Sub Docs" value={c.subscriptionDocsVersion} />
                    </div>
                    <div>
                      <FieldRow label="LP Count" value={c.lpCount} />
                      <FieldRow label="Avg LP Commit" value={c.avgLpCommitmentMm} format="money" />
                      <FieldRow label="Institutional %" value={c.institutionalLpPct} format="pct" />
                    </div>
                  </div>
                </FieldSection>
              </div>
            )}

            {/* ── Portfolio Analytics ── */}
            {anyPopulated([c.grossIrrAggregatePct, c.netIrrAggregatePct, c.tvpiAggregate, c.moicAggregate, c.dpiAggregate]) && (
              <div className="bg-white rounded-lg shadow-sm p-4">
                <FieldSection title="Portfolio Analytics">
                  <div className="grid grid-cols-5 gap-2 mb-3">
                    <Metric label="Gross IRR" value={c.grossIrrAggregatePct != null ? `${c.grossIrrAggregatePct.toFixed(1)}%` : '—'} />
                    <Metric label="Net IRR" value={c.netIrrAggregatePct != null ? `${c.netIrrAggregatePct.toFixed(1)}%` : '—'} />
                    <Metric label="TVPI" value={c.tvpiAggregate?.toFixed(2) ?? '—'} />
                    <Metric label="DPI" value={c.dpiAggregate?.toFixed(2) ?? '—'} />
                    <Metric label="MOIC" value={c.moicAggregate?.toFixed(2) ?? '—'} />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <FieldRow label="Realized % of Capital" value={c.realizedPctOfCapital} format="pct" />
                      <FieldRow label="Write-offs" value={c.writeoffCount} />
                      <FieldRow label="Impairments" value={c.impairmentCount} />
                    </div>
                    <div>
                      <FieldRow label="Top Quartile" value={c.topQuartilePerformer} format="bool" />
                      <FieldRow label="Benchmark %ile" value={c.benchmarkPercentile} />
                    </div>
                  </div>
                </FieldSection>
              </div>
            )}

            {/* ── LP Base Composition ── */}
            {anyPopulated([c.lpBaseDiversity, c.pensionLpPct, c.endowmentLpPct, c.top3LpConcentrationPct]) && (
              <div className="bg-white rounded-lg shadow-sm p-4">
                <FieldSection title="LP Base Composition">
                  <div className="mb-3">
                    <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest mb-1">Breakdown</div>
                    <div className="w-full h-3 bg-gray-100 rounded overflow-hidden flex">
                      <LpSegment pct={c.pensionLpPct} color="#00AA6C" label="Pension" />
                      <LpSegment pct={c.endowmentLpPct} color="#2563eb" label="Endowment" />
                      <LpSegment pct={c.sovereignWealthLpPct} color="#7c3aed" label="Sovereign" />
                      <LpSegment pct={c.insuranceLpPct} color="#d97706" label="Insurance" />
                      <LpSegment pct={c.familyOfficeLpPct} color="#db2777" label="Family Office" />
                      <LpSegment pct={c.fofLpPct} color="#0891b2" label="FoF" />
                      <LpSegment pct={c.individualHnwLpPct} color="#65a30d" label="HNW" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <FieldRow label="Diversity" value={c.lpBaseDiversity} />
                      <FieldRow label="Top 3 LP Concentration" value={c.top3LpConcentrationPct} format="pct" />
                      <FieldRow label="Pension %" value={c.pensionLpPct} format="pct" />
                      <FieldRow label="Endowment %" value={c.endowmentLpPct} format="pct" />
                      <FieldRow label="Sovereign %" value={c.sovereignWealthLpPct} format="pct" />
                    </div>
                    <div>
                      <FieldRow label="Insurance %" value={c.insuranceLpPct} format="pct" />
                      <FieldRow label="Family Office %" value={c.familyOfficeLpPct} format="pct" />
                      <FieldRow label="FoF %" value={c.fofLpPct} format="pct" />
                      <FieldRow label="HNW Individual %" value={c.individualHnwLpPct} format="pct" />
                      <FieldRow label="Re-up Rate" value={c.reupRatePct} format="pct" />
                    </div>
                  </div>
                </FieldSection>
              </div>
            )}

            {/* ── Risk Scoring ── */}
            {anyPopulated([c.creditRiskTier, c.operationalRiskTier, c.cyberRiskTier, c.litigationPending, c.keyPersonRiskFlag]) && (
              <div className="bg-white rounded-lg shadow-sm p-4">
                <FieldSection title="Risk Scoring">
                  <div className="flex flex-wrap gap-2 mb-3">
                    <RiskPill label="Credit" tier={c.creditRiskTier} />
                    <RiskPill label="Concentration" tier={c.concentrationRiskTier} />
                    <RiskPill label="Operational" tier={c.operationalRiskTier} />
                    <RiskPill label="Cyber" tier={c.cyberRiskTier} />
                    <RiskPill label="Regulatory" tier={c.regulatoryRiskTier} />
                    <RiskPill label="Reputation" tier={c.reputationRiskTier} />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <FieldRow label="Litigation Pending" value={c.litigationPending} format="bool" />
                      <FieldRow label="Litigation Count" value={c.litigationCount} />
                    </div>
                    <div>
                      <FieldRow label="Sanctions Exposure" value={c.sanctionsExposure} format="bool" />
                      <FieldRow label="Key-Person Risk Flag" value={c.keyPersonRiskFlag} format="bool" />
                    </div>
                  </div>
                </FieldSection>
              </div>
            )}

            {/* ── Tech Stack ── */}
            {anyPopulated([c.accountingSystemPref, c.crmSystem, c.reportingPlatform, c.techModernizationScore]) && (
              <div className="bg-white rounded-lg shadow-sm p-4">
                <FieldSection title="Tech Stack">
                  {c.techModernizationScore != null && (
                    <div className="mb-3 flex items-center gap-2">
                      <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Modernization Score</span>
                      <span className="text-sm font-bold text-[#00AA6C]">{c.techModernizationScore}/10</span>
                      <div className="flex-1 h-2 bg-gray-100 rounded overflow-hidden">
                        <div className="h-full bg-[#00AA6C]" style={{ width: `${(c.techModernizationScore / 10) * 100}%` }} />
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <FieldRow label="Accounting System" value={c.accountingSystemPref} />
                      <FieldRow label="CRM" value={c.crmSystem} />
                      <FieldRow label="Portal" value={c.portalProvider} />
                      <FieldRow label="Reporting" value={c.reportingPlatform} />
                      <FieldRow label="Data Warehouse" value={c.dataWarehouse} />
                    </div>
                    <div>
                      <FieldRow label="Doc Mgmt" value={c.docMgmtPlatform} />
                      <FieldRow label="Email" value={c.emailPlatform} />
                      <FieldRow label="Workflow Tools" value={c.workflowTools} />
                      <FieldRow label="API Integrations" value={c.apiIntegrations} />
                    </div>
                  </div>
                </FieldSection>
              </div>
            )}

            {/* ── Fund Economics Detail ── */}
            {anyPopulated([c.crystallizationFrequency, c.catchUpType, c.clawbackProvision, c.keyPersonProvision]) && (
              <div className="bg-white rounded-lg shadow-sm p-4">
                <FieldSection title="Fund Economics Detail">
                  <div className="flex flex-wrap gap-2 mb-3">
                    <ServicePill label="Clawback" on={c.clawbackProvision} />
                    <ServicePill label="Key-Person" on={c.keyPersonProvision} />
                    <ServicePill label="No-Fault Divorce" on={c.noFaultDivorce} />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <FieldRow label="Crystallization" value={c.crystallizationFrequency} />
                      <FieldRow label="European Hurdle" value={c.europeanHurdleType} />
                      <FieldRow label="Catch-Up Type" value={c.catchUpType} />
                      <FieldRow label="Catch-Up %" value={c.catchUpPct} format="pct" />
                    </div>
                    <div>
                      <FieldRow label="Mgmt Fee Discount" value={c.mgmtFeeDiscountPct} format="pct" />
                      <FieldRow label="Pref Compounding" value={c.preferredReturnCompounding} />
                      <FieldRow label="GP Commit Source" value={c.gpCommitSource} />
                    </div>
                  </div>
                </FieldSection>
              </div>
            )}

            {/* ── Service SLA ── */}
            {anyPopulated([c.quarterlyReportingSlaDays, c.navDeliveryDays, c.slaOnTimePct]) && (
              <div className="bg-white rounded-lg shadow-sm p-4">
                <FieldSection title="Service SLA">
                  {c.slaOnTimePct != null && (
                    <div className="mb-3 flex items-center gap-2">
                      <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">On-Time Rate</span>
                      <span className={`text-sm font-bold ${c.slaOnTimePct >= 95 ? 'text-[#00AA6C]' : c.slaOnTimePct >= 90 ? 'text-[#d97706]' : 'text-[#b91c1c]'}`}>{c.slaOnTimePct.toFixed(1)}%</span>
                      {(c.slaBreachCountYtd ?? 0) > 0 && (
                        <span className="text-[10px] bg-[#fef2f2] text-[#b91c1c] px-1.5 py-0.5 rounded font-semibold">{c.slaBreachCountYtd} breaches YTD</span>
                      )}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <FieldRow label="Quarterly Reporting (days)" value={c.quarterlyReportingSlaDays} />
                      <FieldRow label="Annual Audit (days)" value={c.annualAuditSlaDays} />
                      <FieldRow label="Cap Call Turnaround (hrs)" value={c.capitalCallTurnaroundHours} />
                      <FieldRow label="Distribution Processing (days)" value={c.distributionProcessingDays} />
                      <FieldRow label="NAV Delivery (days)" value={c.navDeliveryDays} />
                    </div>
                    <div>
                      <FieldRow label="K-1 Target" value={c.k1DeliveryTarget} />
                      <FieldRow label="Investor Inquiry (hrs)" value={c.investorInquiryResponseHours} />
                      <FieldRow label="Onboarding (weeks)" value={c.onboardingTimelineWeeks} />
                    </div>
                  </div>
                </FieldSection>
              </div>
            )}

            {/* ── JSQ Financials (internal-only) ── */}
            {anyPopulated([c.arrContractedMm, c.lifetimeRevenueMm, c.pipelineValueMm, c.profitabilityTier]) && (
              <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-[#005868]">
                <FieldSection title="JSQ Financials · Internal">
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    <Metric label="ARR" value={c.arrContractedMm != null ? fmtMoney(c.arrContractedMm) : '—'} />
                    <Metric label="LTV" value={c.lifetimeValueMm != null ? fmtMoney(c.lifetimeValueMm) : '—'} />
                    <Metric label="Gross Margin" value={c.grossMarginPct != null ? `${c.grossMarginPct.toFixed(1)}%` : '—'} />
                    <Metric label="Tier" value={c.profitabilityTier ?? '—'} />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <FieldRow label="Pipeline Value" value={c.pipelineValueMm} format="money" />
                      <FieldRow label="Lifetime Revenue" value={c.lifetimeRevenueMm} format="money" />
                      <FieldRow label="Cost to Service" value={c.costToServiceMm} format="money" />
                    </div>
                    <div>
                      <FieldRow label="Upsell Opportunity" value={c.upsellOpportunityMm} format="money" />
                      <FieldRow label="Discount %" value={c.discountPct} format="pct" />
                      <FieldRow label="Contract Value" value={c.contractValueMm} format="money" />
                    </div>
                  </div>
                </FieldSection>
              </div>
            )}

            {/* ── Relationship History ── */}
            {anyPopulated([c.firstMeetingDate, c.contractSignedDate, c.prevAdminBeforeJsq, c.advocacyScore]) && (
              <div className="bg-white rounded-lg shadow-sm p-4">
                <FieldSection title="Relationship History">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <FieldRow label="First Meeting" value={c.firstMeetingDate} />
                      <FieldRow label="Contract Signed" value={c.contractSignedDate} />
                      <FieldRow label="Last Renewal" value={c.lastContractRenewalDate} />
                      <FieldRow label="Next Renewal" value={c.nextContractRenewalDate} />
                      <FieldRow label="Auto-Renew" value={c.contractAutoRenew} format="bool" />
                    </div>
                    <div>
                      <FieldRow label="Prior Admin" value={c.prevAdminBeforeJsq} />
                      <FieldRow label="Referral Source" value={c.referralSource} />
                      <FieldRow label="Advocacy Score" value={c.advocacyScore != null ? `${c.advocacyScore}/10` : null} />
                      <FieldRow label="Owner Tenure" value={c.relationshipOwnerTenureMonths != null ? `${c.relationshipOwnerTenureMonths} mo` : null} />
                      <FieldRow label="Renewal Risk" value={c.renewalRiskScore != null ? `${c.renewalRiskScore}/100` : null} />
                    </div>
                  </div>
                </FieldSection>
              </div>
            )}

            {/* ── DEI / Culture ── */}
            {anyPopulated([c.womenOwnedPct, c.minorityOwnedPct, c.diverseLeadershipPct, c.diversityHiringPledge]) && (
              <div className="bg-white rounded-lg shadow-sm p-4">
                <FieldSection title="DEI & Culture">
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <Metric label="Women-Owned" value={c.womenOwnedPct != null ? `${c.womenOwnedPct.toFixed(0)}%` : '—'} />
                    <Metric label="Minority-Owned" value={c.minorityOwnedPct != null ? `${c.minorityOwnedPct.toFixed(0)}%` : '—'} />
                    <Metric label="Diverse Leadership" value={c.diverseLeadershipPct != null ? `${c.diverseLeadershipPct.toFixed(0)}%` : '—'} />
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <ServicePill label="Hiring Pledge" on={c.diversityHiringPledge} />
                    <ServicePill label="ILPA Diversity Metrics" on={c.ilpaDiversityMetrics} />
                    <ServicePill label="Parity Signatory" on={c.paritySignatory} />
                    <ServicePill label="Rockefeller Principles" on={c.rockefellerPrinciples} />
                    <ServicePill label="PRI Signatory" on={c.pcpSignatory} />
                  </div>
                  <FieldRow label="Board Independence" value={c.boardIndependencePct} format="pct" />
                  <FieldRow label="Governance Cert" value={c.governanceCertification} />
                </FieldSection>
              </div>
            )}

            {/* ── Regulatory Detail ── */}
            {anyPopulated([c.formAdvPart1Date, c.ccoOnStaff, c.mostRecentSecExamDate]) && (
              <div className="bg-white rounded-lg shadow-sm p-4">
                <FieldSection title="Regulatory Detail">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <FieldRow label="Form ADV Part 1" value={c.formAdvPart1Date} />
                      <FieldRow label="Form ADV Part 2" value={c.formAdvPart2Date} />
                      <FieldRow label="MiFID II" value={c.mifidApplicable} format="bool" />
                      <FieldRow label="AIFMD" value={c.aifmdApplicable} format="bool" />
                      <FieldRow label="UBO Registry" value={c.uboRegistryFiled} format="bool" />
                    </div>
                    <div>
                      <FieldRow label="Beneficial Owners Disclosed" value={c.beneficialOwnershipDisclosed} format="bool" />
                      <FieldRow label="CCO on Staff" value={c.ccoOnStaff} format="bool" />
                      <FieldRow label="CCO Name" value={c.ccoName} />
                      <FieldRow label="Most Recent SEC Exam" value={c.mostRecentSecExamDate} />
                      <FieldRow label="Exam Deficiencies" value={c.secExamDeficiencies} />
                    </div>
                  </div>
                </FieldSection>
              </div>
            )}

            {/* ── Communication Preferences ── */}
            {anyPopulated([c.preferredReportingFormat, c.preferredCommunicationChannel, c.boardMeetingCadence]) && (
              <div className="bg-white rounded-lg shadow-sm p-4">
                <FieldSection title="Communication Preferences">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <FieldRow label="Reporting Format" value={c.preferredReportingFormat} />
                      <FieldRow label="Channel" value={c.preferredCommunicationChannel} />
                      <FieldRow label="Contact Frequency" value={c.mainContactFrequency} />
                      <FieldRow label="Escalation Path" value={c.escalationPath} />
                      <FieldRow label="Board Cadence" value={c.boardMeetingCadence} />
                    </div>
                    <div>
                      <FieldRow label="LPAC Count" value={c.lpAdvisoryCommitteeCount} />
                      <FieldRow label="Monthly Updates" value={c.monthlyInvestorUpdateEnabled} format="bool" />
                      <FieldRow label="Private IR Portal" value={c.privateIrPortalEnabled} format="bool" />
                      <FieldRow label="Investor Day" value={c.investorDayCadence} />
                      <FieldRow label="Roadshow Frequency" value={c.roadshowFrequency} />
                    </div>
                  </div>
                </FieldSection>
              </div>
            )}
          </div>

          {/* right 1/4 */}
          <div className="space-y-3">
            <div className="bg-white rounded-lg shadow-sm p-3">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Team</div>
              <FieldRow label="Lead" value={c.teamLead} />
              <FieldRow label="Pod" value={c.podId} />
              <FieldRow label="Service Line" value={c.serviceLine} />
            </div>
            <div className="bg-white rounded-lg shadow-sm p-3 space-y-2">
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Quick Stats</div>
              <div className="flex justify-between text-xs"><span className="text-gray-500">Entities</span><span className="font-semibold text-gray-800">{entities.length}</span></div>
              <div className="flex justify-between text-xs"><span className="text-gray-500">Total NAV</span><span className="font-semibold text-gray-800">{fmtMoney(c.totalNavMm ?? 0)}</span></div>
              <div className="flex justify-between text-xs"><span className="text-gray-500">Revenue L12M</span><span className="font-semibold text-gray-800">{fmtMoney(c.revenueL12m ?? 0)}</span></div>
              <div className="flex justify-between text-xs"><span className="text-gray-500">Margin</span><span className="font-semibold text-gray-800">{(c.marginPct ?? 0).toFixed(1)}%</span></div>
            </div>
            {recentActivity.length > 0 && <ActivityFeed items={recentActivity} />}
          </div>
        </div>
      )}

      {/* ─── ENTITIES ─────────────────────────────── */}
      {tab === 'Entities' && (
        <DataTable columns={entityColumns} data={entities} searchPlaceholder="Search entities…" />
      )}

      {/* ─── FINANCIALS ───────────────────────────── */}
      {tab === 'Financials' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatBox label="Total NAV" value={fmtMoney(c.totalNavMm ?? 0)} color="teal" />
            <StatBox label="Total Commitment" value={fmtMoney(c.totalCommitmentMm ?? 0)} color="blue" />
            <StatBox label="Revenue L12M" value={fmtMoney(c.revenueL12m ?? 0)} sub="USD" color="green" />
            <StatBox label="Margin" value={`${(c.marginPct ?? 0).toFixed(1)}%`} color="purple" />
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Entity Breakdown</div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900">{entities.length}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">Total Entities</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-600">{entities.filter(e => e.lifecycleStatus === 'Active').length}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">Active</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-400">{entities.filter(e => e.lifecycleStatus !== 'Active').length}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">Inactive / Wind-Down</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TEAM & OPS ───────────────────────────── */}
      {tab === 'Team & Ops' && (
        <div className="bg-white rounded-lg shadow-sm p-4 max-w-lg">
          <FieldSection title="Service Team">
            <FieldRow label="Team Lead" value={c.teamLead} />
            <FieldRow label="Pod" value={c.podId} />
            <FieldRow label="Service Line" value={c.serviceLine} />
          </FieldSection>
          <FieldSection title="Relationship">
            <FieldRow label="Relationship Start" value={c.relationshipStart} />
            <FieldRow label="HQ City" value={c.hqCity} />
            <FieldRow label="HQ Country" value={c.hqCountry} />
            <FieldRow label="Region" value={c.region} />
          </FieldSection>
        </div>
      )}

      {/* ─── COMMUNICATIONS ───────────────────────── */}
      {tab === 'Communications' && (
        <div className="bg-white rounded-lg shadow-sm divide-y divide-gray-50">
          {comms.length === 0 && <div className="py-10 text-center text-gray-400 text-xs">No communications on record.</div>}
          {comms.map((comm) => (
            <div key={comm.id} className="px-4 py-3 flex gap-3 hover:bg-gray-50 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${comm.channel === 'Email' ? 'bg-blue-50 text-blue-600' : comm.channel === 'Call' ? 'bg-purple-50 text-purple-600' : 'bg-gray-100 text-gray-500'}`}>{comm.channel}</span>
                  <span className="text-xs font-semibold text-gray-800 truncate">{comm.subject}</span>
                  {comm.urgency === 'High' && <span className="text-[10px] font-bold bg-red-50 text-red-600 px-1.5 py-0.5 rounded">Urgent</span>}
                </div>
                <div className="text-xs text-gray-500">{comm.fromName} → {comm.toName}{comm.entityName ? ` · ${comm.entityName}` : ''}</div>
                {comm.summary && <div className="text-xs text-gray-600 mt-0.5 truncate">{comm.summary}</div>}
              </div>
              <div className="flex-shrink-0 text-right">
                <div className="text-[10px] text-gray-400">{comm.communicationDate?.slice(0, 10)}</div>
                <StatusBadge status={comm.status} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── RELATIONSHIPS ────────────────────────── */}
      {tab === 'Relationships' && (
        <div className="bg-white rounded-lg shadow-sm divide-y divide-gray-50">
          {rels.length === 0 && <div className="py-10 text-center text-gray-400 text-xs">No relationships on record.</div>}
          {rels.map((rel) => (
            <div key={rel.id} className="px-4 py-3 flex gap-3">
              <Network className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-gray-800">{rel.relationshipType ?? 'Relationship'}</div>
                <div className="text-xs text-gray-500">{rel.sourceId} ↔ {rel.targetId}</div>
                {rel.description && <div className="text-xs text-gray-600 mt-0.5">{rel.description}</div>}
              </div>
              {rel.strength && (
                <div className="ml-auto text-[10px] text-gray-400">Strength: {rel.strength}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
