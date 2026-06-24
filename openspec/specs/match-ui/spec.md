# match-ui Specification

## Purpose

The match-ui capability provides the user-facing pages for registering matches and viewing their balanced teams. It covers the landing page for pasting a player list and registering a match, the recent-matches list, and the match page that builds and displays the two teams as player cards with characteristic badges. Scores and team totals remain internal to balancing and are never shown to the user. Pages follow the orchestrator pattern, separating server data fetching from client interaction.

## Requirements

### Requirement: Landing page registers a match from a pasted list

The landing page (`/`) SHALL present a text input for the pasted player list and a control to register it. Submitting SHALL call the register action with the raw text; on success the user SHALL be taken to that match's page; on failure a user-facing message SHALL be shown without navigating.

#### Scenario: Successful registration navigates to the match

- **WHEN** the organizer pastes a valid list and submits
- **THEN** the match is registered and the app navigates to `/matches/{id}` for the new match

#### Scenario: Empty or invalid input shows an error

- **WHEN** the organizer submits empty or unparseable text
- **THEN** an error message is shown and no navigation happens

### Requirement: Recent matches list

Both the landing page and the match page SHALL show a list of the most recent matches, each showing at least the date/location and a link to its match page. The list SHALL be provided by a read action.

#### Scenario: Recent matches are listed

- **WHEN** a page that includes the recent-matches list loads
- **THEN** the most recent matches are displayed, each linking to `/matches/{id}`

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

Computed scores and team totals SHALL remain internal to balancing and SHALL NEVER be returned to the client or shown in the UI. Player ability SHALL be presented only as **characteristic badges** (one per attribute), never as numbers.

#### Scenario: No numbers in the UI

- **WHEN** any page renders a player or a team
- **THEN** it shows characteristic badges and names, and no score, rating number, or team total appears anywhere

### Requirement: Match page builds and shows the two teams

The match page (`/matches/[id]`) SHALL show the match's teams using `getMatchTeams`. When teams are not yet built it SHALL show the roster with a "Build teams" control; when built it SHALL show team A and team B side by side with each player's name and characteristic badges (no totals, no balance indicator). A "Re-draw" control SHALL re-run the balance and refresh the view.

#### Scenario: Build teams from the roster

- **WHEN** the organizer opens a match with an unassigned roster and clicks "Build teams"
- **THEN** the balance action runs and the page refreshes to show team A and team B with player cards (badges, no totals)

#### Scenario: Re-draw overwrites the teams

- **WHEN** the organizer clicks "Re-draw" on a match that already has teams
- **THEN** the balance runs again and the page shows the newly computed teams

### Requirement: Pages follow the orchestrator pattern

Each page SHALL use a server `page.tsx` that fetches initial data and a client `page.client.tsx` that orchestrates interactions. Feature components SHALL receive data and action callbacks as props and SHALL NOT import server actions directly.

#### Scenario: Server fetch, client interaction

- **WHEN** a page renders
- **THEN** `page.tsx` (server) provides the initial data and `page.client.tsx` (client) handles the form, buttons, and action calls
