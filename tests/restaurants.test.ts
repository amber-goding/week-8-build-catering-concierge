/**
 * Offline tests for restaurant setup and restaurant scope. Run with: npm test
 *
 * Everything here runs against a MOCK database. What these tests prove:
 * - The app's own logic: validation, which identity is used, which queries are
 *   made, how results and errors are handled, and that nothing reads a
 *   restaurant ID or user ID from the browser.
 * What they don't prove (database behavior, verified only after the user
 * applies the migration and tests against Neon):
 * - That PostgreSQL rolls back the transaction. The mock imitates a rollback by
 *   discarding writes when the transaction callback throws.
 * - That the unique index on RestaurantMembership.userId rejects a second
 *   membership. The mock throws Prisma's P2002 code where the database would.
 * - That Prisma's Neon adapter runs the interactive transaction as expected.
 */
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, test } from "node:test";
import type { SessionUser } from "@/lib/auth";
import {
  RESTAURANT_NAME_MAX_LENGTH,
  createRestaurantForUser,
  resolveRestaurantAccess,
  submitRestaurantSetup,
  validateRestaurantName,
  type RestaurantDb,
} from "@/lib/restaurants";

const SESSION_USER: SessionUser = {
  id: "0190f3a1-0000-7000-8000-000000000001",
  name: "Pat Example",
  email: "pat.example@example.com",
};
const ATTACKER_ID = "0190f3a1-0000-7000-8000-00000000dead";

type Call = { op: string; args: unknown };
type Membership = { role: "OWNER"; restaurant: { id: string; name: string } };

/** A unique-constraint error shaped like Prisma's (only the code is checked). */
function uniqueViolation() {
  return Object.assign(new Error("Unique constraint failed on the fields: (`userId`)"), {
    name: "PrismaClientKnownRequestError",
    code: "P2002",
  });
}

/**
 * Mock of the Prisma calls the restaurant code makes. Writes inside $transaction
 * are staged and kept only if the callback finishes (a simulated rollback).
 */
function createMockDb(script: {
  find?: (callNumber: number) => Membership | null | Promise<Membership | null>;
  restaurantCreateError?: unknown;
  membershipCreateError?: unknown;
}) {
  const calls: Call[] = [];
  const committed = { restaurants: [] as { id: string; name: string }[], memberships: [] as Record<string, unknown>[] };
  let findCalls = 0;
  const db = {
    restaurantMembership: {
      findUnique: async (args: unknown) => {
        calls.push({ op: "membership.findUnique", args });
        findCalls += 1;
        return script.find ? script.find(findCalls) : null;
      },
    },
    $transaction: async (fn: (tx: unknown) => Promise<unknown>, options: unknown) => {
      calls.push({ op: "$transaction", args: options });
      const staged = { restaurants: [] as { id: string; name: string }[], memberships: [] as Record<string, unknown>[] };
      const tx = {
        restaurant: {
          create: async (args: { data: { name: string } }) => {
            calls.push({ op: "restaurant.create", args });
            if (script.restaurantCreateError) throw script.restaurantCreateError;
            const restaurant = { id: "0190f3a1-0000-7000-8000-0000000000a1", name: args.data.name };
            staged.restaurants.push(restaurant);
            return restaurant;
          },
        },
        restaurantMembership: {
          create: async (args: { data: Record<string, unknown> }) => {
            calls.push({ op: "membership.create", args });
            if (script.membershipCreateError) throw script.membershipCreateError;
            staged.memberships.push(args.data);
            return { id: "0190f3a1-0000-7000-8000-0000000000b1", ...args.data };
          },
        },
      };
      const result = await fn(tx);
      committed.restaurants.push(...staged.restaurants);
      committed.memberships.push(...staged.memberships);
      return result;
    },
  };
  return { db: db as unknown as RestaurantDb, calls, committed };
}

const memberOf = (name: string): Membership => ({
  role: "OWNER",
  restaurant: { id: "0190f3a1-0000-7000-8000-0000000000c1", name },
});

const neverCalled = (): RestaurantDb => {
  throw new Error("Test guard: the database must not be used here");
};

// Capture console.error so failures can be checked for leaked details.
const originalConsoleError = console.error;
let errorLogs: string[] = [];
beforeEach(() => {
  errorLogs = [];
  console.error = (...args: unknown[]) => {
    errorLogs.push(args.map(String).join(" "));
  };
});
afterEach(() => {
  console.error = originalConsoleError;
});

