# Prompt History

A numbered log of implementation tasks given to AI agents, and what each actually delivered.

---

## 001: Foundation: Next.js app and dashboard shell

**Date:** 2026-11-06
**Agent:** Claude Code (Claude Opus 5.5)

### Request

Act as the implementation agent for Catering Concierge. Foundation only:

1. Inspect the repository and report what exists.
2. If no app exists, initialize a minimal Next.js + TypeScript + Tailwind app in the repo root.
3. Build a premium, responsive dashboard shell: cream/ivory, deep forest green, and a restrained warm accent; refined typography; a desktop sidebar plus mobile navigation; summary cards; an inquiry pipeline preview with clearly labeled fictional data; a visible demonstration-mode indicator; navigation for Dashboard, Inquiries, Email, Menu, Quotes, Events, and Settings.
4. Distinguish working navigation from unimplemented functionality. No misleading buttons, fake integrations, or false success messages.
5. Create README.md, CLAUDE.md, AGENTS.md, PROMPT-HISTORY.md, and `.env.example` if needed.
6. Ensure `.gitignore` excludes secrets and generated artifacts.

Constraints: no database, auth, Gmail, or AI implementation; fictional data only; no unnecessary dependencies; never read or commit credentials; no commit, push, or deploy. Verify with lint and a production build.

### Initial findings

The repository root was correct (`week-8-build-catering-concierge`). It contained only `.git`, on branch `main` with no commits and no files. There were no conflicts.

### Outcome

- Scaffolded with `create-next-app@latest`: Next.js 16.4.5, React 19.3, TypeScript, Tailwind CSS v4, ESLint, App Router, `src/` directory. No dependencies were added beyond the scaffold.
- Built the app shell: a sticky forest-green desktop sidebar, a mobile top bar with a native `<dialog>` drawer, a skip link, and active-route highlighting.
- Every nav item routes to a real page. Unbuilt modules carry a "Planned" badge and show a "Not yet built" page listing intended capabilities, with no action buttons.
- Dashboard: four summary cards whose counts are derived from the sample dataset, a five-stage read-only pipeline preview, an inquiry-sources panel (all "Not connected" / "Not built"), and a module list.
- A demonstration-mode banner appears on every page, plus a "Demo mode" pill in the navigation.
- Fictional data is isolated in `src/lib/demo-data.ts`: "Example" surnames and no pricing or revenue.
- Removed the scaffold's boilerplate SVGs and favicon and added an SVG monogram icon.
- Hardened `.gitignore` (env files, OAuth/credential JSON, keys, local Claude settings). `.env.example` stays trackable.
- `.env.example` was not created because no environment variables are used yet.
- Wrote README.md, AGENTS.md (keeping the Next.js-managed block), CLAUDE.md (imports AGENTS.md), and this file.

### Verification

- `npm run lint`: passed, no warnings.
- `npx tsc --noEmit`: passed.
- `npm run build`: succeeded. All 7 routes plus `/_not-found` and `/icon.svg` are prerendered as static.
- `next start` smoke test: all 7 routes returned 200, an unknown route returned 404, and the compiled CSS contains the theme tokens.

### Open issues

- No visual or browser-based verification was performed; there was no browser tool in this session.
- `npm audit` reports 8 moderate advisories in the ESLint/TypeScript-ESLint dev toolchain, from the scaffold's versions. These were left unchanged.
- No automated tests yet.

---

## 002: Foundation cleanup after self-review

**Date:** 2026-11-06
**Agent:** Claude Code (Claude Opus 5.5)

### Context

This was the third AI prompt overall. The second was a read-only review of entry 001, done by the same agent (Claude Code) that implemented it. That review made no changes and has no entry of its own. **It was a self-review, not an independent one; no independent review has happened yet.** Nothing has been committed, pushed, or deployed.

### Request

Fix only five low-severity items from the self-review:

1. Pipeline count accessibility (`src/app/page.tsx`)
2. Focus-style cascade layering (`src/app/globals.css`)
3. Review instructions (`AGENTS.md`)
4. Mobile drawer comment (`src/components/mobile-nav.tsx`)
5. Shadow tokens (`globals.css`, `ui.tsx`, `page.tsx`)

The scope excluded new features, dependency or audit changes, database, auth, Gmail, OpenAI, or deployment work, navigation or sidebar redesign, and the inquiry-type refactor.

### Changes

1. **Pipeline count** (`src/app/page.tsx`): removed `aria-label` from the plain `<span>`. The visible number is now `aria-hidden`, and screen-reader-only text announces it once with context, for example "2 sample inquiries in New" or "1 sample inquiry in Quoting". The layout is unchanged.
2. **Focus cascade** (`src/app/globals.css`, plus one attribute each in `src/components/app-shell.tsx` and `src/components/mobile-nav.tsx`):
   - Moved the default `:focus-visible` ring into `@layer base`, so utilities override it as intended.
   - The ring color is a CSS variable. It's brass-600 on light surfaces (about 4.1–4.6:1). Inside `data-surface="dark"` containers (the desktop sidebar and the mobile header and drawer) it's brass-400, about 5.8:1 on forest-900 and 4.7:1 on forest-800, up from about 3.2:1 and 2.6:1.
   - These ratios are calculated, not checked in a browser.
   - Side effect: the existing `outline-none` on `<main>`, the skip-link target, now takes effect. Focus moves there without a ring, while the skip link itself keeps its ring.
3. **Review instructions** (`AGENTS.md`):
   - Read-only review rules now apply to any agent assigned a review, whatever the model.
   - Reviewing is now separate from implementing approved fixes.
   - Lint and build are required for implementation and optional for reviews, and reviewers must report what they actually ran.
   - Reviewers must not edit source or documentation, but generated build output is fine.
   - Reviewers are told not to run `next dev`, because it rewrites AGENTS.md.
   - The secret-handling and external-side-effect rules are kept, and the Next.js-managed block is unchanged.
   - The conventions line now lists the new shadow tokens.
4. **Drawer comment** (`src/components/mobile-nav.tsx`): now describes a left-pinned drawer that opens instantly with no animation. No behavior changed.
5. **Shadow tokens**:
   - Added `--shadow-card` (rgba 24,44,36 at 0.04) and `--shadow-card-raised` (at 0.05) to `@theme`.
   - `Card` (`src/components/ui.tsx`) now uses `shadow-card`, and the inquiry card (`src/app/page.tsx`) uses `shadow-card-raised`.
   - The standard `shadow-sm`, `shadow-md`, and `shadow-lg` utilities are untouched.

### Verification

- `npm run lint`: passed (exit 0, no output).
- `npm run build`: succeeded. All 7 routes plus `/_not-found` and `/icon.svg` are static.
- **Route checks** (`next start`): all 7 routes returned 200 and `/nope` returned 404.
- **Served HTML checks**:
  - All five stage counts have the expected singular or plural screen-reader text, and no `aria-label` remains on them.
  - `data-surface="dark"` is on the sidebar `<aside>` and the mobile `<header>`.
  - The demo labels are still present: the "Demonstration mode." banner, "(fictional)", "Sample data", "Planned", and "Not yet built".
- **Compiled CSS checks**:
  - The focus rule and the `--focus-ring-color` definitions are inside `@layer base`, which comes before `@layer utilities`.
  - `shadow-card` and `shadow-card-raised` compile to the same offsets and alphas as before (hex alpha `0a` and `0d`).
  - No arbitrary `shadow-[...]` classes remain.
- **Not verified:** no browser was available, so there was no visual inspection, keyboard walkthrough, or screen-reader test. The focus-ring contrast figures are calculated only.

### Open issues

- Still needed from the user: an independent review (for example Codex, following the updated AGENTS.md), a visual and keyboard check in a browser, and approval of the first commit.
- The other unlayered rules in `globals.css` (`:root`, `body`, the `html:has(dialog)` scroll lock, and reduced motion) were left as they are. They don't conflict with any utilities in use.
- Still outstanding from the self-review for later stages:
  - Wrap `NavLinks` in `<Suspense>` before adding dynamic routes.
  - Separate the inquiry definitions from the demo data.
  - Make the demo banner reflect real connection state.
  - Pin a Node version for Railway.
  - The 8 moderate dev-only audit advisories are unchanged.

---

## 003: Mobile header polish

**Date:** 2026-11-06
**Agent:** Claude Code (Claude Opus 5.5)

### Request

Move the mobile menu button to the left of the brand in `src/components/mobile-nav.tsx`, grouped with appropriate spacing. Keep the drawer opening from the left, and keep accessible labels, visible and dark-surface focus, Escape-to-close, and focus return. The header must fit at about 360px with no clipping or overflow. Desktop layout and drawer contents stay unchanged.

### Changes

- `src/components/mobile-nav.tsx` (header only):
  - The button now comes before `<Brand />`, so tab order matches the visual order.
  - The header uses `gap-2` instead of `justify-between`.
  - The button gets `-ml-2` (to align the icon glyph with the 16px gutter) and `shrink-0`.
- Nothing changed in the dialog, the drawer contents, the labels, the `data-surface="dark"` focus styling, or the desktop sidebar.

### Verification

- `npm run lint`: passed (exit 0).
- `npm run build`: succeeded (exit 0). All routes are static.
- **Route checks** (`next start`): all 7 routes returned 200 and `/nope` returned 404.
- **Served HTML:** the header renders the "Open navigation" button before the brand link, with the new classes.
- **Not verified:** no browser was available, so the 360px fit, focus-ring visibility, Escape-to-close, and focus return were not checked visually or by keyboard. The fit is estimated at about 30px of spare space at 360px, from approximate font metrics. At narrower widths the brand text can wrap instead of overflowing.

### Open issues

- Visual and keyboard checks of the mobile header and drawer are still outstanding. Everything from entry 002 is unchanged.

---

## 004: Database foundation (Prisma 7 + Neon, prepared, not connected)

