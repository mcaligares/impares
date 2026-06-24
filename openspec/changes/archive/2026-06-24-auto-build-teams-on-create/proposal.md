## Why

Today registering a match and splitting it into teams are two separate, manual steps: the organizer pastes the list and creates the match (everyone lands `unassigned`), then opens the match page and clicks "Armar equipos" to balance. The split is the whole point of creating the match — there is no reason to make the organizer ask for it a second time. Folding the balance into "Crear partido" removes a click and an intermediate empty state, so the organizer goes straight from a pasted list to two balanced teams.

## What Changes

- "Crear partido" registers the match **and** balances the squad into teams A/B in a single operation, before navigating.
- The organizer lands directly on `/matches/{id}` with the teams already divided — no manual "Armar equipos" step for a freshly created match.
- **BREAKING**: A newly registered match no longer starts as an all-`unassigned` lineup; players are persisted already assigned to team `a`/`b`.
- Balancing becomes part of the registration transaction: if the squad cannot be balanced (e.g. too few players), the **whole creation is aborted** — no match, no squad, no players are left behind — and the error is shown on the landing form.
- The match page keeps its existing built-state view and "Rearmar equipos" (re-draw) control unchanged; only the entry path changes.

## Capabilities

### New Capabilities
<!-- None — this reuses the existing balance capability inside the registration flow. -->

### Modified Capabilities

- `register-match`: Registration now balances the squad and persists players as assigned to team `a`/`b` (instead of `unassigned`), as part of the same operation; the operation aborts atomically when the squad cannot be balanced.
- `match-ui`: The landing page lands the organizer on an already-built match, and the match page presents divided teams immediately for newly created matches (no manual build step required to reach the built state).

## Impact

- **Actions**: `registerMatchFromText` (`src/actions/match.actions.ts`) — composes balancing into the register pipeline and surfaces a balance failure as a registration failure; reuses `balanceTeams`/`balanceMatchTeams` logic.
- **Services**: `registerMatch` (`src/services/match.service.ts`) and `balanceMatchTeams` (`src/services/balance.service.ts`) — invoked together atomically; `toLineupRows` (`src/services/transformers.ts`) no longer fixes `team` to `unassigned` as the terminal state.
- **UI**: `HomeClient` / `RegisterForm` (`src/app/page.client.tsx`, `src/components/match/register-form.tsx`) — unchanged behavior on success (navigate), but now navigates to a built match; error path covers the new "cannot balance" case.
- **Unchanged**: `balanceTeams` algorithm, `TeamBoard` built/re-draw view, `getMatchTeams` read action. The `match_player.team = unassigned` state still exists in the schema as a fallback but is no longer the normal post-registration state.
