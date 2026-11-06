import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";
import type { PrismaClient } from "@/generated/prisma/client";
import { describeErrorSafely } from "@/lib/restaurants";

/**
 * Zapier pilot import: POST /api/integrations/zapier/inquiries.
 *
 * A single-restaurant integration, not a general multi-tenant credential system:
 * - One bearer token (ZAPIER_IMPORT_TOKEN) authenticates the one Zap.
 * - The destination restaurant (ZAPIER_RESTAURANT_ID) and source table
 *   (ZAPIER_TABLE_ID) come from server configuration, never from the request.
 * - Every import is marked as demonstration data, because the pilot table
 *   holds fictional inquiries. The request can't change that.
 *
 * Order of checks: configuration, then authentication, then content type and
 * size, then payload validation, and only then the database. Responses carry
 * only a status and the inquiry ID. Logs carry only error types and codes:
 * never headers, bodies, tokens, or raw database errors.
 */

export const MAX_BODY_BYTES = 128 * 1024;
export const LIMITS = { recordId: 128, inquiryMessage: 10_000, aiReview: 20_000 } as const;
const ALLOWED_FIELDS = new Set(["recordId", "inquiryMessage", "aiReview"]);
const MIN_TOKEN_LENGTH = 32;
const PLACEHOLDER_MARKER = "REPLACE_";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Printable ASCII without spaces. Zapier Tables IDs fit; anything else is refused. */
const OPAQUE_ID = /^[\x21-\x7e]+$/;
/** Control characters other than tab and line breaks. */
const DISALLOWED_CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;

type Env = Partial<Record<string, string | undefined>>;
export type ZapierImportDb = Pick<PrismaClient, "restaurant" | "inquiry">;
export type ZapierImportDeps = { env: Env; getDb: () => ZapierImportDb };

type ZapierConfig = { token: string; restaurantId: string; tableId: string };

/** The pilot's server configuration, or null if anything is missing or invalid. Values are never reported. */
export function readZapierConfig(env: Env): ZapierConfig | null {
  const token = env.ZAPIER_IMPORT_TOKEN?.trim() ?? "";
  const restaurantId = env.ZAPIER_RESTAURANT_ID?.trim() ?? "";
  const tableId = env.ZAPIER_TABLE_ID?.trim() ?? "";
  const databaseUrl = env.DATABASE_URL?.trim() ?? "";
  const values = [token, restaurantId, tableId, databaseUrl];
  if (values.some((value) => !value || value.includes(PLACEHOLDER_MARKER))) return null;
  if (token.length < MIN_TOKEN_LENGTH || /\s/.test(token)) return null;
  if (!UUID.test(restaurantId)) return null;
  if (tableId.length > LIMITS.recordId || !OPAQUE_ID.test(tableId)) return null;
  return { token, restaurantId, tableId };
}

export async function handleZapierImport(request: Request, deps: ZapierImportDeps): Promise<Response> {
  const config = readZapierConfig(deps.env);
  if (!config) return json(503, { error: "import_unavailable" });

  if (!isAuthorized(request.headers.get("authorization"), config.token)) {
    return json(401, { error: "unauthorized" }, { "WWW-Authenticate": 'Bearer realm="zapier-import"' });
  }

  const mediaType = request.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
  if (mediaType !== "application/json") return json(415, { error: "unsupported_media_type" });

  const body = await readBodyWithLimit(request, MAX_BODY_BYTES);
  if (!body.ok) {
    return body.reason === "too_large" ? json(413, { error: "payload_too_large" }) : json(400, { error: "invalid_json" });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(body.text);
  } catch {
    return json(400, { error: "invalid_json" });
  }
  const payload = validatePayload(parsed);
  if (!payload.ok) return json(400, { error: "invalid_payload", problems: payload.problems });

  try {
    const db = deps.getDb();
    const restaurant = await db.restaurant.findUnique({ where: { id: config.restaurantId }, select: { id: true } });
    if (!restaurant) {
      console.error("[zapier-import] The configured restaurant does not exist. Check ZAPIER_RESTAURANT_ID.");
      return json(503, { error: "import_unavailable" });
    }

    const key = { restaurantId: config.restaurantId, zapierTableId: config.tableId, zapierRecordId: payload.value.recordId };
    const existing = await findImported(db, key);
    if (existing) return json(200, { status: "duplicate", inquiryId: existing.id });

    try {
      const created = await db.inquiry.create({
        data: {
          ...key,
          source: "MANUAL",
          isDemo: true,
          inquiryMessage: payload.value.inquiryMessage,
          aiReview: payload.value.aiReview,
        },
        select: { id: true },
      });
      return json(201, { status: "created", inquiryId: created.id });
    } catch (error) {
      // A concurrent delivery of the same record won the race. Return it; never overwrite it.
      if (isUniqueViolation(error)) {
        const winner = await findImported(db, key);
        if (winner) return json(200, { status: "duplicate", inquiryId: winner.id });
      }
      throw error;
    }
  } catch (error) {
    console.error(`[zapier-import] Import failed: ${describeErrorSafely(error)}`);
    return json(500, { error: "import_failed" });
  }
}

