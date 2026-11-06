/**
 * Offline tests for the Zapier pilot import and the restaurant-scoped inquiry reads.
 * Run with: npm test
 *
 * The database is a MOCK. These tests prove the app's own behavior:
 * configuration and authentication checks, input limits, fixed server-side
 * scope, duplicate handling, error sanitizing, and query shapes.
 * They don't prove database behavior. The unique index on
 * (restaurantId, zapierTableId, zapierRecordId) is imitated here by a mock
 * that throws Prisma's P2002 code. Its real enforcement is verified only after
 * the migration is applied.
 */
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, test } from "node:test";
import { formatReceivedAt, INQUIRY_LIST_LIMIT, listInquiriesForRestaurant } from "@/lib/inquiries";
import { handleZapierImport, LIMITS, MAX_BODY_BYTES, type ZapierImportDb } from "@/lib/zapier-import";

const TOKEN = randomBytes(32).toString("base64url"); // Random per run, never printed.
const RESTAURANT_ID = "0190f3a1-0000-7000-8000-0000000000c1";
const TABLE_ID = "01JTESTTABLE00000000000000";
const URL_PATH = "http://localhost:3000/api/integrations/zapier/inquiries";
const VALID = {
  recordId: "01JRECORD0000000000000001",
  inquiryMessage: "Hello,\r\nWe'd like catering for a fictional team lunch.\r\n\r\nThanks, Sam Example",
  aiReview: "Summary: a fictional lunch request.\nMissing: date and guest count.",
};

function env(overrides: Record<string, string | undefined> = {}) {
  return {
    ZAPIER_IMPORT_TOKEN: TOKEN,
    ZAPIER_RESTAURANT_ID: RESTAURANT_ID,
    ZAPIER_TABLE_ID: TABLE_ID,
    DATABASE_URL: "postgresql://user:pass@db.invalid/test",
    ...overrides,
  };
}

function importRequest(options: { authorization?: string | null; contentType?: string | null; body?: BodyInit; headers?: Record<string, string> } = {}) {
  const headers = new Headers(options.headers);
  const authorization = options.authorization === undefined ? `Bearer ${TOKEN}` : options.authorization;
  if (authorization !== null) headers.set("authorization", authorization);
  const contentType = options.contentType === undefined ? "application/json" : options.contentType;
  if (contentType !== null) headers.set("content-type", contentType);
  return new Request(URL_PATH, { method: "POST", headers, body: options.body ?? JSON.stringify(VALID) });
}

type Stored = { id: string; data: Record<string, unknown> };
type Call = { op: string; args: unknown };

/**
 * Mock database with an in-memory inquiry store that enforces the import key
 * the way the unique index does (by throwing P2002 on a duplicate insert).
 */
function createMockDb(options: {
  restaurantExists?: boolean;
  restaurantError?: unknown;
  createError?: unknown;
  hideWinner?: boolean;
  /** Hold every duplicate check until this many have started, to force a race. */
  raceGate?: number;
} = {}) {
  const calls: Call[] = [];
  const store: Stored[] = [];
  let waiting: (() => void)[] = [];
  const keyOf = (value: Record<string, unknown>) => `${value.restaurantId}|${value.zapierTableId}|${value.zapierRecordId}`;
  const db = {
    restaurant: {
      findUnique: async (args: unknown) => {
        calls.push({ op: "restaurant.findUnique", args });
        if (options.restaurantError) throw options.restaurantError;
        return options.restaurantExists === false ? null : { id: RESTAURANT_ID };
      },
    },
    inquiry: {
      findUnique: async (args: { where: { restaurantId_zapierTableId_zapierRecordId: Record<string, unknown> } }) => {
        calls.push({ op: "inquiry.findUnique", args });
        if (options.raceGate) {
          await new Promise<void>((resolve) => {
            waiting.push(resolve);
            if (waiting.length >= (options.raceGate ?? 0)) {
              waiting.forEach((release) => release());
              waiting = [];
            }
          });
          options.raceGate = 0; // Only the first round of checks is held.
        }
        if (options.hideWinner) return null;
        const found = store.find((row) => keyOf(row.data) === keyOf(args.where.restaurantId_zapierTableId_zapierRecordId));
        return found ? { id: found.id } : null;
      },
      create: async (args: { data: Record<string, unknown> }) => {
        calls.push({ op: "inquiry.create", args });
        if (options.createError) throw options.createError;
        if (store.some((row) => keyOf(row.data) === keyOf(args.data))) {
          throw Object.assign(new Error("Unique constraint failed"), { name: "PrismaClientKnownRequestError", code: "P2002" });
        }
        const id = `0190f3a1-0000-7000-8000-${String(store.length + 1).padStart(12, "0")}`;
        store.push({ id, data: args.data });
        return { id };
      },
    },
  };
  return { db: db as unknown as ZapierImportDb, calls, store };
}

