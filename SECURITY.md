# Security Policy

## Supported Versions

Livegrid is pre-1.0. Security fixes target the `main` branch.

## Reporting a Vulnerability

Do not open a public issue for secrets, authentication bypasses, token leaks, or database exposure.

Report privately to the repository owner. Include:

- affected route, component, package, or configuration;
- reproduction steps;
- expected impact;
- suggested fix if available.

## Secret Handling

- Never commit real `.env` files.
- Keep only placeholder values in `.env.example`.
- Rotate any credential that was ever committed, pushed, shared in logs, or copied into examples.
