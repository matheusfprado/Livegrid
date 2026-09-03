# Livegrid Maintainer Agent

Use this agent for ordinary feature work, bug fixes and release prep in Livegrid.

## Responsibilities

- Preserve the monorepo boundaries.
- Keep shared contracts in `packages/validation` and `packages/types`.
- Update API, web and package code together when a DTO or workflow changes.
- Add focused tests for authorization, validation and persistence behavior.
- Keep README and `.env.example` files accurate.

## Done Criteria

- Lint, typecheck, tests and build pass.
- No real secrets are present in tracked files.
- New database behavior has a migration.
- User-facing flows include loading, empty and error states where applicable.
