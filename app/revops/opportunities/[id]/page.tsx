'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Phone, Mail, Users, Monitor, FileText, Plus } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import MetricCard from '@/components/MetricCard';
import StatusBadge from '@/components/StatusBadge';
import { fmtMoney } from '@/lib/utils';

interface QuoteLine {
  id: string;
  service: string;
  aumTierLabel: string | null;
  pricePerEntity: number | null;
  estimatedEntities: number | null;
  annualValue: number | null;
  description: string | null;
}

interface OppDetail {
  id: string;
  opportunityId: string;
  name: string;
  accountId: string | null;
  accountName: string;
  stage: string;
  probability: number;
  closeDate: string | null;
  amount: number | null;
  tcv: number | null;
  currency: string;
  ownerName: string | null;
  description: string | null;
  lostReason: string | null;
  nextStepDate: string | null;
  nextStepNote: string | null;
  leadSource: string | null;
  entityCount: number | null;
  aumMm: number | null;
  fundStrategies: string | null;
  scopeNotes: string | null;
  dealType: string | null;
  clientId: string | null;
  clientName: string | null;
  contacts: Array<{
    id: string;
    role: string;
    contact: {
      id: string;
      firstName: string;
      lastName: string;
      title: string | null;
      email: string | null;
      contactType: string;
    };
  }>;
  activities: Array<{
    id: string;
    activityId: string;
    type: string;
    subject: string;
    description: string | null;
    outcome: string | null;
    activityDate: string;
    ownerName: string | null;
    durationMinutes: number | null;
  }>;
  quotes: Array<{
    id: string;
    quoteId: string;
    name: string;
    status: string;
    totalArr: number | null;
    totalTcv: number | null;
    validUntil: string | null;
    lines: QuoteLine[];
  }>;
  contracts: Array<{
    id: string;
    contractId: string;
    name: string;
    status: string;
    annualValue: number | null;
    startDate: string | null;
  }>;
}

interface PriceBookEntry {
  id: string;
  service: string;
  aumTierLabel: string;
  pricePerEntity: number;
}

const STAGES = ['Prospecting', 'Discovery', 'Proposal', 'Negotiation', 'Closed Won'];

const STAGE_PROB: Record<string, number> = {
  Prospecting: 10,
  Discovery: 25,
  Proposal: 50,
  Negotiation: 75,
  'Closed Won': 100,
  'Closed Lost': 0,
};

const STAGE_COLORS: Record<string, string> = {
  Prospecting: 'bg-gray-100 text-gray-600',
  Discovery: 'bg-blue-100 text-blue-700',
  Proposal: 'bg-amber-100 text-amber-700',
  Negotiation: 'bg-purple-100 text-purple-700',
  'Closed Won': 'bg-emerald-100 text-emerald-700',
  'Closed Lost': 'bg-red-100 text-red-700',
};

const SERVICES = [
  'Fund Accounting',
  'Investor Services',
  'Tax Services',
  'Treasury',
  'Loan Admin',
  'Management Co',
  'Regulatory Reporting',
  'Other',
];

function activityIcon(type: string) {
  if (type === 'Call') return <Phone className="w-3.5 h-3.5 text-blue-500" />;
  if (type === 'Email') return <Mail className="w-3.5 h-3.5 text-amber-500" />;
  if (type === 'Meeting') return <Users className="w-3.5 h-3.5 text-purple-500" />;
  if (type === 'Demo') return <Monitor className="w-3.5 h-3.5 text-teal-500" />;
  return <FileText className="w-3.5 h-3.5 text-gray-400" />;
}

function initials(firstName: string, lastName: string): string {
  return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
}

