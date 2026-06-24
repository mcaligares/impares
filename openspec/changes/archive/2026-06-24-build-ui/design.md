## Context

The backend is complete: `registerMatchFromText` (paste → match + lineup) and `balanceTeams(matchId)` (assign A/B) exist as server actions, but nothing calls them. This change adds the organizer UI. The project mandates the page orchestrator pattern (`page.tsx` server + `page.client.tsx` client) and component rules (named exports, `'use client'` only where needed, feature components receive actions/data as props rather than importing actions).

This is a modified Next.js 16 (per `AGENTS.md`): the apply phase MUST read the relevant guides in `node_modules/next/dist/docs/` before writing page/action/route code — App Router APIs (dynamic `params`, server actions invoked from client components, navigation) may differ from prior versions.

## Goals / Non-Goals

**Goals:**
- Two routes: landing (`/`) to paste/register + recent matches; match (`/matches/[id]`) to build/view teams + recent matches.
- A read action `getMatchTeams(matchId)` returning teams with player names, scores, and totals.
- A read action `listRecentMatches()` for the lists.
- Keep all conventions (orchestrator pages, action-as-prop components).

**Non-Goals:**
- Auth UI, editing/deleting, manual team edits, drag-and-drop.
- Real-time updates; refresh is explicit (after build/re-draw).

## Decisions

**1. Two routes, server-fetched, client-orchestrated.**
- `/` → `page.tsx` (server) fetches `listRecentMatches()`; `page.client.tsx` renders the paste form + the list, calls `registerMatchFromText`, and on success navigates to `/matches/{id}`.
- `/matches/[id]` → `page.tsx` (server) fetches `getMatchTeams(id)` + `listRecentMatches()`; `page.client.tsx` renders the team board + the list, calls `balanceTeams` for build/re-draw, and refreshes.
Rationale: matches the documented orchestrator pattern; initial data server-side, interactions client-side.

**2. New read side: `getMatchTeams` + `listRecentMatches` (service + action + repo).**
- Repo (match): `findMatchById(db, id)`, `findRecentMatches(db, limit)`. Repo (match-player): a lineup-with-player-names query joining `match_player` to `player` (so the UI gets names, not just ids).
- Service `getMatchTeams(db, matchId)`: load match (throw/return-null if missing) → load lineup-with-names (incl. `player.attributes` levels) → group into `{ teamA, teamB, unassigned }` by the persisted `match_player.team` via a transformer (no inline `.map()`). **No `scorePlayer`, no totals** — only name + mobility/endurance levels per player. Service `listRecentMatches(db)`: thin pass-through with a transformer to the list shape.
- Actions wrap them as typed `ActionResponse`. Reads still go through services → repositories (no DB in the action).
Rationale: the read side honors the chosen "separate read action" answer and keeps display names available.

**3. Scores are never shown — characteristics via badges.**
The computed score (and team totals) stay internal to balancing; they are never returned to the client or rendered. Each attribute level (1–5) maps to a **badge** (image + name) via a new `src/config/badges.config.ts` (`as const`), using the scoring-doc names (mobility: Fideo…Asado con cuero; endurance: Abeja…Forrest Gump). Badge assets live in `public/badges/{mobility,endurance}/{1..5}.png`. A missing attribute renders the baseline level-3 badge. The team board shows no balance indicator (the organizer trusts the algorithm — a deliberate trade-off). The `balanceTeams` action's score-bearing response is used only to trigger a refresh, never rendered.

**4. Navigation after register is client-side.**
`registerMatchFromText` keeps returning `{ matchId, ... }`; `page.client.tsx` pushes to `/matches/{matchId}` via the router on success. Keeps the action reusable and avoids server redirects in the action. (Confirm the exact navigation API against the Next.js 16 docs at apply time.)

**5. Refresh after build/re-draw.**
After `balanceTeams` succeeds, the match client re-reads `getMatchTeams` (or refreshes the route) to show the new split. Exact mechanism (router refresh vs re-fetch) decided at apply time per the docs.

**6. Components.**
Feature components under `src/components/`: a register/paste form, a recent-matches list, and a team board (A/B columns). They take data + callbacks as props; the page client owns the action calls. Any atomic primitive (button, textarea wrapper) goes in `ui/` with primitive props only.

**7. Visual system — EA Sports FC inspired.**
Sporty, competitive, videogame feel: dark backgrounds with bright fluorescent/neon accents (electric cyan, magenta, violet — not green), modern sans-serif type, "player card" components showing the characteristic **badge images** (no numbers), and an A/B side-by-side comparison layout that emphasizes the matchup. Implemented as Tailwind CSS 4 theme tokens in `globals.css` (palette, font, card/elevation) plus reusable `ui/` primitives (player card, button, badge). Reference: https://www.ea.com/en/games/ea-sports-fc/fc-26/features/feedback. At apply time the `frontend-design` skill may be used for high-quality, non-generic output. *Rationale:* the app is a football team builder — the look should feel like one, not a generic CRUD form.

## Risks / Trade-offs

- **Next.js 16 API drift** → page/action/navigation code written from memory could be wrong. Mitigation: read `node_modules/next/dist/docs/` first (hard requirement), keep pages thin.
- **Read N+1 / extra queries** → loading match + lineup + names. Mitigation: a single join query for the lineup-with-names; `listRecentMatches` is one query with an optional player count.
- **Empty/edge states** → match with no players, teams not built, unknown id. Mitigation: explicit empty states and a failure response for unknown match (covered in spec scenarios).
- **No auth gate yet** → pages are open. Mitigation: middleware-based protection is a separate change; acceptable for the MVP.

## Migration Plan

No DB migration; no new dependencies. Code-only: new pages, components, read actions/services, and repository read functions. Rollback is reverting the change.

## Open Questions

- Exact Next.js 16 navigation/refresh APIs (router push, `revalidate`/router refresh) — resolve against the bundled docs at apply time.
- Whether the recent-matches list needs a player count now or just date/location — start minimal (date/location + link), add count if cheap.
