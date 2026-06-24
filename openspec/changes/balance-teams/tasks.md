## 1. Attribute model & parser (modifies register-match)

- [x] 1.1 Update `PlayerAttributes` in `src/entities/player/player.schema.ts` to `{ mobility?: number; endurance?: number }` (1–5); drop the old `weight`/placeholder fields and `PlayerWeight`.
- [x] 1.2 Update `parserConfig` (`src/config/parser.config.ts`): attribute order (`mobility`, `endurance`) and valid range (1–5).
- [x] 1.3 Update `parsePlainTeam` to read `name,mobility,endurance` (integers 1–5 in fixed order; missing → undefined; non-numeric/out-of-range → warning).
- [x] 1.4 Update the parser tests for the new numeric format; drop the `pluma`/`tanque` tests.

## 2. Scoring

- [x] 2.1 Add `scoringConfig` in `src/config/scoring.config.ts` (`as const`): per-attribute weights (`mobility` 1.0, `endurance` 1.3) and the baseline rating (3).
- [x] 2.2 Implement pure `scorePlayer(attributes)` in `src/services/scoring.service.ts`: weighted sum `mobility·w + endurance·w`, using the baseline (3) for missing attributes. Structure it so more attributes add terms later.

## 3. Balancing algorithm

- [x] 3.1 Implement pure `balanceTeams(players)` in `src/services/balance.service.ts`: sort by score desc, greedily assign each to the lower-total team that still has capacity (`ceil(n/2)` / `floor(n/2)`). Return `{ teamA, teamB }` with members and totals.
- [x] 3.2 Define the shared types (`ScoredPlayer`, `BalancedTeams`) co-located with the balancer.

## 4. Repository

- [x] 4.1 `match-player.repository.ts`: add `findMatchPlayersByMatch(db, matchId)` (try-catch, timed `logger.repo`).
- [x] 4.2 `match-player.repository.ts`: add a team-assignment update (`updateMatchPlayerTeam` or bulk) to persist `a`/`b`.

## 5. Service orchestration

- [x] 5.1 Implement `balanceMatchTeams(db, matchId)` in `src/services/balance.service.ts`: load lineup → throw if empty → `scorePlayer` each → `balanceTeams` → persist `team` (overwrite) → return both teams with totals.
- [x] 5.2 Use a transformer (no inline `.map()`) to shape players into the scored input and to build the response teams.

## 6. Action

- [x] 6.1 `src/actions/balance.actions.ts`: `balanceTeams(matchId)` server action (`'use server'`, try-catch, `logger.action`) returning a typed `ActionResponse` with `{ teamA, teamB }` or a user-facing error. Validate that `matchId` is present.

## 7. Tests

- [x] 7.1 Unit tests for `scorePlayer` (weighted sum, missing attribute → baseline, no attributes → baseline).
- [x] 7.2 Unit tests for `balanceTeams` (even split, odd split sizes differ by one, every player assigned, minimized score gap on a known set).
- [x] 7.3 Add factories for scored players as needed.
- [x] 7.4 Service test for `balanceMatchTeams` with mocked repositories: persists `a`/`b` for all rows, overwrite on re-run, throws on empty match.

## 8. Verification

- [x] 8.1 Run `npx tsc --noEmit` and `pnpm test`; fix any failures (incl. register-match parser tests for the new format).
- [x] 8.2 Run `/audit` (or the convention-checker) on the new/changed files and resolve violations.
