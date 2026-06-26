## ADDED Requirements

### Requirement: Match page can be shared to WhatsApp

The match page (`/partido/[id]`) SHALL present a "Compartí esta elegida" control that opens a WhatsApp share link for the current match. The control SHALL build a `https://wa.me/?text=<message>` URL whose message contains an invitation followed by the match's absolute URL (for example `Miren este partido que armé: {LINK}`). The link `{LINK}` SHALL be the absolute match URL formed from the configured site URL (`NEXT_PUBLIC_SITE_URL`) and the match's `/partido/{id}` path. The full message SHALL be URL-encoded so the link and accented characters survive the query string. The control SHALL open the WhatsApp link in a new context (so the match page is not navigated away from) and SHALL NOT expose any score, total, or other internal balancing data.

#### Scenario: Sharing opens WhatsApp with the prefilled invitation

- **WHEN** the organizer taps "Compartí esta elegida" on a match page
- **THEN** a `https://wa.me/?text=...` link opens in a new context with a URL-encoded message that reads like "Miren este partido que armé:" followed by the match's absolute `/partido/{id}` URL

#### Scenario: Shared link is absolute and openable outside the app

- **WHEN** the share message is built for a match
- **THEN** the embedded match link uses the configured site URL as its origin so a recipient opening it from WhatsApp reaches that match's page

#### Scenario: Share action reveals no internal data

- **WHEN** the share link is generated
- **THEN** the message contains only the invitation text and the match URL, and no score, team total, or balancing detail
