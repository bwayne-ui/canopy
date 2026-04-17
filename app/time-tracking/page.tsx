'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import MetricCard from '@/components/MetricCard';
import DataTable, { Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import { fmtDate } from '@/lib/utils';
import { Clock, CheckCircle2, FileEdit, Send, Plus, ChevronLeft, ChevronRight, X } from 'lucide-react';

/* ─── week helpers ──────────────────────────────────────────────────── */

function weekMonday(d = new Date()): Date {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(d);
  mon.setDate(d.getDate() + diff);
  mon.setHours(0, 0, 0, 0);
  return mon;
}

function weekDates(mon: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return d;
  });
}

function shiftWeek(mon: Date, delta: number): Date {
  const d = new Date(mon);
  d.setDate(mon.getDate() + delta * 7);
  return d;
}

function fmtDay(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/* ─── constants ─────────────────────────────────────────────────────── */

const CLIENTS = [
  'Walker Enterprise Fund III',
  'Campbell Growth Fund IV',
  'Sullivan Alpha Fund',
  'Cruz Ventures Fund II',
  'White Senior Credit Fund V',
  'Lopez RE Opportunities III',
  'Rodriguez EM FoF I',
];

const INTERNAL_ROWS = ['Overhead', 'PTO', 'Sick', 'Holiday'];
const ALL_ROWS = [...CLIENTS, ...INTERNAL_ROWS];

type Grid = Record<string, Record<string, string>>;

/* ─── types ─────────────────────────────────────────────────────────── */

interface TimesheetRow {
  id: string;
  timesheetId: string;
  userName: string;
  weekStarting: string;
  status: string;
  totalHours: number;
  billableHours: number;
  utilizationPct: number | null;
  entryCount: number;
  approvedByName: string | null;
}

/* ─── page ──────────────────────────────────────────────────────────── */

export default function TimeTrackingPage() {
  const [sheets, setSheets] = useState<TimesheetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [weekStart, setWeekStart] = useState<Date>(() => weekMonday());
  const [grid, setGrid] = useState<Grid>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () =>
    fetch('/api/timesheets')
      .then((r) => r.json())
      .then((d) => { setSheets(d.items ?? []); setLoading(false); });

  useEffect(() => { load(); }, []);

  const draft = sheets.filter((s) => s.status === 'Draft').length;
  const submitted = sheets.filter((s) => s.status === 'Submitted').length;
  const approved = sheets.filter((s) => s.status === 'Approved').length;
  const totalHours = sheets.reduce((s, t) => s + t.totalHours, 0);
  const totalBillable = sheets.reduce((s, t) => s + t.billableHours, 0);
  const avgUtil = sheets.length ? sheets.reduce((s, t) => s + (t.utilizationPct ?? 0), 0) / sheets.length : 0;

  /* ─── modal helpers ─────────────────────────────────────────────── */

  const dates = weekDates(weekStart);

  const setCell = (row: string, date: string, val: string) => {
    setGrid((g) => ({ ...g, [row]: { ...(g[row] ?? {}), [date]: val } }));
  };

  const rowTotal = (row: string) =>
    dates.reduce((s, d) => s + (parseFloat(grid[row]?.[isoDate(d)] || '0') || 0), 0);

  const dayTotal = (d: Date) =>
    ALL_ROWS.reduce((s, row) => s + (parseFloat(grid[row]?.[isoDate(d)] || '0') || 0), 0);

  const grandTotal = ALL_ROWS.reduce((s, row) => s + rowTotal(row), 0);

  const openModal = () => {
    setWeekStart(weekMonday());
    setGrid({});
    setError(null);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (grandTotal < 40) {
      setError('Total hours must be at least 40 before submitting.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      // 1. Create draft timesheet
      const tsRes = await fetch('/api/timesheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'current-user',
          userName: 'Current User',
          weekStarting: isoDate(weekStart),
        }),
      });
      const tsData = await tsRes.json();
      const tsId = tsData.timesheet?.timesheetId;
      if (!tsId) throw new Error('Failed to create timesheet');

      // 2. Post entries for each non-zero cell
      const entryPromises: Promise<unknown>[] = [];
      for (const row of ALL_ROWS) {
        for (const d of dates) {
          const hrs = parseFloat(grid[row]?.[isoDate(d)] || '0') || 0;
          if (hrs > 0) {
            entryPromises.push(
              fetch(`/api/timesheets/${tsId}/entries`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  date: isoDate(d),
                  clientName: INTERNAL_ROWS.includes(row) ? null : row,
                  category: INTERNAL_ROWS.includes(row) ? row : 'Billable',
                  description: '',
                  hours: hrs,
                  billable: !INTERNAL_ROWS.includes(row),
                }),
              })
            );
          }
        }
      }
      await Promise.all(entryPromises);

      // 3. Submit for manager approval
      await fetch(`/api/timesheets/${tsId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'submit' }),
      });

      setShowModal(false);
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  /* ─── table columns ─────────────────────────────────────────────── */

  const columns: Column[] = [
    { key: 'timesheetId', label: 'Timesheet ID', sortable: true, render: (v: string, row: TimesheetRow) => (
      <Link href={`/time-tracking/${row.timesheetId}`} className="text-xs text-[#00C97B] hover:underline">{v}</Link>
    )},
    { key: 'userName', label: 'Employee', sortable: true, render: (v: string) => <Link href={`/data-vault/internal-users?search=${encodeURIComponent(v)}`} className="font-semibold text-gray-900 hover:text-[#00C97B] transition-colors">{v}</Link> },
    { key: 'weekStarting', label: 'Week Starting', sortable: true, render: (v: string) => fmtDate(v) },
    { key: 'totalHours', label: 'Total Hrs', sortable: true, align: 'right', render: (v: number) => <span className="text-xs">{v.toFixed(2)}</span> },
    { key: 'billableHours', label: 'Billable Hrs', sortable: true, align: 'right', render: (v: number) => <span className="text-xs text-emerald-600">{v.toFixed(2)}</span> },
    { key: 'utilizationPct', label: 'Util %', sortable: true, align: 'right', render: (v: number | null) => v ? <span className="text-xs">{v.toFixed(1)}%</span> : '—' },
    { key: 'entryCount', label: 'Entries', sortable: true, align: 'right' },
    { key: 'status', label: 'Status', sortable: true, render: (v: string) => <StatusBadge status={v} /> },
    { key: 'approvedByName', label: 'Approver', render: (v: string | null) => v ?? <span className="text-gray-300">—</span> },
  ];

  if (loading) return <div className="flex items-center justify-center h-96 text-gray-400 text-xs">Loading timesheets...</div>;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Time Tracking"
        subtitle="Weekly timesheets, billable hours, and utilization"
        actions={
          <button
            type="button"
            onClick={openModal}
            className="bg-[#00C97B] hover:bg-[#00A866] text-white text-xs font-semibold px-3 py-1.5 rounded-md flex items-center gap-1.5"
          >
            <Plus className="w-3 h-3" /> New Timesheet
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
        <MetricCard title="Total Sheets" value={String(sheets.length)} icon={<Clock className="w-4 h-4" />} color="teal" href="/time-tracking" />
        <MetricCard title="Draft" value={String(draft)} icon={<FileEdit className="w-4 h-4" />} color="amber" href="/time-tracking" />
        <MetricCard title="Submitted" value={String(submitted)} icon={<Send className="w-4 h-4" />} color="signal" href="/time-tracking" />
        <MetricCard title="Approved" value={String(approved)} icon={<CheckCircle2 className="w-4 h-4" />} color="green" href="/time-tracking" />
        <MetricCard title="Total Hours" value={totalHours.toFixed(0)} color="teal" href="/time-tracking" />
        <MetricCard title="Avg Util %" value={`${avgUtil.toFixed(1)}%`} change={`${totalBillable.toFixed(0)} billable`} changeType="up" color="green" href="/time-tracking" />
      </div>

      <DataTable columns={columns} data={sheets} searchable searchPlaceholder="Search by employee or status..." />

      {/* ─── New Timesheet Modal ─────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl mx-4 flex flex-col max-h-[90vh]">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <div className="text-sm font-bold text-gray-900">New Timesheet</div>
                <div className="text-xs text-gray-500">Enter hours by client and day — minimum 40 hours required to submit</div>
              </div>
              <button type="button" aria-label="Close" onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Week selector */}
            <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-100 bg-gray-50">
              <button
                type="button"
                aria-label="Previous week"
                onClick={() => setWeekStart((w) => shiftWeek(w, -1))}
                className="text-gray-500 hover:text-[#00C97B] transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold text-gray-700">
                Week of {isoDate(weekStart)} — {isoDate(dates[6])}
              </span>
              <button
                type="button"
                aria-label="Next week"
                onClick={() => setWeekStart((w) => shiftWeek(w, 1))}
                className="text-gray-500 hover:text-[#00C97B] transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-auto px-5 py-3">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 pr-3 font-semibold text-gray-500 w-48">Client / Tag</th>
                    {dates.map((d) => (
                      <th key={isoDate(d)} className="text-center py-2 px-1 font-semibold text-gray-500 min-w-[72px]">
                        {fmtDay(d)}
                      </th>
                    ))}
                    <th className="text-right py-2 pl-2 font-semibold text-gray-500 w-16">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Client rows */}
                  {CLIENTS.map((client) => (
                    <tr key={client} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="py-1.5 pr-3 text-gray-700 font-medium truncate max-w-[12rem]" title={client}>
                        {client}
                      </td>
                      {dates.map((d) => {
                        const key = isoDate(d);
                        return (
                          <td key={key} className="py-1 px-1">
                            <input
                              type="number"
                              min="0"
                              max="24"
                              step="0.5"
                              value={grid[client]?.[key] ?? ''}
                              onChange={(ev) => setCell(client, key, ev.target.value)}
                              placeholder="—"
                              className="w-full text-center border border-gray-200 rounded px-1 py-1 text-xs focus:outline-none focus:border-[#00C97B] bg-white"
                            />
                          </td>
                        );
                      })}
                      <td className="py-1.5 pl-2 text-right font-semibold text-gray-700">
                        {rowTotal(client) > 0 ? rowTotal(client).toFixed(1) : <span className="text-gray-300">—</span>}
                      </td>
                    </tr>
                  ))}

                  {/* Divider */}
                  <tr>
                    <td colSpan={9} className="py-1">
                      <div className="h-px bg-gray-200" />
                    </td>
                  </tr>

                  {/* Internal rows */}
                  {INTERNAL_ROWS.map((tag) => (
                    <tr key={tag} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="py-1.5 pr-3 text-gray-400 italic">{tag}</td>
                      {dates.map((d) => {
                        const key = isoDate(d);
                        return (
                          <td key={key} className="py-1 px-1">
                            <input
                              type="number"
                              min="0"
                              max="24"
                              step="0.5"
                              value={grid[tag]?.[key] ?? ''}
                              onChange={(ev) => setCell(tag, key, ev.target.value)}
                              placeholder="—"
                              className="w-full text-center border border-gray-200 rounded px-1 py-1 text-xs focus:outline-none focus:border-[#00C97B] bg-white"
                            />
                          </td>
                        );
                      })}
                      <td className="py-1.5 pl-2 text-right font-semibold text-gray-400">
                        {rowTotal(tag) > 0 ? rowTotal(tag).toFixed(1) : <span className="text-gray-300">—</span>}
                      </td>
                    </tr>
                  ))}

                  {/* Day totals row */}
                  <tr className="border-t-2 border-gray-200 bg-gray-50">
                    <td className="py-2 pr-3 font-semibold text-gray-600">Day Total</td>
                    {dates.map((d) => (
                      <td key={isoDate(d)} className="py-2 px-1 text-center font-semibold text-gray-700">
                        {dayTotal(d) > 0 ? dayTotal(d).toFixed(1) : <span className="text-gray-300">—</span>}
                      </td>
                    ))}
                    <td className={`py-2 pl-2 text-right font-bold ${grandTotal >= 40 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {grandTotal.toFixed(1)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
              <div className="flex items-center gap-3">
                <span className={`text-xs font-semibold ${grandTotal >= 40 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {grandTotal.toFixed(1)} / 40 hrs minimum
                </span>
                {error && <span className="text-xs text-red-600">{error}</span>}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-1.5 text-xs font-semibold text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting || grandTotal < 40}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#00C97B] hover:bg-[#00A866] disabled:bg-gray-200 disabled:text-gray-400 rounded-md flex items-center gap-1.5 transition-colors"
                >
                  <Send className="w-3 h-3" />
                  {submitting ? 'Submitting…' : 'Submit for Approval'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
