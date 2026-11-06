import { connection } from "next/server";

// Process health for Railway's deploy healthcheck. It doesn't query the
// database or report configuration. connection() makes it answer at request
// time, so a 200 means this server process is up and serving.
export async function GET(): Promise<Response> {
  await connection();
  return Response.json({ status: "ok" }, { headers: { "Cache-Control": "no-store" } });
}
