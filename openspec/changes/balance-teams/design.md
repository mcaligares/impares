## Context

`register-match` leaves a match's confirmed players as `match_player` rows with `team = 'unassigned'`. This change consumes those rows and assigns each to team `a` or `b`. The balancing signals are the player's `mobility` and `endurance` (1–5 each), stored in `attributes` jsonb and parsed from the pasted list; more attributes will be added later, so balancing is driven by a **score** (a weighted sum) rather than any single attribute.

The project's layered conventions apply: pure logic in small functions, services orchestrate and own the try/catch-free business logic, repositories are SQL resolvers, the action is the `'use server'` boundary.

## Goals / Non-Goals

**Goals:**
- A pure, extensible `scorePlayer(attributes)` — a weighted sum over `mobility`/`endurance` (1–5); adding attributes later must not change callers.
- A pure `balanceTeams(players)` that splits into A/B minimizing total-score difference, sizes differing by at most one.
- Persist the assignment (overwrite on re-draw), scoped to one match.
- A server action returning both teams with totals.

**Non-Goals:**
- UI.
- Exact-optimal partitioning — a greedy balancer is enough for ~14 players.
- New scoring attributes beyond `mobility`/`endurance` (the function is just built to accept them).
- Locking/concurrency for simultaneous re-draws.

## Decisions

**1. Score is a separate pure function: a weighted sum over 1–5 attributes.**
`scorePlayer(attributes): number` in `scoring.service.ts` computes `mobility·w_mobility + endurance·w_endurance`, reading the 1–5 ratings from `attributes` and the per-attribute weights + baseline from `scoringConfig`. A missing attribute uses the baseline rating (3). Starting weights are `mobility` 1.0 and `endurance` 1.3 (endurance weighted ~30% more, ≈56% of the score), tunable in config; score range is 2.3–11.5. Adding an attribute later means adding one term inside this function — callers (`balanceTeams`) keep using `score`. *Alternative considered:* one categorical weight token — rejected; it doesn't extend to multiple graded attributes.

**2. Greedy balancer, sorted descending.**
`balanceTeams(players)`: sort by score descending, then assign each player to the team with the lower running total — but only among teams that still have capacity (so sizes stay within one). This is the classic greedy partition heuristic: O(n log n), deterministic, and near-optimal for small n with a small score range. *Alternatives considered:* exact DP/subset-sum partition — unnecessary complexity for ~14 players; random + retry — non-deterministic, harder to test.

**3. Odd players: capacity caps of `ceil(n/2)` and `floor(n/2)`.**
With odd n, one team caps at `ceil(n/2)`, the other at `floor(n/2)`. The descending-greedy naturally tends to hand the extra (lower) player to the team that is behind on score, which offsets the count advantage. The objective remains "minimize total-score difference."

**4. Service orchestration (overwrite on re-draw).**
`balanceMatchTeams(db, matchId)`: load the match's `match_player` rows → if none, throw → score each → `balanceTeams` → for each row, update `team` to `a`/`b` (overwriting any previous value) → return both teams with totals. Re-draw is just running this again; updates overwrite, so no "already assigned" guard is needed (per the user's choice).

**5. Action shape.**
`balanceTeams(matchId)` in `balance.actions.ts` (`'use server'`, try/catch, typed `ActionResponse`). Returns `{ teamA: { players, totalScore }, teamB: { players, totalScore } }`. The action validates only that `matchId` is present (critical-field validation).

**6. Attribute model and paste format (modifies register-match).**
`PlayerAttributes` becomes `{ mobility?: 1..5, endurance?: 1..5 }` (jsonb, no migration). Attributes come from the pasted list, not self-assessment: `parsePlainTeam` reads `name,mobility,endurance` — fixed order, integers 1–5; a missing trailing value uses the baseline, and out-of-range/non-numeric tokens are clamped or warned. This replaces the `pluma`/`tanque` token; `parserConfig` holds the attribute order and valid range. *Note:* the badge/description display (Fideo…, Abeja…) is a future UI concern — only the numeric 1–5 is stored and scored here.

## Risks / Trade-offs

- **Greedy is not guaranteed optimal** → for pathological score distributions the split could be slightly uneven. Mitigation: acceptable for a recreational match with a narrow score range; the function is swappable for an exact partitioner later behind the same signature.
- **Count advantage on odd teams isn't formally modeled** → "minimize total-score difference" treats a 7-vs-6 split by sum, not per-capita. Mitigation: the descending-greedy gives the trailing team the extra player, which empirically offsets it; a per-capita or handicap objective is a future refinement (Open Question).
- **Non-transactional multi-row updates (Neon HTTP)** → a mid-update failure could leave teams partially overwritten. Mitigation: small operation; persist via a single bulk update where possible; acceptable for the MVP.
- **Re-draw is deterministic** → the same input always yields the same split, so a user who "doesn't like it" gets the same teams again. Mitigation: noted; optional seeded variation is a future option, not in scope.

## Migration Plan

No DB migration — uses the existing `match_player.team` enum. Code-only: new scoring/balance services, config, repository reads/updates, and the action. Rollback is reverting the change.

## Open Questions

- Per-attribute importance weights (starting point: `mobility` 1.0, `endurance` 1.3) — tune once real matches are played.
- Whether odd-team fairness should use a per-capita or handicap objective instead of raw total-score difference — deferred.
- Future attributes to fold into `scorePlayer` (technique, passing, finishing, defending, speed, tactical) and their relative weights.
