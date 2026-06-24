## MODIFIED Requirements

### Requirement: Landing page registers a match from a pasted list

The landing page (`/`) SHALL present a text input for the pasted player list and a control to register it. Submitting SHALL call the register action with the raw text; on success the squad is registered **and already balanced into teams**, and the user SHALL be taken to that match's page showing the divided teams; on failure — including when the squad cannot be balanced — a user-facing message SHALL be shown without navigating.

#### Scenario: Successful registration navigates to the built match

- **WHEN** the organizer pastes a valid list and submits
- **THEN** the match is registered with its teams already balanced and the app navigates to `/matches/{id}`, which shows team A and team B

#### Scenario: Empty or invalid input shows an error

- **WHEN** the organizer submits empty or unparseable text
- **THEN** an error message is shown and no navigation happens

#### Scenario: Unbalanceable squad shows an error

- **WHEN** the organizer submits a list with too few players to form two teams
- **THEN** an error message is shown, no match is created, and no navigation happens

### Requirement: Match page builds and shows the two teams

The match page (`/matches/[id]`) SHALL show the match's teams using `getMatchTeams`. A match reached from a successful registration SHALL open directly in the built state, showing team A and team B side by side with each player's name and characteristic badges (no totals, no balance indicator). When a match's roster is still unassigned (a fallback state, not produced by normal registration), the page SHALL show the roster with a "Build teams" control. A "Re-draw" control SHALL re-run the balance and refresh the view.

#### Scenario: Newly created match opens already divided

- **WHEN** the organizer registers a match and lands on `/matches/{id}`
- **THEN** the page shows team A and team B with player cards (badges, no totals) without requiring a manual build step

#### Scenario: Re-draw overwrites the teams

- **WHEN** the organizer clicks "Re-draw" on a match that already has teams
- **THEN** the balance runs again and the page shows the newly computed teams

#### Scenario: Unassigned roster fallback still builds

- **WHEN** a match somehow has an unassigned roster and the organizer clicks "Build teams"
- **THEN** the balance action runs and the page refreshes to show team A and team B
