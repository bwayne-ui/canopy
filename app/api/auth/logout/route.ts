import { NextResponse } from 'next/server';
import { ACCESS_COOKIE } from '@/lib/auth-gate';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const url = new URL('/login', req.url);
  const res = NextResponse.redirect(url, { status: 303 });
  res.cookies.delete(ACCESS_COOKIE);
  return res;
}

export async function GET(req: Request) {
  return POST(req);
}
