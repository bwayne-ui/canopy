import { Persona } from './personas';

export interface AnswerRow {
  label: string;
  value: string;
  hint?: string;
}

export interface Answer {
  headline: string;
  rows: AnswerRow[];
  source: string;
}

const BANK: Record<string, Answer[]> = {
  'Fund Admin': [
    {
      headline: 'NAV close is 82% complete across active entities',
      rows: [
        { label: 'Walker III', value: 'Posted', hint: 'Reviewer: M. Lin · 04-07' },
        { label: 'Campbell IV', value: 'In review', hint: 'Blocked on pricing — Bloomberg feed' },
        { label: 'Sullivan Alpha', value: 'In progress', hint: 'ETA 04-10' },
      ],
      source: 'nav-calc skill · audit #a41f',
    },
    {
      headline: '3 clients flagged for escalation this week',
      rows: [
        { label: 'Cruz Ventures II', value: 'SLA miss', hint: 'Distribution notice >48h late' },
        { label: 'Harbor Peak', value: 'Churn risk', hint: 'NPS −12 QoQ' },
        { label: 'Orion Bridge', value: 'Data gap', hint: 'Missing K-1 packets' },
      ],
      source: 'client-health · audit #a4a2',
    },
  ],
  BizOps: [
    {
      headline: '47 open Jira tickets across internal apps',
      rows: [
        { label: 'CANOPY-UI', value: '18 open', hint: '3 P1 · 15 P2' },
        { label: 'INGEST', value: '14 open', hint: '1 P0' },
        { label: 'ADMIN-TOOLS', value: '15 open', hint: 'No P0/P1' },
      ],
      source: 'jira.internal · synced 2m ago',
    },
  ],
  Recruiting: [
    {
      headline: '12 open reqs, 4 offers out this week',
      rows: [
        { label: 'Fund Accountant II', value: '3 open', hint: 'Avg 22d in pipeline' },
        { label: 'Sr FA Manager', value: '2 open', hint: 'Exec search' },
        { label: 'Platform Eng', value: '4 open', hint: '2 offers out' },
      ],
      source: 'greenhouse · 04-09',
    },
  ],
  Finance: [
    {
      headline: 'Month-end close 68% done — accounting pending on 2 entities',
      rows: [
        { label: 'GL reconciliation', value: 'Complete', hint: 'Closed 04-06' },
        { label: 'Fund accounting', value: '82% done', hint: '2 entities outstanding' },
        { label: 'Consolidation', value: 'Not started', hint: 'Blocked on FA' },
      ],
      source: 'workflow-status · audit #a510',
    },
  ],
  Engineering: [
    {
      headline: 'Velocity 48 pts last sprint (+12% vs trailing 4)',
      rows: [
        { label: 'Open P0/P1 bugs', value: '3', hint: '1 P0 · 2 P1' },
        { label: 'Deploys this month', value: '27', hint: '2.1/day' },
        { label: 'On-call queue', value: '5 active', hint: '1 paging' },
      ],
      source: 'jira + datadog',
    },
  ],
};

export function answerFor(persona: Persona, prompt: string): Answer {
  const bank = BANK[persona.department] ?? BANK['Fund Admin'];
  // naive keyword routing — pick the answer whose headline shares the most words with the prompt
  const p = prompt.toLowerCase();
  let best = bank[0];
  let bestScore = -1;
  for (const a of bank) {
    const score = a.headline.toLowerCase().split(/\W+/).filter((w) => w.length > 3 && p.includes(w)).length;
    if (score > bestScore) {
      best = a;
      bestScore = score;
    }
  }
  return best;
}
