<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Catering Concierge: Shared Agent Requirements

These rules apply to every AI agent working in this repository (Claude Code, Codex, and others). `CLAUDE.md` imports this file and adds Claude-specific workflow.

## Product

Catering Concierge is a catering management SaaS product for independent restaurants. It processes catering inquiries from connected email, web forms, and manual input. Planned modules include AI extraction, menu management, deterministic quotes, customer communications, bookings, and business analytics.

## Current stage

**Foundation, database schema on Neon development, Google sign-in, restaurant setup, a Zapier pilot import with a read-only `/inquiries` review screen, and a Railway demonstration deployment that uses the Neon development branch.** This is a deployed demonstration, not a production-ready restaurant service. The dashboard shows fictional demonstration data.

**Post-demo checkpoint (2026-11-06).** Keep these two sources apart when describing what's verified:
- **Reported by the project owner:** all four migrations applied to Neon development (the fourth locally with `npm run db:deploy`, shown in the owner's pasted PowerShell output); `main` pushed to GitHub at commit `a3e7f0b`; the app deployed on Railway using the Neon development database; Google sign-in configured for the Railway domain; the updated five-step Zap published.
- **Observed by Codex in the browser:** the deployed `/api/health` returned `{"status":"ok"}`; the signed-in `/inquiries` page displayed "Catering Concierge Demo"; a Zapier action test returned 201 `created`, and repeating that delivery returned 200 `duplicate` with the same inquiry ID; the fictional Avery, Morgan, and Kendra inquiries appeared in the deployed app with their AI reviews. Kendra's inquiry appeared after a later delay whose cause hasn't been confirmed.

**Database state:**
- **Code:** the Prisma 7 schema (`Restaurant`, `Inquiry`, the auth models `User`, `Session`, `Account`, `Verification`, and `RestaurantMembership`), four SQL migrations, and a server-only client in `src/lib/db.ts`.
- **Applied (reported by the project owner):** the user applied migration `20261106081912_init` to the Neon **development** branch. `prisma migrate status` reports the schema is up to date, which verifies the CLI's direct connection (`DIRECT_URL`).
- **Verified by `npm run db:check` (2026-11-06):** the app's pooled connection (`DATABASE_URL`) through `getPrisma()`, with read-only `COUNT` queries on `Restaurant` and `Inquiry`.
- **Applied (reported by the project owner):** migration `20261106140237_add_better_auth` (auth tables only) on Neon development. `prisma migrate status` reports the schema up to date.
- **Applied (reported by the project owner):** migration `20261106155051_add_restaurant_membership` on Neon development. The user created a restaurant named "Catering Concierge Demo" and saw it displayed.
- **Applied (reported by the project owner):** migration `20261106165710_add_zapier_inquiry_import` (`Inquiry` import columns plus the unique index on `restaurantId, zapierTableId, zapierRecordId`) on Neon development. The owner's pasted local PowerShell output shows `npm run db:deploy` applying it, followed by `prisma migrate status` reporting the schema up to date. All four migrations are now applied there.
- **Observed live (Codex, in the browser):** Zapier imports persisted and displayed on the deployed `/inquiries`, and a repeated delivery returned the existing inquiry instead of a new one.
- **Not tested live:**
  - Restaurant setup's repeat and concurrent paths, rollback, and unique constraint.
  - Concurrent deliveries of the same Zapier record (only a sequential repeat was observed).
  - `/inquiries` isolation between two restaurant accounts.
- **Who touches restaurant and inquiry data:**
  - Restaurant setup reads and writes the session user's own `Restaurant` and `RestaurantMembership`.
  - The Zapier import writes `Inquiry` rows only for the configured restaurant.
  - `/inquiries` reads `Inquiry` rows only for the member's restaurant.
  - Nothing edits, deletes, or extracts fields from inquiries. The dashboard still shows fictional demonstration data.
- Everything runs on Neon development only, including the Railway demonstration, which shares that branch with local development. There's no production database or production deployment.

**Authentication state:** Google-only sign-in with Better Auth (`src/lib/auth.ts`, `/api/auth/[...all]`, `/sign-in`).
- Implemented and covered by offline tests (`npm test`).
- **Verified locally by the user (2026-11-06), against Neon development:** the user configured the credentials and secret privately and passed these manual browser checks: sign-in with a real Google account; staying signed in after a reload and after a browser restart; sign-out on desktop, from the mobile drawer, and from the drawer while already on `/sign-in`; and cancelling at Google, going back, and retrying.
- **Railway demonstration:** the project owner reports configuring Google sign-in for the Railway domain, and Codex observed a signed-in `/inquiries` page on the deployed app. The local manual checks above weren't repeated there.
- **Not verified live:** stored-token contents and the disabled token endpoints (offline tests only), focus and screen-reader behavior, the session cookie's `Secure` flag on Railway, and any production environment.
- Without configuration, the UI shows "Sign-in not set up", the sign-in button is disabled, and `/api/auth/*` answers 503.

**Restaurant state:** one restaurant per user, created at `/setup` with the creator as `OWNER`.
- Restaurant scope comes from `src/lib/restaurant-access.ts`.
- Implemented and covered by offline tests that use a mocked database (`tests/restaurants.test.ts`).
- Partly verified live: migration applied and one restaurant created and displayed (reported by the user). The other checks in the README's "Restaurant setup" section haven't been reported.

**Integration state:** `POST /api/integrations/zapier/inquiries` (`src/lib/zapier-import.ts`) imports fictional pilot records from one Zapier table into one restaurant.
- Covered by offline tests with a mocked database (`tests/zapier-import.test.ts`).
- **Working on the Railway demonstration** with the published five-step Zap documented in the README ("Zapier pilot import"): Tables New Record → AI by Zapier → Tables Update Record (AI review only) → Code by Zapier (`JSON.stringify` of `recordId`, `inquiryMessage`, `aiReview`) → API by Zapier authenticated POST. See the checkpoint above for what was reported and what Codex observed.
- **Token in Zapier:** the bearer token is stored in the API by Zapier authentication connection as a static `Authorization` header, which Zapier adds to each request. It isn't entered in the action's ordinary fields. Rotating it means updating that connection and the application environment (`ZAPIER_IMPORT_TOKEN`) together.
- Imports always go to the one configured restaurant and table and are always marked fictional demonstration data.
- **Not tested live:** concurrent deliveries of the same record, and token rotation.

**Deployment state:** deployed on Railway as a demonstration that uses the Neon development branch (reported by the project owner), with Node 24, Railpack defaults, and `/api/health` (Codex observed `{"status":"ok"}`). It isn't production-ready. The import migration was applied locally (owner's pasted terminal output), so Railway's `npm run db:deploy` pre-deploy execution remains unverified, as does healthcheck timing.

