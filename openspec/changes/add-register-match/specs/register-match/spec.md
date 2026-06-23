## ADDED Requirements

### Requirement: Parse pasted plain-team text

The system SHALL accept a raw multi-line text paste from a WhatsApp group and parse it into a structured result containing one match header and a list of confirmed players. Parsing SHALL be a pure operation with no database access. The system SHALL tolerate copy-paste noise: blank lines, irregular whitespace around the number separator, and trailing spaces.

#### Scenario: Parse a well-formed list

- **WHEN** the input is `Futbol Lujan - 10/06 20:30hs` followed by numbered lines `1- mati` through `14-toro`
- **THEN** the parser returns a match header `{ title: "Futbol Lujan", date: 10 June (current year), time: "20:30", location: "Futbol Lujan" }` and 14 players in list order with names `mati … toro`

#### Scenario: Tolerate spacing variations

- **WHEN** player lines vary like `10 - Nico`, `11-migue`, and `14-toro`
- **THEN** all are parsed correctly, ignoring whitespace around the `-` separator

#### Scenario: Ignore blank and noise lines

- **WHEN** the paste contains empty lines or lines that do not match the header or numbered-player patterns
- **THEN** those lines are skipped and recorded as parse warnings rather than causing a failure

### Requirement: Parse optional weight token

The system SHALL parse an optional weight token that follows a player name after a comma (e.g. `11-migue,pluma`) and set the player's `attributes.weight`. The recognized vocabulary is Spanish: `pluma` (light/fast) and `tanque` (heavy). When no weight token is present, `weight` SHALL remain undefined, representing the default `normal` level. The ordered scale is `pluma` (fast) → normal → `tanque` (heavy). Unknown tokens SHALL be ignored and recorded as a parse warning; they SHALL NOT fail the run.

#### Scenario: Light player

- **WHEN** a line is `11-migue,pluma`
- **THEN** the parsed player `migue` has `attributes.weight` = `pluma`

#### Scenario: Heavy player

- **WHEN** a line is `8-Don Carlos,tanque`
- **THEN** the parsed player `Don Carlos` has `attributes.weight` = `tanque`

#### Scenario: Default normal when no token

- **WHEN** a line has no comma (e.g. `2-Gonza`)
- **THEN** the player is registered with no `weight` set, representing the normal default

#### Scenario: Ignore an unknown token

- **WHEN** a line is `3-JP,zzz`
- **THEN** the player `JP` is registered with no weight, and a warning notes the unrecognized token

### Requirement: Generate a stable slug per player

The system SHALL derive a URL-safe `slug` from each player's name to serve as the upsert identity key. Slug generation SHALL lowercase, strip diacritics, and replace non-alphanumeric runs with a single hyphen. When two or more players in the same run resolve to the same base slug, the system SHALL append an incremental numeric suffix by order of appearance (`-1`, `-2`, …) so every slug in the run is unique; a base slug that occurs only once SHALL NOT be suffixed.

#### Scenario: Slug from a multi-word name

- **WHEN** the player name is `Don Carlos`
- **THEN** the generated slug is `don-carlos`

#### Scenario: Slug strips accents

- **WHEN** the player name is `Germán`
- **THEN** the generated slug is `german`

#### Scenario: Disambiguate duplicate names in one run

- **WHEN** two players are both named `Matias` in the same paste
- **THEN** the first becomes slug `matias-1` and the second `matias-2`

#### Scenario: No suffix for a unique name

- **WHEN** a name resolves to a base slug that appears only once in the run
- **THEN** the slug has no numeric suffix (e.g. `german`)

### Requirement: Upsert players by slug

The system SHALL upsert each parsed player into the player table keyed by `slug`. A player whose slug does not exist SHALL be created; a player whose slug already exists SHALL be updated. When a weight token is present, the existing player's `attributes.weight` SHALL be updated; when absent, the existing player's stored attributes SHALL be preserved.

#### Scenario: Create new players

- **WHEN** none of the parsed slugs exist in the player table
- **THEN** every player is inserted and the result reports them as created

#### Scenario: Update an existing player

- **WHEN** a parsed slug already exists and the line carries a weight token
- **THEN** the existing player row is updated with the new weight and reported as updated

#### Scenario: Preserve attributes when none provided

- **WHEN** a parsed slug already exists and the line has no attribute tokens
- **THEN** the existing player's stored attributes are left unchanged

### Requirement: Create the match from the header

The system SHALL create a `match` from the parsed header with the resolved date and time, status `scheduled`, and the parsed title as the location. When the header omits the year, the system SHALL default to the current year.

#### Scenario: Create a scheduled match

- **WHEN** the header is `Futbol Lujan - 10/06 20:30hs` and the parse succeeds
- **THEN** a match row is created with `match_date` of 10 June (current year) 20:30, `status` = `scheduled`, and `location` = `Futbol Lujan`

### Requirement: Record the squad batch

The system SHALL create one `squad` batch row per run, linked to the created match, capturing the raw source text and final counts of created and updated players. On success the squad status SHALL be `processed`; on a persistence failure it SHALL be `failed` with an error message.

#### Scenario: Successful batch is recorded

- **WHEN** a run completes and all players persist
- **THEN** a squad row exists with `status` = `processed`, `match_id` referencing the created match, and `created_count` + `updated_count` equal to the number of registered players

### Requirement: Link players to the match as an unassigned lineup

The system SHALL create one `match_player` row per registered player, referencing the created match and the upserted player, with `team` = `unassigned` and `batch_id` referencing the squad row. Each player SHALL appear at most once per match.

#### Scenario: Lineup created awaiting split

- **WHEN** 14 players are registered for a new match
- **THEN** 14 `match_player` rows exist for that match, all with `team` = `unassigned`, ready for the team-split step

#### Scenario: No duplicate lineup entries

- **WHEN** the same player slug appears twice in one paste
- **THEN** the player is linked to the match only once

### Requirement: Register match via a server action

The system SHALL expose the operation through a server action that accepts the raw pasted text, performs the parse-and-persist pipeline, and returns a typed response. On success the response SHALL include the created match id and the created/updated counts plus any parse warnings. On failure it SHALL return an error with a user-facing message and SHALL NOT partially leave the system in an inconsistent state visible as a successful run.

#### Scenario: Successful registration response

- **WHEN** a valid paste is submitted
- **THEN** the action returns success with `{ matchId, createdCount, updatedCount, warnings[] }`

#### Scenario: Empty or unparseable input

- **WHEN** the submitted text contains no recognizable header or player lines
- **THEN** the action returns a failure response with a user-facing message and creates nothing
