# Decisions

Log of key decisions. Newest at the bottom.

## 2026-08-22

- Monorepo managed with Turborepo + pnpm workspaces.
- Frontend: Vite + React. Backend: NestJS.
- Testing with Vitest, keeping tests short and non-verbose.
- Layered architecture (data / application / interface) where each layer can be replaced without breaking the others.
