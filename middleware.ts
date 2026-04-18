/**
 * middleware.ts — Canopy route protection
 *
 * STATUS: Auth scaffold — passes all requests through in development.
 *
 * TO ACTIVATE (when NextAuth + Microsoft Entra is ready):
 *   1.  npm install next-auth @auth/prisma-adapter
 *   2.  Set env vars: AZURE_AD_CLIENT_ID, AZURE_AD_CLIENT_SECRET,
 *                     AZURE_AD_TENANT_ID, NEXTAUTH_SECRET, NEXTAUTH_URL
 *   3.  Uncomment the NextAuth block below and delete the passthrough export.
 *
 * Protected routes: everything except /login and /api/auth/**
 * Unauthenticated requests → redirect to /login
 *
 * Role gates beyond authentication are enforced at the page/API level
 * using lib/permissions.ts → deriveRole() + hasScope().
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// Development passthrough (no auth required)
// ---------------------------------------------------------------------------

const ACCESS_COOKIE = 'canopy_access';
const ACCESS_VALUE = 'granted';

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  if (pathname === '/login' || pathname.startsWith('/api/auth/')) {
    return NextResponse.next();
  }

  const granted = req.cookies.get(ACCESS_COOKIE)?.value === ACCESS_VALUE;
  if (granted) return NextResponse.next();

  const loginUrl = new URL('/login', req.url);
  if (pathname !== '/') loginUrl.searchParams.set('next', pathname + search);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

// ---------------------------------------------------------------------------
// Production auth middleware (uncomment when next-auth is installed)
// ---------------------------------------------------------------------------

/*
import { auth } from './lib/auth';

export default auth((req) => {
  const isAuthRoute = req.nextUrl.pathname.startsWith('/api/auth');
  const isLoginPage = req.nextUrl.pathname === '/login';

  if (isAuthRoute || isLoginPage) return NextResponse.next();

  if (!req.auth) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', req.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Route-level role gate: Security Center requires SYSTEM_ADMIN
  const isSecurityCenter = req.nextUrl.pathname.startsWith('/settings/security');
  const canopyRole = (req.auth as any)?.user?.canopyRole;
  if (isSecurityCenter && canopyRole !== 'SYSTEM_ADMIN' && canopyRole !== 'COMPLIANCE') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
*/