describe("restaurant name validation", () => {
  test("trims, collapses whitespace, and normalizes to NFC", () => {
    assert.deepEqual(validateRestaurantName("  Café \t  Example\n "), { ok: true, name: "Café Example" });
    assert.deepEqual(validateRestaurantName("Café"), { ok: true, name: "Café" });
  });

  test("rejects missing, non-text, and blank names", () => {
    for (const value of [null, undefined, 42, {}, "", "   \n\t "]) {
      assert.equal(validateRestaurantName(value).ok, false, `expected ${JSON.stringify(value)} to be rejected`);
    }
  });

  test(`allows ${RESTAURANT_NAME_MAX_LENGTH} characters and rejects more, counting characters rather than bytes`, () => {
    assert.equal(validateRestaurantName("a".repeat(RESTAURANT_NAME_MAX_LENGTH)).ok, true);
    assert.equal(validateRestaurantName("é".repeat(RESTAURANT_NAME_MAX_LENGTH)).ok, true);
    assert.equal(validateRestaurantName("a".repeat(RESTAURANT_NAME_MAX_LENGTH + 1)).ok, false);
  });

  test("rejects control characters", () => {
    assert.equal(validateRestaurantName("Bistro\u0000Example").ok, false);
    assert.equal(validateRestaurantName("Bistro\u007fExample").ok, false);
  });
});

describe("restaurant access resolution", () => {
  test("a signed-out visitor is unauthenticated, without touching the database", async () => {
    assert.deepEqual(await resolveRestaurantAccess(neverCalled, null), { status: "unauthenticated" });
  });

  test("a signed-in user without a membership needs setup", async () => {
    const { db, calls } = createMockDb({ find: () => null });
    const access = await resolveRestaurantAccess(() => db, SESSION_USER);
    assert.deepEqual(access, { status: "needs-setup", user: SESSION_USER });
    assert.deepEqual((calls[0].args as { where: unknown }).where, { userId: SESSION_USER.id });
  });

  test("a member resolves to the restaurant from their own membership", async () => {
    const { db, calls } = createMockDb({ find: () => memberOf("Bistro Example") });
    const access = await resolveRestaurantAccess(() => db, SESSION_USER);
    assert.deepEqual(access, {
      status: "member",
      user: SESSION_USER,
      restaurant: { id: "0190f3a1-0000-7000-8000-0000000000c1", name: "Bistro Example", role: "OWNER" },
    });
    assert.equal(calls.length, 1);
    assert.deepEqual((calls[0].args as { where: unknown }).where, { userId: SESSION_USER.id }, "looked up by session user only");
  });

  test("a database error is thrown, not treated as access (fail closed)", async () => {
    const { db } = createMockDb({
      find: () => {
        throw Object.assign(new Error("connect failed"), { code: "P1001" });
      },
    });
    await assert.rejects(resolveRestaurantAccess(() => db, SESSION_USER), /connect failed/);
  });
});

describe("restaurant creation", () => {
  test("creates the restaurant and an OWNER membership for the session user in one transaction", async () => {
    const { db, calls, committed } = createMockDb({ find: () => null });
    const result = await createRestaurantForUser(db, SESSION_USER, "  Bistro   Example ");

    assert.equal(result.status, "created");
    assert.deepEqual(
      calls.map((call) => call.op),
      ["membership.findUnique", "$transaction", "restaurant.create", "membership.create"],
    );
    assert.deepEqual((calls[2].args as { data: unknown }).data, { name: "Bistro Example" });
    assert.deepEqual((calls[3].args as { data: unknown }).data, {
      userId: SESSION_USER.id,
      restaurantId: "0190f3a1-0000-7000-8000-0000000000a1",
      role: "OWNER",
    });
    assert.deepEqual(calls[1].args, { maxWait: 5_000, timeout: 10_000 }, "the transaction has bounded waits");
    assert.equal(committed.restaurants.length, 1);
    assert.equal(committed.memberships.length, 1);
  });

  test("an invalid name is rejected before any database work", async () => {
    const { db, calls } = createMockDb({});
    assert.equal((await createRestaurantForUser(db, SESSION_USER, "   ")).status, "invalid");
    assert.deepEqual(calls, []);
  });

  test("a user who already has a restaurant gets it back, and nothing new is created", async () => {
    const { db, calls } = createMockDb({ find: () => memberOf("Bistro Example") });
    const result = await createRestaurantForUser(db, SESSION_USER, "Another Example");
    assert.equal(result.status, "exists");
    assert.ok(result.status === "exists" && result.restaurant.name === "Bistro Example");
    assert.ok(!calls.some((call) => call.op === "$transaction"), "no transaction for an existing member");
  });

  test("losing a concurrent race (P2002) returns the winning restaurant and leaves no orphan (simulated rollback)", async () => {
    // First lookup: no membership yet. The insert then hits the unique index.
    // Second lookup: the concurrent request's membership is now visible.
    const { db, committed } = createMockDb({
      find: (n) => (n === 1 ? null : memberOf("Winner Example")),
      membershipCreateError: uniqueViolation(),
    });
    const result = await createRestaurantForUser(db, SESSION_USER, "Loser Example");
    assert.equal(result.status, "exists");
    assert.ok(result.status === "exists" && result.restaurant.name === "Winner Example");
    assert.deepEqual(committed, { restaurants: [], memberships: [] }, "the losing restaurant was rolled back");
  });

  test("other database errors propagate and nothing is committed", async () => {
    const { db, committed } = createMockDb({
      find: () => null,
      restaurantCreateError: Object.assign(new Error("server closed the connection"), { code: "P1017" }),
    });
    await assert.rejects(createRestaurantForUser(db, SESSION_USER, "Bistro Example"), /server closed/);
    assert.deepEqual(committed, { restaurants: [], memberships: [] });
  });

  test("a P2002 with no membership found afterwards is not hidden", async () => {
    const { db } = createMockDb({ find: () => null, membershipCreateError: uniqueViolation() });
    await assert.rejects(createRestaurantForUser(db, SESSION_USER, "Bistro Example"), /Unique constraint/);
  });
});

