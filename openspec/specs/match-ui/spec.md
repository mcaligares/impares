# match-ui Specification

## Purpose

The match-ui capability provides the user-facing pages for registering matches and viewing their balanced teams. It covers the landing page for pasting a player list and registering a match, the recent-matches list, and the match page that builds and displays the two teams as player cards with characteristic badges. Scores and team totals remain internal to balancing and are never shown to the user. Pages follow the orchestrator pattern, separating server data fetching from client interaction.

## Requirements

### Requirement: Landing page registers a match from a pasted list

The landing page (`/`) SHALL present a text input for the pasted player list and a control to register it. Submitting SHALL call the register action with the raw text; on success the squad is registered **and already balanced into teams**, and the user SHALL be taken to that match's page showing the divided teams; on failure — including when the squad cannot be balanced — a user-facing message SHALL be shown without navigating.

#### Scenario: Successful registration navigates to the built match

- **WHEN** the organizer pastes a valid list and submits
- **THEN** the match is registered with its teams already balanced and the app navigates to `/partido/{id}`, which shows team A and team B

#### Scenario: Empty or invalid input shows an error

- **WHEN** the organizer submits empty or unparseable text
- **THEN** an error message is shown and no navigation happens

#### Scenario: Unbalanceable squad shows an error

- **WHEN** the organizer submits a list with too few players to form two teams
- **THEN** an error message is shown, no match is created, and no navigation happens

### Requirement: Recent matches list

Both the landing page and the match page SHALL show a list of the most recent matches, each showing at least the date/location and a link to its match page. The list SHALL be provided by a read action.

#### Scenario: Recent matches are listed

- **WHEN** a page that includes the recent-matches list loads
- **THEN** the most recent matches are displayed, each linking to `/partido/{id}`

#### Scenario: No matches yet

- **WHEN** there are no matches
- **THEN** the list renders an empty state rather than an error

### Requirement: Read a match's teams for display

The system SHALL provide a read action `getMatchTeams(matchId)` that returns the match together with its players grouped into team A and team B (and any still unassigned), each player carrying a display name and its characteristic levels (`mobility` / `endurance`) for badge display. The action SHALL NOT include or expose any computed score or team total. It SHALL be usable to both render and refresh the match page.

#### Scenario: Teams already built

- **WHEN** a match has players assigned to A and B
- **THEN** the action returns both teams with player names and characteristic levels (for badges) — never scores or totals — and an empty unassigned list

#### Scenario: Teams not built yet

- **WHEN** a match has players but none are assigned
- **THEN** the action returns empty A/B teams and the players in the unassigned list

#### Scenario: Unknown match

- **WHEN** the `matchId` does not exist
- **THEN** the action returns a failure response with a user-facing message

### Requirement: Scores are never shown to the user

Computed scores and team totals SHALL remain internal to balancing and SHALL NEVER be returned to the client or shown in the UI. Player ability SHALL be presented only as **characteristic badges** (one per attribute), never as numbers. When the badge-hiding flag is enabled, ability badges SHALL be omitted entirely; under no configuration SHALL ability be shown as a number, rating, or total.

#### Scenario: No numbers in the UI

- **WHEN** any page renders a player or a team
- **THEN** it shows characteristic badges (unless hidden by the flag) and names, and no score, rating number, or team total appears anywhere

### Requirement: Player badges can be hidden by a deploy-time flag

The system SHALL provide a deploy-time feature flag, read from an environment variable, that controls whether player characteristic badges are rendered. When the flag hides badges, player cards SHALL render without the mobility/endurance badge row; all other card content (name, layout) SHALL be unaffected. The flag SHALL default to showing badges when the variable is unset. Because badges render in a client component, the variable SHALL use the `NEXT_PUBLIC_` prefix so it is available in the browser. The flag SHALL NOT change which player data is sent to the client — it only gates rendering.

#### Scenario: Flag enabled hides the badge row

- **WHEN** the badge-hiding flag is enabled and a match page renders player cards
- **THEN** each card shows the player name without any characteristic badges, and no badge images are requested

#### Scenario: Flag unset shows badges as before

- **WHEN** the environment variable is unset or set to its disabled value
- **THEN** player cards render the mobility and endurance badges exactly as they did before this change

### Requirement: Match page builds and shows the two teams

The match page (`/partido/[id]`) SHALL show the match's teams using `getMatchTeams`. The `[id]` segment is the match's incremental integer id; a non-numeric id SHALL resolve to a not-found response. A match reached from a successful registration SHALL open directly in the built state, showing team A and team B side by side with each player's name and characteristic badges (no totals, no balance indicator). When a match's roster is still unassigned (a fallback state, not produced by normal registration), the page SHALL show the roster with a "Build teams" control. A "Re-draw" control SHALL re-run the balance and refresh the view.

#### Scenario: Newly created match opens already divided

- **WHEN** the organizer registers a match and lands on `/partido/{id}`
- **THEN** the page shows team A and team B with player cards (badges, no totals) without requiring a manual build step

#### Scenario: Re-draw overwrites the teams

- **WHEN** the organizer clicks "Re-draw" on a match that already has teams
- **THEN** the balance runs again and the page shows the newly computed teams

#### Scenario: Unassigned roster fallback still builds

- **WHEN** a match somehow has an unassigned roster and the organizer clicks "Build teams"
- **THEN** the balance action runs and the page refreshes to show team A and team B

#### Scenario: Non-numeric id is not found

- **WHEN** a request reaches `/partido/{id}` with a non-numeric id
- **THEN** the page resolves to a not-found response rather than querying for a match

### Requirement: Pages follow the orchestrator pattern

Each page SHALL use a server `page.tsx` that fetches initial data and a client `page.client.tsx` that orchestrates interactions. Feature components SHALL receive data and action callbacks as props and SHALL NOT import server actions directly.

#### Scenario: Server fetch, client interaction

- **WHEN** a page renders
- **THEN** `page.tsx` (server) provides the initial data and `page.client.tsx` (client) handles the form, buttons, and action calls

### Requirement: Match page can be shared to WhatsApp

The match page (`/partido/[id]`) SHALL present a "Compartí esta elegida" control that opens a WhatsApp share link for the current match. The control SHALL build a `https://wa.me/?text=<message>` URL whose message contains an invitation followed by the match's absolute URL (for example `Miren este partido que armé: {LINK}`). The link `{LINK}` SHALL be the absolute match URL formed from the configured site URL (`NEXT_PUBLIC_SITE_URL`) and the match's `/partido/{id}` path. The full message SHALL be URL-encoded so the link and accented characters survive the query string. The control SHALL open the WhatsApp link in a new context (so the match page is not navigated away from) and SHALL NOT expose any score, total, or other internal balancing data.

#### Scenario: Sharing opens WhatsApp with the prefilled invitation

- **WHEN** the organizer taps "Compartí esta elegida" on a match page
- **THEN** a `https://wa.me/?text=...` link opens in a new context with a URL-encoded message that reads like "Miren este partido que armé:" followed by the match's absolute `/partido/{id}` URL

#### Scenario: Shared link is absolute and openable outside the app

- **WHEN** the share message is built for a match
- **THEN** the embedded match link uses the configured site URL as its origin so a recipient opening it from WhatsApp reaches that match's page

#### Scenario: Share action reveals no internal data

- **WHEN** the share link is generated
- **THEN** the message contains only the invitation text and the match URL, and no score, team total, or balancing detail
