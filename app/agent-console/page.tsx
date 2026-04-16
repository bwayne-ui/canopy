'use client';

import { useEffect, useMemo, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import MetricCard from '@/components/MetricCard';
import {
  ChevronDown, ChevronRight, ScrollText, RefreshCw,
  Eye, BookOpen, PencilLine, Lock, Briefcase, Building2, LineChart,
  Sparkles, Send,
} from 'lucide-react';
import { PERSONAS, DEFAULT_PERSONA_ID, getPersona, type Persona } from '@/lib/personas';
import { answerFor, type Answer } from '@/lib/mockAnswers';

const LS_KEY = 'canopy.controlTower.personaId';

interface AuditEntry { ts: string; event?: string; tool?: string; skill?: string; user?: string; reason?: string; }

/* ─── small reusable primitives ─────────────────────────────────────── */

function Panel({
  title, icon, children, right,
}: { title: string; icon?: React.ReactNode; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
          {icon}{title}
        </h3>
        {right}
      </div>
      {children}
    </div>
  );
}

function MiniTable({ rows }: {
  rows: Array<{ label: string; value: string; hint?: string; tone?: 'ok' | 'warn' | 'bad' | 'info' }>;
}) {
  const cls = (t?: string) =>
    t === 'ok' ? 'text-emerald-600 bg-emerald-50'
    : t === 'warn' ? 'text-amber-600 bg-amber-50'
    : t === 'bad' ? 'text-red-600 bg-red-50'
    : 'text-gray-600 bg-gray-50';
  return (
    <div className="space-y-0.5">
      {rows.map((r, i) => (
        <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-gray-50 last:border-0">
          <div>
            <div className="text-gray-700">{r.label}</div>
            {r.hint && <div className="text-[10px] text-gray-400">{r.hint}</div>}
          </div>
          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${cls(r.tone)}`}>{r.value}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── capability helpers ─────────────────────────────────────────────── */

function capLevel(p: Persona, domain: string): 'write' | 'read' | 'view' | 'none' {
  if (p.capabilities.write.includes(domain)) return 'write';
  if (p.capabilities.read.includes(domain)) return 'read';
  if (p.capabilities.view.includes(domain)) return 'view';
  return 'none';
}

function CapBadge({ level }: { level: 'write' | 'read' | 'view' | 'none' }) {
  const map = {
    write: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <PencilLine className="w-3 h-3" />, label: 'Write' },
    read:  { cls: 'bg-blue-50 text-blue-700 border-blue-200',          icon: <BookOpen className="w-3 h-3" />,   label: 'Read'  },
    view:  { cls: 'bg-gray-50 text-gray-600 border-gray-200',          icon: <Eye className="w-3 h-3" />,         label: 'View'  },
    none:  { cls: 'bg-gray-50 text-gray-400 border-gray-200',          icon: <Lock className="w-3 h-3" />,        label: 'No access' },
  }[level];
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-semibold ${map.cls}`}>
      {map.icon}{map.label}
    </span>
  );
}

/* ─── widget registry ────────────────────────────────────────────────── */

const WIDGETS: Record<string, { title: string; domain: string; render: () => React.ReactNode }> = {
  'fund-admin-org-health': {
    title: 'Fund Admin Org Health', domain: 'fund-admin',
    render: () => <MiniTable rows={[
      { label: 'Pod A — Walker III',   value: '96% SLA', tone: 'ok'   },
      { label: 'Pod B — Campbell IV',  value: '88% SLA', tone: 'warn' },
      { label: 'Pod C — Sullivan',     value: '99% SLA', tone: 'ok'   },
      { label: 'Pod D — Cruz',         value: '71% SLA', tone: 'bad'  },
    ]} />,
  },
  'close-calendar-heatmap': {
    title: 'Close Calendar — April', domain: 'close',
    render: () => (
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 30 }).map((_, i) => {
          const load = (i * 37) % 100;
          const c = load > 75 ? 'bg-red-300' : load > 50 ? 'bg-amber-300' : load > 25 ? 'bg-emerald-300' : 'bg-gray-100';
          return <div key={i} className={`h-6 rounded ${c}`} title={`Apr ${i + 1}`} />;
        })}
      </div>
    ),
  },
  'escalations': {
    title: 'Open Escalations', domain: 'clients',
    render: () => <MiniTable rows={[
      { label: 'Cruz Ventures II', value: 'P1', hint: 'SLA miss — distribution notice 48h late', tone: 'bad'  },
      { label: 'Harbor Peak',      value: 'P2', hint: 'NPS drop −12 QoQ',                        tone: 'warn' },
      { label: 'Orion Bridge',     value: 'P2', hint: 'Missing K-1 packets',                      tone: 'warn' },
    ]} />,
  },
  'flight-risk-roster': {
    title: 'Flight Risk — People', domain: 'people',
    render: () => <MiniTable rows={[
      { label: 'Pod C · 2 senior ICs', value: 'High', tone: 'bad'  },
      { label: 'Pod A · 1 manager',    value: 'Med',  tone: 'warn' },
    ]} />,
  },
  'pod-utilization': {
    title: 'Pod Utilization', domain: 'fund-admin',
    render: () => <MiniTable rows={[
      { label: 'Pod A', value: '92%',  tone: 'warn' },
      { label: 'Pod B', value: '78%',  tone: 'ok'   },
      { label: 'Pod C', value: '104%', tone: 'bad'  },
      { label: 'Pod D', value: '81%',  tone: 'ok'   },
    ]} />,
  },
  'client-health': {
    title: 'Client Health', domain: 'clients',
    render: () => <MiniTable rows={[
      { label: 'Walker III',        value: 'Green',  tone: 'ok'   },
      { label: 'Campbell IV',       value: 'Yellow', tone: 'warn' },
      { label: 'Cruz Ventures II',  value: 'Red',    tone: 'bad'  },
    ]} />,
  },
  'overdue-by-pod': {
    title: 'Overdue Tasks by Pod', domain: 'fund-admin',
    render: () => <MiniTable rows={[
      { label: 'Pod A', value: '3',  tone: 'warn' },
      { label: 'Pod C', value: '11', tone: 'bad'  },
      { label: 'Pod D', value: '1',  tone: 'ok'   },
    ]} />,
  },
  'sla-trend': {
    title: 'SLA Trend — 8 wk', domain: 'fund-admin',
    render: () => (
      <div className="flex items-end gap-1 h-16">
        {[72, 78, 81, 85, 83, 88, 91, 94].map((v, i) => (
          <div key={i} className="flex-1 bg-[#00C97B]/70 rounded-t" style={{ height: `${v}%` }} />
        ))}
      </div>
    ),
  },
  'team-task-board': {
    title: 'Team Task Board — This Week', domain: 'fund-admin',
    render: () => <MiniTable rows={[
      { label: 'NAV calc · Walker III',       value: 'Posted',      tone: 'ok'   },
      { label: 'Capital call · Campbell IV',  value: 'In review',   tone: 'warn' },
      { label: 'Waterfall · Sullivan',        value: 'Blocked',     tone: 'bad'  },
      { label: 'K-1 draft · Cruz',            value: 'Not started', tone: 'info' },
    ]} />,
  },
  'nav-close-status': {
    title: 'NAV Close Status by Entity', domain: 'close',
    render: () => <MiniTable rows={[
      { label: 'Walker III',       value: 'Posted', tone: 'ok'   },
      { label: 'Campbell IV',      value: '82%',    tone: 'warn' },
      { label: 'Sullivan Alpha',   value: '54%',    tone: 'warn' },
      { label: 'Cruz Ventures II', value: '12%',    tone: 'bad'  },
    ]} />,
  },
  'team-utilization': {
    title: 'Team Utilization', domain: 'people',
    render: () => <MiniTable rows={[
      { label: 'Priya Shah',   value: '88%',  tone: 'ok'  },
      { label: 'Jae Park',     value: '104%', tone: 'bad' },
      { label: 'Rashida Ali',  value: '76%',  tone: 'ok'  },
    ]} />,
  },
  'my-tasks': {
    title: 'My Tasks — Today', domain: 'fund-admin',
    render: () => <MiniTable rows={[
      { label: 'Walker III NAV tie-out',       value: 'Due 3pm', tone: 'warn' },
      { label: 'Campbell IV cap call recon',   value: 'Due EOD', tone: 'warn' },
      { label: 'Sullivan timesheet',           value: 'Due Fri', tone: 'info' },
    ]} />,
  },
  'my-entities-nav': {
    title: 'My Entities · NAV', domain: 'fund-admin',
    render: () => <MiniTable rows={[
      { label: 'Walker III',  value: '$1.42B', tone: 'ok' },
      { label: 'Campbell IV', value: '$812M',  tone: 'ok' },
    ]} />,
  },
  'my-timesheet': {
    title: 'My Timesheet', domain: 'people',
    render: () => <MiniTable rows={[
      { label: 'Mon', value: '8.0h',          tone: 'ok'   },
      { label: 'Tue', value: '7.5h',          tone: 'ok'   },
      { label: 'Wed', value: '0.0h — gap',    tone: 'warn' },
    ]} />,
  },
  'jira-board': {
    title: 'Jira — Open by Project', domain: 'engineering',
    render: () => <MiniTable rows={[
      { label: 'CANOPY-UI',    value: '18',         tone: 'warn' },
      { label: 'INGEST',       value: '14 (1 P0)',  tone: 'bad'  },
      { label: 'ADMIN-TOOLS',  value: '15',         tone: 'info' },
    ]} />,
  },
  'app-adoption': {
    title: 'Internal App Adoption', domain: 'bizops',
    render: () => <MiniTable rows={[
      { label: 'Canopy 2.0',    value: '412 WAU', tone: 'ok'   },
      { label: 'Rules Engine',  value: '88 WAU',  tone: 'warn' },
      { label: 'Toolbox',       value: '36 WAU',  tone: 'warn' },
    ]} />,
  },
  'tool-spend': {
    title: 'Top SaaS Spend (MTD)', domain: 'bizops',
    render: () => <MiniTable rows={[
      { label: 'Snowflake',   value: '$82k', tone: 'info' },
      { label: 'Datadog',     value: '$41k', tone: 'info' },
      { label: 'Greenhouse',  value: '$9k',  tone: 'info' },
    ]} />,
  },
  'open-reqs': {
    title: 'Open Requisitions', domain: 'recruiting',
    render: () => <MiniTable rows={[
      { label: 'Fund Accountant II', value: '3 open', tone: 'warn' },
      { label: 'Sr FA Manager',      value: '2 open', tone: 'warn' },
      { label: 'Platform Eng',       value: '4 open', tone: 'bad'  },
    ]} />,
  },
  'pipeline-funnel': {
    title: 'Pipeline Funnel', domain: 'recruiting',
    render: () => <MiniTable rows={[
      { label: 'Applied',      value: '284', tone: 'info' },
      { label: 'Phone screen', value: '46',  tone: 'info' },
      { label: 'Onsite',       value: '18',  tone: 'info' },
      { label: 'Offer',        value: '4',   tone: 'ok'   },
    ]} />,
  },
  'upcoming-starts': {
    title: 'Upcoming Starts (30d)', domain: 'recruiting',
    render: () => <MiniTable rows={[
      { label: 'Apr 15 · Fund Accountant', value: 'Signed',  tone: 'ok'   },
      { label: 'Apr 22 · Platform Eng',    value: 'Signed',  tone: 'ok'   },
      { label: 'May 01 · Sr Manager',      value: 'Pending', tone: 'warn' },
    ]} />,
  },
  'workflow-status': {
    title: 'Internal Workflow Status', domain: 'finance',
    render: () => <MiniTable rows={[
      { label: 'GL reconciliation', value: 'Done',        tone: 'ok'   },
      { label: 'Fund accounting',   value: '82%',         tone: 'warn' },
      { label: 'Consolidation',     value: 'Blocked',     tone: 'bad'  },
      { label: 'Mgmt reporting',    value: 'Not started', tone: 'info' },
    ]} />,
  },
  'close-checklist': {
    title: 'Month-End Close Checklist', domain: 'close',
    render: () => <MiniTable rows={[
      { label: 'Bank recs',        value: 'Done',        tone: 'ok'   },
      { label: 'Accruals',         value: 'In progress', tone: 'warn' },
      { label: 'FX revaluation',   value: 'Not started', tone: 'info' },
    ]} />,
  },
  'cash-position': {
    title: 'Cash Position', domain: 'finance',
    render: () => <MiniTable rows={[
      { label: 'Operating', value: '$14.2M', tone: 'ok'   },
      { label: 'Reserve',   value: '$3.0M',  tone: 'ok'   },
      { label: 'Sweep',     value: '$612k',  tone: 'info' },
    ]} />,
  },
  'eng-velocity': {
    title: 'Sprint Velocity — 8 sprints', domain: 'engineering',
    render: () => (
      <div className="flex items-end gap-1 h-16">
        {[32, 38, 41, 44, 40, 46, 45, 48].map((v, i) => (
          <div key={i} className="flex-1 bg-[#1B3A4B] rounded-t" style={{ height: `${(v / 50) * 100}%` }} />
        ))}
      </div>
    ),
  },
  'open-bugs': {
    title: 'Open Bugs by Severity', domain: 'engineering',
    render: () => <MiniTable rows={[
      { label: 'P0', value: '1',  tone: 'bad'  },
      { label: 'P1', value: '2',  tone: 'warn' },
      { label: 'P2', value: '14', tone: 'info' },
    ]} />,
  },
  'deploy-frequency': {
    title: 'Deploys — This Month', domain: 'engineering',
    render: () => <MiniTable rows={[
      { label: 'Total deploys', value: '27', tone: 'ok'   },
      { label: 'Failed',        value: '2',  tone: 'warn' },
      { label: 'Rollback',      value: '1',  tone: 'warn' },
    ]} />,
  },
};

