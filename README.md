# Catering Concierge

Catering Concierge is a catering management product for independent restaurants. The goal is to capture catering inquiries from a connected inbox, web forms, and manual entry, then help staff move each one from first contact to a confirmed event.

> **Status: foundation, database schema on Neon development, Google sign-in verified locally against Neon development, and restaurant setup (implemented, unverified live).** The UI is a responsive dashboard shell running on **fictional demonstration data**.
>
> - The initial migration has been applied to the Neon development branch, and the Prisma CLI's direct connection is verified.
> - The app's **pooled** connection through `getPrisma()` is verified with read-only `COUNT` queries on both tables (`npm run db:check`, 2026-11-06).
> - **Google sign-in, sessions, and sign-out work locally against Neon development** (reported by the project owner, 2026-11-06). The auth migration is applied there, and the project owner's manual browser checks passed. See [Authentication setup](#authentication-setup). Production and Railway authentication are untested.
> - **Restaurant setup and ownership are implemented but unverified live.** A signed-in user can create one restaurant at `/setup` and becomes its owner. The membership migration (`20261106155051_add_restaurant_membership`) is prepared but **not applied**, so setup hasn't run against a real database. See [Restaurant setup](#restaurant-setup).
> - **No page reads or writes inquiry records.** Restaurant-scoped inquiry operations, and tenant isolation for them, aren't built.
> - No email account or AI service is connected.

## What exists today

| Area | State |
| --- | --- |
| App shell (sidebar, mobile drawer, routing) | Working |
| Dashboard summary cards | Demo only. Counts are derived from the fictional sample dataset |
| Inquiry pipeline preview | Demo only. Read-only fictional inquiries |
| Demonstration-mode indicator | Shown on every page |
| Google sign-in, sessions, and sign-out (Better Auth) | Working locally against Neon development (manual checks by the project owner). Production and Railway are untested. Without configuration, the shell says "Sign-in not set up" and the sign-in button is disabled |
| Sign-in page (`/sign-in`) and account panel (sidebar and mobile drawer) | Working. Show setup status, the signed-in name and email, and sign-out. The panel also shows the member's restaurant name, or a link to set one up (restaurant part unverified live) |
| Restaurant setup (`/setup`) and owner membership | Implemented, **unverified live**. Needs the membership migration and a browser test. Offline tests cover the logic with a mocked database |
| Inquiries, Email, Menu, Quotes, Events, Settings | Routes exist and show planned scope. **No functionality** |
| Database layer (Prisma 7 + Neon) | `Restaurant` and `Inquiry` migrated to Neon development. The CLI's direct connection and the app's pooled connection (`getPrisma()`, read-only counts) are verified. The auth-tables migration is also applied there, and sign-in uses those tables. The membership migration (`20261106155051_add_restaurant_membership`) is prepared but **not applied**. Only restaurant setup writes `Restaurant` rows. No page reads or writes inquiry records, and restaurant and inquiry write persistence is untested |

The sample records live in [`src/lib/demo-data.ts`](src/lib/demo-data.ts). They use the "Example" surname and contain no pricing or revenue figures.

## Planned modules (not implemented)

- AI-assisted extraction of inquiry details, with staff review
- Menu management
- Deterministic quote calculation from restaurant-defined menu and pricing rules
- Customer communications (drafted replies that staff send)
- Bookings / events
- Business analytics

## Tech stack