Inquiries can be viewed only. There's no manual inquiry entry, editing, quoting, sending, booking, staff roles, invitations, or Gmail integration. The app itself makes no AI calls: AI processing happens in Zapier. See `PROMPT-HISTORY.md` for what each task delivered.

## Stack

- Next.js 16 App Router with Turbopack, `cacheComponents` and `partialPrefetching` enabled
- React 19, TypeScript (strict), Tailwind CSS v4 (CSS-first `@theme` tokens in `src/app/globals.css`)
- Prisma ORM 7.10 (`prisma-client` generator, output to the git-ignored `src/generated/prisma`) with `@prisma/adapter-neon` for Neon PostgreSQL. CLI config lives in `prisma7.config.ts`. Keep `prisma`, `@prisma/client`, and `@prisma/adapter-neon` on the same 7.x version. npm's `prisma@latest` currently points to an 8.x release candidate.
- Better Auth 1.7 (`better-auth`, pinned `~1.7.18`) for Google sign-in and database sessions, through its Prisma adapter and the app's `getPrisma()`
- Railway (deployed as a demonstration on Neon development, reported by the project owner): Railpack builder, Node 24 (`engines.node` `24.x`, `.nvmrc`, `RAILPACK_NODE_VERSION`). No Dockerfile, no standalone output, and no `railway.json` (config-as-code is deprecated by Railway)
- Later stages: Gmail API (OAuth)

## Database rules

- Use `getPrisma()` from `src/lib/db.ts` only in server code. It imports `server-only`, so never import it from client components.
- `DATABASE_URL` (pooled) is for the app runtime. `DIRECT_URL` (direct) is for the Prisma CLI.
- `getPrisma()` runs in five places today:
  - Better Auth (`src/lib/auth.ts`), which reads and writes only the auth tables.
  - Restaurant setup and scope (`src/lib/restaurants.ts`, called from `restaurant-access.ts`, `restaurant-actions.ts`, and `account-state.ts`). It reads and writes only the session user's own `RestaurantMembership` and `Restaurant`.
  - `/inquiries` (`src/lib/inquiries.ts`), which reads `Inquiry` only with the restaurant ID from `requireRestaurant()`.
  - The Zapier import (`src/lib/zapier-import.ts`), which writes `Inquiry` only for `ZAPIER_RESTAURANT_ID`.
  - `npm run db:check` (`scripts/db-check.ts`). It's manual, read-only, and runs under `--conditions=react-server`, so `server-only` stays real. Keep it out of install, lint, and build. Run it only when the user authorizes a database connection.
