---
name: nestjs
description: Conventions for apps/api (NestJS) — the data/application/interface layer split, dependency direction, module wiring and test setup. Use when adding or changing anything under apps/api - controllers, use cases, repositories, providers or modules.
---

# NestJS API (apps/api)

NestJS 10, Express platform. Entry point `apps/api/src/main.ts`, root module `app.module.ts`.

## Layers

Features live under `src/modules/`, one folder each, with the three layers separated. Everything outside `modules/` is plumbing, not business code:

```
src/
  modules/<feature>/
    domain/         entities + repository ports (no Nest, no I/O)
    application/    use cases; depend only on domain ports
    infrastructure/ repository implementations (DB, HTTP, in-memory)
    <feature>.controller.ts   interface layer: HTTP in/out only
    <feature>.module.ts       provides use cases
  infrastructure/   PrismaService, PersistenceModule — shared plumbing
  generated/prisma/ generated client, gitignored
  testing/          in-memory fakes for specs, excluded from the build
```

Dependency direction is inward only: interface → application → domain. Infrastructure implements domain interfaces and is injected; nothing in `domain/` or `application/` may import from `infrastructure/`, `@nestjs/*` (beyond `@Injectable`), or Express types.

## Data layer

Prisma 7 + Postgres. Schema in `apps/api/prisma/schema.prisma`, connection URL read from `.env` through `prisma.config.ts` (CLI) and `ConfigService` (runtime).

- `PrismaService` (`src/infrastructure/prisma/`) extends the generated client and is provided by `PrismaModule`; import that module in a feature module to inject it.
- Prisma 7 has no Rust engine — the client needs a driver adapter (`@prisma/adapter-pg`). It is wired in `PrismaService`, nowhere else.
- The generated client lands in `src/generated/prisma` and is gitignored; `postinstall` regenerates it.
- Only `infrastructure/` may import from `src/generated/prisma`. A `domain/` or `application/` file importing Prisma types is a layering break — map to domain types in the repository implementation.
- `pnpm db:up` (root) starts Postgres in Docker; `pnpm --filter=api db:migrate` applies migrations. Prisma 7's `migrate dev` does **not** regenerate the client, so `db:migrate` chains `prisma generate` — never call `prisma migrate dev` bare.

- `pnpm --filter=api db:seed` resets and reseeds sample data (`prisma/seed.ts`, wired through `migrations.seed` in `prisma.config.ts`). It deletes every row first — never run it against anything but local dev.

Domain: `Route` (named, ordered `RoutePoint[]`, points optionally named), `Unit` (vehicle, `name` unique), `Duty` (route + unit + `startAt`/`endAt`).

Deleting a `Route` or a `Unit` that still has duties is refused with a 409 rather than cascading. Both follow the same shape as the overlap rule: an application-layer check plus a database constraint behind it (`Unit_name_key` for duplicate names, FK restrict for the duty references), with the repository translating the violation into the domain error.

**The overlap rule is defined three times and all three must agree:** `TimeWindow.overlaps` in the domain, the `findOverlapping` predicate in `PrismaDutyRepository`, and the `Duty_unit_window_no_overlap` EXCLUDE constraint in the database. Windows are half-open — touching windows do not conflict. Change one, change all three.

## Wiring

Repository ports are **abstract classes**, so the class itself is the injection token and use cases need no `@Inject`:

```ts
export abstract class RouteRepository {
  abstract findById(id: string): Promise<Route | null>;
}

// use case
constructor(private readonly routes: RouteRepository) {}
```

Every port is bound to an implementation in one place, `src/infrastructure/persistence.module.ts`. Feature modules (`RoutesModule`, `DutiesModule`, `UnitsModule`) import it and provide only use cases. Do not bind repositories inside a feature module — routes need duties and duties need routes, and that path leads straight to a circular dependency.

## HTTP layer

- Request validation is **Zod**, not class-validator. Schemas live in `modules/<feature>/dto/*.schema.ts` and are applied per-handler with `ZodValidationPipe` (`infrastructure/http/`). Nest's `ValidationPipe` is unused.
- Schemas guard shape and types only. Business rules — coordinate ranges, blank names, window ordering — stay in the domain and reach HTTP through the filter.
- **Every response is enveloped.** Success is `{ data: <payload> }` via `EnvelopeInterceptor`; failure is `{ error: { code, message, issues? } }` via `ApiExceptionFilter`. Handlers still return plain values — the interceptor wraps them. `204` is the one exception: HTTP forbids a body, so delete sends nothing.
- `ApiExceptionFilter` (`infrastructure/http/`) is `@Catch()`-all, so nothing escapes unenveloped. Domain errors map to a status (not-found → 404, invalid → 400, overlap / route-still-has-duties → 409) with `code` = the error class name. Register a new domain error in its map or it becomes a 500. Schema failures come through as `code: 'ValidationError'` with `issues`; other `HttpException`s get a PascalCase code from the status (`NotFound`).
- `code` is what a client switches on — two different errors share 409, so the status alone is not enough to tell them apart.
- Document responses with `ApiEnvelopeResponse(Model, { status, isArray })` and `ApiErrorResponse(status, description)`; a bare `@ApiOkResponse({ type: Model })` documents the unwrapped shape and would be a lie.
- `configureApp()` in `src/app.setup.ts` is the one place global filters/pipes are registered; `main.ts` and every e2e spec call it, so tests exercise the same stack as production.
- OpenAPI docs are served at `/docs`. The document is built by `buildOpenApiDocument()` (`infrastructure/http/openapi.ts`), shared by `main.ts` and `test/docs.e2e-spec.ts` — a schema the generator cannot represent then fails a test instead of killing bootstrap.
- Request bodies are derived from the Zod schemas via `toBodySchema`, so docs cannot drift from validation. Responses are hand-written classes in `<feature>/*.response.ts`; every handler declares its return type so TypeScript catches drift between them and what a use case returns.

## Rules

- Controllers hold no business logic — validate/parse input, call a use case, map the result.
- Use cases take primitives or DTOs, return plain data, and never touch `Request`/`Response`.
- `execute` is always `async`, even when the body is a single `return`. Domain validation throws before any promise exists, so a non-async `execute` throws synchronously and `execute(x).catch(...)` blows up instead of catching.
- Shared types come from `@repo/shared`.
- Run: `pnpm turbo run dev --filter=api`, build with `nest build`.
- Any new `.ts` file outside `src/` (a config, a seed) raises tsc's inferred rootDir and makes the build emit `dist/src/main.js`, breaking `start:prod`. Add such files to `exclude` in `tsconfig.build.json` and confirm `dist/main.js` still exists.

## Tests

Vitest, configured in `vitest.config.mts` with `unplugin-swc` (needed for `emitDecoratorMetadata`, which Nest DI relies on). Globals are enabled — no `import { describe, it }` needed.

- `pnpm --filter=api test` — unit tests in `src/`
- `pnpm --filter=api test:e2e` — `test/**/*.e2e-spec.ts`

Test the application layer directly with in-memory fakes of the repository interfaces. Keep tests short: one behaviour per test, no restating the implementation.

Anything that depends on Postgres semantics belongs in `test/*.e2e-spec.ts`, not in a unit test with a fake: the EXCLUDE constraint, transaction behaviour in `update`, and concurrency. An in-memory fake cannot prove any of them. Each e2e spec creates its own route **and its own units** and deletes them afterwards — the seeded rows must survive a test run untouched. Never select an existing row as a fixture (`findFirst`, `findMany({ take })`): spec files run in parallel, so another spec's transient rows can be picked up and deleted mid-test. That failure looks like a random 404.
