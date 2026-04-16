import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const contact = await prisma.contact.findUniqueOrThrow({
    where: { id: params.id },
    include: {
      opportunityRoles: true,
      activities: true,
    },
  })

  return NextResponse.json(contact)
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json()

  const contact = await prisma.contact.update({
    where: { id: params.id },
    data: body,
  })

  return NextResponse.json(contact)
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  await prisma.contact.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
