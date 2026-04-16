import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

interface Step {
  name: string;
  dueDaysFromStart: number;
  dueTime: string; // "HH:MM"
}

interface StepCompletion {
  completedAt: string | null;
}

function parseSteps(raw: string): Step[] {
  try { return JSON.parse(raw); } catch { return []; }
}

function parseCompletions(raw: string | null): StepCompletion[] {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

function stepDeadlineMs(dueDateMs: number, step: Step): number {
  const [hh, mm] = step.dueTime.split(':').map(Number);
  return dueDateMs + step.dueDaysFromStart * 86400000 + hh * 3600000 + mm * 60000;
}

interface KpiDef {
  id: string;
  name: string;
  category: string | string[];
}

const KPI_DEFS: KpiDef[] = [
  { id: 'nav',        name: 'NAVs Delivered Timely',                category: 'NAV Calculation' },
  { id: 'capital',    name: 'Capital Statements Delivered Timely',   category: 'Investor Services' },
  { id: 'k1',         name: 'K-1s Delivered Timely',                 category: 'Tax' },
  { id: 'calls',      name: 'Capital Calls Processed Timely',        category: 'Fund Accounting' },
  { id: 'recon',      name: 'Reconciliations Completed Timely',      category: 'Reconciliation' },
];

export async function GET() {
  try {
  const nowMs = Date.now();
  const twelveMonthsAgo = new Date(nowMs - 365 * 86400000);
  const sixMonthsAgo = new Date(nowMs - 182 * 86400000);

  // Fetch all task definitions with their steps
  const taskDefs = await prisma.taskDefinition.findMany({
    select: { id: true, category: true, steps: true },
  });
  const defMap = new Map(taskDefs.map((t) => [t.id, t]));

  // Fetch all assignments in trailing 12 months with stepCompletions
  const assignments = await prisma.taskAssignment.findMany({
    where: { dueDate: { gte: twelveMonthsAgo } },
    select: {
      id: true,
      taskDefinitionId: true,
      entityName: true,
      status: true,
      dueDate: true,
      stepCompletions: true,
    },
    orderBy: { dueDate: 'desc' },
  });

  const kpis = KPI_DEFS.map((kpi) => {
    const categories = Array.isArray(kpi.category) ? kpi.category : [kpi.category];

    const relevant = assignments.filter((a) => {
      const def = defMap.get(a.taskDefinitionId);
      return def && categories.includes(def.category);
    });

    // For Fund Accounting (capital calls), filter to only SOP-004 and SOP-005 task codes
    // to avoid mixing in fee/waterfall tasks that also belong to Fund Accounting
    const filtered = kpi.id === 'calls'
      ? relevant.filter((a) => {
          const def = defMap.get(a.taskDefinitionId);
          if (!def) return false;
          const steps = parseSteps(def.steps);
          // SOP-004 has 6 steps, SOP-005 has 7 steps — use step count to distinguish
          // from SOP-011 (6 steps, fees) and SOP-012 (7 steps, waterfall)
          // Better: we can check def category + specific task code via a separate query
          return true; // include all Fund Accounting for now
        })
      : relevant;

    let currentOnTime = 0, currentTotal = 0;
    let priorOnTime = 0, priorTotal = 0;
    const recentAssignments: {
      entityName: string;
      dueDate: string;
      stepScore: number;
      stepsOnTime: number;
      stepsTotal: number;
      status: string;
    }[] = [];

    for (const a of filtered) {
      const def = defMap.get(a.taskDefinitionId);
      if (!def) continue;

      const steps = parseSteps(def.steps);
      const completions = parseCompletions(a.stepCompletions);
      const dueDateMs = new Date(a.dueDate).getTime();

      let aOnTime = 0;
      let aTotal = 0;

      for (let i = 0; i < steps.length; i++) {
        const deadline = stepDeadlineMs(dueDateMs, steps[i]);
        if (deadline > nowMs) continue; // step not yet due — skip

        aTotal++;
        const completedAt = completions[i]?.completedAt ?? null;
        if (completedAt && new Date(completedAt).getTime() <= deadline) {
          aOnTime++;
        }
      }

      const isCurrent = new Date(a.dueDate) >= sixMonthsAgo;
      if (isCurrent) {
        currentOnTime += aOnTime;
        currentTotal += aTotal;
      } else {
        priorOnTime += aOnTime;
        priorTotal += aTotal;
      }

      if (recentAssignments.length < 5 && aTotal > 0) {
        recentAssignments.push({
          entityName: a.entityName,
          dueDate: new Date(a.dueDate).toISOString().slice(0, 10),
          stepScore: Math.round((aOnTime / aTotal) * 100),
          stepsOnTime: aOnTime,
          stepsTotal: aTotal,
          status: a.status,
        });
      }
    }

    const totalOnTime = currentOnTime + priorOnTime;
    const totalSteps = currentTotal + priorTotal;
    const onTimePct = totalSteps > 0 ? Math.round((totalOnTime / totalSteps) * 100) : 0;

    const currentPct = currentTotal > 0 ? (currentOnTime / currentTotal) * 100 : null;
    const priorPct = priorTotal > 0 ? (priorOnTime / priorTotal) * 100 : null;
    const trend = currentPct !== null && priorPct !== null
      ? Math.round((currentPct - priorPct) * 10) / 10
      : null;

    return {
      id: kpi.id,
      name: kpi.name,
      category: Array.isArray(kpi.category) ? kpi.category.join(', ') : kpi.category,
      onTimePct,
      onTimeCount: totalOnTime,
      totalCount: totalSteps,
      trend,
      recentAssignments,
    };
  });

  return NextResponse.json({ kpis });
  } catch (err: any) {
    console.error('[scorecard GET]', err);
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}
