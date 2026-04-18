import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { ACCESS_COOKIE, ACCESS_VALUE, ACCESS_TTL_S, checkCredentials, getClientIp } from '@/lib/auth-gate';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const { username: rawUsername, password: rawPassword } = await req
    .json()
    .catch(() => ({ username: '', password: '' }));
  const username = (rawUsername || '').trim();
  const password = rawPassword || '';
  const ipAddress = getClientIp(req.headers);
  const userAgent = req.headers.get('user-agent');

  const matched = checkCredentials(username, password);

  if (!matched) {
    await prisma.loginAttempt
      .create({
        data: {
          emailLower: username.toLowerCase(),
          domain: '',
          domainAllowed: false,
          outcome: 'login_failed',
          ipAddress,
          userAgent,
        },
      })
      .catch(() => {});
    return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
  }

  await prisma.loginAttempt
    .create({
      data: {
        emailLower: matched,
        domain: '',
        domainAllowed: true,
        outcome: 'login_success',
        ipAddress,
        userAgent,
      },
    })
    .catch(() => {});

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ACCESS_COOKIE, ACCESS_VALUE, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ACCESS_TTL_S,
  });
  return res;
}
