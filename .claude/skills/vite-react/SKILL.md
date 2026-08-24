---
name: vite-react
description: Conventions for apps/web (Vite + React 19) — feature folder structure, the API client, data fetching with TanStack Query, the Leaflet map, and dev/build/test commands. Use when adding or changing anything under apps/web - components, hooks, API calls or Vite config.
---

# Web (apps/web)

Vite 8 + React 19, TypeScript, ESM. Entry `src/main.tsx`, config `vite.config.ts`, linting via `oxlint`.

## Layers

`src/routes/` mirrors the URL tree: one folder per URL segment, holding the views for that segment and nothing else.

```
src/
  api/
    client.ts     fetch + envelope unwrapping + ApiError
    routes.ts     one file per endpoint group
    duties.ts
    units.ts
  components/     shared presentational pieces (StatusMessage, RouteMap,
                  AssignDutyForm, UnitDayTimeline)
  routes/
    routes/       -> /routes, /routes/new, /routes/:id, /routes/:id/edit
      hooks.ts    TanStack Query hooks (queries + mutations) and query keys
      RoutesListPage.tsx
      RouteDetailPage.tsx
      RouteFormPage.tsx    create and edit share one component
    units/        -> /units
    duties/       -> /duties, when it exists
  App.tsx         route table
```

A new endpoint group gets its own file under `api/`; do not collect them into a single module. A new URL segment gets its own folder under `routes/`.

Components consume a feature through a hook, never a `fetch` call inline — swapping the data source must not touch a component.

## Talking to the API

- Types and request schemas come from `@repo/shared`. Never redeclare an API shape locally; the API's response classes `implements` those same interfaces, so a mismatch is a compile error on one side or the other.
- `apiRequest` unwraps the `{ data }` envelope and throws `ApiError` on failure. Components and hooks see plain payloads.
- **Branch on `ApiError.code`, never on the status.** `OverlappingDutyError` and `RouteHasDutiesError` are both 409 and mean completely different things to the user.
- User-facing copy lives in `api/error-messages.ts`, keyed by `code`. Add a new domain error there or the raw English message from the API leaks into the UI.
- `ApiError.issues` carries per-field schema problems (`{ path, message }`) for form errors.
- Base URL comes from `VITE_API_URL` (see `.env.example`), defaulting to `http://localhost:3000`.

## Data fetching

TanStack Query. Mutations must invalidate the queries they affect — the spec requires CRUD to show up in the list and detail views, and that invalidation is what makes it happen.

## Styling

Tailwind 4 via `@tailwindcss/vite`; `src/index.css` is just `@import 'tailwindcss'` plus body defaults. No config file, no hand-written component CSS.

## Map

`react-leaflet` + OpenStreetMap tiles, no API key. Route points render as ordered markers plus a polyline. Leaflet's CSS must be imported or the map renders blank, and the container needs an explicit height. Default marker images 404 under a bundler, so markers use `L.divIcon` with Tailwind classes.

`RouteMap` is mocked in component tests — Leaflet needs real layout measurements that jsdom does not provide.

## Rules

- No global state library; server state lives in TanStack Query.
- `erasableSyntaxOnly` is on: **no constructor parameter properties, no enums**. Declare class fields explicitly and assign them in the constructor body.
- Run: `pnpm turbo run dev --filter=web`; build `tsc -b && vite build`; lint `pnpm turbo run lint --filter=web`.

## Tests

**Do not write new frontend tests unless asked.** The only spec that lives here is `src/api/client.test.ts`, covering envelope unwrapping and `ApiError`. Component tests were deliberately removed; the API keeps its full suite.

Vitest + Testing Library in jsdom stay installed (`vitest.config.ts`, setup in `src/test/setup.ts`, globals enabled) so specs can come back without re-wiring. Run with `pnpm --filter=web test`.

If tests are reinstated: test the api layer as plain functions with `vi.stubGlobal('fetch', ...)`, and mock `RouteMap` — Leaflet needs layout measurements jsdom does not provide.
