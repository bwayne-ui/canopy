/**
 * Capital Call Reconciliation — TypeScript port of cap-call-recon Python logic.
 *
 * Three-pass matching pipeline:
 *   Pass 1 — Strict:   amount within 1%  AND  name substring match (≥ 95% token recall)
 *   Pass 2 — Relaxed:  amount within 5%  AND  token overlap ≥ 60%
 *   Pass 3 — AI:       Claude tool-calling loop for remaining unmatched tasks
 *
 * HARD RULE: Amount proximity alone is NEVER sufficient — every match requires
 * description text evidence linking the transaction to the investor.
 */

import Anthropic from '@anthropic-ai/sdk';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CapCall {
  key: string;
  investor: string;
  positionId: string;
  expectedAmount: number;
}

export interface BankTx {
  index: number;
  date: string;
  description: string;
  amount: number;
}

export interface MatchedResult {
  investor: string;
  expectedAmount: number;
  matchedAmount: number;
  date: string;
  description: string;
  confidence: number;
  matchMethod: 'strict' | 'relaxed' | 'ai';
  matchReason: string;
}

export interface UnplacedCredit {
  date: string;
  description: string;
  amount: number;
}

export interface PreviouslyFunded {
  investor: string;
  positionId: string;
  amount: number;
  notes: string;
}

export interface StillOutstanding {
  investor: string;
  positionId: string;
  expectedAmount: number;
}

export interface ReconResult {
  matched: MatchedResult[];
  unplacedCredits: UnplacedCredit[];
  previouslyFunded: PreviouslyFunded[];
  stillOutstanding: StillOutstanding[];
  summary: {
    totalInvestors: number;
    matched: number;
    unplaced: number;
    funded: number;
    outstanding: number;
  };
}

// ---------------------------------------------------------------------------
// CSV parsing helpers
// ---------------------------------------------------------------------------

const FUNDED_STATUS_VALUES = new Set(['funded', 'paid', 'done', 'completed', 'settled']);

function extractField(row: Record<string, string>, candidates: string[]): string | null {
  const lower = Object.fromEntries(
    Object.entries(row).map(([k, v]) => [k.trim().toLowerCase(), v])
  );
  for (const c of candidates) {
    const val = lower[c.toLowerCase()];
    if (val !== undefined && val !== null) return String(val);
  }
  return null;
}

function parseAmount(raw: string | null | undefined): number {
  if (!raw) return 0;
  let cleaned = String(raw).replace(/\$/g, '').replace(/,/g, '').trim();
  if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
    cleaned = '-' + cleaned.slice(1, -1);
  }
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

/**
 * Parse a capital call CSV (already split into rows as Record<string, string>[]).
 * Returns two arrays: outstanding tasks and previously-funded items.
 */
export function parseCapitalCallRows(rows: Record<string, string>[]): {
  outstandingTasks: CapCall[];
  previouslyFunded: PreviouslyFunded[];
} {
  const outstandingTasks: CapCall[] = [];
  const previouslyFunded: PreviouslyFunded[] = [];

  // Detect whether a status column exists
  const hasStatusCol = rows.some((row) => {
    const v = extractField(row, ['status', 'funded', 'payment status', 'state']);
    return v !== null && v.trim() !== '';
  });

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const investor =
      extractField(row, ['account name', 'account', 'lp name', 'investor name', 'investor', 'name']) ??
      `Row ${i + 1}`;
    const positionId =
      extractField(row, ['position id', 'position_id', 'positionid', 'pos id', 'pos_id']) ?? 'N/A';
    const amountRaw = extractField(row, ['amount', 'capital call amount', 'commitment', 'amt', 'payment']);
    const amount = parseAmount(amountRaw);

    let isFunded = false;
    let notes = '';

    if (hasStatusCol) {
      const statusVal = extractField(row, ['status', 'funded', 'payment status', 'state']);
      if (statusVal && FUNDED_STATUS_VALUES.has(statusVal.trim().toLowerCase())) {
        isFunded = true;
        notes = `Status: ${statusVal}`;
      }
    }

    if (!isFunded && amount === 0) {
      isFunded = true;
      notes = notes || 'Amount is $0.00';
    }

    if (isFunded) {
      previouslyFunded.push({ investor, positionId, amount, notes });
    } else {
      outstandingTasks.push({
        key: `ROW-${i + 1}`,
        investor,
        positionId,
        expectedAmount: amount,
      });
    }
  }

  return { outstandingTasks, previouslyFunded };
}

