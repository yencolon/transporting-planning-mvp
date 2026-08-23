---
name: nestjs
description: Conventions for apps/api (NestJS) — the data/application/interface layer split, dependency direction, module wiring and test setup. Use when adding or changing anything under apps/api - controllers, use cases, repositories, providers or modules.
---

# NestJS API (apps/api)

NestJS 10, Express platform. Entry point `apps/api/src/main.ts`, root module `app.module.ts`.

## Layers

Each feature is a folder with the three layers separated:

```
src/<feature>/
  domain/         entities + repository interfaces (no Nest, no I/O)
  application/    use cases; depend only on domain interfaces
  infrastructure/ repository implementations (DB, HTTP, in-memory)
  <feature>.controller.ts   interface layer: HTTP in/out only
  <feature>.module.ts       wiring
```

Dependency direction is inward only: interface → application → domain. Infrastructure implements domain interfaces and is injected; nothing in `domain/` or `application/` may import from `infrastructure/`, `@nestjs/*` (beyond `@Injectable`), or Express types.

## Wiring

Bind interfaces to implementations in the feature module with a token provider, so the implementation can be swapped without touching the use case:

```ts
providers: [{ provide: THING_REPOSITORY, useClass: PrismaThingRepository }]
```

## Rules

- Controllers hold no business logic — validate/parse input, call a use case, map the result.
- Use cases take primitives or DTOs, return plain data, and never touch `Request`/`Response`.
- Shared types come from `@repo/shared`.
- Run: `pnpm turbo run dev --filter=api`, build with `nest build`.

## Tests

Vitest, configured in `vitest.config.mts` with `unplugin-swc` (needed for `emitDecoratorMetadata`, which Nest DI relies on). Globals are enabled — no `import { describe, it }` needed.

- `pnpm --filter=api test` — unit tests in `src/`
- `pnpm --filter=api test:e2e` — `test/**/*.e2e-spec.ts`

Test the application layer directly with in-memory fakes of the repository interfaces. Keep tests short: one behaviour per test, no restating the implementation.