- [Next.js](https://nextjs.org) 16 (App Router, Turbopack, Cache Components), React 19, TypeScript
- Tailwind CSS v4 (theme tokens in [`src/app/globals.css`](src/app/globals.css))
- Fonts: Fraunces (display) and Inter (body) via `next/font/google`
- Database: [Prisma ORM](https://www.prisma.io) 7.10 with the Neon driver adapter, for Neon PostgreSQL. The schema is applied to the development branch. The app uses it only for sign-in and sessions.
- Authentication: [Better Auth](https://www.better-auth.com) 1.7 (Google only), through its Prisma adapter

Planned for later stages: the OpenAI API, the Gmail API with OAuth, and deployment on Railway.

## Getting started

Requirements: Node.js 22.12+ or 24+ (developed on Node 24) and npm. Prisma 7 needs Node 20.19+, and Neon's driver needs the built-in WebSocket from Node 22 onward. The `engines` field in `package.json` records this.

```bash
npm install        # also runs `prisma generate` (postinstall)
npm run dev        # http://localhost:3000
```

Other scripts:

```bash
npm run lint       # ESLint (next/core-web-vitals + TypeScript rules)
npm run build      # prisma generate, then the production build (includes type checking)
npm run start      # Serve the production build
npm run db:check   # Manual, read-only database connectivity check (needs .env.local; see below)
npm test           # Offline auth tests (Node's built-in runner; no database, network, or credentials)
```

The app runs and builds **without any environment variables**. Without them, sign-in shows "Sign-in not set up", its button is disabled, and `/api/auth/*` answers 503. Nothing connects to the database at build time. [`.env.example`](.env.example) lists every variable, with placeholders only. Real values belong in `.env.local`, which git ignores. Any value still containing `REPLACE_` counts as unset.

| Variable | Used by | Notes |
| --- | --- | --- |
| `DATABASE_URL` | The app at runtime ([`src/lib/db.ts`](src/lib/db.ts)) | Neon **pooled** connection (host contains `-pooler`) |
| `DIRECT_URL` | Prisma CLI: migrations and Studio ([`prisma7.config.ts`](prisma7.config.ts)) | Neon **direct** (unpooled) connection |
| `BETTER_AUTH_SECRET` | Better Auth ([`src/lib/auth.ts`](src/lib/auth.ts)) | Signs cookies and encrypts stored OAuth access and refresh tokens. At least 32 random characters, unique per environment |
| `BETTER_AUTH_URL` | Better Auth | The app's origin, such as `http://localhost:3000`. The only trusted origin, and the base of the Google redirect URI |
| `GOOGLE_CLIENT_ID` | Better Auth's Google provider | From your Google Cloud OAuth client |
| `GOOGLE_CLIENT_SECRET` | Better Auth's Google provider | From your Google Cloud OAuth client |

All of these are server-only. None uses the `NEXT_PUBLIC_` prefix, and the browser only ever learns whether sign-in is configured.

Next.js loads `.env*` files itself. Prisma 7 doesn't, so `prisma7.config.ts` uses `@next/env` to load them with the same precedence as Next.js: `process.env`, then `.env.$(NODE_ENV).local`, `.env.local`, `.env.$(NODE_ENV)`, `.env`.

## Database setup

These steps connect the code to a Neon database. They're written for PowerShell, from the repository root.

> **Neon development status (reported by the project owner, 2026-11-06):**
> - Against the Neon **development** branch, `DATABASE_URL` and `DIRECT_URL` were added privately to `.env.local`, and `npx prisma migrate status` ran successfully.
> - `npx prisma migrate deploy` applied `20261106081912_init`, and a follow-up `npx prisma migrate status` reported "Database schema is up to date!".
> - This verifies the CLI's **direct** connection (`DIRECT_URL`).
> - The app's **pooled** connection (`DATABASE_URL`) through `getPrisma()` was later verified with `npm run db:check` (read-only counts, both tables returned 0 rows).
> - No other environment (production, Railway) has been set up.
> - The second migration, `20261106140237_add_better_auth`, was later applied to the same development branch, and `npx prisma migrate status` again reported the schema up to date.
> - The third migration, `20261106155051_add_restaurant_membership`, **hasn't been applied**. Step 5 applies it.
>
> Repeat the steps below for any new environment.

1. Create a Neon project in the Neon console. Copy its **pooled** and **direct** connection strings.
2. Create `.env.local` from the template without overwriting an existing file, then paste the real values into it:

   ```powershell
   if (-not (Test-Path .env.local)) { Copy-Item .env.example .env.local }
   notepad .env.local
   ```

3. Install dependencies. This also generates Prisma Client into `src/generated/prisma`:

   ```powershell
   npm install
   ```

4. Check what Prisma sees. This **connects** to the database through `DIRECT_URL` but changes nothing:

   ```powershell
   npx prisma migrate status
   ```

5. Apply the committed migrations. This **changes the database**: it runs every pending migration in `prisma/migrations/`:
   - `20261106081912_init`: the restaurant and inquiry tables.
   - `20261106140237_add_better_auth`: the `User`, `Session`, `Account`, and `Verification` tables.
   - `20261106155051_add_restaurant_membership`: the `RestaurantRole` enum and the `RestaurantMembership` table.

   The first two are already applied on Neon development, so only the third is pending there:

   ```powershell
   npx prisma migrate deploy
   ```

For later schema changes, edit `prisma/schema.prisma` and run `npx prisma migrate dev --name <short-description>` against a development database. `migrate dev` uses a temporary shadow database. If the database role can't create databases, set `shadowDatabaseUrl` in `prisma7.config.ts`.

### Verify the database connection (read-only)

```powershell
npm run db:check
```

This runs [`scripts/db-check.ts`](scripts/db-check.ts) with `node --conditions=react-server --import tsx`.

- **What it does:**
  - Loads `.env*` files with `@next/env`, the same loader as Next.js and `prisma7.config.ts`.
  - Calls the app's own `getPrisma()` with the **pooled** `DATABASE_URL`, and fails if that host isn't a Neon `-pooler` endpoint. It never uses `DIRECT_URL`.
  - Runs `COUNT` queries on `Restaurant` and `Inquiry`.
  - Closes the connection when it finishes.
- **What it never does:** read individual records, write anything, change the schema, or touch any database other than the one in `DATABASE_URL`.
- **How it's bounded:** `src/lib/db.ts` sets a 10s connection timeout and a 15s query timeout, and the script gives up after 45s overall.
- **Why the `react-server` condition:** it lets `db.ts` keep its real `server-only` import, which resolves to an empty module under that condition. It isn't mocked.
- **On success:** it prints `PASS` with the row counts and exits 0.
- **On failure:** it prints `FAIL` and a sanitized category (error type, Prisma, SQLSTATE or errno code, and a likely cause) and exits 1. It never prints connection strings, hostnames, credentials, raw database errors, or record contents.
- **Kept separate:** it isn't part of `npm install`, `npm run lint`, or `npm run build`. None of those need database access.

Other offline commands (no database connection needed):

```powershell
npx prisma validate    # check the schema
npx prisma generate    # regenerate the client after schema changes
```

> **Prisma version note:** the `prisma` package's npm `latest` tag currently points to a Prisma 8 **release candidate**. This project pins Prisma 7 (`^7.10.1`) for `prisma`, `@prisma/client`, and `@prisma/adapter-neon`. Ignore the CLI's "update available" banner, and don't run `npm i prisma@latest`. Upgrade all three packages together, deliberately.

### Data model

- **Restaurant**: `id` (UUIDv7), `name`, timestamps. Its members are linked through `RestaurantMembership`. Restaurant setup trims names and limits them to 100 characters in application code; the database column isn't length-limited.
- **Inquiry**:
  - `id`, a required `restaurantId`, timestamps.
  - `source`: `MANUAL`, `EMAIL`, or `WEB_FORM`.
  - `stage`: `NEW`, `NEEDS_DETAILS`, `QUOTING`, `AWAITING_CLIENT`, or `CONFIRMED`. Defaults to `NEW`, matching the demo pipeline.
  - Optional details: `eventName`, `contactName`, `contactEmail`, `eventDate` (PostgreSQL `DATE`), `guestCount`, `notes`.
  - Indexes on `(restaurantId, stage, createdAt)`, `(restaurantId, createdAt)`, and `(restaurantId, eventDate)`.
  - Deleting a restaurant that still has inquiries is **blocked** (`ON DELETE RESTRICT`).
  - IDs are UUIDv7 values generated by Prisma Client, not database defaults. Rows inserted outside Prisma must supply their own `id`.
- **Authentication** (Better Auth's core schema, with the same UUIDv7 IDs):
  - **User**: `name`, unique `email`, `emailVerified`, optional `image`, timestamps.
  - **Session**: unique `token`, `expiresAt`, optional `ipAddress` and `userAgent`, `userId` (indexed).
  - **Account**: `providerId` (`google`), `accountId` (Google's subject ID), `userId` (indexed), optional token fields, and `scope`. Better Auth encrypts `accessToken` and `refreshToken`. `idToken` stays `NULL`, because the app clears it before every write. `password` exists in the core schema but stays unused, because email/password sign-in is off.
  - **Verification**: `identifier` (indexed), `value`, `expiresAt`. Holds short-lived OAuth sign-in state.
  - Deleting a user deletes their sessions and accounts (`ON DELETE CASCADE`). A user reaches a restaurant only through `RestaurantMembership`.
- **RestaurantMembership** (not applied to any database yet):
  - `id` (UUIDv7), `userId`, `restaurantId`, `role`, timestamps.
  - `role` is the `RestaurantRole` enum, which has one value, `OWNER`.
  - `userId` is **unique**: each user belongs to at most one restaurant, enforced by the database.
  - Indexed on `restaurantId`.
  - Deleting a user or a restaurant that still has a membership is **blocked** (`ON DELETE RESTRICT`).
  - Keyed by user ID, never by email address.

> **Ownership isn't authorization.** `restaurantId` records which restaurant owns an inquiry. It doesn't control who can see or change it. Before any database-backed page, route, or action is exposed, the app needs authentication, authenticated restaurant selection, and restaurant-scoped queries. **Authentication works locally (Neon development).**
>
> - **Implemented, unverified live:** restaurant scope. `getRestaurantAccess()` / `requireRestaurant()` in [`src/lib/restaurant-access.ts`](src/lib/restaurant-access.ts) resolve the signed-in user's restaurant through their membership.
> - **Not built:** restaurant-scoped inquiry queries, so inquiry tenant isolation isn't implemented or tested.
> - **Database-backed routes today:**
>   - Better Auth's `/api/auth/*` endpoints and server-side session reads, an exception the project owner approved.
>   - The restaurant setup page and its Server Action, which read and write only the signed-in user's own membership and restaurant.

## Authentication setup

Sign-in is **Google only**, through [Better Auth](https://www.better-auth.com).

> **Local verification (reported by the project owner, 2026-11-06):**
> - Applied `20261106140237_add_better_auth` to Neon development. `npx prisma migrate status` reported the schema up to date.
> - Configured the Google OAuth client, its credentials, and `BETTER_AUTH_SECRET` privately.
> - Passed these manual browser checks: sign-in with a real Google account; staying signed in after a reload and after a browser restart; sign-out on desktop, from the mobile drawer, and from the drawer while already on `/sign-in`; and cancelling at Google, going back, and retrying.
> - **Not reported, so not verified:** the optional Neon table inspection (encrypted `accessToken`, empty `idToken`) and a direct request to the disabled token endpoints. Offline tests (`npm test`) cover those instead.
> - Focus return and screen-reader announcements weren't separately reported.
> - Production and Railway authentication are untested. Repeat the steps below, with that environment's origin and callback URI, for any new environment.

**What signing in does:**
- Requests only Google's identity scopes: `openid`, `email`, and `profile`. No Gmail access, and no offline access (Google issues no refresh token).
- Creates a database session in a signed, httpOnly cookie. It lasts 7 days from sign-in and isn't extended by page views.
- **Grants no inquiry data.** Every demonstration page stays viewable without signing in. Signing in lets you set up one restaurant (see [Restaurant setup](#restaurant-setup)). It doesn't unlock any inquiry records, because none are real yet.

**How it's built:**
- The Better Auth handler is [`src/app/api/auth/[...all]/route.ts`](src/app/api/auth/%5B...all%5D/route.ts). The auth instance is created on the first request, so builds need no credentials.
- Trusted identity on the server comes from `getSessionUser()` / `requireSessionUser()` in [`src/lib/session.ts`](src/lib/session.ts). They read only the signed session cookie, take no user ID argument, and cache nothing.
- Library protections stay on:
  - OAuth state and PKCE.
  - Origin and CSRF checks.
  - Callback URLs validated against `BETTER_AUTH_URL`.
  - Secure cookies on HTTPS.
  - Rate limiting in production.
- Google's tokens stay on the server:
  - The access token (and a refresh token, though Google sends none without offline access) is encrypted before storage (`account.encryptOAuthTokens`).
  - The ID token isn't stored. Better Auth reads the user's identity from it during the callback, then a database hook sets `idToken` to `NULL` on every account create and update. The library's encryption option doesn't cover ID tokens.
  - The unused endpoints that would return tokens or use them to call Google (`/get-access-token`, `/refresh-token`, `/account-info`) are disabled with `disabledPaths` and answer 404.
- Better Auth telemetry is off.

### Exact local callback URI

```
http://localhost:3000/api/auth/callback/google
```

It must match `BETTER_AUTH_URL` plus `/api/auth/callback/google` exactly: same scheme, host, and port, with no trailing slash. Open the app at that same origin. `http://127.0.0.1:3000` is a different origin and will fail.

### Private setup steps (project owner)

Do these yourself. Don't paste any of the values into chats, issues, or commits.

1. **Google Cloud Console → Google Auth Platform.** Create or select a project, then configure the consent screen:
   - Branding: app name "Catering Concierge" and your support email.
   - Audience: **External**, publishing status **Testing**. Add your own Google account as a test user.
   - Data access: add no extra scopes. `openid`, `email`, and `profile` are requested by default.
2. **Create an OAuth client.** Under Clients → Create client, choose application type **Web application**.
   - Under **Authorized redirect URIs**, add exactly `http://localhost:3000/api/auth/callback/google`.
   - Authorized JavaScript origins aren't needed for this redirect flow.
3. **Add credentials to `.env.local`** (create it from `.env.example` if it doesn't exist; see [Database setup](#database-setup)). In your editor, replace the placeholders:
   - `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`: the values from the new client.
   - `BETTER_AUTH_URL="http://localhost:3000"`
   - `BETTER_AUTH_SECRET`: a fresh random value. Generate it in your own terminal, then paste it:

     ```powershell
     node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
     ```

4. **Apply the auth migration** to Neon development. This **changes the database**:

   ```powershell
   npx prisma migrate status
   npx prisma migrate deploy
   npx prisma migrate status
   ```

   `deploy` should apply only `20261106140237_add_better_auth`. The final `status` should report the schema is up to date.
5. **Test in a real browser** with `npm run dev`, or `npm run build` then `npm run start`, at `http://localhost:3000`:
   - The sidebar (or the mobile menu) shows **Sign in**, and `/sign-in` has an enabled **Continue with Google** button.
   - Sign in with your test account. You should land on the dashboard, with your name and email in the account panel.
   - Reload, then close and reopen the browser. You should still be signed in.
   - Sign out. You should land on `/sign-in` with "You've signed out.", and the panel should show **Sign in** again.
   - On a narrow window (mobile menu), sign out from the drawer, including while on `/sign-in`. The drawer should close, focus should return to the menu button, and the signed-out page should be visible.
   - Start sign-in and cancel at Google. `/sign-in` should say sign-in was cancelled.
   - Optional, in Neon's table view: one `User`, and one `Account` with `providerId` `google`, an unreadable (encrypted) `accessToken`, and an empty `idToken`. Also a `Session` row that disappears after sign-out.
   - Optional: while signed in, `POST /api/auth/get-access-token` (for example from the browser console with `fetch`) should answer 404.

For local development on Neon development, the project owner reports steps 1–4 complete and the step 5 checks listed in the verification note above passed. The optional items and the focus-return detail weren't reported. Any other environment remains unverified until it passes these steps.

## Restaurant setup

A signed-in user names their restaurant at `/setup` and becomes its owner. Each account can belong to **one** restaurant. There are no invitations, staff roles, restaurant switching, or renaming yet.

**Status: implemented, unverified live.**
- The membership migration (`20261106155051_add_restaurant_membership`) is prepared offline and **not applied**.
- Setup writes, the transaction, and the database constraints haven't run against a real database.
- Offline tests (`npm test`) cover the logic with a **mocked** database only.

**How it works:**
- **Finding it:** after sign-in, the account panel (sidebar and mobile drawer) shows **Set up your restaurant** until setup is done, then the restaurant's name. The name is shown only to its member.
- **Validation:** the setup form sends only a name. The server trims it, collapses whitespace, normalizes it to Unicode NFC, and accepts 1–100 characters with no control characters.
- **Identity:** the owner is always the verified session user (`getSessionUser()`). Any user ID, owner ID, restaurant ID, or role sent by the browser is ignored.
- **Atomic creation:** the restaurant and its `OWNER` membership are created in one interactive transaction. If the membership insert fails, the restaurant rolls back.
- **Repeated or concurrent submissions:**
  - The form disables its button while saving.
  - The server returns an existing restaurant instead of creating another.
  - The database's unique index on `RestaurantMembership.userId` makes a racing second request fail and roll back. The page then shows the existing restaurant ("already has a restaurant").
- **Errors** show a generic message and log only the error type and code, never raw database text.

**Authorization behavior** (`src/lib/restaurant-access.ts`, server-only):
- **The three states:** `getRestaurantAccess()` returns `unauthenticated` (signed out, or sign-in not configured), `needs-setup` (signed in, no membership), or `member` (with the restaurant).
- **Where the restaurant comes from:** only the session user's membership. It never reads a restaurant ID from a form, URL, header, or browser state, and there's no endpoint that looks up a restaurant by ID.
- **Failures:** database errors are thrown, never treated as access. The setup page and the account panel then show "unavailable" and offer neither the form nor a restaurant.
- **Caching:** results are shared only within one request (React `cache()`). Nothing is cached across requests or users, and no source file uses `"use cache"` (a test checks this).
- **For later inquiry work:** `requireRestaurant()` redirects to `/sign-in` or `/setup`, or returns the user and `restaurant.id` to scope queries.

### Private steps to verify restaurant setup (project owner)

1. **Apply the membership migration** to Neon development. This **changes the database**:

   ```powershell
   npx prisma migrate status
   npx prisma migrate deploy
   npx prisma migrate status
   ```

   `deploy` should apply only `20261106155051_add_restaurant_membership`. The final `status` should report the schema up to date.
2. **Test in a real browser** at `http://localhost:3000`, with `npm run dev`, or `npm run build` then `npm run start`:
   - **First visit:** sign in. The account panel should show "No restaurant set up yet" and **Set up your restaurant**, on desktop and in the mobile drawer. Following the link from the drawer should close the drawer.
   - **Validation:** on `/setup`, submit an empty name. You should get an error, and nothing is created.
   - **Save:** submit a name with extra spaces, such as `  Bistro   Example `. You should see "Restaurant saved. You're its owner.", with focus on **Your restaurant** and the trimmed name. The account panel should show the name.
   - **Persistence:** reload `/setup`. It should show your restaurant and no form.
   - **Repeat:** open `/setup` in a second tab *before* saving, save in the first tab, then submit in the second. It should say the account already has a restaurant.
   - **Double submit:** double-click **Save restaurant** on a fresh account if you can. Only one restaurant should result.
   - **Sign-out:** sign out. `/setup` should ask you to sign in, and no restaurant name should be visible.
   - **Second account (optional):** sign in with a second Google test account. It should need setup and never see the first account's restaurant name.
   - **Database check (optional):** in Neon's table view there should be one `RestaurantMembership` row per account that completed setup (role `OWNER`), and no `Restaurant` row without a membership.

Until these steps pass, treat setup writes, the transaction, the unique constraint, and restaurant display as unverified. A true simultaneous race may not be reproducible by hand. The database's unique index is the guarantee, and it's only proven once applied.

## Project structure

```
prisma/
  schema.prisma        Restaurant, Inquiry, auth, and RestaurantMembership models, plus enums
  migrations/          Version-controlled SQL migrations (init and auth applied to Neon development; membership pending)
prisma7.config.ts      Prisma CLI config: schema path, migrations path, DIRECT_URL, env loading
scripts/
  db-check.ts          Manual, read-only pooled-connection check (`npm run db:check`)
tests/
  auth.test.ts         Offline auth tests (`npm test`)
  restaurants.test.ts  Offline restaurant setup and scope tests (mocked database)
src/
  app/                 Routes (App Router). page.tsx is the dashboard.
    <module>/page.tsx  Placeholder pages for planned modules
    sign-in/page.tsx   Google sign-in, setup status, and sign-out
    setup/page.tsx     Restaurant setup (one restaurant per account)
    api/auth/[...all]/ Better Auth endpoints (Google sign-in and callback, session, sign-out)
  components/          App shell, navigation, and shared UI primitives
    auth/              Account panel, Google sign-in button, sign-out button
    restaurant/        Restaurant setup form
  generated/prisma/    Generated Prisma Client (git-ignored; created by `prisma generate`)
  lib/
    db.ts              Server-only, lazily created Prisma client with bounded timeouts (used by Better Auth, restaurant setup, and scripts/db-check.ts)
    auth.ts            Server-only Better Auth setup (lazy), session verification, /api/auth handler
    auth-config.ts     Server-only checks of the auth environment variables
    auth-actions.ts    Sign-out Server Action
    auth-client.ts     Browser client used only to start Google sign-in
    session.ts         getSessionUser() / requireSessionUser(): trusted identity for server code
    account-state.ts   Per-request account and restaurant status for the shell, sign-in, and setup pages
    restaurants.ts     Server-only restaurant name validation, membership lookup, and setup transaction
    restaurant-access.ts getRestaurantAccess() / requireRestaurant(): restaurant scope from the session
    restaurant-actions.ts Restaurant setup Server Action
    navigation.ts      Nav items and each module's status (preview / planned)
    demo-data.ts       Fictional sample inquiries (remove when real data exists)
```

## Current limitations

- Authentication is verified only locally, against Neon development (manual checks by the project owner).
  - Production and Railway authentication are untested.
  - Working sign-in doesn't establish write persistence for restaurant or inquiry data, which is untested.
- Restaurant setup is implemented but **unverified live**.
  - The membership migration (`20261106155051_add_restaurant_membership`) isn't applied, so setup writes, the transaction's rollback, and the one-restaurant-per-user unique constraint haven't run against a real database. Offline tests use a mocked database.
  - One restaurant per account, owner role only. No invitations, staff roles, switching, renaming, or deletion.
- No real inquiry data.
  - No page reads or writes inquiry records, and the dashboard still shows fictional demonstration data to every visitor, signed in or not.
  - The CLI's direct connection and the app's pooled connection are verified, but only with read-only counts (`npm run db:check`).
- Restaurant scope exists (`requireRestaurant()`), but nothing uses it for inquiries yet. Inquiry tenant isolation isn't implemented or tested.
- Sessions last 7 days from sign-in and aren't extended by activity. Server-side reads deliberately don't refresh them.
- No email, web form, or AI integration. Source labels in the pipeline are illustrative.
- Inquiries cannot be opened, created, edited, or moved between stages.
- Light theme only.
- Automated tests (`npm test`) cover the auth wiring and restaurant setup and scope, offline. Restaurant tests use a mocked database. Verification is otherwise lint plus a production build.
- `npm audit` reports moderate advisories in the ESLint/TypeScript-ESLint dev toolchain. They don't affect the runtime bundle.
- npm 11 holds back the install scripts of `prisma`, `@prisma/engines`, and `esbuild` (used by `tsx`) until you approve them (`npm approve-scripts`). Locally on Windows, the Prisma CLI and `tsx` work without them. Whether a Linux build environment such as Railway needs them hasn't been checked.

## Contributor and agent guidance

- [`CLAUDE.md`](CLAUDE.md): conventions, scope control, security, and verification rules
- [`AGENTS.md`](AGENTS.md): shared requirements and read-only review instructions
- [`PROMPT-HISTORY.md`](PROMPT-HISTORY.md): log of implementation tasks and outcomes