/**
 * Normalize a bank CSV (rows already parsed) into BankTx[].
 * Detects amount / description / date columns by hint matching.
 * Falls back to Claude for ambiguous layouts.
 */
export async function normalizeBankRows(
  rows: Record<string, string>[],
  anthropic: Anthropic
): Promise<BankTx[]> {
  if (!rows.length) return [];

  const cols = Object.keys(rows[0]);

  const AMOUNT_HINTS = new Set(['amount', 'amt', 'sum', 'debit', 'credit', 'payment', 'value', 'total']);
  const DESC_HINTS = new Set(['description', 'desc', 'memo', 'narrative', 'details', 'name', 'payee', 'reference', 'note']);
  const DATE_HINTS = new Set(['date', 'datetime', 'transaction_date', 'txn_date', 'posted', 'value_date', 'time']);

  const bestCol = (hints: Set<string>): string | null => {
    const hintArr = Array.from(hints);
    for (const col of cols) {
      if (hints.has(col.trim().toLowerCase())) return col;
    }
    for (const col of cols) {
      for (const hint of hintArr) {
        if (col.trim().toLowerCase().includes(hint)) return col;
      }
    }
    return null;
  };

  let amountCol = bestCol(AMOUNT_HINTS);
  let descCol = bestCol(DESC_HINTS);
  let dateCol = bestCol(DATE_HINTS);

  // LLM fallback if any column is missing
  if (!amountCol || !descCol || !dateCol) {
    const sample = [cols.join(','), ...rows.slice(0, 3).map((r) => cols.map((c) => r[c] ?? '').join(','))].join('\n');
    try {
      const resp = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 150,
        system:
          'You are a bank CSV column classifier. Identify which columns map to amount, description, and date. ' +
          'Respond with ONLY a JSON object — no markdown, no explanation.',
        messages: [
          {
            role: 'user',
            content:
              `CSV sample:\n${sample}\n\n` +
              'Return: {"amount_col": "<col>", "description_col": "<col>", "date_col": "<col>"}\n' +
              'Use null for any column you cannot identify.',
          },
        ],
      });
      const raw = (resp.content[0] as { type: string; text: string }).text
        .trim()
        .replace(/^```json/, '')
        .replace(/^```/, '')
        .replace(/```$/, '')
        .trim();
      const parsed = JSON.parse(raw);
      if (!amountCol && parsed.amount_col) amountCol = parsed.amount_col;
      if (!descCol && parsed.description_col) descCol = parsed.description_col;
      if (!dateCol && parsed.date_col) dateCol = parsed.date_col;
    } catch {
      // LLM fallback failed; continue with whatever we have
    }
  }

  return rows
    .map((row, idx) => {
      const amtRaw = amountCol ? (row[amountCol] ?? '') : '';
      const amtCleaned = amtRaw.replace(/[$,\s]/g, '').replace(/\((.+)\)/, '-$1');
      const amount = parseFloat(amtCleaned);
      if (isNaN(amount)) return null;
      return {
        index: idx,
        date: dateCol ? (row[dateCol] ?? '') : '',
        description: descCol ? (row[descCol] ?? '') : '',
        amount,
      };
    })
    .filter((tx): tx is BankTx => tx !== null);
}

// ---------------------------------------------------------------------------
// String matching helpers
// ---------------------------------------------------------------------------

function normalizeName(name: string): string {
  let n = name.trim().toLowerCase();
  for (const suffix of [' llc', ' lp', ' inc', ' corp', ' ltd', ' co', ' fund', ' partners']) {
    n = n.replace(new RegExp(suffix.replace(/\./g, '\\.') + '\\b', 'g'), '');
  }
  return n.replace(/\s+/g, ' ').trim();
}

function tokenize(text: string): Set<string> {
  return new Set(text.toLowerCase().match(/[a-z0-9]+/g) ?? []);
}

function nameSimilarity(investor: string, description: string): number {
  const invNorm = normalizeName(investor);
  const descNorm = description.trim().toLowerCase();
  if (invNorm && descNorm.includes(invNorm)) return 1.0;
  const invTokens = tokenize(invNorm);
  const descTokens = tokenize(descNorm);
  if (!invTokens.size) return 0;
  const overlap = new Set(Array.from(invTokens).filter((t) => descTokens.has(t)));
  return overlap.size / invTokens.size;
}

// ---------------------------------------------------------------------------
// Three-pass matching engine
// ---------------------------------------------------------------------------

const AMOUNT_TOLERANCE_STRICT = 0.01;
const AMOUNT_TOLERANCE_RELAXED = 0.05;

interface TaskInternal {
  key: string;
  investor: string;
  expectedAmount: number;
  positionId: string;
}

function findBestTx(
  investor: string,
  expected: number,
  transactions: BankTx[],
  usedIndices: Set<number>,
  amountTol: number,
  nameThreshold: number
): { idx: number; tx: BankTx; confidence: number } | null {
  const invNorm = normalizeName(investor);
  if (!invNorm || invNorm.length < 2) return null;

  let bestIdx = -1;
  let bestTx: BankTx | null = null;
  let bestConf = 0;

  for (const tx of transactions) {
    if (usedIndices.has(tx.index)) continue;

    let amtScore: number;
    if (expected === 0) {
      if (tx.amount !== 0) continue;
      amtScore = 1.0;
    } else {
      const diffPct = Math.abs(tx.amount - expected) / Math.abs(expected);
      if (diffPct > amountTol) continue;
      amtScore = Math.max(0, 1.0 - diffPct / amountTol);
    }

    const nameScore = nameSimilarity(investor, tx.description);
    if (nameScore < nameThreshold) continue;

    const conf = amtScore * 0.4 + nameScore * 0.6;
    if (conf > bestConf) {
      bestConf = conf;
      bestTx = tx;
      bestIdx = tx.index;
    }
  }

  if (bestTx) return { idx: bestIdx, tx: bestTx, confidence: bestConf };
  return null;
}

function buildResult(
  task: TaskInternal,
  tx: BankTx,
  confidence: number,
  matchMethod: 'strict' | 'relaxed' | 'ai',
  reason = ''
): MatchedResult {
  return {
    investor: task.investor,
    expectedAmount: task.expectedAmount,
    matchedAmount: tx.amount,
    date: tx.date,
    description: tx.description,
    confidence: Math.round(confidence * 1000) / 10,
    matchMethod,
    matchReason: reason,
  };
}

// ---------------------------------------------------------------------------
// AI Agent Pass 3
// ---------------------------------------------------------------------------

const AGENT_TOOLS: Anthropic.Tool[] = [
  {
    name: 'propose_match',
    description:
      'Propose a match between one capital-call task and one bank transaction. ' +
      'A match MUST have BOTH amount proximity AND name/identity evidence in the ' +
      'transaction description. Amount alone is NEVER sufficient.',
    input_schema: {
      type: 'object',
      required: ['issue_key', 'transaction_index', 'confidence', 'reason', 'description_evidence'],
      properties: {
        issue_key: { type: 'string', description: 'The task key (e.g. ROW-5)' },
        transaction_index: { type: 'integer', description: 'The index of the bank transaction' },
        confidence: { type: 'integer', description: 'Confidence score 0-100' },
        reason: { type: 'string', description: 'Brief explanation of why this is a match' },
        description_evidence: {
          type: 'string',
          description:
            'The specific text from the bank description/memo that identifies the investor. ' +
            'Quote the exact words. REQUIRED — matches without description evidence are rejected.',
        },
      },
    },
  },
  {
    name: 'skip_task',
    description:
      'Declare that a task has no plausible match among the remaining bank transactions.',
    input_schema: {
      type: 'object',
      required: ['issue_key', 'reason'],
      properties: {
        issue_key: { type: 'string', description: 'The task key to skip' },
        reason: { type: 'string', description: 'Why no match could be found' },
      },
    },
  },
  {
    name: 'finish',
    description:
      'Call when you have processed all unmatched tasks. This ends the agent loop.',
    input_schema: { type: 'object', properties: {} },
  },
];

const MAX_AGENT_TURNS = 20;

interface AiMatch {
  issueKey: string;
  transactionIndex: number;
  confidence: number;
  reason: string;
}

async function aiMatch(
  unmatchedTasks: TaskInternal[],
  unmatchedTxs: BankTx[],
  anthropic: Anthropic
): Promise<AiMatch[]> {
  if (!unmatchedTasks.length || !unmatchedTxs.length) return [];

  const validKeys = new Set(unmatchedTasks.map((t) => t.key));
  const validIndices = new Set(unmatchedTxs.map((t) => t.index));
  const claimedKeys = new Set<string>();
  const claimedIndices = new Set<number>();
  const acceptedMatches: AiMatch[] = [];

  const taskLines = unmatchedTasks
    .map((t) => `  - ${t.key}: investor="${t.investor}", expected_amount=${t.expectedAmount}`)
    .join('\n');
  const txLines = unmatchedTxs
    .map(
      (tx) =>
        `  - index=${tx.index}: description="${tx.description}", amount=${tx.amount}, date="${tx.date}"`
    )
    .join('\n');

  const systemPrompt =
    'You are an expert financial reconciliation agent. Your job is to match ' +
    'capital call tasks to bank transactions that simple string-matching could NOT resolve.\n\n' +
    'CRITICAL RULE — AMOUNT ALONE IS NEVER SUFFICIENT:\n' +
    'A valid match requires BOTH:\n' +
    '  1. The amount is reasonably close to the expected amount (within ~10%)\n' +
    '  2. Something in the transaction description/memo identifies the investor — ' +
    'a name, abbreviation, initials, account reference, fund name, or any connecting text.\n' +
    'If nothing in the description links to the investor, call skip_task.\n\n' +
    'Work through each task: propose_match or skip_task. When done, call finish.';

  const userMsg =
    `Items that could not be matched by string matching.\n\n` +
    `UNMATCHED TASKS (${unmatchedTasks.length}):\n${taskLines}\n\n` +
    `AVAILABLE BANK TRANSACTIONS (${unmatchedTxs.length}):\n${txLines}\n\n` +
    `Process each task now.`;

  const messages: Anthropic.MessageParam[] = [{ role: 'user', content: userMsg }];

  for (let turn = 0; turn < MAX_AGENT_TURNS; turn++) {
    const resp = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      system: systemPrompt,
      tools: AGENT_TOOLS,
      messages,
    });

    // Append assistant response
    messages.push({ role: 'assistant', content: resp.content });

    if (resp.stop_reason === 'end_turn') break;

    // Process tool calls
    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    let shouldStop = false;

    for (const block of resp.content) {
      if (block.type !== 'tool_use') continue;
      const { name, id, input } = block as Anthropic.ToolUseBlock;
      const args = input as Record<string, unknown>;
      let resultText = '';

      if (name === 'propose_match') {
        const key = String(args.issue_key ?? '');
        const txIdx = Number(args.transaction_index ?? -1);
        const confidence = Number(args.confidence ?? 0);
        const reason = String(args.reason ?? '');
        const descEvidence = String(args.description_evidence ?? '').trim();

        if (!validKeys.has(key)) {
          resultText = `REJECTED: '${key}' is not a valid unmatched task key.`;
        } else if (claimedKeys.has(key)) {
          resultText = `REJECTED: task ${key} was already matched. Move on.`;
        } else if (!validIndices.has(txIdx)) {
          resultText = `REJECTED: transaction index ${txIdx} is not valid.`;
        } else if (claimedIndices.has(txIdx)) {
          resultText = `REJECTED: transaction ${txIdx} already claimed. Try another for ${key} or skip.`;
        } else if (!descEvidence || descEvidence.length < 2) {
          resultText =
            `REJECTED: description_evidence is empty. You MUST quote text from the description ` +
            `that identifies the investor. Amount alone is never sufficient. Use skip_task if no evidence exists.`;
        } else if (confidence < 50) {
          resultText = `REJECTED: confidence ${confidence}% is below 50% minimum. Try another transaction or skip.`;
        } else {
          claimedKeys.add(key);
          claimedIndices.add(txIdx);
          const fullReason = descEvidence ? `${reason} [evidence: "${descEvidence}"]` : reason;
          acceptedMatches.push({ issueKey: key, transactionIndex: txIdx, confidence, reason: fullReason });
          const remainTasks = validKeys.size - claimedKeys.size;
          const remainTxs = validIndices.size - claimedIndices.size;
          resultText =
            `ACCEPTED: ${key} matched to transaction ${txIdx} (confidence ${confidence}%). ` +
            `Remaining: ${remainTasks} tasks, ${remainTxs} transactions. ` +
            (remainTasks > 0 ? 'Process the next task.' : 'All tasks handled — call finish.');
        }
      } else if (name === 'skip_task') {
        const key = String(args.issue_key ?? '');
        const reason = String(args.reason ?? '');
        if (!validKeys.has(key)) {
          resultText = `NOTE: '${key}' is not a recognized task key. Continue.`;
        } else if (claimedKeys.has(key)) {
          resultText = `NOTE: ${key} already handled. Continue.`;
        } else {
          claimedKeys.add(key);
          const remainTasks = validKeys.size - claimedKeys.size;
          resultText =
            `OK: skipped ${key} — ${reason}. Remaining: ${remainTasks} tasks. ` +
            (remainTasks > 0 ? 'Process the next task.' : 'All tasks handled — call finish.');
        }
      } else if (name === 'finish') {
        const unhandled = Array.from(validKeys).filter((k) => !claimedKeys.has(k));
        if (unhandled.length) {
          resultText =
            `WARNING: ${unhandled.length} tasks not processed: ${unhandled.join(', ')}. ` +
            `Handle them or call finish again to confirm.`;
        } else {
          resultText = 'OK: all tasks processed. Agent loop complete.';
          shouldStop = true;
        }
      } else {
        resultText = `ERROR: unknown function '${name}'. Use propose_match, skip_task, or finish.`;
      }

      toolResults.push({ type: 'tool_result', tool_use_id: id, content: resultText });
    }

    if (toolResults.length) {
      messages.push({ role: 'user', content: toolResults });
    }
    if (shouldStop) break;
  }

  return acceptedMatches;
}

// ---------------------------------------------------------------------------
// Main reconciliation entry point
// ---------------------------------------------------------------------------

export async function runReconciliation(
  ccRows: Record<string, string>[],
  bankRows: Record<string, string>[],
  anthropic: Anthropic
): Promise<ReconResult> {
  const { outstandingTasks, previouslyFunded } = parseCapitalCallRows(ccRows);
  const transactions = await normalizeBankRows(bankRows, anthropic);

  if (!outstandingTasks.length || !transactions.length) {
    return {
      matched: [],
      unplacedCredits: transactions.map((tx) => ({ date: tx.date, description: tx.description, amount: tx.amount })),
      previouslyFunded,
      stillOutstanding: outstandingTasks.map((t) => ({
        investor: t.investor,
        positionId: t.positionId,
        expectedAmount: t.expectedAmount,
      })),
      summary: {
        totalInvestors: ccRows.length,
        matched: 0,
        unplaced: transactions.length,
        funded: previouslyFunded.length,
        outstanding: outstandingTasks.length,
      },
    };
  }

  const matchedResults: MatchedResult[] = [];
  const usedIndices = new Set<number>();
  const unmatchedKeys: string[] = [];

  // Pass 1: Strict
  for (const task of outstandingTasks) {
    const best = findBestTx(task.investor, task.expectedAmount, transactions, usedIndices, AMOUNT_TOLERANCE_STRICT, 0.95);
    if (best) {
      usedIndices.add(best.idx);
      matchedResults.push(buildResult(task, best.tx, best.confidence, 'strict'));
    } else {
      unmatchedKeys.push(task.key);
    }
  }

  // Pass 2: Relaxed
  const stillUnmatched: string[] = [];
  for (const key of unmatchedKeys) {
    const task = outstandingTasks.find((t) => t.key === key)!;
    const best = findBestTx(task.investor, task.expectedAmount, transactions, usedIndices, AMOUNT_TOLERANCE_RELAXED, 0.6);
    if (best) {
      usedIndices.add(best.idx);
      matchedResults.push(buildResult(task, best.tx, best.confidence, 'relaxed'));
    } else {
      stillUnmatched.push(key);
    }
  }

  // Pass 3: AI
  if (stillUnmatched.length) {
    const remainingTasks = outstandingTasks.filter((t) => stillUnmatched.includes(t.key));
    const remainingTxs = transactions.filter((tx) => !usedIndices.has(tx.index));

    if (remainingTxs.length) {
      try {
        const aiMatches = await aiMatch(remainingTasks, remainingTxs, anthropic);
        for (const m of aiMatches) {
          if (!usedIndices.has(m.transactionIndex)) {
            const task = remainingTasks.find((t) => t.key === m.issueKey);
            const tx = remainingTxs.find((t) => t.index === m.transactionIndex);
            if (task && tx) {
              usedIndices.add(m.transactionIndex);
              matchedResults.push(buildResult(task, tx, m.confidence / 100, 'ai', m.reason));
              const idx = stillUnmatched.indexOf(m.issueKey);
              if (idx !== -1) stillUnmatched.splice(idx, 1);
            }
          }
        }
      } catch {
        // AI pass failed — remaining tasks stay unmatched
      }
    }
  }

  const matchedKeys = new Set(matchedResults.map((r) => {
    // Find the original task key
    const t = outstandingTasks.find((t) => t.investor === r.investor && t.expectedAmount === r.expectedAmount);
    return t?.key;
  }));

  const stillOutstanding: StillOutstanding[] = outstandingTasks
    .filter((t) => !matchedKeys.has(t.key) && stillUnmatched.includes(t.key))
    .map((t) => ({ investor: t.investor, positionId: t.positionId, expectedAmount: t.expectedAmount }));

  // Fallback: any remaining keys not in matchedResults
  const allUnmatched = outstandingTasks.filter((t) => {
    const wasMatched = matchedResults.some(
      (r) => r.investor === t.investor && r.expectedAmount === t.expectedAmount
    );
    return !wasMatched;
  });

  const unplacedCredits: UnplacedCredit[] = transactions
    .filter((tx) => !usedIndices.has(tx.index))
    .map((tx) => ({ date: tx.date, description: tx.description, amount: tx.amount }));

  return {
    matched: matchedResults,
    unplacedCredits,
    previouslyFunded,
    stillOutstanding: allUnmatched.map((t) => ({
      investor: t.investor,
      positionId: t.positionId,
      expectedAmount: t.expectedAmount,
    })),
    summary: {
      totalInvestors: ccRows.length,
      matched: matchedResults.length,
      unplaced: unplacedCredits.length,
      funded: previouslyFunded.length,
      outstanding: allUnmatched.length,
    },
  };
}
