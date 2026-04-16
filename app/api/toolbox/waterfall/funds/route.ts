import { NextRequest, NextResponse } from 'next/server';
import { prisma as db } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const funds = await db.wfFund.findMany({
      include: {
        terms: true,
        _count: { select: { exceptions: true } },
        entity: {
          select: {
            id: true,
            name: true,
            entityId: true,
            client: { select: { id: true, name: true, shortName: true } },
          },
        },
      },
      orderBy: { totalCommitment: 'desc' },
    });
    return NextResponse.json(funds);
  } catch (err) {
    console.error('[waterfall/funds] GET error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// Finds or creates a WfFund for the given entityId, deriving waterfall structure
// from the Entity's economics fields.
export async function POST(req: NextRequest) {
  try {
    const { entityId } = await req.json() as { entityId: string };
    if (!entityId) {
      return NextResponse.json({ error: 'entityId is required' }, { status: 400 });
    }

    // If a WfFund already exists for this entity, return it
    const existing = await db.wfFund.findUnique({ where: { entityId } });
    if (existing) {
      return NextResponse.json({ fundId: existing.id });
    }

    // Look up entity and its client
    const entity = await db.entity.findUnique({
      where: { id: entityId },
      include: { client: true },
    });
    if (!entity) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 });
    }

    const carryPct    = Number(entity.carryPct    ?? 0.20);
    const prefRate    = Number(entity.prefRatePct  ?? 0.08);
    const mgmtFee     = Number(entity.mgmtFeePct   ?? 0.02);
    const waterfallType = (entity.waterfallType ?? 'european').toLowerCase();
    const catchupType   = (entity.catchUpType   ?? 'full').toLowerCase();
    const mgmtFeeBasis  = (entity.mgmtFeeBasis  ?? 'committed').toLowerCase();

    // Derive waterfall steps from carry structure
    const steps = waterfallType === 'european'
      ? [
          { stepOrder: 1, stepName: 'Return of Capital',     lpSplit: 1.00, gpSplit: 0.00, description: 'Return LP capital contributions' },
          { stepOrder: 2, stepName: `Preferred Return (${Math.round(prefRate * 100)}%)`, lpSplit: 1.00, gpSplit: 0.00, description: `Compound ${Math.round(prefRate * 100)}% preferred return` },
          { stepOrder: 3, stepName: 'GP Catch-Up',           lpSplit: catchupType === 'none' ? 1.00 : 0.00, gpSplit: catchupType === 'none' ? 0.00 : 1.00, description: catchupType === 'none' ? 'No catch-up provision' : 'GP catch-up to carry percentage' },
          { stepOrder: 4, stepName: 'Carried Interest Split',lpSplit: 1 - carryPct, gpSplit: carryPct, description: `${Math.round((1 - carryPct) * 100)}/${Math.round(carryPct * 100)} split of remaining distributions` },
        ]
      : [
          { stepOrder: 1, stepName: 'Return of Capital',     lpSplit: 1.00, gpSplit: 0.00, description: 'Return LP capital contributions' },
          { stepOrder: 2, stepName: `Preferred Return (${Math.round(prefRate * 100)}%)`, lpSplit: 1.00, gpSplit: 0.00, description: `${Math.round(prefRate * 100)}% preferred return` },
          { stepOrder: 3, stepName: 'Carried Interest',      lpSplit: 1 - carryPct, gpSplit: carryPct, description: `${Math.round((1 - carryPct) * 100)}/${Math.round(carryPct * 100)} split — American waterfall` },
        ];

    const fund = await db.wfFund.create({
      data: {
        entityId,
        name:             entity.name,
        shortName:        entity.entityId ?? entity.name.slice(0, 8),
        strategy:         entity.strategy  ?? 'Private Equity',
        waterfallType,
        status:           'active',
        vintage:          entity.vintage   ?? new Date().getFullYear(),
        totalCommitment:  Number(entity.commitmentMm  ?? 0) * 1_000_000,
        totalNav:         Number(entity.navMm          ?? 0) * 1_000_000,
        totalDistributed: Number(entity.distributedCapitalMm ?? 0) * 1_000_000,
        totalUnrealized:  Number(entity.navMm          ?? 0) * 1_000_000,
        validationStatus: 'pending',
        terms: {
          create: {
            hurdleRate:       prefRate,
            carryPct,
            catchupType,
            mgmtFeeRate:      mgmtFee,
            mgmtFeeBasis,
            fundLife:         10,
            investmentPeriod: 5,
            preferredReturn:  prefRate,
          },
        },
        waterfallSteps: { create: steps },
      },
    });

    await db.wfAuditLog.create({
      data: {
        entityType: 'fund',
        entityId:   fund.id,
        action:     'created',
        note:       `Waterfall analysis created for ${entity.name} (${entity.client?.shortName ?? entity.entityId})`,
      },
    });

    return NextResponse.json({ fundId: fund.id });
  } catch (err) {
    console.error('[waterfall/funds] POST error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
