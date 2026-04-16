'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';
import MetricCard from '@/components/MetricCard';
import { fmtDate } from '@/lib/utils';
import { Plus, Trash2, Send, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';

interface Entry {
  id: string;
  date: string;
  clientName: string | null;
  entityName: string | null;
  projectName: string | null;
  taskCode: string | null;
  category: string;
  description: string;
  hours: number;
  billable: boolean;
  billRate: number | null;
  approved: boolean;
}

interface Timesheet {
  id: string;
  timesheetId: string;
  userName: string;
  weekStarting: string;
  status: string;
  totalHours: number;
  billableHours: number;
  utilizationPct: number | null;
  submittedAt: string | null;
  approvedAt: string | null;
  approvedByName: string | null;
  notes: string | null;
  entries: Entry[];
}

const CATEGORIES = ['Billable', 'Non-Billable', 'Overhead', 'PTO', 'Sick', 'Holiday'];

export default function TimesheetDetail() {
  const { id } = useParams<{ id: string }>();
  const [ts, setTs] = useState<Timesheet | null>(null);
  const [newEntry, setNewEntry] = useState({
    date: '', clientName: '', entityName: '', projectName: '', taskCode: '',
    category: 'Billable', description: '', hours: '8', billable: true, billRate: '350',
  });

  const load = () => fetch(`/api/timesheets/${id}`).then((r) => r.json()).then(setTs);
  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    if (ts && !newEntry.date) {
      setNewEntry((e) => ({ ...e, date: ts.weekStarting }));
    }
  }, [ts]);

  const addEntry = async () => {
    if (!newEntry.date || !newEntry.description || !newEntry.hours) { alert('Date, description, hours required'); return; }
    const r = await fetch(`/api/timesheets/${id}/entries`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ...newEntry,
        hours: Number(newEntry.hours),
        billRate: newEntry.billable ? Number(newEntry.billRate) : null,
      }),
    });
    if (r.ok) { setNewEntry({ ...newEntry, description: '', hours: '8' }); load(); }
    else alert((await r.json()).error);
  };

  const deleteEntry = async (entryId: string) => {
    await fetch(`/api/timesheets/${id}/entries?entryId=${entryId}`, { method: 'DELETE' });
    load();
  };

  const action = async (action: 'submit' | 'approve' | 'reject') => {
    const body: Record<string, unknown> = { action };
    if (action === 'approve') { body.approverId = 'demo-mgr'; body.approverName = 'Demo Manager'; }
    if (action === 'reject') { body.reason = prompt('Rejection reason?') ?? 'No reason'; }
    await fetch(`/api/timesheets/${id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    load();
  };

  if (!ts) return <div className="flex items-center justify-center h-96 text-gray-400 text-xs">Loading...</div>;

  const editable = ts.status === 'Draft' || ts.status === 'Rejected';

  // Group entries by date for week view
  const byDate: Record<string, Entry[]> = {};
  ts.entries.forEach((e) => { byDate[e.date] = byDate[e.date] || []; byDate[e.date].push(e); });
  const dates = Object.keys(byDate).sort();

  return (
    <div className="space-y-5">
      <PageHeader
        title={`${ts.userName} — Week of ${fmtDate(ts.weekStarting)}`}
        subtitle={`${ts.timesheetId}`}
        breadcrumbs={[{ label: 'Time Tracking', href: '/time-tracking' }, { label: ts.timesheetId }]}
        actions={
          <div className="flex items-center gap-2">
            {ts.status === 'Draft' && <button onClick={() => action('submit')} className="text-xs px-3 py-1.5 bg-[#00C97B] hover:bg-[#00A866] text-white rounded-md flex items-center gap-1"><Send className="w-3 h-3" />Submit</button>}
            {ts.status === 'Submitted' && <>
              <button onClick={() => action('approve')} className="text-xs px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md flex items-center gap-1"><CheckCircle2 className="w-3 h-3" />Approve</button>
              <button onClick={() => action('reject')} className="text-xs px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-md flex items-center gap-1"><XCircle className="w-3 h-3" />Reject</button>
            </>}
            <Link href="/time-tracking" className="text-xs px-3 py-1.5 border border-gray-200 rounded-md hover:bg-gray-50 flex items-center gap-1"><ArrowLeft className="w-3 h-3" />Back</Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <MetricCard title="Status" value={<StatusBadge status={ts.status} /> as unknown as string} color="teal" />
        <MetricCard title="Total Hours" value={ts.totalHours.toFixed(2)} color="teal" />
        <MetricCard title="Billable" value={ts.billableHours.toFixed(2)} color="green" />
        <MetricCard title="Utilization" value={`${(ts.utilizationPct ?? 0).toFixed(1)}%`} color="signal" />
      </div>

      {/* Entries by day */}
      <div className="bg-white rounded-lg shadow-sm p-4 space-y-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Daily Entries</h3>
        {dates.length === 0 && <div className="text-center text-gray-400 text-xs py-6">No entries yet — add your first below.</div>}
        {dates.map((date) => {
          const dayEntries = byDate[date];
          const dayHours = dayEntries.reduce((s, e) => s + e.hours, 0);
          return (
            <div key={date} className="border-l-2 border-[#00C97B]/40 pl-3">
              <div className="flex items-center justify-between mb-1">
                <div className="text-xs font-semibold text-gray-700">{fmtDate(date)}</div>
                <div className="text-[10px] text-gray-400">{dayHours.toFixed(2)}h</div>
              </div>
              <div className="space-y-1">
                {dayEntries.map((e) => (
                  <div key={e.id} className="flex items-center gap-3 text-xs py-1.5 border-b border-gray-50 last:border-0">
                    <div className="flex-1">
                      <div className="font-medium text-gray-800">{e.description}</div>
                      <div className="text-[10px] text-gray-400">
                        {[e.clientName, e.entityName, e.projectName, e.taskCode].filter(Boolean).join(' · ')}
                      </div>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${e.billable ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>{e.category}</span>
                    <span className="text-xs w-12 text-right">{e.hours.toFixed(2)}h</span>
                    {e.billRate && <span className="text-[10px] text-gray-400 w-16 text-right">${(e.hours * e.billRate).toFixed(0)}</span>}
                    {editable && <button onClick={() => deleteEntry(e.id)} className="text-gray-300 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>}
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Add entry form */}
        {editable && (
          <div className="pt-4 border-t border-gray-100">
            <div className="text-[10px] font-semibold text-gray-400 uppercase mb-2 flex items-center gap-1"><Plus className="w-3 h-3" />Add entry</div>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-xs">
              <input type="date" value={newEntry.date} onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })} className="px-2 py-1 border rounded" />
              <input value={newEntry.clientName} onChange={(e) => setNewEntry({ ...newEntry, clientName: e.target.value })} placeholder="Client (GP)" className="px-2 py-1 border rounded" />
              <input value={newEntry.entityName} onChange={(e) => setNewEntry({ ...newEntry, entityName: e.target.value })} placeholder="Entity" className="px-2 py-1 border rounded" />
              <input value={newEntry.projectName} onChange={(e) => setNewEntry({ ...newEntry, projectName: e.target.value })} placeholder="Project" className="px-2 py-1 border rounded" />
              <input value={newEntry.taskCode} onChange={(e) => setNewEntry({ ...newEntry, taskCode: e.target.value })} placeholder="Task code" className="px-2 py-1 border rounded" />
              <select value={newEntry.category} onChange={(e) => setNewEntry({ ...newEntry, category: e.target.value, billable: e.target.value === 'Billable' })} className="px-2 py-1 border rounded">
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
              <input value={newEntry.description} onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })} placeholder="Description" className="md:col-span-3 px-2 py-1 border rounded" />
              <input type="number" step="0.25" value={newEntry.hours} onChange={(e) => setNewEntry({ ...newEntry, hours: e.target.value })} placeholder="Hours" className="px-2 py-1 border rounded" />
              <input type="number" step="25" value={newEntry.billRate} onChange={(e) => setNewEntry({ ...newEntry, billRate: e.target.value })} placeholder="Rate" disabled={!newEntry.billable} className="px-2 py-1 border rounded disabled:bg-gray-100" />
              <button onClick={addEntry} className="bg-[#00C97B] hover:bg-[#00A866] text-white text-xs font-semibold rounded flex items-center justify-center gap-1"><Plus className="w-3 h-3" />Add</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
