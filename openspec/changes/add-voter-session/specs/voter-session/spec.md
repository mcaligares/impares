## ADDED Requirements

### Requirement: Identify a user by name

The system SHALL let an unauthenticated user identify themselves by providing a name. On the first identification it SHALL create a `voter` record (a generated id + the name) and persist the voter id in an httpOnly cookie. On a later identification by the same browser it SHALL update the existing voter's name rather than creating a new one. The name SHALL be validated as non-empty and within a configured maximum length.

#### Scenario: First identification creates the voter and sets the cookie

- **WHEN** a user with no voter cookie submits a name
- **THEN** a `voter` row is created with that name and an id, and the voter id is stored in an httpOnly cookie

#### Scenario: Re-identification updates the name

- **WHEN** a user who already has a voter cookie submits a different name
- **THEN** the existing voter's name is updated and no new voter is created

#### Scenario: Empty or too-long name is rejected

- **WHEN** a user submits an empty name or one longer than the configured maximum
- **THEN** the action returns a validation error and no voter is created or changed

### Requirement: Resolve the current voter from the cookie

The system SHALL provide a way to read the current voter from the request cookie, returning the voter (`id` and `name`) when the cookie is present and maps to an existing voter, or `null` when there is no cookie or no matching voter. This SHALL be usable from server components and from server actions.

#### Scenario: Identified user is resolved

- **WHEN** a request carries a valid voter cookie
- **THEN** the current voter is returned with its id and name

#### Scenario: Anonymous user resolves to null

- **WHEN** a request has no voter cookie (or it references a voter that no longer exists)
- **THEN** the current voter resolves to `null` without error

### Requirement: Anonymous, cookie-based identity (no account)

The identity SHALL be account-less: it requires no password and no Better Auth session, and the voter id SHALL live only in an httpOnly cookie (not readable by client-side JavaScript). The cookie name and lifetime SHALL come from config.

#### Scenario: Identity persists across visits

- **WHEN** an identified user returns later in the same browser
- **THEN** the cookie still resolves to the same voter, preserving their name

### Requirement: Minimal identity UI

The system SHALL provide a minimal UI to capture and display the user's name: when not identified it SHALL offer a name input that calls the identify action; when identified it SHALL show the current name. It SHALL NOT include any voting controls.

#### Scenario: Prompt then display

- **WHEN** an unidentified user opens the app
- **THEN** a name prompt is shown; after submitting a valid name, the UI shows that name and no longer prompts
