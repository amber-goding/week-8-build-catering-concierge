import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAuth, getSessionUserFromHeaders, type SessionUser } from "@/lib/auth";
import { readAuthConfig } from "@/lib/auth-config";

/**
 * Server-side session reads for pages, Route Handlers, and Server Actions.
 *
 * Identity comes only from the signed session cookie, which Better Auth checks
 * against the Session table. These helpers take no user ID or email argument,
 * and they ignore any identity the client sends in headers, query strings, or
 * request bodies.
 *
 * Nothing here is cached. Every call reads the current request. Call these
 * inside a <Suspense> boundary (Cache Components treats them as request-time data).
 *
 * A signed-in user is only authenticated. Restaurant membership and
 * restaurant-scoped authorization don't exist yet, so a session must not be
 * used to read or write Restaurant or Inquiry data.
 */

export type { SessionUser };

/** The verified signed-in user for this request, or null if signed out or sign-in isn't configured. */
export async function getSessionUser(): Promise<SessionUser | null> {
  if (!readAuthConfig().configured) return null;
  return getSessionUserFromHeaders(getAuth(), await headers());
}

/** Like getSessionUser, but redirects to /sign-in when nobody is signed in. For later protected pages. */
export async function requireSessionUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/sign-in");
  return user;
}
