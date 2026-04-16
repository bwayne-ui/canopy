import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { toNum } from '@/lib/utils';

export async function GET(_req: Request, { params }: { params: { securityId: string } }) {
  try {
    const security = await prisma.security.findUnique({
      where: { securityId: params.securityId },
      include: {
        entityLinks: {
          include: {
            entity: {
              select: {
                id: true,
                entityId: true,
                name: true,
                entityType: true,
                strategy: true,
                client: { select: { id: true, name: true, shortName: true } },
              },
            },
          },
          orderBy: { acquisitionDate: 'asc' },
        },
      },
    });

    if (!security) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const d = (v: any) => v ? toNum(v) : null;
    const dt = (v: Date | null | undefined) => v?.toISOString().slice(0, 10) ?? null;

    return NextResponse.json({
      security: {
        id: security.id,
        securityId: security.securityId,
        name: security.name,
        securityType: security.securityType,
        issuer: security.issuer,
        ticker: security.ticker,
        cusip: security.cusip,
        isin: security.isin,
        currency: security.currency,
        sector: security.sector,
        country: security.country,
        marketValue: d(security.marketValue),
        costBasis: d(security.costBasis),
        unrealizedGain: d(security.unrealizedGain),
        quantity: d(security.quantity),
        pricePerUnit: d(security.pricePerUnit),
        lastPriceDate: dt(security.lastPriceDate),
        maturityDate: dt(security.maturityDate),
        creditRating: security.creditRating,
        ratingAgency: security.ratingAgency,
        createdAt: security.createdAt.toISOString(),
        updatedAt: security.updatedAt.toISOString(),
      },
      entityLinks: security.entityLinks.map((l) => ({
        id: l.id,
        entityId: l.entity.entityId,
        entityName: l.entity.name,
        entityType: l.entity.entityType,
        strategy: l.entity.strategy,
        clientName: l.entity.client.name,
        clientShortName: l.entity.client.shortName,
        // client-specific setup
        financialStatementName: l.financialStatementName,
        clientNickname: l.clientNickname,
        dealPartner: l.dealPartner,
        investmentThesis: l.investmentThesis,
        // economics
        acquisitionDate: dt(l.acquisitionDate),
        exitDate: dt(l.exitDate),
        costAtAcquisition: d(l.costAtAcquisition),
        currentCarryingValue: d(l.currentCarryingValue),
        ownershipPct: d(l.ownershipPct),
        // operational
        isActiveHolding: l.isActiveholding,
        watchlistFlag: l.watchlistFlag,
        notes: l.notes,
      })),
    });
  } catch (err: any) {
    console.error('[securities GET]', err);
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 });
  }
}
