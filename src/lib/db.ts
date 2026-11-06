import "server-only";

import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * Server-only Prisma client for Neon PostgreSQL.
 *
 * - Created lazily on the first getPrisma() call, never at import time.
 *   Constructing it does not open a connection: the Neon adapter creates its
 *   pool on the first query.
 * - Reused through globalThis so dev hot reloads don't create a new client
 *   (and pool) on every edit.
 * - Uses the POOLED connection string (DATABASE_URL). Prisma CLI commands use
 *   DIRECT_URL through prisma7.config.ts instead.
 *
 * Not authorization: callers must scope every inquiry query to a restaurant
 * the authenticated user is allowed to access. That layer does not exist yet,
 * so don't use this from any route, page, or action until it does.
 */

const globalForPrisma = globalThis as typeof globalThis & {
  __cateringConciergePrisma?: PrismaClient;
};

/** Max time to establish a pooled connection (allows for a Neon compute cold start). */
const CONNECTION_TIMEOUT_MS = 10_000;
/** Max time for a single query to return. */
const QUERY_TIMEOUT_MS = 15_000;

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;

  // Error messages name the variable only. Never include its value.
  if (!connectionString) {
    throw new Error(
      "Database is not configured: DATABASE_URL is not set. " +
        "Add the pooled Neon connection string to .env.local (see .env.example).",
    );
  }
  if (!/^postgres(ql)?:\/\//.test(connectionString)) {
    throw new Error(
      "Database is not configured correctly: DATABASE_URL must be a postgresql:// connection string.",
    );
  }

  return new PrismaClient({
    adapter: new PrismaNeon({
      connectionString,
      // Bounded waits so an unreachable database fails instead of hanging.
      // Both are client-side options of the Neon driver's pg-compatible Pool,
      // so they work through Neon's pooler (unlike `statement_timeout`, which
      // is sent as a startup parameter).
      connectionTimeoutMillis: CONNECTION_TIMEOUT_MS,
      query_timeout: QUERY_TIMEOUT_MS,
    }),
  });
}

export function getPrisma(): PrismaClient {
  globalForPrisma.__cateringConciergePrisma ??= createPrismaClient();
  return globalForPrisma.__cateringConciergePrisma;
}
