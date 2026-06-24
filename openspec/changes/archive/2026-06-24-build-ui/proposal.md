## Why

The whole pipeline exists in the backend (register a match from a pasted list, balance into two teams), but there is no way to use it — the actions have no caller. This change adds the minimal web UI the organizer needs: paste the list, register, build the teams, and look at them.

## What Changes

- Add a **landing page** (`/`): a textarea to paste the WhatsApp list + a "Register" button that calls `registerMatchFromText` and navigates to the new match, plus a **list of recent matches**.
- Add a **match page** (`/matches/[id]`): shows the match's two teams (A / B) as player cards with name + **characteristic badges** (no numbers), a **"Build teams"** button (calls `balanceTeams`) and a **"Re-draw"** button, plus the same recent-matches list.
- Add a read action **`getMatchTeams(matchId)`**: returns a match with its players grouped into team A / B (and any still unassigned) by the persisted team, each with name and characteristic levels for badges — **never a score or total** — used to render and refresh the match page.
- **Scores are never shown.** The computed score/totals stay internal to balancing; ability is shown only as badges. Add `src/config/badges.config.ts` (level → badge name/asset) with assets in `public/badges/`.
- Add a read action **`listRecentMatches()`**: returns the most recent matches (date, location, player count) for the lists on both pages.
- Follow the project page conventions: `page.tsx` (server, fetches initial data) + `page.client.tsx` (client orchestrator that calls actions); feature components receive actions/data as props and never import actions directly.
- Apply an **EA Sports FC–inspired visual system**: dark backgrounds with bright fluorescent/neon accents (electric cyan, magenta, violet — not green), modern sans-serif type, "player card" components, and a competitive A/B comparison layout. Built with Tailwind CSS 4 theme tokens. Reference: https://www.ea.com/en/games/ea-sports-fc/fc-26/features/feedback

## Capabilities

### New Capabilities
- `match-ui`: The organizer-facing pages to register a match from a pasted list, browse recent matches, build two balanced teams, and view team A / B — backed by the read actions that feed those views.

### Modified Capabilities
<!-- None. register-match and balance-teams actions are consumed as-is; the new read actions are additive. -->

## Impact

- **New pages**: `src/app/page.tsx` + `src/app/page.client.tsx` (landing), `src/app/matches/[id]/page.tsx` + `src/app/matches/[id]/page.client.tsx` (match).
- **New components** (`src/components/`): a paste/register form, a recent-matches list, and a team board (A/B columns). Atomic primitives in `ui/` as needed.
- **New read actions**: `src/actions/match.actions.ts` gains `getMatchTeams` and `listRecentMatches` (or a co-located read actions file).
- **New services**: `getMatchTeams(db, matchId)` (group by persisted `match_player.team`; name + levels only, no score) and `listRecentMatches(db)`; transformers to group into teams.
- **Badges**: `src/config/badges.config.ts` (`as const`, level → name/description/asset) + badge images in `public/badges/{mobility,endurance}/`.
- **New repository reads**: `findMatchById`, `findRecentMatches` (match repo), and a lineup-with-player-names query (match-player repo joined to `player`).
- **Styling**: Tailwind CSS 4 theme (dark palette + bright fluorescent/neon accents (electric cyan, magenta, violet — not green), a modern sans-serif font, card/elevation tokens) in `src/app/globals.css`; reusable `ui/` primitives (player card, button, badge) carrying the look.
- **No schema changes, no new dependencies.** Next.js 16 App Router (read `node_modules/next/dist/docs/` before writing page/action code, per AGENTS.md).
- **Out of scope**: authentication UI, editing/deleting matches or players, and manual team tweaks. The visual style is in scope (EA Sports FC direction above).
