# register-match Specification

## Purpose

Register a match and its confirmed squad from a raw plain-text paste (e.g. copied from a WhatsApp group), parsing the match header and player lines, upserting players by slug, creating the match, recording the squad batch, and linking players to the match as balanced teams.

## Requirements

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

### Requirement: Link players to the match as balanced teams

As part of registration, the system SHALL balance the registered squad and create one `match_player` row per registered player, referencing the created match and the upserted player, with `team` = `a` or `b` and `batch_id` referencing the squad row. Each player SHALL appear at most once per match. The split SHALL satisfy the balance-teams capability (two teams, sizes differing by at most one, minimized score difference). No player SHALL be left `unassigned` on a successful registration.

#### Scenario: Lineup created already split

- **WHEN** 14 players are registered for a new match
- **THEN** 14 `match_player` rows exist for that match, each with `team` = `a` or `b`, split into two balanced teams, and none left `unassigned`

#### Scenario: Odd squad is split with sizes differing by one

- **WHEN** 13 players are registered for a new match
- **THEN** one team has 7 players and the other 6, and every player is assigned to exactly one team

#### Scenario: No duplicate lineup entries

- **WHEN** the same player slug appears twice in one paste
- **THEN** the player is linked to the match only once and assigned to a single team

### Requirement: Abort registration when the squad cannot be balanced

Registration and balancing SHALL form a single atomic operation. When the squad cannot be balanced — including when too few players are registered to form two teams — the system SHALL abort the entire creation: no match, squad, player, or lineup row SHALL remain, and the operation SHALL report a user-facing failure.

#### Scenario: Too few players aborts creation

- **WHEN** a paste resolves to fewer players than required to form two teams
- **THEN** the operation fails with a user-facing message and no match, squad, or `match_player` rows are created

#### Scenario: Balance failure leaves nothing behind

- **WHEN** balancing fails after the match and players would otherwise have been written
- **THEN** the operation reports a failure and the system is left with no trace of the attempted match (no partial match, squad, or lineup)

### Requirement: Register match via a server action

The system SHALL expose the operation through a server action that accepts the raw pasted text, performs the parse-persist-and-balance pipeline atomically, and returns a typed response. On success the response SHALL include the created match id and the created/updated counts plus any parse warnings, and the persisted lineup SHALL already be split into balanced teams. On failure — including a balancing failure — it SHALL return an error with a user-facing message and SHALL NOT leave the system in a partially-created or inconsistent state visible as a successful run.

#### Scenario: Successful registration response

- **WHEN** a valid paste is submitted
- **THEN** the action returns success with `{ matchId, createdCount, updatedCount, warnings[] }` and the match's lineup is already balanced into teams `a` and `b`

#### Scenario: Empty or unparseable input

- **WHEN** the submitted text contains no recognizable header or player lines
- **THEN** the action returns a failure response with a user-facing message and creates nothing

#### Scenario: Balancing failure surfaces as a registration failure

- **WHEN** the paste parses but the squad cannot be balanced
- **THEN** the action returns a failure response with a user-facing message and creates nothing
