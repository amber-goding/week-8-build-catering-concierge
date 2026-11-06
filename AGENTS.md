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

**Foundation only.** The app is a responsive dashboard shell on fictional demonstration data. There is no database, authentication, Gmail integration, or AI API usage. See `PROMPT-HISTORY.md` for what each task delivered.

## Stack

- Next.js 16 App Router with Turbopack, `cacheComponents` and `partialPrefetching` enabled
- React 19, TypeScript (strict), Tailwind CSS v4 (CSS-first `@theme` tokens in `src/app/globals.css`)
- Later stages: Neon PostgreSQL + Prisma, OpenAI API, Gmail API (OAuth), Railway deployment

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
