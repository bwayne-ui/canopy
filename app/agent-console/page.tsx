'use client';

import { useEffect, useState } from 'react';
import PageHeader from '@/components/PageHeader';
import { Bot, Play, ScrollText, RefreshCw } from 'lucide-react';

interface Skill { name: string; description: string; }
interface AuditEntry { ts: string; event?: string; tool?: string; skill?: string; user?: string; reason?: string; audit_id?: string; }

export default function AgentConsole() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [user, setUser] = useState('billywayne');
  const [inputJson, setInputJson] = useState('{\n  "entity_id": "WALKER-III",\n  "period": "2026-03"\n}');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  const loadSkills = () => fetch('/api/agent/skills').then((r) => r.json()).then((d) => {
    setSkills(d.items ?? []);
    if (!selected && d.items?.[0]) setSelected(d.items[0].name);
  });

  const loadAudit = () => {
    setAuditLoading(true);
    fetch('/api/agent/audit').then((r) => r.json()).then((d) => setAudit(d.entries ?? [])).finally(() => setAuditLoading(false));
  };

  useEffect(() => { loadSkills(); loadAudit(); const t = setInterval(loadAudit, 5000); return () => clearInterval(t); }, []);

  const invoke = async () => {
    setRunning(true);
    setResult(null);
    try {
      const input = JSON.parse(inputJson);
      const r = await fetch('/api/agent/invoke', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ skill: selected, user, input }),
      });
      setResult(await r.json());
    } catch (e) {
      setResult({ error: String(e) });
    } finally {
      setRunning(false);
      loadAudit();
    }
  };

  const eventColor = (e?: string) => {
    if (e === 'BLOCK' || e === 'ERROR') return 'text-red-600 bg-red-50';
    if (e === 'WARN') return 'text-amber-600 bg-amber-50';
    if (e === 'COMPLETE' || e === 'ALLOW') return 'text-emerald-600 bg-emerald-50';
    if (e === 'INVOKE') return 'text-blue-600 bg-blue-50';
    return 'text-gray-500 bg-gray-50';
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Agent Console" subtitle="Invoke Canopy skills and tail the audit log live" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Skill list + invoke form */}
        <div className="bg-white rounded-lg shadow-sm p-4 space-y-3">
          <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
            <Bot className="w-3.5 h-3.5" /> Skills ({skills.length})
          </h3>

          <div className="space-y-1 max-h-48 overflow-y-auto">
            {skills.map((s) => (
              <button
                key={s.name}
                onClick={() => setSelected(s.name)}
                className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                  selected === s.name ? 'bg-[#00C97B]/10 text-[#00C97B] font-semibold' : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className="font-mono">{s.name}</div>
                <div className="text-[10px] text-gray-400 truncate">{s.description}</div>
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-gray-100 space-y-2">
            <label className="block text-[10px] font-semibold text-gray-500 uppercase">User</label>
            <input
              value={user}
              onChange={(e) => setUser(e.target.value)}
              className="w-full px-2 py-1 text-xs border border-gray-200 rounded"
            />
            <label className="block text-[10px] font-semibold text-gray-500 uppercase">Input (JSON)</label>
            <textarea
              value={inputJson}
              onChange={(e) => setInputJson(e.target.value)}
              rows={6}
              className="w-full px-2 py-1.5 text-[11px] font-mono border border-gray-200 rounded"
            />
            <button
              onClick={invoke}
              disabled={running || !selected}
              className="w-full bg-[#00C97B] hover:bg-[#00A866] disabled:bg-gray-300 text-white text-xs font-semibold py-2 rounded-md flex items-center justify-center gap-2 transition-colors"
            >
              <Play className="w-3 h-3" />
              {running ? 'Running...' : `Invoke ${selected || '...'}`}
            </button>
          </div>

          {result != null && (
            <div className="pt-3 border-t border-gray-100">
              <div className="text-[10px] font-semibold text-gray-500 uppercase mb-1">Result</div>
              <pre className="bg-gray-50 rounded p-2 text-[10px] font-mono overflow-x-auto max-h-64 text-gray-700">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Audit log */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <ScrollText className="w-3.5 h-3.5" /> Audit Log — Today
            </h3>
            <button onClick={loadAudit} className="text-gray-400 hover:text-[#00C97B] transition-colors">
              <RefreshCw className={`w-3.5 h-3.5 ${auditLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <div className="text-[10px] text-gray-400 mb-2">Auto-refresh every 5s · {audit.length} entries</div>
          <div className="space-y-1 max-h-[600px] overflow-y-auto font-mono text-[10px]">
            {audit.length === 0 && <div className="text-gray-400 py-4 text-center">No entries yet today</div>}
            {audit.slice().reverse().map((e, i) => (
              <div key={i} className="flex items-start gap-2 py-1 border-b border-gray-50 last:border-0">
                <span className="text-gray-400 whitespace-nowrap">{e.ts?.slice(11, 19)}</span>
                <span className={`px-1.5 rounded text-[9px] font-bold ${eventColor(e.event)}`}>{e.event ?? '—'}</span>
                <span className="text-gray-700 truncate flex-1">
                  {e.skill && <span className="font-semibold">{e.skill}</span>}
                  {e.tool && <span className="text-gray-500"> {e.tool}</span>}
                  {e.user && <span className="text-gray-400"> · {e.user}</span>}
                  {e.reason && <span className="text-red-500"> — {e.reason}</span>}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
