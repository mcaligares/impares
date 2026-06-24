## 1. Entity & config

- [x] 1.1 Add `src/entities/voter/voter.schema.ts` (`pgTable`: `id` uuid pk defaultRandom, `name` text notNull, `...timestamps`) + `voter.entity.ts` (`InferSelectModel`).
- [x] 1.2 `pnpm db:generate` to emit the `voter` migration (do not run `db:migrate` yet).
- [x] 1.3 Add `src/config/session.config.ts` (`as const`): cookie name (e.g. `voter_id`), max-age, sameSite, path.
- [x] 1.4 Add `src/lib/validators/voter.validator.ts`: Zod schema for the name (non-empty, max length from `appConfig`) + inferred type.

## 2. Cookie helper (lib)

- [x] 2.1 `src/lib/session/voter-cookie.ts`: `getVoterId()` and `setVoterId(id)` using the async `cookies()` from `next/headers`; httpOnly, sameSite/path/max-age from `session.config`. This is the only module touching `cookies()`.

## 3. Repository & service

- [x] 3.1 `src/repositories/voter.repository.ts`: `insertVoter`, `findVoterById` (`.limit(1)` + `[0] ?? null`), `updateVoterName` (try-catch + timed `logger.repo`).
- [x] 3.2 `src/services/voter.service.ts`: `getVoter(db, id)` and `saveVoter(db, { id?, name })` (create when no id/voter, else update the name). DB only — no cookie, no HTTP.

## 4. Actions

- [x] 4.1 `src/actions/voter.actions.ts`: `identifyVoter(name)` (`'use server'`, try-catch, `logger.action`): validate name → read voter id cookie → `saveVoter` → if new, `setVoterId` → return the voter as a typed `ActionResponse`.
- [x] 4.2 `getCurrentVoter()`: read the cookie via the helper → `getVoter` → return the voter or `null`.

## 5. Minimal UI

- [x] 5.1 An identity component (`'use client'`): name input when not identified (calls an `onIdentify` callback prop), shows the name when identified. No voting controls.
- [x] 5.2 Wire it through a page client (orchestrator) so it calls `identifyVoter`; surface the current voter from the server page via `getCurrentVoter()`.

## 6. Verification

- [x] 6.1 `npx tsc --noEmit` and `pnpm test` green.
- [x] 6.2 `pnpm dev`: set a name → cookie set, name shown; reload → still identified; change name → updates, no new voter.
- [x] 6.3 Run `/audit` (or the convention-checker) on the new files; resolve violations.
