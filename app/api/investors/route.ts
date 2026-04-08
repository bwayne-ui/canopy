import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { toNum } from '@/lib/utils';

export async function GET() {
  const investors = await prisma.investor.findMany({ orderBy: { name: 'asc' } });
  return NextResponse.json({
    items: investors.map((i) => ({
      id: i.id, investorId: i.investorId, name: i.name, investorType: i.investorType,
      commitmentMm: toNum(i.commitmentMm), navMm: i.navMm ? toNum(i.navMm) : null,
      domicile: i.domicile, entityName: i.entityName, status: i.status,
    })),
  });
}
