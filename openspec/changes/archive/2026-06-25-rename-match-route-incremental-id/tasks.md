## 1. Schema: UUID → incremental integer

- [x] 1.1 In `src/entities/match/match.schema.ts`, change the `id` column from `uuid('id').primaryKey().defaultRandom()` to `integer('id').primaryKey().generatedAlwaysAsIdentity()`.
- [x] 1.2 In `src/entities/match-player/match-player.schema.ts`, change `match_id` from `uuid` to `integer` (keep `.notNull()`, the `references(() => match.id, { onDelete: 'cascade' })`, and the `(match_id, player_id)` unique constraint).
- [x] 1.3 In `src/entities/squad/squad.schema.ts`, change `match_id` from `uuid` to `integer` (keep `references(() => match.id, { onDelete: 'set null' })`).
- [x] 1.4 Confirm `Match['id']` now infers as `number` (no manual type edit in `match.entity.ts`).

## 2. Type plumbing: string → number

- [x] 2.1 In `src/repositories/match.repository.ts`, change `findMatchById(db, id: string)` param to `number`; leave `InsertMatch` as-is (no `id` field).
- [x] 2.2 In `src/repositories/match-player.repository.ts`, change `InsertMatchPlayer.match_id` to `number` (also `findMatchPlayersByMatch`/`findLineupWithPlayers` matchId params).
- [x] 2.3 In `src/services/transformers.ts`, change `toLineupRows(matchId: string, …)` param to `number` and `RecentMatch.id` to `number` (in `match.service.ts`; also `RegisterMatchResult.matchId`, `getMatchTeams` service param, `balanceMatchTeams` param).
- [x] 2.4 In `src/actions/match.actions.ts`, change the `matchId` param type to `number`; keep the `if (!matchId)` critical-field guard.
- [x] 2.5 In `src/actions/balance.actions.ts`, change the `matchId` param type to `number`; keep the `if (!matchId)` guard.

## 3. Route rename `/matches` → `/partido`

- [x] 3.1 Move `src/app/matches/[id]/` to `src/app/partido/[id]/` (page.tsx + page.client.tsx) with `git mv`.
- [x] 3.2 In `src/app/partido/[id]/page.tsx`, parse the awaited `params.id` with `Number(...)` and return `notFound()` when `Number.isNaN`; pass the resulting `number` to `getMatchTeams`.
- [x] 3.3 In `src/app/page.client.tsx`, update the post-register redirect to `router.push(\`/partido/${res.data.matchId}\`)`.
- [x] 3.4 In `src/components/match/match-list.tsx`, update the link to `href={\`/partido/${match.id}\`}`.
- [x] 3.5 Verify no `/matches` route string remains: `grep -rn "/matches" src/` returns nothing.

## 4. Migration

- [x] 4.1 Run `pnpm db:generate` to produce a new migration; review the SQL recreates the `match` PK and the two FK columns as integer (do not edit existing migrations). NOTE: drizzle-kit emitted `ALTER ... SET DATA TYPE integer`, which Postgres cannot cast from uuid; rewrote the generated migration `20260625025423_clumsy_tombstone.sql` to drop FKs/unique + truncate + drop/recreate columns (same end-state as the snapshot; data disposable).
- [ ] 4.2 Run `pnpm db:migrate` against the test database. (USER — touches live test DB; destructive TRUNCATE of match/match_player/squad.)

## 5. Tests

- [x] 5.1 In `tests/factories/match.factory.ts`, change `id: 'match-1'` and the `match_id: 'match-1'` values to integer `1`.
- [x] 5.2 Update asserts in `tests/services/match.service.test.ts` (`'match-1'` → `1`, `toBe('match-1')` → `toBe(1)`).
- [x] 5.3 Update asserts in `tests/services/balance.service.test.ts` (`'match-1'` → `1`).

## 6. Spec sync

- [x] 6.1 Update `openspec/specs/match-ui/spec.md` route references `/matches/{id}` and `/matches/[id]` → `/partido/...` (delta spec in place; main spec synced on archive).

## 7. Verification

- [x] 7.1 Run `tsc`/`next build` — no type errors (catches any missed `string`→`number` site). `tsc --noEmit` exits 0; caught `InsertSquad.match_id` which was also changed to `number`.
- [x] 7.2 Run the test suite — all green (39/39).
- [ ] 7.3 Smoke test: register a match from `/` → redirects to `/partido/{n}` with an integer id; recent-matches cards link to `/partido/{n}`; a non-numeric `/partido/abc` returns not-found. (USER — needs the running app + migrated DB.)