/** Timing-safe bearer check. Hashing both sides gives equal-length inputs, so the comparison never leaks the token length. */
function isAuthorized(header: string | null, expected: string): boolean {
  const match = header?.match(/^Bearer[ ]+([^\s]+)$/i);
  if (!match) return false;
  const provided = createHash("sha256").update(match[1]).digest();
  const wanted = createHash("sha256").update(expected).digest();
  return timingSafeEqual(provided, wanted);
}

type BodyResult = { ok: true; text: string } | { ok: false; reason: "too_large" | "unreadable" };

/** Reads at most `maxBytes`, stopping as soon as the limit is passed, whatever Content-Length claims. */
async function readBodyWithLimit(request: Request, maxBytes: number): Promise<BodyResult> {
  const declared = request.headers.get("content-length");
  if (declared !== null && Number(declared) > maxBytes) return { ok: false, reason: "too_large" };
  if (!request.body) return { ok: true, text: "" };

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel().catch(() => {});
        return { ok: false, reason: "too_large" };
      }
      chunks.push(value);
    }
  } catch {
    return { ok: false, reason: "unreadable" };
  }
  try {
    return { ok: true, text: new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks)) };
  } catch {
    return { ok: false, reason: "unreadable" };
  }
}

type ImportPayload = { recordId: string; inquiryMessage: string; aiReview: string };
type PayloadResult = { ok: true; value: ImportPayload } | { ok: false; problems: string[] };

/** Accepts exactly recordId, inquiryMessage, and aiReview as bounded, non-empty strings. Problems name fields, never values. */
export function validatePayload(input: unknown): PayloadResult {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return { ok: false, problems: ["The body must be a JSON object."] };
  }
  const record = input as Record<string, unknown>;
  const problems: string[] = [];
  if (Object.keys(record).some((key) => !ALLOWED_FIELDS.has(key))) {
    problems.push("Only recordId, inquiryMessage, and aiReview are accepted.");
  }

  const recordId = typeof record.recordId === "string" ? record.recordId.trim() : null;
  if (!recordId) problems.push("recordId must be a non-empty string.");
  else if (recordId.length > LIMITS.recordId || !OPAQUE_ID.test(recordId)) {
    problems.push(`recordId must be at most ${LIMITS.recordId} printable characters without spaces.`);
  }

  const inquiryMessage = normalizeText(record.inquiryMessage, "inquiryMessage", LIMITS.inquiryMessage, problems);
  const aiReview = normalizeText(record.aiReview, "aiReview", LIMITS.aiReview, problems);

  if (problems.length > 0 || !recordId || inquiryMessage === null || aiReview === null) return { ok: false, problems };
  return { ok: true, value: { recordId, inquiryMessage, aiReview } };
}

/** Normalizes line endings to \n and trims. Keeps the text otherwise verbatim: it's stored as untrusted plain text. */
function normalizeText(value: unknown, field: string, max: number, problems: string[]): string | null {
  if (typeof value !== "string") {
    problems.push(`${field} must be a non-empty string.`);
    return null;
  }
  const text = value.replace(/\r\n?/g, "\n").trim();
  if (!text) {
    problems.push(`${field} must be a non-empty string.`);
    return null;
  }
  if ([...text].length > max) {
    problems.push(`${field} must be at most ${max} characters.`);
    return null;
  }
  if (DISALLOWED_CONTROL.test(text)) {
    problems.push(`${field} contains unsupported control characters.`);
    return null;
  }
  return text;
}

type ImportKey = { restaurantId: string; zapierTableId: string; zapierRecordId: string };

function findImported(db: ZapierImportDb, key: ImportKey) {
  return db.inquiry.findUnique({ where: { restaurantId_zapierTableId_zapierRecordId: key }, select: { id: true } });
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && (error as { code?: unknown }).code === "P2002";
}

function json(status: number, body: Record<string, unknown>, headers: Record<string, string> = {}): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });
}