describe("setup form submission", () => {
  function form(fields: Record<string, string>): FormData {
    const data = new FormData();
    for (const [key, value] of Object.entries(fields)) data.append(key, value);
    return data;
  }

  test("signed out: refused without touching the database", async () => {
    const state = await submitRestaurantSetup(
      { getUser: async () => null, getDb: neverCalled },
      form({ name: "Bistro Example" }),
    );
    assert.equal(state.status, "unauthenticated");
  });

  test("ignores client-supplied identity and scope fields; the owner is always the session user", async () => {
    const { db, calls } = createMockDb({ find: () => null });
    const state = await submitRestaurantSetup(
      { getUser: async () => SESSION_USER, getDb: () => db },
      form({
        name: "Bistro Example",
        userId: ATTACKER_ID,
        ownerId: ATTACKER_ID,
        restaurantId: ATTACKER_ID,
        role: "ADMIN",
        "user.id": ATTACKER_ID,
      }),
    );
    assert.equal(state.status, "created");
    const membership = calls.find((call) => call.op === "membership.create");
    assert.deepEqual((membership?.args as { data: Record<string, unknown> }).data.userId, SESSION_USER.id);
    assert.equal((membership?.args as { data: Record<string, unknown> }).data.role, "OWNER");
    assert.ok(!JSON.stringify(calls).includes(ATTACKER_ID), "no submitted ID reaches any query");
    assert.ok(!JSON.stringify(calls).includes("ADMIN"));
  });

  test("an existing restaurant is reported as exists", async () => {
    const { db } = createMockDb({ find: () => memberOf("Bistro Example") });
    const state = await submitRestaurantSetup({ getUser: async () => SESSION_USER, getDb: () => db }, form({ name: "X" }));
    assert.deepEqual(state, { status: "exists" });
  });

  test("validation messages are returned for a bad name", async () => {
    const { db } = createMockDb({});
    const state = await submitRestaurantSetup(
      { getUser: async () => SESSION_USER, getDb: () => db },
      form({ name: "a".repeat(RESTAURANT_NAME_MAX_LENGTH + 1) }),
    );
    assert.equal(state.status, "invalid");
  });

  test("database and session errors show a generic message and log only the error type and code", async () => {
    const secretish = "connection to postgresql://user:hunter2@db.example.invalid failed";
    const { db } = createMockDb({
      find: () => null,
      restaurantCreateError: Object.assign(new Error(secretish), { name: "PrismaClientKnownRequestError", code: "P1001" }),
    });
    const dbFailure = await submitRestaurantSetup({ getUser: async () => SESSION_USER, getDb: () => db }, form({ name: "Bistro" }));
    const sessionFailure = await submitRestaurantSetup(
      {
        getUser: async () => {
          throw new Error(secretish);
        },
        getDb: neverCalled,
      },
      form({ name: "Bistro" }),
    );
    for (const state of [dbFailure, sessionFailure]) {
      assert.deepEqual(state, { status: "error", message: "Your restaurant couldn't be saved. Please try again." });
    }
    assert.equal(errorLogs.length, 2);
    assert.ok(errorLogs[0].includes("PrismaClientKnownRequestError, code P1001"));
    assert.ok(errorLogs.every((line) => !line.includes("hunter2") && !line.includes("postgresql://")));
  });
});

describe("no cross-user caching", () => {
  test('no source file uses a "use cache" directive (session, membership, and restaurant reads stay per request)', () => {
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir)) {
        const path = join(dir, entry);
        if (statSync(path).isDirectory()) {
          if (entry !== "generated") walk(path);
        } else if (/\.(ts|tsx)$/.test(entry)) files.push(path);
      }
    };
    walk("src");
    const offenders = files.filter((file) => /["']use cache/.test(readFileSync(file, "utf8")));
    assert.deepEqual(offenders, []);
  });
});
