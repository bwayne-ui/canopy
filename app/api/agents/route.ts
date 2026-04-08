import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { toNum } from '@/lib/utils';

export async function GET() {
  const agents = await prisma.agent.findMany({ orderBy: { name: 'asc' } });
  return NextResponse.json({
    items: agents.map((a) => ({
      id: a.id, name: a.name, description: a.description, category: a.category,
      provider: a.provider, status: a.status, rating: a.rating ? toNum(a.rating) : null,
      reviewCount: a.reviewCount, monthlyPrice: a.monthlyPrice ? toNum(a.monthlyPrice) : null,
      capabilities: JSON.parse(a.capabilities), icon: a.icon,
    })),
  });
}
