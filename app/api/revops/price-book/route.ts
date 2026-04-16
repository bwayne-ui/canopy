import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { toNum } from '@/lib/utils'

export async function GET() {
  const records = await prisma.priceBook.findMany({
    where: { isActive: true },
    orderBy: [{ service: 'asc' }, { aumTierMin: 'asc' }],
  })

  const items = records.map((p) => ({
    ...p,
    aumTierMin: toNum(p.aumTierMin),
    aumTierMax: toNum(p.aumTierMax),
    pricePerEntity: toNum(p.pricePerEntity),
  }))

  return NextResponse.json({ items })
}
