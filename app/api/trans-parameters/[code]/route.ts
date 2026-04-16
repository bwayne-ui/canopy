import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  _req: Request,
  { params }: { params: { code: string } },
) {
  const param = await prisma.transactionParameter.findUnique({
    where: { code: params.code },
    include: { fundOverrides: true },
  });
  if (!param) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ param });
}

export async function PATCH(
  req: Request,
  { params }: { params: { code: string } },
) {
  try {
    const body = await req.json();
    const { fundId, fundName, ...overrideFields } = body;

    if (fundId) {
      // Upsert a per-fund override
      const override = await prisma.fundTransactionOverride.upsert({
        where: { transParamCode_fundId: { transParamCode: params.code, fundId } },
        create: { transParamCode: params.code, fundId, fundName, ...overrideFields },
        update: { fundName, ...overrideFields },
      });
      return NextResponse.json({ override });
    }

    // Update global default
    const allowed = [
      'glDebit', 'glCredit', 'journalType', 'recallable', 'feeOffset',
      'feeOffsetType', 'waterfallTier', 'settlementDays', 'autoReconcile',
      'approvalRequired', 'taxReporting', 'notes', 'isActive',
    ];
    const update: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) update[key] = body[key];
    }

    const updated = await prisma.transactionParameter.update({
      where: { code: params.code },
      data: update,
    });
    return NextResponse.json({ param: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