- **Ownership is not authorization.** `Inquiry.restaurantId` records ownership only. Before exposing any database-backed page, route, or action, authenticated restaurant selection and restaurant-scoped queries must exist. Don't claim tenant isolation until they do.
  - **Narrow exception (approved by the user):** the Better Auth endpoints (`/api/auth/*`) and server-side session reads may use the database without a restaurant membership.
  - **Restaurant access:** only through the session user's membership, via `getRestaurantAccess()` / `requireRestaurant()` (`src/lib/restaurant-access.ts`) or the setup flow in `src/lib/restaurants.ts`. Never accept a restaurant ID, user ID, owner ID, or role from a form, URL, header, or browser state. Never add an endpoint that looks up a restaurant by an arbitrary ID.
  - **Browser inquiry access requires membership.** Every browser-facing inquiry query must filter by `requireRestaurant()`'s `restaurant.id`. Today only `listInquiriesForRestaurant` (read-only) does this. Don't claim live-verified isolation until it's tested with a second restaurant account against a real database. So far only one member's view has been observed live.
  - **Integration exception (approved by the user):** authenticated machine imports have a fixed server-side restaurant scope. `POST /api/integrations/zapier/inquiries` writes only to `ZAPIER_RESTAURANT_ID` and `ZAPIER_TABLE_ID`, after a timing-safe bearer-token check. It's a single-restaurant pilot, not a multi-tenant credential system.
  - **No caching across requests:** don't put membership or restaurant reads in `"use cache"` scopes (`tests/restaurants.test.ts` fails if any source file uses `"use cache"`).
- Auth models follow Better Auth's core schema. When upgrading `better-auth`, run `npm test`: it checks offline that `prisma/schema.prisma` still matches the library. Don't run `npx auth generate` against this schema, because it rewrites the file.
- Agents must not apply migrations, run `db push` or `migrate reset`, seed, or connect to a database unless the user explicitly asks. Create new migrations with the user, or offline with `prisma migrate diff`. Never fabricate migration history.

## Authentication rules

- Trusted identity comes only from `getSessionUser()` / `requireSessionUser()` in `src/lib/session.ts` (server-only). Never accept a user ID or email from the client, and never trust `authClient` results for authorization.
- Session reads are request-time and uncached. Keep them inside `<Suspense>`, and don't put them in `"use cache"` scopes.
- Google sign-in requests only the default identity scopes (`openid`, `email`, `profile`). Adding Gmail scopes or offline access is a separate, explicitly approved task.
- Provider tokens stay on the server. Never log them or send them to the browser.
  - Access and refresh tokens are encrypted at rest (`account.encryptOAuthTokens`).
  - That option doesn't cover ID tokens, so the `account` database hooks in `src/lib/auth.ts` clear `idToken` on every write.
  - `/get-access-token`, `/refresh-token`, and `/account-info` are disabled (`disabledPaths`). Don't re-enable them, or add endpoints that return tokens, without explicit approval.
- Configuration decisions happen on the server (`src/lib/auth-config.ts`). Client components receive flags and variable names only, never values.

## Integration and deployment rules

- **Zapier import:**
  - Never accept a destination restaurant, table, source, or demonstration marker from the payload. Accept only `recordId`, `inquiryMessage`, and `aiReview`, bounded.
  - Authenticate before reading the body or touching the database.
  - Imports are always `isDemo: true` and `source: MANUAL`.
  - Duplicates return the existing inquiry. Never update or overwrite one.
  - Responses carry only status and ID. Logs carry only error types and codes, never headers, bodies, tokens, or raw database errors.
  - Don't add CORS headers.
