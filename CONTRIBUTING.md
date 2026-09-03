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

## Branch Workflow

Do not push directly to `main`.

1. Create a branch from `main`.
2. Make the change.
3. Copy `BRANCH_README.template.md` to `BRANCH_README.md`.
4. Explain what changed, how to test it and known risks.
5. Open a Pull Request to `main`.

Install local Git hooks:

```bash
pnpm hooks:install
```

The hook blocks local direct pushes from `main` or `master`. GitHub branch protection must also be enabled by a repository admin.

## Pull Requests

- Keep changes focused.
- Include `BRANCH_README.md`.
- Add regression tests for bug fixes when practical.
- Do not commit `.env`, secrets, generated build output, or local cache files.
- Follow the existing TypeScript, React, Fastify, Prisma and package patterns.
