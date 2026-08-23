# Working Guidelines

1. **No assumptions.** Implement only what is explicitly asked. If something is unclear or missing, ask instead of guessing or filling gaps.
2. **Keep it simple.** Choose the straightforward solution. No premature abstraction, no over-engineering.
3. **Clean code.** Avoid unnecessary comments, redundant code, dead code, and other code smells.

## Tech Stack

- **Monorepo:** Turborepo (pnpm workspaces)
- **Frontend:** Vite + React
- **Backend:** NestJS
- **Testing:** Vitest — concise tests only, no verbose or redundant cases

## Architecture

Layers must stay decoupled so any of them can be swapped without touching the others:

- **Data layer** — persistence and external sources
- **Application layer** — use cases and business rules; depends on abstractions, never on concrete data or interface implementations
- **Interface layer** — HTTP controllers, UI

Simple, but with clear boundaries between layers.

## Decisions

Every key decision the user states goes in [DECISIONS.md](DECISIONS.md).