- **AI review text:** it's untrusted plain text. Render it only as escaped text labelled "AI-generated — requires human review". Never parse dates, names, counts, prices, or statuses out of it, and never add approve, send, edit, quote, or booking controls without an explicit task.
- **Deployment:**
  - Migrations run only through `npm run db:deploy` (Railway's pre-deploy command or the user), never in `build` or `postinstall`.
  - `/api/health` must stay free of database queries and configuration details.
  - Keep `prisma` and `@next/env` in `dependencies`, because the pre-deploy migration needs them at runtime.

## Non-negotiable requirements

1. **Honesty in the UI.** Never add buttons, toggles, or flows that look functional but aren't. No fake integrations, no simulated success messages. Unbuilt modules are labeled "Planned" / "Not yet built". Update `status` in `src/lib/navigation.ts` only when a module really works.
2. **Demonstration data is fictional and labeled.** Dashboard fixtures live in `src/lib/demo-data.ts`. The only other source is the approved Zapier pilot, which stores fictional inquiries in the database with `isDemo: true`. Every screen that shows them must carry a visible demonstration label. Use the "Example" surname for people. No real customers, no real pricing, and no claimed business performance (revenue, conversion rates, and so on). Any screen showing sample data must say so visibly.
3. **Secrets.** Never read, print, log, or commit credentials or `.env*` files (except `.env.example`, which holds placeholders only). Never put secrets in client components or `NEXT_PUBLIC_*` variables.
4. **Scope.** Do only the task requested. No unrequested features, dependencies, services, or abstractions. Don't overwrite existing work without approval.
5. **No external side effects.** Agents do not commit, push, deploy, or configure external accounts unless the user explicitly asks.
6. **Accessibility and responsiveness.** Semantic HTML, labeled controls, visible focus states, WCAG AA contrast, keyboard-operable navigation, and layouts that work from about 360px wide upward.

## Conventions

- Server Components by default. Add `"use client"` only for interactivity or browser APIs (currently `nav-links.tsx`, `mobile-nav.tsx`, the sign-in and sign-out buttons in `src/components/auth/`, `src/components/restaurant/restaurant-setup-form.tsx`, and `src/components/inquiries/refresh-button.tsx`).
- Use the `@/*` import alias for `src/*`.
- Use the theme tokens (`forest-*`, `brass-*`, `ivory`, `cream`, `linen`, `sand`, `ink`, `muted`; `font-display` for headings; `shadow-card` / `shadow-card-raised` for card shadows). Avoid ad-hoc hex or rgba values in components.
- Icons are inline SVGs in `src/components/icons.tsx`. Don't add an icon library for a few glyphs.
- Format dates deterministically (fixed locale and `timeZone`) to avoid hydration mismatches.
- With `cacheComponents` on, any component that reads `usePathname` / `useSearchParams` under a dynamic route needs a `<Suspense>` boundary. Check the bundled docs.

## Implementation verification (required)

Any agent that **implements** changes, including fixes approved after a review, must run both of the following before reporting the task complete, and report their actual results:

```bash
npm run lint
npm run build
```

When a change touches authentication, restaurant setup or scope, inquiries, the Zapier import, the schema, `src/lib/auth*.ts`, `src/lib/restaurant*.ts`, `src/lib/inquiries.ts`, or `src/lib/zapier-import.ts`, also run `npm test` (offline; no database or credentials).

Report failures honestly. Don't claim a check passed without running it.

## Read-only reviews (any agent)

These rules apply to **any agent assigned a review**, whatever the model or tool (Codex, Claude, or another). Reviewing and implementing are separate tasks:

- **A review** inspects and reports. It never changes the repository.
- **Implementing review findings** is a new implementation task. It needs the user's explicit approval and follows the implementation rules above, including required verification.

While reviewing, the reviewer:

- **Must not** edit, create, or delete source files, configuration, or project documentation (including this file, `CLAUDE.md`, `README.md`, and `PROMPT-HISTORY.md`).
- **Must not** install, update, or remove packages, apply audit fixes, run migrations, or change any data.
- **Must not** stage, commit, push, deploy, or configure external accounts, and must not make network calls beyond what the review needs.
- **Must not** read, print, or log credentials or `.env*` files. Requirement 3 above applies in full.
- **Should not** run `next dev` (`npm run dev`), because it rewrites the managed block at the top of this file.

Running checks during a review is **optional**. A reviewer may run `npm run lint`, `npm run build`, and `npm run start` (for route checks). The generated output these produce (for example `.next/`, `next-env.d.ts`, and `tsconfig.tsbuildinfo`, all git-ignored) is acceptable. The reviewer must state exactly which checks they ran and their actual results, and must not imply a check passed if it wasn't run.

A review should:

1. Check the change against the task's stated scope and the requirements above, especially UI honesty, fictional-data labeling, and secret handling.
2. Look for correctness, accessibility (keyboard, focus, labels, contrast), responsiveness, and type-safety issues.
3. Flag unnecessary dependencies, premature abstractions, or dead code.
4. Separate what was verified (and how) from what still needs manual or visual checking.
5. Report findings as a prioritized list (blocking / should-fix / nit), each with a file path and line, the problem, and a suggested fix. Say plainly when nothing blocking is found.
