import crypto from 'crypto';
import { Resend } from 'resend';

export const PENDING_COOKIE = 'pending_login';
export const ACCESS_COOKIE = 'canopy_access';
export const ACCESS_VALUE = 'granted';
export const PENDING_TTL_MS = 10 * 60 * 1000;
export const ACCESS_TTL_S = 60 * 60 * 24 * 30;

export const ALLOWED_DOMAIN = (process.env.ALLOWED_EMAIL_DOMAIN || 'junipersquare.com').toLowerCase();
const FROM_EMAIL = process.env.SITE_FROM_EMAIL || 'Canopy <onboarding@resend.dev>';

function getSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) {
    throw new Error('SESSION_SECRET must be set (>= 16 chars)');
  }
  return s;
}

export function hashCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

export interface PendingPayload {
  email: string;
  codeHash: string;
  expiresAt: number;
}

export function signPending(payload: PendingPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', getSecret()).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export function verifyPending(token: string | undefined | null): PendingPayload | null {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [body, sig] = parts;
  const expected = crypto.createHmac('sha256', getSecret()).update(body).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    return JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as PendingPayload;
  } catch {
    return null;
  }
}

export function generateCode(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
}

export function parseEmail(raw: string): { email: string; domain: string } | null {
  const email = (raw || '').trim().toLowerCase();
  const at = email.lastIndexOf('@');
  if (at < 1 || at === email.length - 1) return null;
  const domain = email.slice(at + 1);
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) return null;
  return { email, domain };
}

export function isDomainAllowed(domain: string): boolean {
  return domain === ALLOWED_DOMAIN;
}

export function timingSafeEqualStr(a: string, b: string): boolean {
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  if (aa.length !== bb.length) return false;
  return crypto.timingSafeEqual(aa, bb);
}

export async function sendCodeEmail(to: string, code: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[auth-gate] RESEND_API_KEY not set — code for', to, 'is', code);
    return;
  }
  const resend = new Resend(apiKey);
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Canopy access code: ${code}`,
    text: `Your Canopy access code is ${code}.\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, you can ignore this email.`,
    html: `<div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; padding: 24px; color: #1a1a1a;">
  <div style="font-size: 11px; font-weight: 700; color: #00AA6C; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 8px;">Juniper Square · Canopy</div>
  <h1 style="font-size: 18px; margin: 0 0 12px;">Your access code</h1>
  <div style="font-size: 32px; font-weight: 700; letter-spacing: 0.25em; color: #00AA6C; background: #F0FBF6; padding: 16px 24px; border-radius: 14px; display: inline-block; margin: 12px 0;">${code}</div>
  <p style="font-size: 13px; color: #6b7280; margin-top: 16px;">This code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>
</div>`,
  });
}

export function getClientIp(headers: Headers): string | null {
  const fwd = headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]?.trim() || null;
  return headers.get('x-real-ip');
}
