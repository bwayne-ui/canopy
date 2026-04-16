import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const fundId = searchParams.get('fundId');

  const params = await prisma.transactionParameter.findMany({
    where: category ? { ilpaCategory: category } : undefined,
    orderBy: [{ sortOrder: 'asc' }, { code: 'asc' }],
    include: {
      fundOverrides: fundId
        ? { where: { fundId } }
        : false,
    },
  });

  return NextResponse.json({ params });
}
