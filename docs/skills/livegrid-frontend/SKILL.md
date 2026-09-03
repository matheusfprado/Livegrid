---
name: livegrid-frontend
description: Work on the Livegrid Next.js frontend, shared UI components and LiveKit client room experience.
---

# Livegrid Frontend Skill

Use this skill for changes in `apps/web` and `packages/ui`.

## Rules

- Preserve the Discord-like product UI, but keep controls functional.
- Use shared UI primitives from `@livegrid/ui`.
- Use icons from `lucide-react` when an icon is needed.
- Keep mobile navigation usable for servers, channels, calls and auth flows.
- Handle loading, empty and error states.
- Do not put secrets in `NEXT_PUBLIC_*` variables.
- Treat `localStorage` tokens as sensitive and avoid logging them.

## Checks

```bash
pnpm --filter @livegrid/web lint
pnpm --filter @livegrid/web typecheck
pnpm --filter @livegrid/web build
```
