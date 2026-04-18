import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  const now = Date.now();
  const d7 = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const d30 = new Date(now - 30 * 24 * 60 * 60 * 1000);

  const [recent, byOutcome, sent7, sent30, sentAll, rejected7, rejected30, rejectedAll, uniqueJsEmails] = await Promise.all([
    prisma.loginAttempt.findMany({ orderBy: { createdAt: 'desc' }, take: 200 }),
    prisma.loginAttempt.groupBy({ by: ['outcome'], _count: { _all: true } }),
    prisma.loginAttempt.count({ where: { outcome: 'code_sent', createdAt: { gte: d7 } } }),
    prisma.loginAttempt.count({ where: { outcome: 'code_sent', createdAt: { gte: d30 } } }),
    prisma.loginAttempt.count({ where: { outcome: 'code_sent' } }),
    prisma.loginAttempt.count({ where: { outcome: 'domain_rejected', createdAt: { gte: d7 } } }),
    prisma.loginAttempt.count({ where: { outcome: 'domain_rejected', createdAt: { gte: d30 } } }),
    prisma.loginAttempt.count({ where: { outcome: 'domain_rejected' } }),
    prisma.loginAttempt.findMany({
      where: { outcome: 'code_verified', domainAllowed: true },
      distinct: ['emailLower'],
      select: { emailLower: true },
    }),
  ]);

  return NextResponse.json({
    recent,
    byOutcome,
    summary: {
      codesSent: { d7: sent7, d30: sent30, all: sentAll },
      domainRejected: { d7: rejected7, d30: rejected30, all: rejectedAll },
      uniqueVerifiedEmails: uniqueJsEmails.length,
    },
  });
}
