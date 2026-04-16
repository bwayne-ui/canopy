'use client';

import { useEffect, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import MetricCard from '@/components/MetricCard';
import StatusBadge from '@/components/StatusBadge';
import { Zap, Activity, CheckCircle2, Loader2, Clock, ChevronDown, ChevronUp } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AISkill {
  id: string;
  name: string;
  description: string;
  category: string;
  status: string;
  accuracy: number | null;
  model: string;
  lastRun: string | null;
  runCount: number;
  avgProcessingTime: string | null;
  inputType: string;
  outputType: string;
}

interface AgentSkill {
  name: string;
  description: string;
}

// ---------------------------------------------------------------------------
// Connected platform config
// ---------------------------------------------------------------------------

const PLATFORMS = [
  {
    id: 'claude',
    name: 'Claude',
    provider: 'Anthropic',
    description: 'Sync your skill layer and persistent memory with Claude across all sessions.',
    color: 'from-orange-50 to-amber-50',
    border: 'border-orange-200',
    badge: 'bg-orange-100 text-orange-700',
    dot: 'bg-orange-400',
    logo: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
      </svg>
    ),
  },
  {
    id: 'openai',
    name: 'OpenAI',
    provider: 'OpenAI',
    description: 'Connect GPT-4o skills and share learned preferences with your OpenAI workspace.',
    color: 'from-gray-50 to-slate-50',
    border: 'border-gray-200',
    badge: 'bg-gray-100 text-gray-700',
    dot: 'bg-gray-400',
    logo: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
        <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464z"/>
      </svg>
    ),
  },
  {
    id: 'gemini',
    name: 'Gemini',
    provider: 'Google',
    description: 'Extend skills to Gemini and sync context across Google Workspace integrations.',
    color: 'from-blue-50 to-indigo-50',
    border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-700',
    dot: 'bg-blue-400',
    logo: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
      </svg>
    ),
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  'Data Extraction':     'bg-violet-50 text-violet-700',
  'Analytics':           'bg-blue-50 text-blue-700',
  'Data Enrichment':     'bg-teal-50 text-teal-700',
  'Compliance':          'bg-red-50 text-red-700',
  'Document Processing': 'bg-amber-50 text-amber-700',
  'Reconciliation':      'bg-emerald-50 text-emerald-700',
};

const STATUS_STYLE: Record<string, string> = {
  Active:   'bg-emerald-50 text-emerald-700',
  Beta:     'bg-purple-50 text-purple-700',
  Training: 'bg-amber-50 text-amber-700',
  Inactive: 'bg-gray-100 text-gray-500',
};

// ---------------------------------------------------------------------------
// Skill Card
// ---------------------------------------------------------------------------

