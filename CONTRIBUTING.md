# Contributing

Thanks for helping improve Livegrid.

## Local Setup

1. Install Node.js 22+ and pnpm 11.
2. Run `pnpm install`.
3. Copy each `.env.example` file to `.env`.
4. Configure Supabase Postgres and LiveKit credentials.
5. Run `pnpm db:migrate`.
6. Run `pnpm dev`.

## Checks

Before opening a pull request, run:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Pull Requests

- Keep changes focused.
- Add regression tests for bug fixes when practical.
- Do not commit `.env`, secrets, generated build output, or local cache files.
- Follow the existing TypeScript, React, Fastify, Prisma and package patterns.
