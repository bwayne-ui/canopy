import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  PENDING_COOKIE,
  ACCESS_COOKIE,
  ACCESS_VALUE,
  ACCESS_TTL_S,
  hashCode,
  verifyPending,
  timingSafeEqualStr,
  getClientIp,
} from '@/lib/auth-gate';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const { code: rawCode } = await req.json().catch(() => ({ code: '' }));
  const code = (rawCode || '').toString().trim();
  const ipAddress = getClientIp(req.headers);
  const userAgent = req.headers.get('user-agent');

  const token = req.headers.get('cookie')?.split(';').map((s) => s.trim()).find((c) => c.startsWith(`${PENDING_COOKIE}=`))?.slice(PENDING_COOKIE.length + 1);
  const payload = verifyPending(token);

  if (!payload) {
    await prisma.loginAttempt.create({
      data: { emailLower: '', domain: '', domainAllowed: false, outcome: 'pending_missing', ipAddress, userAgent },
    }).catch(() => {});
    return NextResponse.json({ error: 'Request a new code' }, { status: 401 });
  }

  const domain = payload.email.split('@')[1] ?? '';

  if (Date.now() > payload.expiresAt) {
    await prisma.loginAttempt.create({
      data: { emailLower: payload.email, domain, domainAllowed: true, outcome: 'code_expired', ipAddress, userAgent },
    }).catch(() => {});
    const res = NextResponse.json({ error: 'Code expired' }, { status: 401 });
    res.cookies.delete(PENDING_COOKIE);
    return res;
  }

  if (!code || !timingSafeEqualStr(hashCode(code), payload.codeHash)) {
    await prisma.loginAttempt.create({
      data: { emailLower: payload.email, domain, domainAllowed: true, outcome: 'code_invalid', ipAddress, userAgent },
    }).catch(() => {});
    return NextResponse.json({ error: 'Incorrect code' }, { status: 401 });
  }

  await prisma.loginAttempt.create({
    data: { emailLower: payload.email, domain, domainAllowed: true, outcome: 'code_verified', ipAddress, userAgent },
  }).catch(() => {});

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ACCESS_COOKIE, ACCESS_VALUE, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ACCESS_TTL_S,
  });
  res.cookies.delete(PENDING_COOKIE);
  return res;
}
