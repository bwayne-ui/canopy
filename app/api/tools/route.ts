import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const tools = await prisma.tool.findMany({ orderBy: { name: 'asc' } });
  return NextResponse.json({
    items: tools.map((t) => ({
      id: t.id, toolId: t.toolId, name: t.name, description: t.description,
      category: t.category, builtBy: t.builtBy, status: t.status, version: t.version,
      language: t.language, runCount: t.runCount,
      lastRunDate: t.lastRunDate ? t.lastRunDate.toISOString().split('T')[0] : null,
      tags: t.tags ? t.tags.split(',') : [],
    })),
  });
}
