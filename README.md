# Catering Concierge

Catering Concierge is a catering management product for independent restaurants. The goal is to capture catering inquiries from a connected inbox, web forms, and manual entry, then help staff move each one from first contact to a confirmed event.

> **Status: foundation plus database schema applied to Neon development.** The UI is a responsive dashboard shell running on **fictional demonstration data**. The Prisma schema and server-only client are in place.
>
> - The initial migration has been applied to the Neon development branch, and the Prisma CLI's direct connection is verified.
> - **The app's pooled connection and `getPrisma()` are untested.**
> - **No page reads or writes database records.**
> - No email account or AI service is connected.

## What exists today

| Area | State |
| --- | --- |
| App shell (sidebar, mobile drawer, routing) | Working |
| Dashboard summary cards | Demo only. Counts are derived from the fictional sample dataset |
| Inquiry pipeline preview | Demo only. Read-only fictional inquiries |
| Demonstration-mode indicator | Shown on every page |
| Inquiries, Email, Menu, Quotes, Events, Settings | Routes exist and show planned scope. **No functionality** |
| Database layer (Prisma 7 + Neon) | Schema migrated to Neon development, and the CLI's direct connection is verified. The app's pooled connection and `getPrisma()` are **untested**. No page reads or writes records |

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
- Database: [Prisma ORM](https://www.prisma.io) 7.10 with the Neon driver adapter, for Neon PostgreSQL. The schema is applied to the development branch, but the app doesn't use it yet.

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
```

The app runs and builds **without any environment variables**, because no page uses the database yet. [`.env.example`](.env.example) lists the variables the database layer uses, with placeholders only. Real values belong in `.env.local`, which git ignores.

| Variable | Used by | Neon connection |
| --- | --- | --- |
| `DATABASE_URL` | The app at runtime ([`src/lib/db.ts`](src/lib/db.ts)) | Pooled (host contains `-pooler`) |
| `DIRECT_URL` | Prisma CLI: migrations and Studio ([`prisma7.config.ts`](prisma7.config.ts)) | Direct (unpooled) |

Next.js loads `.env*` files itself. Prisma 7 doesn't, so `prisma7.config.ts` uses `@next/env` to load them with the same precedence as Next.js: `process.env`, then `.env.$(NODE_ENV).local`, `.env.local`, `.env.$(NODE_ENV)`, `.env`.

## Database setup

These steps connect the code to a Neon database. They're written for PowerShell, from the repository root.

> **Neon development status (reported by the project owner, 2026-11-06):**
> - Against the Neon **development** branch, `DATABASE_URL` and `DIRECT_URL` were added privately to `.env.local`, and `npx prisma migrate status` ran successfully.
> - `npx prisma migrate deploy` applied `20261106081912_init`, and a follow-up `npx prisma migrate status` reported "Database schema is up to date!".
> - This verifies the CLI's **direct** connection (`DIRECT_URL`) only. The app's **pooled** connection (`DATABASE_URL`) and `getPrisma()` haven't been exercised.
> - No other environment (production, Railway) has been set up.
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

5. Apply the committed migration. This **changes the database**: it creates the enums, tables, indexes, and foreign key in `prisma/migrations/`:

   ```powershell
   npx prisma migrate deploy
   ```

For later schema changes, edit `prisma/schema.prisma` and run `npx prisma migrate dev --name <short-description>` against a development database. `migrate dev` uses a temporary shadow database. If the database role can't create databases, set `shadowDatabaseUrl` in `prisma7.config.ts`.

Other offline commands (no database connection needed):

```powershell
npx prisma validate    # check the schema
npx prisma generate    # regenerate the client after schema changes
```

> **Prisma version note:** the `prisma` package's npm `latest` tag currently points to a Prisma 8 **release candidate**. This project pins Prisma 7 (`^7.10.1`) for `prisma`, `@prisma/client`, and `@prisma/adapter-neon`. Ignore the CLI's "update available" banner, and don't run `npm i prisma@latest`. Upgrade all three packages together, deliberately.

### Data model

- **Restaurant**: `id` (UUIDv7), `name`, timestamps.
- **Inquiry**:
  - `id`, a required `restaurantId`, timestamps.
  - `source`: `MANUAL`, `EMAIL`, or `WEB_FORM`.
  - `stage`: `NEW`, `NEEDS_DETAILS`, `QUOTING`, `AWAITING_CLIENT`, or `CONFIRMED`. Defaults to `NEW`, matching the demo pipeline.
  - Optional details: `eventName`, `contactName`, `contactEmail`, `eventDate` (PostgreSQL `DATE`), `guestCount`, `notes`.
  - Indexes on `(restaurantId, stage, createdAt)`, `(restaurantId, createdAt)`, and `(restaurantId, eventDate)`.
  - Deleting a restaurant that still has inquiries is **blocked** (`ON DELETE RESTRICT`).
  - IDs are UUIDv7 values generated by Prisma Client, not database defaults. Rows inserted outside Prisma must supply their own `id`.

> **Ownership isn't authorization.** `restaurantId` records which restaurant owns an inquiry. It doesn't control who can see or change it. Before any database-backed page, route, or action is exposed, the app needs authentication, authenticated restaurant selection, and restaurant-scoped queries. **None of this exists yet, and tenant isolation isn't implemented.**

## Project structure

```
prisma/
  schema.prisma        Restaurant and Inquiry models, plus enums
  migrations/          Version-controlled SQL migrations (init applied to Neon development only)
prisma7.config.ts      Prisma CLI config: schema path, migrations path, DIRECT_URL, env loading
src/
  app/                 Routes (App Router). page.tsx is the dashboard.
    <module>/page.tsx  Placeholder pages for planned modules
  components/          App shell, navigation, and shared UI primitives
  generated/prisma/    Generated Prisma Client (git-ignored; created by `prisma generate`)
  lib/
    db.ts              Server-only, lazily created Prisma client (not imported anywhere yet)
    navigation.ts      Nav items and each module's status (preview / planned)
    demo-data.ts       Fictional sample inquiries (remove when real data exists)
```

## Current limitations

- No persistence in the app and no authentication.
  - The initial migration is applied to the Neon development branch, and the CLI's direct connection works.
  - The app's pooled connection (`DATABASE_URL`) and `getPrisma()` are untested.
  - No page reads or writes database records, and the dashboard still shows fictional demonstration data to every visitor.
- No authorization or tenant isolation. The required restaurant relation only records ownership.
- No email, web form, or AI integration. Source labels in the pipeline are illustrative.
- Inquiries cannot be opened, created, edited, or moved between stages.
- Light theme only.
- No automated tests yet. Verification is lint plus a production build.
- `npm audit` reports moderate advisories in the ESLint/TypeScript-ESLint dev toolchain. They don't affect the runtime bundle.
- npm 11 holds back the install scripts of `prisma` and `@prisma/engines` until you approve them (`npm approve-scripts`). Locally on Windows, the CLI works without them because the schema-engine binary ships in the package. Whether a Linux build environment such as Railway needs them hasn't been checked.

## Contributor and agent guidance

- [`CLAUDE.md`](CLAUDE.md): conventions, scope control, security, and verification rules
- [`AGENTS.md`](AGENTS.md): shared requirements and read-only review instructions
- [`PROMPT-HISTORY.md`](PROMPT-HISTORY.md): log of implementation tasks and outcomes
