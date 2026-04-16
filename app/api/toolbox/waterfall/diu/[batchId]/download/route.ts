import { NextRequest, NextResponse } from 'next/server';
import { prisma as db } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(_req: NextRequest, { params }: { params: { batchId: string } }) {
  const batch = await db.wfDiuBatch.findUnique({ where: { id: params.batchId } });
  if (!batch) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return new NextResponse(batch.fileContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${batch.batchRef}.csv"`,
    },
  });
}
