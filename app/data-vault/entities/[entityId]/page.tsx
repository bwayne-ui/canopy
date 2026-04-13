'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import { fmtMoney, fmtPct } from '@/lib/utils';
import { Building2, Users, ClipboardCheck, ArrowLeft, AlertTriangle } from 'lucide-react';

/* ─── types ────────────────────────────────────────────────────────── */

interface EntityDetail {
  entityId: string; name: string; entityType: string; structureType: string;
  lifecycleStatus: string; clientName: string; domicile: string; strategy: string;
  vintage: number | null; currency: string; openEnded: boolean;
  inceptionDate: string | null; hqCity: string | null; region: string | null;
  dataQualityScore: number | null; confidenceScore: number | null;
  navMm: number | null; commitmentMm: number | null; calledCapitalMm: number | null;
  distributedCapitalMm: number | null; unfundedMm: number | null;
  navFrequency: string | null; accountingSystem: string | null;
  investorCount: number;
  revenueL12m: number | null; costL12m: number | null; marginPct: number | null;
  grossIrrPct: number | null; netIrrPct: number | null;
  moic: number | null; tvpi: number | null; dpi: number | null;
  mgmtFeePct: number | null; prefRatePct: number | null; carryPct: number | null;
  waterfallType: string | null;
  administrator: string | null; auditor: string | null; legalCounsel: string | null;
  reportingFrequency: string | null;
  // entity profile
  assetClass: string | null; shortName: string | null;
  domicileCountry: string | null; domicileCountryOther: string | null; domicileState: string | null;
  einTaxId: string | null; entityRole: string | null; entityRoleOther: string | null;
  entityTypeOther: string | null; fundStructure: string | null; fundStructureOther: string | null;
  regulatoryClassification: string | null; regulatoryClassificationOther: string | null;
  geographyFocus: string | null; geographyFocusOther: string | null;
  sectorFocus: string | null; sectorFocusOther: string | null;
  investmentStrategyDetail: string | null; investmentStrategyDetailOther: string | null;
  leveredFund: boolean | null; usesSubFacility: boolean | null;
  targetCommittedCapital: number | null; targetInvestmentCount: number | null;
  targetInvestorCount: number | null; targetLeveragePct: number | null;
  fundraisingFirstClose: string | null; fundraisingFinalClose: string | null;
  registeredAddress: string | null;
  // economics
  carryStructure: string | null; catchUpType: string | null;
  clawbackApplies: boolean | null; clawbackTrueUpFrequency: string | null;
  feeStepdownExists: boolean | null; hurdleType: string | null;
  mgmtFeeBasis: string | null; mgmtFeeBasisOther: string | null;
  mgmtFeeFrequency: string | null;
  mgmtFeeWaiverOffset: string | null; mgmtFeeWaiverOffsetOther: string | null;
  escrowHoldbackApplies: boolean | null; escrowHoldbackPct: number | null;
  mgmtFeeOffsetPct: number | null;
  prefReturnCompounding: string | null; prefReturnDayCount: string | null;
  taxDistributionPolicy: string | null; taxDistributionPolicyOther: string | null;
  unitOfAccount: string | null;
  // fund accounting — operations
  booksComplexityTier: string | null; chartOfAccountsTemplate: string | null;
  chartOfAccountsOther: string | null; generalLedgerSystem: string | null;
  generalLedgerSystemOther: string | null; closeProcessModel: string | null;
  bankFeedEnabled: boolean | null; portfolioDataFeedEnabled: boolean | null;
  docMgmtSystem: string | null; docMgmtSystemOther: string | null;
  multiCloseRebalancing: string | null; reconciliationTool: string | null;
  reconciliationToolOther: string | null; sideLetterComplexity: string | null;
  specialAllocationFrequency: string | null; waterfallCalcAutomation: string | null;
  annualCapitalEventsExpected: string | null;
  // fund accounting — onboarding
  conversionType: string | null; conversionStartDate: string | null;
  documentConversionScope: string | null; onboardingOwner: string | null;
  sourceSystemsPriorAdmin: string | null; sourceSystemsPriorAdminOther: string | null;
  // fund accounting — reporting
  accountingFramework: string | null; accountingFrameworkOther: string | null;
  financialStatementsFrequency: string | null; footnoteDisclosureLevel: string | null;
  investorStatementsFrequency: string | null;
  reportingPackageTimingQeDays: number | null; reportingPackageTimingYeDays: number | null;
  valuationDeliverySla: number | null;
  // investor services — compliance
  amlProgramRequired: boolean | null; fatcaRequired: boolean | null; crsRequired: boolean | null;
  kycStandard: string | null; kycStandardOther: string | null;
  benefitPlanInvestorTracking: boolean | null; restrictedPersonsTracking: boolean | null;
  support1099Level: string | null;
  // investor services — treasury ops
  bankAccountCount: number | null; bankConnectivityMethod: string | null;
  bankConnectivityOther: string | null; multiCurrency: boolean | null;
  paymentApprovalLevels: string | null; positivePayEnabled: boolean | null;
  primaryCurrency: string | null; primaryCurrencyOther: string | null;
  // investor services — operations
  investorPortalEnabled: boolean | null; redemptionProcessingModel: string | null;
  sideLetterWorkflowAutomation: string | null;
  // scope / modules
  scopeFundAccounting: boolean | null; scopeInvestorServices: boolean | null;
  scopeTaxServices: string | null; scopeTaxServicesOther: string | null;
  scopeTreasury: boolean | null; scopeLoanAdmin: boolean | null;
  scopeMgmtCoAccounting: boolean | null; scopeRegulatoryReporting: boolean | null;
  scopeAmlKyc: string | null; scopeFatcaCrs: boolean | null;
  // governance
  auditTrailEnabled: boolean | null; dataClassificationLevel: string | null;
  entityDataSteward: string | null;
  // relationships
  custodianPrimeBroker: string | null; fundComplexName: string | null;
  managementCompanyRef: string | null; sponsorGpOrg: string | null; taxPreparer: string | null;
}

