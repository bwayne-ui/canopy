import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { runReconciliation } from '@/lib/tools/reconciliation';

export const runtime = 'nodejs';
export const maxDuration = 120;

function parseCsvText(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).map((line) => {
    // Handle quoted fields with commas
    const values: string[] = [];
    let inQuote = false;
    let cur = '';
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote; }
      else if (ch === ',' && !inQuote) { values.push(cur.trim()); cur = ''; }
      else { cur += ch; }
    }
    values.push(cur.trim());
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']));
  });
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const ccFile = formData.get('capitalCallFile') as File | null;
  const bankFile = formData.get('bankStatementFile') as File | null;

  if (!ccFile || !bankFile) {
    return NextResponse.json({ error: 'Both files are required.' }, { status: 400 });
  }

  const ccText = await ccFile.text();
  const bankText = await bankFile.text();

  const ccRows = parseCsvText(ccText);
  const bankRows = parseCsvText(bankText);

  if (!ccRows.length) {
    return NextResponse.json({ error: 'Capital call CSV is empty or unreadable.' }, { status: 400 });
  }
  if (!bankRows.length) {
    return NextResponse.json({ error: 'Bank statement CSV is empty or unreadable.' }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured.' }, { status: 500 });
  }

  const anthropic = new Anthropic({ apiKey });

  try {
    const result = await runReconciliation(ccRows, bankRows, anthropic);
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Reconciliation failed: ${msg}` }, { status: 500 });
  }
}
