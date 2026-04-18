import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  PENDING_COOKIE,
  PENDING_TTL_MS,
  generateCode,
  hashCode,
  signPending,
  parseEmail,
  isDomainAllowed,
  sendCodeEmail,
  getClientIp,
} from '@/lib/auth-gate';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const { email: rawEmail } = await req.json().catch(() => ({ email: '' }));
  const parsed = parseEmail(rawEmail);
  const ipAddress = getClientIp(req.headers);
  const userAgent = req.headers.get('user-agent');

  if (!parsed) {
    return NextResponse.json({ ok: true });
  }

  const { email, domain } = parsed;
  const allowed = isDomainAllowed(domain);

  if (!allowed) {
    await prisma.loginAttempt.create({
      data: { emailLower: email, domain, domainAllowed: false, outcome: 'domain_rejected', ipAddress, userAgent },
    }).catch(() => {});
    return NextResponse.json({ ok: true });
  }

  const code = generateCode();
  const payload = { email, codeHash: hashCode(code), expiresAt: Date.now() + PENDING_TTL_MS };
  const token = signPending(payload);

  try {
    await sendCodeEmail(email, code);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[request-code] send failed:', msg);
    return NextResponse.json({ error: 'Could not send code', detail: msg }, { status: 500 });
  }

  await prisma.loginAttempt.create({
    data: { emailLower: email, domain, domainAllowed: true, outcome: 'code_sent', ipAddress, userAgent },
  }).catch(() => {});

  const res = NextResponse.json({ ok: true });
  res.cookies.set(PENDING_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: Math.floor(PENDING_TTL_MS / 1000),
  });
  return res;
}