**Date:** 2026-11-06
**Agent:** Claude Code (Claude Opus 5.5)
**Branch:** `codex/database-foundation`, from commit `b3c67a3`. Nothing staged or committed by the agent.

### Request

Prepare the Prisma configuration, a server-only database client, and `Restaurant`/`Inquiry` models for Neon PostgreSQL:

- Use a stable Prisma major with matching `prisma`, `@prisma/client`, and Neon adapter versions.
- Use `DATABASE_URL` (pooled) for the app and `DIRECT_URL` (direct) for the CLI, with consistent env loading between Next.js and Prisma.
- Provide a placeholder-only `.env.example`.
- Prepare an initial migration offline. Don't connect, apply, push, seed, or introspect.
- Don't connect the UI. Don't add auth, CRUD, Gmail, AI, or deployment work.
- Document that ownership isn't authorization.

### Research

- **Bundled Next.js docs:** the environment-variables guide recommends `@next/env`'s `loadEnvConfig` for ORM config files and gives the load order. The server-and-client-components guide covers `server-only`.
- **npm registry:**
  - The `prisma` package's `latest` tag is **8.0.0-rc.30**, a release candidate. Stable is **7.10.1** (released 2026-10-15), which is `latest` for `@prisma/client` and `@prisma/adapter-neon`.
  - 7.10.1 requires Node `^20.19 || ^22.12 || >=24` and TypeScript >=5.4. The local setup is Node 24.18.0 and TypeScript 5.9.3.
- **Official Prisma 7 docs and Neon's Prisma 7 guide,** read through a web-fetch subagent:
  - The `prisma-client` generator requires `output`, and the client is imported from `<output>/client`.
  - Connection URLs live in the config file, not the schema, and v7 config has no `directUrl`.
  - Prisma 7 doesn't load `.env` files itself.
  - `env()` from `prisma/config` throws when a variable is unset.
  - Offline diffs use `migrate diff --from-empty --to-schema --script`.
  - `@db.Date` and `onDelete: Restrict` are supported on PostgreSQL.
  - Some prisma.io pages (Neon, Next.js guide) served v6 or contract-first content and were not used.
- **Installed 7.10.1 source,** used to settle what the docs didn't:
  - The CLI looks for `prisma7.config.ts` first and treats `prisma.config.ts` as a legacy fallback.
  - The `migration_lock.toml` template.
  - `datasource.url` is optional in the config type.
  - The `PrismaNeon` factory creates its pool only on `connect()`, so construction opens no connection.
  - The `@neondatabase/serverless` README says `ws` is needed only on Node 21 and earlier.

### Changes

- **Dependencies:**
  - Runtime: `@prisma/client@^7.10.1`, `@prisma/adapter-neon@^7.10.1` (brings `@neondatabase/serverless@1.2.0`), and `server-only@0.0.1`.
  - Dev: `prisma@^7.10.1` and `@next/env@16.4.5` (exact, matching `next`).
  - The lockfile shows no version changes or removals for existing packages. Only 15 existing packages had their dev-only flag cleared because new runtime packages also depend on them.
- **`package.json`:**
  - `build` is now `prisma generate && next build`, and `postinstall` runs `prisma generate`.
  - `engines.node` is `^22.12 || >=24`, which satisfies Next.js, Prisma 7, and Neon's native-WebSocket requirement.
- **`prisma/schema.prisma`:** the `prisma-client` generator outputs to `src/generated/prisma`.
  - Enums `InquirySource` (`MANUAL`, `EMAIL`, `WEB_FORM`) and `InquiryStage` (`NEW`, `NEEDS_DETAILS`, `QUOTING`, `AWAITING_CLIENT`, `CONFIRMED`).
  - `Restaurant`: UUIDv7 `id`, `name`, and `timestamptz` timestamps.
  - `Inquiry`: a required `restaurantId` with `onDelete: Restrict`, a required `source`, and `stage` defaulting to `NEW`. The details (`eventName`, `contactName`, `contactEmail`, `eventDate` as `@db.Date`, `guestCount`, `notes`) are nullable, and it has timestamps.
  - Three restaurant-scoped indexes.
- **`prisma7.config.ts`:**
  - Loads `.env*` with `@next/env` (`loadEnvConfig`).
  - Sets the schema and migrations paths.
  - Sets `datasource.url` from `process.env.DIRECT_URL`, without `env()`, so offline commands and builds work without credentials.
- **`prisma/migrations/20261106081912_init/migration.sql`:** generated by `prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script -o ...` with no database connection.
- **`prisma/migrations/migration_lock.toml`:** written by hand from the CLI's own template (`provider = "postgresql"`).
- **No migration history exists:** no `_prisma_migrations` table, nothing marked applied, and no database touched.
- **`src/lib/db.ts`:**
  - Imports `server-only`.
  - `getPrisma()` creates the client lazily on first call and reuses it through `globalThis`.
  - It uses `PrismaNeon` with `DATABASE_URL`.
  - Missing or non-`postgresql://` values throw errors that name the variable only.
  - It isn't imported anywhere.
- **`.env.example`:** placeholder-only `DATABASE_URL` (pooled) and `DIRECT_URL` (direct).
- **Ignore rules:** `.gitignore` now ignores `/src/generated/`, and `eslint.config.mjs` ignores `src/generated/**`.
- **README.md:**
  - Status, the what-exists table, and the stack.
  - The Node requirement is now 22.12+ or 24+.
  - Environment variables and the PowerShell database setup steps, none of them run.
  - The data model, an ownership-vs-authorization warning, the project structure, limitations, and a Prisma 8 RC warning.
- **AGENTS.md:** the current stage and stack, plus a new "Database rules" section. The Next.js-managed block is unchanged.

### Verification

No `.env*` files other than `.env.example` existed, checked by name only, so every command ran without credentials.

- `npx prisma validate`: the schema is valid (exit 0).
- `npx prisma generate`: generated Prisma Client 7.10.1 into `src/generated/prisma` (exit 0).
- `npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script -o …`: succeeded offline (exit 0). A second run produced identical SQL.
- `npm run lint`: passed (exit 0).
- `npx tsc --noEmit`: passed. This covers `src/lib/db.ts`, `prisma7.config.ts`, and the generated client.
- `npm run build` (`prisma generate && next build`): succeeded (exit 0) with no credentials. All 7 routes plus `/_not-found` and `/icon.svg` are still static.
- Nothing in `src` imports `src/lib/db.ts` or the generated client, and no Prisma or Neon code appears in `.next/` output.
- **Not tested:**
  - Live connectivity to Neon.
  - `prisma migrate status` and `prisma migrate deploy`.
  - Whether `migrate deploy` accepts the offline-generated migration.
  - Runtime execution of `getPrisma()`, including its error paths. Its behavior was checked by reading the code and the adapter source only.
  - Any query or persistence.

### Open issues

- **User setup is still to do:**
  - Create the Neon project.
  - Fill in `.env.local`.
  - Run `npx prisma migrate status`, then `npx prisma migrate deploy`.
  - The README has the PowerShell commands.
- **Install scripts:** npm 11 held back the `prisma` preinstall and `@prisma/engines` postinstall scripts, which need approval through `npm approve-scripts`.
  - Locally on Windows, the CLI works because the schema-engine binary ships in the package.
  - Whether a Linux or Railway build needs those scripts hasn't been checked.
- **Prisma upgrade banner:** the CLI suggests upgrading to 8.0.0-rc.30. Don't follow it. Upgrade all three Prisma packages together, deliberately.
- **Before any database-backed feature:**
  - Authentication, authenticated restaurant selection, and restaurant-scoped data access are required. Tenant isolation isn't implemented.
  - With `cacheComponents`, database reads need `<Suspense>` boundaries or `"use cache"`.
- **Still outstanding from earlier entries:**
  - Wrap `NavLinks` in `<Suspense>` before adding dynamic routes.
  - Separate the inquiry definitions from `demo-data.ts`. The Prisma enums now duplicate its stage list.
  - Make the demo banner reflect real connection state.
  - Visual and keyboard checks.
  - The 8 moderate dev-only audit advisories are unchanged; no audit fixes were applied.

### User verification note (added 2026-11-06, after the implementation above)

> **Attribution:** the project owner performed and reported these steps manually. Claude Code did not run, observe, or independently verify any of them. It didn't read `.env.local` and didn't connect to the database. The implementation results above are unchanged and describe the state when entry 004 was completed.

The project owner reported completing these steps against the **Neon development branch**:

1. Added `DATABASE_URL` and `DIRECT_URL` privately to the git-ignored `.env.local`.
2. Ran `npx prisma migrate status` successfully.
3. Ran `npx prisma migrate deploy`. Migration `20261106081912_init` applied successfully.
4. Ran `npx prisma migrate status` again. It reported "Database schema is up to date!".

**What this establishes:**
- The offline-generated initial migration is accepted by `prisma migrate deploy`.
- The schema now exists on the Neon development branch.
- The Prisma CLI's direct connection (`DIRECT_URL` through `prisma7.config.ts` and `@next/env` loading of `.env.local`) works.

**Still untested or unimplemented:**
- The app's pooled connection (`DATABASE_URL`) and `getPrisma()`. No code path has run against the database.
- No application page, route, or action reads or writes database records. The dashboard still shows fictional demonstration data.
- Authentication, authenticated restaurant selection, and restaurant-scoped authorization. Tenant isolation isn't implemented.
- Any environment other than Neon development, such as production or Railway.

A documentation-only follow-up (2026-11-06) updated the current-state sections of `README.md` and `AGENTS.md` to match. Lint and build were not rerun for that change.

---

## 005: Read-only database verification (`npm run db:check`)

**Date:** 2026-11-06
**Agent:** Claude Code (Claude Opus 5.5)
**Branch:** `codex/database-verification`, from commit `d413478`. Nothing staged or committed by the agent.

### Request and authorization

Add a manually invoked, read-only command that exercises the existing `getPrisma()` with the pooled `DATABASE_URL` and counts `Restaurant` and `Inquiry` rows:

