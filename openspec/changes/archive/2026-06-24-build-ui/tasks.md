## 0. Next.js 16 prep

- [x] 0.1 Read the relevant guides in `node_modules/next/dist/docs/` (App Router pages, dynamic `params`, server actions from client components, navigation/refresh) before writing any page/action code.

## 1. Read side — repositories

- [x] 1.1 `match.repository.ts`: add `findMatchById(db, id)` (`.limit(1)` + `[0] ?? null`).
- [x] 1.2 `match.repository.ts`: add `findRecentMatches(db, limit)` ordered by `match_date` desc.
- [x] 1.3 `match-player.repository.ts`: add a lineup-with-player-names query (join `match_player` → `player`) returning team, player id, name, and `player.attributes` (mobility/endurance levels). No score.

## 2. Read side — services

- [x] 2.0 Add `src/config/badges.config.ts` (`as const`): each attribute level 1–5 → `{ name, description, asset }` (mobility: Fideo/Antena/Persona/Heladera/Asado con cuero; endurance: Abeja/WiFi de hotel/Empleado público/Delivery/Forrest Gump; assets `/badges/{attr}/{level}.png`).
- [x] 2.1 `getMatchTeams(db, matchId)` in a match read service: load match (null → caller maps to failure), load lineup-with-names, group into `{ teamA, teamB, unassigned }` by the persisted `match_player.team` using a transformer (no inline `.map()`). Return name + levels only — NO score, NO totals.
- [x] 2.2 `listRecentMatches(db)`: return the recent matches shaped for the list (transformer).

## 3. Read side — actions

- [x] 3.1 `getMatchTeams(matchId)` action (`'use server'`, try-catch, `logger.action`, typed `ActionResponse`); unknown/empty match → user-facing error.
- [x] 3.2 `listRecentMatches()` action.

## 4. Visual system & components

- [x] 4.0 Tailwind 4 theme in `globals.css`: dark palette + bright fluorescent/neon accents (electric cyan, magenta, violet — not green), a modern sans-serif font, card/elevation tokens (EA Sports FC direction). Add `ui/` primitives: player card, button, badge.
- [x] 4.1 Register/paste form component (textarea + submit) — receives an `onSubmit` callback prop; named export; `'use client'`.
- [x] 4.2 Recent-matches list component — receives matches as props, links to `/matches/{id}`; empty state.
- [x] 4.3 Team board component — receives `{ teamA, teamB, unassigned }`, renders A/B columns of player cards (name + characteristic badges via `badgeConfig`), and the build/re-draw controls via callback props. No totals, no balance indicator.

## 5. Pages — landing (`/`)

- [x] 5.1 `src/app/page.tsx` (server): fetch `listRecentMatches()`, render `page.client.tsx`.
- [x] 5.2 `src/app/page.client.tsx` (client): compose the paste form + recent-matches list; call `registerMatchFromText`; on success navigate to `/matches/{id}`; on failure show the message.

## 6. Pages — match (`/matches/[id]`)

- [x] 6.1 `src/app/matches/[id]/page.tsx` (server): fetch `getMatchTeams(id)` + `listRecentMatches()`; handle unknown match.
- [x] 6.2 `src/app/matches/[id]/page.client.tsx` (client): render the team board + recent-matches list; call `balanceTeams` for build/re-draw and refresh the view.

## 7. Verification

- [x] 7.1 `npx tsc --noEmit` and `pnpm test` green.
- [x] 7.2 `pnpm dev` (or build) and click through: paste → register → match page → build teams → re-draw. Confirm names + totals render.
- [x] 7.3 Run `/audit` (or the convention-checker) on the new files; resolve violations.
