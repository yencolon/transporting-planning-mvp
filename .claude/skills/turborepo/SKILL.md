---
name: turborepo
description: Conventions for this Turborepo + pnpm monorepo — workspace layout, task pipeline, shared package usage, and the commands to run dev/build/lint/test. Use when adding a workspace, wiring a turbo task, changing root config, or running anything across apps.
---

# Turborepo (lawawa-mvp)

## Layout

```
apps/api        NestJS backend      (package name: api)
apps/web        Vite + React front  (package name: web)
packages/shared cross-cutting code  (package name: @repo/shared)
```

Workspaces are declared in `pnpm-workspace.yaml`; the pipeline lives in `turbo.json`.

## Commands

Run from the repo root:

- `pnpm dev` — all apps in watch mode (`turbo run dev`, persistent, uncached)
- `pnpm build` — `turbo run build`, respects `^build`, outputs to `dist/**`
- `pnpm turbo run <task> --filter=api` — scope a task to one workspace (`--filter=web`, `--filter=@repo/shared`)

Package manager is **pnpm 10.7.1**. Add deps with `pnpm add <pkg> --filter=<workspace>`, never by editing a workspace `package.json` by hand.

## Rules

- A new task must be declared in `turbo.json` before it can be run through turbo.
- Cross-workspace code goes in `@repo/shared`, consumed as `"@repo/shared": "workspace:*"`. Apps never import from each other.
- `@repo/shared` holds types and pure logic only — no framework, no I/O. Today: the Zod request schemas and the response/envelope types, so the API and the React forms share one definition.
- **`@repo/shared` must stay compiled** (`tsup`, dual CJS/ESM plus `.d.ts`). If it ever exports raw `.ts` again, `apps/api`'s tsc pulls those sources in, raises its inferred rootDir and emits `dist/src/main.js` — breaking `start:prod`. `turbo run build` orders it via `dependsOn: ["^build"]`; after editing shared, rebuild it before running `pnpm --filter=api test` directly.
