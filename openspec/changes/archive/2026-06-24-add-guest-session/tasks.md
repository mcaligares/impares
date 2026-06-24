## 1. Entity & config

- [x] 1.1 Add `src/entities/guest/guest.schema.ts` (`pgTable`: `id` uuid pk defaultRandom, `name` text notNull, `...timestamps`) + `guest.entity.ts` (`InferSelectModel`).
- [x] 1.2 `pnpm db:generate` to emit the `guest` migration (do not run `db:migrate` yet).
- [x] 1.3 Add `src/config/session.config.ts` (`as const`): cookie name (e.g. `guest_id`), max-age, sameSite, path.
- [x] 1.4 Add `src/lib/validators/guest.validator.ts`: Zod schema for the name (non-empty, max length from `appConfig`) + inferred type.

## 2. Cookie helper (lib)

- [x] 2.1 `src/lib/session/guest-cookie.ts`: `getGuestId()` and `setGuestId(id)` using the async `cookies()` from `next/headers`; httpOnly, sameSite/path/max-age from `session.config`. This is the only module touching `cookies()`.

## 3. Repository & service

- [x] 3.1 `src/repositories/guest.repository.ts`: `insertGuest`, `findGuestById` (`.limit(1)` + `[0] ?? null`), `updateGuestName` (try-catch + timed `logger.repo`).
- [x] 3.2 `src/services/guest.service.ts`: `getGuest(db, id)` and `saveGuest(db, { id?, name })` (create when no id/guest, else update the name). DB only — no cookie, no HTTP.

## 4. Actions

- [x] 4.1 `src/actions/guest.actions.ts`: `identifyGuest(name)` (`'use server'`, try-catch, `logger.action`): validate name → read guest id cookie → `saveGuest` → if new, `setGuestId` → return the guest as a typed `ActionResponse`.
- [x] 4.2 `getCurrentGuest()`: read the cookie via the helper → `getGuest` → return the guest or `null`.

## 5. Minimal UI

- [x] 5.1 An identity component (`'use client'`): name input when not identified (calls an `onIdentify` callback prop), shows the name when identified. No voting controls.
- [x] 5.2 Wire it through a page client (orchestrator) so it calls `identifyGuest`; surface the current guest from the server page via `getCurrentGuest()`.

## 6. Verification

- [x] 6.1 `npx tsc --noEmit` and `pnpm test` green.
- [x] 6.2 `pnpm dev`: set a name → cookie set, name shown; reload → still identified; change name → updates, no new guest.
- [x] 6.3 Run `/audit` (or the convention-checker) on the new files; resolve violations.