- Print a concise success message, or exit nonzero with a sanitized message.
- Close the connection when finished.
- Keep the command out of install, lint, and build.
- Keep `server-only` real by running under the `react-server` condition.
- Bound the timeouts.

**Authorization (from the user):** connect to the existing Neon **development** database through `DATABASE_URL` and run read-only queries. This excluded writing data, changing the schema, and accessing other environments. Runtime loading of `.env.local` was allowed, but its contents could not be opened, inspected, or printed.

### Research

- **Bundled Next.js docs:** the environment-variables guide, which recommends `@next/env` `loadEnvConfig` outside the Next.js runtime.
- **Installed `@neondatabase/serverless` 1.2.0** (types and implementation):
  - `connectionTimeoutMillis` and `query_timeout` are client-side, pg-compatible Pool options that the driver honours.
  - `statement_timeout` is sent as a startup parameter, so I avoided it because Neon's pooler may reject it.
- **Installed `@prisma/adapter-neon` 7.10.1:** `PrismaNeon` takes a `neon.PoolConfig`.
- **Installed Prisma runtime:** `$disconnect()` stops the engine. Driver failures are wrapped with a `P####` code and `meta.driverAdapterError.cause.kind`, but their message text can include server details.
- **`server-only` package:** exports `react-server` → `empty.js`, and the default export throws.
- **`@next/env`:** `loadEnvConfig` returns file contents, so the script never prints its return value.

### Changes

- **`scripts/db-check.ts`** (new):
  - Loads env with `@next/env` using a silent logger, and prints only the basenames of loaded files.
  - Fails if `DATABASE_URL`'s host isn't a Neon `-pooler` endpoint. It prints only yes/no, never the host.
  - Calls `getPrisma()`, then runs `prisma.restaurant.count()` and `prisma.inquiry.count()`.
  - Prints `OK`/`PASS` with the counts.
  - Calls `$disconnect()` in `finally`.
  - A 45s watchdog acts as a backstop.
  - On failure it prints only whitelisted fields: error type or constructor name, `P####`/SQLSTATE/errno codes, and the driver error kind, plus a fixed hint. Messages are pattern-matched but never printed.
- **`src/lib/db.ts`:** the `PrismaNeon` config now sets `connectionTimeoutMillis: 10_000` and `query_timeout: 15_000`. The `server-only` import and the lazy, env-checked creation are unchanged.
- **`package.json`:**
  - New script `"db:check": "node --conditions=react-server --import tsx scripts/db-check.ts"`. Install, lint, and build don't reference it.
  - New dev dependency `tsx@^4.23.15` (installed 4.23.15, with esbuild 0.28.2).
  - Why tsx: Node 24's built-in type stripping can't load this code. The generated Prisma client uses extensionless ESM imports (`./enums`), and `db.ts` uses the `@/` tsconfig alias. tsx handles both.
  - I added no testing framework. The lockfile shows no version changes or removals for existing packages.
- **README.md:**
  - Status, the what-exists table, and the scripts list.
  - A new "Verify the database connection (read-only)" section with the exact command, what it does and doesn't do, its timeouts, and its exit codes.
  - The Neon status note, project structure, limitations, and the install-scripts note, which now includes esbuild.
- **AGENTS.md:** the current-stage database state, and a `db:check` rule in "Database rules". The Next.js-managed block is unchanged.

### Verification (actual results)

- **Pre-checks before connecting:** `npx tsc --noEmit` passed and `npm run lint` passed.
- **Condition check** (temporary file in the repo root, then deleted):
  - With `--conditions=react-server`, `server-only` resolved to its empty module.
  - Without the condition, it threw "This module cannot be imported from a Client Component module".
- **Sanitized failure paths** (non-secret placeholder `DATABASE_URL` values, using the reserved `.invalid` TLD; `process.env` overrides `.env.local`):
  - A non-pooler host printed `FAIL DATABASE_URL is not a Neon pooled endpoint …` and exited 1.
  - An unresolvable pooler-shaped host printed `FAIL while counting Restaurant rows: type ErrorEvent. Likely cause: the WebSocket connection to the database failed (network, DNS, or TLS).` and exited 1.
  - Neither printed a URL or hostname.
  - A temporary diagnostic script (deleted afterwards) showed that the driver surfaces connection failures as a WebSocket `ErrorEvent`, not an `Error`. The sanitizer was adjusted for that.
- **Real run against Neon development:** `npm run db:check` printed:
  ```
  Catering Concierge database check (read-only, pooled DATABASE_URL)
  Environment files loaded: .env.local
  OK   pooled connection established (Neon pooler endpoint)
  OK   Restaurant count query succeeded (0 rows)
  OK   Inquiry count query succeeded (0 rows)
  PASS Pooled application connection and read-only queries on both tables work. No data was written.
  ```
  It exited 0 after about 2.7s wall time, so the process ended on its own after `$disconnect()`.
- `npm run lint`: passed (exit 0).
- `npm run build` (`prisma generate && next build`): succeeded (exit 0). All routes are unchanged and static, and no Prisma, Neon, or `db-check` code appears in `.next/` output.
- `npm audit`: still 8 moderate, all in dev tooling. `npm audit --omit=dev` reports 0.
- **Not done:** no migrations, seeding, inserts, updates, deletes, resets, introspection, or `DIRECT_URL` use. No environment other than Neon development was touched, and `.env.local` was never opened or printed.

### What is and isn't verified

- **Verified:** the app's pooled connection (`DATABASE_URL`) through `getPrisma()` reaches Neon development, and read-only `COUNT` queries on `Restaurant` and `Inquiry` succeed. Both tables had 0 rows.
- **Not verified:**
  - The timeout paths: the 10s connection timeout, 15s query timeout, and 45s watchdog were configured but not triggered.
  - Write persistence.
  - Behavior under load.
  - Any production or Railway environment.
- **Not implemented:**
  - Application pages still use fictional demonstration data.
  - Record creation and editing.
  - Authentication.
  - Tenant authorization or isolation.

### Open issues

- **Install scripts:** npm 11 holds back the install scripts for `esbuild` (via tsx), `prisma`, and `@prisma/engines`. Everything works locally on Windows without them. Linux and Railway are unchecked.
- **Still outstanding from earlier entries:**
  - Wrap `NavLinks` in `<Suspense>` before adding dynamic routes.
  - Separate the inquiry definitions from `demo-data.ts`, which the Prisma enums duplicate.
  - Make the demo banner reflect real connection state.
  - Visual and keyboard UI checks.
  - The dev-only audit advisories.

---

## 006: Google sign-in and sessions with Better Auth (implemented, unverified)

**Date:** 2026-11-06
**Agent:** Claude Code (Claude Opus 5.5)
**Branch:** `codex/google-authentication`, from commit `62d83c4`. Nothing staged or committed by the agent.

### Request

Add Google-only sign-in, persistent sessions, working sign-out, and server-side session verification. Use Better Auth with the existing Prisma 7 / Neon setup.

- **Scope exception (approved by the user):** auth endpoints and session reads may use the database before restaurant membership exists. `Restaurant` and `Inquiry` access stays prohibited.
- **Out of scope:** onboarding, memberships, inquiry CRUD, Gmail, email/password, invitations, and organization switching.
- **Agent restrictions:** no database connection, no migrations applied, no Google Cloud configuration, no reading of `.env.local`, and no commits.

### Research

- **Bundled Next.js docs:**
  - Authentication with Cache Components: session reads are request-time and belong behind `<Suspense>`.
  - `cookies`, `connection`, Route Handlers, `useRouter`/`refresh`, and the instant-navigation guide (validation warns in development only).
- **Official Better Auth docs** (fetched): Next.js integration, Prisma adapter, Google provider, database schema, sessions, options, security, cookies, and OAuth.
- **Installed `better-auth` 1.7.18 source**, used to confirm what the docs left unclear:
  - Core tables and their fields come from `getAuthTables`.
  - With `generateId: "uuid"` on PostgreSQL, Better Auth omits `id` on insert, so the database layer fills it. Deterministic single-use IDs are formatted as UUIDs.
  - Default Google scopes: `email`, `profile`, `openid`.
  - Without a secret, Better Auth falls back to a default secret outside production. This app refuses to start sign-in instead.
  - Telemetry is off by default.
  - Cookies are signature-checked before any database lookup.
  - The Prisma adapter's schema check compares the generated client's data model with the library's expectations, offline.
  - The `nextCookies()` plugin skips session refresh during Server Component renders.
  - Direct `auth.api` calls skip Better Auth's origin check. Next.js checks Server Action origins instead.

### Dependency

- **`better-auth` `~1.7.18`** (installed 1.7.18, the current stable release). It peers with Next 14–16 and Prisma 5–7, and bundles `@better-auth/prisma-adapter`.
  - The tilde keeps upgrades within 1.7.x patches, because minor releases can change the required schema.
  - It added 18 packages, all from Better Auth's own tree (`@better-auth/*`, `better-call`, `jose`, `kysely`, `nanostores`, `@noble/*`, and others).
  - No existing package changed version or was removed.
  - `npm audit --omit=dev` reports 0 vulnerabilities. The full audit still shows the same 8 moderate dev-only advisories.
- **No test framework:** tests use Node's built-in `node:test` with the existing `tsx`.

### Changes

- **`prisma/schema.prisma`:** added the `User`, `Session`, `Account`, and `Verification` models.
  - Field names and nullability match Better Auth's core schema.
  - IDs are `@db.Uuid @default(uuid(7))`, and timestamps are `Timestamptz(3)`, matching the existing models.
  - Indexes: unique `User.email` and `Session.token`, plus indexes on `Session.userId`, `Account.userId`, and `Verification.identifier`.
  - Cascade deletes go from `User` to `Session` and `Account`. No relation to `Restaurant` or `Inquiry`.
  - `Restaurant`, `Inquiry`, and the enums are unchanged. `prisma format` had realigned some `Inquiry` whitespace, and I reverted it so existing lines show zero diff.
