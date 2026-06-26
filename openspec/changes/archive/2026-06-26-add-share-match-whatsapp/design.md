## Context

The match page (`/partido/[id]`) follows the orchestrator pattern: `page.tsx` (server) fetches `getMatchTeams` and recent matches, and `page.client.tsx` (client) composes feature components. The page already has the match id and location in `teams.match`. The app exposes `NEXT_PUBLIC_SITE_URL` (browser-available) for building absolute URLs. Feature components live under `src/components/match/` and use the atomic `ui/button.tsx`. This change is UI-only — no actions, services, or data model touched.

## Goals / Non-Goals

**Goals:**
- One-tap share of the current match into WhatsApp via a native `wa.me` link.
- Absolute, openable match link built from `NEXT_PUBLIC_SITE_URL` + `/partido/{id}`.
- Spanish message copy: "Miren este partido que armé: {LINK}".

**Non-Goals:**
- No WhatsApp Business API, SDK, or server-side message sending.
- No deep-linking to a specific group (`wa.me/?text=` opens the chat picker by design).
- No new env var, action, or change to what match data reaches the client.
- No Web Share API / clipboard fallback in this change.

## Decisions

- **Plain `wa.me/?text=` link over the WhatsApp Business API.** The request is a share-to-group flow; `https://wa.me/?text=<encoded>` is the documented, zero-dependency way to prefill a message and let the user pick the chat. Alternatives (Business API, `whatsapp://` scheme) add infra or break on desktop web.
- **Build the URL in a small client feature component** (`share-match.tsx` under `src/components/match/`), rendered by `page.client.tsx`, receiving the match `id` (or path) as a prop. Keeps the orchestrator thin and follows the "components receive data as props" rule; the component only reads `NEXT_PUBLIC_SITE_URL` and composes a link — no action calls.
- **Encode the whole message with `encodeURIComponent`.** The message embeds a URL and accented Spanish text, both of which must survive the `text` query param.
- **Render as an anchor styled like the existing button** (or `Button` wrapping an `<a>`), opened with `target="_blank"` + `rel="noopener noreferrer"`, so the match page is not replaced.
- **Origin resolution.** Use `NEXT_PUBLIC_SITE_URL` as the canonical origin so shared links are stable regardless of where the page is viewed; fall back to `window.location.origin` only if the var is unset.

## Risks / Trade-offs

- `NEXT_PUBLIC_SITE_URL` unset or wrong in an environment → shared link points at the wrong origin. Mitigation: fall back to `window.location.origin`; the var already ships in `.env.example`.
- `wa.me` cannot target a specific group (WhatsApp limitation) → user picks the chat each time. Accepted; it is the standard behavior and matches the request.
- Trailing-slash / double-slash when joining origin and path → build the URL carefully (no duplicate `/`).

## Migration Plan

Pure additive UI. Deploy ships the button; no migration or data backfill. Rollback is removing the component render — no persisted state.

## Open Questions

- None blocking. Exact button placement (in the match header vs. near the team board) is a layout detail resolved during implementation; the EA-FC dark visual style applies.
