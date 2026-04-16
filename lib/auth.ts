/**
 * lib/auth.ts
 *
 * NextAuth v5 + Microsoft Entra ID (Azure AD) — institutional-grade SSO.
 *
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │  PRODUCTION WIRING (when Entra app registration is ready)               │
 * │                                                                         │
 * │  1. Register an app in Azure Portal → App registrations                 │
 * │  2. Add a Redirect URI: https://<your-domain>/api/auth/callback/azure-ad│
 * │  3. Under "Certificates & secrets" → new client secret                  │
 * │  4. Under "Token configuration" → add optional claims: email, given_name│
 * │  5. Set environment variables in .env.local (never commit):             │
 * │       AZURE_AD_CLIENT_ID=<Application (client) ID>                      │
 * │       AZURE_AD_CLIENT_SECRET=<Client secret value>                      │
 * │       AZURE_AD_TENANT_ID=<Directory (tenant) ID>                        │
 * │       NEXTAUTH_SECRET=<openssl rand -base64 32>                         │
 * │       NEXTAUTH_URL=https://<your-domain>                                │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * Features:
 * - JWT session strategy (stateless, no DB session table needed)
 * - Token callback syncs InternalUser.adminPanelAccess, department,
 *   seniorityLevel → attaches CanopyRole to the JWT
 * - signIn callback auto-provisions a READ_ONLY InternalUser on first login
 *   (pod lead or admin promotes them via Security Center afterward)
 * - Microsoft Entra External ID supported via the same provider config
 *   (swap `tenantId` for the External ID tenant ID)
 *
 * For Entra External Identities (B2B guest access for GPs/LPs):
 * - Use a separate NextAuth config with tenantId = External ID tenant
 * - Scope: "offline_access openid profile email User.Read"
 * - Conditional Access policies enforced at the Entra layer (MFA, device compliance)
 *
 * Dev mode: when AZURE_AD_CLIENT_ID is absent, all routes are accessible
 * and the mock SYSTEM_ADMIN session from lib/permissions.ts is used.
 */

// ---------------------------------------------------------------------------
// Install when wiring production auth:
//   npm install next-auth @auth/prisma-adapter
// ---------------------------------------------------------------------------

import { DEV_CURRENT_USER, type CanopyRole, deriveRole } from './permissions';

// ---------------------------------------------------------------------------
// Session type augmentation
// ---------------------------------------------------------------------------

export interface CanopySession {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    canopyRole: CanopyRole;
    adminPanelAccess: boolean;
    department: string;
    seniorityLevel: string | null;
  };
}

// ---------------------------------------------------------------------------
// getSession — returns real session in production, mock in development
// ---------------------------------------------------------------------------

/**
 * Server-side session helper.
 *
 * In production (AZURE_AD_CLIENT_ID set):
 *   import { getServerSession } from 'next-auth';
 *   import { authOptions } from './auth';
 *   const session = await getServerSession(authOptions);
 *
 * Until then, returns the dev mock so every page works without auth.
 */
export async function getSession(): Promise<CanopySession> {
  // Production path (uncomment when next-auth is installed):
  // if (process.env.AZURE_AD_CLIENT_ID) {
  //   const { getServerSession } = await import('next-auth');
  //   const { authOptions } = await import('./authOptions');
  //   const session = await getServerSession(authOptions);
  //   if (!session?.user) throw new Error('Unauthenticated');
  //   return session as CanopySession;
  // }

  // Development fallback — Billy Wayne as SYSTEM_ADMIN
  return {
    user: {
      id: DEV_CURRENT_USER.id,
      email: DEV_CURRENT_USER.email,
      firstName: DEV_CURRENT_USER.firstName,
      lastName: DEV_CURRENT_USER.lastName,
      canopyRole: DEV_CURRENT_USER.role,
      adminPanelAccess: DEV_CURRENT_USER.adminPanelAccess,
      department: DEV_CURRENT_USER.department,
      seniorityLevel: DEV_CURRENT_USER.seniorityLevel,
    },
  };
}

// ---------------------------------------------------------------------------
// Production authOptions scaffold (requires next-auth installed)
// ---------------------------------------------------------------------------

/*
import NextAuth from 'next-auth';
import AzureADProvider from 'next-auth/providers/azure-ad';
import { prisma } from './db';
import { deriveRole } from './permissions';

export const authOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
      authorization: {
        params: {
          scope: 'openid profile email offline_access User.Read',
        },
      },
    }),
  ],
  session: { strategy: 'jwt' as const },
  callbacks: {
    async signIn({ user }: { user: { email?: string | null; name?: string | null } }) {
      if (!user.email) return false;
      // Auto-provision READ_ONLY user if not in DB
      const existing = await prisma.internalUser.findUnique({
        where: { email: user.email },
      });
      if (!existing) {
        const [firstName, ...rest] = (user.name ?? user.email.split('@')[0]).split(' ');
        await prisma.internalUser.create({
          data: {
            employeeId: `SSO-${Date.now()}`,
            firstName: firstName ?? 'New',
            lastName: rest.join(' ') || 'User',
            email: user.email,
            title: 'Provisioned via SSO',
            role: 'SSO User',
            department: 'Unassigned',
            adminPanelAccess: false,
          },
        });
      }
      return true;
    },
    async jwt({ token, account }: any) {
      if (account) {
        // First sign-in: load DB fields onto token
        const dbUser = await prisma.internalUser.findUnique({
          where: { email: token.email as string },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            adminPanelAccess: true,
            department: true,
            seniorityLevel: true,
          },
        });
        if (dbUser) {
          token.canopyUserId = dbUser.id;
          token.firstName = dbUser.firstName;
          token.lastName = dbUser.lastName;
          token.adminPanelAccess = dbUser.adminPanelAccess;
          token.department = dbUser.department;
          token.seniorityLevel = dbUser.seniorityLevel;
          token.canopyRole = deriveRole({
            adminPanelAccess: dbUser.adminPanelAccess,
            department: dbUser.department,
            seniorityLevel: dbUser.seniorityLevel,
          });
        }
      }
      return token;
    },
    async session({ session, token }: any) {
      session.user.id = token.canopyUserId;
      session.user.firstName = token.firstName;
      session.user.lastName = token.lastName;
      session.user.canopyRole = token.canopyRole;
      session.user.adminPanelAccess = token.adminPanelAccess;
      session.user.department = token.department;
      session.user.seniorityLevel = token.seniorityLevel;
      return session;
    },
  },
  pages: { signIn: '/login' },
};

export default NextAuth(authOptions);
*/
