import { getPrisma } from "@/lib/db";
import { handleZapierImport } from "@/lib/zapier-import";

// Zapier pilot import. Machine-authenticated with a bearer token. The
// destination restaurant is fixed by server configuration (see src/lib/zapier-import.ts).
// POST only: Next.js answers 405 for other methods. No CORS headers are sent.
export async function POST(request: Request): Promise<Response> {
  return handleZapierImport(request, { env: process.env, getDb: getPrisma });
}
