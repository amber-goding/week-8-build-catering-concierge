import "server-only";

import { connection } from "next/server";
import { cache } from "react";
import { getAuthSetupStatus } from "@/lib/auth-config";
import { getPrisma } from "@/lib/db";
import { describeErrorSafely, resolveRestaurantAccess, type MemberRestaurant } from "@/lib/restaurants";
import { getSessionUser, type SessionUser } from "@/lib/session";

/**
 * What the shell, the sign-in page, and the setup page show about the
 * visitor's account and restaurant.
 *
 * React's cache() shares one result between components within a single
 * request (the sidebar and the mobile drawer both render it). Nothing is kept
 * between requests or shared between visitors.
 */
export type AccountState =
  | { kind: "setup-required"; problems: string[] }
  | { kind: "signed-out" }
  | { kind: "signed-in"; user: SessionUser; restaurant: RestaurantState }
  | { kind: "unavailable" };

/** A signed-in user's restaurant: theirs, none yet, or unknown because the lookup failed. */
export type RestaurantState =
  | { kind: "member"; restaurant: MemberRestaurant }
  | { kind: "needs-setup" }
  | { kind: "unavailable" };

export const getAccountState = cache(async (): Promise<AccountState> => {
  // Request time, never build time: configuration and cookies are read per request.
  await connection();

  const setup = getAuthSetupStatus();
  if (!setup.configured) return { kind: "setup-required", problems: setup.problems };

  let user: SessionUser | null;
  try {
    user = await getSessionUser();
  } catch (error) {
    // Fail closed (treated as not signed in) and log only the error type and code.
    console.error(`[auth] Could not check the session: ${describeErrorSafely(error)}`);
    return { kind: "unavailable" };
  }
  if (!user) return { kind: "signed-out" };

  return { kind: "signed-in", user, restaurant: await getRestaurantState(user) };
});

async function getRestaurantState(user: SessionUser): Promise<RestaurantState> {
  try {
    const access = await resolveRestaurantAccess(getPrisma, user);
    return access.status === "member" ? { kind: "member", restaurant: access.restaurant } : { kind: "needs-setup" };
  } catch (error) {
    // Fail closed: no restaurant is shown and setup isn't offered while membership is unknown.
    console.error(`[restaurant] Could not check the membership: ${describeErrorSafely(error)}`);
    return { kind: "unavailable" };
  }
}
