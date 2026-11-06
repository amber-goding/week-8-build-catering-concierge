import { toNextJsHandler } from "better-auth/next-js";
import { handleAuthRequest } from "@/lib/auth";

// Better Auth's endpoints: Google sign-in and callback, session, and sign-out.
// handleAuthRequest creates the auth instance on the first request, not at build time.
export const { GET, POST } = toNextJsHandler(handleAuthRequest);
