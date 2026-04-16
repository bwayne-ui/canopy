'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import { fmtDate } from '@/lib/utils';
import { Play, Save, ArrowLeft, Lock, Users, Building, Globe2, Download, Eye } from 'lucide-react';
import { ALL_GRADES, GRADE_LABEL } from '@/lib/grades';

interface Param { name: string; type: string; required?: boolean; default?: unknown; options?: string[]; }
interface ReportDetail {
  id: string;
  reportId: string;
  name: string;
  description: string | null;
  category: string;
  format: string;
  frequency: string;
  recipients: string | null;
  querySource: string;
  queryLogic: string;
  parametersSchema: Param[];
  ownerName: string;
  visibility: string;
  minGrade: string | null;
  exportFormats: string[];
  status: string;
  version: string;
  lastRunAt: string | null;
  runCount: number;
  runs: {
    runId: string;
    triggeredBy: string;
    parameters: Record<string, unknown>;
    status: string;
    rowCount: number | null;
    durationMs: number | null;
    outputRef: string | null;
    error: string | null;
    startedAt: string;
    finishedAt: string | null;
  }[];
}

const visibilityIcon = (v: string) => {
  if (v === 'Private') return <Lock className="w-3.5 h-3.5" />;
  if (v === 'Team') return <Users className="w-3.5 h-3.5" />;
  if (v === 'Org') return <Building className="w-3.5 h-3.5" />;
  return <Globe2 className="w-3.5 h-3.5" />;
};

const FORMAT_OPTIONS = ['csv', 'json', 'xml', 'html', 'xlsx'];