const DOMAINS = ['fund-admin', 'close', 'clients', 'people', 'finance', 'recruiting', 'bizops', 'engineering'];

/* ─── main page ──────────────────────────────────────────────────────── */

export default function ControlTower() {
  const [personaId, setPersonaId] = useState<string>(DEFAULT_PERSONA_ID);
  const [prompt, setPrompt] = useState('');
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [running, setRunning] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);
  const [audit, setAudit] = useState<AuditEntry[]>([]);

  // persist persona across refreshes
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(LS_KEY) : null;
    if (saved) setPersonaId(saved);
  }, []);
  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem(LS_KEY, personaId);
  }, [personaId]);

  const persona = useMemo(() => getPersona(personaId), [personaId]);

  const loadAudit = () =>
    fetch('/api/agent/audit').then((r) => r.json()).then((d) => setAudit(d.entries ?? [])).catch(() => {});

  useEffect(() => {
    if (!auditOpen) return;
    loadAudit();
    const t = setInterval(loadAudit, 5000);
    return () => clearInterval(t);
  }, [auditOpen]);

  const submit = async (text?: string) => {
    const q = (text ?? prompt).trim();
    if (!q) return;
    setPrompt(q);
    setRunning(true);
    setAnswer(null);
    try {
      fetch('/api/agent/invoke', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ skill: 'adhoc-query', user: persona.id, input: { prompt: q, persona: persona.id } }),
      }).catch(() => {});
      await new Promise((r) => setTimeout(r, 380));
      setAnswer(answerFor(persona, q));
    } finally {
      setRunning(false);
    }
  };

  const visibleWidgets = persona.widgets.filter((key) => {
    const w = WIDGETS[key];
    return w && capLevel(persona, w.domain) !== 'none';
  });

  const canWriteAny = persona.capabilities.write.length > 0;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Agent Prompting Layer"
        subtitle="Persona-aware dashboard · critical items · KPIs · ad-hoc agent prompting"
      />

      {/* ── persona switcher ── */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex items-center gap-4 flex-wrap">
          {/* avatar + identity */}
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#00C97B] to-[#1B3A4B] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
            {persona.avatarInitials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-gray-900">{persona.name}</span>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-500">{persona.title}</span>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                <Building2 className="w-2.5 h-2.5" />{persona.department}
              </span>
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{persona.seniority}</span>
            </div>
          </div>
          {/* picklist */}
          <div className="flex-shrink-0">
            <label className="block text-[10px] font-semibold text-gray-400 uppercase mb-1">Demo persona</label>
            <div className="relative">
              <select
                value={personaId}
                onChange={(e) => { setPersonaId(e.target.value); setAnswer(null); setPrompt(''); }}
                className="appearance-none pr-8 pl-3 py-2 text-xs border border-gray-200 rounded-md bg-white font-semibold text-gray-700 focus:outline-none focus:border-[#00C97B] min-w-[260px]"
              >
                {PERSONAS.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} — {p.title}</option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* ── main two-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">

        {/* LEFT: KPIs + widget grid (2/3 width) */}
        <div className="lg:col-span-2 space-y-4">

          {/* company KPIs — count scaled by persona */}
          {persona.companyKpis.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                <LineChart className="w-3.5 h-3.5" /> Company KPIs
              </div>
              <div className={`grid gap-3 ${
                persona.companyKpis.length >= 5
                  ? 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-6'
                  : persona.companyKpis.length >= 3
                  ? 'grid-cols-2 sm:grid-cols-3'
                  : 'grid-cols-2'
              }`}>
                {persona.companyKpis.map((k) => (
                  <MetricCard
                    key={k.title}
                    title={k.title}
                    value={k.value}
                    change={k.change}
                    changeType={k.changeType}
                    color={k.color}
                  />
                ))}
              </div>
            </div>
          )}

          {/* persona-adaptive widgets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {visibleWidgets.map((key) => {
              const w = WIDGETS[key];
              const level = capLevel(persona, w.domain);
              return (
                <Panel
                  key={key}
                  title={w.title}
                  icon={<Briefcase className="w-3.5 h-3.5" />}
                  right={level === 'write' ? <PencilLine className="w-3 h-3 text-[#00C97B]" /> : undefined}
                >
                  {w.render()}
                </Panel>
              );
            })}
            {visibleWidgets.length === 0 && (
              <div className="col-span-full bg-white rounded-lg shadow-sm p-8 text-center text-xs text-gray-400">
                No widgets in this persona&apos;s view scope.
              </div>
            )}
          </div>

          {/* collapsible audit tail */}
          <div className="bg-white rounded-lg shadow-sm">
            <button
              onClick={() => setAuditOpen((v) => !v)}
              className="w-full flex items-center justify-between p-3 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:bg-gray-50 rounded-lg"
            >
              <span className="flex items-center gap-2">
                <ScrollText className="w-3.5 h-3.5" />
                Audit Tail{auditOpen ? ` · ${audit.length} entries` : ''}
              </span>
              {auditOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
            {auditOpen && (
              <div className="border-t border-gray-100 p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-gray-400">Auto-refresh every 5s</span>
                  <button onClick={loadAudit} className="text-gray-400 hover:text-[#00C97B]">
                    <RefreshCw className="w-3 h-3" />
                  </button>
                </div>
                <div className="space-y-1 max-h-60 overflow-y-auto text-[10px]">
                  {audit.length === 0 && (
                    <div className="text-gray-400 py-4 text-center">No entries yet today</div>
                  )}
                  {audit.slice().reverse().map((e, i) => (
                    <div key={i} className="flex items-start gap-2 py-1 border-b border-gray-50 last:border-0">
                      <span className="text-gray-400 whitespace-nowrap">{e.ts?.slice(11, 19)}</span>
                      <span className="px-1.5 rounded bg-gray-50 text-gray-600 text-[10px] font-bold">{e.event ?? '—'}</span>
                      <span className="text-gray-700 truncate flex-1">
                        {e.skill && <span className="font-semibold">{e.skill}</span>}
                        {e.tool  && <span className="text-gray-500"> {e.tool}</span>}
                        {e.user  && <span className="text-gray-400"> · {e.user}</span>}
                        {e.reason && <span className="text-red-500"> — {e.reason}</span>}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Agent Prompting Layer + Preview (1/3 width, sticky) */}
        <div className="space-y-4 lg:sticky lg:top-4">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-[#00C97B]" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Agent Prompting</span>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="space-y-2">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={persona.placeholder}
                rows={3}
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-md focus:outline-none focus:border-[#00C97B] resize-none"
              />
              <button
                type="submit"
                disabled={running || !prompt.trim()}
                className="w-full bg-[#00C97B] hover:bg-[#00A866] disabled:bg-gray-200 disabled:text-gray-400 text-white text-xs font-semibold py-2 rounded-md flex items-center justify-center gap-2 transition-colors"
              >
                <Send className="w-3 h-3" />
                {running ? 'Thinking…' : 'Ask Canopy'}
              </button>
            </form>

            {/* suggested prompts */}
            <div className="mt-3">
              <div className="text-[10px] font-semibold text-gray-400 uppercase mb-1.5">Suggested</div>
              <div className="flex flex-col gap-1">
                {persona.suggestedPrompts.map((s) => (
                  <button
                    key={s}
                    onClick={() => submit(s)}
                    className="text-left text-xs px-2.5 py-1.5 rounded-md border border-gray-100 hover:border-[#00C97B]/50 hover:bg-[#E6F9F0]/30 text-gray-600 hover:text-[#00C97B] transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Preview panel */}
          {(running || answer) && (
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#00C97B]" /> Preview
              </div>

              {running && (
                <div className="flex items-center gap-2 text-xs text-gray-400 py-4 justify-center">
                  <span className="w-3 h-3 rounded-full bg-[#00C97B] animate-pulse" />
                  Querying Canopy…
                </div>
              )}

              {!running && answer && (
                <>
                  <div className="text-[10px] text-gray-400 mb-1 truncate">&ldquo;{prompt}&rdquo;</div>
                  <div className="text-sm font-semibold text-gray-900 mb-3 leading-snug">{answer.headline}</div>
                  <div className="space-y-0.5">
                    {answer.rows.map((r, i) => (
                      <div key={i} className="flex items-start justify-between text-xs py-1.5 border-b border-gray-50 last:border-0">
                        <div>
                          <div className="font-medium text-gray-800">{r.label}</div>
                          {r.hint && <div className="text-[10px] text-gray-400">{r.hint}</div>}
                        </div>
                        <div className="text-gray-700 text-xs ml-2 whitespace-nowrap">{r.value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-3 pt-2 border-t border-gray-50">
                    Source: {answer.source}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
