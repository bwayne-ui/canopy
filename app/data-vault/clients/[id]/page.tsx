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
