## Why

Once a match is registered, its confirmed players sit in the lineup as `unassigned`. The whole point of impares is to split them into two **balanced** teams so the game is fair. Today that split is manual; this change automates it with a scoring-based balancing algorithm.

## What Changes

- Redefine the `PlayerAttributes` type (the `attributes` jsonb) to `{ mobility?: 1..5, endurance?: 1..5 }`, replacing the old `weight` token. jsonb stays, so no DB migration.
- Update the `register-match` parser to read the new attributes from the pasted list — `name,mobility,endurance` (fixed order, numbers 1–5; a missing value uses the baseline 3) — replacing the `pluma`/`tanque` token.
- Add a **player scoring** function: turn a player's `attributes` into a numeric score as a **weighted sum** (`mobility·w + endurance·w`), each attribute self-rated 1–5, a missing value using the baseline (3). Per-attribute importance weights live in config, and more attributes can be folded in later without changing callers.
- Add a **balancing algorithm**: partition a match's confirmed players into team **A** and team **B**, minimizing the difference in total team score so neither side has an advantage.
- **Always two teams.** With an odd number of players one team has one extra; the balancing compensates via score so the count advantage is offset.
- **Re-draw overwrites**: running the balance again recomputes and reassigns A/B over the same players (useful when the result isn't liked).
- Persist the result by setting each `match_player.team` to `a` or `b`.
- Expose it through a **server action** that takes a `matchId` and returns the two teams with their totals. No UI in this change.

## Capabilities

### New Capabilities
- `balance-teams`: Score a match's confirmed players from their attributes and split them into two teams (A/B) balanced by total score, persisting the assignment and supporting re-draw.

### Modified Capabilities
- `register-match`: the pasted-list parser reads `mobility`/`endurance` numbers (1–5, fixed order) instead of the `pluma`/`tanque` weight token.

## Impact

- **New code (per project conventions)**:
  - `src/services/scoring.service.ts` — pure `scorePlayer(attributes)`; the extensible scoring surface.
  - `src/services/balance.service.ts` — pure `balanceTeams(players)` partitioner + the orchestrating `balanceMatchTeams(db, matchId)` (load → score → balance → persist, overwrite).
  - `src/actions/balance.actions.ts` — `balanceTeams(matchId)` server action.
  - `src/config/scoring.config.ts` — per-attribute weights and the baseline, centralized for tuning.
- **Changed code**:
  - `src/entities/player/player.schema.ts` — `PlayerAttributes` type → `{ mobility?, endurance? }` (1–5). Type only; no migration.
  - `src/services/parser.service.ts` + `src/config/parser.config.ts` — parse `mobility,endurance` numbers from the pasted list instead of the weight token.
- **Repositories**: extend `match-player.repository.ts` with reads of a match's lineup and a team-assignment update.
- **Existing schema**: uses the current `match_player.team` enum (`a` / `b` / `unassigned`); no schema changes.
- **No new dependencies.**
- **Out of scope**: UI, scoring attributes beyond `mobility`/`endurance`, the badge/description display layer, and exact-optimal partitioning (a greedy balancer is enough for ~14 players).
