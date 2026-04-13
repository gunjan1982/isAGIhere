# pnpm Workspace Package Install Without Filter

## Symptom
A package is installed successfully (`pnpm add` exits 0), but importing it in a workspace artifact throws `Cannot find module` at runtime or compile time.

## Root Cause
Running `pnpm add [package]` at the monorepo root adds the dependency to the root `package.json`, not to the intended workspace package. In a pnpm workspace, each artifact (`artifacts/ai-hub`, `artifacts/api-server`, etc.) has its own `package.json` and `node_modules`. The root install is invisible to workspace packages.

## Minimal Example
```bash
# BROKEN — installs to root package.json
pnpm add youtube-transcript

# FIXED — installs to the correct workspace package
pnpm add youtube-transcript --filter @workspace/api-server
# or for frontend:
pnpm add some-ui-library --filter @workspace/ai-hub
```

## Fix Rule
Always use `--filter @workspace/[package-name]` when adding dependencies in this monorepo. The workspace name comes from the `name` field in the target package's `package.json`.

## Seen In
- isAGIhere — monorepo root — 2026-04-13 (identified as recurring risk during project setup)
