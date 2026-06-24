## 1. Balance the lineup at registration time

- [x] 1.1 Change `toLineupRows` (`src/services/transformers.ts`) to derive each row's `team` from the `BalancedTeams` result instead of hard-coding `team: 'unassigned'`; it now takes the balanced split as a required argument.
- [x] 1.2 In `registerMatch` (`src/services/match.service.ts`), after building the `lineup` array, score each player with `scorePlayer` (via the new `toScoredLineup` transformer) and run the pure `balanceTeams(players)` from `balance.service.ts` to produce A/B assignments keyed by `playerId`.
- [x] 1.3 Pass the balanced result into `toLineupRows` so `insertMatchPlayers` writes each `match_player` row with its final `team` (`a`/`b`) — no transient `unassigned` write.
- [x] 1.4 Reuse the existing pure `balanceTeams(players)` core for both the registration path and `balanceMatchTeams` (re-draw) — no duplicated algorithm.

## 2. Abort when the squad cannot be balanced

- [x] 2.1 Add an up-front guard: a parsed squad with fewer than `balanceConfig.minPlayers` (2) is rejected — in `registerMatch` before any `insertMatch`/`insertSquad`, and in `registerMatchFromText` before calling the service — so nothing is written.
- [x] 2.2 Guarantee atomic abort structurally instead of via a DB transaction. **Constraint discovered:** the DB client is `drizzle-orm/neon-http`, which does not support interactive transactions whose later statements depend on earlier returned IDs (exactly what the sequential player upserts need), so a real rollback transaction is not feasible without restructuring. Resolution: balancing is a pure, total function computed **before** the lineup is persisted, and the only abort trigger (too few players) is checked **before** the first insert — so no balance failure can ever leave a partial match/squad/lineup. The pre-existing `status: 'failed'` squad path still covers genuine mid-pipeline persistence errors (unchanged behavior).
- [x] 2.3 Surface the failure through `registerMatchFromText` (`src/actions/match.actions.ts`) as a typed `too-few-players` failure response with a user-facing message; no partial success returned.

## 3. UI wiring

- [x] 3.1 Confirmed `HomeClient` (`src/app/page.client.tsx`) still navigates to `/matches/{id}` on success and renders the failure `message` (incl. the new too-few-players message) through the existing error path — no component change needed.
- [x] 3.2 Confirmed the match page opens a freshly registered match directly in the built state (teams are persisted `a`/`b`, so `getMatchTeams` returns populated A/B and `TeamBoard` renders the built view); "Rearmar equipos" (re-draw) and the unassigned-roster fallback are untouched.

## 4. Tests & verification

- [x] 4.1 Updated the `registerMatch` service test: a valid squad persists players split into balanced A/B teams with none left `unassigned`.
- [x] 4.2 Added a service test that a squad with fewer than 2 players aborts and writes nothing (no `insertMatch`/`insertSquad`/`upsert`/`insertMatchPlayers`), plus an action test for the too-few-players message.
- [x] 4.3 Updated the existing `registerMatch` tests that assumed `unassigned` players / a single-player pipeline.
- [x] 4.4 Ran type-check (`tsc --noEmit`, clean), the full test suite (33 passing), and lint (clean) on the changed files. Manual app verification still recommended before merge.
