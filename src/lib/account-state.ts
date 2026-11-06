import "server-only";

import { connection } from "next/server";
import { cache } from "react";
import { getAuthSetupStatus } from "@/lib/auth-config";
import { getSessionUser, type SessionUser } from "@/lib/session";

/**
 * What the shell and the sign-in page show about the visitor's account.
 *
 * React's cache() shares one result between components within a single
 * request (the sidebar and the mobile drawer both render it). Nothing is kept
 * between requests or shared between visitors.
 */
export type AccountState =
  | { kind: "setup-required"; problems: string[] }
  | { kind: "signed-out" }
  | { kind: "signed-in"; user: SessionUser }
  | { kind: "unavailable" };

export const getAccountState = cache(async (): Promise<AccountState> => {
  // Request time, never build time: configuration and cookies are read per request.
  await connection();

  const setup = getAuthSetupStatus();
  if (!setup.configured) return { kind: "setup-required", problems: setup.problems };

  try {
    const user = await getSessionUser();
    return user ? { kind: "signed-in", user } : { kind: "signed-out" };
  } catch (error) {
    // Fail closed (treated as not signed in) and log only the error type and code.
    // Raw messages can include connection details.
    console.error(`[auth] Could not check the session: ${describeError(error)}`);
    return { kind: "unavailable" };
  }
});

function describeError(error: unknown): string {
  if (!error || typeof error !== "object") return "unknown error";
  const { name, code } = error as { name?: unknown; code?: unknown };
  const parts: string[] = [];
  if (typeof name === "string" && /^[A-Za-z0-9_]{1,64}$/.test(name)) parts.push(name);
  if (typeof code === "string" && /^[A-Za-z0-9_]{1,40}$/.test(code)) parts.push(`code ${code}`);
  return parts.length > 0 ? parts.join(", ") : "unknown error";
}
