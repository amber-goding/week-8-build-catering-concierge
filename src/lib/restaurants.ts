import "server-only";

import type { PrismaClient } from "@/generated/prisma/client";
import type { SessionUser } from "@/lib/auth";

/**
 * Restaurant setup and restaurant scope, independent of Next.js request APIs.
 *
 * Every function here takes the user as an argument. Callers must obtain that
 * user from the verified session (getSessionUser() in src/lib/session.ts),
 * never from anything the browser sends. Request-bound wrappers live in
 * src/lib/restaurant-access.ts (reads) and src/lib/restaurant-actions.ts (setup).
 *
 * The restaurant scope resolved here is the foundation for later inquiry
 * operations. No inquiry route exists yet, so none has been tested for isolation.
 */

export const RESTAURANT_NAME_MAX_LENGTH = 100;

/** A restaurant the user is a member of. The ID is for server-side scoping only. */
export type MemberRestaurant = { id: string; name: string; role: "OWNER" };

export type RestaurantAccess =
  | { status: "unauthenticated" }
  | { status: "needs-setup"; user: SessionUser }
  | { status: "member"; user: SessionUser; restaurant: MemberRestaurant };

/** The parts of the Prisma client these functions use. */
export type RestaurantDb = Pick<PrismaClient, "restaurantMembership" | "$transaction">;

type NameResult = { ok: true; name: string } | { ok: false; message: string };

/**
 * Normalizes and checks a restaurant name from untrusted input: Unicode NFC,
 * trimmed, with runs of whitespace (including tabs and line breaks) collapsed
 * to one space. Rejects empty names, names over RESTAURANT_NAME_MAX_LENGTH
 * characters, and control characters.
 */
export function validateRestaurantName(value: unknown): NameResult {
  if (typeof value !== "string") return { ok: false, message: "Enter your restaurant's name." };
  const name = value.normalize("NFC").replace(/\s+/g, " ").trim();
  if (!name) return { ok: false, message: "Enter your restaurant's name." };
  if ([...name].length > RESTAURANT_NAME_MAX_LENGTH) {
    return { ok: false, message: `Use ${RESTAURANT_NAME_MAX_LENGTH} characters or fewer.` };
  }
  if (/\p{Cc}/u.test(name)) return { ok: false, message: "Remove unsupported characters from the name." };
  return { ok: true, name };
}

/** The user's restaurant through their membership, or null if they haven't set one up. */
export async function findRestaurantForUser(db: RestaurantDb, userId: string): Promise<MemberRestaurant | null> {
  const membership = await db.restaurantMembership.findUnique({
    where: { userId },
    select: { role: true, restaurant: { select: { id: true, name: true } } },
  });
  return membership ? { id: membership.restaurant.id, name: membership.restaurant.name, role: membership.role } : null;
}

/**
 * Resolves what a session user may access. `getDb` is called only for a
 * signed-in user, so signed-out visitors never touch the database. Database
 * errors propagate: callers must treat a thrown error as "no access".
 */
export async function resolveRestaurantAccess(
  getDb: () => RestaurantDb,
  user: SessionUser | null,
): Promise<RestaurantAccess> {
  if (!user) return { status: "unauthenticated" };
  const restaurant = await findRestaurantForUser(getDb(), user.id);
  return restaurant ? { status: "member", user, restaurant } : { status: "needs-setup", user };
}

export type CreateRestaurantResult =
  | { status: "invalid"; message: string }
  | { status: "created"; restaurant: MemberRestaurant }
  | { status: "exists"; restaurant: MemberRestaurant };

/**
 * Creates a restaurant with `user` as its owner, unless they already have one.
 *
 * The restaurant and the OWNER membership are written in one transaction, so a
 * failed membership insert rolls the restaurant back (no orphan restaurants).
 * The unique index on RestaurantMembership.userId is what stops concurrent or
 * repeated submissions: the losing request's transaction fails with P2002 and
 * rolls back, and this returns the restaurant that won as "exists".
 *
 * Other database errors propagate. Callers show a generic message.
 */
export async function createRestaurantForUser(
  db: RestaurantDb,
  user: SessionUser,
  rawName: unknown,
): Promise<CreateRestaurantResult> {
  const validated = validateRestaurantName(rawName);
  if (!validated.ok) return { status: "invalid", message: validated.message };

  const existing = await findRestaurantForUser(db, user.id);
  if (existing) return { status: "exists", restaurant: existing };

  try {
    const restaurant = await db.$transaction(
      async (tx) => {
        const created = await tx.restaurant.create({
          data: { name: validated.name },
          select: { id: true, name: true },
        });
        await tx.restaurantMembership.create({
          data: { userId: user.id, restaurantId: created.id, role: "OWNER" },
        });
        return created;
      },
      { maxWait: 5_000, timeout: 10_000 },
    );
    return { status: "created", restaurant: { ...restaurant, role: "OWNER" } };
  } catch (error) {
    if (isUniqueViolation(error)) {
      const winner = await findRestaurantForUser(db, user.id);
      if (winner) return { status: "exists", restaurant: winner };
    }
    throw error;
  }
}

/** Prisma's unique-constraint error code. Checked by code so tests needn't build Prisma error objects. */
function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { code?: unknown }).code === "P2002";
}

/** Error type and code only, for logs. Raw messages can include connection details or SQL. */
export function describeErrorSafely(error: unknown): string {
  if (!error || typeof error !== "object") return "unknown error";
  const { name, code } = error as { name?: unknown; code?: unknown };
  const parts: string[] = [];
  if (typeof name === "string" && /^[A-Za-z0-9_]{1,64}$/.test(name)) parts.push(name);
  if (typeof code === "string" && /^[A-Za-z0-9_]{1,40}$/.test(code)) parts.push(`code ${code}`);
  return parts.length > 0 ? parts.join(", ") : "unknown error";
}

export type RestaurantSetupState =
  | { status: "idle" }
  | { status: "invalid" | "error" | "unauthenticated"; message: string }
  | { status: "created" | "exists" };

/**
 * The setup form's server-side flow, given its dependencies. Reads only the
 * `name` field from the form. Any other field (a user ID, owner ID, restaurant
 * ID, or role) is ignored, and the owner is always the session user.
 */
export async function submitRestaurantSetup(
  deps: { getUser: () => Promise<SessionUser | null>; getDb: () => RestaurantDb },
  formData: FormData,
): Promise<RestaurantSetupState> {
  try {
    const user = await deps.getUser();
    if (!user) return { status: "unauthenticated", message: "Sign in to set up your restaurant." };

    const result = await createRestaurantForUser(deps.getDb(), user, formData.get("name"));
    if (result.status === "invalid") return { status: "invalid", message: result.message };
    return { status: result.status };
  } catch (error) {
    console.error(`[restaurant] Setup failed: ${describeErrorSafely(error)}`);
    return { status: "error", message: "Your restaurant couldn't be saved. Please try again." };
  }
}
