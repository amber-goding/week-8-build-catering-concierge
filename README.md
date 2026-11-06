# Catering Concierge

Catering Concierge is a catering management product for independent restaurants. The goal is to capture catering inquiries from a connected inbox, web forms, and manual entry, then help staff move each one from first contact to a confirmed event.

> **Status: a deployed demonstration on Railway that uses the Neon development branch. It isn't a production-ready restaurant service.** Google sign-in, restaurant setup, a Zapier pilot import, and a read-only, restaurant-scoped `/inquiries` review screen work. The dashboard runs on **fictional demonstration data**.
>
> **Post-demo checkpoint (2026-11-06):**
> - **Reported by the project owner:**
>   - All four migrations are applied to Neon development. The project owner's pasted local PowerShell output shows `npm run db:deploy` applying `20261106165710_add_zapier_inquiry_import`, followed by `prisma migrate status` reporting the schema up to date.
>   - `main` was pushed to GitHub at commit `a3e7f0b`.
>   - The app was deployed on Railway, using the Neon development database.
>   - Google sign-in was configured for the Railway domain.
>   - The updated five-step Zap was published (see [The published Zap](#the-published-zap)).
> - **Observed by Codex in the browser:**
>   - The deployed `/api/health` returned `{"status":"ok"}`.
>   - The signed-in `/inquiries` page displayed "Catering Concierge Demo".
>   - A Zapier action test returned 201 `created`, and repeating that delivery returned 200 `duplicate` with the same inquiry ID.
>   - The fictional Avery, Morgan, and Kendra inquiries appeared in the deployed app with their AI reviews. Kendra's appeared after a later delay whose cause hasn't been confirmed.
>
> **Earlier verification:**
> - The Prisma CLI's direct connection and the app's **pooled** connection through `getPrisma()` are verified against Neon development (`npm run db:check`, 2026-11-06).
> - **Google sign-in, sessions, and sign-out work locally against Neon development** (manual checks by the project owner, 2026-11-06). See [Authentication setup](#authentication-setup).
> - **Restaurant setup:** the project owner created a restaurant named "Catering Concierge Demo" and saw it displayed. The other restaurant browser checks haven't been reported. See [Restaurant setup](#restaurant-setup).
>
> **Not tested live:** isolation between two restaurant accounts, concurrent deliveries of the same Zapier record, and the restaurant-setup checks beyond the first save. See [Current limitations](#current-limitations).
>
> No email account is connected, and the app itself makes no AI calls. AI processing happens in Zapier.

## What exists today

| Area | State |
| --- | --- |
| App shell (sidebar, mobile drawer, routing) | Working |
| Dashboard summary cards | Demo only. Counts are derived from the fictional sample dataset |
| Inquiry pipeline preview | Demo only. Read-only fictional inquiries |
| Demonstration-mode indicator | Shown on every page |
| Google sign-in, sessions, and sign-out (Better Auth) | Working locally against Neon development (manual checks by the project owner). On the Railway demonstration, sign-in was configured (reported by the project owner) and a signed-in session was observed by Codex. The full local checks weren't repeated there. No production environment exists. Without configuration, the shell says "Sign-in not set up" and the sign-in button is disabled |
| Sign-in page (`/sign-in`) and account panel (sidebar and mobile drawer) | Working. Show setup status, the signed-in name and email, and sign-out. The panel also shows the member's restaurant name, or a link to set one up (the restaurant name display was reported by the project owner; the other panel states are unverified live) |
| Restaurant setup (`/setup`) and owner membership | Migration applied to Neon development, and one restaurant was created and displayed (reported by the project owner). Other checks not reported. Offline tests use a mocked database |
| Inquiries (`/inquiries`) | **Limited pilot, working on the Railway demonstration.** A read-only, restaurant-scoped list of inquiries imported through the Zapier pilot, showing the original request and the AI review. Codex observed it signed in, showing "Catering Concierge Demo" and the fictional Avery, Morgan, and Kendra inquiries with their AI reviews. Isolation between two accounts hasn't been tested live |
| Zapier import endpoint (`POST /api/integrations/zapier/inquiries`) | **Working for the pilot on the Railway demonstration.** One restaurant and one table, a bearer token, and a fixed server-side scope. Codex observed a Zapier action test return 201 `created`, and a repeat return 200 `duplicate` with the same inquiry ID. Concurrent deliveries are covered only by offline tests (mocked database) |
| Health endpoint (`GET /api/health`) | Working. Codex observed `{"status":"ok"}` on the deployed app. Reports process health only (no database or configuration) |
| Email, Menu, Quotes, Events, Settings | Routes exist and show planned scope. **No functionality** |
| Database layer (Prisma 7 + Neon) | All four migrations are applied to Neon development, including the import migration `20261106165710_add_zapier_inquiry_import` (reported by the project owner). The CLI's direct connection and the app's pooled connection (`getPrisma()`, read-only counts) are verified. Only restaurant setup writes `Restaurant` rows, and only the Zapier import writes `Inquiry` rows. Codex observed imported inquiries persisting and displaying on the Railway demonstration. The deployment shares this development branch with local development; there's no production database |

The dashboard's sample records (fixtures) live in [`src/lib/demo-data.ts`](src/lib/demo-data.ts). They use the "Example" surname and contain no pricing or revenue figures. The only other demonstration data comes from the approved Zapier pilot: its inquiries are also fictional, but they're stored in the database with `isDemo: true` and shown on `/inquiries` with a visible "Demonstration data" label.

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
- Database: [Prisma ORM](https://www.prisma.io) 7.10 with the Neon driver adapter, for Neon PostgreSQL. The schema is applied to the development branch. The app uses it for sign-in and sessions, restaurant setup, and the Zapier pilot's inquiries.
- Authentication: [Better Auth](https://www.better-auth.com) 1.7 (Google only), through its Prisma adapter

Deployment: a Railway demonstration that uses the Neon development branch (reported by the project owner; see [Deploying to Railway](#deploying-to-railway-demonstration)). Planned for later stages: the Gmail API with OAuth. The app has no AI integration of its own: the pilot's AI review is produced inside Zapier.

## Getting started

Requirements: **Node.js 24** and npm. `package.json` (`engines.node: "24.x"`), `.nvmrc`, and the Railway setup all use Node 24. Prisma 7 needs Node 20.19+, and Neon's driver needs the built-in WebSocket from Node 22 onward.

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
npm run db:deploy  # prisma migrate deploy: CHANGES the database (DIRECT_URL). Railway's pre-deploy command
npm test           # Offline tests: auth, restaurant setup, Zapier import, inquiry reads (no database, network, or credentials)
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
| `ZAPIER_IMPORT_TOKEN` | Zapier pilot import ([`src/lib/zapier-import.ts`](src/lib/zapier-import.ts)) | Bearer token the Zap sends, from its API by Zapier connection. At least 32 random characters |
| `ZAPIER_RESTAURANT_ID` | Zapier pilot import | The one destination restaurant's ID (UUID) |
| `ZAPIER_TABLE_ID` | Zapier pilot import | The one Zapier Tables table imports come from |

All of these are server-only. None uses the `NEXT_PUBLIC_` prefix, and the browser only ever learns whether sign-in is configured.

Next.js loads `.env*` files itself. Prisma 7 doesn't, so `prisma7.config.ts` uses `@next/env` to load them with the same precedence as Next.js: `process.env`, then `.env.$(NODE_ENV).local`, `.env.local`, `.env.$(NODE_ENV)`, `.env`.

## Database setup

These steps connect the code to a Neon database. They're written for PowerShell, from the repository root.

> **Neon development status (reported by the project owner, 2026-11-06):**
> - Against the Neon **development** branch, `DATABASE_URL` and `DIRECT_URL` were added privately to `.env.local`, and `npx prisma migrate status` ran successfully.
> - `npx prisma migrate deploy` applied `20261106081912_init`, and a follow-up `npx prisma migrate status` reported "Database schema is up to date!".
> - This verifies the CLI's **direct** connection (`DIRECT_URL`).
> - The app's **pooled** connection (`DATABASE_URL`) through `getPrisma()` was later verified with `npm run db:check` (read-only counts, both tables returned 0 rows).
> - The Railway demonstration uses this same development branch. There's no production database.
> - The second migration, `20261106140237_add_better_auth`, was later applied to the same development branch, and `npx prisma migrate status` again reported the schema up to date.
> - The third migration, `20261106155051_add_restaurant_membership`, was later applied as well. A restaurant named "Catering Concierge Demo" was created through `/setup` and displayed in the app.
> - The fourth migration, `20261106165710_add_zapier_inquiry_import`, was later applied locally. The project owner pasted the PowerShell output: `npm run db:deploy` applied it, and `prisma migrate status` then reported the schema up to date. All four migrations are now applied on Neon development.
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
   - `20261106165710_add_zapier_inquiry_import`: the import columns on `Inquiry` and their unique index.

   All four are already applied on Neon development (reported by the project owner), so nothing is pending there. `npm run db:deploy` runs the same command:

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
  - Import fields (migration `20261106165710_add_zapier_inquiry_import`, applied to Neon development):
    - `inquiryMessage`: the original text.
    - `aiReview`: untrusted AI text that needs human review.
    - `zapierTableId` and `zapierRecordId`: for duplicate prevention.
    - `isDemo`: defaults to `false`; the server sets it to `true` for every pilot import.

    Imports store `source = MANUAL` (Zapier is only the transport). Nothing is extracted from the AI text into the detail fields.
  - Indexes on `(restaurantId, stage, createdAt)`, `(restaurantId, createdAt)`, and `(restaurantId, eventDate)`.
  - **Unique** on `(restaurantId, zapierTableId, zapierRecordId)`, so each imported record exists once per restaurant. Rows without Zapier IDs never conflict.
  - Deleting a restaurant that still has inquiries is **blocked** (`ON DELETE RESTRICT`).
  - IDs are UUIDv7 values generated by Prisma Client, not database defaults. Rows inserted outside Prisma must supply their own `id`.
- **Authentication** (Better Auth's core schema, with the same UUIDv7 IDs):
  - **User**: `name`, unique `email`, `emailVerified`, optional `image`, timestamps.
  - **Session**: unique `token`, `expiresAt`, optional `ipAddress` and `userAgent`, `userId` (indexed).
  - **Account**: `providerId` (`google`), `accountId` (Google's subject ID), `userId` (indexed), optional token fields, and `scope`. Better Auth encrypts `accessToken` and `refreshToken`. `idToken` stays `NULL`, because the app clears it before every write. `password` exists in the core schema but stays unused, because email/password sign-in is off.
  - **Verification**: `identifier` (indexed), `value`, `expiresAt`. Holds short-lived OAuth sign-in state.
  - Deleting a user deletes their sessions and accounts (`ON DELETE CASCADE`). A user reaches a restaurant only through `RestaurantMembership`.
- **RestaurantMembership** (applied to Neon development, reported by the project owner):
  - `id` (UUIDv7), `userId`, `restaurantId`, `role`, timestamps.
  - `role` is the `RestaurantRole` enum, which has one value, `OWNER`.
  - `userId` is **unique**: each user belongs to at most one restaurant, enforced by the database.
  - Indexed on `restaurantId`.
  - Deleting a user or a restaurant that still has a membership is **blocked** (`ON DELETE RESTRICT`).
  - Keyed by user ID, never by email address.

> **Ownership isn't authorization.** `restaurantId` records which restaurant owns an inquiry. It doesn't control who can see or change it. Before any database-backed page, route, or action is exposed, the app needs authentication, authenticated restaurant selection, and restaurant-scoped queries. **Authentication works locally (Neon development), and a signed-in session was observed on the Railway demonstration.**
>
> - **Restaurant scope:** `getRestaurantAccess()` / `requireRestaurant()` in [`src/lib/restaurant-access.ts`](src/lib/restaurant-access.ts) resolve the signed-in user's restaurant through their membership.
> - **Browser reads require membership.** `/inquiries` filters every query by the restaurant ID from `requireRestaurant()`. Offline tests cover the query shape, and one member's view was observed live (Codex). Isolation between two restaurant accounts hasn't been tested live.
> - **Machine imports have a fixed server-side scope.** The Zapier endpoint authenticates with a bearer token and writes only to the restaurant and table in its server configuration. The request can't choose a restaurant. This is an approved exception for one pilot integration, not a general multi-tenant credential system.
> - **Database-backed routes today:**
>   - Better Auth's `/api/auth/*` and server-side session reads.
>   - Restaurant setup, for the user's own records.
>   - `/inquiries`, for the member's restaurant.
>   - The Zapier import, for the configured restaurant.

## Authentication setup

Sign-in is **Google only**, through [Better Auth](https://www.better-auth.com).

> **Local verification (reported by the project owner, 2026-11-06):**
> - Applied `20261106140237_add_better_auth` to Neon development. `npx prisma migrate status` reported the schema up to date.
> - Configured the Google OAuth client, its credentials, and `BETTER_AUTH_SECRET` privately.
> - Passed these manual browser checks: sign-in with a real Google account; staying signed in after a reload and after a browser restart; sign-out on desktop, from the mobile drawer, and from the drawer while already on `/sign-in`; and cancelling at Google, going back, and retrying.
> - **Not reported, so not verified:** the optional Neon table inspection (encrypted `accessToken`, empty `idToken`) and a direct request to the disabled token endpoints. Offline tests (`npm test`) cover those instead.
> - Focus return and screen-reader announcements weren't separately reported.
> - **Railway demonstration:** the project owner reports configuring Google sign-in for the Railway domain, and Codex observed a signed-in `/inquiries` page on the deployed app. The checks above weren't repeated on Railway, and the session cookie's `Secure` flag wasn't inspected.
> - There's no production environment. Repeat the steps below, with that environment's origin and callback URI, for any new environment.

**What signing in does:**
- Requests only Google's identity scopes: `openid`, `email`, and `profile`. No Gmail access, and no offline access (Google issues no refresh token).
- Creates a database session in a signed, httpOnly cookie. It lasts 7 days from sign-in and isn't extended by page views.
- **Grants access only to your own restaurant.** Signing in lets you set up one restaurant (see [Restaurant setup](#restaurant-setup)) and read its imported pilot inquiries at `/inquiries`, which are fictional demonstration records. The dashboard and the planned-module pages stay viewable without signing in.

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

For local development on Neon development, the project owner reports steps 1–4 complete and the step 5 checks listed in the verification note above passed. The optional items and the focus-return detail weren't reported. On the Railway demonstration, only a signed-in session has been observed. Repeat these checks there for full coverage.

## Restaurant setup

A signed-in user names their restaurant at `/setup` and becomes its owner. Each account can belong to **one** restaurant. There are no invitations, staff roles, restaurant switching, or renaming yet.

**Status (reported by the project owner):**
- The membership migration (`20261106155051_add_restaurant_membership`) is applied to Neon development.
- A restaurant named "Catering Concierge Demo" was created and is displayed in the app.
- The remaining browser checks below haven't been reported, so the repeat and concurrent submissions, validation messages, focus, and second-account behavior are still unverified live.
- Offline tests (`npm test`) cover the logic with a **mocked** database.

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

Step 1 and the first save are reported done. Until the rest pass, treat the repeat and concurrent paths, the transaction rollback, and the unique constraint as unverified live. A true simultaneous race may not be reproducible by hand. The database's unique index is the guarantee.

## Zapier pilot import

**Status: working on the Railway demonstration, for one restaurant and one table.**
- **Reported by the project owner:** the import migration (`20261106165710_add_zapier_inquiry_import`) is applied to Neon development (local `npm run db:deploy`, per the owner's pasted terminal output), and the updated five-step Zap ([below](#the-published-zap)) is published.
- **Observed by Codex in the browser:**
  - A Zapier action test returned 201 `created`.
  - Repeating that delivery returned 200 `duplicate` with the same inquiry ID.
  - The fictional Avery, Morgan, and Kendra inquiries appeared on the deployed `/inquiries` with their AI reviews. Kendra's appeared after a later delay whose cause hasn't been confirmed.
- **Not tested live:** concurrent deliveries of the same record, isolation between two restaurant accounts, and token rotation. Offline tests (`npm test`) cover the endpoint with a **mocked** database.

**What it is:** a published Zap holds **fictional** inquiries in Zapier Tables, has AI by Zapier review each one, and posts the record to the app. The app stores it for **one** configured restaurant, always marked as demonstration data, and the owner reads it at `/inquiries`. All AI processing happens in Zapier. The app never calls AI itself.

### Endpoint: `POST /api/integrations/zapier/inquiries`

**Request:**
- `Authorization: Bearer <ZAPIER_IMPORT_TOKEN>`
- `Content-Type: application/json`
- A JSON body of at most 128 KiB, with **exactly** these three fields:

  | Field | Rules |
  | --- | --- |
  | `recordId` | The Zapier Tables record ID. 1–128 printable characters, no spaces |
  | `inquiryMessage` | The original inquiry text. 1–10,000 characters |
  | `aiReview` | The AI review text. 1–20,000 characters |

- Text is trimmed and line endings are normalized to `\n`. Control characters other than tabs and line breaks are refused.
- Any other field is refused with 400, including `restaurantId`, `isDemo`, `zapierTableId`, and `source`.

**Server-side behavior:**
- The destination restaurant (`ZAPIER_RESTAURANT_ID`) and table (`ZAPIER_TABLE_ID`) come from server configuration.
- Every import is stored with `isDemo = true` and `source = MANUAL`.

**Order of checks:** configuration → token (timing-safe comparison of SHA-256 digests) → content type → size (enforced while reading) → payload → database. A bad token never reaches the body or the database.

**Duplicates:** a retry or a concurrent second delivery of the same `recordId` returns the existing inquiry. It never creates another row and never overwrites the stored text. The unique index on `(restaurantId, zapierTableId, zapierRecordId)` settles races.

| Situation | Status | Body |
| --- | --- | --- |
| Imported | 201 | `{"status":"created","inquiryId":"…"}` |
| Already imported (retry or race) | 200 | `{"status":"duplicate","inquiryId":"…"}` |
| Malformed JSON or invalid UTF-8 | 400 | `{"error":"invalid_json"}` |
| Wrong or missing fields | 400 | `{"error":"invalid_payload","problems":[…]}` (field names only, never values) |
| Missing or wrong token | 401 | `{"error":"unauthorized"}` |
| Body over 128 KiB | 413 | `{"error":"payload_too_large"}` |
| Not `application/json` | 415 | `{"error":"unsupported_media_type"}` |
| Not configured, or the configured restaurant doesn't exist | 503 | `{"error":"import_unavailable"}` |
| Database failure | 500 | `{"error":"import_failed"}` |

**Responses and logs:**
- Responses never contain record contents or credentials, and always send `Cache-Control: no-store`.
- No CORS headers are sent: browsers on other origins can't call the endpoint.
- Logs record only error types and codes, never headers, bodies, tokens, or raw database errors.

### Review screen: `/inquiries`

**Access:**
- Signed-out visitors are redirected to `/sign-in`, and users without a restaurant to `/setup`.
- Members see their own restaurant's inquiries, newest first (the latest 50). Every query is filtered by the restaurant ID from `requireRestaurant()`. Nothing in the URL or request can change it.

**Each inquiry shows:**
- The received time, in UTC.
- A **Demonstration data** label.
- The original request.
- The AI review, labelled **AI-generated — requires human review**.

Both texts render as plain text with their line breaks kept.

**Controls:**
- **Refresh** re-renders the list.
- There are no approve, send, edit, quote, or booking controls.

The dashboard stays a separate, fictional pipeline preview.

### The published Zap

The project owner reports this five-step Zap is published:

1. **Zapier Tables — New Record:** triggers on each new fictional inquiry in the pilot table.
2. **AI by Zapier — Analyze and Return Data:** produces the AI review.
3. **Zapier Tables — Update Record:** writes only the AI review back to the table.
4. **Code by Zapier — Run Javascript:** packages `recordId` (the Tables record ID), `inquiryMessage` (the inquiry text), and `aiReview` (the AI step's output) into the request body with `JSON.stringify`, so quotes and line breaks are escaped correctly.
5. **API by Zapier — authenticated POST** to `https://<railway-domain>/api/integrations/zapier/inquiries`, with `Content-Type: application/json` and step 4's JSON as the body. Zapier's servers can't reach `localhost`.

**Where the token lives in Zapier:** the bearer token is stored in the API by Zapier **authentication connection**, as a static `Authorization: Bearer <ZAPIER_IMPORT_TOKEN>` header. Zapier adds that header to each request. The token isn't typed into the action's ordinary fields (URL, headers, or body), so it doesn't appear in the step's mapped data.

### Private setup and maintenance (project owner)

1. **For a new environment, apply the import migration first** (`npx prisma migrate deploy`, or Railway's pre-deploy command). It's already applied on Neon development.
2. **Find the two IDs:**
   - `ZAPIER_RESTAURANT_ID`: the `id` of the "Catering Concierge Demo" row in the `Restaurant` table, for example in Neon's table view. Read it; don't edit anything.
   - `ZAPIER_TABLE_ID`: the ID of the Zapier table the Zap watches, as shown in Zapier Tables (for example in the table's URL).
3. **Generate the token privately:** `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`. Store it in `.env.local` or Railway variables, and in the API by Zapier authentication connection (as the static `Authorization: Bearer …` header). Nowhere else, and not in the action's ordinary fields.
4. **Set** `ZAPIER_IMPORT_TOKEN`, `ZAPIER_RESTAURANT_ID`, and `ZAPIER_TABLE_ID` where the app runs, then restart or redeploy it.
5. **Test the API step in Zapier.** The first delivery of a record should return 201 `created`, and a repeat 200 `duplicate` with the same inquiry ID. Then open `/inquiries` as the restaurant owner, press **Refresh**, and check the labels and the line breaks.
6. **Rotating the token:** update the API by Zapier authentication connection's header and the application environment (Railway variables, or `.env.local`) together, then redeploy or restart the app. Until both match, imports get 401.

## Deploying to Railway (demonstration)

**Status:** the project owner reports the app is deployed on Railway as a clearly labelled **demonstration** that uses the existing **Neon development branch**, with Google sign-in configured for the Railway domain. Codex observed the deployed `/api/health` return `{"status":"ok"}`. This is **not** a production database or a production-ready restaurant service. The local app and the deployed app share the same data.

**What's prepared in the repository:**
- **Node 24:** `engines.node` is `"24.x"` and `.nvmrc` is `24`. Also set `RAILPACK_NODE_VERSION=24`, the variable Railpack checks first.
- **Build:** Railpack (Railway's default builder) runs `npm ci`, whose `postinstall` runs `prisma generate`, and then `npm run build`, which is `prisma generate && next build`. The build needs no database or secrets.
- **Start:** `npm run start`, which is `next start`. It listens on Railway's injected `PORT` and binds `0.0.0.0` by default (per the bundled Next.js CLI docs).
- **Migrations:** these are kept out of the build. `npm run db:deploy` (`prisma migrate deploy`) is the pre-deploy command. `prisma` and `@next/env` (which `prisma7.config.ts` uses) are in `dependencies`, so they're installed in the image even if dev dependencies are pruned.
- **Health:** `GET /api/health` returns `{"status":"ok"}`. It doesn't query the database or report configuration.
- **No extra infrastructure:** no Dockerfile and no standalone output. No `railway.json` either: Railway's docs mark config-as-code as deprecated (legacy files stop being read on 2026-12-01, and new services can't opt in). The settings below are entered in the Railway dashboard.

### Steps (project owner)

These are the steps for setting up the deployment, kept as a reference for a new environment.

1. **Create the service.** In Railway, create a project and a service from the GitHub repository and branch. Keep the default builder (Railpack).
2. **Generate a domain.** Under Settings → Networking → Public Networking, choose **Generate Domain**, and note it (`<name>.up.railway.app`).
3. **Add the variables** (Variables tab). Don't set `PORT`, which Railway injects, and never use a `NEXT_PUBLIC_` prefix.

   | Variable | Value |
   | --- | --- |
   | `RAILPACK_NODE_VERSION` | `24` |
   | `DATABASE_URL` | Neon **development** pooled connection string |
   | `DIRECT_URL` | Neon **development** direct connection string, used by the pre-deploy migration |
   | `BETTER_AUTH_SECRET` | A new random value for this deployment, at least 32 characters |
   | `BETTER_AUTH_URL` | `https://<name>.up.railway.app`, the exact domain with no trailing slash |
   | `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | The OAuth client's values |
   | `ZAPIER_IMPORT_TOKEN` / `ZAPIER_RESTAURANT_ID` / `ZAPIER_TABLE_ID` | See [Zapier pilot import](#zapier-pilot-import) |

4. **Fill in the deploy settings.** Leave the build and start commands at their defaults (`npm run build` and `npm run start`).
   - **Pre-deploy command:** `npm run db:deploy`. It runs between build and deploy with the service's variables, and a failure stops the deploy.
   - **Healthcheck path:** `/api/health`.
5. **Update Google Cloud.** In the OAuth client, add the authorized redirect URI `https://<name>.up.railway.app/api/auth/callback/google`, and keep the localhost one for local development. In Testing mode, only listed test users can sign in.
6. **Deploy.** Then check:
   - `https://<name>.up.railway.app/api/health` returns `{"status":"ok"}`.
   - Sign-in, the restaurant panel, `/inquiries`, and sign-out all work on the Railway domain.
   - The browser's session cookie is `Secure` (Better Auth sets it automatically because `BETTER_AUTH_URL` is HTTPS).

**Security notes:**
- The deployed instance trusts only its own HTTPS origin, so `localhost` isn't a trusted origin there.
- Next.js still checks every Server Action's Origin header.

**Not verified for Railway:**
- Railway's pre-deploy command (`npm run db:deploy`) running on Railway. The import migration was applied locally (per the project owner's pasted terminal output), so Railway's own migration run hasn't been shown. When it runs there, `prisma migrate deploy` needs Prisma's schema engine for Linux, which the Prisma CLI normally fetches when it's missing.
- Healthcheck timing during deploys.
- The session cookie's `Secure` flag behind Railway's proxy.
- Sign-out, the mobile drawer, and the other local sign-in checks on the Railway domain.

## Project structure

```
prisma/
  schema.prisma        Restaurant, Inquiry, auth, and RestaurantMembership models, plus enums
  migrations/          Version-controlled SQL migrations (all four applied to Neon development)
prisma7.config.ts      Prisma CLI config: schema path, migrations path, DIRECT_URL, env loading
.nvmrc                 Node 24, matching engines.node
scripts/
  db-check.ts          Manual, read-only pooled-connection check (`npm run db:check`)
tests/
  auth.test.ts         Offline auth tests (`npm test`)
  restaurants.test.ts  Offline restaurant setup and scope tests (mocked database)
  zapier-import.test.ts Offline import endpoint and inquiry read tests (mocked database)
src/
  app/                 Routes (App Router). page.tsx is the dashboard.
    <module>/page.tsx  Placeholder pages for planned modules
    sign-in/page.tsx   Google sign-in, setup status, and sign-out
    setup/page.tsx     Restaurant setup (one restaurant per account)
    inquiries/page.tsx Read-only, restaurant-scoped review of imported inquiries
    api/health/        Process health for Railway (no database)
    api/integrations/zapier/inquiries/  Zapier pilot import (bearer token, fixed restaurant)
    api/auth/[...all]/ Better Auth endpoints (Google sign-in and callback, session, sign-out)
  components/          App shell, navigation, and shared UI primitives
    auth/              Account panel, Google sign-in button, sign-out button
    restaurant/        Restaurant setup form
    inquiries/         Inquiry review card and Refresh button
  generated/prisma/    Generated Prisma Client (git-ignored; created by `prisma generate`)
  lib/
    db.ts              Server-only, lazily created Prisma client with bounded timeouts (Better Auth, restaurant setup, inquiries, Zapier import, db-check)
    auth.ts            Server-only Better Auth setup (lazy), session verification, /api/auth handler
    auth-config.ts     Server-only checks of the auth environment variables
    auth-actions.ts    Sign-out Server Action
    auth-client.ts     Browser client used only to start Google sign-in
    session.ts         getSessionUser() / requireSessionUser(): trusted identity for server code
    account-state.ts   Per-request account and restaurant status for the shell, sign-in, and setup pages
    restaurants.ts     Server-only restaurant name validation, membership lookup, and setup transaction
    restaurant-access.ts getRestaurantAccess() / requireRestaurant(): restaurant scope from the session
    restaurant-actions.ts Restaurant setup Server Action
    zapier-import.ts   Server-only Zapier import: config, token check, size limit, validation, idempotent insert
    inquiries.ts       Server-only restaurant-scoped inquiry reads and timestamp formatting
    navigation.ts      Nav items and each module's status (preview / limited / planned)
    demo-data.ts       Fictional dashboard fixtures (remove when real data exists)
```

## Current limitations

- **A deployed demonstration, not production.** The Railway app uses the Neon **development** branch, shared with local development. It isn't a production-ready restaurant service, and there's no production database.
- **Authentication:** verified locally against Neon development (manual checks by the project owner). On Railway, sign-in was configured (reported by the project owner) and a signed-in session was observed (Codex). The full set of sign-in checks wasn't repeated there.
- Restaurant setup is partly verified live: the project owner applied its migration and created one restaurant. The repeat and concurrent paths, the transaction rollback, the unique constraint, and second-account isolation haven't been reported. One restaurant per account, owner role only. No invitations, staff roles, switching, renaming, or deletion.
- **Pilot scope:** imports come from one configured restaurant and one table, with one shared token, and are always marked as fictional demonstration data. It isn't a general multi-tenant integration.
- **Inquiry viewing only.** Manual inquiry entry, editing, approving, quotes, sending, bookings, and moving between stages aren't built. Nothing is extracted from inquiries or AI reviews: no dates, names, counts, prices, or statuses.
- **Not tested live:** isolation between two restaurant accounts on `/inquiries`, and concurrent deliveries of the same Zapier record. Offline tests cover both with a mocked database.
- **Delivery timing:** Kendra's inquiry appeared after a later delay than the others. The cause hasn't been confirmed, so delivery timing isn't characterized.
- The dashboard pipeline is separate, fictional sample data, shown to every visitor.
- Sessions last 7 days from sign-in and aren't extended by activity. Server-side reads deliberately don't refresh them.
- No Gmail, email, or web form integration. The app itself makes no AI calls: AI processing happens in Zapier. Source labels in the dashboard pipeline are illustrative.
- Light theme only.
- Automated tests (`npm test`) cover the auth wiring, restaurant setup and scope, the Zapier import, and inquiry reads, offline. Restaurant and import tests use a mocked database. Verification is otherwise lint plus a production build.
- `npm audit` reports moderate advisories in the ESLint/TypeScript-ESLint dev toolchain. They don't affect the runtime bundle.
- npm 11 holds back the install scripts of `prisma`, `@prisma/engines`, and `esbuild` (used by `tsx`) until you approve them (`npm approve-scripts`). Locally on Windows, the Prisma CLI and `tsx` work without them. The Railway deployment works (reported by the project owner), but its build logs weren't reviewed for this, so whether Railway's Linux build needed them is unknown (see [Deploying to Railway](#deploying-to-railway-demonstration)).

## Contributor and agent guidance

- [`CLAUDE.md`](CLAUDE.md): conventions, scope control, security, and verification rules
- [`AGENTS.md`](AGENTS.md): shared requirements and read-only review instructions
- [`PROMPT-HISTORY.md`](PROMPT-HISTORY.md): log of implementation tasks and outcomes
