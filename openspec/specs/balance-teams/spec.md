# balance-teams Specification

## Purpose

Score confirmed players from their graded attributes and split a match's squad into two balanced teams, persisting the assignment per match and exposing the operation through a server action.

## Requirements

### Requirement: Score a player from attributes

The system SHALL compute a numeric score for a player from their `attributes` as a weighted sum of each attribute's 1–5 rating times its importance weight. The attributes are `mobility` and `endurance`. The scoring function SHALL be pure and total: a missing attribute SHALL use the baseline rating (3), never an error. The per-attribute importance weights and the baseline SHALL live in config, and additional attributes SHALL be addable without changing callers.

#### Scenario: Score is the weighted sum of ratings

- **WHEN** a player has `mobility` 4 and `endurance` 2, with weights `mobility` 1.0 and `endurance` 1.3
- **THEN** the score is 6.6 (4·1.0 + 2·1.3)

#### Scenario: Endurance is weighted more than mobility

- **WHEN** player X has `mobility` 5 / `endurance` 1 and player Y has `mobility` 1 / `endurance` 5
- **THEN** player Y scores higher than player X, because endurance carries the larger weight

#### Scenario: Missing attribute uses the baseline

- **WHEN** a player has `mobility` 5 and no `endurance`
- **THEN** `endurance` is treated as the baseline 3, so the score reflects 5 + 3

#### Scenario: No attributes yields the baseline score

- **WHEN** a player has no `attributes`
- **THEN** every attribute uses the baseline 3 and no error is raised

### Requirement: Split players into two balanced teams

The system SHALL partition a set of confirmed players into exactly two teams, A and B, assigning every player to exactly one team. The partition SHALL minimize the difference between the two teams' total scores. Team sizes SHALL differ by at most one player.

#### Scenario: Even number of players

- **WHEN** 14 players are balanced
- **THEN** team A and team B each have 7 players and the difference in total score is minimized

#### Scenario: Odd number of players

- **WHEN** 13 players are balanced
- **THEN** one team has 7 and the other 6, and the smaller team's total score compensates so the total-score difference is minimized

#### Scenario: Every player is assigned

- **WHEN** any set of players is balanced
- **THEN** each player belongs to exactly one of A or B, and no player is left unassigned

### Requirement: Persist the team assignment for a match

The system SHALL load a match's confirmed `match_player` rows, balance them, and persist each row's `team` as `a` or `b`. The operation SHALL be scoped to a single match identified by `matchId`.

#### Scenario: Assignment is written

- **WHEN** balancing runs for a match with confirmed players
- **THEN** every `match_player` row for that match has `team` set to `a` or `b` (none left `unassigned`)

#### Scenario: Match with no players

- **WHEN** balancing runs for a match that has no `match_player` rows
- **THEN** the operation fails with a clear error and writes nothing

### Requirement: Re-draw overwrites the previous teams

The system SHALL allow balancing to run again on a match that already has teams assigned. Re-running SHALL recompute the split over the same players and overwrite the previous `team` values.

#### Scenario: Second run reassigns

- **WHEN** a match already has players assigned to A and B and balancing runs again
- **THEN** the teams are recomputed and the `match_player.team` values are overwritten with the new assignment

### Requirement: Balance via a server action

The system SHALL expose balancing through a server action that accepts a `matchId`, runs the balance-and-persist pipeline, and returns a typed response. On success the response SHALL include both teams with their player ids and each team's total score. On failure it SHALL return an error with a user-facing message.

#### Scenario: Successful balance response

- **WHEN** a valid `matchId` with confirmed players is submitted
- **THEN** the action returns success with `{ teamA: { players, totalScore }, teamB: { players, totalScore } }`

#### Scenario: Missing or invalid match

- **WHEN** the `matchId` is empty or has no confirmed players
- **THEN** the action returns a failure response with a user-facing message and changes nothing