- **`prisma/migrations/20261106140237_add_better_auth/migration.sql`:** generated offline with `prisma migrate diff --from-schema <previous schema from git HEAD> --to-schema prisma/schema.prisma --script`.
  - No database or shadow database was used.
  - The initial migration is untouched.
- **`src/lib/auth-config.ts`** (server-only): checks the five required variables.
  - Rejects anything missing, any value containing `REPLACE_`, a secret under 32 characters, and a `BETTER_AUTH_URL` that isn't a bare http(s) origin.
  - Reports problems by variable name only.
- **`src/lib/auth.ts`** (server-only):
  - `createAuth(config, prisma)` sets up Better Auth with these options:
    - Base URL is `BETTER_AUTH_URL`, which is also the only trusted origin.
    - The Prisma adapter uses `getPrisma()`, with `generateId: "uuid"`.
    - Email/password is off, and Google uses its default scopes with `prompt: "select_account"`.
    - `encryptOAuthTokens: true` and `telemetry: { enabled: false }`.
    - The `nextCookies()` plugin is last.
  - `getAuth()` creates the instance lazily and reuses it through `globalThis`.
  - `getSessionUserFromHeaders()` calls `getSession` with `disableRefresh: true` and returns only `{ id, name, email }`.
  - `handleAuthRequest()` answers 503 while sign-in isn't configured.
- **`src/app/api/auth/[...all]/route.ts`:** `toNextJsHandler(handleAuthRequest)`, exporting GET and POST.
- **`src/lib/session.ts`** (server-only): `getSessionUser()` and `requireSessionUser()`.
  - They take no identity arguments and cache nothing.
  - They return null when sign-in isn't configured.
- **`src/lib/account-state.ts`** (server-only): a per-request `cache()` of the account state, shared by the shell and the sign-in page.
  - Calls `connection()` first, so nothing is decided at build time.
  - Fails closed to "unavailable" and logs only the error name and code.
- **`src/lib/auth-actions.ts`:** the `signOutAction` Server Action.
  - Calls `auth.api.signOut` with the request headers, then redirects to `/sign-in?signed_out=1`.
  - I first wrote sign-out on the client, but the lint rule against `window.location.assign` flagged it. The Server Action approach also re-renders the layout's account panel.
- **`src/lib/auth-client.ts`:** `createAuthClient()` from `better-auth/react`, with no options. Used only to start Google sign-in.
- **`src/components/auth/`:**
  - `google-sign-in-button.tsx` (client): pending state, an error shown with `role="alert"`, a reset when the page is restored from the back/forward cache, and a server-decided `disabled` state with `aria-describedby`.
  - `sign-out-button.tsx` (client): a `useActionState` form with pending and error states.
  - `account-panel.tsx` (server): shows one of four states (setup required, unavailable, signed out with a **Sign in** link, or signed in with name, email, decorative initials, a "real account, data still fictional" note, and sign-out), inside its own `<Suspense>`.
- **`src/app/sign-in/page.tsx`:**
  - A static header and a "What signing in does today" list.
  - A Suspense panel that shows the setup-required notice (variable names, disabled button), the signed-in view, or the sign-in button with fixed-text messages.
  - Messages cover `?error=` and `?signed_out=1`. The raw error value is never shown.
- **Shell:**
  - `app-shell.tsx`: the account panel sits above the demo pill in the sidebar, which now scrolls and uses `gap-8`.
  - `mobile-nav.tsx`: takes an `account` slot. Activating a link in the drawer's account area closes the drawer, and the drawer now scrolls.
  - `demo-mode.tsx`: banner copy now says sign-in uses a real account and stores only sign-in records, with no restaurant data, email inbox, or AI.
- **`.env.example`:** `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, all with placeholders except `BETTER_AUTH_URL="http://localhost:3000"`.
- **`package.json`:** the `better-auth` dependency, and a `test` script: `node --conditions=react-server --import tsx --test "tests/**/*.test.ts"`.
- **`tests/auth.test.ts`:** 15 offline tests.
  - Configuration checks, including the `.env.example` placeholders and values never appearing in messages.
  - The 503 response and `getAuth` refusal when unconfigured.
  - The Prisma schema matching Better Auth, plus a negative control.
  - The session helper returning null for no cookie, client identity headers, a bearer token, unsigned or wrongly signed cookies, and a forged `__Secure-` cookie, all without touching the database.
  - A control showing that a correctly signed cookie does reach the database guard.
- **Docs:**
  - README: status, table, stack, environment variables, a new "Authentication setup" section (the exact callback URI and private steps), the migration note, the data model, project structure, and limitations.
  - AGENTS.md: current stage, stack, the database-rules exception, a new "Authentication rules" section, client components, and `npm test` for auth changes. The Next.js-managed block is unchanged (checked by script).

### Verification (actual results)

- `npx prisma validate`: valid. `npx prisma generate`: Prisma Client 7.10.1 generated with all six models.
- **Previous schema check:** `migrate diff --from-empty --to-schema <HEAD schema>` reproduces `20261106081912_init/migration.sql` byte for byte (ignoring CRLF), so the comparison baseline is exactly what Neon development has.
- **New migration contents:** 4 `CREATE TABLE`, 2 `CREATE UNIQUE INDEX`, 3 `CREATE INDEX`, 2 `ADD FOREIGN KEY ... ON DELETE CASCADE`. No `DROP`, `ALTER` of existing tables, or reference to `Restaurant`, `Inquiry`, or the enums.
- `npm test`: 15 passed, 0 failed. The control test logs an expected Better Auth `INTERNAL_SERVER_ERROR` when the guard refuses database access.
- `npm run lint`: passed, exit 0, no warnings (after the sign-out change).
- `npm run build`: succeeded, exit 0.
  - Every page is `◐` Partial Prerender (static shell, with the account panel streamed at request time), `/api/auth/[...all]` is `ƒ` Dynamic, and `/icon.svg` is static.
  - A second build with all auth and database variables set to empty strings in the process environment also succeeded. `@next/env` doesn't override variables that already exist, so `.env.local` values were masked without opening the file.
- **`next start` with credentials blanked** (scripted checks against port 3123, 27 of 27 passed):
  - All 8 pages returned 200, and an unknown path returned 404.
  - The shell showed "Sign-in not set up" on every module page.
  - `/sign-in` showed "Setup required", listed the five variable names, and rendered the button with `disabled` and `aria-describedby="sign-in-setup"`.
  - `?error=access_denied` showed the fixed cancel text. `?error=<script>…` showed generic text and wasn't reflected. `?signed_out=1` showed the signed-out status.
  - GET `/api/auth/get-session`, POST `/api/auth/sign-in/social`, POST `/api/auth/sign-out`, and GET `/api/auth/callback/google` all returned 503 with `Cache-Control: no-store`, even with an invented session cookie.
  - The server log contained no errors, connection strings, or variable assignments.
- **Client bundle scan (`.next/static`):** no `GOOGLE_CLIENT_SECRET`, `GOOGLE_CLIENT_ID`, `DATABASE_URL`, Prisma, or Neon adapter code. One chunk contains the *name* `BETTER_AUTH_SECRET` inside Better Auth's own environment-variable helper, which carries no value in the browser.
- **Not done:** no database connection, no migration applied, no Google Cloud configuration, `.env.local` never opened, and no real secret generated or displayed (tests use a random per-run value that's never printed).

### What is and isn't verified

- **Verified offline:**
  - Configuration checks and the missing-configuration behavior: UI, endpoints, and build.
  - The schema matches Better Auth's expectations.
  - The migration is additive.
  - The session helper rejects invented identities and forged cookies before any database access.
  - No secrets in the client bundle.
- **Not verified (needs the user's private setup):**
  - Google sign-in end to end, including the consent screen, callback, state and PKCE, and user, account, and session creation.
  - Session persistence across reloads and browser restarts.
  - Sign-out, including the Server Action redirect and the account panel update.
  - The cancel and error redirects from Google.
  - Token encryption at rest.
  - The applied migration.
  - Real-browser behavior: keyboard, focus, screen reader, 360px layout, and the drawer closing on account links.
  - Any production or HTTPS deployment.

### Open issues

- **Sessions don't roll:** they last 7 days from sign-in, because server reads use `disableRefresh` and nothing else calls the session endpoint. Add a client-side refresh later if rolling sessions are wanted.
- **Non-UUID IDs:** `@db.Uuid` IDs make Prisma reject a non-UUID ID string with an error instead of "not found". Current auth flows look up sessions by token and accounts by provider ID, so no client-supplied ID reaches an ID lookup today. Keep this in mind when adding endpoints that take IDs.
- **Account linking:** `Account (providerId, accountId)` has no unique constraint, because Better Auth's core schema doesn't define one. Revisit if more providers are added.
- **Upgrades:** when upgrading `better-auth`, rerun `npm test`. The schema test catches new required columns.
- **Still outstanding from earlier entries:**
  - `NavLinks` `<Suspense>`.
  - Duplicated stage definitions.
  - The demo banner is still static copy, though it's now accurate for sign-in.
  - Visual and keyboard checks.
  - The dev-only audit advisories.
  - npm 11 still holds back install scripts for `esbuild`, `prisma`, and `@prisma/engines`.

### Cleanup after independent Codex review (2026-11-06)

An independent Codex review of this entry's implementation found three issues. This cleanup fixes only those three. The implementation results above are preserved as originally recorded, and the corrections below supersede them where they conflict.

**Findings (from the Codex review) and fixes:**

1. **Browser access to provider tokens.** Three Better Auth endpoints were enabled for anyone with a session cookie:
   - `/get-access-token` returns the decrypted access token and the ID token.
   - `/refresh-token` refreshes with Google and returns the tokens.
   - `/account-info` reads the stored tokens, refreshing them with Google if expired, and returns the provider profile.

   The app uses none of them. **Fix:** `disabledPaths: ["/get-access-token", "/refresh-token", "/account-info"]` in `src/lib/auth.ts`.
   - The library's router answers 404 for these in `onRequest`, before the schema check, rate limiting, session lookup, or any endpoint code.
   - It strips trailing slashes and query strings before comparing.
   - Other endpoints (`/list-accounts`, `/get-session`, sign-in, callback, and sign-out) never return token fields. `/list-accounts` strips them in `parseAccountOutput`.
   - OAuth, cookie, origin, and CSRF protections are unchanged.
2. **ID-token storage and the encryption claim.**
   - The installed library's `encryptOAuthTokens` encrypts only `accessToken` and `refreshToken` (`setTokenUtil` in `oauth2/link-account.mjs`). It stores `idToken` in plain text. The original entry and docs overstated the encryption.
   - **Fix:** `databaseHooks.account.create.before` always sets `idToken: null`. `update.before` does the same whenever an update includes `idToken`, such as the token refresh on each sign-in.
   - Better Auth merges hook data over the original, so the field has to be set to `null`; leaving it out would keep the original value. The nullable column remains, and the schema and migrations are unchanged.
   - **Correction to the original research:** in the authorization-code callback, Better Auth doesn't check the Google ID token's signature. Google's `getUserInfo` decodes it. It's trusted because it arrives directly from Google's token endpoint over TLS, in exchange for the code, client secret, and PKCE verifier, which OpenID Connect allows. Signature checks (`verifyProviderIdToken`) apply only to the separate ID-token sign-in path.
   - Identity is derived in `exchangeOAuthCallback` before `handleOAuthUserInfo` writes the account, so clearing the field afterwards doesn't affect identity or session creation. Google has no `createEndSessionURL`, so sign-out never reads the stored ID token.
3. **Mobile drawer stayed open after sign-out.**
   - The drawer is in the root layout and persists across navigation, and the Server Action's `redirect()` gave the client no success signal.
   - **Fix:** `signOutAction` now returns `{ ok: true }` or `{ ok: false, error }` instead of redirecting. Clearing the cookie in a Server Action still re-renders the current page in the same response, per the bundled `server-actions.md`.
   - On success only, `SignOutButton` closes the `<dialog>` that contains its own form (`closest("dialog")`, which is null on desktop and on the `/sign-in` page body) and calls `router.replace("/sign-in?signed_out=1")`.
   - Closing the modal dialog returns focus to the menu button. The App Router only scrolls on navigation and doesn't move focus.
   - On failure, the drawer stays open and the error stays visible under the button.
   - No other button or form closes the drawer, and there's no global event mechanism.

**Other changes:**
- `src/lib/auth.ts`: `createAuthOptions(config, database)` now builds the options, and `createAuth` passes the Prisma adapter to it. Tests run the identical options on Better Auth's bundled in-memory adapter.
- Corrected comments and docs on what's encrypted, omitted, and disabled: `src/lib/auth.ts`, the `Account` doc comment in `prisma/schema.prisma`, README, AGENTS.md "Authentication rules", and `.env.example`.
  - The schema change is to a `///` comment only. `prisma migrate diff` between the before and after schemas prints "This is an empty migration."
  - Migration files are unchanged.
