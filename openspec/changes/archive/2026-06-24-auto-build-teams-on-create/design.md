## Context

Registration and balancing are today two independent operations wired through separate actions:

- `registerMatchFromText` (`src/actions/match.actions.ts`) → `registerMatch` (`src/services/match.service.ts`) inserts the match, squad, players, and lineup, with every `match_player.team` fixed to `unassigned` by `toLineupRows` (`src/services/transformers.ts`).
- `balanceTeams` (`src/actions/balance.actions.ts`) → `balanceMatchTeams` (`src/services/balance.service.ts`) later reads the persisted players, scores them (`scorePlayer`), runs the pure `balanceTeams(players)` algorithm, and writes `team` = `a`/`b` via `assignTeam` (`src/repositories/match-player.repository.ts`).

The match page (`/matches/[id]`) drives the second step on demand and is the only place a built-vs-unassigned state matters. This change collapses the two steps so a successful "Crear partido" yields an already-balanced match, and a balancing failure aborts the whole creation (per the organizer's decision). The match page and its re-draw path are unchanged.

## Goals / Non-Goals

**Goals:**
- A single user action ("Crear partido") parses, persists, and balances in one atomic operation.
- Players are written with their final `team` (`a`/`b`) at registration time — no intermediate `unassigned` round-trip.
- On any balancing failure (including too few players) nothing is persisted; the form shows the error.
- Reuse the existing pure balancing and scoring logic unchanged.

**Non-Goals:**
- Changing the balancing algorithm, scoring weights, or badge/UI rendering.
- Removing the unassigned roster + "Build teams" path from the match page — it stays as a fallback for any match that is still unassigned.
- Changing the re-draw ("Rearmar equipos") behavior on the match page.

## Decisions

### Decision: Balance in-memory before persisting the lineup, inside the registration transaction

Compute the team split from the parsed-and-scored players **before** writing `match_player` rows, and write each row with its final `team`. The split runs over the same `ScoredPlayer` values the registration pipeline already has in hand, reusing `scorePlayer` + the pure `balanceTeams(players)` from `balance.service.ts`. `toLineupRows` is changed to accept a per-player team assignment instead of hard-coding `unassigned`.

- **Why over the alternative** (persist as unassigned, then call `balanceMatchTeams` which re-reads from the DB): the read-back approach needs a second DB round-trip and a second write, and makes atomicity awkward — if the second step fails we must delete the just-created match/squad/players. Balancing in-memory keeps the whole thing in one transaction with a single lineup write, and there is no transient `unassigned` state to clean up.
- **Trade-off**: two balancing entry points now exist — the in-memory split at registration and the DB-backed `balanceMatchTeams` used by re-draw. Both delegate to the same pure `balanceTeams(players)` core, so the algorithm stays single-sourced; only the load/persist wrapper differs.

### Decision: Guarantee atomic abort structurally, not via a DB transaction

**Constraint discovered during apply:** the DB client is `drizzle-orm/neon-http`, whose transaction support cannot run interactive transactions where later statements depend on earlier returned values. `registerMatch` upserts each player sequentially and needs the returned player id to build the lineup, so a true rollback transaction is not feasible here without restructuring (e.g. a single batch upsert). Rather than introduce a broken/partial transaction, the abort guarantee is provided structurally:

- The only abort trigger — too few players to form two teams — is checked **before the first insert** (in `registerMatch`, and again in the action for a precise user-facing message). When it trips, no match, squad, player, or lineup row is ever written.
- Balancing is a **pure, total** function (`balanceTeams`) computed **before** the lineup is persisted, so it cannot throw mid-pipeline and cannot leave a half-built, un-split match.

The squad's `failed` status path (raw text + error message) remains reserved for genuine persistence failures (e.g. a DB error during an upsert), unchanged from today.

- **Why**: the organizer chose "abort creation" over "create unsplit". A half-created match with no teams is exactly the state we are trying to eliminate — and the structural approach eliminates it for the realistic failure modes without depending on transaction semantics the driver does not offer.

### Decision: Reject squads too small to form two teams before writing anything

A squad must have at least 2 players to form two teams (sizes differ by at most one). Fewer than 2 is treated as an unbalanceable squad: the action fails with a user-facing message and writes nothing. This check happens after parsing and before/within the transaction so it costs nothing when it trips.

- **Alternative considered**: a higher minimum (e.g. 6 or 10 for a "real" match). Rejected for now — the user didn't specify a football-team minimum, and the balancing algorithm is correct for any count ≥ 2. A stricter minimum can be added later as a parse/validation rule without touching this design.

### Decision: Keep the action surface stable

`registerMatchFromText` keeps its signature and success shape `{ matchId, createdCount, updatedCount, warnings[] }`. `HomeClient`/`RegisterForm` need no behavioral change on success (still `router.push('/matches/{id}')`); they only gain coverage of the new "cannot balance" failure message, which flows through the existing error path.

## Risks / Trade-offs

- [Two balancing call sites could drift] → Both route through the single pure `balanceTeams(players)` core; only the surrounding load/persist differs. No algorithm duplication.
- [Hidden callers of `registerMatch`/`toLineupRows` expecting `unassigned`] → Audit references before editing; `toLineupRows` gains a required assignment input so any stale caller fails to compile rather than silently writing `unassigned`.
- [Minimum-players threshold is a product guess] → Documented as ≥ 2 with rationale; easy to raise later as a separate validation rule.
- [Transaction scope] → Confirm `registerMatch` runs its inserts in one transaction; if it does not today, wrapping it is part of this change so the abort guarantee holds.

## Open Questions

- Is there a desired *football* minimum (e.g. don't allow a 3-player match)? Current design enforces only the algorithmic minimum of 2; raising it is a one-line validation change if the organizer wants it.
