## Why

The balancing algorithm is fully deterministic: it sorts players by score and assigns them greedily, so re-running over the same squad always yields the identical split. The "Rearmar equipos" button therefore appears to do nothing — it recomputes and persists the exact same teams every time, which is not what users expect from a "re-draw" action.

## What Changes

- Replace the deterministic greedy split with a **best-of-N random** strategy: sample several random partitions, keep the ones whose total-score gap is minimal, and pick one of those at random.
- Re-running the balance over an unchanged squad SHALL produce a genuinely different team composition whenever more than one near-minimal partition exists, while still keeping the two teams balanced (minimal score gap) and team sizes within one player of each other.
- Keep `balanceTeams(players)` a pure, testable function; randomness is injected so it can be made deterministic under test.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `balance-teams`: the "Split players into two balanced teams" requirement gains a randomized selection among minimal-gap partitions; the "Re-draw overwrites the previous teams" requirement now guarantees variation across re-runs when alternatives exist.

## Impact

- `src/services/balance.service.ts`: `balanceTeams` rewritten to sample random partitions and select among the most balanced ones.
- Tests for `balanceTeams`: balance and size guarantees still hold; new coverage for variation across runs and for deterministic behavior when only one optimal partition exists.
- No API, schema, or server-action signature changes — `balanceMatchTeams` and the `balanceTeams` server action keep their contracts.
