import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const lead = await prisma.lead.findUniqueOrThrow({
    where: { id: params.id },
  })

  return NextResponse.json(lead)
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json()

  const lead = await prisma.lead.update({
    where: { id: params.id },
    data: body,
  })

  return NextResponse.json(lead)
}
