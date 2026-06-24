## REMOVED Requirements

### Requirement: Link players to the match as an unassigned lineup

**Reason:** Registration now balances the squad as part of creation, so players are persisted already assigned to a team instead of awaiting a separate split step.
**Migration:** A freshly registered match arrives with each player assigned to team `a` or `b` (see "Link players to the match as balanced teams"). The `unassigned` state remains valid in the schema but is no longer produced by a successful registration.

## ADDED Requirements

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

## MODIFIED Requirements

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
