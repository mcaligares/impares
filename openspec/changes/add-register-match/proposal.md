## Why

Each week the team organizer collects the list of confirmed players in a WhatsApp group and needs them in the system to generate two balanced teams. Today there is no way to get that list into the database — it must be retyped player by player. This change lets the organizer paste the WhatsApp message as-is and have the match, the confirmed squad, and the players created in one step, ready for the team-split feature that follows.

## What Changes

- Add a **register-match** capability: paste raw WhatsApp text → parsed and persisted in one action.
- Parse the **header line** (e.g. `Futbol Lujan - 10/06 20:30hs`) into a `match` (date, time, location), defaulting the year to the current year when omitted.
- Parse **numbered player lines** (`1- mati`, `10 - Nico`, `11-migue,fast`), tolerant of spacing and ordering noise from a copy-paste.
- **Upsert** each player into the player table by a generated `slug` (admin-managed, no auth link), creating new players and updating existing ones.
- Parse **optional attribute tokens** after a comma (e.g. `fast`) and map a known keyword vocabulary into the player's `attributes` jsonb. Unknown tokens are ignored.
- Record the run as a **squad** batch row (source text, status, counts) for audit/logging.
- Link every registered player to the match via **match_player** rows (team = `unassigned`), leaving them ready for the next step (team split).
- Surface a typed result (created/updated counts, parse warnings, the match id) so the UI can confirm what was registered.

## Capabilities

### New Capabilities
- `register-match`: Accept a pasted WhatsApp plain-team message, parse the match header and numbered player lines (with optional attribute tokens), upsert players, record a squad batch, and link confirmed players to the match as an unassigned lineup awaiting the team split.

### Modified Capabilities
<!-- None — this is the first capability in the project; the team-split step will be a separate later change. -->

## Impact

- **New layers (per project conventions)**:
  - `src/lib/validators/` — Zod schema for the input.
  - `src/utils/` — a pure parser that turns raw text into a structured `{ match, players[] }` result (no DB).
  - `src/repositories/` — `player`, `match`, `squad`, `match_player` SQL resolvers.
  - `src/services/` — orchestration: parse → upsert players → create match + squad → insert lineup; plus the keyword→attributes transformer.
  - `src/actions/` — `registerMatchFromText` server action returning a typed response.
- **Existing schema**: uses the already-created `player`, `match`, `squad`, `match_player` entities (no schema changes expected).
- **No new dependencies**: parsing is plain TypeScript; persistence uses Drizzle + Zod already in the stack.
- **Out of scope**: the team-split algorithm and any UI page beyond what is needed to invoke the action.
