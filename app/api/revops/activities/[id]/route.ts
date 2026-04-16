import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json()

  const activity = await prisma.activity.update({
    where: { id: params.id },
    data: body,
  })

  return NextResponse.json(activity)
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  await prisma.activity.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