- README's browser checklist gains a mobile-drawer sign-out check and an optional check that `/api/auth/get-access-token` answers 404.

**Tests added** (`tests/auth.test.ts`, 15 → 24). Network access is now refused by a fetch stub in every test.
- **Disabled endpoints (3 tests):** `POST /get-access-token`, `POST /refresh-token`, and `GET /account-info`, each also with a trailing slash and a query string. Every request carries a validly signed session cookie and a same-origin `Origin` header. Each answers 404, with no token fields in the body, no database access, and no provider requests.
- **Other spellings (1 test):** percent-encoded, upper-case, and doubled-slash spellings match no endpoint. This guards the router's exact matching, not `disabledPaths`.
- **Control (1 test):** the same cookie on the enabled `/list-accounts` does reach the database guard.
- **Google callback with this app's options (4 tests).** Google's token endpoint is emulated in-process with an RS256 test-key ID token, and the database is Better Auth's bundled in-memory adapter. The tests cover:
  - Scopes are only `openid email profile`, with no `access_type`, PKCE S256, and the code exchange sends `code_verifier`. Only the token endpoint is contacted.
  - First sign-in creates the user (name and email from the ID token), an account (`idToken` null; `providerId`, `accountId` = Google subject, `userId`, and `scope` intact; access and refresh tokens stored encrypted and decrypting correctly), and a session that `getSessionUserFromHeaders` resolves.
  - A second sign-in updates the same account (the access token decrypts to the new value) and `idToken` stays null.
  - Sign-out through the enabled endpoint deletes the session.
- **Mutation checks:** temporarily removing `disabledPaths` and both hooks made 5 of the new tests fail. Removing only the update hook made exactly the "later sign-in" test fail. `auth.ts` was restored from a backup and compared byte for byte.

**Verification (actual results):**
- `npm test`: 24 passed, 0 failed. Better Auth logs two expected errors from the database-guard control tests.
- `npm run lint`: passed, exit 0, no warnings.
- `npm run build`: the first attempt failed type-checking on a test-only typing (`decryptOAuthToken` expects `AuthContext`). I fixed it with a typed helper in the test. The rerun succeeded, exit 0, with the same routes as before.
- `npx prisma validate`: valid.
- `next start` with credentials blanked: the 27 scripted route checks from the original verification passed again.
- No browser was available in this session.

**Still unverified:**
- The real Google flow, because the offline tests emulate Google and prove nothing about the live service.
- Real sign-out and session persistence.
- That the drawer actually closes, focus actually returns to the menu button, and the "You've signed out." status is announced, in a real browser and with a screen reader.
- The disabled endpoints against a real signed-in session.
- That `idToken` is empty in Neon after a real sign-in.
- The auth migration is still not applied.

### User verification (reported by the project owner, 2026-11-06)

The project owner performed the live setup and browser checks below and reported the results. Claude didn't perform, observe, or independently confirm any of them, and connected to no service. The implementation and cleanup results above are unchanged.

**Reported by the project owner:**
- Applied migration `20261106140237_add_better_auth` to the Neon **development** branch. `npx prisma migrate status` then reported the schema up to date.
- Configured the Google OAuth client credentials and `BETTER_AUTH_SECRET` privately. No values were shared.
- Real Google sign-in works locally.
- All requested manual checks passed:
  - Session persistence after a reload.
  - Session persistence after a browser restart.
  - Sign-out on desktop.
  - Sign-out from the mobile drawer.
  - Sign-out from the drawer while already on `/sign-in`.
  - Cancelling at Google, navigating back, and retrying.

**Not reported, so still unverified live:**
- Stored-token contents in Neon (encrypted `accessToken`, empty `idToken`) and direct requests to the disabled token endpoints. Offline tests cover these (`npm test`), and the project owner didn't report inspecting them.
- Focus return to the menu button and screen-reader announcements, beyond the drawer sign-out passing.

**Limitations that remain:**
- Production and Railway authentication are untested.
- Restaurant membership and tenant authorization aren't implemented.
- No application page reads or writes `Restaurant` or `Inquiry` records.
- The dashboard still uses fictional demonstration data.
- Working authentication doesn't establish inquiry write persistence. Sign-in exercises only the auth tables.

**Documentation updated in this checkpoint:** the README (status, "What exists today" table, Neon status note, Database setup step 5, ownership note, an "Authentication setup" verification note, and limitations) and AGENTS.md (current stage and authentication state; the Next.js-managed block is unchanged).
- No code, dependency, schema, or migration changes.
- `npm run lint`, `npm run build`, and `npm test` weren't rerun for this documentation-only update.

---

## 007: Restaurant setup and ownership (implemented, unverified live)

**Date:** 2026-11-06
**Agent:** Claude Code (Claude Opus 5.5)
**Branch:** `codex/restaurant-setup`, from commit `8b31a47`. Nothing staged or committed by the agent.

### Request

Restaurant setup and authorization foundations, as the next prerequisite for delivering AI-processed inquiries (later, through Zapier) to the right restaurant:
- A minimal membership linking `User` and `Restaurant`, with one restaurant per user enforced by the database.
- A setup page where an authenticated user names their restaurant and becomes its owner, created atomically and safe against repeats and races.
- A server-only helper that resolves the session user's restaurant through membership, failing closed.
- Discoverable UI in the existing shell.
- An additive migration prepared offline, offline tests, and docs.

**Out of scope:** inquiry CRUD, AI, Zapier, Gmail, quotes, menus, deployment, invitations, staff roles, switching, billing, and new dependencies. The agent was not to connect to Neon, apply migrations, or touch `.env.local`.

### Research

Bundled Next.js docs:
- `02-guides/forms.md`: server-side validation, and `useActionState` with a `prevState` argument.
- `02-guides/server-actions.md`:
  - `refresh()` re-renders the current route in the action's response and still returns a value.
  - A `redirect()` throws.
  - Every action gets a framework Origin check.
- `03-api-reference/04-functions/redirect.md`.
- The authentication-with-Cache-Components guide (read in entry 006): request-time reads go behind `<Suspense>`, and nothing goes in `"use cache"`.

I validated by hand instead of using Zod, which is present only as a Better Auth dependency and wasn't added.

### Changes

- **`prisma/schema.prisma`:**
  - New `enum RestaurantRole { OWNER }`.
  - New `model RestaurantMembership`:
    - `id` UUIDv7, with `userId @unique @db.Uuid` (one restaurant per user, enforced by the database).
    - `restaurantId @db.Uuid` (indexed), and `role` defaulting to `OWNER`.
    - `createdAt`/`updatedAt` as `Timestamptz(3)`.
    - Both foreign keys use `onDelete: Restrict`, so a restaurant can't silently lose its owner and a restaurant with members can't be deleted.
  - Relation fields added: `Restaurant.memberships` and `User.membership`.
  - Existing columns are unchanged. The five `Restaurant` lines in the diff are whitespace realignment for the new relation field.
