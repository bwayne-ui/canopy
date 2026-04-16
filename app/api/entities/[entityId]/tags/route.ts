import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function PUT(
  request: Request,
  { params }: { params: { entityId: string } }
) {
  const body = await request.json();
  const { tags } = body; // string[]

  const updated = await prisma.entity.update({
    where: { id: params.entityId },
    data: { fundFamilyTags: JSON.stringify(tags ?? []) },
  });

  return NextResponse.json({ id: updated.id, fundFamilyTags: updated.fundFamilyTags });
}
