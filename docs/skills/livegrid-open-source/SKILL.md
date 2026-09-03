---
name: livegrid-open-source
description: Prepare Livegrid for public open-source release with docs, licensing, CI, examples and security hygiene.
---

# Livegrid Open Source Skill

Use this skill for repository readiness, contributor docs and public release checks.

## Rules

- Ensure `LICENSE`, `README.md`, `CONTRIBUTING.md`, `SECURITY.md` and `CODE_OF_CONDUCT.md` exist.
- Keep `.env.example` files realistic but secret-free.
- Add CI checks for install, lint, typecheck, test and build.
- Keep issue and pull request templates short and actionable.
- Mention required Node, pnpm, Supabase and LiveKit setup.
- Rotate credentials if a real secret ever appeared in tracked or shared files.

## Release Checklist

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```
