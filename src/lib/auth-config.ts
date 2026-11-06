import "server-only";

/**
 * Reads and checks the environment variables that authentication needs.
 *
 * Server-only: the returned config holds secrets. UI code should use
 * getAuthSetupStatus(), which reports only whether sign-in is configured and
 * which variables need attention, by name. Values are never included.
 */

/** Variables sign-in needs, in the order they're reported. */
export const AUTH_ENV_VARS = [
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "DATABASE_URL",
] as const;

type AuthEnvVar = (typeof AUTH_ENV_VARS)[number];
type Env = Partial<Record<string, string | undefined>>;

export type AuthConfig = {
  secret: string;
  /** Origin only, for example "http://localhost:3000". */
  baseURL: string;
  googleClientId: string;
  googleClientSecret: string;
};

export type AuthConfigResult =
  | { configured: true; config: AuthConfig }
  | { configured: false; problems: string[] };

/** Better Auth warns below this length. This app refuses to start sign-in instead. */
const MIN_SECRET_LENGTH = 32;

/** Placeholder values in .env.example contain this marker. */
const PLACEHOLDER_MARKER = "REPLACE_";

export function readAuthConfig(env: Env = process.env): AuthConfigResult {
  const problems: string[] = [];
  const values = {} as Record<AuthEnvVar, string>;

  for (const name of AUTH_ENV_VARS) {
    const value = env[name]?.trim() ?? "";
    if (!value) problems.push(`${name} is not set.`);
    else if (value.includes(PLACEHOLDER_MARKER)) problems.push(`${name} still has its placeholder value.`);
    values[name] = value;
  }

  const secret = values.BETTER_AUTH_SECRET;
  if (secret && !secret.includes(PLACEHOLDER_MARKER) && secret.length < MIN_SECRET_LENGTH) {
    problems.push(`BETTER_AUTH_SECRET must be at least ${MIN_SECRET_LENGTH} characters.`);
  }

  const baseURL = values.BETTER_AUTH_URL ? parseOrigin(values.BETTER_AUTH_URL) : null;
  if (values.BETTER_AUTH_URL && !values.BETTER_AUTH_URL.includes(PLACEHOLDER_MARKER) && !baseURL) {
    problems.push("BETTER_AUTH_URL must be an http:// or https:// origin with no path, such as http://localhost:3000.");
  }

  if (problems.length > 0 || !baseURL) return { configured: false, problems };

  return {
    configured: true,
    config: {
      secret,
      baseURL,
      googleClientId: values.GOOGLE_CLIENT_ID,
      googleClientSecret: values.GOOGLE_CLIENT_SECRET,
    },
  };
}

export type AuthSetupStatus = { configured: boolean; problems: string[] };

/** Safe to render: a flag plus messages that name variables, never their values. */
export function getAuthSetupStatus(env: Env = process.env): AuthSetupStatus {
  const result = readAuthConfig(env);
  return result.configured ? { configured: true, problems: [] } : { configured: false, problems: result.problems };
}

function parseOrigin(value: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (url.pathname !== "/" || url.search || url.hash || url.username || url.password) return null;
    return url.origin;
  } catch {
    return null;
  }
}
