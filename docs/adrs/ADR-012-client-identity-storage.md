# ADR-012: Client Identity Storage (Cookies over localStorage)

## Status

Accepted — June 2026

## Context

The app needs a lightweight, account-less way to recognize a returning user so that upcoming features can attribute and **deduplicate votes** (on the matchup and on player characteristics). This is intentionally separate from real authentication (Better Auth, see [ADR-004](ADR-004-authentication.md)); the unit is an anonymous `voter` (an id + a name).

The browser must carry a stable identifier between visits, and — critically — the **server must be able to read that identifier**, because voting runs through Next.js Server Actions that write to the database (see the `add-voter-session` change). The two realistic browser-side storage mechanisms behave very differently on that point:

- **Cookies** are sent automatically with every request, so the server reads them directly; they can be marked `httpOnly` (invisible to JavaScript).
- **`localStorage`** lives only in the browser; it is never transmitted, so the server can only ever see it if the client manually copies the value into every request body.

We need to choose where the anonymous voter id lives.

## Decision Drivers

- **Server-readability** — voting executes in Server Actions and persists to the DB; the identity must be available server-side without client cooperation.
- **Tamper / abuse resistance** — the id should not be trivially editable by page scripts, and should not be exposed to XSS.
- **Persistence across visits** — identity should survive reloads and return visits.
- **Automatic transmission** — fewer moving parts than threading an id through every request manually.
- **Fit with the layered architecture** — keep HTTP concerns at the boundary, DB-only in services.

## Options Considered

### Option A — `httpOnly` cookie (server-set)

An anonymous id in a cookie marked `httpOnly`, `sameSite=lax`, long `max-age`, set from a Server Action.

- Sent automatically on every request → readable in Server Components and Server Actions.
- Not accessible to client JavaScript → not exposed to XSS, not editable by page scripts.
- Standard for session-like identifiers.

### Option B — `localStorage`

The id stored in `localStorage` by client code.

- Never sent to the server. To vote, the client must read it and include it in each action call.
- Fully readable/writable by any script on the page → easy to tamper and exposed to XSS.
- Survives reloads, but is client-only and per-origin.

### Option C — Non-`httpOnly` (JavaScript) cookie

A cookie set/read by client JavaScript.

- Auto-sent to the server (good), but readable/writable by scripts → XSS-exposed and editable, with no real upside over Option A for our use.

## Comparative Analysis

| Criterion | A — `httpOnly` cookie | B — `localStorage` | C — JS cookie |
|---|---|---|---|
| **Server can read it** | **Yes (automatic)** | No (must be sent manually) | Yes (automatic) |
| **Sent with every request** | **Yes** | No | Yes |
| **Exposed to client JS / XSS** | **No** | Yes | Yes |
| **Editable by page scripts** | **No** | Yes | Yes |
| **Persists across visits** | Yes | Yes | Yes |
| **Works in Server Actions / SSR** | **Yes** | Only via manual plumbing | Yes |
| **Extra per-request plumbing** | None | Required | None |

## Decision

**Use an `httpOnly` cookie** to store the anonymous voter id.

Rationale:

1. **Voting is server-side.** Server Actions need the identity to look up / create the `voter` and dedupe votes. A cookie arrives automatically; `localStorage` would force every action to receive the id as an argument, which is fragile and trivially spoofable.
2. **`httpOnly` keeps it out of reach of page scripts** — not readable by XSS, not editable by a curious user via devtools. The id is a server-managed handle, not page state.
3. **It fits the layered architecture cleanly**: a single cookie helper in `src/lib/session/` is the only place touching `cookies()`; services stay DB-only with no HTTP concerns.
4. The name (the human-facing label) lives in the DB on the `voter` row, not in the cookie, so it can be joined and displayed by future voting features and cannot be tampered with client-side.

`localStorage` would be acceptable only for purely client-side, non-authoritative state. Identity that the server must trust for write operations is not that.

## Consequences

### Positive

- Identity is available everywhere on the server with zero per-request plumbing.
- The id is not exposed to JavaScript (no XSS leak, no casual tampering).
- Clean layer separation: cookie I/O at the boundary, DB in services.

### Negative / Trade-offs

- **Cookies in Next.js 16 can only be written from a Server Action or Route Handler** (the async `cookies()` API), not during Server Component render. Mitigation: identity is established through the `identifyVoter` action, which is where the cookie is set anyway.
- **Clearing cookies / switching browser drops the identity** (reappears as anonymous). Mitigation: acceptable for a casual tool; long `max-age` reduces friction.
- **`httpOnly` means the client cannot read the id directly.** The current name is surfaced to the UI from the server instead. Acceptable — the UI never needs the raw id.
- **No anti-abuse on its own** — a user can clear the cookie or re-identify under another name. Out of scope here; to be addressed by the voting change (and optionally by linking to a Better Auth account).

### Revisit Triggers

- A feature genuinely needs the id in client JavaScript with no server round-trip → reconsider a readable cookie or a client-exposed token (with the security trade-off documented).
- Vote abuse becomes a real problem → harden identity (rate limits, optional Better Auth linking), revisiting this anonymous model.

## References

- MDN — Using HTTP cookies — https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies
- MDN — Window.localStorage — https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
- OWASP — HTML5 Security Cheat Sheet (Local Storage) — https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html#local-storage
- Next.js — `cookies()` — https://nextjs.org/docs/app/api-reference/functions/cookies
- ADR-004 — Authentication (Better Auth) — ADR-004-authentication.md
