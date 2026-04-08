import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const rules = await prisma.rule.findMany({ orderBy: { priority: 'asc' } });
  return NextResponse.json({
    items: rules.map((r) => ({
      id: r.id, ruleId: r.ruleId, name: r.name, description: r.description,
      ruleType: r.ruleType, formula: r.formula,
      inputFields: JSON.parse(r.inputFields), outputField: r.outputField,
      dependsOn: JSON.parse(r.dependsOn), priority: r.priority,
      status: r.status, category: r.category,
    })),
  });
}
