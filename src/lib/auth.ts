import "server-only";

import { betterAuth, type BetterAuthOptions } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import type { PrismaClient } from "@/generated/prisma/client";
import { readAuthConfig, type AuthConfig } from "@/lib/auth-config";
import { getPrisma } from "@/lib/db";

/**
 * Better Auth with Google sign-in, stored through the app's Prisma client.
 *
 * - Created lazily on first use, so `next build` and pages that never touch
 *   sign-in need no credentials and make no database connection.
 * - Google only. Email/password sign-in is off. The default Google scopes
 *   (openid, email, profile) are the only ones requested: no Gmail scopes and
 *   no offline access, so Google issues no refresh token.
 * - Library protections stay on: OAuth state and PKCE, signed httpOnly
 *   cookies (Secure when BETTER_AUTH_URL is https), origin and CSRF checks,
 *   and callback URL validation against BETTER_AUTH_URL (the only trusted origin).
 * - Provider tokens never leave the server. The endpoints that would return
 *   them are disabled (DISABLED_PATHS), access tokens are encrypted at rest,
 *   and the ID token isn't stored at all (see omitIdToken).
 *
 * Signing in proves who someone is. It grants no access to restaurant or
 * inquiry data. That needs restaurant membership, which doesn't exist yet.
 */

/**
 * Better Auth endpoints this app doesn't use that hand provider tokens, or
 * token-backed Google calls, to whoever holds a session cookie:
 * - /get-access-token returns the decrypted access token (and ID token).
 * - /refresh-token refreshes with Google and returns the tokens.
 * - /account-info reads the stored tokens, refreshing them with Google if
 *   expired, and returns the provider profile.
 * Disabled paths answer 404 before any database or provider work. This blocks
 * HTTP access only. Server code could still call auth.api.*, and doesn't.
 */
const DISABLED_PATHS = ["/get-access-token", "/refresh-token", "/account-info"];

/**
 * Drops Google's ID token before an Account row is written.
 *
 * During the OAuth callback, Better Auth exchanges the authorization code
 * (with the client secret and PKCE verifier) directly with Google's token
 * endpoint over TLS. It then reads the user's identity from the ID token in
 * that response, before it creates or updates the account. In this flow the
 * direct exchange is what makes the token trustworthy: Better Auth decodes it
 * rather than checking its signature, which OpenID Connect allows for tokens
 * received straight from the token endpoint.
 *
 * After that, this app never uses the ID token. The library's
 * encryptOAuthTokens covers access and refresh tokens but stores the ID token
 * in plain text, so it's cleared here instead.
 *
 * Hook results are merged over the original data, so the field is set to null
 * (a SQL NULL), not just left out.
 */
function omitIdToken<T extends Record<string, unknown>>(account: T): { data: T & { idToken: null } } {
  return { data: { ...account, idToken: null } };
}

/**
 * The Better Auth options for this app, given a database adapter. createAuth()
 * passes the Prisma adapter. Tests pass Better Auth's in-memory adapter to run
 * the real OAuth callback with exactly these options.
 */
export function createAuthOptions(config: AuthConfig, database: NonNullable<BetterAuthOptions["database"]>) {
  return {
    appName: "Catering Concierge",
    baseURL: config.baseURL,
    secret: config.secret,
    database,
    advanced: {
      // Better Auth leaves `id` to the database layer, and Prisma fills it
      // with a UUIDv7 (see the auth models in prisma/schema.prisma).
      database: { generateId: "uuid" },
    },
    emailAndPassword: { enabled: false },
    socialProviders: {
      google: {
        clientId: config.googleClientId,
        clientSecret: config.googleClientSecret,
        // Let people pick which Google account to use, which matters on shared devices.
        prompt: "select_account",
      },
    },
    account: {
      // Encrypts access and refresh tokens before storage. It doesn't cover ID
      // tokens, which omitIdToken clears instead. Google issues no refresh token
      // here (no offline access), so in practice this protects the access token.
      encryptOAuthTokens: true,
    },
    databaseHooks: {
      account: {
        create: { before: async (account) => omitIdToken(account) },
        // Only touch updates that carry an ID token (for example, the token
        // refresh on each sign-in). Unrelated updates pass through unchanged.
        update: { before: async (account) => ("idToken" in account ? omitIdToken(account) : undefined) },
      },
    },
    disabledPaths: DISABLED_PATHS,
    telemetry: { enabled: false },
    // Must stay last. Lets Server Actions set auth cookies, and stops session
    // refreshes during Server Component renders, which can't set cookies.
    plugins: [nextCookies()],
  } satisfies BetterAuthOptions;
}

export function createAuth(config: AuthConfig, prisma: PrismaClient) {
  return betterAuth(createAuthOptions(config, prismaAdapter(prisma, { provider: "postgresql" })));
}

export type Auth = ReturnType<typeof createAuth>;

export class AuthNotConfiguredError extends Error {
  constructor(readonly problems: string[]) {
    super(`Authentication is not configured: ${problems.join(" ")}`);
    this.name = "AuthNotConfiguredError";
  }
}

const globalForAuth = globalThis as typeof globalThis & { __cateringConciergeAuth?: Auth };

/** The shared auth instance. Throws AuthNotConfiguredError when variables are missing. */
export function getAuth(): Auth {
  if (globalForAuth.__cateringConciergeAuth) return globalForAuth.__cateringConciergeAuth;

  const result = readAuthConfig();
  if (!result.configured) throw new AuthNotConfiguredError(result.problems);

  globalForAuth.__cateringConciergeAuth = createAuth(result.config, getPrisma());
  return globalForAuth.__cateringConciergeAuth;
}

/** The minimum a page needs to show who is signed in. Never includes tokens. */
export type SessionUser = {
  id: string;
  name: string;
  email: string;
};

/**
 * Verifies the session cookie in `requestHeaders` and returns the signed-in
 * user, or null. Better Auth checks the cookie's signature, then looks the
 * token up in the Session table. Nothing else in the request is trusted.
 *
 * App code should call getSessionUser() from src/lib/session.ts, which passes
 * the real request headers. This takes them as an argument so it can be tested
 * outside Next.js.
 *
 * `disableRefresh` keeps the read side-effect free: verifying a session never
 * extends it. Sessions last Better Auth's default 7 days from sign-in.
 */
export async function getSessionUserFromHeaders(auth: Auth, requestHeaders: Headers): Promise<SessionUser | null> {
  const session = await auth.api.getSession({
    headers: requestHeaders,
    query: { disableRefresh: true },
  });
  if (!session) return null;
  return { id: session.user.id, name: session.user.name, email: session.user.email };
}

/**
 * Handles every request under /api/auth. While sign-in isn't configured it
 * answers 503 and creates nothing, so no secret or database is needed.
 */
export async function handleAuthRequest(request: Request): Promise<Response> {
  const result = readAuthConfig();
  if (!result.configured) {
    return Response.json(
      { error: "Authentication is not configured on this server." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
  return getAuth().handler(request);
}
