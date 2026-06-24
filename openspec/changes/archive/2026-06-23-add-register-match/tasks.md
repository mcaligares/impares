## 1. Config & types

- [x] 1.1 Add `parserConfig` (or extend an existing config) in `src/config/` with the weight token vocabulary as `as const`: `pluma` and `tanque` (no token = `normal` default).
- [x] 1.2 Extend `PlayerAttributes` in `src/entities/player/player.schema.ts` with `weight?: 'pluma' | 'tanque'` (add a `PlayerWeight` alias). No DB migration needed (jsonb field).
- [x] 1.3 Define shared parser types (`ParsedPlainTeam`, `ParsedPlayer`, `ParseWarning`) co-located with the parser util.

## 2. Pure parser (utils)

- [x] 2.1 Implement `slugify(name)` in `src/utils/` (lowercase, strip diacritics, hyphenate non-alphanumeric runs). Cover `Don Carlos`→`don-carlos`, `Germán`→`german`.
- [x] 2.2 Implement duplicate-slug disambiguation across the parsed list: base slugs appearing 2+ times get incremental suffixes by order of appearance (`matias-1`, `matias-2`); single occurrences stay unsuffixed.
- [x] 2.3 Implement a header parser that extracts title/location, `DD/MM`, and optional `HH:MM`, defaulting the year to the current year.
- [x] 2.4 Implement `parsePlainTeam(raw): ParsedPlainTeam` — split lines, match the header, match numbered player lines, tolerate spacing/blank/noise lines, and collect warnings.
- [x] 2.5 Parse the optional comma weight token, mapping `pluma`/`tanque` via the config to `attributes.weight` and pushing unknown tokens to `warnings`.

## 3. Validator

- [x] 3.1 Add a Zod schema + inferred type in `src/lib/validators/` validating the action input (non-empty `raw` text).

## 4. Repositories

- [x] 4.1 `src/repositories/match.repository.ts`: `insertMatch` (try-catch, timed `logger.repo` logging).
- [x] 4.2 `src/repositories/squad.repository.ts`: `insertSquad` and `updateSquadStatus`.
- [x] 4.3 `src/repositories/player.repository.ts`: `upsertPlayerBySlug` using `onConflictDoUpdate` on `slug`, returning the row plus whether it was inserted or updated.
- [x] 4.4 `src/repositories/match-player.repository.ts`: `insertMatchPlayer` (and/or batch insert) for the lineup rows.

## 5. Service

- [x] 5.1 Add a transformer that folds matched keyword tokens into a `PlayerAttributes` object (no inline `.map()` in the service).
- [x] 5.2 Implement `registerMatch(db, parsed)` in `src/services/match.service.ts`: parse → guard empty → create match → create squad → upsert players → insert lineup (`team='unassigned'`, `batch_id`) → return `{ matchId, createdCount, updatedCount, warnings }`.
- [x] 5.3 On persistence failure, mark the squad row `failed` with the error message and rethrow.

## 6. Action

- [x] 6.1 `src/actions/match.actions.ts`: `registerMatchFromText` server action (`'use server'`, try-catch, `logger.action`) returning a typed `ActionResponse` with the success payload or a user-facing error.

## 7. Tests

- [x] 7.1 Unit tests for `slugify`, duplicate-slug suffixing, and `parsePlainTeam` (well-formed list, spacing variants, blank/noise lines, missing year, `pluma`/`tanque` weight tokens, unknown tokens, duplicate names → `-1`/`-2`).
- [x] 7.2 Add factories in `tests/factories/` for parsed players / match input as needed.
- [x] 7.3 Service test for `registerMatch` with mocked repositories: created vs updated counts, lineup all `unassigned`, no duplicate per match, squad recorded.

## 8. Verification

- [x] 8.1 Run `npx tsc --noEmit` and `pnpm test`; fix any failures.
- [x] 8.2 Run `/audit` (or the convention-checker agent) on the new files and resolve any convention violations.
