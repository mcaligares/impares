## 1. Fix

- [x] 1.1 Add `findPlayerBySlug(db, slug)` to `src/repositories/player.repository.ts`.
- [x] 1.2 Add `resolvePlayerAttributes(input, existing)` in `src/services/transformers.ts` (list value → stored value → `scoringConfig.baselineRating`; always returns `{ mobility, endurance }`). Replaces `toPlayerAttributes`.
- [x] 1.3 In `registerMatch`, read the existing player and resolve attributes before upserting.

## 2. Tests

- [x] 2.1 Unit tests for `resolvePlayerAttributes`: list value used; stored value preserved when list omits; 3 only when neither; list overrides stored.
- [x] 2.2 `registerMatch` test: a no-characteristic line preserves the stored value, and uses 3 only when the player never had one.

## 3. Verification

- [x] 3.1 `npx tsc --noEmit` and `pnpm test` green.
- [ ] 3.2 (Optional, needs DB) `pnpm dev`: reload a player without values → keeps their known rating; a brand-new player without values → 3/3.
