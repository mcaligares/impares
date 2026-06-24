## Why

Soon the app will let people vote — on the matchup (which teams should face each other) and on player characteristics (what mobility/endurance a player really has, their own or others'). Voting needs a stable, deduplicable identity, but full auth (Better Auth login) is overkill for a casual football group. This change adds the lightweight foundation: an **anonymous local session in a cookie**, plus **identifying the user by a name**. It does NOT add any voting yet — it's the identity layer those features will build on.

## What Changes

- Add a **`voter` entity** (id + name) representing a lightweight, account-less identity.
- Store an **anonymous voter id in an httpOnly cookie** (server-readable), established the moment a user gives their name.
- Add **`identifyVoter(name)`** (server action): creates the voter + sets the cookie on first identification, or updates the name on later ones.
- Add **`getCurrentVoter()`**: reads the cookie and returns the current voter (`{ id, name }`) or `null` if not identified — usable by pages and (future) voting actions.
- Add a **minimal UI** to capture/show the name (a small identity prompt), so identification is actually usable.
- Centralize the cookie config (name, max-age) and a Zod validator for the name.

## Capabilities

### New Capabilities
- `voter-session`: A cookie-based anonymous identity (`voter` = id + name) that lets the app recognize a returning user by name, providing the deduplicable identity that future voting will require.

### Modified Capabilities
<!-- None. This is additive; it does not change register-match, balance-teams or match-ui. -->

## Impact

- **New entity + migration**: `src/entities/voter/` (`voter.schema.ts` + `voter.entity.ts`); `pnpm db:generate` for the new table.
- **New repository**: `voter.repository.ts` (`insertVoter`, `findVoterById`, `updateVoterName`).
- **New service**: `voter.service.ts` (`getVoter`, `saveVoter` — create-or-update; DB only, no cookie).
- **New lib**: `src/lib/session/` cookie helpers (`getVoterId`, `setVoterId`) using the async `cookies()` API (Next 16).
- **New action**: `voter.actions.ts` (`identifyVoter`, `getCurrentVoter`).
- **New config + validator**: `session.config.ts` (cookie name, max-age); `voter.validator.ts` (name).
- **New UI**: a small identity prompt component (name field) + display of the current name.
- **No new dependencies.** Cookies via `next/headers`; the cookie is httpOnly (server-readable, not exposed to JS).
- **Out of scope**: the actual voting (matchup vote, characteristic vote), vote storage, and any tie to Better Auth — all future changes that consume this identity.
