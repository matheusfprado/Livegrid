# Branch Protection

Direct push to `main` must be blocked in GitHub repository settings.

## Required GitHub Settings

Open:

```text
Repository > Settings > Branches > Add branch protection rule
```

Use:

```text
Branch name pattern: main
Require a pull request before merging: enabled
Require approvals: enabled
Require status checks to pass before merging: enabled
Require branches to be up to date before merging: enabled
Restrict who can push to matching branches: enabled
Include administrators: enabled
Do not allow bypassing the above settings: enabled
```

Required status check:

```text
checks
```

## Local Hook

Install local hooks:

```bash
pnpm hooks:install
```

The local `pre-push` hook blocks direct pushes from `main` or `master` and requires `BRANCH_README.md` on contributor branches.

This is developer convenience only. GitHub branch protection is the source of truth.
