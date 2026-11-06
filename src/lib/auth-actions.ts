"use server";

import { headers } from "next/headers";
import { getAuth } from "@/lib/auth";
import { readAuthConfig } from "@/lib/auth-config";

export type SignOutResult = { ok: true } | { ok: false; error: string };

/**
 * Signs out the current browser session and reports whether it worked.
 *
 * Takes no arguments: the session comes only from this request's cookie.
 * Better Auth deletes the Session row, and the nextCookies() plugin clears the
 * cookie. Because a Server Action changed cookies, Next.js re-renders the
 * current page in the same response, including the account panel in the layout.
 * The caller then navigates to /sign-in. It returns instead of redirecting so
 * the caller knows the outcome first (the mobile drawer closes only on success).
 * Next.js checks the request's Origin header for every Server Action.
 */
export async function signOutAction(): Promise<SignOutResult> {
  if (readAuthConfig().configured) {
    try {
      await getAuth().api.signOut({ headers: await headers() });
    } catch (error) {
      const name = error instanceof Error && /^[A-Za-z0-9_]{1,64}$/.test(error.name) ? error.name : "unknown error";
      console.error(`[auth] Sign-out failed: ${name}`);
      return { ok: false, error: "Sign-out didn't complete. Please try again." };
    }
  }
  return { ok: true };
}