function SkillCard({ skill, pinned, onTogglePin }: {
  skill: AISkill;
  pinned: boolean;
  onTogglePin: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const catColor = CATEGORY_COLORS[skill.category] ?? 'bg-gray-50 text-gray-600';
  const statusStyle = STATUS_STYLE[skill.status] ?? 'bg-gray-100 text-gray-500';

  return (
    <div className={`bg-white rounded-xl border ${pinned ? 'border-[#00C97B] ring-1 ring-[#00C97B]/20' : 'border-gray-200'} p-4 flex flex-col gap-3 transition-all`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#00C97B]/10 flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-[#00835A]" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-900 leading-tight">{skill.name}</p>
            <p className="text-[10px] text-gray-400 font-mono mt-0.5">{skill.model}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${catColor}`}>{skill.category}</span>
          <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${statusStyle}`}>{skill.status}</span>
        </div>
      </div>

      {/* Description */}
      <p className="text-[10px] text-gray-500 leading-relaxed">{skill.description}</p>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        {skill.accuracy != null && (
          <div className="bg-gray-50 rounded-lg p-2 text-center">
            <p className="text-xs font-bold text-gray-900">{Number(skill.accuracy).toFixed(1)}%</p>
            <p className="text-[10px] text-gray-400">Accuracy</p>
          </div>
        )}
        <div className="bg-gray-50 rounded-lg p-2 text-center">
          <p className="text-xs font-bold text-gray-900">{skill.runCount.toLocaleString()}</p>
          <p className="text-[10px] text-gray-400">Runs</p>
        </div>
        {skill.avgProcessingTime && (
          <div className="bg-gray-50 rounded-lg p-2 text-center">
            <p className="text-xs font-bold text-gray-900">{skill.avgProcessingTime}</p>
            <p className="text-[10px] text-gray-400">Avg Time</p>
          </div>
        )}
      </div>

      {/* Expandable I/O */}
      {expanded && (
        <div className="border-t border-gray-100 pt-3 space-y-1.5">
          <div className="flex items-center gap-2 text-[10px]">
            <span className="text-gray-400 w-14 flex-shrink-0">Input</span>
            <span className="font-mono bg-gray-50 rounded px-1.5 py-0.5 text-gray-700">{skill.inputType}</span>
          </div>
          <div className="flex items-center gap-2 text-[10px]">
            <span className="text-gray-400 w-14 flex-shrink-0">Output</span>
            <span className="font-mono bg-gray-50 rounded px-1.5 py-0.5 text-gray-700">{skill.outputType}</span>
          </div>
          {skill.lastRun && (
            <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mt-1">
              <Clock className="w-3 h-3" />
              Last run {new Date(skill.lastRun).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
          )}
        </div>
      )}

      {/* Footer actions */}
      <div className="flex items-center justify-between mt-auto pt-1 border-t border-gray-50">
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="inline-flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-600 transition-colors"
        >
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {expanded ? 'Less' : 'Details'}
        </button>
        <button
          type="button"
          onClick={() => onTogglePin(skill.id)}
          className={`text-[10px] font-semibold rounded-md px-2.5 py-1 transition-colors ${
            pinned
              ? 'bg-[#00C97B]/10 text-[#00835A] hover:bg-red-50 hover:text-red-600'
              : 'bg-gray-100 text-gray-600 hover:bg-[#00C97B]/10 hover:text-[#00835A]'
          }`}
        >
          {pinned ? '✓ In My Skills' : '+ Add to My Skills'}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

type FilterTab = 'all' | 'my' | 'active' | 'beta';

export default function AISkillsPage() {
  const [skills, setSkills] = useState<AISkill[]>([]);
  const [agentSkills, setAgentSkills] = useState<AgentSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<FilterTab>('all');
  const [connected, setConnected] = useState<Record<string, boolean>>({ claude: false, openai: false, gemini: false });
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch('/api/agent/skills')
      .then((r) => r.json())
      .then((d) => {
        setSkills(Array.isArray(d.skills) ? d.skills : []);
        setAgentSkills(Array.isArray(d.agentSkills) ? d.agentSkills : []);
      })
      .finally(() => setLoading(false));
  }, []);

  function togglePin(id: string) {
    setPinnedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleConnect(platformId: string) {
    setConnected((prev) => ({ ...prev, [platformId]: !prev[platformId] }));
  }

  const filtered = (() => {
    switch (tab) {
      case 'my':     return skills.filter((s) => pinnedIds.has(s.id));
      case 'active': return skills.filter((s) => s.status === 'Active');
      case 'beta':   return skills.filter((s) => s.status === 'Beta' || s.status === 'Training');
      default:       return skills;
    }
  })();

  const activeCount = skills.filter((s) => s.status === 'Active').length;
  const categories = Array.from(new Set(skills.map((s) => s.category)));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-2 text-gray-400 text-xs">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading skills…
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="AI Skills"
        subtitle="Manage your personal skill layer and connect to external AI platforms"
        breadcrumbs={[
          { label: 'Agentic Center' },
          { label: 'AI Skills' },
        ]}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard title="Total Skills"   value={String(skills.length)}         icon={<Zap className="w-4 h-4" />}          color="teal" />
        <MetricCard title="Active"         value={String(activeCount)}            icon={<CheckCircle2 className="w-4 h-4" />}  color="green" />
        <MetricCard title="My Skills"      value={String(pinnedIds.size)}         icon={<Activity className="w-4 h-4" />}      color="signal" />
        <MetricCard title="Categories"     value={String(categories.length)}      icon={<Zap className="w-4 h-4" />}           color="teal" />
      </div>

      {/* Connected Platforms */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Connected AI Platforms</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {PLATFORMS.map((p) => {
            const isConnected = connected[p.id];
            return (
              <div key={p.id} className={`rounded-xl border bg-gradient-to-br ${p.color} ${p.border} p-4 flex flex-col gap-3`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${p.badge}`}>
                      {p.logo}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-900">{p.name}</p>
                      <p className="text-[10px] text-gray-400">{p.provider}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-gray-300'}`} />
                    <span className="text-[10px] text-gray-500">{isConnected ? 'Connected' : 'Not connected'}</span>
                  </div>
                </div>
                <p className="text-[10px] text-gray-500 leading-relaxed">{p.description}</p>
                <button
                  type="button"
                  onClick={() => toggleConnect(p.id)}
                  className={`w-full text-[10px] font-semibold rounded-md py-1.5 transition-colors ${
                    isConnected
                      ? 'bg-white border border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200'
                      : `bg-white border ${p.border} text-gray-700 hover:bg-[#00C97B]/5 hover:border-[#00C97B] hover:text-[#00835A]`
                  }`}
                >
                  {isConnected ? 'Disconnect' : `Connect ${p.name}`}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Agent skills from filesystem */}
      {agentSkills.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Agent Skill Files
            <span className="ml-2 text-[10px] font-medium text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">{agentSkills.length} loaded</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {agentSkills.map((s) => (
              <div key={s.name} className="flex items-start gap-2 p-2.5 bg-[#F0FBF6] rounded-lg border border-[#00C97B]/20">
                <Zap className="w-3.5 h-3.5 text-[#00835A] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-semibold text-gray-800">{s.name.replace(/-/g, ' ')}</p>
                  {s.description && <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed">{s.description}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skill library */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 pt-3 pb-0 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-900">Skill Library</h3>
            <span className="text-[10px] text-gray-400">{filtered.length} skill{filtered.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-0.5">
            {([
              { key: 'all',    label: 'All Skills' },
              { key: 'my',     label: `My Skills${pinnedIds.size > 0 ? ` (${pinnedIds.size})` : ''}` },
              { key: 'active', label: 'Active' },
              { key: 'beta',   label: 'Beta / Training' },
            ] as { key: FilterTab; label: string }[]).map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`px-3 py-2 text-[10px] font-semibold transition-colors border-b-2 -mb-px ${
                  tab === t.key ? 'border-[#00C97B] text-[#00835A]' : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4">
          {filtered.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">
              {tab === 'my' ? 'No skills added yet — click "+ Add to My Skills" on any card below.' : 'No skills found.'}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filtered.map((skill) => (
                <SkillCard
                  key={skill.id}
                  skill={skill}
                  pinned={pinnedIds.has(skill.id)}
                  onTogglePin={togglePin}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
