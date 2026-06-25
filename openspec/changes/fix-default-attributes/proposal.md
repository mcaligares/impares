## Why

Loading a list **without characteristics** showed inconsistent values instead of a sane default. Root cause: when a line had no characteristic, the parser left it `undefined`, `toPlayerAttributes` returned `undefined`, and `upsertPlayerBySlug` **omitted `attributes` from the UPDATE** — so the result depended on whatever was (or wasn't) already stored, in a way that wasn't intentional, and a partial line (only one value) could even wipe the other.

## What Changes

- **Resolve each characteristic as: list value → stored value → 3.** If the line provides the value, use it; if not but the player already has one stored, **keep it**; default to **3 only when the player never had a value**. To do this, registration now reads the existing player (`findPlayerBySlug`) and merges per attribute.
- The resolved `{ mobility, endurance }` is **always written**, so a never-rated player is stored as an explicit 3/3 (not `null`), and a partial line never wipes the other attribute.
- "3" comes from `scoringConfig.baselineRating` (single source for the medium).

## Capabilities

### Modified Capabilities
- `register-match`: a player's characteristics are resolved as list value → previously stored value → 3, and always written. Known ratings are preserved across reloads; 3 is used only when none was ever set.

### New Capabilities
<!-- None. Bug fix to existing behavior. -->

## Impact

- **`src/repositories/player.repository.ts`** — add `findPlayerBySlug(db, slug)` (read existing before merging).
- **`src/services/transformers.ts`** — `resolvePlayerAttributes(input, existing)` merges list value → stored value → `scoringConfig.baselineRating`, always returning `{ mobility, endurance }`.
- **`src/services/match.service.ts`** — `registerMatch` reads the existing player and resolves attributes before upserting.
- **Display / scoring** already fall back to 3; unchanged.
- **Tests**: `resolvePlayerAttributes` merge cases + `registerMatch` preserves a stored value and uses 3 only when never set.
- **No schema change, no migration, no new dependencies.**
- **Out of scope**: scoring weights, the 1–5 scale.
