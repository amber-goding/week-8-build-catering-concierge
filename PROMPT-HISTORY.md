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
