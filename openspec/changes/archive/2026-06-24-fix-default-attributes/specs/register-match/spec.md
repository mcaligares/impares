## MODIFIED Requirements

### Requirement: Upsert players by slug

The system SHALL upsert each parsed player into the player table keyed by `slug`. A player whose slug does not exist SHALL be created; a player whose slug already exists SHALL be updated. Each attribute (`mobility`, `endurance`) SHALL be resolved independently as: the value from the list when present; otherwise the player's previously stored value when one exists; otherwise the medium default (3). The resolved `{ mobility, endurance }` SHALL ALWAYS be written.

#### Scenario: Create new players

- **WHEN** none of the parsed slugs exist in the player table
- **THEN** every player is inserted and the result reports them as created

#### Scenario: New player without characteristics defaults to 3

- **WHEN** a never-seen player is loaded from a line with no characteristics (e.g. `1- Mati`)
- **THEN** the player is stored with `mobility` = 3 and `endurance` = 3

#### Scenario: Missing characteristic preserves the stored value

- **WHEN** a player already stored with `mobility` 4 is loaded again from a line with no values
- **THEN** the stored `mobility` 4 is kept (not reset to 3)

#### Scenario: List value overrides the stored value

- **WHEN** a player stored with `mobility` 4 is loaded from `1- Mati,2`
- **THEN** `mobility` becomes 2

#### Scenario: Partial line keeps the other stored attribute

- **WHEN** a player stored with `{ mobility: 4, endurance: 2 }` is loaded from `1- Mati,5`
- **THEN** `mobility` becomes 5 and `endurance` stays 2
