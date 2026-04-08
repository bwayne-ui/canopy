// lib/agent-client.ts
// Thin wrapper around the Claude Agent SDK used by the Next.js /api/agent/* routes.
// Loads skills from agent/skills/, scrubs PII before sending, and writes audit-log entries.
//
// IMPORTANT: This file is import-safe at build time even without an API key. The actual
// SDK call is lazily required inside invoke() so the Next.js build does not fail.

import * as fs from 'node:fs';
import * as path from 'node:path';
import { redactPII } from '../agent/security/pii-redaction';

const REPO_ROOT = process.cwd();
const SKILLS_DIR = path.join(REPO_ROOT, 'agent', 'skills');
const AUDIT_DIR = path.join(REPO_ROOT, 'agent', 'governance', 'audit-log');
const APPROVALS_FILE = path.join(REPO_ROOT, 'agent', 'governance', 'approvals.json');

export interface InvokeOptions {
  skill: string;
  input: Record<string, unknown>;
  user: string;
  approvers?: string[];
}

export interface InvokeResult {
  ok: boolean;
  skill: string;
  output?: unknown;
  blocked?: { reason: string };
  audit_id: string;
}

export function listSkills(): { name: string; description: string }[] {
  if (!fs.existsSync(SKILLS_DIR)) return [];
  return fs
    .readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => {
      const skillFile = path.join(SKILLS_DIR, d.name, 'SKILL.md');
      if (!fs.existsSync(skillFile)) return { name: d.name, description: '' };
      const front = fs.readFileSync(skillFile, 'utf8').match(/^---([\s\S]*?)---/);
      const desc = front ? (front[1].match(/description:\s*(.+)/)?.[1] ?? '') : '';
      return { name: d.name, description: desc.trim() };
    });
}

export function loadSkill(skillName: string): { skillMd: string; promptMd: string } | null {
  const dir = path.join(SKILLS_DIR, skillName);
  if (!fs.existsSync(dir)) return null;
  return {
    skillMd: fs.readFileSync(path.join(dir, 'SKILL.md'), 'utf8'),
    promptMd: fs.existsSync(path.join(dir, 'prompt.md')) ? fs.readFileSync(path.join(dir, 'prompt.md'), 'utf8') : '',
  };
}

function approvalGate(opts: InvokeOptions): { ok: true } | { ok: false; reason: string } {
  if (!fs.existsSync(APPROVALS_FILE)) return { ok: true };
  const approvals = JSON.parse(fs.readFileSync(APPROVALS_FILE, 'utf8'));
  const skill = opts.skill;
  // Heuristic mapping: skill → category. Refine as workflows grow.
  const categoryMap: Record<string, string> = {
    'capital-call-prep': 'capital_call',
    'fee-reconciliation': 'fee_correction',
    'k1-generation': 'investor_data_export',
  };
  const category = categoryMap[skill];
  if (!category) return { ok: true };
  const threshold = approvals.thresholds.find((t: { category: string }) => t.category === category);
  if (!threshold) return { ok: true };
  const amount = Number(opts.input.amount_usd ?? opts.input.total_call_amount_mm ?? 0) * (opts.input.total_call_amount_mm ? 1_000_000 : 1);
  if (amount >= threshold.amount_usd) {
    const have = (opts.approvers ?? []).length;
    if (have < threshold.approvers_required) {
      return { ok: false, reason: `requires ${threshold.approvers_required} approvers (${threshold.roles.join(', ')}), got ${have}` };
    }
  }
  return { ok: true };
}

function auditAppend(line: Record<string, unknown>): string {
  fs.mkdirSync(AUDIT_DIR, { recursive: true });
  const today = new Date().toISOString().slice(0, 10);
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const entry = { ts: new Date().toISOString(), audit_id: id, ...line };
  fs.appendFileSync(path.join(AUDIT_DIR, `${today}.jsonl`), JSON.stringify(entry) + '\n');
  return id;
}

export async function invoke(opts: InvokeOptions): Promise<InvokeResult> {
  const skill = loadSkill(opts.skill);
  if (!skill) {
    return { ok: false, skill: opts.skill, blocked: { reason: 'unknown skill' }, audit_id: auditAppend({ event: 'BLOCK', reason: 'unknown_skill', skill: opts.skill, user: opts.user }) };
  }

  const gate = approvalGate(opts);
  if (!gate.ok) {
    const id = auditAppend({ event: 'BLOCK', reason: gate.reason, skill: opts.skill, user: opts.user });
    return { ok: false, skill: opts.skill, blocked: { reason: gate.reason }, audit_id: id };
  }

  // Scrub PII from inputs before sending to any external LLM.
  const scrubbed = redactPII(JSON.stringify(opts.input));
  const audit_id = auditAppend({ event: 'INVOKE', skill: opts.skill, user: opts.user, pii_counts: scrubbed.counts });

  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      ok: true,
      skill: opts.skill,
      output: { stub: true, message: 'No ANTHROPIC_API_KEY set — returning skill metadata only.', skill_md_excerpt: skill.skillMd.slice(0, 400) },
      audit_id,
    };
  }

  try {
    const sdk = await import('@anthropic-ai/claude-agent-sdk').catch(() => null);
    if (!sdk) {
      return { ok: true, skill: opts.skill, output: { stub: true, message: 'SDK not installed yet — run npm install.' }, audit_id };
    }

    const composedPrompt = [
      '# Skill Definition', skill.skillMd, '',
      '# Operating Prompt', skill.promptMd, '',
      '# Inputs', '```json', scrubbed.redacted, '```', '',
      'Execute the skill above against the inputs. Return your final answer as JSON in a fenced code block.',
    ].join('\n');

    const collected: unknown[] = [];
    let finalText = '';
    const q = (sdk as { query: (p: { prompt: string; options?: Record<string, unknown> }) => AsyncIterable<{ type: string; result?: string }> }).query({
      prompt: composedPrompt,
      options: { cwd: REPO_ROOT, maxTurns: 8 },
    });

    for await (const msg of q) {
      collected.push(msg);
      if (msg.type === 'result' && typeof msg.result === 'string') finalText = msg.result;
    }

    auditAppend({ event: 'COMPLETE', skill: opts.skill, user: opts.user, audit_id, message_count: collected.length });
    return { ok: true, skill: opts.skill, output: { text: finalText, messages: collected }, audit_id };
  } catch (err) {
    auditAppend({ event: 'ERROR', skill: opts.skill, user: opts.user, error: String(err), audit_id });
    return { ok: false, skill: opts.skill, blocked: { reason: String(err) }, audit_id };
  }
}

export function readAudit(date?: string, limit = 200): unknown[] {
  const day = date ?? new Date().toISOString().slice(0, 10);
  const file = path.join(AUDIT_DIR, `${day}.jsonl`);
  if (!fs.existsSync(file)) return [];
  return fs
    .readFileSync(file, 'utf8')
    .trim()
    .split('\n')
    .slice(-limit)
    .map((line) => {
      try { return JSON.parse(line); } catch { return { raw: line }; }
    });
}
