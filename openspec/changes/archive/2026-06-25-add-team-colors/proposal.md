## Why

Teams currently render in two fixed colors (orange / violet). The organizer wants variety: each match's teams should get colors **at random from a palette**, the two teams must **never share a color**, none may reuse the **landing/brand color (cyan)** — so neither team looks favored — and the choice must **persist** (same colors every time that match is opened).

## What Changes

- Add a **team color palette** in config: a curated list of hex colors, none equal to the brand cyan (and avoiding near-cyan blues and greens).
- On **match creation**, pick **two distinct** colors at random from the palette and **store them on the match** (`team_a_color`, `team_b_color`).
- The colors **persist** — stored on the match row, so they stay stable across reloads and across "Rearmar equipos".
- The **match page renders each team in its stored color** (panel border/glow, the team name, and each player card's accent bar) via inline styles.
- **Older matches** with no stored colors fall back to the current defaults, so nothing breaks.

## Capabilities

### New Capabilities
- `team-colors`: Every match is assigned two distinct, persisted team colors drawn at random from a palette that excludes the brand color, and the match page renders each team in its color.

### Modified Capabilities
<!-- None at the spec level: register-match still registers; match-ui still shows teams. The color assignment/persistence/render is the new team-colors capability. -->

## Impact

- **Schema + migration**: add `team_a_color` and `team_b_color` (text, nullable) to the `match` entity; `pnpm db:generate`.
- **Config**: `src/config/color.config.ts` (`as const`) — the team palette (hex list, no cyan).
- **Service**: at registration, pick two distinct palette colors (random, injectable rng for tests) and pass them to `insertMatch`; `getMatchTeams` returns the stored colors.
- **Repository**: `insertMatch` accepts the two color columns.
- **UI**: `TeamBoard` / `PlayerCard` take a color value and apply it via inline `style` (dynamic hex can't be a Tailwind class); fall back to the current defaults when a match has no stored colors.
- **No new dependencies.**
- **Out of scope**: letting the user pick/edit team colors manually; theming the rest of the app.
