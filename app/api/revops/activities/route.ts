import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const opportunityId = searchParams.get('opportunityId')
  const accountId = searchParams.get('accountId')

  const where: Record<string, string> = {}
  if (opportunityId) where.opportunityId = opportunityId
  if (accountId) where.accountId = accountId

  const records = await prisma.activity.findMany({
    where: Object.keys(where).length > 0 ? where : undefined,
    orderBy: { activityDate: 'desc' },
  })

  return NextResponse.json({ items: records })
}

export async function POST(request: Request) {
  const body = await request.json()
  const {
    type,
    subject,
    description,
    outcome,
    direction,
    durationMinutes,
    activityDate,
    accountId,
    accountName,
    contactId,
    contactName,
    opportunityId,
    opportunityName,
    ownerName,
    nextStepDate,
  } = body

  const activity = await prisma.activity.create({
    data: {
      activityId: `ACT-${Date.now()}`,
      type: type ?? 'Note',
      subject,
      description,
      outcome,
      direction,
      durationMinutes,
      activityDate: activityDate ? new Date(activityDate) : new Date(),
      accountId,
      accountName,
      contactId,
      contactName,
      opportunityId,
      opportunityName,
      ownerName,
      nextStepDate: nextStepDate ? new Date(nextStepDate) : undefined,
    },
  })

  return NextResponse.json(activity)
}
