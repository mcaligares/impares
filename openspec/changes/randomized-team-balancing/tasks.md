## 1. Implementation

- [x] 1.1 Add an injectable random source param (defaulting to `Math.random`) to `balanceTeams` in `src/services/balance.service.ts`
- [x] 1.2 Add a Fisher–Yates shuffle that consumes the injected random source
- [x] 1.3 Replace the deterministic greedy split with best-of-N sampling: shuffle, assign respecting `ceil`/`floor` size caps preferring the lower-total team, track the minimal total-score gap, and collect all partitions tying that minimum
- [x] 1.4 Return one of the minimal-gap partitions chosen via the random source, preserving the `BalancedTeams` shape (`teamA`/`teamB` with `players` and `totalScore`)
- [x] 1.5 Confirm `balanceMatchTeams` still works unchanged (passes default randomness) and persists the chosen split

## 2. Tests

- [x] 2.1 Update `tests/services/balance.service.test.ts` to keep asserting balance (minimal gap) and size guarantees (sizes differ by at most one, every player assigned)
- [x] 2.2 Add a test using a stubbed random source proving deterministic output under test
- [x] 2.3 Add a test proving re-running varies the teams when multiple minimal-gap partitions exist
- [x] 2.4 Add a test proving a single-optimal-partition squad returns the same split regardless of the random source

## 3. Verification

- [x] 3.1 Run the test suite and type-check; ensure all green
