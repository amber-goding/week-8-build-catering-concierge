# Catering Concierge

Catering Concierge is a catering management product for independent restaurants. The goal is to capture catering inquiries from a connected inbox, web forms, and manual entry, then help staff move each one from first contact to a confirmed event.

> **Status: foundation only.** This repository currently contains a responsive dashboard shell running on **fictional demonstration data**. Nothing is connected to a database, email account, or AI service.

## What exists today

| Area | State |
| --- | --- |
| App shell (sidebar, mobile drawer, routing) | Working |
| Dashboard summary cards | Demo only. Counts are derived from the fictional sample dataset |
| Inquiry pipeline preview | Demo only. Read-only fictional inquiries |
| Demonstration-mode indicator | Shown on every page |
| Inquiries, Email, Menu, Quotes, Events, Settings | Routes exist and show planned scope. **No functionality** |

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

Planned for later stages: Neon PostgreSQL with Prisma, the OpenAI API, the Gmail API with OAuth, and deployment on Railway.

## Getting started

Requirements: Node.js 20.9 or newer (developed on Node 24) and npm.

```bash
npm install
npm run dev        # http://localhost:3000
```

Other scripts:

```bash
npm run lint       # ESLint (next/core-web-vitals + TypeScript rules)
npm run build      # Production build, including type checking
npm run start      # Serve the production build
```

No environment variables are needed yet. When later stages need them, a `.env.example` with placeholder values will be added. Real values belong in `.env.local`, which git ignores.

## Project structure

```
src/
  app/                 Routes (App Router). page.tsx is the dashboard.
    <module>/page.tsx  Placeholder pages for planned modules
  components/          App shell, navigation, and shared UI primitives
  lib/
    navigation.ts      Nav items and each module's status (preview / planned)
    demo-data.ts       Fictional sample inquiries (remove when real data exists)
```

## Current limitations

- No database, persistence, or authentication. Every visitor sees the same static sample data.
- No email, web form, or AI integration. Source labels in the pipeline are illustrative.
- Inquiries cannot be opened, created, edited, or moved between stages.
- Light theme only.
- No automated tests yet. Verification is lint plus a production build.
- `npm audit` reports moderate advisories in the ESLint/TypeScript-ESLint dev toolchain. They don't affect the runtime bundle.

## Contributor and agent guidance

- [`CLAUDE.md`](CLAUDE.md): conventions, scope control, security, and verification rules
- [`AGENTS.md`](AGENTS.md): shared requirements and read-only review instructions
- [`PROMPT-HISTORY.md`](PROMPT-HISTORY.md): log of implementation tasks and outcomes
