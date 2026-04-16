import { NextRequest, NextResponse } from 'next/server';
import { prisma as db } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST(_req: NextRequest, { params }: { params: { batchId: string } }) {
  const batch = await db.wfDiuBatch.update({
    where: { id: params.batchId },
    data: { status: 'posted', postedAt: new Date() },
  });
  await db.wfAuditLog.create({
    data: {
      entityType: 'diu_batch',
      entityId: params.batchId,
      action: 'posted',
      note: `DIU ${batch.batchRef} marked as posted to Investran`,
    },
  });
  return NextResponse.json(batch);
}
