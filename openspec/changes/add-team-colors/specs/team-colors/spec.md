## ADDED Requirements

### Requirement: A palette of team colors excluding the brand color

The system SHALL define a palette of candidate team colors in config. No palette entry SHALL be the landing/brand color (cyan), and the palette SHALL avoid colors too close to it. The palette SHALL contain enough distinct entries to assign two different colors per match.

#### Scenario: Palette excludes the brand color

- **WHEN** the team palette is read
- **THEN** it contains at least two colors and none of them is the brand cyan

### Requirement: Each match gets two distinct team colors at creation

When a match is created, the system SHALL assign Team A and Team B a color **chosen at random from the palette**, and the two colors SHALL be **different from each other**.

#### Scenario: Two different colors are assigned

- **WHEN** a match is created
- **THEN** Team A and Team B each receive a palette color and the two are not equal

#### Scenario: Neither team gets the brand color

- **WHEN** a match is created
- **THEN** neither team's color is the brand cyan

### Requirement: Team colors persist with the match

The assigned colors SHALL be stored on the match and SHALL remain stable: reopening the match, reloading the page, or re-running the balance ("Rearmar equipos") SHALL show the same two colors.

#### Scenario: Colors are stable across reloads and re-draws

- **WHEN** a match's teams are colored and the page is reloaded or the teams are re-drawn
- **THEN** Team A and Team B keep the colors they were assigned at creation

### Requirement: The match page renders each team in its color

The match page SHALL render each team using its stored color — at minimum the team name and the team's visual container — and SHALL also color each player's card accent to its team. A match that has no stored colors (created before this feature) SHALL fall back to default colors without error.

#### Scenario: Teams shown in their assigned colors

- **WHEN** a match with stored team colors is viewed
- **THEN** Team A's name/container and player cards use Team A's color, and Team B's use Team B's color

#### Scenario: Legacy match without colors

- **WHEN** a match created before this feature (no stored colors) is viewed
- **THEN** the teams render with default colors and no error
