import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  const now = Date.now();
  const d7 = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const d30 = new Date(now - 30 * 24 * 60 * 60 * 1000);

  const [recent, success7, success30, successAll, failed7, failed30, failedAll, successfulByUser] = await Promise.all([
    prisma.loginAttempt.findMany({ orderBy: { createdAt: 'desc' }, take: 200 }),
    prisma.loginAttempt.count({ where: { outcome: 'login_success', createdAt: { gte: d7 } } }),
    prisma.loginAttempt.count({ where: { outcome: 'login_success', createdAt: { gte: d30 } } }),
    prisma.loginAttempt.count({ where: { outcome: 'login_success' } }),
    prisma.loginAttempt.count({ where: { outcome: 'login_failed', createdAt: { gte: d7 } } }),
    prisma.loginAttempt.count({ where: { outcome: 'login_failed', createdAt: { gte: d30 } } }),
    prisma.loginAttempt.count({ where: { outcome: 'login_failed' } }),
    prisma.loginAttempt.findMany({
      where: { outcome: 'login_success' },
      select: { emailLower: true, ipAddress: true, createdAt: true },
    }),
  ]);

  const userStatsMap = new Map<
    string,
    { username: string; logins: number; uniqueIps: Set<string>; lastLogin: Date }
  >();
  for (const row of successfulByUser) {
    const key = row.emailLower;
    const existing = userStatsMap.get(key);
    const ip = row.ipAddress || 'unknown';
    if (existing) {
      existing.logins += 1;
      existing.uniqueIps.add(ip);
      if (row.createdAt > existing.lastLogin) existing.lastLogin = row.createdAt;
    } else {
      userStatsMap.set(key, {
        username: key,
        logins: 1,
        uniqueIps: new Set([ip]),
        lastLogin: row.createdAt,
      });
    }
  }

  const userStatsList = Array.from(userStatsMap.values()).map((u) => ({
    username: u.username,
    logins: u.logins,
    uniqueIpCount: u.uniqueIps.size,
    lastLogin: u.lastLogin.toISOString(),
  }));

  const ipCounts = userStatsList.map((u) => u.uniqueIpCount);
  const avgUniqueIps = ipCounts.length ? ipCounts.reduce((a, b) => a + b, 0) / ipCounts.length : 0;
  const userStats = userStatsList
    .map((u) => ({ ...u, flagged: avgUniqueIps > 0 && u.uniqueIpCount >= avgUniqueIps * 1.5 && u.uniqueIpCount >= 3 }))
    .sort((a, b) => b.uniqueIpCount - a.uniqueIpCount);

  return NextResponse.json({
    recent,
    summary: {
      loginSuccess: { d7: success7, d30: success30, all: successAll },
      loginFailed: { d7: failed7, d30: failed30, all: failedAll },
      uniqueUsers: userStats.length,
      avgUniqueIps: Number(avgUniqueIps.toFixed(2)),
    },
    userStats,
  });
}
