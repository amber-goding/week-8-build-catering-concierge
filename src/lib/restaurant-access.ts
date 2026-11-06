import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";
import { getPrisma } from "@/lib/db";
import { resolveRestaurantAccess, type MemberRestaurant, type RestaurantAccess } from "@/lib/restaurants";
import { getSessionUser, type SessionUser } from "@/lib/session";

/**
 * The verified session user's restaurant scope for this request.
 *
 * - The user comes only from the signed session cookie (getSessionUser), and the
 *   restaurant only from that user's membership. No restaurant ID from a form,
 *   URL, header, or browser state is ever consulted.
 * - "unauthenticated" covers signed-out visitors and an unconfigured sign-in.
 *   "needs-setup" is a signed-in user without a restaurant.
 * - Database errors are thrown, never treated as access (fail closed).
 * - React's cache() shares the result within one request only. Nothing is kept
 *   between requests or shared between users. Call inside <Suspense>.
 */
export const getRestaurantAccess = cache(
  async (): Promise<RestaurantAccess> => resolveRestaurantAccess(getPrisma, await getSessionUser()),
);

/**
 * For later restaurant-scoped pages and actions: the user and their restaurant,
 * or a redirect to /sign-in or /setup. Pass `restaurant.id` to queries; never
 * accept a restaurant ID from the request.
 */
export async function requireRestaurant(): Promise<{ user: SessionUser; restaurant: MemberRestaurant }> {
  const access = await getRestaurantAccess();
  if (access.status === "unauthenticated") redirect("/sign-in");
  if (access.status === "needs-setup") redirect("/setup");
  return { user: access.user, restaurant: access.restaurant };
}