interface Employee {
  employeeId: string; name: string; title: string; department: string; email: string;
  tasks: Array<{ taskName: string; taskDepartment: string; status: string; dueDate: string; priority: string }>;
}

interface Investor {
  investorId: string; name: string; type: string;
  commitmentMm: number | null; navMm: number | null; status: string;
}

interface TaskSummary { total: number; completed: number; overdue: number; }

/* ─── field display helpers ────────────────────────────────────────── */

function FieldRow({ label, value, format }: { label: string; value: any; format?: 'money' | 'pct' | 'bool' | 'date' }) {
  let display: React.ReactNode = value;
  if (value == null || value === '') display = <span className="text-gray-300">—</span>;
  else if (format === 'money') display = <span className="font-mono">{fmtMoney(value)}</span>;
  else if (format === 'pct') display = <span className="font-mono">{fmtPct(value)}</span>;
  else if (format === 'bool') display = value ? 'Yes' : 'No';
  else if (format === 'date') display = value;
  return (
    <div className="flex items-baseline justify-between py-1.5 border-b border-gray-50">
      <span className="text-[11px] text-gray-500 font-medium">{label}</span>
      <span className="text-xs text-gray-900">{display}</span>
    </div>
  );
}

function FieldSection({ title, children, compact = false }: { title: string; children: React.ReactNode; compact?: boolean }) {
  return (
    <div className={`bg-white rounded-lg shadow-sm ${compact ? 'p-2' : 'p-3'} mb-2`}>
      <h3 className={`text-[11px] font-semibold text-gray-500 uppercase tracking-wider ${compact ? 'mb-1.5' : 'mb-2'}`}>{title}</h3>
      <div className="space-y-0">{children}</div>
    </div>
  );
}

function Pills({ json }: { json: string | null }) {
  if (!json) return <span className="text-gray-300">—</span>;
  try {
    const arr: string[] = JSON.parse(json);
    return (
      <div className="flex flex-wrap gap-1 justify-end">
        {arr.map((v) => (
          <span key={v} className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-[10px]">{v}</span>
        ))}
      </div>
    );
  } catch { return <span className="text-xs text-gray-900">{json}</span>; }
}

function PillRow({ label, json }: { label: string; json: string | null }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-gray-50">
      <span className="text-[11px] text-gray-500 font-medium">{label}</span>
      <Pills json={json} />
    </div>
  );
}

function withOther(val: string | null | undefined, other: string | null | undefined): string | null {
  if (!val) return null;
  return val === 'Other' && other ? other : val;
}

function maskEin(v: string | null | undefined): string | null {
  if (!v) return null;
  return '***-**-' + v.slice(-4);
}

