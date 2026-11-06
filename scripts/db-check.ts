/**
 * Manual, read-only database check. Run with: npm run db:check
 *
 * Verifies that the app's pooled connection (DATABASE_URL, through getPrisma()
 * in src/lib/db.ts) can reach the database and that the Restaurant and Inquiry
 * tables answer COUNT queries. It reads no individual records and writes nothing.
 *
 * Not part of install, lint, or build. It runs only when invoked explicitly.
 * It runs under Node's "react-server" export condition (see package.json), so
 * db.ts keeps its real `server-only` import instead of a mock.
 *
 * Output is sanitized. It never prints connection strings, hostnames,
 * credentials, raw database errors, or record contents. On failure it prints
 * only error class names, Prisma/SQLSTATE codes, and driver error kinds, each
 * checked against a strict pattern.
 */
import path from "node:path";
import { loadEnvConfig } from "@next/env";
import { getPrisma } from "@/lib/db";

/** Backstop if something hangs beyond the connection and query timeouts in db.ts. */
const OVERALL_TIMEOUT_MS = 45_000;

const SAFE_NAME = /^[A-Za-z0-9_]{1,64}$/;
const SAFE_CODE = /^(P\d{4}|[0-9A-Z]{5}|E[A-Z_]{2,30})$/;

const CODE_HINTS: Record<string, string> = {
  ENOTFOUND: "the database host name could not be resolved.",
  ECONNREFUSED: "the database host refused the connection.",
  ETIMEDOUT: "the connection timed out.",
  P1000: "authentication failed. Check the credentials in DATABASE_URL.",
  P1001: "the database server could not be reached.",
  P1003: "the database named in DATABASE_URL does not exist.",
  P2021: "a table does not exist. Has the migration been applied to this database?",
  "28P01": "authentication failed. Check the credentials in DATABASE_URL.",
  "3D000": "the database named in DATABASE_URL does not exist.",
  "42P01": "a table does not exist. Has the migration been applied to this database?",
};

type ErrorLike = {
  name?: unknown;
  message?: unknown;
  code?: unknown;
  errorCode?: unknown;
  meta?: { driverAdapterError?: { cause?: { kind?: unknown; originalCode?: unknown } } };
};

/** Builds a failure description from whitelisted fields only. */
function describeError(error: unknown): string {
  // db.ts configuration errors are fixed strings that name variables, never values.
  if (error instanceof Error && error.message.startsWith("Database is not configured")) {
    return error.message;
  }
  if (!error || typeof error !== "object") return "unknown error";

  const e = error as ErrorLike;
  const parts: string[] = [];
  // The message may contain hostnames or server text. It is matched against
  // fixed patterns below but never printed. Only an errno-style code is extracted.
  const message = typeof e.message === "string" ? e.message : "";
  const errno = message.match(/\b(E[A-Z_]{3,30})\b/)?.[1];
  const codes = [e.code, e.errorCode, e.meta?.driverAdapterError?.cause?.originalCode, errno].filter(
    (c): c is string => typeof c === "string" && SAFE_CODE.test(c),
  );
  const kind = e.meta?.driverAdapterError?.cause?.kind;
  // Connection failures from the Neon driver can surface as a WebSocket
  // ErrorEvent (not an Error), so fall back to the constructor name.
  const typeName = typeof e.name === "string" ? e.name : (error as object).constructor?.name;

  if (typeof typeName === "string" && SAFE_NAME.test(typeName)) parts.push(`type ${typeName}`);
  for (const code of new Set(codes)) parts.push(`code ${code}`);
  if (typeof kind === "string" && SAFE_NAME.test(kind)) parts.push(`driver error ${kind}`);

  const hint =
    codes.map((c) => CODE_HINTS[c]).find(Boolean) ??
    (/time(d)?\s?out/i.test(message)
      ? "the connection or query timed out."
      : typeName === "ErrorEvent"
        ? "the WebSocket connection to the database failed (network, DNS, or TLS)."
        : undefined);

  return `${parts.length > 0 ? parts.join(", ") : "unknown error"}${hint ? `. Likely cause: ${hint}` : ""}`;
}

/** True when DATABASE_URL points at a Neon pooler endpoint. Prints nothing about the URL itself. */
function usesNeonPooler(): boolean {
  try {
    return new URL(process.env.DATABASE_URL ?? "").hostname.includes("-pooler.");
  } catch {
    return false;
  }
}

async function main(): Promise<number> {
  console.log("Catering Concierge database check (read-only, pooled DATABASE_URL)");

  // Same loader and precedence as prisma7.config.ts and Next.js. The quiet logger
  // keeps @next/env from printing anything. Only loaded file names are shown.
  const { loadedEnvFiles } = loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production", {
    info: () => {},
    error: () => {},
  });
  const fileNames = loadedEnvFiles.map((f) => path.basename(f.path));
  console.log(`Environment files loaded: ${fileNames.length > 0 ? fileNames.join(", ") : "none"}`);

  if (process.env.DATABASE_URL && !usesNeonPooler()) {
    console.error(
      "FAIL DATABASE_URL is not a Neon pooled endpoint (its host has no '-pooler'). " +
        "Use the pooled connection string for DATABASE_URL.",
    );
    return 1;
  }

  let step = "creating the Prisma client";
  let prisma: ReturnType<typeof getPrisma> | undefined;
  try {
    prisma = getPrisma();

    step = "counting Restaurant rows";
    const restaurants = await prisma.restaurant.count();
    console.log(`OK   pooled connection established (Neon pooler endpoint)`);
    console.log(`OK   Restaurant count query succeeded (${restaurants} rows)`);

    step = "counting Inquiry rows";
    const inquiries = await prisma.inquiry.count();
    console.log(`OK   Inquiry count query succeeded (${inquiries} rows)`);

    console.log("PASS Pooled application connection and read-only queries on both tables work. No data was written.");
    return 0;
  } catch (error) {
    console.error(`FAIL while ${step}: ${describeError(error)}`);
    return 1;
  } finally {
    if (prisma) {
      try {
        await prisma.$disconnect();
      } catch {
        console.error("WARN the Prisma connection did not close cleanly.");
      }
    }
  }
}

const watchdog = setTimeout(() => {
  console.error(`FAIL database check did not finish within ${OVERALL_TIMEOUT_MS / 1000}s.`);
  process.exit(1);
}, OVERALL_TIMEOUT_MS);

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch(() => {
    console.error("FAIL unexpected error in the database check (details suppressed).");
    process.exitCode = 1;
  })
  .finally(() => clearTimeout(watchdog));