const guardDb = (): ZapierImportDb => {
  throw new Error("Test guard: the database must not be used here");
};

let errorLogs: string[] = [];
const originalConsoleError = console.error;
beforeEach(() => {
  errorLogs = [];
  console.error = (...args: unknown[]) => {
    errorLogs.push(args.map(String).join(" "));
  };
});
afterEach(() => {
  console.error = originalConsoleError;
});

async function send(request: Request, getDb: () => ZapierImportDb, environment = env()) {
  const response = await handleZapierImport(request, { env: environment, getDb });
  const text = await response.text();
  return { response, text, body: JSON.parse(text) as Record<string, unknown> };
}

describe("configuration", () => {
  for (const name of ["ZAPIER_IMPORT_TOKEN", "ZAPIER_RESTAURANT_ID", "ZAPIER_TABLE_ID", "DATABASE_URL"]) {
    test(`missing ${name} answers 503 without touching the database`, async () => {
      const { response, body } = await send(importRequest(), guardDb, env({ [name]: undefined }));
      assert.equal(response.status, 503);
      assert.deepEqual(body, { error: "import_unavailable" });
    });
  }

  test("placeholder, short-token, and non-UUID configurations are refused", async () => {
    for (const overrides of [
      { ZAPIER_IMPORT_TOKEN: "REPLACE_WITH_A_RANDOM_TOKEN_OF_AT_LEAST_32_CHARACTERS" },
      { ZAPIER_IMPORT_TOKEN: "a".repeat(31) },
      { ZAPIER_RESTAURANT_ID: "not-a-uuid" },
      { ZAPIER_TABLE_ID: "has spaces" },
    ]) {
      const { response } = await send(importRequest(), guardDb, env(overrides));
      assert.equal(response.status, 503, JSON.stringify(Object.keys(overrides)));
    }
  });
});

describe("authentication happens before any body reading or database work", () => {
  const bad: [string, string | null][] = [
    ["no Authorization header", null],
    ["an empty bearer token", "Bearer "],
    ["the wrong scheme", `Basic ${TOKEN}`],
    ["a wrong token of the same length", `Bearer ${"x".repeat(TOKEN.length)}`],
    ["a prefix of the token", `Bearer ${TOKEN.slice(0, -1)}`],
    ["the token with extra characters", `Bearer ${TOKEN}x`],
    ["the token followed by more text", `Bearer ${TOKEN} extra`],
  ];
  for (const [name, authorization] of bad) {
    test(`rejects ${name} with 401`, async () => {
      // Deliberately invalid content type and body: authentication must fail first.
      const request = importRequest({ authorization, contentType: "text/plain", body: "not json" });
      const { response, body } = await send(request, guardDb);
      assert.equal(response.status, 401);
      assert.deepEqual(body, { error: "unauthorized" });
      assert.match(response.headers.get("www-authenticate") ?? "", /^Bearer/);
      assert.equal(request.bodyUsed, false, "the body is not read before authentication");
    });
  }

  test("accepts the scheme name in any case (RFC 6750)", async () => {
    const { db } = createMockDb();
    const { response } = await send(importRequest({ authorization: `bearer ${TOKEN}` }), () => db);
    assert.equal(response.status, 201);
  });
});