export default function ReportDetail() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [editing, setEditing] = useState(false);
  const [paramValues, setParamValues] = useState<Record<string, string>>({});
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<unknown>(null);
  const [user, setUser] = useState<{ id: string; name: string; grade: string }>({ id: 'demo-user', name: 'billywayne', grade: 'M3' });

  // Editable fields
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editVisibility, setEditVisibility] = useState('Private');
  const [editMinGrade, setEditMinGrade] = useState('');
  const [editQueryLogic, setEditQueryLogic] = useState('');
  const [editParamsJson, setEditParamsJson] = useState('');
  const [editFormats, setEditFormats] = useState<string[]>([]);

  const load = () => fetch(`/api/reports/${id}`).then((r) => r.json()).then((d) => {
    setReport(d);
    setEditName(d.name); setEditDesc(d.description ?? ''); setEditVisibility(d.visibility);
    setEditMinGrade(d.minGrade ?? '');
    setEditQueryLogic(typeof d.queryLogic === 'string' ? d.queryLogic : JSON.stringify(d.queryLogic, null, 2));
    setEditParamsJson(JSON.stringify(d.parametersSchema, null, 2));
    setEditFormats(d.exportFormats ?? []);
    const initial: Record<string, string> = {};
    (d.parametersSchema as Param[]).forEach((p) => { initial[p.name] = String(p.default ?? ''); });
    setParamValues(initial);
  });

  useEffect(() => { load(); }, [id]);

  const save = async () => {
    let parsedParams; try { parsedParams = JSON.parse(editParamsJson); } catch { alert('Parameters JSON invalid'); return; }
    const r = await fetch(`/api/reports/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: editName, description: editDesc, visibility: editVisibility,
        minGrade: editMinGrade || null,
        queryLogic: editQueryLogic, parametersSchema: parsedParams,
        exportFormats: editFormats.join(','),
      }),
    });
    if (r.ok) { setEditing(false); load(); }
  };

  const run = async () => {
    setRunning(true); setRunResult(null);
    const r = await fetch(`/api/reports/${id}/run`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ user, parameters: paramValues }),
    });
    setRunResult(await r.json());
    setRunning(false);
    load();
  };

  const exportTo = (fmt: string) => {
    if (!report) return;
    const params = new URLSearchParams({ format: fmt, grade: user.grade, user: user.id });
    window.open(`/api/reports/${report.reportId}/export?${params}`, '_blank');
  };

  if (!report) return <div className="flex items-center justify-center h-96 text-gray-400 text-xs">Loading...</div>;

  return (
    <div className="space-y-5">
      <PageHeader
        title={report.name}
        subtitle={`${report.reportId} · v${report.version} · ${report.category}`}
        breadcrumbs={[{ label: 'Reports', href: '/reports' }, { label: report.reportId }]}
        actions={
          <div className="flex items-center gap-2">
            {!editing ? (
              <button onClick={() => setEditing(true)} className="text-xs px-3 py-1.5 border border-gray-200 rounded-md hover:bg-gray-50">Edit</button>
            ) : (
              <>
                <button onClick={() => { setEditing(false); load(); }} className="text-xs px-3 py-1.5 border border-gray-200 rounded-md hover:bg-gray-50">Cancel</button>
                <button onClick={save} className="text-xs px-3 py-1.5 bg-[#00C97B] hover:bg-[#00A866] text-white rounded-md flex items-center gap-1"><Save className="w-3 h-3" />Save</button>
              </>
            )}
            <Link href="/reports" className="text-xs px-3 py-1.5 border border-gray-200 rounded-md hover:bg-gray-50 flex items-center gap-1"><ArrowLeft className="w-3 h-3" />Back</Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Definition */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-4 space-y-3">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Definition</h3>

          {!editing ? (
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
              <div><dt className="text-gray-400 text-[10px] uppercase">Name</dt><dd className="font-semibold">{report.name}</dd></div>
              <div><dt className="text-gray-400 text-[10px] uppercase">Category</dt><dd>{report.category}</dd></div>
              <div><dt className="text-gray-400 text-[10px] uppercase">Format</dt><dd>{report.format}</dd></div>
              <div><dt className="text-gray-400 text-[10px] uppercase">Frequency</dt><dd>{report.frequency}</dd></div>
              <div><dt className="text-gray-400 text-[10px] uppercase">Owner</dt><dd>{report.ownerName}</dd></div>
              <div><dt className="text-gray-400 text-[10px] uppercase">Visibility</dt><dd className="flex items-center gap-1">{visibilityIcon(report.visibility)}{report.visibility}</dd></div>
              <div>
                <dt className="text-gray-400 text-[10px] uppercase">Entitlement</dt>
                <dd>
                  {report.minGrade ? (
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${report.minGrade.startsWith('M') ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{report.minGrade}+</span>
                  ) : '—'}
                </dd>
              </div>
              <div><dt className="text-gray-400 text-[10px] uppercase">Status</dt><dd><StatusBadge status={report.status} /></dd></div>
              <div className="col-span-2"><dt className="text-gray-400 text-[10px] uppercase">Description</dt><dd className="text-gray-700">{report.description ?? '—'}</dd></div>
              <div className="col-span-2"><dt className="text-gray-400 text-[10px] uppercase">Recipients</dt><dd>{report.recipients}</dd></div>
              <div className="col-span-2">
                <dt className="text-gray-400 text-[10px] uppercase">Export Formats</dt>
                <dd className="text-[10px] text-gray-600">{report.exportFormats.join(' · ')}</dd>
              </div>
            </dl>
          ) : (
            <div className="space-y-2 text-xs">
              <input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-2 py-1 border rounded" placeholder="Name" />
              <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} className="w-full px-2 py-1 border rounded" rows={2} placeholder="Description" />
              <div className="grid grid-cols-2 gap-2">
                <select value={editVisibility} onChange={(e) => setEditVisibility(e.target.value)} className="px-2 py-1 border rounded">
                  {['Private', 'Team', 'Org', 'Public'].map((v) => <option key={v}>{v}</option>)}
                </select>
                <select value={editMinGrade} onChange={(e) => setEditMinGrade(e.target.value)} className="px-2 py-1 border rounded">
                  <option value="">— Open (any grade) —</option>
                  {ALL_GRADES.map((g) => <option key={g} value={g}>{GRADE_LABEL[g]}</option>)}
                </select>
              </div>
              <div>
                <div className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Allowed export formats</div>
                <div className="flex flex-wrap gap-2">
                  {FORMAT_OPTIONS.map((f) => (
                    <label key={f} className="flex items-center gap-1 text-xs">
                      <input type="checkbox" checked={editFormats.includes(f)} onChange={(e) => setEditFormats(e.target.checked ? [...editFormats, f] : editFormats.filter((x) => x !== f))} />
                      {f}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-gray-100">
            <div className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Query Logic <span className="">({report.querySource})</span></div>
            {!editing ? (
              <pre className="bg-gray-50 rounded p-2 text-[10px] overflow-x-auto text-gray-700 max-h-48">{report.queryLogic}</pre>
            ) : (
              <textarea value={editQueryLogic} onChange={(e) => setEditQueryLogic(e.target.value)} rows={6} className="w-full px-2 py-1.5 text-[10px] border border-gray-200 rounded" />
            )}
          </div>

          <div className="pt-3 border-t border-gray-100">
            <div className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Parameter Schema</div>
            {!editing ? (
              <pre className="bg-gray-50 rounded p-2 text-[10px] overflow-x-auto text-gray-700 max-h-48">{JSON.stringify(report.parametersSchema, null, 2)}</pre>
            ) : (
              <textarea value={editParamsJson} onChange={(e) => setEditParamsJson(e.target.value)} rows={8} className="w-full px-2 py-1.5 text-[10px] border border-gray-200 rounded" />
            )}
          </div>
        </div>

        {/* Run + Export panel */}
        <div className="bg-white rounded-lg shadow-sm p-4 space-y-3">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Run / View / Export</h3>

          <div className="space-y-2">
            <label className="block text-[10px] font-semibold text-gray-400 uppercase">Run as</label>
            <div className="flex gap-1">
              <input value={user.name} onChange={(e) => setUser({ ...user, name: e.target.value })} className="flex-1 px-2 py-1 text-xs border rounded" placeholder="Name" />
              <select value={user.grade} onChange={(e) => setUser({ ...user, grade: e.target.value })} className="px-2 py-1 text-xs border rounded">
                {ALL_GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>

          {report.parametersSchema.map((p) => (
            <div key={p.name} className="space-y-1">
              <label className="block text-[10px] font-semibold text-gray-400 uppercase">{p.name}{p.required && <span className="text-red-500"> *</span>}</label>
              {p.options ? (
                <select value={paramValues[p.name] ?? ''} onChange={(e) => setParamValues({ ...paramValues, [p.name]: e.target.value })} className="w-full px-2 py-1 text-xs border rounded">
                  {p.options.map((o) => <option key={o}>{o}</option>)}
                </select>
              ) : (
                <input
                  type={p.type === 'number' ? 'number' : p.type === 'date' ? 'date' : 'text'}
                  value={paramValues[p.name] ?? ''}
                  onChange={(e) => setParamValues({ ...paramValues, [p.name]: e.target.value })}
                  className="w-full px-2 py-1 text-xs border rounded"
                />
              )}
            </div>
          ))}

          <button onClick={run} disabled={running} className="w-full bg-[#00C97B] hover:bg-[#00A866] disabled:bg-gray-300 text-white text-xs font-semibold py-2 rounded-md flex items-center justify-center gap-1.5">
            <Play className="w-3 h-3" />{running ? 'Running...' : 'Execute'}
          </button>

          <div className="pt-3 border-t border-gray-100">
            <div className="text-[10px] font-semibold text-gray-400 uppercase mb-1.5">View / Download</div>
            <div className="grid grid-cols-2 gap-1.5">
              <button onClick={() => exportTo('html')} className="text-xs px-2 py-1.5 border border-gray-200 rounded hover:bg-gray-50 flex items-center justify-center gap-1">
                <Eye className="w-3 h-3" />View HTML
              </button>
              {report.exportFormats.filter((f) => f !== 'html').map((f) => (
                <button key={f} onClick={() => exportTo(f)} className="text-xs px-2 py-1.5 border border-gray-200 rounded hover:bg-gray-50 flex items-center justify-center gap-1">
                  <Download className="w-3 h-3" />{f.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="mt-2 text-[10px] text-gray-400">
              Endpoint: <span className="">/api/reports/{report.reportId}/export</span>
            </div>
          </div>

          {runResult != null && (
            <div className="pt-2 border-t border-gray-100">
              <div className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Result</div>
              <pre className="bg-gray-50 rounded p-2 text-[10px] overflow-x-auto max-h-48 text-gray-700">{JSON.stringify(runResult, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>

      {/* Run history */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Run History ({report.runs.length})</h3>
        <table className="w-full text-xs">
          <thead className="bg-gray-50/80 border-b border-gray-200">
            <tr>
              <th className="text-left px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase">Run ID</th>
              <th className="text-left px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase">Triggered By</th>
              <th className="text-left px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase">Started</th>
              <th className="text-right px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase">Rows</th>
              <th className="text-right px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase">Duration</th>
              <th className="text-left px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase">Status</th>
              <th className="text-left px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase">Output / Error</th>
            </tr>
          </thead>
          <tbody>
            {report.runs.map((r) => (
              <tr key={r.runId} className="border-b border-gray-50">
                <td className="px-3 py-2 text-xs">{r.runId}</td>
                <td className="px-3 py-2">{r.triggeredBy}</td>
                <td className="px-3 py-2">{fmtDate(r.startedAt)}</td>
                <td className="px-3 py-2 text-right text-xs">{r.rowCount ?? '—'}</td>
                <td className="px-3 py-2 text-right text-xs">{r.durationMs ? `${r.durationMs}ms` : '—'}</td>
                <td className="px-3 py-2"><StatusBadge status={r.status} /></td>
                <td className="px-3 py-2 text-[10px] text-gray-500 truncate max-w-xs">{r.error ?? r.outputRef ?? '—'}</td>
              </tr>
            ))}
            {report.runs.length === 0 && (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">No runs yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