const priorityBadge = (p: string) => {
  const cls = p === 'Critical' || p === 'High' ? 'bg-red-100 text-red-700' : p === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600';
  return <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${cls}`}>{p}</span>;
};

/* ─── tab definitions ──────────────────────────────────────────────── */

const TABS = [
  { key: 'general', label: 'General' },
  { key: 'fund-accounting', label: 'Fund Accounting' },
  { key: 'investor-services', label: 'Investor Services' },
  { key: 'finance', label: 'Finance' },
  { key: 'treasury', label: 'Treasury' },
  { key: 'economics', label: 'Economics' },
  { key: 'configurations', label: 'Configurations' },
  { key: 'slus', label: 'SLUs' },
] as const;

type TabKey = typeof TABS[number]['key'];

/* ─── main page ────────────────────────────────────────────────────── */

export default function EntityDetailPage() {
  const params = useParams();
  const entityId = params.entityId as string;

  const [entity, setEntity] = useState<EntityDetail | null>(null);
  const [domainData, setDomainData] = useState<Record<string, any>>({});
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [taskSummary, setTaskSummary] = useState<TaskSummary>({ total: 0, completed: 0, overdue: 0 });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>('general');

  useEffect(() => {
    fetch(`/api/entities/${entityId}`)
      .then((r) => r.json())
      .then((res) => {
        setEntity(res.entity);
        setDomainData({
          credit: res.creditDomain,
          re: res.reDomain,
          oef: res.oefDomain,
          vc: res.vcDomain,
          pe: res.peDomain,
          fof: res.fofDomain,
          gpCarry: res.gpCarryDomain,
          manCo: res.manCoDomain,
          other: res.otherDomain,
        });
        setEmployees(res.employees ?? []);
        setInvestors(res.investors ?? []);
        setTaskSummary(res.taskSummary ?? { total: 0, completed: 0, overdue: 0 });
      })
      .finally(() => setLoading(false));
  }, [entityId]);

  if (loading) return <div className="text-center py-12 text-gray-400">Loading entity...</div>;
  if (!entity) return <div className="text-center py-12 text-gray-400">Entity not found</div>;

  const e = entity;

  return (
    <div>
      <PageHeader
        title={e.name}
        subtitle={`${e.entityType} · ${e.assetClass || e.strategy} · ${e.clientName}`}
        breadcrumbs={[
          { label: 'Data Vault', href: '/data-vault' },
          { label: 'Entities', href: '/data-vault/entities' },
          { label: e.name },
        ]}
        actions={
          <Link
            href="/data-vault/entities"
            className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-[#00C97B] transition-colors"
          >
            <ArrowLeft className="w-3 h-3" /> Back to Entities
          </Link>
        }
      />

      {/* status bar */}
      <div className="flex items-center justify-between mb-2 flex-wrap">
        <div className="flex items-center gap-3">
          <StatusBadge status={e.lifecycleStatus} size="sm" />
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {e.domicile}</span>
            <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {e.investorCount} investors</span>
            <span className="flex items-center gap-1"><ClipboardCheck className="w-3 h-3" /> {taskSummary.total} tasks ({taskSummary.completed} done)</span>
            {taskSummary.overdue > 0 && (
              <span className="flex items-center gap-1 text-red-500"><AlertTriangle className="w-3 h-3" /> {taskSummary.overdue} overdue</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="text-center">
            <div className="font-bold text-gray-900">{fmtMoney(e.navMm || 0)}</div>
            <div className="text-gray-400">NAV</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-gray-900">{e.investorCount}</div>
            <div className="text-gray-400">Investors</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-gray-900">{taskSummary.total}</div>
            <div className="text-gray-400">Tasks</div>
          </div>
        </div>
      </div>

      {/* tab bar */}
      <div className="border-b border-gray-200 mb-2">
        <nav className="flex gap-0 -mb-px overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                tab === t.key
                  ? 'border-[#00C97B] text-[#00C97B]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* tab content */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-2 items-start">
        {/* main content — 3/4 */}
        <div className="xl:col-span-3">

          {/* ═══ GENERAL TAB ═══ */}
          {tab === 'general' && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                <FieldSection title="Entity Overview" compact>
                  <FieldRow label="Entity ID" value={e.entityId} />
                  <FieldRow label="Name" value={e.name} />
                  <FieldRow label="Short Name" value={e.shortName} />
                  <FieldRow label="Type" value={withOther(e.entityType, e.entityTypeOther)} />
                  <FieldRow label="Structure" value={e.structureType} />
                  <FieldRow label="Client / GP" value={e.clientName} />
                  <FieldRow label="Strategy" value={e.strategy} />
                  <FieldRow label="Status" value={e.lifecycleStatus} />
                </FieldSection>
                <FieldSection title="Location & Setup" compact>
                  <FieldRow label="Domicile Country" value={withOther(e.domicileCountry, e.domicileCountryOther) || e.domicile} />
                  <FieldRow label="Domicile State" value={e.domicileState} />
                  <FieldRow label="Currency" value={e.currency} />
                  <FieldRow label="Open-Ended" value={e.openEnded} format="bool" />
                  <FieldRow label="Vintage" value={e.vintage} />
                  <FieldRow label="Inception Date" value={e.inceptionDate} format="date" />
                  <FieldRow label="HQ City" value={e.hqCity} />
                  <FieldRow label="Region" value={e.region} />
                  <FieldRow label="Registered Address" value={e.registeredAddress} />
                </FieldSection>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                <FieldSection title="Entity Profile" compact>
                  <FieldRow label="Asset Class" value={e.assetClass} />
                  <FieldRow label="Entity Role" value={withOther(e.entityRole, e.entityRoleOther)} />
                  <FieldRow label="Fund Structure" value={withOther(e.fundStructure, e.fundStructureOther)} />
                  <FieldRow label="Regulatory Classification" value={withOther(e.regulatoryClassification, e.regulatoryClassificationOther)} />
                  <FieldRow label="EIN / Tax ID" value={maskEin(e.einTaxId)} />
                  <FieldRow label="Investment Strategy" value={withOther(e.investmentStrategyDetail, e.investmentStrategyDetailOther)} />
                  <FieldRow label="Levered Fund" value={e.leveredFund} format="bool" />
                  <FieldRow label="Uses Subscription Facility" value={e.usesSubFacility} format="bool" />
                </FieldSection>
                <FieldSection title="Geography & Focus" compact>
                  <PillRow label="Geography Focus" json={e.geographyFocus} />
                  <PillRow label="Sector Focus" json={e.sectorFocus} />
                </FieldSection>
              </div>
              <FieldSection title="Fundraising & Targets" compact>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="text-sm font-bold text-gray-900">{e.targetCommittedCapital ? fmtMoney(e.targetCommittedCapital) : '—'}</div>
                    <div className="text-[10px] text-gray-500">Target Capital</div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="text-sm font-bold text-gray-900">{e.targetInvestmentCount ?? '—'}</div>
                    <div className="text-[10px] text-gray-500">Target Investments</div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="text-sm font-bold text-gray-900">{e.targetInvestorCount ?? '—'}</div>
                    <div className="text-[10px] text-gray-500">Target Investors</div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="text-sm font-bold text-gray-900">{e.targetLeveragePct != null ? `${e.targetLeveragePct}%` : '—'}</div>
                    <div className="text-[10px] text-gray-500">Target Leverage</div>
                  </div>
                </div>
                <div className="mt-2">
                  <FieldRow label="First Close" value={e.fundraisingFirstClose} format="date" />
                  <FieldRow label="Final Close" value={e.fundraisingFinalClose} format="date" />
                </div>
              </FieldSection>
              <FieldSection title="Key Metrics" compact>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {[
                    { v: e.navMm, l: 'NAV ($MM)' }, { v: e.commitmentMm, l: 'Commitment' },
                    { v: e.calledCapitalMm, l: 'Called Capital' }, { v: e.distributedCapitalMm, l: 'Distributed' },
                    { v: e.unfundedMm, l: 'Unfunded' },
                  ].map(({ v, l }) => (
                    <div key={l} className="text-center p-2 bg-gray-50 rounded">
                      <div className="text-sm font-bold text-gray-900">{fmtMoney(v || 0)}</div>
                      <div className="text-[10px] text-gray-500">{l}</div>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  <div className="text-center p-2 bg-blue-50 rounded">
                    <div className="text-sm font-bold text-blue-900">{e.grossIrrPct ? `${e.grossIrrPct.toFixed(1)}%` : '—'}</div>
                    <div className="text-[10px] text-blue-600">Gross IRR</div>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded">
                    <div className="text-sm font-bold text-green-900">{e.netIrrPct ? `${e.netIrrPct.toFixed(1)}%` : '—'}</div>
                    <div className="text-[10px] text-green-600">Net IRR</div>
                  </div>
                  <div className="text-center p-2 bg-purple-50 rounded">
                    <div className="text-sm font-bold text-purple-900">{e.moic ? `${e.moic.toFixed(2)}x` : '—'}</div>
                    <div className="text-[10px] text-purple-600">MOIC</div>
                  </div>
                </div>
              </FieldSection>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                <FieldSection title="Scope & Modules" compact>
                  <FieldRow label="Fund Accounting" value={e.scopeFundAccounting} format="bool" />
                  <FieldRow label="Investor Services" value={e.scopeInvestorServices} format="bool" />
                  <FieldRow label="Tax Services" value={withOther(e.scopeTaxServices, e.scopeTaxServicesOther)} />
                  <FieldRow label="Treasury" value={e.scopeTreasury} format="bool" />
                  <FieldRow label="Loan Admin" value={e.scopeLoanAdmin} format="bool" />
                  <FieldRow label="MgmtCo Accounting" value={e.scopeMgmtCoAccounting} format="bool" />
                  <FieldRow label="Regulatory Reporting" value={e.scopeRegulatoryReporting} format="bool" />
                  <FieldRow label="AML/KYC" value={e.scopeAmlKyc} />
                  <FieldRow label="FATCA/CRS" value={e.scopeFatcaCrs} format="bool" />
                </FieldSection>
                <FieldSection title="Data Quality">
                  <FieldRow label="Data Quality Score" value={e.dataQualityScore != null ? `${Math.round(e.dataQualityScore)}%` : null} />
                  <FieldRow label="Confidence Score" value={e.confidenceScore != null ? `${Math.round(e.confidenceScore * 100)}%` : null} />
                </FieldSection>
              </div>
            </>
          )}

          {/* ═══ FUND ACCOUNTING TAB ═══ */}
          {tab === 'fund-accounting' && (
            <>
              <FieldSection title="Net Asset Value" compact>
                <FieldRow label="Current NAV ($MM)" value={e.navMm} format="money" />
                <FieldRow label="NAV Frequency" value={e.navFrequency} />
                <FieldRow label="Accounting System" value={e.accountingSystem} />
              </FieldSection>
              <FieldSection title="Capital Activity" compact>
                <FieldRow label="Commitment ($MM)" value={e.commitmentMm} format="money" />
                <FieldRow label="Called Capital ($MM)" value={e.calledCapitalMm} format="money" />
                <FieldRow label="Distributed ($MM)" value={e.distributedCapitalMm} format="money" />
                <FieldRow label="Unfunded ($MM)" value={e.unfundedMm} format="money" />
              </FieldSection>
              <FieldSection title="Performance" compact>
                <FieldRow label="Gross IRR" value={e.grossIrrPct} format="pct" />
                <FieldRow label="Net IRR" value={e.netIrrPct} format="pct" />
                <FieldRow label="MOIC" value={e.moic != null ? `${e.moic}x` : null} />
                <FieldRow label="TVPI" value={e.tvpi != null ? `${e.tvpi}x` : null} />
                <FieldRow label="DPI" value={e.dpi != null ? `${e.dpi}x` : null} />
              </FieldSection>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                <FieldSection title="Operations" compact>
                  <FieldRow label="Books Complexity" value={e.booksComplexityTier} />
                  <FieldRow label="GL System" value={withOther(e.generalLedgerSystem, e.generalLedgerSystemOther)} />
                  <FieldRow label="Chart of Accounts" value={withOther(e.chartOfAccountsTemplate, e.chartOfAccountsOther)} />
                  <FieldRow label="Close Process" value={e.closeProcessModel} />
                  <FieldRow label="Bank Feed" value={e.bankFeedEnabled} format="bool" />
                  <FieldRow label="Portfolio Data Feed" value={e.portfolioDataFeedEnabled} format="bool" />
                  <FieldRow label="Doc Mgmt System" value={withOther(e.docMgmtSystem, e.docMgmtSystemOther)} />
                  <FieldRow label="Recon Tool" value={withOther(e.reconciliationTool, e.reconciliationToolOther)} />
                  <FieldRow label="Multi-Close Rebalancing" value={e.multiCloseRebalancing} />
                  <FieldRow label="Side Letter Complexity" value={e.sideLetterComplexity} />
                  <FieldRow label="Special Allocations" value={e.specialAllocationFrequency} />
                  <FieldRow label="Waterfall Automation" value={e.waterfallCalcAutomation} />
                  <FieldRow label="Annual Capital Events" value={e.annualCapitalEventsExpected} />
                </FieldSection>
                <FieldSection title="Onboarding" compact>
                  <FieldRow label="Conversion Type" value={e.conversionType} />
                  <FieldRow label="Conversion Start" value={e.conversionStartDate} format="date" />
                  <FieldRow label="Document Scope" value={e.documentConversionScope} />
                  <FieldRow label="Onboarding Owner" value={e.onboardingOwner} />
                  <PillRow label="Source Systems" json={e.sourceSystemsPriorAdmin} />
                </FieldSection>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                <FieldSection title="Reporting" compact>
                  <FieldRow label="Accounting Framework" value={withOther(e.accountingFramework, e.accountingFrameworkOther)} />
                  <FieldRow label="Financial Stmt Freq" value={e.financialStatementsFrequency} />
                  <FieldRow label="Footnote Disclosures" value={e.footnoteDisclosureLevel} />
                  <FieldRow label="Investor Stmt Freq" value={e.investorStatementsFrequency} />
                  <FieldRow label="Q/E Package (days)" value={e.reportingPackageTimingQeDays} />
                  <FieldRow label="Y/E Package (days)" value={e.reportingPackageTimingYeDays} />
                  <FieldRow label="Valuation SLA (days)" value={e.valuationDeliverySla} />
                </FieldSection>
                <FieldSection title="Waterfall & Allocations" compact>
                  <FieldRow label="Unit of Account" value={e.unitOfAccount} />
                  <FieldRow label="Pref Return Compounding" value={e.prefReturnCompounding} />
                  <FieldRow label="Pref Return Day Count" value={e.prefReturnDayCount} />
                  <FieldRow label="Escrow/Holdback" value={e.escrowHoldbackApplies} format="bool" />
                  <FieldRow label="Escrow %" value={e.escrowHoldbackPct} format="pct" />
                  <FieldRow label="Mgmt Fee Offset %" value={e.mgmtFeeOffsetPct} format="pct" />
                  <FieldRow label="Tax Distribution" value={withOther(e.taxDistributionPolicy, e.taxDistributionPolicyOther)} />
                </FieldSection>
              </div>

              {/* Domain-specific sections */}
              {domainData.credit && (
                <FieldSection title="Credit Domain" compact>
                  <PillRow label="Loan Type Mix" json={domainData.credit.loanTypeMix} />
                  <PillRow label="Collateral Type Mix" json={domainData.credit.collateralTypeMix} />
                  <FieldRow label="Facility Complexity" value={domainData.credit.facilityComplexityTier} />
                  <FieldRow label="Covenant Monitoring" value={domainData.credit.covenantMonitoringRequired} format="bool" />
                  <FieldRow label="Covenant Frequency" value={domainData.credit.covenantFrequency} />
                  <FieldRow label="Index Type" value={withOther(domainData.credit.indexType, domainData.credit.indexTypeOther)} />
                  <FieldRow label="Interest Day Calc" value={withOther(domainData.credit.interestDayCalcMethod, domainData.credit.interestDayCalcOther)} />
                  <FieldRow label="Payment Frequency" value={withOther(domainData.credit.paymentFrequency, domainData.credit.paymentFrequencyOther)} />
                  <FieldRow label="PIK Interest" value={domainData.credit.pikInterestPresence} format="bool" />
                  <FieldRow label="Delayed Draw" value={domainData.credit.delayedDrawPresence} format="bool" />
                  <FieldRow label="Revolver" value={domainData.credit.revolverPresence} format="bool" />
                  <FieldRow label="OID/Upfront Fees" value={domainData.credit.oidUpfrontFeesPresence} format="bool" />
                  <FieldRow label="Prepayment Penalty" value={domainData.credit.prepaymentPenaltyPresence} format="bool" />
                  <FieldRow label="Penalty Type" value={withOther(domainData.credit.prepaymentPenaltyType, domainData.credit.prepaymentPenaltyOther)} />
                  <FieldRow label="Servicing System" value={withOther(domainData.credit.loanServicingSystem, domainData.credit.loanServicingSystemOther)} />
                  <FieldRow label="Workout Activity" value={domainData.credit.workoutRestructuringActivity} />
                </FieldSection>
              )}
              {domainData.re && (
                <FieldSection title="Real Estate Domain" compact>
                  <PillRow label="Property Type Mix" json={domainData.re.propertyTypeMix} />
                  <FieldRow label="Property Count" value={domainData.re.propertyCount} />
                  <FieldRow label="Lifecycle Mix" value={domainData.re.stabilizedVsDevelopment} />
                  <FieldRow label="Geographic Dispersion" value={domainData.re.geographicDispersion} />
                  <FieldRow label="Property Manager" value={domainData.re.propertyManagerModel} />
                  <FieldRow label="Property Debt" value={domainData.re.propertyDebtExists} format="bool" />
                  <FieldRow label="Debt Facilities" value={domainData.re.debtFacilityCount} />
                  <FieldRow label="Lease Count" value={domainData.re.leaseCount} />
                  <FieldRow label="Appraisal Freq" value={domainData.re.appraisalFrequency} />
                  <FieldRow label="CAM Recon" value={domainData.re.camReconciliationsRequired} format="bool" />
                  <FieldRow label="CapEx Budgeting" value={domainData.re.capexBudgetingRequired} format="bool" />
                  <FieldRow label="Construction Draws" value={domainData.re.constructionDrawsPresence} format="bool" />
                  <FieldRow label="ESG Reporting" value={domainData.re.energyEsgReportingRequired} format="bool" />
                  <FieldRow label="NOI Tracking" value={domainData.re.noiTrackingRequired} format="bool" />
                  <FieldRow label="Occupancy Reporting" value={domainData.re.occupancyReportingRequired} format="bool" />
                  <FieldRow label="Lease Abstracting" value={domainData.re.leaseAbstractingRequired} format="bool" />
                  <FieldRow label="Rent Roll Freq" value={domainData.re.rentRollDeliveryFrequency} />
                  <FieldRow label="JV Accounting" value={domainData.re.reJointVentureAccounting} format="bool" />
                  <FieldRow label="Waterfall at Property" value={domainData.re.waterfallAtPropertyLevel} format="bool" />
                  <FieldRow label="Tenant Concentration" value={domainData.re.tenantConcentrationRisk} />
                  <PillRow label="Valuation Methods" json={domainData.re.valuationMethodMix} />
                </FieldSection>
              )}
              {domainData.oef && (
                <FieldSection title="Open-End Fund Domain" compact>
                  <FieldRow label="Unitized Fund" value={domainData.oef.unitizedFund} format="bool" />
                  <FieldRow label="Share Classes" value={domainData.oef.numberOfShareClasses} />
                  <FieldRow label="Class Names" value={domainData.oef.shareClassNames} />
                  <FieldRow label="Subscription Window" value={domainData.oef.subscriptionWindow} />
                  <FieldRow label="Redemption Window" value={domainData.oef.redemptionWindow} />
                  <FieldRow label="Lock-up (months)" value={domainData.oef.lockupPeriodMonths} />
                  <FieldRow label="Gate Applies" value={domainData.oef.gateApplies} format="bool" />
                  <FieldRow label="Gate %" value={domainData.oef.gatePct} format="pct" />
                  <FieldRow label="DRIP Offered" value={domainData.oef.dripOffered} format="bool" />
                  <FieldRow label="Strategy Type" value={domainData.oef.strategyType} />
                  <FieldRow label="Prime Brokers" value={domainData.oef.primeBrokerCount} />
                  <FieldRow label="Counterparties" value={domainData.oef.counterpartyCount} />
                  <FieldRow label="OTC Exposure" value={domainData.oef.otcExposurePresence} format="bool" />
                  <FieldRow label="Daily NAV Required" value={domainData.oef.dailyNavRequired} format="bool" />
                  <FieldRow label="Liquidity Terms" value={domainData.oef.investorLiquidityTerms} />
                  <FieldRow label="Side Pockets" value={domainData.oef.sidePocketUsage} format="bool" />
                  <FieldRow label="HWM Tracking" value={domainData.oef.highWaterMarkTrackingRequired} format="bool" />
                  <FieldRow label="Incentive Fee Freq" value={domainData.oef.incentiveFeeFrequency} />
                  <FieldRow label="Equalization Method" value={domainData.oef.equalizationMethod} />
                  <FieldRow label="Crystallization" value={domainData.oef.crystallizationTiming} />
                  <FieldRow label="Loss Carryforward" value={domainData.oef.lossCarryforwardTrackingRequired} format="bool" />
                </FieldSection>
              )}
              {domainData.vc && (
                <FieldSection title="Venture Capital Domain" compact>
                  <PillRow label="Stage Focus" json={domainData.vc.stageFocusMix} />
                  <FieldRow label="SAFE/Convertible Notes" value={domainData.vc.safeConvertibleNotePresence} format="bool" />
                  <FieldRow label="Bridge Financing" value={domainData.vc.bridgeFinancingFrequency} />
                  <FieldRow label="Warrant/Token Exposure" value={domainData.vc.warrantOrTokenExposure} />
                  <FieldRow label="Option Pool Tracking" value={domainData.vc.optionPoolTrackingRequired} format="bool" />
                  <FieldRow label="Liquidation Pref" value={domainData.vc.liquidationPreferenceStructures} />
                  <FieldRow label="Pay-to-Play" value={domainData.vc.payToPlayClausesPresent} format="bool" />
                </FieldSection>
              )}
              {domainData.pe && (
                <FieldSection title="Private Equity Domain" compact>
                  <FieldRow label="Avg Add-Ons/Platform" value={domainData.pe.averageAddOnCountPerPlatform} />
                  <FieldRow label="Co-Invest Allocation" value={domainData.pe.coInvestAllocationFrequency} />
                  <FieldRow label="Portfolio Leverage" value={domainData.pe.portfolioLevelLeveragePresence} format="bool" />
                  <FieldRow label="PIK Toggle Debt" value={domainData.pe.pikToggleDebtPresence} format="bool" />
                </FieldSection>
              )}
              {domainData.fof && (
                <FieldSection title="Fund of Funds Domain" compact>
                  <FieldRow label="Underlying Fund Count" value={domainData.fof.underlyingFundCount} />
                  <FieldRow label="Look-Through Required" value={domainData.fof.lookThroughRequired} format="bool" />
                  <FieldRow label="Carry Transparency" value={domainData.fof.underlyingCarryTransparency} />
                </FieldSection>
              )}
              {domainData.gpCarry && (
                <FieldSection title="GP & Carried Interest" compact>
                  <FieldRow label="GP Members" value={domainData.gpCarry.gpMemberCount} />
                  <FieldRow label="Allocation Variability" value={domainData.gpCarry.allocationVariability} />
                  <FieldRow label="Clawback Allocation" value={domainData.gpCarry.clawbackAllocationMethod} />
                  <FieldRow label="Cashless Contributions" value={domainData.gpCarry.cashlessContributionsPresence} format="bool" />
                  <FieldRow label="Deferred Comp Linked" value={domainData.gpCarry.deferredCompensationLinked} format="bool" />
                  <FieldRow label="Vesting Complexity" value={domainData.gpCarry.vestingScheduleComplexity} />
                </FieldSection>
              )}
              {domainData.manCo && (
                <FieldSection title="Management Company Domain" compact>
                  <FieldRow label="Monitoring Fees" value={domainData.manCo.revenueStreamsMonitoringFees} format="bool" />
                  <FieldRow label="Transaction Fees" value={domainData.manCo.revenueStreamsTransactionFees} format="bool" />
                  <FieldRow label="Consulting Fees" value={domainData.manCo.revenueStreamsConsultingFees} format="bool" />
                  <FieldRow label="Other Revenue" value={domainData.manCo.revenueStreamsOther} />
                  <FieldRow label="Fee Offset to Fund" value={domainData.manCo.feeOffsetPctToFund} format="pct" />
                  <FieldRow label="Cost Sharing w/ GP" value={domainData.manCo.costSharingWithGp} format="bool" />
                  <FieldRow label="Expense Allocation" value={domainData.manCo.sharedExpenseAllocationMethod} />
                  <FieldRow label="Intercompany Billing" value={domainData.manCo.intercompanyBillingFrequency} />
                  <PillRow label="Payroll Jurisdictions" json={domainData.manCo.payrollJurisdictions} />
                </FieldSection>
              )}
              {domainData.other && (
                <FieldSection title="Operational Metrics" compact>
                  <FieldRow label="Historical Error Rate" value={domainData.other.historicalErrorRatePct} format="pct" />
                  <FieldRow label="Avg Investor Queries/Mo" value={domainData.other.avgInvestorQueryVolumeMonth} />
                  <FieldRow label="Custom Reporting" value={domainData.other.customReportingRequests} />
                  <FieldRow label="Board Reporting" value={domainData.other.boardReportingRequired} format="bool" />
                  <FieldRow label="ESG Reporting" value={domainData.other.esgReportingRequired} format="bool" />
                  <FieldRow label="ILPA Template" value={domainData.other.ilpaTemplateRequired} format="bool" />
                  <FieldRow label="Investor Concentration" value={domainData.other.investorConcentrationPct} format="pct" />
                  <FieldRow label="Top 3 LP Concentration" value={domainData.other.top3LpConcentrationPct} format="pct" />
                  <FieldRow label="Strategic Account" value={domainData.other.strategicAccountFlag} format="bool" />
                </FieldSection>
              )}
            </>
          )}

          {/* ═══ INVESTOR SERVICES TAB ═══ */}
          {tab === 'investor-services' && (
            <>
              <FieldSection title={`Investors (${investors.length})`} compact>
                {investors.length === 0 ? (
                  <div className="text-xs text-gray-400 py-2 text-center">No investors linked to this entity</div>
                ) : (
                  <div className="space-y-0">
                    {investors.map((inv) => (
                      <div key={inv.investorId} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold text-gray-900 truncate">{inv.name}</div>
                          <div className="text-[10px] text-gray-400 truncate">{inv.type} · {inv.investorId}</div>
                        </div>
                        <div className="text-right ml-2">
                          <div className="text-xs font-mono">{inv.commitmentMm != null ? fmtMoney(inv.commitmentMm) : '—'}</div>
                          <div className="text-[10px] text-gray-400">committed</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </FieldSection>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                <FieldSection title="Compliance Operations" compact>
                  <FieldRow label="AML Program Required" value={e.amlProgramRequired} format="bool" />
                  <FieldRow label="FATCA Required" value={e.fatcaRequired} format="bool" />
                  <FieldRow label="CRS Required" value={e.crsRequired} format="bool" />
                  <FieldRow label="KYC Standard" value={withOther(e.kycStandard, e.kycStandardOther)} />
                  <FieldRow label="Benefit Plan Tracking" value={e.benefitPlanInvestorTracking} format="bool" />
                  <FieldRow label="Restricted Persons" value={e.restrictedPersonsTracking} format="bool" />
                  <FieldRow label="1099 Support" value={e.support1099Level} />
                </FieldSection>
                <FieldSection title="Treasury Operations" compact>
                  <FieldRow label="Bank Accounts" value={e.bankAccountCount} />
                  <FieldRow label="Bank Connectivity" value={withOther(e.bankConnectivityMethod, e.bankConnectivityOther)} />
                  <FieldRow label="Multi-Currency" value={e.multiCurrency} format="bool" />
                  <FieldRow label="Payment Approvals" value={e.paymentApprovalLevels} />
                  <FieldRow label="Primary Currency" value={withOther(e.primaryCurrency, e.primaryCurrencyOther)} />
                  <FieldRow label="Positive Pay" value={e.positivePayEnabled} format="bool" />
                </FieldSection>
              </div>
              <FieldSection title="Investor Operations" compact>
                <FieldRow label="Investor Portal" value={e.investorPortalEnabled} format="bool" />
                <FieldRow label="Redemption Model" value={e.redemptionProcessingModel} />
                <FieldRow label="Side Letter Automation" value={e.sideLetterWorkflowAutomation} />
              </FieldSection>
            </>
          )}

          {/* ═══ FINANCE TAB ═══ */}
          {tab === 'finance' && (
            <>
              <FieldSection title="Revenue & Cost" compact>
                <FieldRow label="Revenue L12M ($MM)" value={e.revenueL12m} format="money" />
                <FieldRow label="Cost L12M ($MM)" value={e.costL12m} format="money" />
                <FieldRow label="Margin %" value={e.marginPct} format="pct" />
              </FieldSection>
              <FieldSection title="Performance Metrics" compact>
                <FieldRow label="Gross IRR" value={e.grossIrrPct} format="pct" />
                <FieldRow label="Net IRR" value={e.netIrrPct} format="pct" />
                <FieldRow label="MOIC" value={e.moic != null ? `${e.moic}x` : null} />
                <FieldRow label="TVPI" value={e.tvpi != null ? `${e.tvpi}x` : null} />
                <FieldRow label="DPI" value={e.dpi != null ? `${e.dpi}x` : null} />
              </FieldSection>
            </>
          )}

          {/* ═══ TREASURY TAB ═══ */}
          {tab === 'treasury' && (
            <FieldSection title="Treasury" compact>
              <FieldRow label="Currency" value={e.currency} />
              <FieldRow label="Unfunded ($MM)" value={e.unfundedMm} format="money" />
              <FieldRow label="Called Capital ($MM)" value={e.calledCapitalMm} format="money" />
              <FieldRow label="Distributed ($MM)" value={e.distributedCapitalMm} format="money" />
              <div className="pt-2 text-[10px] text-gray-400 italic">Cash flow and bank account details are managed in the Treasury module.</div>
            </FieldSection>
          )}

          {/* ═══ ECONOMICS TAB (formerly Billing) ═══ */}
          {tab === 'economics' && (
            <>
              <FieldSection title="Management Fee Details" compact>
                <FieldRow label="Mgmt Fee Rate" value={e.mgmtFeePct} format="pct" />
                <FieldRow label="Fee Basis" value={withOther(e.mgmtFeeBasis, e.mgmtFeeBasisOther)} />
                <FieldRow label="Fee Frequency" value={e.mgmtFeeFrequency} />
                <FieldRow label="Waiver/Offset" value={withOther(e.mgmtFeeWaiverOffset, e.mgmtFeeWaiverOffsetOther)} />
                <FieldRow label="Mgmt Fee Offset %" value={e.mgmtFeeOffsetPct} format="pct" />
                <FieldRow label="Fee Stepdown" value={e.feeStepdownExists} format="bool" />
              </FieldSection>
              <FieldSection title="Carry Structure" compact>
                <FieldRow label="Carry %" value={e.carryPct} format="pct" />
                <FieldRow label="Carry Structure" value={e.carryStructure} />
                <FieldRow label="Catch-Up Type" value={e.catchUpType} />
                <FieldRow label="Hurdle Type" value={e.hurdleType} />
                <FieldRow label="Clawback Applies" value={e.clawbackApplies} format="bool" />
                <FieldRow label="Clawback Frequency" value={e.clawbackTrueUpFrequency} />
                <FieldRow label="Escrow/Holdback" value={e.escrowHoldbackApplies} format="bool" />
                <FieldRow label="Escrow %" value={e.escrowHoldbackPct} format="pct" />
              </FieldSection>
              <FieldSection title="Return & Allocation" compact>
                <FieldRow label="Preferred Return" value={e.prefRatePct} format="pct" />
                <FieldRow label="Compounding" value={e.prefReturnCompounding} />
                <FieldRow label="Day Count" value={e.prefReturnDayCount} />
                <FieldRow label="Tax Distribution" value={withOther(e.taxDistributionPolicy, e.taxDistributionPolicyOther)} />
                <FieldRow label="Unit of Account" value={e.unitOfAccount} />
                <FieldRow label="Waterfall Type" value={e.waterfallType} />
              </FieldSection>
            </>
          )}

          {/* ═══ CONFIGURATIONS TAB ═══ */}
          {tab === 'configurations' && (
            <>
              <FieldSection title="Service Providers & Configuration" compact>
                <FieldRow label="Administrator" value={e.administrator} />
                <FieldRow label="Auditor" value={e.auditor} />
                <FieldRow label="Legal Counsel" value={e.legalCounsel} />
                <FieldRow label="Custodian / PB" value={e.custodianPrimeBroker} />
                <FieldRow label="Tax Preparer" value={e.taxPreparer} />
                <FieldRow label="Reporting Frequency" value={e.reportingFrequency} />
                <FieldRow label="NAV Frequency" value={e.navFrequency} />
                <FieldRow label="Accounting System" value={e.accountingSystem} />
                <FieldRow label="Open-Ended" value={e.openEnded} format="bool" />
              </FieldSection>
              <FieldSection title="Relationships" compact>
                <FieldRow label="Fund Complex" value={e.fundComplexName} />
                <FieldRow label="Sponsor / GP Org" value={e.sponsorGpOrg} />
                <FieldRow label="Management Company" value={e.managementCompanyRef} />
              </FieldSection>
              <FieldSection title="Governance" compact>
                <FieldRow label="Audit Trail Enabled" value={e.auditTrailEnabled} format="bool" />
                <FieldRow label="Data Classification" value={e.dataClassificationLevel} />
                <FieldRow label="Entity Data Steward" value={e.entityDataSteward} />
              </FieldSection>
            </>
          )}

          {/* ═══ SLUs TAB ═══ */}
          {tab === 'slus' && (
            <FieldSection title="Service Level Units (SLUs)" compact>
              <div className="text-xs text-gray-500 py-1">
                SLU tracking for this entity based on contracted scope, task complexity, and volume.
              </div>
              <FieldRow label="Investors Managed" value={e.investorCount} />
              <FieldRow label="Reporting Frequency" value={e.reportingFrequency} />
              <FieldRow label="NAV Frequency" value={e.navFrequency} />
              <FieldRow label="Structure" value={e.structureType} />
              <FieldRow label="Books Complexity" value={e.booksComplexityTier} />
              <FieldRow label="Asset Class" value={e.assetClass} />
              <FieldRow label="Strategy Complexity" value={e.strategy} />
              <FieldRow label="Open-Ended" value={e.openEnded} format="bool" />
              <div className="pt-2 text-[10px] text-gray-400 italic">Detailed SLU calculations are driven by the Rules Engine.</div>
            </FieldSection>
          )}
        </div>

        {/* right sidebar — employees + task summary */}
        <div className="space-y-2">
          <div className="bg-white rounded-lg shadow-sm p-2">
            <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <ClipboardCheck className="w-3 h-3" /> Task Summary
            </h3>
            <div className="grid grid-cols-3 gap-1 text-center">
              <div className="p-1.5 bg-gray-50 rounded">
                <div className="text-sm font-bold text-gray-900">{taskSummary.total}</div>
                <div className="text-[9px] text-gray-400">Total</div>
              </div>
              <div className="p-1.5 bg-emerald-50 rounded">
                <div className="text-sm font-bold text-emerald-600">{taskSummary.completed}</div>
                <div className="text-[9px] text-gray-400">Done</div>
              </div>
              <div className={`p-1.5 rounded ${taskSummary.overdue > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
                <div className={`text-sm font-bold ${taskSummary.overdue > 0 ? 'text-red-500' : 'text-gray-900'}`}>{taskSummary.overdue}</div>
                <div className="text-[9px] text-gray-400">Overdue</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-2">
            <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Users className="w-3 h-3" /> Assigned Employees ({employees.length})
            </h3>
            {employees.length === 0 ? (
              <div className="text-xs text-gray-400 py-2 text-center">No employees assigned</div>
            ) : (
              <div className="space-y-2">
                {employees.map((emp) => (
                  <div key={emp.employeeId} className="border border-gray-100 rounded p-1.5">
                    <div className="flex items-start justify-between mb-1">
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-gray-900 truncate">{emp.name}</div>
                        <div className="text-[9px] text-gray-500 truncate">{emp.title}</div>
                        <div className="text-[9px] text-gray-400 truncate">{emp.department}</div>
                      </div>
                      <span className="text-[9px] font-mono text-gray-400 ml-1">{emp.employeeId.slice(-4)}</span>
                    </div>
                    {emp.tasks.length > 0 && (
                      <div className="border-t border-gray-50 pt-1 mt-1 space-y-0.5">
                        <div className="text-[9px] font-semibold text-gray-400 uppercase">Tasks ({emp.tasks.length})</div>
                        {emp.tasks.slice(0, 2).map((t, i) => (
                          <div key={i} className="flex items-center justify-between text-[10px]">
                            <div className="flex items-center gap-1 min-w-0 flex-1">
                              {priorityBadge(t.priority)}
                              <span className="text-gray-700 truncate text-[9px]">{t.taskName}</span>
                            </div>
                            <StatusBadge status={t.status} size="sm" />
                          </div>
                        ))}
                        {emp.tasks.length > 2 && (
                          <div className="text-[9px] text-gray-400">+{emp.tasks.length - 2} more</div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
