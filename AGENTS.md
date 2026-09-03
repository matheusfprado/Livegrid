# Livegrid Agent Instructions

## Project Defaults

- Keep diffs small and practical.
- Use TypeScript strict patterns and avoid `any`.
- Reuse existing packages before adding dependencies.
- Keep API behavior validated with focused tests when fixing bugs.
- Never commit real `.env` files, secrets, build output, cache files or local database dumps.

## Architecture

- `apps/web`: Next.js App Router frontend.
- `apps/api`: Fastify API.
- `packages/database`: Prisma schema, migrations and client.
- `packages/validation`: shared Zod contracts.
- `packages/types`: shared DTO/domain types.
- `packages/ui`: shared React UI primitives.
- `packages/livekit`: LiveKit token and permissions boundary.
- `packages/config`: shared environment parsing and constants.
- `packages/logger`: Pino logger defaults.

## Validation

Run the smallest useful check while working, then before handoff run:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

For database changes, add a Prisma migration under `packages/database/prisma/migrations`.

## Security Notes

- Server-owned rooms require authenticated server membership.
- Do not expose LiveKit API secrets or database URLs to the web app.
- Treat room host tokens and session tokens as sensitive.
- Add rate limiting or abuse controls for public auth, invite, room join and media token routes.
