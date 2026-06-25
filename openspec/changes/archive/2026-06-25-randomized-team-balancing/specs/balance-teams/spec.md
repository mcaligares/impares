## MODIFIED Requirements

### Requirement: Split players into two balanced teams

The system SHALL partition a set of confirmed players into exactly two teams, A and B, assigning every player to exactly one team. Team sizes SHALL differ by at most one player. The partition SHALL keep the difference between the two teams' total scores minimal by sampling several random partitions and selecting, at random, one partition from those with the smallest observed total-score gap. The selection source of randomness SHALL be injectable so the function stays pure and deterministic under test.

#### Scenario: Even number of players

- **WHEN** 14 players are balanced
- **THEN** team A and team B each have 7 players and the difference in total score is minimal among the sampled partitions

#### Scenario: Odd number of players

- **WHEN** 13 players are balanced
- **THEN** one team has 7 and the other 6, and the smaller team's total score compensates so the total-score difference is minimal among the sampled partitions

#### Scenario: Every player is assigned

- **WHEN** any set of players is balanced
- **THEN** each player belongs to exactly one of A or B, and no player is left unassigned

#### Scenario: Single optimal partition is stable

- **WHEN** the players admit only one balanced partition (up to swapping the team labels)
- **THEN** every run returns that same partition regardless of the random source

### Requirement: Re-draw overwrites the previous teams

The system SHALL allow balancing to run again on a match that already has teams assigned. Re-running SHALL recompute the split over the same players and overwrite the previous `team` values. When more than one minimal-gap partition exists for those players, re-running SHALL be able to produce a different team composition from the previous draw, so the action visibly re-shuffles the squad.

#### Scenario: Second run reassigns

- **WHEN** a match already has players assigned to A and B and balancing runs again
- **THEN** the teams are recomputed and the `match_player.team` values are overwritten with the new assignment

#### Scenario: Re-running varies the teams when alternatives exist

- **WHEN** a squad has several equally-balanced partitions and balancing is run repeatedly
- **THEN** the produced team compositions vary across runs rather than always returning the identical split
