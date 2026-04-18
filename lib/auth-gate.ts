import crypto from 'crypto';

export const ACCESS_COOKIE = 'canopy_access';
export const ACCESS_VALUE = 'granted';
export const ACCESS_TTL_S = 60 * 60 * 24 * 30;

export const CREDENTIALS: Record<string, string> = {
  adam: 'Atwood',
  lion: 'Christine',
  bwayne: 'Admin',
};

export function checkCredentials(username: string, password: string): string | null {
  const u = (username || '').trim().toLowerCase();
  const expected = CREDENTIALS[u];
  if (!expected) return null;
  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return u;
}

export function getClientIp(headers: Headers): string | null {
  const fwd = headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]?.trim() || null;
  return headers.get('x-real-ip');
}
