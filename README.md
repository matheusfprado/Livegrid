# Livegrid

Monorepo for a Discord-like real-time media platform with accounts, servers, invites, voice calls and multiple simultaneous screen-share tracks.

## Commands

```bash
pnpm install
pnpm dev
pnpm lint
pnpm test
pnpm typecheck
pnpm build
pnpm db:migrate
pnpm db:push
```

## Apps

- `apps/web`: Next.js App Router frontend.
- `apps/api`: Fastify API.

## Current MVP

- Email/password account creation and login.
- Session token stored by the web client.
- Server creation.
- Invite code creation and joining.
- Default voice channel per server.
- Call room opened from a voice channel.
- Audio, camera and multiple independent screen shares through LiveKit.
- Host can end the room.

## Packages

- `packages/ui`: shared UI components.
- `packages/database`: Prisma schema and client.
- `packages/types`: shared domain types.
- `packages/validation`: shared Zod schemas.
- `packages/config`: shared constants and environment helpers.
- `packages/livekit`: reserved integration boundary for LiveKit.
- `packages/logger`: shared Pino logger.

## Local Setup

Requirements:

- Node.js 22+
- pnpm 11+
- Supabase Postgres
- LiveKit Cloud or a self-hosted LiveKit server

Create environment files:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
cp packages/database/.env.example packages/database/.env
```

Then apply database migrations:

```bash
pnpm db:migrate
```

## Supabase

This project uses Supabase Postgres. Docker is optional and not required for the main setup.

Use Supabase Dashboard > Connect > ORMs > Prisma and copy:

- Session Pooler URL into `DATABASE_URL`.
- Direct Connection URL into `DIRECT_URL`.

Set both in:

```text
apps/api/.env
packages/database/.env
```

LiveKit media requires these API variables:

```env
LIVEKIT_URL=
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
```

## Open Source

Livegrid is licensed under the MIT License.

Before publishing a fork or deployment, make sure no real secrets are present in `.env.example`, logs, commits or screenshots. Rotate any credential that was ever committed locally or shared.

See:

- `CONTRIBUTING.md`
- `SECURITY.md`
- `CODE_OF_CONDUCT.md`
