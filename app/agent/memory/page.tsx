'use client';

import { useEffect, useState } from 'react';
import {
  Brain, BookOpen, Users, MessageSquare, FileText,
  Loader2, ChevronDown, ChevronUp,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import MetricCard from '@/components/MetricCard';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MemoryEntry {
  file: string;
  name: string;
  type: string;
  description: string;
  content: string;
  preview: string;
}

// ---------------------------------------------------------------------------
// Connected platform config
// ---------------------------------------------------------------------------

const PLATFORMS = [
  {
    id: 'claude',
    name: 'Claude',
    provider: 'Anthropic',
    description: 'Persist agent memory and learned context with Claude across all Canopy sessions.',
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
    description: 'Sync memory context with your GPT-4o workspace and thread history.',
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
    description: 'Share memory with Gemini and Google Workspace for cross-platform continuity.',
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

// ---------------------------------------------------------------------------
// Type config
// ---------------------------------------------------------------------------

type TypeId = 'clients' | 'entities' | 'feedback' | 'playbooks';

const TYPE_CONFIG: Record<string, { label: string; color: string; Icon: React.ElementType }> = {
  clients:   { label: 'Clients',   color: 'bg-teal-50 text-teal-700',     Icon: Users },
  entities:  { label: 'Entities',  color: 'bg-blue-50 text-blue-700',     Icon: FileText },
  feedback:  { label: 'Feedback',  color: 'bg-amber-50 text-amber-700',   Icon: MessageSquare },
  playbooks: { label: 'Playbooks', color: 'bg-purple-50 text-purple-700', Icon: BookOpen },
};

function typeConfig(type: string) {
  return TYPE_CONFIG[type] ?? { label: type, color: 'bg-gray-100 text-gray-600', Icon: Brain };
}

// ---------------------------------------------------------------------------
// Memory Card
// ---------------------------------------------------------------------------

function MemoryCard({ entry, pinned, onTogglePin }: {
  entry: MemoryEntry;
  pinned: boolean;
  onTogglePin: (file: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const { label, color, Icon } = typeConfig(entry.type);

  return (
    <div className={`bg-white rounded-xl border ${pinned ? 'border-[#00C97B] ring-1 ring-[#00C97B]/20' : 'border-gray-200'} p-4 flex flex-col gap-3 transition-all`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#00C97B]/10 flex items-center justify-center flex-shrink-0">
            <Icon className="w-4 h-4 text-[#00835A]" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-900 leading-tight">{entry.name}</p>
            <p className="text-[10px] font-mono text-gray-400 mt-0.5">{entry.file}</p>
          </div>
        </div>
        <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 flex-shrink-0 ${color}`}>{label}</span>
      </div>

      {/* Description */}
      {entry.description && (
        <p className="text-[10px] text-gray-400">{entry.description}</p>
      )}

      {/* Preview */}
      {entry.preview && (
        <p className="text-[10px] text-gray-500 leading-relaxed line-clamp-2">{entry.preview}</p>
      )}

      {/* Expandable full content */}
      {expanded && (
        <div className="border-t border-gray-100 pt-3">
          <pre className="whitespace-pre-wrap text-[10px] font-mono bg-gray-50 rounded p-3 max-h-64 overflow-y-auto text-gray-700 leading-relaxed">
            {entry.content}
          </pre>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-1 border-t border-gray-50">
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="inline-flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-600 transition-colors"
        >
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {expanded ? 'Less' : 'View Content'}
        </button>
        <button
          type="button"
          onClick={() => onTogglePin(entry.file)}
          className={`text-[10px] font-semibold rounded-md px-2.5 py-1 transition-colors ${
            pinned
              ? 'bg-[#00C97B]/10 text-[#00835A] hover:bg-red-50 hover:text-red-600'
              : 'bg-gray-100 text-gray-600 hover:bg-[#00C97B]/10 hover:text-[#00835A]'
          }`}
        >
          {pinned ? '✓ In My Memory' : '+ Pin to My Memory'}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

type FilterTab = 'all' | TypeId;

export default function AIMemoryPage() {
  const [entries, setEntries] = useState<MemoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<FilterTab>('all');
  const [connected, setConnected] = useState<Record<string, boolean>>({ claude: false, openai: false, gemini: false });
  const [pinnedFiles, setPinnedFiles] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch('/api/agent/memory?list=1')
      .then((r) => r.json())
      .then((d) => setEntries(Array.isArray(d) ? d : []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false));
  }, []);

  function togglePin(file: string) {
    setPinnedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(file)) next.delete(file); else next.add(file);
      return next;
    });
  }

  function toggleConnect(platformId: string) {
    setConnected((prev) => ({ ...prev, [platformId]: !prev[platformId] }));
  }

  // Dynamic tabs: All + one per type that has at least one entry
  const presentTypes = Array.from(new Set(entries.map((e) => e.type)));

  const filtered = tab === 'all' ? entries : entries.filter((e) => e.type === tab);

  const typeCount = presentTypes.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-2 text-gray-400 text-xs">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading memory…
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="AI Memory"
        subtitle="Browse and manage your persistent agent memory across sessions"
        breadcrumbs={[
          { label: 'Agentic Center' },
          { label: 'AI Memory' },
        ]}
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard title="Total Memories" value={String(entries.length)}    icon={<Brain className="w-4 h-4" />}       color="teal" />
        <MetricCard title="My Memory"      value={String(pinnedFiles.size)}  icon={<Brain className="w-4 h-4" />}       color="signal" />
        <MetricCard title="Types"          value={String(typeCount)}          icon={<FileText className="w-4 h-4" />}    color="green" />
        <MetricCard title="Last Updated"   value="Today"                      icon={<Brain className="w-4 h-4" />}       color="teal" />
      </div>

      {/* Connected AI Memory */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Connected AI Memory</h3>
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

      {/* Memory Browser */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 pt-3 pb-0 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-900">Memory Browser</h3>
            <span className="text-[10px] text-gray-400">{filtered.length} entr{filtered.length !== 1 ? 'ies' : 'y'}</span>
          </div>
          <div className="flex items-center gap-0.5">
            {/* All tab */}
            <button
              key="all"
              type="button"
              onClick={() => setTab('all')}
              className={`px-3 py-2 text-[10px] font-semibold transition-colors border-b-2 -mb-px ${
                tab === 'all' ? 'border-[#00C97B] text-[#00835A]' : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              All
            </button>
            {/* Dynamic type tabs */}
            {presentTypes.map((type) => {
              const { label } = typeConfig(type);
              const count = entries.filter((e) => e.type === type).length;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setTab(type as FilterTab)}
                  className={`px-3 py-2 text-[10px] font-semibold transition-colors border-b-2 -mb-px ${
                    tab === type ? 'border-[#00C97B] text-[#00835A]' : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {label}{count > 0 ? ` (${count})` : ''}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-4">
          {filtered.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">
              {tab === 'all' ? 'No memory entries found.' : `No ${typeConfig(tab).label.toLowerCase()} memories yet.`}
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filtered.map((entry) => (
                <MemoryCard
                  key={entry.file}
                  entry={entry}
                  pinned={pinnedFiles.has(entry.file)}
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
