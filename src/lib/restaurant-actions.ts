"use server";

import { refresh } from "next/cache";
import { getPrisma } from "@/lib/db";
import { submitRestaurantSetup, type RestaurantSetupState } from "@/lib/restaurants";
import { getSessionUser } from "@/lib/session";

/**
 * Restaurant setup form action. The owner is always the verified session user,
 * and only the form's `name` field is read (see submitRestaurantSetup).
 *
 * After a restaurant is created, or found to exist already (for example, a
 * repeated or concurrent submission), refresh() re-renders the current page in
 * the same response, so the setup page and the account panel show it.
 * Next.js checks the request's Origin header for every Server Action.
 */
export async function createRestaurantAction(
  _previous: RestaurantSetupState,
  formData: FormData,
): Promise<RestaurantSetupState> {
  const state = await submitRestaurantSetup({ getUser: getSessionUser, getDb: getPrisma }, formData);
  if (state.status === "created" || state.status === "exists") refresh();
  return state;
}
