import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { toNum } from '@/lib/utils'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')

  const where = status ? { status } : undefined

  const records = await prisma.account.findMany({
    where,
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { contacts: true, opportunities: true },
      },
    },
  })

  const items = records.map((a) => ({
    id: a.id,
    accountId: a.accountId,
    name: a.name,
    industry: a.industry,
    hqCity: a.hqCity,
    region: a.region,
    aumMm: toNum(a.aumMm),
    status: a.status,
    ownerName: a.ownerName,
    contactCount: a._count.contacts,
    oppCount: a._count.opportunities,
  }))

  return NextResponse.json({ items })
}

export async function POST(request: Request) {
  const body = await request.json()
  const {
    name,
    industry,
    hqCity,
    hqState,
    hqCountry,
    region,
    aumMm,
    website,
    domain,
    ownerName,
    status,
  } = body

  const account = await prisma.account.create({
    data: {
      accountId: `ACC-${Date.now()}`,
      name,
      industry,
      hqCity,
      hqState,
      hqCountry,
      region,
      aumMm,
      website,
      domain,
      ownerName,
      status: status ?? 'Prospect',
    },
  })

  return NextResponse.json(account)
}
