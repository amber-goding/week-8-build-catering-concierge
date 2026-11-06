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

**Foundation plus database schema applied to Neon development.** The UI is a responsive dashboard shell on fictional demonstration data.

**Database state:**
- **Code:** the Prisma 7 schema (`Restaurant`, `Inquiry`), an initial SQL migration, and a server-only client in `src/lib/db.ts`.
- **Applied (reported by the project owner):** the user applied migration `20261106081912_init` to the Neon **development** branch. `prisma migrate status` reports the schema is up to date, which verifies the CLI's direct connection (`DIRECT_URL`).
- **Untested:** the app's pooled connection (`DATABASE_URL`) and `getPrisma()`.
- No page, route, or action reads or writes database records. The dashboard still shows fictional demonstration data.
- No other environment (production, Railway) has a database.

There is no authentication, authorization, Gmail integration, or AI API usage. See `PROMPT-HISTORY.md` for what each task delivered.

## Stack

- Next.js 16 App Router with Turbopack, `cacheComponents` and `partialPrefetching` enabled
- React 19, TypeScript (strict), Tailwind CSS v4 (CSS-first `@theme` tokens in `src/app/globals.css`)
- Prisma ORM 7.10 (`prisma-client` generator, output to the git-ignored `src/generated/prisma`) with `@prisma/adapter-neon` for Neon PostgreSQL. CLI config lives in `prisma7.config.ts`. Keep `prisma`, `@prisma/client`, and `@prisma/adapter-neon` on the same 7.x version. npm's `prisma@latest` currently points to an 8.x release candidate.
- Later stages: OpenAI API, Gmail API (OAuth), Railway deployment

## Database rules

- Use `getPrisma()` from `src/lib/db.ts` only in server code. It imports `server-only`, so never import it from client components.
- `DATABASE_URL` (pooled) is for the app runtime. `DIRECT_URL` (direct) is for the Prisma CLI.
- **Ownership is not authorization.** `Inquiry.restaurantId` records ownership only. Before exposing any database-backed page, route, or action, authenticated restaurant selection and restaurant-scoped queries must exist. Don't claim tenant isolation until they do.
- Agents must not apply migrations, run `db push` or `migrate reset`, seed, or connect to a database unless the user explicitly asks. Create new migrations with the user, or offline with `prisma migrate diff`. Never fabricate migration history.

## Non-negotiable requirements

1. **Honesty in the UI.** Never add buttons, toggles, or flows that look functional but aren't. No fake integrations, no simulated success messages. Unbuilt modules are labeled "Planned" / "Not yet built". Update `status` in `src/lib/navigation.ts` only when a module really works.
2. **Demonstration data is fictional and labeled.** All sample data lives in `src/lib/demo-data.ts`. Use the "Example" surname for people. No real customers, no real pricing, and no claimed business performance (revenue, conversion rates, and so on). Any screen showing sample data must say so visibly.
3. **Secrets.** Never read, print, log, or commit credentials or `.env*` files (except `.env.example`, which holds placeholders only). Never put secrets in client components or `NEXT_PUBLIC_*` variables.
4. **Scope.** Do only the task requested. No unrequested features, dependencies, services, or abstractions. Don't overwrite existing work without approval.
5. **No external side effects.** Agents do not commit, push, deploy, or configure external accounts unless the user explicitly asks.
6. **Accessibility and responsiveness.** Semantic HTML, labeled controls, visible focus states, WCAG AA contrast, keyboard-operable navigation, and layouts that work from about 360px wide upward.

## Conventions

- Server Components by default. Add `"use client"` only for interactivity or browser APIs (currently `nav-links.tsx` and `mobile-nav.tsx`).
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
