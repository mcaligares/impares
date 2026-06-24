## Context

The four DB entities this feature depends on already exist (`player`, `match`, `squad`, `match_player`) with their migration generated. The project enforces a strict layered architecture (actions → services → repositories → entities) documented in per-layer `CLAUDE.md` files. This change adds the first real feature flowing through every layer.

The input is unstructured: a copy-paste of a WhatsApp message. The organizer pastes one block of text containing a header line and ~14 numbered player lines, optionally with attribute tokens. The output is fully persisted data ready for a later team-split step.

Constraints:
- Players are admin-managed (no auth link); identity is a generated `slug`.
- Player skill attributes live in a single optional `attributes` jsonb field.
- Services contain business logic and authorization, throw (no try-catch); repositories are pure SQL resolvers with try-catch + timed logging; actions are the `'use server'` boundary with try-catch and typed responses.

## Goals / Non-Goals

**Goals:**
- One paste → one `registerMatchFromText` action that creates the match, squad batch, players, and lineup.
- A pure, unit-testable parser separating text-wrangling from persistence.
- Tolerant parsing: spacing noise, blank lines, missing year, optional attributes, unknown tokens become warnings (never hard failures unless nothing parses).
- Idempotent-ish player-table growth via slug upsert; re-registering known players updates rather than duplicates.

**Non-Goals:**
- The team-split / balancing algorithm (separate later change).
- A polished UI beyond what is needed to call the action (a minimal paste box is acceptable).
- Editing or deleting matches/players, history browsing, or auth/role management.
- Smart NLP on the header (we parse a single known shape, not arbitrary formats).

## Decisions

**1. Pure parser in `src/utils/`, persistence in the service.**
A standalone `parsePlainTeam(raw): ParsedPlainTeam` returns `{ match, players[], warnings[] }` with zero DB access. Rationale: parsing has the most edge cases and is the cheapest to test in isolation; keeping it pure honors the `utils/` "no side effects" rule and keeps the service focused on orchestration. *Alternative considered:* parsing inside the service — rejected; it would couple regex edge-cases to DB mocks in tests.

**2. A single categorical `weight` attribute (Spanish vocabulary).**
For now the only parsed attribute is `weight`, a three-level ordered scale: `pluma` (light/fast) → normal → `tanque` (heavy). `normal` is implicit — it is the absence of a token, so `attributes.weight` stays `undefined`. The recognized token vocabulary (`pluma`, `tanque`) lives as an `as const` map in `src/config/`, and `PlayerAttributes` gains `weight?: 'pluma' | 'tanque'`. Rationale: starts the rating model as simple as possible (one knob the team-split can order players by) while keeping room to add numeric attributes later; centralizes the vocabulary per the config-layer rule; unknown tokens are absent from the map → warning. *Alternatives considered:* a numeric multi-attribute map (`speed`/`stamina`/…) — deferred as premature; free-form raw tags — rejected per the chosen "map known keywords" scope.

**3. Slug as upsert key via `ON CONFLICT`, with in-run duplicate suffixing.**
The parser assigns slugs: a base slug that occurs once is used as-is; when a base slug occurs 2+ times in the same paste, every occurrence gets an incremental suffix by order of appearance (`matias` → `matias-1`, `matias-2`). The player repository then exposes `upsertPlayerBySlug` using Drizzle's `insert().onConflictDoUpdate({ target: player.slug })`. When the line carries no weight token, the update set omits `attributes` so existing values are preserved. Rationale: a single round-trip per player; matches the "upsert players each week" decision and the `slug` unique constraint; the suffix keeps duplicate-named teammates as distinct rows instead of one upserting onto the other.

**4. Service orchestration order.**
`registerMatch(db, parsed)`: parse → if no players, throw → create `match` → create `squad` (status `processed`, linked to match) → for each parsed player `upsertPlayerBySlug` → insert `match_player` rows (`team='unassigned'`, `batch_id=squad.id`) → return `{ matchId, createdCount, updatedCount, warnings }`. Counts come from whether each upsert inserted or updated. Rationale: match and squad must exist before lineup rows can FK to them.

**5. Date resolution.**
Header `DD/MM` with optional `HH:MMhs`; missing year defaults to the current year. A small pure helper resolves this. Rationale: WhatsApp pastes never include the year; current-year is the only sensible default for a weekly fixture.

**6. Validation split.**
A Zod validator in `src/lib/validators/` checks the action input shape (non-empty `raw` text). Deep structural validity is the parser's job (it emits warnings), per the actions rule of "critical-field validation only."

## Risks / Trade-offs

- **Non-transactional multi-step writes (Neon HTTP driver)** → a failure mid-pipeline could leave a match/squad without full lineup. Mitigation: order writes so the squad row is marked `failed` with an error on exception; keep the operation small; accept best-effort for the MVP and note transactional wrapping as a future improvement.
- **Duplicate-name slugs are positional, so weekly upsert idempotency is best-effort for them** → `matias-1`/`matias-2` only map to the same people across weeks if the duplicates keep the same relative order in the paste; a different order (or one week having a single `matias` with no suffix and the next having two) can create extra rows. Mitigation: acceptable for a small, stable team; surface created/updated counts so the organizer notices drift; a manual rename/merge or a stable per-player id can follow in a later change. (Unique names are unaffected — they upsert idempotently.)
- **`attributes.weight` overwrite on re-run** → re-registering a player with a different weight token replaces the stored weight, and a token's absence preserves the prior value (it cannot clear it). Mitigation: intended behavior for the MVP; an explicit "reset to normal" can be added later if needed.
- **Header format drift** (different venue strings, date formats) → parser may mis-read. Mitigation: parse a single documented shape, push anything unrecognized into `warnings`, and surface warnings in the action response so the organizer can correct.
- **Attribute keyword values are arbitrary defaults** → mapped numbers are placeholders until the rating model matures. Mitigation: centralize them in config so they are trivially tunable; the team-split change can refine them.

## Migration Plan

No new DB migration — the entities and migration already exist. Deploy is code-only (new utils/config/validator/repository/service/action files). Rollback is reverting the change; no data shape changes to undo. `pnpm db:migrate` only needs running if the existing entity migration has not yet been applied to the target environment.

## Open Questions

- Resolved — weight vocabulary: start with `pluma` / `tanque` only (`normal` = no token). Additional tokens/attributes can be added to the config map later without a schema change.
- Resolved — duplicate names: append an incremental suffix per run (`matias-1`, `matias-2`). Positional-idempotency caveat noted under Risks; a stable per-player id is a possible future hardening.
