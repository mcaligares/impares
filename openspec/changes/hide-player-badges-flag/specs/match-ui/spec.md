## ADDED Requirements

### Requirement: Player badges can be hidden by a deploy-time flag

The system SHALL provide a deploy-time feature flag, read from an environment variable, that controls whether player characteristic badges are rendered. When the flag hides badges, player cards SHALL render without the mobility/endurance badge row; all other card content (name, layout) SHALL be unaffected. The flag SHALL default to showing badges when the variable is unset. Because badges render in a client component, the variable SHALL use the `NEXT_PUBLIC_` prefix so it is available in the browser. The flag SHALL NOT change which player data is sent to the client — it only gates rendering.

#### Scenario: Flag enabled hides the badge row

- **WHEN** the badge-hiding flag is enabled and a match page renders player cards
- **THEN** each card shows the player name without any characteristic badges, and no badge images are requested

#### Scenario: Flag unset shows badges as before

- **WHEN** the environment variable is unset or set to its disabled value
- **THEN** player cards render the mobility and endurance badges exactly as they did before this change

## MODIFIED Requirements

### Requirement: Scores are never shown to the user

Computed scores and team totals SHALL remain internal to balancing and SHALL NEVER be returned to the client or shown in the UI. Player ability SHALL be presented only as **characteristic badges** (one per attribute), never as numbers. When the badge-hiding flag is enabled, ability badges SHALL be omitted entirely; under no configuration SHALL ability be shown as a number, rating, or total.

#### Scenario: No numbers in the UI

- **WHEN** any page renders a player or a team
- **THEN** it shows characteristic badges (unless hidden by the flag) and names, and no score, rating number, or team total appears anywhere
