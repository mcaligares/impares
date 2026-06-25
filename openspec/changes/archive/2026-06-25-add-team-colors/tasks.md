## 1. Schema & config

- [x] 1.1 Add `team_a_color` and `team_b_color` (`text`, nullable) to `src/entities/match/match.schema.ts`.
- [x] 1.2 `pnpm db:generate` to emit the migration (do not run `db:migrate` here).
- [x] 1.3 Add `src/config/color.config.ts` (`as const`): a curated hue-spread team palette (hex), none equal to the brand cyan, no near-cyan blues or greens.

## 2. Pick & persist

- [x] 2.1 Add `pickTwoColors(palette, rng = Math.random)` (pure with injectable rng) returning two distinct palette entries.
- [x] 2.2 In `registerMatch`, pick the two colors and pass `team_a_color` / `team_b_color` to `insertMatch`; extend `insertMatch` (repo) to accept them.
- [x] 2.3 Extend `getMatchTeams` to return the match's `team_a_color` / `team_b_color` (or null) so the UI can render them.

## 3. UI

- [x] 3.1 `PlayerCard`: accept a color value and apply the accent bar via inline `style`; fall back to the default when none is given.
- [x] 3.2 `TeamBoard`: pass each team's color down; apply it to the team name and the column container (border/glow) via inline `style`; fall back to the current `team-a`/`team-b` defaults when the match has no stored colors.

## 4. Tests

- [x] 4.1 Unit test `pickTwoColors`: returns two entries from the palette that are never equal (with a stubbed rng, including the collision case where the first pick repeats).
- [x] 4.2 `registerMatch` test: a created match is given two distinct colors and they are passed to `insertMatch`.

## 5. Verification

- [x] 5.1 `npx tsc --noEmit` and `pnpm test` green.
- [ ] 5.2 (Optional, needs DB) `pnpm dev`: create a match → teams show two distinct non-cyan colors; reload / re-draw → same colors.
