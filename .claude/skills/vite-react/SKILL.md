---
name: vite-react
description: Conventions for apps/web (Vite + React 19) — feature folder structure, the data/application/UI split, and dev/build/lint commands. Use when adding or changing anything under apps/web - components, hooks, API clients or Vite config.
---

# Web (apps/web)

Vite 8 + React 19, TypeScript, ESM. Entry `src/main.tsx`, config `vite.config.ts`, linting via `oxlint`.

## Layers

```
src/features/<feature>/
  data/    API clients / storage adapters behind an interface
  domain/  types + the port the feature needs (no fetch, no React)
  ui/      components and hooks
```

Components consume the feature through its hook or port, never a `fetch` call inline — swapping the data source must not touch a component.

## Rules

- Shared types come from `@repo/shared`; do not redeclare API shapes locally.
- No global state library unless asked.
- Run: `pnpm turbo run dev --filter=web`; build `tsc -b && vite build`; lint `pnpm turbo run lint --filter=web`.

## Tests

Vitest (see DECISIONS.md). It is not wired into `apps/web` yet — check before writing tests.

Test the data and domain layers as plain functions. Component tests only where behaviour is non-trivial; assert what the user sees, not implementation details. Keep them short.