describe("content type and size", () => {
  test("requires JSON", async () => {
    for (const contentType of [null, "text/plain", "application/x-www-form-urlencoded", "multipart/form-data"]) {
      const { response } = await send(importRequest({ contentType }), guardDb);
      assert.equal(response.status, 415, String(contentType));
    }
  });

  test("accepts application/json with a charset", async () => {
    const { db } = createMockDb();
    const { response } = await send(importRequest({ contentType: "application/json; charset=utf-8" }), () => db);
    assert.equal(response.status, 201);
  });

  test("an oversized declared Content-Length is refused without reading the body", async () => {
    const request = importRequest({ headers: { "content-length": String(MAX_BODY_BYTES + 1) } });
    const { response } = await send(request, guardDb);
    assert.equal(response.status, 413);
    assert.equal(request.bodyUsed, false);
  });

  test("an oversized streamed body with no Content-Length is cut off while reading", async () => {
    let pulled = 0;
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        pulled += 1;
        controller.enqueue(new Uint8Array(64 * 1024).fill(0x61));
        if (pulled > 100) controller.close(); // Far more than the limit if it kept reading.
      },
    });
    const request = new Request(URL_PATH, {
      method: "POST",
      headers: { authorization: `Bearer ${TOKEN}`, "content-type": "application/json" },
      body: stream,
      duplex: "half",
    } as RequestInit);
    const { response } = await send(request, guardDb);
    assert.equal(response.status, 413);
    assert.ok(pulled <= 4, `stopped reading early (read ${pulled} chunks)`);
  });

  test("malformed JSON and invalid UTF-8 answer 400", async () => {
    for (const body of ['{"recordId": ', new Uint8Array([0x7b, 0xff, 0xfe, 0x7d])]) {
      const { response, body: json } = await send(importRequest({ body }), guardDb);
      assert.equal(response.status, 400);
      assert.deepEqual(json, { error: "invalid_json" });
    }
  });
});

describe("payload validation", () => {
  const invalid: [string, unknown][] = [
    ["an array", [VALID]],
    ["null", null],
    ["a string", "hello"],
    ["missing recordId", { inquiryMessage: VALID.inquiryMessage, aiReview: VALID.aiReview }],
    ["missing inquiryMessage", { recordId: VALID.recordId, aiReview: VALID.aiReview }],
    ["missing aiReview", { recordId: VALID.recordId, inquiryMessage: VALID.inquiryMessage }],
    ["an empty inquiryMessage", { ...VALID, inquiryMessage: "" }],
    ["a whitespace-only aiReview", { ...VALID, aiReview: " \n\t " }],
    ["a numeric recordId", { ...VALID, recordId: 12345 }],
    ["an object as inquiryMessage", { ...VALID, inquiryMessage: { text: "hi" } }],
    ["a recordId with spaces", { ...VALID, recordId: "record 1" }],
    ["a recordId over the limit", { ...VALID, recordId: "r".repeat(LIMITS.recordId + 1) }],
    ["an inquiryMessage over the limit", { ...VALID, inquiryMessage: "m".repeat(LIMITS.inquiryMessage + 1) }],
    ["an aiReview over the limit", { ...VALID, aiReview: "a".repeat(LIMITS.aiReview + 1) }],
    ["control characters", { ...VALID, inquiryMessage: "Hello\u0000there" }],
    ["a client-supplied restaurantId", { ...VALID, restaurantId: "0190f3a1-0000-7000-8000-00000000dead" }],
    ["a client-supplied demonstration marker", { ...VALID, isDemo: false }],
    ["a client-supplied table ID", { ...VALID, zapierTableId: "OTHERTABLE" }],
    ["a client-supplied source", { ...VALID, source: "EMAIL" }],
  ];
  for (const [name, payload] of invalid) {
    test(`rejects ${name} with 400, without database work or echoing values`, async () => {
      const { response, body, text } = await send(importRequest({ body: JSON.stringify(payload) }), guardDb);
      assert.equal(response.status, 400);
      assert.equal(body.error, "invalid_payload");
      assert.ok(Array.isArray(body.problems) && body.problems.length > 0);
      assert.ok(!text.includes("dead") && !text.includes("OTHERTABLE") && !text.includes("Hello"), "no submitted values are echoed");
    });
  }

  test("accepts values exactly at the limits", async () => {
    const { db } = createMockDb();
    const payload = {
      recordId: "r".repeat(LIMITS.recordId),
      inquiryMessage: "m".repeat(LIMITS.inquiryMessage),
      aiReview: "a".repeat(LIMITS.aiReview),
    };
    const { response } = await send(importRequest({ body: JSON.stringify(payload) }), () => db);
    assert.equal(response.status, 201);
  });
});

