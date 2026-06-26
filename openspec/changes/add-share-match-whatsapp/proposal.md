## Why

Once an organizer builds a match, the only way to invite the squad is to copy the URL by hand and paste it into the WhatsApp group. A one-tap "Compartí esta elegida" share button removes that friction and matches how organizers actually distribute the match — straight into their group chat.

## What Changes

- Add a "Compartí esta elegida" share control on the match page (`/partido/[id]`).
- Tapping it opens a WhatsApp share link (`https://wa.me/?text=...`) with a prefilled message such as `Miren este partido que armé: {LINK}`, where `{LINK}` is the absolute URL of the current match.
- The match URL is built from the existing `NEXT_PUBLIC_SITE_URL` env var plus the match's `/partido/{id}` path, so the shared link is absolute and openable outside the app.
- The message text is URL-encoded so the match link and accents survive the `wa.me` query string.

## Capabilities

### New Capabilities
<!-- None -->

### Modified Capabilities
- `match-ui`: Adds a requirement that the match page offers a WhatsApp share action linking to the match's absolute URL.

## Impact

- **Code**: `src/app/partido/[id]/page.client.tsx` (orchestrator renders the control); a new share component under `src/components/match/`; reuses `src/components/ui/button.tsx`.
- **Config**: relies on the existing `NEXT_PUBLIC_SITE_URL` env var — no new variable.
- **Dependencies**: none; uses the native `wa.me` link, no SDK.
