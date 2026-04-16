import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { toNum } from '@/lib/utils';

export async function GET(_req: Request, { params }: { params: { investorId: string } }) {
  const investor = await prisma.investor.findUnique({
    where: { investorId: params.investorId },
  });

  if (!investor) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const d = (v: any) => v ? toNum(v) : null;

  return NextResponse.json({
    investor: {
      id: investor.id,
      investorId: investor.investorId,
      name: investor.name,
      investorType: investor.investorType,
      domicile: investor.domicile,
      entityName: investor.entityName,
      status: investor.status,
      contactName: investor.contactName,
      contactEmail: investor.contactEmail,
      commitmentMm: d(investor.commitmentMm),
      calledCapitalMm: d(investor.calledCapitalMm),
      distributedMm: d(investor.distributedMm),
      navMm: d(investor.navMm),
      taxExempt: investor.taxExempt,
      erisa: investor.erisa,
      k1Status: investor.k1Status,
      createdAt: investor.createdAt.toISOString(),
      updatedAt: investor.updatedAt.toISOString(),
    },
  });
}
