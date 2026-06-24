## Context

Future features need to know "who is this" to dedupe votes and show who voted — but a casual football group doesn't want passwords. Better Auth already exists for real accounts; this is a deliberately separate, lightweight anonymous identity. The unit is a `guest` (id + name). The browser carries the guest id in a cookie; the name lives in the DB so future voting can FK to it and display it.

This is Next.js 16: `cookies()` from `next/headers` is **async**, and cookies can only be **written** from a server action or route handler (not during server-component render). Reading is allowed anywhere.

## Goals / Non-Goals

**Goals:**
- A `guest` entity (id + name) and a cookie that maps a browser to it.
- `identifyGuest(name)` (create-or-update + set cookie) and `getCurrentGuest()` (read cookie → guest | null).
- A minimal UI to set and show the name.
- Keep it separate from Better Auth and from any voting logic.

**Non-Goals:**
- Any voting (matchup vote, characteristic vote) or vote storage — future changes.
- Merging with Better Auth accounts, multi-device identity, or anti-abuse hardening.
- Server-side rendering gates / protecting routes by guest.

## Decisions

**1. `guest` is a DB entity; the cookie holds only its id.**
`guest` = `{ id: uuid, name: text, ...timestamps }`. The httpOnly cookie stores `guest.id`. *Rationale:* future votes FK to `guest` and the name must be queryable/displayable; storing the name in a readable cookie instead would not survive as a join target and could be tampered with. *Alternative considered:* name-in-cookie, no DB — rejected for the above.

**2. The guest + cookie are created lazily, at identification time.**
No row or cookie is created for passers-by. `getCurrentGuest()` returns `null` until the user gives a name. `identifyGuest(name)` is what creates the `guest` and sets the cookie (or updates the name if the cookie already maps to one). *Rationale:* avoids junk rows for every visitor.

**3. httpOnly cookie, config-driven.**
The cookie is httpOnly + sameSite=lax + long max-age, set with the async `cookies()` API inside the action. Name/max-age live in `session.config.ts`. *Rationale:* server-readable (for future voting actions), not exposed to client JS; cookie over localStorage so the server can read the identity directly — see [ADR-012](../../../docs/adrs/ADR-012-client-identity-storage.md).

**4. Layer split keeps HTTP out of the service.**
- `src/lib/session/guest-cookie.ts`: `getGuestId()` / `setGuestId(id)` — the only place that touches `cookies()`.
- `guest.service.ts`: `getGuest(db, id)` and `saveGuest(db, { id, name })` (create-or-update) — DB only, no cookie (honors the services "no HTTP concerns" rule).
- `guest.actions.ts`: `identifyGuest(name)` orchestrates cookie-read → `saveGuest` → cookie-set; `getCurrentGuest()` does cookie-read → `getGuest`. Validation (name) happens here / via the validator.

**5. Minimal UI.**
A small client component: shows a name input when `getCurrentGuest()` is `null`, otherwise shows the name. It calls `identifyGuest` via the page client (action-as-prop / orchestrator pattern). No voting controls.

## Risks / Trade-offs

- **Cookie clearing / different browser loses identity** → the user reappears as anonymous. Mitigation: acceptable for a casual tool; long max-age reduces friction; future Better-Auth linking could harden it.
- **No anti-abuse** → one person can re-identify under many names / clear the cookie to vote twice (relevant only once voting exists). Mitigation: out of scope here; note it for the voting change.
- **Name collisions** → two people can pick the same name; identity is the cookie id, not the name, so votes still dedupe per browser. Mitigation: acceptable; the name is a label, not the key.
- **Writing cookies only in actions/handlers (Next 16)** → `getCurrentGuest()` (read) can run anywhere, but creating identity must go through the action. Mitigation: that's the intended split.

## Migration Plan

New `guest` table → `pnpm db:generate` produces the migration (apply with `pnpm db:migrate` when ready). Otherwise code-only. Rollback: revert the change; drop the table if migrated.

## Open Questions

- Where the identity prompt lives (global header vs only where voting will appear) — start minimal, refine when the first voting feature lands.
- Whether to later link a `guest` to a Better Auth `user` when the same person logs in — deferred to the voting/auth change.
