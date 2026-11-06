// Prisma CLI configuration (Prisma ORM 7.10+ looks for prisma7.config.ts first).
//
// Environment loading: Prisma 7 does not read .env files itself. @next/env
// loads them with the same precedence Next.js uses (process.env, then
// .env.$(NODE_ENV).local, .env.local, .env.$(NODE_ENV), .env), so the CLI and
// the app see the same values. Real credentials belong in .env.local.
import { loadEnvConfig } from "@next/env";
import { defineConfig } from "prisma/config";

loadEnvConfig(process.cwd(), process.env.NODE_ENV !== "production");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // CLI commands that touch the database (migrate, studio) use the DIRECT,
    // unpooled Neon connection. The app uses the pooled DATABASE_URL instead.
    // Read with process.env (not prisma/config's env(), which throws when unset)
    // so offline commands such as `prisma generate`, `prisma validate`, and
    // `npm run build` work without credentials.
    url: process.env.DIRECT_URL,
  },
});