export default function OpportunityDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [opp, setOpp] = useState<OppDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeQuote, setActiveQuote] = useState<OppDetail['quotes'][0] | null>(null);
  const [priceBook, setPriceBook] = useState<PriceBookEntry[]>([]);
  const [addingLine, setAddingLine] = useState(false);
  const [newLine, setNewLine] = useState({
    service: 'Fund Accounting',
    estimatedEntities: 10,
    pricePerEntity: 28000,
    aumTierLabel: '$250M–$1B',
  });
  const [addingActivity, setAddingActivity] = useState(false);
  const [newActivity, setNewActivity] = useState({
    type: 'Call',
    subject: '',
    description: '',
    outcome: '',
  });
  const [stageSaving, setStageSaving] = useState(false);
  const [quoteSaving, setQuoteSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/revops/opportunities/${id}`).then((r) => r.json()),
      fetch('/api/revops/price-book').then((r) => r.json()),
    ]).then(([oppData, pbData]) => {
      setOpp(oppData);
      setActiveQuote(oppData.quotes?.[0] ?? null);
      setPriceBook(pbData.items ?? []);
      setLoading(false);
    });
  }, [id]);

  async function advanceStage(stage: string) {
    setStageSaving(true);
    await fetch(`/api/revops/opportunities/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage, probability: STAGE_PROB[stage] ?? 10 }),
    });
    const refreshed = await fetch(`/api/revops/opportunities/${id}`).then((r) => r.json());
    setOpp(refreshed);
    setActiveQuote(refreshed.quotes?.[0] ?? null);
    setStageSaving(false);
  }

  async function submitActivity() {
    await fetch('/api/revops/activities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newActivity,
        opportunityId: opp!.id,
        opportunityName: opp!.name,
        accountId: opp!.accountId,
        accountName: opp!.accountName,
        ownerName: opp!.ownerName,
        activityDate: new Date().toISOString(),
      }),
    });
    setAddingActivity(false);
    setNewActivity({ type: 'Call', subject: '', description: '', outcome: '' });
    const refreshed = await fetch(`/api/revops/opportunities/${id}`).then((r) => r.json());
    setOpp(refreshed);
  }

  async function createQuote() {
    setQuoteSaving(true);
    await fetch('/api/revops/quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Quote for ${opp!.accountName}`,
        opportunityId: opp!.id,
        opportunityName: opp!.name,
        accountId: opp!.accountId ?? undefined,
        accountName: opp!.accountName,
        createdByName: opp!.ownerName ?? 'System',
      }),
    }).then((r) => r.json());
    const refreshed = await fetch(`/api/revops/opportunities/${id}`).then((r) => r.json());
    setOpp(refreshed);
    setActiveQuote(refreshed.quotes?.[0] ?? null);
    setQuoteSaving(false);
  }

  async function updateQuoteStatus(status: string) {
    await fetch(`/api/revops/quotes/${activeQuote!.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const refreshed = await fetch(`/api/revops/opportunities/${id}`).then((r) => r.json());
    setOpp(refreshed);
    setActiveQuote(refreshed.quotes?.[0] ?? null);
  }

  async function addLine() {
    await fetch(`/api/revops/quotes/${activeQuote!.id}/lines`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newLine,
        annualValue: newLine.pricePerEntity * newLine.estimatedEntities,
      }),
    });
    setAddingLine(false);
    setNewLine({
      service: 'Fund Accounting',
      estimatedEntities: 10,
      pricePerEntity: 28000,
      aumTierLabel: '$250M–$1B',
    });
    const refreshed = await fetch(`/api/revops/opportunities/${id}`).then((r) => r.json());
    setOpp(refreshed);
    setActiveQuote(refreshed.quotes?.[0] ?? null);
  }

  function handleServiceChange(service: string) {
    const match = priceBook.find((pb) => {
      if (pb.service !== service) return false;
      if (opp?.aumMm != null) {
        return true;
      }
      return true;
    });
    setNewLine((prev) => ({
      ...prev,
      service,
      pricePerEntity: match ? match.pricePerEntity : prev.pricePerEntity,
      aumTierLabel: match ? match.aumTierLabel : prev.aumTierLabel,
    }));
  }

  if (loading || !opp) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-gray-400 text-xs">Loading opportunity…</div>
      </div>
    );
  }

  const fundStrategiesList: string[] = (() => {
    try {
      return JSON.parse(opp.fundStrategies || '[]');
    } catch {
      return [];
    }
  })();

  const contract = opp.contracts?.[0] ?? null;

  return (
    <div>
      <PageHeader
        title={opp.name}
        breadcrumbs={[
          { label: 'Revenue Ops', href: '/revops' },
          { label: opp.accountName },
          { label: opp.name },
        ]}
      />

      {/* Deal type + client banner for expansion deals */}
      {opp.dealType === 'Expansion' && opp.clientId && (
        <div className="bg-teal-50 border border-teal-200 rounded-lg px-4 py-2.5 mb-3 flex items-center gap-3">
          <span className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold bg-teal-100 text-teal-700">Expansion Deal</span>
          <span className="text-xs text-teal-800">Existing client adding new funds:</span>
          <a
            href={`/data-vault/clients/${opp.clientId}`}
            className="text-xs font-semibold text-teal-700 hover:underline"
          >
            {opp.clientName}
          </a>
        </div>
      )}
      {opp.dealType === 'New Logo' && (
        <div className="bg-violet-50 border border-violet-200 rounded-lg px-4 py-2.5 mb-3 flex items-center gap-3">
          <span className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold bg-violet-100 text-violet-700">New Logo</span>
          <span className="text-xs text-violet-800">New prospect — not yet a Canopy client</span>
        </div>
      )}

      {/* Stage bar */}
      <div className="bg-white rounded-lg shadow-sm p-3 mb-4 flex items-center gap-2">
        {STAGES.map((s) => (
          <button
            key={s}
            onClick={() => advanceStage(s)}
            disabled={stageSaving}
            className={`flex-1 py-1.5 rounded text-[10px] font-semibold transition-colors ${
              opp.stage === s
                ? STAGE_COLORS[s]
                : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
            }`}
          >
            {s}
          </button>
        ))}
        <span className="ml-2 text-[10px] text-gray-400 font-mono">{opp.probability}%</span>
      </div>

      {/* Hero metrics */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <MetricCard
          title="ARR"
          value={opp.amount != null ? fmtMoney(opp.amount) : '—'}
          color="green"
        />
        <MetricCard
          title="Close Date"
          value={opp.closeDate ? opp.closeDate.slice(0, 10) : 'TBD'}
          color="teal"
        />
        <MetricCard
          title="Probability"
          value={`${opp.probability}%`}
          color="signal"
        />
      </div>

      {/* Main 2-col grid */}
      <div className="grid grid-cols-5 gap-4">
        {/* Left col — Quote Builder + Activities */}
        <div className="col-span-3">

          {/* Quote Builder */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900">Quote</span>
                {activeQuote && (
                  <>
                    <StatusBadge status={activeQuote.status} />
                    <span className="font-mono text-[10px] text-gray-400">{activeQuote.quoteId}</span>
                  </>
                )}
              </div>
              {!activeQuote && (
                <button
                  onClick={createQuote}
                  disabled={quoteSaving}
                  className="flex items-center gap-1 text-[10px] font-semibold bg-[#00C97B] text-white px-2.5 py-1 rounded hover:bg-[#00835A] transition-colors disabled:opacity-50"
                >
                  <Plus className="w-3 h-3" />
                  Create Quote
                </button>
              )}
            </div>

            {!activeQuote ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-xs text-gray-400 mb-3">No quote yet</p>
                <button
                  onClick={createQuote}
                  disabled={quoteSaving}
                  className="flex items-center gap-1 text-[10px] font-semibold bg-[#00C97B] text-white px-3 py-1.5 rounded hover:bg-[#00835A] transition-colors disabled:opacity-50"
                >
                  <Plus className="w-3 h-3" />
                  Create Quote
                </button>
              </div>
            ) : (
              <>
                {/* Quote lines table */}
                <div className="overflow-x-auto mb-3">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="px-2 py-1.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Service</th>
                        <th className="px-2 py-1.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">AUM Tier</th>
                        <th className="px-2 py-1.5 text-right text-[10px] font-semibold text-gray-500 uppercase tracking-wider">$/Entity</th>
                        <th className="px-2 py-1.5 text-right text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Entities</th>
                        <th className="px-2 py-1.5 text-right text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Annual Value</th>
                        <th className="px-2 py-1.5 w-8" />
                      </tr>
                    </thead>
                    <tbody>
                      {activeQuote.lines.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-2 py-6 text-center text-[10px] text-gray-400">
                            No lines yet — add one below.
                          </td>
                        </tr>
                      ) : (
                        activeQuote.lines.map((line) => (
                          <tr key={line.id} className="border-b border-gray-50 hover:bg-gray-50/40">
                            <td className="px-2 py-2 font-medium">{line.service}</td>
                            <td className="px-2 py-2 text-gray-500">{line.aumTierLabel ?? '—'}</td>
                            <td className="px-2 py-2 text-right font-mono">
                              {line.pricePerEntity != null ? fmtMoney(line.pricePerEntity) : '—'}
                            </td>
                            <td className="px-2 py-2 text-right font-mono">
                              {line.estimatedEntities ?? '—'}
                            </td>
                            <td className="px-2 py-2 text-right font-mono font-semibold text-emerald-600">
                              {line.annualValue != null ? fmtMoney(line.annualValue) : '—'}
                            </td>
                            <td className="px-2 py-2" />
                          </tr>
                        ))
                      )}
                      {activeQuote.lines.length > 0 && (
                        <tr className="bg-gray-50 border-t border-gray-200">
                          <td colSpan={4} className="px-2 py-2 text-xs font-semibold text-gray-700 text-right">
                            Total ARR
                          </td>
                          <td className="px-2 py-2 text-right font-mono font-bold text-emerald-600">
                            {activeQuote.totalArr != null ? fmtMoney(activeQuote.totalArr) : '—'}
                          </td>
                          <td />
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Add line form */}
                {addingLine ? (
                  <div className="border border-gray-200 rounded-md p-3 mb-3 bg-gray-50">
                    <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-2">New Line</p>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div>
                        <label className="text-[10px] font-semibold text-gray-500 mb-1 block">Service</label>
                        <select
                          value={newLine.service}
                          onChange={(e) => handleServiceChange(e.target.value)}
                          className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:ring-1 focus:ring-[#00C97B] focus:border-[#00C97B] outline-none bg-white"
                        >
                          {SERVICES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-gray-500 mb-1 block">AUM Tier</label>
                        <input
                          type="text"
                          value={newLine.aumTierLabel}
                          onChange={(e) => setNewLine((prev) => ({ ...prev, aumTierLabel: e.target.value }))}
                          className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:ring-1 focus:ring-[#00C97B] focus:border-[#00C97B] outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-gray-500 mb-1 block">$/Entity</label>
                        <input
                          type="number"
                          value={newLine.pricePerEntity}
                          onChange={(e) => setNewLine((prev) => ({ ...prev, pricePerEntity: Number(e.target.value) }))}
                          className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:ring-1 focus:ring-[#00C97B] focus:border-[#00C97B] outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-gray-500 mb-1 block">Entities</label>
                        <input
                          type="number"
                          value={newLine.estimatedEntities}
                          onChange={(e) => setNewLine((prev) => ({ ...prev, estimatedEntities: Number(e.target.value) }))}
                          className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:ring-1 focus:ring-[#00C97B] focus:border-[#00C97B] outline-none"
                        />
                      </div>
                    </div>
                    <div className="text-[10px] text-gray-500 mb-2">
                      Annual Value: <span className="font-mono font-semibold text-emerald-600">{fmtMoney(newLine.pricePerEntity * newLine.estimatedEntities)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={addLine}
                        className="text-[10px] font-semibold bg-[#00C97B] text-white px-2.5 py-1 rounded hover:bg-[#00835A] transition-colors"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => setAddingLine(false)}
                        className="text-[10px] font-semibold text-gray-500 hover:text-gray-700 px-2.5 py-1 rounded border border-gray-200 hover:bg-gray-100 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setAddingLine(true)}
                    className="flex items-center gap-1 text-[10px] font-semibold text-[#00C97B] hover:underline mb-3"
                  >
                    <Plus className="w-3 h-3" />
                    Add Line
                  </button>
                )}

                {/* Quote status actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                  {activeQuote.status === 'Draft' && (
                    <button
                      onClick={() => updateQuoteStatus('Sent')}
                      className="text-[10px] font-semibold border border-gray-300 text-gray-600 px-2.5 py-1 rounded hover:bg-gray-50 transition-colors"
                    >
                      Mark Sent
                    </button>
                  )}
                  {activeQuote.status === 'Sent' && (
                    <>
                      <button
                        onClick={() => updateQuoteStatus('Accepted')}
                        className="text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded hover:bg-emerald-200 transition-colors"
                      >
                        Mark Accepted
                      </button>
                      <button
                        onClick={() => updateQuoteStatus('Rejected')}
                        className="text-[10px] font-semibold bg-red-100 text-red-600 px-2.5 py-1 rounded hover:bg-red-200 transition-colors"
                      >
                        Mark Rejected
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Activities */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-900">Activities</span>
              <button
                onClick={() => setAddingActivity(true)}
                className="flex items-center gap-1 text-[10px] font-semibold text-[#00C97B] hover:underline"
              >
                <Plus className="w-3 h-3" />
                Log Activity
              </button>
            </div>

            {/* Add activity form */}
            {addingActivity && (
              <div className="border border-gray-200 rounded-md p-3 mb-3 bg-gray-50">
                <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider mb-2">New Activity</p>
                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 mb-1 block">Type</label>
                    <select
                      value={newActivity.type}
                      onChange={(e) => setNewActivity((prev) => ({ ...prev, type: e.target.value }))}
                      className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:ring-1 focus:ring-[#00C97B] focus:border-[#00C97B] outline-none bg-white"
                    >
                      {['Call', 'Email', 'Meeting', 'Demo', 'Note'].map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 mb-1 block">Subject</label>
                    <input
                      type="text"
                      value={newActivity.subject}
                      onChange={(e) => setNewActivity((prev) => ({ ...prev, subject: e.target.value }))}
                      placeholder="e.g. Intro call with CFO"
                      className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:ring-1 focus:ring-[#00C97B] focus:border-[#00C97B] outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 mb-1 block">Description</label>
                    <textarea
                      value={newActivity.description}
                      onChange={(e) => setNewActivity((prev) => ({ ...prev, description: e.target.value }))}
                      rows={2}
                      placeholder="Notes from the activity…"
                      className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:ring-1 focus:ring-[#00C97B] focus:border-[#00C97B] outline-none resize-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-500 mb-1 block">Outcome</label>
                    <input
                      type="text"
                      value={newActivity.outcome}
                      onChange={(e) => setNewActivity((prev) => ({ ...prev, outcome: e.target.value }))}
                      placeholder="e.g. Follow-up scheduled"
                      className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:ring-1 focus:ring-[#00C97B] focus:border-[#00C97B] outline-none"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={submitActivity}
                    className="text-[10px] font-semibold bg-[#00C97B] text-white px-2.5 py-1 rounded hover:bg-[#00835A] transition-colors"
                  >
                    Submit
                  </button>
                  <button
                    onClick={() => {
                      setAddingActivity(false);
                      setNewActivity({ type: 'Call', subject: '', description: '', outcome: '' });
                    }}
                    className="text-[10px] font-semibold text-gray-500 hover:text-gray-700 px-2.5 py-1 rounded border border-gray-200 hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Timeline */}
            {opp.activities.length === 0 && !addingActivity ? (
              <p className="text-[10px] text-gray-400 py-4 text-center">No activities logged yet.</p>
            ) : (
              <div className="space-y-3">
                {opp.activities.map((act) => (
                  <div key={act.id} className="flex gap-2.5">
                    <div className="flex-shrink-0 mt-0.5">{activityIcon(act.type)}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-semibold text-gray-800">{act.subject}</span>
                        <span className="font-mono text-[10px] text-gray-400">
                          {act.activityDate ? act.activityDate.slice(0, 10) : '—'}
                        </span>
                      </div>
                      {act.description && (
                        <p className="text-[10px] text-gray-500 mb-1">{act.description}</p>
                      )}
                      {act.outcome && (
                        <span className="inline-block bg-gray-100 text-gray-600 text-[10px] font-medium px-1.5 py-0.5 rounded">
                          {act.outcome}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right col */}
        <div className="col-span-2">

          {/* Contact Roles */}
          <div className="bg-white rounded-lg shadow-sm p-3 mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-900">Contacts</span>
              <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 rounded-full px-1.5 py-0.5">
                {opp.contacts.length}
              </span>
            </div>
            {opp.contacts.length === 0 ? (
              <p className="text-[10px] text-gray-400 py-3 text-center">No contacts linked.</p>
            ) : (
              <div className="space-y-2">
                {opp.contacts.map((cr) => (
                  <div key={cr.id} className="flex items-center gap-2">
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-[10px] font-semibold">
                      {initials(cr.contact.firstName, cr.contact.lastName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-gray-900 truncate">
                        {cr.contact.firstName} {cr.contact.lastName}
                      </p>
                      <p className="text-[10px] text-gray-500 truncate">{cr.contact.title ?? '—'}</p>
                    </div>
                    <span className="inline-block bg-blue-100 text-blue-700 text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0">
                      {cr.role}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="bg-white rounded-lg shadow-sm p-3 mb-3">
            <span className="text-sm font-semibold text-gray-900 block mb-2">Details</span>
            <div className="space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex-shrink-0">Lead Source</span>
                <span className="text-xs text-gray-700 text-right">{opp.leadSource ?? '—'}</span>
              </div>
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex-shrink-0">Entity Count</span>
                <span className="text-xs font-mono text-gray-700 text-right">{opp.entityCount ?? '—'}</span>
              </div>
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex-shrink-0">AUM</span>
                <span className="text-xs font-mono text-gray-700 text-right">
                  {opp.aumMm != null ? `$${opp.aumMm}M` : '—'}
                </span>
              </div>
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex-shrink-0">Owner</span>
                <span className="text-xs text-gray-700 text-right">{opp.ownerName ?? '—'}</span>
              </div>
              {opp.description && (
                <div>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">Description</span>
                  <p className="text-xs text-gray-600 leading-relaxed">{opp.description}</p>
                </div>
              )}
              {fundStrategiesList.length > 0 && (
                <div>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">Fund Strategies</span>
                  <div className="flex flex-wrap gap-1">
                    {fundStrategiesList.map((s) => (
                      <span
                        key={s}
                        className="bg-blue-50 text-blue-700 text-[10px] rounded px-1.5 py-0.5 font-medium"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Contract */}
          <div className="bg-white rounded-lg shadow-sm p-3">
            <span className="text-sm font-semibold text-gray-900 block mb-2">Contract</span>
            {contract ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] text-gray-500">{contract.contractId}</span>
                  <StatusBadge status={contract.status} />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">ARR</span>
                  <span className="text-xs font-mono font-semibold text-emerald-600">
                    {contract.annualValue != null ? fmtMoney(contract.annualValue) : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Start</span>
                  <span className="text-xs font-mono text-gray-700">
                    {contract.startDate ? contract.startDate.slice(0, 10) : '—'}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-[10px] text-gray-400">No contract yet.</p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
