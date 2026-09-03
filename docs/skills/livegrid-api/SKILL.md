---
name: livegrid-api
description: Work on the Livegrid Fastify API, Prisma data model, auth, server, room and LiveKit backend flows.
---

# Livegrid API Skill

Use this skill for backend changes in `apps/api`, `packages/database`, `packages/validation`, `packages/types`, `packages/config`, `packages/livekit` and `packages/logger`.

## Rules

- Keep input validation in `packages/validation`.
- Keep shared response shapes in `packages/types`.
- Keep database access inside repository classes.
- Keep business rules inside service classes.
- Use Fastify routes only for HTTP wiring, auth lookup and response mapping.
- For database schema changes, add a Prisma migration.
- Do not expose `DATABASE_URL`, `DIRECT_URL`, `LIVEKIT_API_KEY` or `LIVEKIT_API_SECRET` to frontend code.

## Checks

Run focused tests first when available:

```bash
pnpm --filter @livegrid/api test
pnpm --filter @livegrid/api typecheck
pnpm --filter @livegrid/api lint
```
