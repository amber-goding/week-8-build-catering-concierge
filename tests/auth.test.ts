/**
 * Offline tests for this app's authentication wiring. Run with: npm test
 *
 * No database connection, network access, or real credentials:
 * - .env files are never loaded, and auth variables are removed from process.env.
 * - The secret is random per run and never printed.
 * - The Prisma client is wrapped so any database access is recorded and refused.
 *   Its Neon adapter points at a reserved .invalid host and is never connected.
 *
 * - Network access is refused by a fetch stub. The Google callback tests emulate
 *   Google's token endpoint in-process. They exercise this app's Better Auth
 *   options against the real library code, but they don't prove that sign-in
 *   with the real Google service works.
 *
 * These tests cover this app's code: configuration checks, the missing-config
 * behavior, the session helper, the disabled token endpoints, ID-token omission,
 * and that prisma/schema.prisma matches what Better Auth writes. They don't
 * retest the library itself.
 */
import assert from "node:assert/strict";
import { createHmac, createSign, generateKeyPairSync, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, test } from "node:test";
import { PrismaNeon } from "@prisma/adapter-neon";
import { betterAuth } from "better-auth";
import { memoryAdapter } from "better-auth/adapters/memory";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { decryptOAuthToken } from "better-auth/oauth2";
import { PrismaClient } from "@/generated/prisma/client";
import {
  AuthNotConfiguredError,
  createAuth,
  createAuthOptions,
  getAuth,
  getSessionUserFromHeaders,
  handleAuthRequest,
  type Auth,
} from "@/lib/auth";
import { AUTH_ENV_VARS, readAuthConfig, type AuthConfig } from "@/lib/auth-config";

const SECRET = randomBytes(32).toString("base64");
const BASE_URL = "http://localhost:3000";

function testConfig(): AuthConfig {
  return {
    secret: SECRET,
    baseURL: BASE_URL,
    googleClientId: "test-client-id.apps.googleusercontent.com",
    googleClientSecret: "test-client-secret",
  };
}

function validEnv(): Record<string, string> {
  return {
    BETTER_AUTH_SECRET: SECRET,
    BETTER_AUTH_URL: BASE_URL,
    GOOGLE_CLIENT_ID: "test-client-id.apps.googleusercontent.com",
    GOOGLE_CLIENT_SECRET: "test-client-secret",
    DATABASE_URL: "postgresql://user:pass@db.invalid/test",
  };
}

/** A real generated client (so Better Auth can read its data model) that refuses all database access. */
function createGuardedPrisma() {
  const attempts: string[] = [];
  const real = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: "postgresql://user:pass@db.invalid/test" }),
  });
  const prisma = new Proxy(real, {
    get(target, prop, receiver) {
      if (prop === "_runtimeDataModel" || typeof prop === "symbol") return Reflect.get(target, prop, receiver);
      attempts.push(prop);
      throw new Error(`Test guard: database access attempted through prisma.${prop}`);
    },
  });
  return { prisma, attempts };
}

/** Signs a cookie value the way Better Auth does (HMAC-SHA256, base64), so it passes signature checks. */
function signCookieValue(value: string, secret: string): string {
  const signature = createHmac("sha256", secret).update(value).digest("base64");
  return encodeURIComponent(`${value}.${signature}`);
}

/** Replaces fetch for one test. Requests the handler doesn't answer are recorded and refused. */
const originalFetch = globalThis.fetch;
function stubFetch(handler: (url: string, init?: RequestInit) => Response | undefined = () => undefined) {
  const calls: string[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = input instanceof Request ? input.url : String(input);
    calls.push(url);
    const response = handler(url, init);
    if (!response) throw new Error(`Test guard: unexpected network request to ${url}`);
    return response;
  }) as typeof fetch;
  return calls;
}

