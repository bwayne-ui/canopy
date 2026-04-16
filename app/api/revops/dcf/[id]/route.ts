import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { toNum } from '@/lib/utils'

/**
 * GET  /api/revops/dcf/[id]
 * Returns the full DCF submission by Prisma ID or dcfId.
 */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  // Accept either the cuid `id` or the human-readable `dcfId`
  const submission = await prisma.dcfSubmission.findFirst({
    where: {
      OR: [{ id: params.id }, { dcfId: params.id }],
    },
    include: {
      entities: { orderBy: { sortOrder: 'asc' } },
      advisors: true,
      bankAccounts: true,
      integrations: true,
    },
  })

  if (!submission) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json(formatSubmission(submission))
}

/**
 * PUT  /api/revops/dcf/[id]
 * Partial update — supports updating header fields and status transitions.
 * Does NOT update nested entities/advisors (use entity-specific endpoints when built).
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const body = await request.json()

  // Status transition side-effects
  const updateData: Record<string, unknown> = { ...body }
  if (body.status === 'Submitted' && !body.submittedAt) {
    updateData.submittedAt = new Date()
  }
  if ((body.status === 'Complete' || body.status === 'Rejected') && !body.reviewedAt) {
    updateData.reviewedAt = new Date()
  }

  // Strip nested relations from the top-level update to avoid Prisma errors
  delete updateData.entities
  delete updateData.advisors
  delete updateData.bankAccounts
  delete updateData.integrations

  const updated = await prisma.dcfSubmission.update({
    where: { id: params.id },
    data: updateData,
    include: {
      entities: { orderBy: { sortOrder: 'asc' } },
      advisors: true,
      bankAccounts: true,
      integrations: true,
    },
  })

  return NextResponse.json(formatSubmission(updated))
}

/**
 * DELETE  /api/revops/dcf/[id]
 * Deletes a Draft DCF submission. Active/Submitted submissions cannot be deleted.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const existing = await prisma.dcfSubmission.findUnique({ where: { id: params.id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (existing.status !== 'Draft') {
    return NextResponse.json(
      { error: `Cannot delete a DCF submission with status "${existing.status}". Only Draft submissions may be deleted.` },
      { status: 422 }
    )
  }

  await prisma.dcfSubmission.delete({ where: { id: params.id } })
  return NextResponse.json({ deleted: true })
}

type FullSubmission = Awaited<ReturnType<typeof prisma.dcfSubmission.findFirstOrThrow>> & {
  entities: Awaited<ReturnType<typeof prisma.dcfEntity.findMany>>;
  advisors: Awaited<ReturnType<typeof prisma.dcfAdvisor.findMany>>;
  bankAccounts: Awaited<ReturnType<typeof prisma.dcfBankAccount.findMany>>;
  integrations: Awaited<ReturnType<typeof prisma.dcfIntegration.findMany>>;
}

function formatSubmission(s: FullSubmission) {
  return {
    ...s,
    entities: s.entities.map((e) => ({
      ...e,
      currentCommittedCapitalMm: toNum(e.currentCommittedCapitalMm),
      targetCommittedCapitalMm: toNum(e.targetCommittedCapitalMm),
      twelveMonthTargetMm: toNum(e.twelveMonthTargetMm),
      currentCalledCapitalMm: toNum(e.currentCalledCapitalMm),
      avgLoanSizeMm: toNum(e.avgLoanSizeMm),
      drawdownPct: toNum(e.drawdownPct),
    })),
  }
}