describe("fixed server-side scope", () => {
  test("creates the inquiry for the configured restaurant and table, as demonstration data, with source MANUAL", async () => {
    const { db, calls } = createMockDb();
    const { response, body, text } = await send(importRequest(), () => db);

    assert.equal(response.status, 201);
    assert.deepEqual(Object.keys(body).sort(), ["inquiryId", "status"]);
    assert.equal(body.status, "created");
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(response.headers.get("access-control-allow-origin"), null, "no CORS headers");
    assert.ok(!text.includes("fictional team lunch") && !text.includes("Summary"), "no record contents in the response");

    assert.deepEqual((calls[0].args as { where: unknown }).where, { id: RESTAURANT_ID }, "the configured restaurant is confirmed first");
    const create = calls.find((call) => call.op === "inquiry.create")?.args as { data: Record<string, unknown> };
    assert.deepEqual(create.data, {
      restaurantId: RESTAURANT_ID,
      zapierTableId: TABLE_ID,
      zapierRecordId: VALID.recordId,
      source: "MANUAL",
      isDemo: true,
      inquiryMessage: "Hello,\nWe'd like catering for a fictional team lunch.\n\nThanks, Sam Example",
      aiReview: VALID.aiReview,
    });
  });

  test("a missing configured restaurant answers 503 and creates nothing", async () => {
    const { db, calls } = createMockDb({ restaurantExists: false });
    const { response, body } = await send(importRequest(), () => db);
    assert.equal(response.status, 503);
    assert.deepEqual(body, { error: "import_unavailable" });
    assert.ok(!calls.some((call) => call.op.startsWith("inquiry.")));
    assert.ok(errorLogs.every((line) => !line.includes(RESTAURANT_ID)), "the restaurant ID isn't logged");
  });
});

describe("duplicate deliveries", () => {
  test("a retry of an imported record returns the existing inquiry and writes nothing", async () => {
    const { db, calls, store } = createMockDb();
    const first = await send(importRequest(), () => db);
    const retry = await send(importRequest({ body: JSON.stringify({ ...VALID, aiReview: "A different review" }) }), () => db);

    assert.equal(first.response.status, 201);
    assert.equal(retry.response.status, 200);
    assert.deepEqual(retry.body, { status: "duplicate", inquiryId: first.body.inquiryId });
    assert.equal(store.length, 1);
    assert.equal(store[0].data.aiReview, VALID.aiReview, "the stored record is not overwritten");
    assert.equal(calls.filter((call) => call.op === "inquiry.create").length, 1);
  });

  test("two concurrent deliveries of the same record create exactly one inquiry", async () => {
    const { db, store } = createMockDb({ raceGate: 2 });
    const [a, b] = await Promise.all([send(importRequest(), () => db), send(importRequest(), () => db)]);
    const statuses = [a.response.status, b.response.status].sort();
    assert.deepEqual(statuses, [200, 201], "one created, one reported as a duplicate");
    assert.equal(a.body.inquiryId, b.body.inquiryId);
    assert.equal(store.length, 1);
  });

  test("the same record ID from a different configured table is a separate inquiry", async () => {
    const { db, store } = createMockDb();
    await send(importRequest(), () => db);
    const other = await send(importRequest(), () => db, env({ ZAPIER_TABLE_ID: "01JOTHERTABLE000000000000" }));
    assert.equal(other.response.status, 201);
    assert.equal(store.length, 2);
  });

  test("a P2002 with no visible winner is reported as a failure, not hidden", async () => {
    const { db } = createMockDb({
      hideWinner: true,
      createError: Object.assign(new Error("Unique constraint failed"), { code: "P2002" }),
    });
    const { response } = await send(importRequest(), () => db);
    assert.equal(response.status, 500);
  });
});

