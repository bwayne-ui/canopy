import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const tags = await prisma.fundFamilyTag.findMany({ orderBy: { tag: 'asc' } });
  return NextResponse.json({ items: tags });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { tag, description, color } = body;
  if (!tag) return NextResponse.json({ error: 'tag is required' }, { status: 400 });

  const created = await prisma.fundFamilyTag.create({
    data: { tag, description, color },
  });
  return NextResponse.json(created, { status: 201 });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  await prisma.fundFamilyTag.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
