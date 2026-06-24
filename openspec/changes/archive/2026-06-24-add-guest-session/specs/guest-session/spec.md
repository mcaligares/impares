## ADDED Requirements

### Requirement: Identify a user by name

The system SHALL let an unauthenticated user identify themselves by providing a name. On the first identification it SHALL create a `guest` record (a generated id + the name) and persist the guest id in an httpOnly cookie. On a later identification by the same browser it SHALL update the existing guest's name rather than creating a new one. The name SHALL be validated as non-empty and within a configured maximum length.

#### Scenario: First identification creates the guest and sets the cookie

- **WHEN** a user with no guest cookie submits a name
- **THEN** a `guest` row is created with that name and an id, and the guest id is stored in an httpOnly cookie

#### Scenario: Re-identification updates the name

- **WHEN** a user who already has a guest cookie submits a different name
- **THEN** the existing guest's name is updated and no new guest is created

#### Scenario: Empty or too-long name is rejected

- **WHEN** a user submits an empty name or one longer than the configured maximum
- **THEN** the action returns a validation error and no guest is created or changed

### Requirement: Resolve the current guest from the cookie

The system SHALL provide a way to read the current guest from the request cookie, returning the guest (`id` and `name`) when the cookie is present and maps to an existing guest, or `null` when there is no cookie or no matching guest. This SHALL be usable from server components and from server actions.

#### Scenario: Identified user is resolved

- **WHEN** a request carries a valid guest cookie
- **THEN** the current guest is returned with its id and name

#### Scenario: Anonymous user resolves to null

- **WHEN** a request has no guest cookie (or it references a guest that no longer exists)
- **THEN** the current guest resolves to `null` without error

### Requirement: Anonymous, cookie-based identity (no account)

The identity SHALL be account-less: it requires no password and no Better Auth session, and the guest id SHALL live only in an httpOnly cookie (not readable by client-side JavaScript). The cookie name and lifetime SHALL come from config.

#### Scenario: Identity persists across visits

- **WHEN** an identified user returns later in the same browser
- **THEN** the cookie still resolves to the same guest, preserving their name

### Requirement: Minimal identity UI

The system SHALL provide a minimal UI to capture and display the user's name: when not identified it SHALL offer a name input that calls the identify action; when identified it SHALL show the current name. It SHALL NOT include any voting controls.

#### Scenario: Prompt then display

- **WHEN** an unidentified user opens the app
- **THEN** a name prompt is shown; after submitting a valid name, the UI shows that name and no longer prompts
