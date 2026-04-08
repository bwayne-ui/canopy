// agent/evaluation/runner.ts
// Run an eval suite against a skill, score it, append metrics, propose improvements on regression.
//
// Usage: npx tsx agent/evaluation/runner.ts <skill-name>
//
// This is the spine of the self-improvement loop. It is intentionally simple:
//   1. Load the skill's eval suite (golden cases under eval-suites/<skill>/).
//   2. For each case, "run" it (stub for now — wires to lib/agent-client.ts when API key is set).
//   3. Compare to expected output with field-level tolerances.
//   4. Score the suite. Append a JSONL line to metrics.jsonl.
//   5. If score regressed vs the prior run, draft a skill proposal under learning/skill-proposals/.

import * as fs from 'node:fs';
import * as path from 'node:path';

const REPO_ROOT = path.resolve(__dirname, '../..');
const SKILLS_DIR = path.join(REPO_ROOT, 'agent', 'skills');
const SUITES_DIR = path.join(REPO_ROOT, 'agent', 'evaluation', 'eval-suites');
const METRICS_FILE = path.join(REPO_ROOT, 'agent', 'evaluation', 'metrics.jsonl');
const PROPOSALS_DIR = path.join(REPO_ROOT, 'agent', 'learning', 'skill-proposals');

interface EvalCase {
  name: string;
  input: unknown;
  expected_output?: Record<string, unknown>;
  tolerances?: Record<string, number>;
}

interface SuiteResult {
  skill: string;
  ts: string;
  total: number;
  passed: number;
  failed: number;
  score: number;
  failures: { case: string; reason: string }[];
}

function loadSuite(skill: string): EvalCase[] {
  const dir = path.join(SUITES_DIR, skill);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      const raw = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
      return { name: f.replace(/\.json$/, ''), ...raw };
    });
}

async function runCase(skill: string, c: EvalCase): Promise<{ passed: boolean; reason?: string; actual?: unknown }> {
  // Stub mode: no API key → just verify the case has an expected_output and pass.
  if (!process.env.ANTHROPIC_API_KEY) {
    if (!c.expected_output) return { passed: false, reason: 'no expected_output (stub mode)' };
    return { passed: true };
  }

  // Live mode: invoke the skill via the agent client.
  const { invoke } = await import('../../lib/agent-client');
  const result = await invoke({ skill, input: c.input as Record<string, unknown>, user: 'eval-runner' });
  if (!result.ok) return { passed: false, reason: result.blocked?.reason ?? 'invoke failed' };

  // Extract the JSON block from the agent's text output.
  const text = (result.output as { text?: string })?.text ?? '';
  const match = text.match(/```json\s*([\s\S]*?)```/);
  if (!match) return { passed: false, reason: 'no JSON block in agent output', actual: text.slice(0, 500) };

  let actual: Record<string, unknown>;
  try {
    actual = JSON.parse(match[1]);
  } catch (err) {
    return { passed: false, reason: `JSON parse: ${err}`, actual: match[1].slice(0, 500) };
  }

  // Compare expected fields with field-level tolerances.
  const expected = c.expected_output ?? {};
  const tolerances = c.tolerances ?? {};
  for (const [key, expVal] of Object.entries(expected)) {
    const actVal = actual[key];
    if (typeof expVal === 'number' && typeof actVal === 'number') {
      const tol = tolerances[key] ?? 0;
      if (Math.abs(actVal - expVal) > tol) {
        return { passed: false, reason: `${key}: expected ${expVal} ±${tol}, got ${actVal}`, actual };
      }
    } else if (JSON.stringify(actVal) !== JSON.stringify(expVal)) {
      return { passed: false, reason: `${key}: expected ${JSON.stringify(expVal)}, got ${JSON.stringify(actVal)}`, actual };
    }
  }
  return { passed: true, actual };
}

function priorScore(skill: string): number | null {
  if (!fs.existsSync(METRICS_FILE)) return null;
  const lines = fs.readFileSync(METRICS_FILE, 'utf8').trim().split('\n').reverse();
  for (const line of lines) {
    try {
      const r = JSON.parse(line) as SuiteResult;
      if (r.skill === skill) return r.score;
    } catch {}
  }
  return null;
}

function proposeImprovement(skill: string, result: SuiteResult, prior: number) {
  fs.mkdirSync(PROPOSALS_DIR, { recursive: true });
  const file = path.join(PROPOSALS_DIR, `${skill}-regression-${Date.now()}.md`);
  const body = `# Regression in ${skill}

**Detected:** ${result.ts}
**Prior score:** ${prior.toFixed(3)}
**Current score:** ${result.score.toFixed(3)}
**Delta:** ${(result.score - prior).toFixed(3)}

## Failures
${result.failures.map((f) => `- **${f.case}**: ${f.reason}`).join('\n')}

## Proposed action
- [ ] Review the failing cases above
- [ ] Update \`agent/skills/${skill}/prompt.md\` with explicit guidance for the failure mode
- [ ] Add a regression test under \`agent/evaluation/eval-suites/${skill}/\`
- [ ] Re-run \`npx tsx agent/evaluation/runner.ts ${skill}\` until score >= ${prior.toFixed(3)}

This proposal was drafted automatically. Human review required before promoting any change.
`;
  fs.writeFileSync(file, body);
  console.log(`Drafted regression proposal: ${file}`);
}

async function main() {
  const skill = process.argv[2];
  if (!skill) {
    console.error('Usage: npx tsx agent/evaluation/runner.ts <skill-name>');
    process.exit(1);
  }
  if (!fs.existsSync(path.join(SKILLS_DIR, skill))) {
    console.error(`Unknown skill: ${skill}`);
    process.exit(1);
  }

  const cases = loadSuite(skill);
  if (cases.length === 0) {
    console.error(`No eval suite found for ${skill}. Add cases under agent/evaluation/eval-suites/${skill}/`);
    process.exit(1);
  }

  const failures: { case: string; reason: string }[] = [];
  let passed = 0;
  for (const c of cases) {
    const r = await runCase(skill, c);
    if (r.passed) passed++;
    else failures.push({ case: c.name, reason: r.reason ?? 'unknown' });
  }

  const result: SuiteResult = {
    skill,
    ts: new Date().toISOString(),
    total: cases.length,
    passed,
    failed: cases.length - passed,
    score: passed / cases.length,
    failures,
  };

  fs.mkdirSync(path.dirname(METRICS_FILE), { recursive: true });
  fs.appendFileSync(METRICS_FILE, JSON.stringify(result) + '\n');
  console.log(JSON.stringify(result, null, 2));

  const prior = priorScore(skill);
  if (prior !== null && result.score < prior) {
    proposeImprovement(skill, result, prior);
  }
}

main();
