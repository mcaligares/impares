## Context

The match page lives at `src/app/matches/[id]/` and is reached via the match's primary key. That key is a Postgres `uuid` generated DB-side (`uuid('id').primaryKey().defaultRandom()`), so shared URLs carry an opaque 36-char string. The id flows through the stack as a `string` with no parsing or format validation. Two foreign keys reference it (`match_player.match_id`, `squad.match_id`), both `uuid`. The ORM is Drizzle (Postgres, Neon driver); migrations are generated with `pnpm db:generate` and applied with `pnpm db:migrate`. This is a test project, so dropping match-related table data is acceptable.

## Goals / Non-Goals

**Goals:**
- Serve the match page from `/partido/[id]` (Spanish segment).
- Make the match id a short, shareable incremental integer (`/partido/4`).
- Keep the change confined to the route segment and the id type.

**Non-Goals:**
- Renaming the domain entity, the `src/components/match/` folder, services, actions, or any `match`/`matches` business identifiers.
- Preserving existing match/match_player/squad rows or their ids.
- Adding a slug, hashid, or any non-sequential public identifier.
- Backward-compatible redirects from the old `/matches/...` URLs.

## Decisions

- **Route as a folder move, not a rewrite.** Move `src/app/matches/[id]/` to `src/app/partido/[id]/` and update the two in-code URL builders. No `next.config` rewrites/redirects — the old path is abandoned. Alternative (keep `/matches`, add a rewrite) rejected: the goal is the Spanish segment, and there is no published-link compatibility need in a test project.

- **`integer` identity PK over `serial`.** Use `integer('id').primaryKey().generatedAlwaysAsIdentity()` (Postgres `GENERATED ALWAYS AS IDENTITY`), the current Drizzle-recommended form, instead of the legacy `serial`. Generation stays DB-side, so `InsertMatch` still omits `id`. Alternatives considered: `serial` (legacy, weaker guarantees), `bigint` (unnecessary range for casual matches), and a separate public sequence/hashid (more surface for no benefit here).

- **Parse the route param at the page boundary.** `params.id` arrives as a string; `page.tsx` converts it with `Number(...)` and returns `notFound()` when `Number.isNaN`. This keeps coercion at the server boundary (where data fetching belongs per the pages convention) so repositories/services/actions receive a clean `number`. Alternative (coerce deep in the repository) rejected: it would scatter parsing and weaken the typed contract.

- **Types follow the schema; no new logic.** Changing the schema flips `Match['id']` to `number` via `InferSelectModel`. The `string` → `number` edits in repository/service/action signatures and `RecentMatch.id` are type-only; the `if (!matchId)` critical-field guard in actions stays. Drizzle/`tsc` surface every site that still assumes `string`.

- **FKs change in lockstep.** `match_player.match_id` and `squad.match_id` move to `integer` referencing the new PK, in the same generated migration, so the schema stays internally consistent.

## Risks / Trade-offs

- **Destructive migration** → Acceptable here (test project, data can be dropped). The generated migration recreates the `match` PK and dependent FK columns; existing rows are discarded. Verify `pnpm db:generate` emits the drop/recreate and run `pnpm db:migrate` against the test DB only.
- **Sequential ids are enumerable/guessable** → Accepted trade-off; matches are low-sensitivity and the shareable short URL is the explicit goal. Revisit only if matches later need access control.
- **Missed `string`-typed call site** → Mitigated by `tsc`/build failing the change; the listed sites (repositories, transformers, actions) are the known surface.
- **Stale `/matches` links** → Old URLs 404 by design; noted as BREAKING in the proposal.

## Migration Plan

1. Update the three schema files (PK + two FKs), then the type plumbing and route param parsing.
2. Move the route folder and update the two URL builders.
3. `pnpm db:generate` to produce a new migration (do not edit existing migrations); review the SQL.
4. `pnpm db:migrate` against the test database.
5. Update test factories/asserts; run `tsc`/build and the test suite.
6. Rollback: revert the change set and drop the new migration; since data is disposable, no data rollback is needed.

## Open Questions

None — the destructive-migration assumption is confirmed (test project, table data can be dropped).