describe("database failures", () => {
  const secretish = "connect ECONNREFUSED postgresql://user:hunter2@db.example.invalid";
  const cases: [string, Parameters<typeof createMockDb>[0] | "getDb"][] = [
    ["the restaurant check fails", { restaurantError: Object.assign(new Error(secretish), { name: "PrismaClientKnownRequestError", code: "P1001" }) }],
    ["the insert fails", { createError: Object.assign(new Error(secretish), { name: "PrismaClientKnownRequestError", code: "P1017" }) }],
    ["the database client can't be created", "getDb"],
  ];
  for (const [name, options] of cases) {
    test(`${name}: generic 500, sanitized log`, async () => {
      const getDb =
        options === "getDb"
          ? () => {
              throw new Error(`Database is not configured correctly: ${secretish}`);
            }
          : (() => {
              const { db } = createMockDb(options);
              return () => db;
            })();
      const { response, body, text } = await send(importRequest(), getDb);
      assert.equal(response.status, 500);
      assert.deepEqual(body, { error: "import_failed" });
      assert.ok(!text.includes("hunter2"));
      assert.equal(errorLogs.length, 1);
      for (const forbidden of ["hunter2", "postgresql://", TOKEN, "fictional team lunch", "Summary", "authorization"]) {
        assert.ok(!errorLogs[0].includes(forbidden), `log must not contain ${forbidden}`);
      }
    });
  }
});

describe("restaurant-scoped inquiry reads", () => {
  test("filters by the given restaurant only, newest first, with a bounded page", async () => {
    const calls: unknown[] = [];
    const db = {
      inquiry: {
        findMany: async (args: unknown) => {
          calls.push(args);
          return [
            {
              id: "i1",
              inquiryMessage: "Hello",
              aiReview: "Review",
              isDemo: true,
              zapierRecordId: "01JRECORD",
              createdAt: new Date("2026-11-06T16:57:10Z"),
            },
          ];
        },
      },
    };
    const rows = await listInquiriesForRestaurant(db as never, RESTAURANT_ID);
    const args = calls[0] as { where: unknown; take: number; orderBy: unknown };
    assert.deepEqual(args.where, { restaurantId: RESTAURANT_ID });
    assert.equal(args.take, INQUIRY_LIST_LIMIT);
    assert.deepEqual(args.orderBy, [{ createdAt: "desc" }, { id: "desc" }]);
    assert.deepEqual(rows, [
      {
        id: "i1",
        inquiryMessage: "Hello",
        aiReview: "Review",
        isDemo: true,
        importedFromZapier: true,
        receivedAt: new Date("2026-11-06T16:57:10Z"),
      },
    ]);
    assert.ok(!("zapierRecordId" in rows[0]), "Zapier IDs aren't passed to the page");
  });

  test("the Inquiries page takes its restaurant only from requireRestaurant()", () => {
    // Source check: the page reads no URL input and scopes the query with the membership's restaurant ID.
    const source = readFileSync("src/app/inquiries/page.tsx", "utf8");
    assert.match(source, /await requireRestaurant\(\)/);
    assert.match(source, /listInquiriesForRestaurant\(getPrisma\(\), restaurant\.id\)/);
    assert.doesNotMatch(source, /searchParams|params|cookies\(|headers\(/);
  });

  test("received timestamps are formatted deterministically in UTC", () => {
    assert.equal(formatReceivedAt(new Date("2026-11-06T16:57:10Z")), "Nov 6, 2026, 4:57 PM UTC");
    assert.equal(formatReceivedAt(new Date("2026-01-02T00:05:00Z")), "Jan 2, 2026, 12:05 AM UTC");
  });
});
