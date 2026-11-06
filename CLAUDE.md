# CLAUDE.md

Shared project requirements, conventions, and review rules live in AGENTS.md and apply in full:

@AGENTS.md

## Claude Code workflow

### Before changing anything

- Confirm you're in the repository root (`git rev-parse --show-toplevel`) and read the files you'll touch.
- For Next.js APIs, consult `node_modules/next/dist/docs/` rather than memory. This is Next 16 with Cache Components.
- If the task conflicts with existing code or these rules, stop and ask. Don't silently resolve it.

### Scope control

- Implement only the requested stage. Don't start the next one (for example, the database or AI work) unless asked.
- Don't add dependencies without a clear need stated in your report. Prefer platform features and existing code.
- Keep demo-only code isolated (`src/lib/demo-data.ts`) so it's easy to delete when real data arrives.
- When a module gains real functionality, update its `status` in `src/lib/navigation.ts`, the README "What exists today" table, and remove any "Planned" copy that's no longer true.

### Security

- Never open, cat, grep, or echo `.env`, `.env.local`, credential JSON, or token files. Reference variable *names* only.
- New environment variables go into `.env.example` with obvious placeholders (for example `OPENAI_API_KEY=replace-me`).
- Secrets are server-only: read them in Server Components, Route Handlers, or Server Actions, never in client code.
- Treat inbound email content and AI output as untrusted input: validate, escape, and never execute it.

### Verification

- Run `npm run lint` and `npm run build`. Both must pass before you report completion.
- For UI changes, also run the production server (`npm run start`) and check the affected routes respond, or verify visually when a browser is available.
- In the final report, list the commands run and their real output summaries, and call out anything not verified.

### Record keeping

- Append a numbered entry to `PROMPT-HISTORY.md` for each implementation task: the request summary, files changed, the outcome, and open issues.
- Don't commit, push, or deploy unless explicitly asked.
