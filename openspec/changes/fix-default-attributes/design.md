## Context

When a pasted line omits a characteristic, the chain `parsePlainTeam` → `toPlayerAttributes` → `upsertPlayerBySlug` produced `undefined` attributes and the upsert omitted the column, so the stored result was unintentional (and a partial line could wipe the other attribute). The intended rule: a characteristic is the list value if given, otherwise the player's known value, otherwise the medium (3).

## Goals / Non-Goals

**Goals:**
- Per attribute: list value → stored value → 3.
- Always write the resolved `{ mobility, endurance }` (never `undefined`; never wipe the untouched attribute).
- One source of truth for "3".

**Non-Goals:**
- Changing the 1–5 scale, scoring weights, or display/scoring fallbacks.
- Schema/migration changes.

## Decisions

**1. Merge against the existing player; resolve in `resolvePlayerAttributes`.**
`registerMatch` reads the current player with `findPlayerBySlug` and calls `resolvePlayerAttributes(parsed, existing?.attributes ?? null)`, which returns `{ mobility: parsed.mobility ?? existing?.mobility ?? base, endurance: parsed.endurance ?? existing?.endurance ?? base }`. The result is always defined, so the upsert always writes it. *Rationale:* the "keep known value" rule needs the existing value, which only the service (with a read) has; doing it here is explicit and unit-testable. *Alternative considered:* a jsonb `coalesce`/merge in SQL — rejected as harder to read and to default the never-set case to 3.

**2. `base` = `scoringConfig.baselineRating` (existing 3).**
Single source so the load default and the scoring baseline never diverge.

**3. One extra read per player.**
`findPlayerBySlug` before the upsert adds one query per player (~14). Acceptable; keeps the merge in clear application code.

## Risks / Trade-offs

- **Read-then-upsert is not atomic.** A concurrent change between the read and the upsert could be missed. Acceptable for this casual, single-organizer flow.
- **Known values persist across reloads** (by design now): to change a rating you must provide it in the list; a no-value reload keeps the last known one.

## Migration Plan

Code-only; no DB migration. Rollback is reverting the change.

## Open Questions

- None.
