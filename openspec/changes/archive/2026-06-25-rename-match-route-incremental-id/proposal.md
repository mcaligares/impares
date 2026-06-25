## Why

Match URLs today are built on the match's UUID primary key, so sharing a match means sending a long, opaque string (`/matches/3f2a…`). For a casual organizer who shares the link in a chat, a short, human-readable URL like `/partido/4` is far better. This change also moves the route segment to Spanish to match the rest of the app.

## What Changes

- Rename the URL route segment `/matches/[id]` → `/partido/[id]` (move the page + its client orchestrator). **BREAKING**: existing `/matches/...` links stop resolving.
- Update the two in-code URL builders (post-register redirect and the recent-matches link) to point at `/partido/...`.
- Change the `match` primary key from `uuid` to an auto-incrementing integer, so match URLs become short and shareable (`/partido/4`). **BREAKING**: the `match` id type changes from `string` to `number`; existing match/match_player/squad rows are not preserved (acceptable — this is a test project, table data can be dropped).
- Update the foreign keys that reference the match id (`match_player.match_id`, `squad.match_id`) to the new integer type.
- Parse the `[id]` route param as a number and return `notFound()` for non-numeric ids.
- Regenerate the Drizzle migration to reflect the new id and FK types.

Scope is limited to the URL route segment and the match id type. The domain entity, the `src/components/match/` folder, services, actions, and any `match`/`matches` business-concept identifiers are **not** renamed.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `match-ui`: the match page route changes from `/matches/[id]` to `/partido/[id]`, and the match id referenced throughout the route contract changes from a UUID string to an incremental integer.

## Impact

- **Routes**: `src/app/matches/[id]/` → `src/app/partido/[id]/` (`page.tsx` + `page.client.tsx`).
- **URL builders**: `src/app/page.client.tsx` (post-register redirect), `src/components/match/match-list.tsx` (recent-matches link).
- **Schema/entities**: `src/entities/match/match.schema.ts` (PK), `src/entities/match-player/match-player.schema.ts` and `src/entities/squad/squad.schema.ts` (FK columns).
- **Type plumbing (`string` → `number`)**: `src/repositories/match.repository.ts`, `src/repositories/match-player.repository.ts`, `src/services/transformers.ts`, `src/actions/match.actions.ts`, `src/actions/balance.actions.ts`.
- **Migrations**: new Drizzle migration via `pnpm db:generate`; existing migrations untouched. Destructive — match-related table data is dropped/regenerated.
- **Tests**: `tests/factories/match.factory.ts` and the asserts in `tests/services/match.service.test.ts` and `tests/services/balance.service.test.ts` move from `'match-1'` to integer ids.
- **Spec**: `openspec/specs/match-ui/spec.md` route references.