- **`prisma/migrations/20261106155051_add_restaurant_membership/migration.sql`:**
  - Generated offline with `prisma migrate diff --from-schema <HEAD schema from git> --to-schema prisma/schema.prisma --script`.
  - Contents: `CREATE TYPE`, `CREATE TABLE`, a unique index on `userId`, an index on `restaurantId`, and two `RESTRICT` foreign keys.
  - No `DROP` and no change to existing tables. Both earlier migrations are untouched.
- **`src/lib/restaurants.ts`** (server-only, no Next.js request APIs, so it's testable):
  - `validateRestaurantName`: NFC, trimmed, whitespace collapsed, 1–100 characters (code points), no control characters.
  - `findRestaurantForUser(db, userId)`: a membership lookup by `userId` only.
  - `resolveRestaurantAccess(getDb, user)`: `unauthenticated`, `needs-setup`, or `member`. There's no database call for signed-out visitors, and database errors propagate.
  - `createRestaurantForUser(db, user, rawName)`:
    - Validates, and returns an existing restaurant as `exists`.
    - Otherwise runs one interactive `$transaction` (`maxWait` 5s, `timeout` 10s) that creates the restaurant, then the `OWNER` membership.
    - On P2002 (unique violation) it re-reads and returns the winning restaurant as `exists`. Other errors propagate.
  - `submitRestaurantSetup({ getUser, getDb }, formData)`:
    - Reads only `name`.
    - Returns `unauthenticated`, `invalid`, `created`, `exists`, or a generic `error`.
    - Logs only the error name and code (`describeErrorSafely`).
- **`src/lib/restaurant-access.ts`** (server-only):
  - `getRestaurantAccess()`: React `cache()` per request, with the user from `getSessionUser()`.
  - `requireRestaurant()`: redirects to `/sign-in` or `/setup`, or returns `{ user, restaurant }` for later scoped queries.
- **`src/lib/restaurant-actions.ts`:** `createRestaurantAction(prevState, formData)` runs `submitRestaurantSetup` with the real session and Prisma. On `created` or `exists` it calls `refresh()`, so the page and the account panel re-render.
- **`src/lib/account-state.ts`:**
  - Signed-in state now carries `restaurant: member | needs-setup | unavailable`, resolved with the already-verified user.
  - A failed membership lookup becomes `unavailable` (fail closed).
  - Error logging uses `describeErrorSafely`, replacing its local copy.
- **`src/app/setup/page.tsx`:**
  - A static header and a "What setup does today" list.
  - A Suspense panel for each state: sign-in not set up, unavailable, signed out (link to sign in), restaurant status unavailable (no form), or the form or existing restaurant.
- **`src/components/restaurant/restaurant-setup-form.tsx`** (client):
  - A labelled controlled input (`maxLength`, `required`, `aria-describedby`, `aria-invalid`), errors in a `role="alert"` region, and a pending "Saving…" state with the button disabled.
  - When the server re-renders with a restaurant, the same component instance keeps its action state. It shows a `role="status"` success or "already has a restaurant" message, and moves focus to the "Your restaurant" heading.
  - It receives only the restaurant name, never the ID.
- **`src/components/auth/account-panel.tsx`:** in the signed-in state, a restaurant summary:
  - Members see the name.
  - Users without a restaurant see "No restaurant set up yet" and **Set up your restaurant**.
  - If the lookup failed, it says "unavailable".

  The note now reads "Your account and restaurant are real. The inquiries shown are fictional samples." Drawer links already close the drawer through the existing link delegation.
- **Wording:**
  - `demo-mode.tsx` banner: the sign-in and restaurant name are real records; no real inquiries are stored.
  - `sign-in/page.tsx`: the header, scope list, and signed-in text now say signing in lets you set up a restaurant and that inquiry data is fictional.
- **`tests/restaurants.test.ts`** (new, 20 tests, mocked database): see Verification.
- **Docs:**
  - README: status, table, Neon note, Database setup step 5, the data model, the ownership note, the auth "Grants" bullet, a new "Restaurant setup" section (behavior, authorization, and private verification steps), project structure, and limitations.
  - AGENTS.md: current stage, the new "Restaurant state", database rules (restaurant access only through membership, inquiry access still prohibited, no `"use cache"`), client components, and when to run `npm test`. The Next.js-managed block is unchanged, apart from git's line-ending normalization.
- **Unchanged:** dependencies, `src/lib/navigation.ts` (Settings and Inquiries stay "planned"), the dashboard, and the planned modules.

### Verification (actual results)

- **Prisma:** `npx prisma validate` reports the schema valid. `npx prisma generate` produced Prisma Client 7.10.1 with the `RestaurantMembership` model.
- **Migration contents:** reviewed. Only the additive statements listed above. No `DROP` and no `ALTER` of existing tables. `git status` shows both existing migrations unmodified.
- **`npm test`: 44 passed, 0 failed** (24 existing, 20 new). The two Better Auth error log lines come from the existing database-guard control tests.
  - New tests, with a **mocked** database:
    - **Name validation (4):** trimming, whitespace, NFC, the boundary at 100 characters (code points), and control characters.
    - **Access resolution (4):**
      - Signed out, without any database use.
      - No membership gives `needs-setup`.
      - A member resolves only by the session `userId`.
      - A database error throws (fail closed).
    - **Creation (6):**
      - The transaction creates the restaurant, then the `OWNER` membership with the session user, with bounded waits.
      - An invalid name means no database work.
      - An existing member gets `exists` with no transaction.
      - A P2002 race returns the winner, and nothing is committed (simulated rollback).
      - Other errors propagate with nothing committed.
      - A P2002 with no winner isn't hidden.
    - **Form submission (5):**
      - Signed out means no database use.
      - Spoofed `userId`, `ownerId`, `restaurantId`, `role`, and `user.id` fields are ignored: the membership uses the session user, and no spoofed value reaches any query.
      - `exists` and `invalid` states.
      - Database and session errors give a generic message, and logs contain only the type and code, never the raw message.
    - **No caching (1):** no source file uses `"use cache"`.
  - **Mutation checks:** making `resolveRestaurantAccess` call `getDb()` for signed-out visitors, and disabling the P2002 handling, each failed exactly the intended test. The file was restored from a backup and compared byte for byte.
- **`npm run lint`:** passed, exit 0, no warnings.
- **`npm run build` with every auth and database variable blanked:** succeeded, exit 0. `/setup` is `◐` Partial Prerender like the other pages, and `/api/auth/[...all]` is `ƒ`. No database connection or credential is needed.
- **`next start` with credentials blanked:** 32 of 32 scripted checks passed. That's the 27 earlier checks plus 5 for `/setup`:
  - `/setup` returns 200 and explains sign-in isn't set up.
  - It renders no form and no `name` input.
  - It shows no "Set up your restaurant" link.
  - It labels inquiry data as fictional.

  The server log had no errors or connection strings.
- **Client bundle scan (`.next/static`):** no `restaurantMembership`, `findUnique`, `submitRestaurantSetup`, `describeErrorSafely`, Prisma, `DATABASE_URL`, or Google secret.
- **Not done:** no database connection, no migration applied, no records written, and `.env.local` never opened.

### What is and isn't verified

- **Verified offline (mocked):**
  - Validation, identity and scope source, the query shapes, the result and error handling, and fail-closed behavior.
  - The rejection of client-supplied IDs.
  - That no caching directives are used.
  - That builds need no credentials, and the missing-configuration UI.
- **Not verified (needs the user's migration and browser test):**
  - Real setup writes.
  - PostgreSQL's transaction rollback.
  - The unique constraint under real concurrency.
  - Prisma's Neon adapter running the interactive transaction.
  - The `refresh()` re-render, the success message, and the focus move in a browser.
  - The restaurant display in the panel on desktop and mobile.
  - A second account's isolation from the first restaurant's name.
- **Not built:** inquiry operations, so no inquiry route has been tested for restaurant isolation. Also no invitations, staff roles, switching, renaming, or production or Railway testing.

### Open issues

- **Name length:** the restaurant name limit (100) is enforced in application code only. The existing `Restaurant.name` column stays `TEXT`, because changing it isn't additive.
- **Deletion:** users and restaurants with memberships can't be deleted (`RESTRICT`). There's no deletion feature yet; decide the policy when one is added.
- **First visit:** new users land on the dashboard after sign-in and find setup through the account panel. A first-sign-in redirect to `/setup` could come later.
- **Still outstanding from earlier entries:**
  - `NavLinks` `<Suspense>`.
  - Duplicated stage definitions.
  - The dev-only audit advisories.
  - npm 11's held-back install scripts.
  - Production and Railway authentication.

---

## 008: Zapier pilot import, inquiry review screen, and Railway preparation (implemented, unverified live)

**Date:** 2026-11-06
**Agent:** Claude Code (Claude Opus 5.5)
**Branch:** `codex/zapier-intake`, from commit `279d22a`. Nothing staged or committed by the agent.

### Request and reported state

The smallest secure connection from the existing Zap (Zapier Tables "New Record" → AI by Zapier → "Update Record", with fictional inquiries) to the app:
- Import storage on `Inquiry`, with a database uniqueness constraint.
- A bearer-token import endpoint with a fixed server-side restaurant and table.
- A restaurant-scoped, read-only `/inquiries` review screen.
- Railway readiness: Node 24, build and start, a pre-deploy migration, a health endpoint, and docs.

**State reported by the project owner before this task:**
- Google sign-in works locally.
- The membership migration is applied.
- A restaurant named "Catering Concierge Demo" was created and displayed.
- The Zap works on its own, and Zapier isn't connected to the app.
- Not every restaurant browser test was reported as passing.

**Out of scope:** new AI integrations, Gmail, menus, quotes, general CRUD, new dependencies, service connections, migrations, Railway or Zapier configuration, and commits.

### Research

- **Bundled Next.js docs:**
  - CLI: `next start` reads `PORT` (default 3000) and binds `0.0.0.0` by default.
  - Route Handlers under Cache Components: a `GET` handler is prerendered unless it uses request data or `connection()`.
  - `unstable_rethrow`, for letting `redirect()` pass through a try/catch.
  - The server-actions guide (read in entry 007).
- **Official Railway and Railpack docs** (fetched):
  - **Config-as-code is deprecated:** `railway.json` and `railway.toml` stop being read on 2026-12-01, and new services can't opt in. So no `railway.json` was added; settings are documented for the dashboard instead.
  - **Railpack** is the default builder. Its Node version priority is `RAILPACK_NODE_VERSION`, then `engines.node`, then `.nvmrc`. How it treats ranges isn't documented.
  - **Pre-deploy commands** run between build and deploy, in a separate container with the service's variables. A failure stops the deploy.
  - **`PORT`** is injected by Railway.
  - **Healthchecks** run only during deploys and accept any 2xx response.
  - **Railway's Next.js guide** suggests standalone output. I didn't use it: `next start` already respects `PORT`, and the task asked to avoid standalone changes without a concrete need.

### Changes

- **`prisma/schema.prisma` (`Inquiry`):**
  - New fields: `inquiryMessage String?`, `aiReview String?`, `zapierTableId String?`, `zapierRecordId String?`, and `isDemo Boolean @default(false)`.
  - New `@@unique([restaurantId, zapierTableId, zapierRecordId])`.
  - The new lines sit in their own block, so existing lines show zero changes (`prisma format` wasn't run).
- **`prisma/migrations/20261106165710_add_zapier_inquiry_import/migration.sql`:**
  - Generated offline with `prisma migrate diff --from-schema <HEAD schema from git> --to-schema prisma/schema.prisma --script`.
  - Contents: one `ALTER TABLE "Inquiry" ADD COLUMN …` (four nullable `TEXT` columns, plus `isDemo BOOLEAN NOT NULL DEFAULT false`) and one `CREATE UNIQUE INDEX`.
  - No `DROP`, `ALTER COLUMN`, or change to other tables. The three earlier migrations are untouched.
- **`src/lib/zapier-import.ts`** (server-only, no Next.js request APIs):
  - **`readZapierConfig`:** requires `ZAPIER_IMPORT_TOKEN` (at least 32 characters, no whitespace), `ZAPIER_RESTAURANT_ID` (a UUID), `ZAPIER_TABLE_ID` (printable, at most 128 characters), and `DATABASE_URL`. Any `REPLACE_` placeholder is refused.
  - **`handleZapierImport(request, { env, getDb })`, in order:**
    1. Configuration (503 `import_unavailable`).
    2. Bearer token, compared timing-safely as SHA-256 digests (401 with `WWW-Authenticate`). A bad token never reads the body or reaches the database.
    3. `application/json` media type (415).
    4. Body size (413): `Content-Length` is checked first, and a stream reader stops as soon as 128 KiB is passed.
    5. Strict UTF-8 and JSON (400 `invalid_json`).
    6. Exactly `recordId` (1–128 printable characters, no spaces), `inquiryMessage` (1–10,000), and `aiReview` (1–20,000). Text is trimmed and CRLF normalized, and control characters other than tab and line breaks are refused. Any other field is refused (400 `invalid_payload`, with problems that name fields, never values).
    7. The configured restaurant must exist (otherwise 503, with a fixed log line that doesn't include the ID).
    8. A duplicate lookup by the compound key returns 200 `duplicate`.
    9. Otherwise `create` with the configured restaurant and table, `source: "MANUAL"`, and `isDemo: true`, returning 201 `created`.
    10. On P2002 it re-reads the record and returns the winner as `duplicate`. Other errors return 500 `import_failed`, and the log carries only the error type and code.
  - Every response sends `Cache-Control: no-store` and no CORS headers, and carries only `status` and `inquiryId`, or `error`.
- **`src/app/api/integrations/zapier/inquiries/route.ts`:** `POST` only, wired to the real environment and `getPrisma`. Next.js answers 405 for `GET`, and `OPTIONS` gets 204 with no CORS allow headers.
- **`src/lib/inquiries.ts`** (server-only):
  - `listInquiriesForRestaurant(db, restaurantId)`: `where: { restaurantId }`, newest first, `take: 50`. It returns the message, review, `isDemo`, an `importedFromZapier` flag, and `receivedAt`. Zapier IDs aren't passed on.
  - `formatReceivedAt`: en-US in UTC, with a "UTC" suffix.
- **`src/app/inquiries/page.tsx`:** replaced the placeholder.
  - The header says "Limited pilot" and describes the page as read-only.
  - A Suspense list calls `requireRestaurant()` (redirecting to `/sign-in` or `/setup`), then `listInquiriesForRestaurant(getPrisma(), restaurant.id)`.
  - `unstable_rethrow` lets redirects through, and any other failure shows an "unavailable" card (fail closed).
  - It shows "For {restaurant name}", the count, **Refresh**, a truthful empty state, and the cards.
- **`src/components/inquiries/inquiry-review-card.tsx`:** the received `<time>`, a "Demonstration data" badge, an "Imported via Zapier" badge, the original request, and the AI review in a separate panel labelled "AI-generated — requires human review". Text is escaped and rendered with `whitespace-pre-wrap break-words`. There are no action buttons.
- **`src/components/inquiries/refresh-button.tsx`** (client): `router.refresh()` inside a transition, with a pending state and a polite live region.
- **`src/app/api/health/route.ts`:** `GET` returns `{"status":"ok"}`, no-store. `connection()` keeps it request-time, and it makes no database or configuration access.
- **Navigation and copy:**
  - `ModuleStatus` gained `"limited"`, with labels from `moduleStatusLabel`.
  - Inquiries is now "Limited" in the nav and the dashboard module list. Everything else is unchanged.
  - The dashboard description points to the Inquiries page, and the sources panel gained a "Zapier pilot import · Pilot" row.
  - The demo banner, sign-in scope list, and account panel now say pilot imports are stored, fictional, and labelled. They also say the dashboard and planned pages stay viewable without signing in, while `/inquiries` needs a restaurant.
- **Railway readiness:**
  - `engines.node` changed from `"^22.12 || >=24"` to `"24.x"`, and a new `.nvmrc` holds `24`.
  - New script `"db:deploy": "prisma migrate deploy"`.
  - `prisma` and `@next/env` moved from `devDependencies` to `dependencies`, because the pre-deploy migration needs the CLI and the env loader that `prisma7.config.ts` imports, even if dev dependencies are pruned.
  - The lockfile was updated with `npm install --offline`: 130 `devOptional` flags were removed and the root entries moved. No version changed, and no package was added or removed.
  - Build, start, and `postinstall` are otherwise unchanged. No Dockerfile, no standalone output, and no `railway.json`.
- **`.env.example`:** `ZAPIER_IMPORT_TOKEN`, `ZAPIER_RESTAURANT_ID`, and `ZAPIER_TABLE_ID`, with `REPLACE_` placeholders and a private token-generation hint.
- **`tests/zapier-import.test.ts`** (new, 50 tests, mocked database): see Verification.
- **Docs:**
  - **README:**
    - Status, table, tech stack, Node 24 requirement, scripts, and environment variables.
    - The Neon note (membership applied and the restaurant created, as reported), step 5, the data model, and the ownership note (browser reads require membership; machine imports have a fixed scope).
    - Restaurant-setup status and the auth "Grants" bullet.
    - New sections "Zapier pilot import" (endpoint contract, status table, review screen, and Zap steps) and "Deploying to Railway (demonstration)" (repository preparation, variables, settings, Google callback, and what's unverified).
    - Project structure and limitations.
  - **AGENTS.md:** current stage, database, restaurant, integration, and deployment state, the stack, the database rules (with the integration exception), a new "Integration and deployment rules" section, client components, and when to run `npm test`. The Next.js-managed block is unchanged.

### Verification (actual results)

- **Prisma:** `npx prisma validate` reports the schema valid, and `npx prisma generate` produced Prisma Client 7.10.1. The compound unique lookup across nullable columns type-checks.
- **Migration contents:** reviewed. Additive only, as listed. `git status` shows the earlier migrations unmodified.
- **`npm test`: 94 passed, 0 failed** (44 existing, 50 new). New tests:
  - **Configuration (5):** each missing variable gives 503 with no database use. Placeholder, short-token, non-UUID, and spaced-table configurations are refused.
  - **Authentication (8):**
    - Missing, empty, `Basic`, wrong same-length, prefix, extended, and trailing-text tokens all get 401 with `WWW-Authenticate`, even with an invalid body and content type. `request.bodyUsed` stays false.
    - A lower-case `bearer` scheme is accepted.
  - **Content (5):**
    - The JSON media type is required, and a charset parameter is accepted.
    - An oversized `Content-Length` gives 413 without reading the body.
    - An oversized streamed body with no `Content-Length` gives 413 after at most 4 chunks of 64 KiB.
    - Malformed JSON and invalid UTF-8 give 400.
  - **Payload (20):** 19 invalid shapes give 400 with no database work and no echoed values. These include client-supplied `restaurantId`, `isDemo`, `zapierTableId`, and `source`. Values exactly at the limits are accepted.
  - **Scope (2):**
    - The create data is exactly the configured restaurant and table, the record ID, `MANUAL`, `isDemo: true`, and the normalized texts.
    - The response has only `status` and `inquiryId`, with no-store, no CORS headers, and no contents.
    - A missing configured restaurant gives 503, creates nothing, and doesn't log the ID.
  - **Duplicates (4):**
    - A retry gives 200 with the same ID. Nothing is overwritten and there's a single create.
    - Two concurrent deliveries, forced to interleave by a gate in the mock, give exactly one 201 and one 200 with the same ID, and a store size of 1.
    - The same record ID from a different configured table makes a separate row.
    - A P2002 with no visible winner gives 500.
  - **Database failures (3):** a failed restaurant check, a failed insert, or a failed client creation each give 500 `import_failed`. Logs contain no password, connection string, token, contents, or "authorization".
  - **Reads (3):**
    - `where` is exactly `{ restaurantId }`, with `take` 50 and newest first, and no Zapier IDs are returned.
    - A source check that `/inquiries` uses `requireRestaurant()` and `restaurant.id`, and reads no `searchParams`, `params`, `cookies()`, or `headers()`.
    - Deterministic UTC timestamps.
- **Mutation checks:** making the token comparison always pass, disabling the P2002 handling, and disabling the streamed size limit each failed exactly the intended tests (3, 1, and 1). The file was restored from a backup and compared byte for byte.
- **`npm run lint`:** passed, exit 0, no warnings.
- **`npm run build` with every auth, database, and Zapier variable blanked:** succeeded, exit 0.
  - `/inquiries` is `◐`, and `/api/health` and `/api/integrations/zapier/inquiries` are `ƒ`.
  - No database or credentials are needed.
- **`next start` with credentials blanked and `PORT` from the environment** (no `-p`, as on Railway): 40 of 40 scripted checks passed.
  - The earlier checks.
  - `/api/health` returns exactly `{"status":"ok"}` with no-store.
  - An import while unconfigured returns 503 `import_unavailable`, `GET` on the import route returns 405, and `OPTIONS` returns 204 with no CORS allow headers.
  - Signed-out `/inquiries` returns 307 to `/sign-in` and shows no inquiry content.
  - The nav shows Inquiries as "Limited", and the dashboard lists the Zapier pilot source.

  The server log had no errors or connection strings.
- **Client bundle scan:** no Zapier configuration names, import or read functions, `timingSafeEqual`, `zapierRecordId`, Prisma, or `DATABASE_URL`.
- **Not done:** no database connection, migration, Railway or Zapier configuration, or deploy. `.env.local` was never opened, and no real credential was generated or shown.

### What is and isn't verified

- **Verified offline (mocked):** the endpoint's check order, authentication, limits, fixed scope, duplicate and race handling, sanitizing, and query shapes. Also the missing-configuration behavior, credential-free builds, `PORT` handling by `next start`, and the health endpoint.
- **Not verified:**
  - Applying the migration, and the unique index under real retries.
  - A real Zap delivery, including the API by Zapier action's field names and JSON encoding.
  - `/inquiries` against real data, and isolation with a second account.
  - Railway's build, pre-deploy (including Prisma's Linux schema engine and npm 11's held-back install scripts), and healthcheck.
  - HTTPS cookies and Google sign-in on the Railway domain.
- **Not built:** extraction from inquiries or AI text, approve, send, edit, quote, or booking, multiple restaurants or tables, Gmail, and production infrastructure.

### Open issues

- **Token model:** a single shared token, rotated manually (in Railway variables and in the Zap header together). There's no per-restaurant credential model.
- **List size:** the review list shows the latest 50, with no pagination.
- **Duplicate content:** a duplicate delivery with *different* content is still reported as `duplicate` and doesn't update the stored record, by design. Changes in Zapier after the first import aren't reflected.
- **Shared data:** the Railway demonstration would share the Neon development branch with local development.
- **Types:** `@types/node` is still `^20` while the runtime is Node 24. It's type-only and was left unchanged to avoid dependency changes.
- **Still outstanding:**
  - Restaurant browser checks beyond the first save.
  - `NavLinks` `<Suspense>`.
  - Duplicated stage definitions.
  - The dev-only audit advisories.

---

## 009: Post-demo checkpoint: Railway demonstration and live Zapier import (documentation only)

**Date:** 2026-11-06
**Agent:** Claude Code (Claude Opus 5.5)
**Branch:** `codex/verified-demo-checkpoint`, based on commit `a3e7f0b`. Nothing staged or committed by the agent.

### Request

Update README.md, AGENTS.md, and this file to the verified post-demo checkpoint, keeping setup reported by the project owner separate from browser checks performed by Codex. Document the published five-step Zap, keep the limitations explicit, and correct conflicting current-status statements. Documentation only: no application code, dependency, configuration, schema, or migration changes, and the Next.js-managed block in AGENTS.md stays as it is.

### Reported by the project owner

- All four migrations are applied to the Neon **development** branch, including `20261106165710_add_zapier_inquiry_import`. The project owner pasted local PowerShell output showing `npm run db:deploy` applying that migration, followed by `prisma migrate status` reporting the schema up to date.
- `main` was pushed to GitHub at commit `a3e7f0b`.
- The app was deployed on Railway, using the Neon development database.
- Google sign-in was configured for the Railway domain.
- The updated Zap was published.

### Observed by Codex in the browser

- The deployed health endpoint returned `{"status":"ok"}`.
- The signed-in Inquiries page displayed "Catering Concierge Demo".
- A Zapier action test returned 201 `created`.
- Repeating that delivery returned 200 `duplicate` with the same inquiry ID.
- The fictional Avery, Morgan, and Kendra inquiries appeared in the deployed app with their AI reviews.
- Kendra's inquiry appeared after a later delay. The cause hasn't been confirmed.

Claude didn't perform, observe, or independently confirm any of the checks above, and connected to no service for this entry.

### The published Zap (five steps)

1. Zapier Tables — New Record.
2. AI by Zapier — Analyze and Return Data.
3. Zapier Tables — Update Record, writing the AI review only.
4. Code by Zapier — Run Javascript, using `JSON.stringify` to package `recordId`, `inquiryMessage`, and `aiReview`.
5. API by Zapier — an authenticated POST to `/api/integrations/zapier/inquiries`.

The bearer token is stored in the API by Zapier authentication connection as a static `Authorization` header, which Zapier adds to each request. It isn't entered in the action's ordinary fields. Token rotation must update that connection and the application environment (`ZAPIER_IMPORT_TOKEN`) together.

This replaces the earlier plan in entry 008 (three existing steps plus an API step building the JSON from key/value fields).

### Limitations that remain

- This is a deployed demonstration on Neon development, not a production-ready restaurant service. Local development and the deployment share the same data.
- Imports use one configured restaurant and table, and are always marked as fictional demonstration data.
- Inquiry viewing works. Manual entry, editing, quotes, sending, bookings, and Gmail integration aren't built.
- Isolation between two restaurant accounts hasn't been tested live. Neither have concurrent deliveries of the same record (offline tests only).
- The dashboard pipeline remains separate, fictional sample data.
- The app itself makes no AI calls. AI processing happens in Zapier.
- On Railway, only a signed-in session was observed. The local sign-in checks, the cookie's `Secure` flag, and healthcheck timing weren't verified there. Because the import migration was applied locally, Railway's `npm run db:deploy` pre-deploy execution is also unverified.
- Restaurant setup checks beyond the first save are still unreported.

### Documentation updated

- **README.md:**
  - The status block (now a checkpoint with reported and observed lists) and the "What exists today" rows for sign-in, the account panel, Inquiries, the import endpoint, health, and the database layer.
  - The tech stack, the `npm test` description, the Neon status note, Database setup step 5, and the data model's import fields (now applied).
  - The ownership note and the authentication verification notes (Railway).
  - The Zapier section: status, a new "The published Zap" subsection, and setup and maintenance steps replacing the old connection steps.
  - The Railway section's status and its "Not verified" list.
  - Project structure (migrations; `navigation.ts` statuses) and "Current limitations".
- **AGENTS.md:** current stage, a post-demo checkpoint paragraph, and the database, authentication, integration, and deployment state. Also the Railway stack line, and the isolation rule (now requires a second-account test). The Next.js-managed block is unchanged.
- **PROMPT-HISTORY.md:** this entry. Earlier entries are unchanged, including entry 008's "unverified live" heading, which is historical.

### Corrections (same task, at the project owner's request)

- **Branch:** this entry first listed `main`. The working branch is `codex/verified-demo-checkpoint`, based on `a3e7f0b`.
- **Migration method:** the project owner supplied local PowerShell output showing `npm run db:deploy` applying `20261106165710_add_zapier_inquiry_import`, followed by `prisma migrate status` reporting the schema up to date. Statements that local versus Railway application was unknown were removed from README.md, AGENTS.md, and this entry. Railway's pre-deploy execution remains separately unverified.
- **Sample-data rule:** AGENTS.md requirement 2 now says dashboard fixtures live in `src/lib/demo-data.ts`, and that the approved Zapier pilot stores fictional inquiries in the database with `isDemo: true` and visible demonstration labels. The other fictional-data requirements are unchanged. The README's sample-data paragraph and project-structure line now match.
- **Zapier token:** README.md, AGENTS.md, and this entry now explain that the bearer token is stored in the API by Zapier authentication connection as a static `Authorization` header, injected into requests rather than entered in ordinary action fields, and that rotation must update that connection and the application environment together.

### Verification

- Documentation-only. `npm run lint`, `npm run build`, and `npm test` weren't rerun for this update.
- Earlier in the same session, a read-only demo-readiness review of commit `a3e7f0b` ran `npm test` (94 passed, 0 failed), `npm run lint` (passed), and `npm run build` (passed). No code has changed since.
- No `.env` file was opened. No service was contacted, no migration was run, and nothing was committed, pushed, or deployed.

### Open issues

- **Code comments and labels not updated in this documentation-only task:**
  - `src/lib/session.ts` still has a comment saying a session must not be used to read restaurant or inquiry data.
  - The sidebar's demo pill (`src/components/demo-mode.tsx`) says "Sample data only", although the sign-in and restaurant name are real.
- **Kendra's delayed appearance** has no confirmed cause.
- **Still outstanding from earlier entries:**
  - Restaurant setup checks beyond the first save.
  - `NavLinks` `<Suspense>`.
  - Duplicated stage definitions.
  - The dev-only audit advisories.