beforeEach(() => {
  for (const name of AUTH_ENV_VARS) delete process.env[name];
  stubFetch();
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("auth configuration", () => {
  test("reports every missing variable by name", () => {
    const result = readAuthConfig({});
    assert.equal(result.configured, false);
    if (result.configured) return;
    for (const name of AUTH_ENV_VARS) {
      assert.ok(result.problems.some((p) => p.startsWith(`${name} `)), `expected a problem for ${name}`);
    }
  });

  test("treats the .env.example placeholders as not configured", () => {
    const example = Object.fromEntries(
      readFileSync(".env.example", "utf8")
        .split(/\r?\n/)
        .map((line) => line.match(/^([A-Z_]+)="(.*)"$/))
        .filter((match) => match !== null)
        .map((match) => [match[1], match[2]]),
    );
    const result = readAuthConfig(example);
    assert.equal(result.configured, false);
    if (result.configured) return;
    for (const name of ["BETTER_AUTH_SECRET", "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "DATABASE_URL"]) {
      assert.ok(result.problems.includes(`${name} still has its placeholder value.`), `expected ${name} flagged`);
    }
  });

  test("rejects a short secret and a URL with a path, without echoing values", () => {
    const shortSecret = "short-secret-value-123";
    const badUrl = "http://localhost:3000/some/path";
    const result = readAuthConfig({ ...validEnv(), BETTER_AUTH_SECRET: shortSecret, BETTER_AUTH_URL: badUrl });
    assert.equal(result.configured, false);
    if (result.configured) return;
    assert.equal(result.problems.length, 2);
    const text = result.problems.join(" ");
    assert.ok(!text.includes(shortSecret) && !text.includes("/some/path"), "problems must not include values");
  });

  test("accepts a complete configuration and normalizes the base URL to an origin", () => {
    const result = readAuthConfig({ ...validEnv(), BETTER_AUTH_URL: "http://localhost:3000/" });
    assert.equal(result.configured, true);
    if (result.configured) assert.equal(result.config.baseURL, BASE_URL);
  });
});

describe("missing configuration", () => {
  test("auth endpoints answer 503 and create nothing", async () => {
    const response = await handleAuthRequest(new Request(`${BASE_URL}/api/auth/sign-in/social`, { method: "POST" }));
    assert.equal(response.status, 503);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.deepEqual(await response.json(), { error: "Authentication is not configured on this server." });
  });

  test("getAuth refuses to start and names the missing variables only", () => {
    process.env.GOOGLE_CLIENT_SECRET = "a-value-that-must-not-appear";
    assert.throws(getAuth, (error: unknown) => {
      assert.ok(error instanceof AuthNotConfiguredError);
      assert.ok(error.message.includes("BETTER_AUTH_SECRET is not set."));
      assert.ok(!error.message.includes("a-value-that-must-not-appear"));
      return true;
    });
  });
});

describe("database schema", () => {
  test("prisma/schema.prisma has every table and column Better Auth writes", async () => {
    const { prisma, attempts } = createGuardedPrisma();
    const context = (await createAuth(testConfig(), prisma).$context) as { checkSchema?: () => Promise<void> | void };
    assert.equal(typeof context.checkSchema, "function", "the Prisma adapter should register a schema check");
    await context.checkSchema?.(); // Throws SchemaMismatchError listing any missing table or column.
    assert.deepEqual(attempts, []);
  });

  test("the schema check would catch a column the schema lacks", async () => {
    const { prisma } = createGuardedPrisma();
    const auth = betterAuth({
      ...testConfig(),
      database: prismaAdapter(prisma, { provider: "postgresql" }),
      user: { additionalFields: { notInSchema: { type: "string", required: false } } },
      logger: { disabled: true },
    });
    const context = (await auth.$context) as { checkSchema?: () => Promise<void> | void };
    await assert.rejects(async () => context.checkSchema?.(), /notInSchema/);
  });
});

describe("session helper trusts only a verified session cookie", () => {
  const cases: [string, Record<string, string>][] = [
    ["no cookie", {}],
    ["identity headers sent by the client", { "x-user-id": "00000000-0000-7000-8000-000000000000", "x-user-email": "owner@example.com" }],
    ["a bearer token", { authorization: "Bearer invented-session-token" }],
    ["an unsigned session cookie", { cookie: "better-auth.session_token=invented-session-token" }],
    ["a session cookie signed with another secret", { cookie: `better-auth.session_token=${signCookieValue("invented-session-token", randomBytes(32).toString("base64"))}` }],
    ["a forged __Secure- session cookie", { cookie: `__Secure-better-auth.session_token=invented-session-token.${"A".repeat(43)}=` }],
  ];

  for (const [name, headers] of cases) {
    test(`returns null for ${name}, without touching the database`, async () => {
      const { prisma, attempts } = createGuardedPrisma();
      const user = await getSessionUserFromHeaders(createAuth(testConfig(), prisma), new Headers(headers));
      assert.equal(user, null);
      assert.deepEqual(attempts, [], "rejected before any database lookup");
    });
  }

  // Better Auth logs the guard's refusal here as an INTERNAL_SERVER_ERROR. That log line is expected.
  test("control: a correctly signed cookie is looked up in the database (so the guard above is effective)", async () => {
    const { prisma, attempts } = createGuardedPrisma();
    const cookie = `better-auth.session_token=${signCookieValue("unknown-session-token", SECRET)}`;
    await getSessionUserFromHeaders(createAuth(testConfig(), prisma), new Headers({ cookie })).catch(() => null);
    assert.ok(attempts.length > 0, "expected a database lookup for a validly signed cookie");
  });
});

describe("provider-token endpoints are disabled", () => {
  // A validly signed session cookie and a same-origin request: if these
  // endpoints were enabled, they would look the session up in the database.
  const sessionCookie = `better-auth.session_token=${signCookieValue("some-session-token", SECRET)}`;

  async function send(auth: Auth, method: string, path: string) {
    return auth.handler(
      new Request(`${BASE_URL}/api/auth${path}`, {
        method,
        headers: { cookie: sessionCookie, origin: BASE_URL, "content-type": "application/json" },
        body: method === "POST" ? JSON.stringify({ providerId: "google" }) : undefined,
      }),
    );
  }

  const blocked: [string, string][] = [
    ["POST", "/get-access-token"],
    ["POST", "/refresh-token"],
    ["GET", "/account-info"],
  ];

  for (const [method, path] of blocked) {
    test(`${method} ${path} answers 404 without database or provider access`, async () => {
      const { prisma, attempts } = createGuardedPrisma();
      const network = stubFetch();
      const auth = createAuth(testConfig(), prisma);
      for (const spelling of [path, `${path}/`, `${path}?providerId=google`]) {
        const response = await send(auth, method, spelling);
        assert.equal(response.status, 404, `${spelling} should be disabled`);
        assert.doesNotMatch(await response.text(), /accessToken|refreshToken|idToken/);
      }
      assert.deepEqual(attempts, [], "no database access");
      assert.deepEqual(network, [], "no provider requests");
    });
  }

  // Not a test of disabledPaths: Better Auth's router matches paths exactly (no
  // decoding, case-sensitive), so these spellings never reach an endpoint. This
  // guards against that library behavior changing underneath the 404s above.
  test("other spellings of the disabled paths match no endpoint", async () => {
    const { prisma, attempts } = createGuardedPrisma();
    const network = stubFetch();
    const auth = createAuth(testConfig(), prisma);
    const spellings: [string, string][] = [
      ["POST", "/get%2Daccess%2Dtoken"],
      ["POST", "/GET-ACCESS-TOKEN"],
      ["POST", "//get-access-token"],
      ["POST", "/refresh%2Dtoken"],
      ["GET", "/Account-Info"],
      ["GET", "/account%2Dinfo"],
    ];
    for (const [method, path] of spellings) {
      const response = await send(auth, method, path);
      assert.equal(response.status, 404, `${method} ${path} should not match an endpoint`);
    }
    assert.deepEqual(attempts, []);
    assert.deepEqual(network, []);
  });

  // Better Auth logs the guard's refusal here as an error. That log line is expected.
  test("control: an enabled session-protected endpoint does reach the database", async () => {
    const { prisma, attempts } = createGuardedPrisma();
    await send(createAuth(testConfig(), prisma), "GET", "/list-accounts");
    assert.ok(attempts.length > 0, "the guard should see /list-accounts look up the session");
  });
});

describe("Google callback with this app's options (Google's token endpoint emulated)", () => {
  const GOOGLE_SUB = "109876543210987654321";
  const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });

  function base64url(value: string | Buffer): string {
    return Buffer.from(value).toString("base64url");
  }

  /** An RS256 ID token shaped like Google's, signed with a throwaway test key. */
  function googleIdToken(): string {
    const now = Math.floor(Date.now() / 1000);
    const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT", kid: "test-key" }));
    const payload = base64url(
      JSON.stringify({
        iss: "https://accounts.google.com",
        aud: testConfig().googleClientId,
        sub: GOOGLE_SUB,
        email: "pat.example@example.com",
        email_verified: true,
        name: "Pat Example",
        iat: now,
        exp: now + 3600,
      }),
    );
    const signature = createSign("RSA-SHA256").update(`${header}.${payload}`).sign(privateKey);
    return `${header}.${payload}.${base64url(signature)}`;
  }

  function createMemoryAuth() {
    const db: Record<string, Record<string, unknown>[]> = { user: [], session: [], account: [], verification: [] };
    const auth = betterAuth(createAuthOptions(testConfig(), memoryAdapter(db))) as unknown as Auth;
    return { auth, db };
  }

  /** Decrypts a stored token with the app's auth context, as Better Auth would. */
  async function decryptStoredToken(auth: Auth, token: unknown): Promise<string> {
    const context = (await auth.$context) as unknown as Parameters<typeof decryptOAuthToken>[1];
    return decryptOAuthToken(String(token), context);
  }

  function cookiePairs(response: Response): string[] {
    return response.headers.getSetCookie().map((cookie) => cookie.split(";")[0]);
  }

  /** Runs /sign-in/social then /callback/google, with Google's token endpoint answered in-process. */
  async function signInWithGoogle(auth: Auth, accessToken: string) {
    const tokenRequests: URLSearchParams[] = [];
    const network = stubFetch((url, init) => {
      if (url !== "https://oauth2.googleapis.com/token" || init?.method !== "POST") return undefined;
      tokenRequests.push(new URLSearchParams(String(init.body)));
      return Response.json({
        access_token: accessToken,
        refresh_token: `refresh-for-${accessToken}`,
        id_token: googleIdToken(),
        expires_in: 3599,
        scope: "openid https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile",
        token_type: "Bearer",
      });
    });

    const start = await auth.handler(
      new Request(`${BASE_URL}/api/auth/sign-in/social`, {
        method: "POST",
        headers: { origin: BASE_URL, "content-type": "application/json" },
        body: JSON.stringify({ provider: "google", callbackURL: "/", errorCallbackURL: "/sign-in" }),
      }),
    );
    assert.equal(start.status, 200);
    const authorization = new URL(((await start.json()) as { url: string }).url);

    const callback = await auth.handler(
      new Request(
        `${BASE_URL}/api/auth/callback/google?code=test-code&state=${authorization.searchParams.get("state")}`,
        { headers: { cookie: cookiePairs(start).join("; ") } },
      ),
    );
    const sessionCookie = cookiePairs(callback).find((cookie) => cookie.startsWith("better-auth.session_token="));
    return { authorization, callback, sessionCookie, tokenRequests, network };
  }

  test("requests identity scopes only, with PKCE and no offline access", async () => {
    const { auth } = createMemoryAuth();
    const { authorization, tokenRequests, network } = await signInWithGoogle(auth, "access-token-1");
    assert.equal(authorization.origin + authorization.pathname, "https://accounts.google.com/o/oauth2/v2/auth");
    assert.deepEqual(authorization.searchParams.get("scope")?.split(" ").sort(), ["email", "openid", "profile"]);
    assert.equal(authorization.searchParams.get("access_type"), null);
    assert.equal(authorization.searchParams.get("code_challenge_method"), "S256");
    assert.equal(authorization.searchParams.get("redirect_uri"), `${BASE_URL}/api/auth/callback/google`);
    assert.equal(tokenRequests.length, 1);
    assert.ok(tokenRequests[0].get("code_verifier"), "the code exchange sends the PKCE verifier");
    assert.deepEqual(network, ["https://oauth2.googleapis.com/token"], "only the token endpoint is contacted");
  });

  test("first sign-in creates the user, account, and session, and stores no ID token", async () => {
    const { auth, db } = createMemoryAuth();
    const { callback, sessionCookie } = await signInWithGoogle(auth, "access-token-1");

    assert.equal(callback.status, 302);
    assert.doesNotMatch(callback.headers.get("location") ?? "", /error/);
    assert.ok(sessionCookie, "a session cookie is set");

    assert.equal(db.user.length, 1);
    const user = db.user[0];
    assert.equal(user.email, "pat.example@example.com", "identity comes from the ID token before it's dropped");
    assert.equal(user.name, "Pat Example");

    assert.equal(db.account.length, 1);
    const account = db.account[0];
    assert.equal(account.idToken, null, "the ID token is not stored");
    assert.equal(account.providerId, "google");
    assert.equal(account.accountId, GOOGLE_SUB);
    assert.equal(account.userId, user.id);
    assert.match(String(account.scope), /openid/);

    assert.notEqual(account.accessToken, "access-token-1", "the access token is encrypted at rest");
    assert.equal(await decryptStoredToken(auth, account.accessToken), "access-token-1");
    assert.notEqual(account.refreshToken, "refresh-for-access-token-1", "a refresh token, if sent, is encrypted");
    assert.equal(await decryptStoredToken(auth, account.refreshToken), "refresh-for-access-token-1");

    assert.equal(db.session.length, 1);
    assert.equal(db.session[0].userId, user.id);
    assert.deepEqual(await getSessionUserFromHeaders(auth, new Headers({ cookie: sessionCookie ?? "" })), {
      id: user.id,
      name: "Pat Example",
      email: "pat.example@example.com",
    });
  });

  test("a later sign-in updates the account and still stores no ID token", async () => {
    const { auth, db } = createMemoryAuth();
    await signInWithGoogle(auth, "access-token-1");
    const { callback } = await signInWithGoogle(auth, "access-token-2");

    assert.equal(callback.status, 302);
    assert.equal(db.user.length, 1);
    assert.equal(db.account.length, 1, "the existing account is updated, not duplicated");
    const account = db.account[0];
    assert.equal(await decryptStoredToken(auth, account.accessToken), "access-token-2", "the update path ran");
    assert.equal(account.idToken, null, "the update carried an ID token, and it was dropped");
    assert.equal(account.accountId, GOOGLE_SUB);
    assert.equal(account.userId, db.user[0].id);
    assert.equal(db.session.length, 2);
  });

  test("sign-out through the enabled endpoint still ends the session", async () => {
    const { auth, db } = createMemoryAuth();
    const { sessionCookie } = await signInWithGoogle(auth, "access-token-1");
    const response = await auth.handler(
      new Request(`${BASE_URL}/api/auth/sign-out`, {
        method: "POST",
        headers: { cookie: sessionCookie ?? "", origin: BASE_URL, "content-type": "application/json" },
        body: "{}",
      }),
    );
    assert.equal(response.status, 200);
    assert.equal(db.session.length, 0);
    assert.equal(await getSessionUserFromHeaders(auth, new Headers({ cookie: sessionCookie ?? "" })), null);
  });
});
