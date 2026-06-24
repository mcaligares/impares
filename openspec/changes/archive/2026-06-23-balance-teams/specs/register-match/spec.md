## REMOVED Requirements

### Requirement: Parse optional weight token

**Reason:** Replaced by graded 1–5 attributes (`mobility`, `endurance`) parsed from the pasted list.
**Migration:** Use the numeric format `name,mobility,endurance` instead of the `pluma`/`tanque` token.

## ADDED Requirements

### Requirement: Parse optional attribute tokens

The system SHALL parse optional attribute tokens that follow a player name after a comma — `name,mobility,endurance` — and set the player's `attributes.mobility` and `attributes.endurance`. Each is an integer from 1 to 5 in fixed order: mobility first, endurance second. A missing trailing value SHALL be left undefined (the scorer applies the baseline). A non-numeric or out-of-range value SHALL be ignored and recorded as a parse warning; it SHALL NOT fail the run.

#### Scenario: Both attributes

- **WHEN** a line is `11-migue,3,4`
- **THEN** the parsed player `migue` has `attributes.mobility` = 3 and `attributes.endurance` = 4

#### Scenario: Only mobility

- **WHEN** a line is `8-Don Carlos,5`
- **THEN** the parsed player has `attributes.mobility` = 5 and `attributes.endurance` undefined

#### Scenario: No attributes

- **WHEN** a line has no comma (e.g. `2-Gonza`)
- **THEN** the player is registered with no mobility or endurance set

#### Scenario: Invalid value

- **WHEN** a line is `3-JP,9` or `3-JP,foo`
- **THEN** the out-of-range or non-numeric value is ignored, a warning is recorded, and the player has no value for that attribute
