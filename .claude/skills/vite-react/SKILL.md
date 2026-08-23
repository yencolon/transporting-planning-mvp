---
name: vite-react
description: Conventions for apps/web (Vite + React 19) — feature folder structure, the API client, data fetching with TanStack Query, the Leaflet map, and dev/build/test commands. Use when adding or changing anything under apps/web - components, hooks, API calls or Vite config.
---

# Web (apps/web)

Vite 8 + React 19, TypeScript, ESM. Entry `src/main.tsx`, config `vite.config.ts`, linting via `oxlint`.

## Layers

```
src/
  api/       client.ts (fetch + envelope/error handling), endpoints.ts (typed calls)
  features/<feature>/
    ui/      components and hooks
  test/      vitest setup
```

Components consume a feature through a hook, never a `fetch` call inline — swapping the data source must not touch a component.

## Talking to the API

- Types and request schemas come from `@repo/shared`. Never redeclare an API shape locally; the API's response classes `implements` those same interfaces, so a mismatch is a compile error on one side or the other.
- `apiRequest` unwraps the `{ data }` envelope and throws `ApiError` on failure. Components and hooks see plain payloads.
- **Branch on `ApiError.code`, never on the status.** `OverlappingDutyError` and `RouteHasDutiesError` are both 409 and mean completely different things to the user.
- `ApiError.issues` carries per-field schema problems (`{ path, message }`) for form errors.
- Base URL comes from `VITE_API_URL` (see `.env.example`), defaulting to `http://localhost:3000`.

## Data fetching

TanStack Query. Mutations must invalidate the queries they affect — the spec requires CRUD to show up in the list and detail views, and that invalidation is what makes it happen.

## Map

`react-leaflet` + OpenStreetMap tiles, no API key. Route points render as ordered markers plus a polyline. Leaflet's CSS must be imported or the map renders blank.

## Rules

- No global state library; server state lives in TanStack Query.
- `erasableSyntaxOnly` is on: **no constructor parameter properties, no enums**. Declare class fields explicitly and assign them in the constructor body.
- Run: `pnpm turbo run dev --filter=web`; build `tsc -b && vite build`; lint `pnpm turbo run lint --filter=web`.

## Tests

Vitest + Testing Library in jsdom (`vitest.config.ts`, setup in `src/test/setup.ts`), globals enabled.

- `pnpm --filter=web test`
- Test the api layer as plain functions with `vi.stubGlobal('fetch', ...)`.
- Component tests only where behaviour is non-trivial; assert what the user sees, not implementation details. Keep them short.
