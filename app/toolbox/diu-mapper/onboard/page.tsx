'use client';

import { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import PageHeader from '@/components/PageHeader';
import {
  Shuffle, Upload, FileText, CheckCircle2, AlertTriangle,
  Download, Loader2, ArrowRight, X, ChevronRight, ArrowLeft,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Step = 1 | 2 | 3 | 4 | 5 | 6;

interface ParsedData {
  headers: string[];
  rows: Record<string, string>[];
  isWide: boolean;
  fileName: string;
}

interface ColumnMapping {
  [sourceCol: string]: string;
}

interface ValidationError {
  rowIdx: number;
  column: string;
  message: string;
  severity: 'error' | 'warning';
}

// Standard DIU Investran schema target columns
const DIU_TARGET_COLUMNS = [
  'Legal Entity',
  'Vehicle',
  'Investor',
  'JSQ Position ID',
  'Transaction Date',
  'Effective Date',
  'Transaction Type',
  'Debit/Credit',
  'Amount',
  'Currency',
  'Account Ref',
  'Memo',
  'External Ref',
  '(skip)',
];

const STEP_LABELS = ['Upload', 'Normalise', 'Transform', 'Map', 'Validate', 'Export'];

// ---------------------------------------------------------------------------
// Client-side Excel/CSV parser with wide-format detection
// ---------------------------------------------------------------------------

function detectWideFormat(headers: string[]): boolean {
  // Wide if there are many date-like or numeric column names (period columns)
  const dateLike = headers.filter((h) => /\d{4}|\bQ[1-4]\b|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i.test(h));
  return dateLike.length >= 3;
}

async function parseFile(file: File): Promise<ParsedData> {
  const ab = await file.arrayBuffer();
  const wb = XLSX.read(ab, { type: 'array', cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<unknown[]>(ws, { defval: '', header: 1 });

  if (raw.length < 2) return { headers: [], rows: [], isWide: false, fileName: file.name };

  // First row as headers
  const headerRow = raw[0];
  const headers = headerRow.map((h) => String(h ?? '').trim()).filter((h) => h !== '');
  const isWide = detectWideFormat(headers);

  if (!isWide) {
    // Long format — straightforward
    const rows: Record<string, string>[] = raw.slice(1).map((row) => {
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => {
        obj[h] = String(row[i] ?? '');
      });
      return obj;
    });
    return { headers, rows, isWide: false, fileName: file.name };
  }

  // Wide format — detect entity/investor columns (first few) vs period columns
  // Heuristic: first 3 non-date columns are entity columns, rest are periods
  const periodCols: string[] = [];
  const entityCols: string[] = [];
  let periodStart = -1;

  for (let i = 0; i < headers.length; i++) {
    if (/\d{4}|\bQ[1-4]\b|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i.test(headers[i])) {
      if (periodStart === -1) periodStart = i;
      periodCols.push(headers[i]);
    } else {
      entityCols.push(headers[i]);
    }
  }

  // Unpivot: one row per entity × period
  const rows: Record<string, string>[] = [];
  for (const rawRow of raw.slice(1)) {
    const baseObj: Record<string, string> = {};
    entityCols.forEach((col) => {
      const idx = headers.indexOf(col);
      baseObj[col] = String(rawRow[idx] ?? '');
    });
    for (const period of periodCols) {
      const idx = headers.indexOf(period);
      const val = String(rawRow[idx] ?? '');
      if (!val || val === '0' || val === '') continue;
      rows.push({ ...baseObj, Period: period, Amount: val });
    }
  }

  return {
    headers: [...entityCols, 'Period', 'Amount'],
    rows,
    isWide: true,
    fileName: file.name,
  };
}

// ---------------------------------------------------------------------------
// Validation rules
// ---------------------------------------------------------------------------

function validateRows(rows: Record<string, string>[], mapping: ColumnMapping): ValidationError[] {
  const errors: ValidationError[] = [];
  const reverseMap: Record<string, string> = {};
  for (const [src, tgt] of Object.entries(mapping)) {
    if (tgt !== '(skip)') reverseMap[tgt] = src;
  }

  const get = (row: Record<string, string>, target: string): string =>
    row[reverseMap[target] ?? target] ?? '';

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    // Required fields
    for (const req of ['Legal Entity', 'Investor', 'Amount']) {
      const val = get(row, req);
      if (!val.trim()) {
        errors.push({ rowIdx: i, column: req, message: `Missing required field: ${req}`, severity: 'error' });
      }
    }

    // Amount must be numeric
    const amtVal = get(row, 'Amount');
    if (amtVal && isNaN(parseFloat(amtVal.replace(/[$,]/g, '')))) {
      errors.push({ rowIdx: i, column: 'Amount', message: `Non-numeric amount: "${amtVal}"`, severity: 'error' });
    }

    // Date format
    for (const dateFld of ['Transaction Date', 'Effective Date']) {
      const val = get(row, dateFld);
      if (val && !/^\d{4}-\d{2}-\d{2}/.test(val) && isNaN(Date.parse(val))) {
        errors.push({ rowIdx: i, column: dateFld, message: `Invalid date format: "${val}"`, severity: 'warning' });
      }
    }

    // Debit/Credit
    const dc = get(row, 'Debit/Credit').toUpperCase();
    if (dc && dc !== 'D' && dc !== 'C' && dc !== 'DEBIT' && dc !== 'CREDIT') {
      errors.push({ rowIdx: i, column: 'Debit/Credit', message: `Invalid D/C value: "${dc}" (expected D or C)`, severity: 'warning' });
    }

    // Currency
    const cur = get(row, 'Currency').toUpperCase();
    if (cur && !['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'CHF', 'JPY', 'SGD', 'HKD'].includes(cur)) {
      errors.push({ rowIdx: i, column: 'Currency', message: `Unusual currency code: "${cur}"`, severity: 'warning' });
    }
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function StepBar({ current }: { current: Step }) {
  return (
    <div className="flex items-center gap-0.5 mb-5">
      {STEP_LABELS.map((label, idx) => {
        const n = (idx + 1) as Step;
        const done = n < current;
        const active = n === current;
        return (
          <div key={n} className="flex items-center">
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-semibold ${
              active ? 'bg-[#00C97B]/10 text-[#00835A]' : done ? 'text-gray-400' : 'text-gray-300'
            }`}>
              <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                active ? 'bg-[#00C97B] text-white' : done ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'
              }`}>
                {done ? '✓' : n}
              </div>
              {label}
            </div>
            {idx < STEP_LABELS.length - 1 && <ChevronRight className="w-3 h-3 text-gray-200 mx-0.5" />}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function DiuMapperOnboardPage() {
  const [step, setStep] = useState<Step>(1);
  const [parsed, setParsed] = useState<ParsedData | null>(null);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [legalEntity, setLegalEntity] = useState('');
  const [context, setContext] = useState('Investran DIU');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const next = () => setStep((s) => Math.min(s + 1, 6) as Step);
  const back = () => setStep((s) => Math.max(s - 1, 1) as Step);

  // Step 1: handle file upload
  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      const data = await parseFile(file);
      setParsed(data);
      setRows(data.rows);
      // Auto-map columns by fuzzy match
      const autoMap: ColumnMapping = {};
      for (const col of data.headers) {
        const lower = col.toLowerCase().replace(/[^a-z]/g, '');
        const match = DIU_TARGET_COLUMNS.find((t) => {
          const tl = t.toLowerCase().replace(/[^a-z]/g, '');
          return tl === lower || lower.includes(tl) || tl.includes(lower);
        });
        autoMap[col] = match ?? '(skip)';
      }
      setMapping(autoMap);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to parse file');
    } finally {
      setUploading(false);
    }
  }

  // Step 3: apply transforms
  function applyTransforms() {
    let out = [...rows];
    // Filter empty rows (all values blank)
    out = out.filter((r) => Object.values(r).some((v) => v.trim() !== ''));
    // Deduplicate
    const seen = new Set<string>();
    out = out.filter((r) => {
      const key = JSON.stringify(r);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    setRows(out);
  }

  // Step 5: run validation
  function runValidation() {
    const errs = validateRows(rows, mapping);
    setValidationErrors(errs);
  }

  // Step 6: export
  async function handleExport() {
    setLoading(true);
    setError(null);
    try {
      // Build mapped rows
      const mappedRows = rows.map((row) => {
        const out: Record<string, string> = {};
        for (const [src, tgt] of Object.entries(mapping)) {
          if (tgt !== '(skip)') out[tgt] = row[src] ?? '';
        }
        return out;
      });

      const res = await fetch('/api/toolbox/diu-mapper/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: mappedRows, legalEntity, context }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Export failed');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DIU_${(legalEntity || 'export').replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  const errorCount = validationErrors.filter((e) => e.severity === 'error').length;
  const warnCount = validationErrors.filter((e) => e.severity === 'warning').length;

  return (
    <div className="space-y-4">
      <PageHeader
        title="New Onboarding"
        subtitle="Normalise and map investor data for Investran DIU import"
        breadcrumbs={[
          { label: 'Agentic Center' },
          { label: 'Toolbox', href: '/toolbox' },
          { label: 'DIU Mapper', href: '/toolbox/diu-mapper' },
          { label: 'New Onboarding' },
        ]}
      />

      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-px" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)}><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <StepBar current={step} />

        {/* ── Step 1: Upload ── */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-0.5">Upload File</h3>
              <p className="text-xs text-gray-500">Upload any Excel (.xlsx) or CSV file — wide or long format is detected automatically</p>
            </div>
            <div
              onClick={() => !uploading && inputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                uploading ? 'border-blue-200 bg-blue-50' :
                parsed ? 'border-[#00C97B] bg-[#F0FBF6]' :
                'border-gray-200 hover:border-[#00C97B]/50'
              }`}
            >
              <input ref={inputRef} type="file" accept=".xlsx,.csv,.xls,.tsv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              {uploading ? (
                <div className="flex items-center justify-center gap-2 text-xs text-blue-600">
                  <Loader2 className="w-5 h-5 animate-spin" /> Parsing file…
                </div>
              ) : parsed ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2 text-xs text-[#00835A]">
                    <FileText className="w-5 h-5" />
                    <span className="font-semibold">{parsed.fileName}</span>
                  </div>
                  <p className="text-[10px] text-gray-500">
                    {parsed.rows.length} rows · {parsed.headers.length} columns
                    {parsed.isWide && <span className="ml-2 bg-amber-100 text-amber-700 rounded-full px-1.5 py-0.5 font-semibold">Wide format — unpivoted</span>}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5 text-gray-400">
                  <Upload className="w-7 h-7" />
                  <p className="text-xs font-medium">Drop file here or click to browse</p>
                  <p className="text-[10px]">Excel (.xlsx, .xls) or CSV — any layout</p>
                </div>
              )}
            </div>
            <button
              onClick={next}
              disabled={!parsed}
              className="inline-flex items-center gap-2 text-xs font-semibold text-white bg-[#00C97B] hover:bg-[#00A866] disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-md transition-colors"
            >
              Continue <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ── Step 2: Normalise ── */}
        {step === 2 && parsed && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-0.5">Normalise</h3>
              <p className="text-xs text-gray-500">
                {parsed.rows.length} rows · {parsed.headers.length} columns parsed from <span className="font-semibold">{parsed.fileName}</span>
                {parsed.isWide && <span className="ml-2 text-amber-600 font-semibold">· Wide format detected and unpivoted</span>}
              </p>
            </div>
            <div className="overflow-x-auto border border-gray-100 rounded-lg">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {parsed.headers.slice(0, 8).map((h) => (
                      <th key={h} className="text-left px-3 py-2 font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                    ))}
                    {parsed.headers.length > 8 && <th className="px-3 py-2 text-gray-300 text-[10px]">+{parsed.headers.length - 8} more</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {rows.slice(0, 8).map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      {parsed.headers.slice(0, 8).map((h) => (
                        <td key={h} className="px-3 py-1.5 text-gray-600 whitespace-nowrap max-w-[160px] truncate">{row[h] ?? ''}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-2">
              <button onClick={back} className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md border border-gray-200 transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
              <button onClick={next} className="inline-flex items-center gap-2 text-xs font-semibold text-white bg-[#00C97B] hover:bg-[#00A866] px-4 py-2 rounded-md transition-colors">
                Continue <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Transform ── */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-0.5">Transform</h3>
              <p className="text-xs text-gray-500">Apply data quality transforms before mapping</p>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Filter empty rows', desc: 'Remove rows where all values are blank', action: true },
                { label: 'Remove duplicates', desc: 'Deduplicate identical rows', action: true },
              ].map((t) => (
                <div key={t.label} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div>
                    <p className="text-xs font-semibold text-gray-800">{t.label}</p>
                    <p className="text-[10px] text-gray-500">{t.desc}</p>
                  </div>
                  <span className="text-[10px] font-semibold text-[#00835A] bg-[#F0FBF6] px-2 py-0.5 rounded-full">Auto</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500">Current row count: <span className="font-mono font-bold text-gray-900">{rows.length}</span></p>
            <div className="flex gap-2">
              <button onClick={back} className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md border border-gray-200 transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
              <button onClick={() => { applyTransforms(); next(); }} className="inline-flex items-center gap-2 text-xs font-semibold text-white bg-[#00C97B] hover:bg-[#00A866] px-4 py-2 rounded-md transition-colors">
                Apply & Continue <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 4: Map ── */}
        {step === 4 && parsed && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-0.5">Map Columns</h3>
              <p className="text-xs text-gray-500">Map each source column to the target DIU Investran schema</p>
            </div>
            <div className="space-y-2">
              {parsed.headers.map((col) => (
                <div key={col} className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-gray-700 w-40 flex-shrink-0 truncate">{col}</span>
                  <ChevronRight className="w-3 h-3 text-gray-300 flex-shrink-0" />
                  <select
                    value={mapping[col] ?? '(skip)'}
                    onChange={(e) => setMapping((m) => ({ ...m, [col]: e.target.value }))}
                    className="flex-1 border border-gray-200 rounded-md px-2 py-1 text-xs focus:outline-none focus:border-[#00C97B]"
                  >
                    {DIU_TARGET_COLUMNS.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={back} className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md border border-gray-200 transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
              <button onClick={next} className="inline-flex items-center gap-2 text-xs font-semibold text-white bg-[#00C97B] hover:bg-[#00A866] px-4 py-2 rounded-md transition-colors">
                Continue <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 5: Validate ── */}
        {step === 5 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-0.5">Validate</h3>
              <p className="text-xs text-gray-500">Run required field, date format, debit/credit, and currency checks</p>
            </div>
            {validationErrors.length === 0 && (
              <button
                onClick={runValidation}
                className="inline-flex items-center gap-2 text-xs font-semibold text-[#00835A] bg-[#F0FBF6] hover:bg-[#E0F7ED] border border-[#00C97B]/30 px-4 py-2 rounded-md transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Run Validation
              </button>
            )}
            {validationErrors.length > 0 && (
              <>
                <div className="flex gap-3">
                  <div className="bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                    <p className="text-xs font-bold text-red-700 font-mono">{errorCount}</p>
                    <p className="text-[10px] text-red-600">Errors</p>
                  </div>
                  <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                    <p className="text-xs font-bold text-amber-700 font-mono">{warnCount}</p>
                    <p className="text-[10px] text-amber-600">Warnings</p>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                    <p className="text-xs font-bold text-emerald-700 font-mono">{rows.length - errorCount}</p>
                    <p className="text-[10px] text-emerald-600">Valid rows</p>
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto space-y-1.5">
                  {validationErrors.slice(0, 30).map((err, idx) => (
                    <div key={idx} className={`rounded-lg border px-3 py-2 text-xs ${err.severity === 'error' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
                      <span className={`font-semibold ${err.severity === 'error' ? 'text-red-700' : 'text-amber-700'}`}>
                        Row {err.rowIdx + 2} — {err.column}:
                      </span>{' '}
                      <span className={err.severity === 'error' ? 'text-red-600' : 'text-amber-600'}>{err.message}</span>
                    </div>
                  ))}
                  {validationErrors.length > 30 && (
                    <p className="text-[10px] text-gray-400 px-1">…and {validationErrors.length - 30} more</p>
                  )}
                </div>
              </>
            )}
            <div className="flex gap-2">
              <button onClick={back} className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md border border-gray-200 transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
              <button
                onClick={next}
                disabled={errorCount > 0}
                className="inline-flex items-center gap-2 text-xs font-semibold text-white bg-[#00C97B] hover:bg-[#00A866] disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-md transition-colors"
              >
                {errorCount > 0 ? 'Fix errors to continue' : 'Proceed to Export'}
                {errorCount === 0 && <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 6: Export ── */}
        {step === 6 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-0.5">Export</h3>
              <p className="text-xs text-gray-500">Download the validated DIU Excel file for Investran import</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Legal Entity Name</label>
                <input
                  type="text"
                  value={legalEntity}
                  onChange={(e) => setLegalEntity(e.target.value)}
                  placeholder="e.g. Walker Capital Fund III"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#00C97B] placeholder:text-gray-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Context / Label</label>
                <input
                  type="text"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="Investran DIU"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#00C97B] placeholder:text-gray-300"
                />
              </div>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-xs">
              <p className="font-semibold text-gray-700">Export summary</p>
              <ul className="mt-1.5 space-y-0.5 text-gray-500">
                <li>• <span className="font-mono">{rows.length}</span> data rows</li>
                <li>• <span className="font-mono">{Object.values(mapping).filter((v) => v !== '(skip)').length}</span> mapped columns</li>
                <li>• Filename: <span className="font-mono text-[10px]">{legalEntity || 'Unknown'} - {new Date().toISOString().slice(0, 10).replace(/-/g, '.')} - {context}.xlsx</span></li>
              </ul>
            </div>
            <div className="flex gap-2">
              <button onClick={back} className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md border border-gray-200 transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
              <button
                onClick={handleExport}
                disabled={loading}
                className="inline-flex items-center gap-2 text-xs font-semibold text-white bg-[#00C97B] hover:bg-[#00A866] disabled:opacity-50 px-4 py-2 rounded-md transition-colors"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                Download DIU Excel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
