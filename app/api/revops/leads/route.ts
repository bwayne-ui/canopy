import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')

  const where = status ? { status } : undefined

  const records = await prisma.lead.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ items: records })
}

export async function POST(request: Request) {
  const body = await request.json()
  const {
    firstName,
    lastName,
    email,
    phone,
    company,
    title,
    leadSource,
    ownerName,
    notes,
  } = body

  const lead = await prisma.lead.create({
    data: {
      leadId: `LEAD-${Date.now()}`,
      firstName,
      lastName,
      email,
      phone,
      company,
      title,
      leadSource: leadSource ?? 'Inbound',
      ownerName,
      notes,
      assignedAt: new Date(),
    },
  })

  return NextResponse.json(lead)
}
