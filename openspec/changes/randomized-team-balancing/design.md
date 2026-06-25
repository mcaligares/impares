## Context

`balanceTeams(players)` in `src/services/balance.service.ts` sorts players by score descending and greedily assigns each to the team with the lower running total. This is deterministic: identical input always yields the identical split. As a result the "Rearmar equipos" button — wired to `balanceMatchTeams` → `assignTeam` → `router.refresh()` — recomputes and persists the same teams, so re-drawing looks like a no-op.

The function is pure and unit-tested, and `balanceMatchTeams` persists its output. We want to keep that purity and the existing balance/size guarantees while making re-draws actually vary.

## Goals / Non-Goals

**Goals:**
- Re-running over an unchanged squad produces a different, still-balanced split when alternatives exist.
- Teams stay balanced: minimal total-score gap among sampled partitions, sizes within one player.
- `balanceTeams` remains pure and deterministic under test via an injectable random source.

**Non-Goals:**
- No guaranteed global optimum (exhaustive search). Best-of-N sampling is sufficient for squads of this size.
- No change to scoring, persistence, the server action, or any types/APIs.

## Decisions

**Best-of-N random partitioning.** Run N sampling rounds. Each round shuffles the players (Fisher–Yates) and assigns them respecting the size caps (`ceil`/`floor`), preferring the team with the lower running total to keep the gap small. Track the minimal gap seen; collect every partition that ties that minimum; return one of the collected partitions chosen at random.

- *Why over deterministic greedy:* greedy gives one fixed answer; the user wants variation, which requires sampling.
- *Why over full enumeration:* enumerating all C(n, n/2) splits is exponential and needless for a casual pickup-game roster; N samples give plenty of variety with a tight gap.

**Injectable randomness.** `balanceTeams` accepts an optional random source (defaulting to `Math.random`) so tests pass a seeded/stubbed generator and assert deterministic output. Keeps the function pure per the service-layer conventions.

**Keep size caps and total-score tracking** from the current implementation so even/odd sizing and the minimal-gap behavior are preserved.

## Risks / Trade-offs

- [Sampling may miss the true optimum] → N is chosen comfortably large for realistic roster sizes; the existing greedy result is effectively one of the sampled candidates, so the gap never gets worse than today.
- [Variation not guaranteed every single re-draw] → When only one minimal partition exists, output is necessarily stable; this is correct behavior and covered by a spec scenario.
- [Non-determinism in tests] → Mitigated by the injectable random source; default production path uses `Math.random`.
