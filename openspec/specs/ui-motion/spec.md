# ui-motion Specification

## Purpose

The ui-motion capability covers the app's interaction and feedback motion: the primary-button hover shimmer, the celebration fired when a match is created, the entrance animation of the two teams on the match page, and the cross-cutting requirement that all of this motion respects the user's reduced-motion preference. It governs how motion behaves, not the data or layout it decorates.

## Requirements

### Requirement: Primary button hover shimmer completes cleanly

The primary button SHALL show a shine/shimmer overlay that sweeps once across the button on hover. The sweep SHALL always resolve to an off-screen resting position so it NEVER freezes part-way across the button or visibly snaps backward when the pointer leaves mid-sweep. The shimmer is a non-interactive, decorative overlay and SHALL NOT capture pointer events.

#### Scenario: Sweep completes on a sustained hover

- **WHEN** the pointer hovers a primary button and stays
- **THEN** the shine sweeps once from one edge to the other and comes to rest off-screen, leaving the button visually unchanged afterward

#### Scenario: Pointer leaves mid-sweep

- **WHEN** the pointer leaves the button while the shine is part-way across it
- **THEN** the shine does not freeze in the middle or jump backward; it settles to an off-screen position with no abrupt visual glitch

### Requirement: Match creation triggers a confetti celebration

When the user submits the create-match form ("Crear partido") and the match is created successfully, the app SHALL fire a confetti burst as positive feedback before or as the user is taken to the new match page. The celebration SHALL only fire on success, never when creation fails or input is invalid. The burst SHALL be gated by the existing confetti feature flag.

#### Scenario: Successful creation celebrates

- **WHEN** the organizer clicks "Crear partido" with a valid list and the match is created
- **THEN** a confetti burst fires and the app navigates to the new match's page

#### Scenario: Failed creation does not celebrate

- **WHEN** the organizer submits and creation fails or the input is invalid
- **THEN** no confetti fires and the error is shown without navigating

#### Scenario: Confetti feature flag disabled

- **WHEN** the confetti feature flag is off
- **THEN** creating a match navigates normally with no confetti

### Requirement: Teams enter the match page from opposite sides

When the match page shows built teams, Equipo A SHALL animate in horizontally from the left (moving left → right) and Equipo B SHALL animate in horizontally from the right (moving right → left). Each entrance SHALL use an overshoot/bounce easing so the column slightly passes its final position and settles back, for added impact. The two columns SHALL come to rest in their normal side-by-side layout.

#### Scenario: Built teams reveal from opposite sides

- **WHEN** the match page renders with teams already built, or the organizer clicks "Armar equipos"/"Re-draw" and teams appear
- **THEN** Equipo A slides in from the left and Equipo B slides in from the right, each overshooting slightly and settling into place

### Requirement: All motion respects reduced-motion preference

Every animation in this capability — the button shimmer, the team-entrance slides, and the confetti — SHALL be suppressed or reduced when the user has `prefers-reduced-motion: reduce` set, leaving content fully visible and usable.

#### Scenario: Reduced motion is requested

- **WHEN** a user with `prefers-reduced-motion: reduce` loads the pages
- **THEN** the button shimmer and team-entrance slides do not play (teams appear in their final positions) and no decorative motion is forced on the user
