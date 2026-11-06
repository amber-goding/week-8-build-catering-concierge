import { createAuthClient } from "better-auth/react";

/**
 * Browser-side Better Auth client, used only to start Google sign-in (sign-out
 * is a Server Action). It talks to /api/auth on the same origin and holds no secrets.
 * Trusted identity comes from the server (src/lib/session.ts), never from here.
 */
export const authClient = createAuthClient();
