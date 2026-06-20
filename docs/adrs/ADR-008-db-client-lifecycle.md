# ADR-008: Database Client Lifecycle

## Status

Accepted — June 2026

## Context

Per ADR-006, the database client is Drizzle ORM over the `@neondatabase/serverless` HTTP driver. We need to decide how the client instance is constructed and shared across the application: one instance per process, one per request, or one per call. The decision affects testability, cold-start cost, and how the rest of the codebase imports the client.

The runtime profile from previous ADRs:

1. **Serverless functions on Vercel** (ADR-001) — instances can be warm (reused) or cold (new). Module-level state survives warm starts.
2. **Neon HTTP driver** (ADR-006) — stateless from the client's perspective; each query is an isolated `fetch`. There is no long-lived TCP connection to "leak."
3. **Layered architecture** — repositories receive `db: DbClient` as a parameter (per `src/repositories/CLAUDE.md`). The application never reaches for a global client implicitly.

## Decision Drivers

- **Cold-start cost** — construction must be cheap or amortized across requests on a warm instance.
- **Test isolation** — repositories must be mockable in unit tests without monkey-patching a global.
- **Explicit dependency injection** — the existing convention passes `db` as a parameter; whatever lifecycle we choose must preserve that.
- **No hidden state across requests** — a per-request mutation must not leak into the next request on the same instance.

## Options Considered

### Option A — Singleton

Module-level `const db = drizzle(...)`. Imported wherever needed; created once per process; reused across requests on the same warm instance.

- Lowest construction overhead — created once at module load.
- Survives warm Vercel invocations; rebuilt on cold start.
- Tests mock `@/lib/db` via `vi.mock(...)` — the standard convention.

### Option B — Factory

`getDb()` returns a fresh `drizzle(...)` on every call.

- Highest construction overhead — pays per request even when warm.
- No state-sharing benefit on Neon HTTP (the driver has none worth keeping).
- Tests still mock the module; no testability gain.

### Option C — Per-request context

`db` constructed inside a Next.js Server Component / Route Handler scope, passed downstream explicitly. No module-level instance.

- Maximally explicit lifecycle.
- Requires threading `db` through every entry point.
- Tests already isolate via `vi.mock`; the extra plumbing has no payoff with the HTTP driver.

## Comparative Analysis

| Criterion | Singleton | Factory | Per-request |
|---|---|---|---|
| **Construction cost** | **Once per process** | Per call | Per request |
| **Warm-instance reuse** | **Yes** | No | No |
| **Test mockability** | `vi.mock('@/lib/db')` | `vi.mock('@/lib/db')` | Inject in test |
| **Plumbing required** | None | None | Every entry point |
| **Hidden state risk (Neon HTTP)** | None | None | None |

## Decision

**Singleton** is selected.

Rationale:

1. The Neon HTTP driver has no shared mutable state that a singleton could leak across requests. The objection that makes singletons risky in TCP-pooled clients does not apply here.
2. Construction is amortized across warm Vercel invocations. Factory and per-request lifecycles pay the cost every time with no benefit.
3. Tests already mock the module via `vi.mock(...)` per `tests/CLAUDE.md`. There is no testability gain from a factory.
4. The layered architecture continues to pass `db` as a parameter into repositories. The singleton is the source the app entry points (actions, route handlers) read from; the convention of explicit DI inside the data layers is unchanged.

## Consequences

### Positive

- One import, one instance, one place to mock in tests.
- Zero per-request construction overhead on warm starts.
- Matches the existing convention: app boundary reads `db` from `@/lib/db`, then passes it into the repository function.

### Negative / Trade-offs

- **Env var read at module load.** `DATABASE_URL` must be present when `@/lib/db` is first imported, or the process crashes early. Acceptable — failing at boot is preferable to failing mid-request.
- **Cannot vary the URL per request** (e.g., to point at a tenant DB). Mitigation: if multi-tenant DB selection becomes a requirement, introduce a factory at that point.

### Revisit Triggers

- A project needs per-tenant DB routing → introduce a factory alongside the singleton; do not retrofit.
- Driver switches to a stateful TCP pool → re-evaluate whether singleton lifecycle still matches the connection model.
