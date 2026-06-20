# ADR-004: Authentication

## Status

Accepted — June 2026

## Context

Most projects in the portfolio need user authentication: email/password login, OAuth providers (Google, GitHub), session management, password reset flows, and optionally 2FA, passkeys, and organizations/teams.

The authentication market splits into two architectural models:

- **Managed services** (Clerk, Auth0, Supabase Auth) — user data lives on the vendor's servers; we call their API. Pricing typically scales with Monthly Active Users (MAU).
- **Open-source libraries** (Better Auth, Auth.js) — user data lives in our own database; the library handles flows. Pricing is $0 by definition.

In a multi-site portfolio, per-MAU pricing accumulates fast. We need an auth solution that:

1. Has predictable cost independent of user growth.
2. Stores user data in our own database (no sync gymnastics).
3. Supports modern flows (OAuth, 2FA, passkeys, organizations).
4. Has good Next.js App Router integration.
5. Is not tied to a single hosting platform or database.

## Decision Drivers

- **Cost at scale** — must remain predictable across portfolio growth.
- **Data residency** — preference for user data in our own database.
- **Next.js App Router compatibility** — first-class Server Components support.
- **Feature completeness out of the box** — OAuth, passkeys, 2FA, organizations.
- **Library maturity and roadmap signal** — long-term viability matters.

## Options Considered

### Option A — Better Auth

Open-source TypeScript-first auth library released in 2024.

- **License:** MIT, $0 forever.
- **Storage:** Our own database (Postgres, MySQL, SQLite).
- **Features:** Email/password, OAuth, magic links, passkeys, 2FA, organizations, RBAC — all in core.
- **Trajectory:** In September 2025, the Auth.js maintainers joined Better Auth, signaling it as the spiritual successor.
- **Weekly downloads:** ~100K and growing.
- **UI:** Not included — we build forms ourselves.

### Option B — Auth.js (NextAuth v5)

The longtime default for Next.js authentication, recently rebranded.

- **License:** MIT, $0 forever.
- **Storage:** Our own database via adapters.
- **Features:** OAuth and session management core; passkeys, 2FA, organizations require third-party plugins or custom code.
- **Weekly downloads:** ~2.5M (largest installed base).
- **Trajectory:** Maintenance is uncertain after the team move to Better Auth in 2025.
- **UI:** Not included.

### Option C — Clerk

Managed authentication service with pre-built UI components.

- **Pricing:** Free up to 10,000 MAU (changed February 2026 — previously 50K). Then $25/month base + $0.02 per additional MAU on Pro.
- **Storage:** User data lives on Clerk's servers (US-only, no EU data residency).
- **Features:** Pre-built `<SignIn>`, `<SignUp>`, `<UserProfile>` React components. OAuth, organizations, MFA, passkeys.
- **Best DX of the four:** ~15-minute setup.
- **Cost at scale:** 100K MAU = approximately $2,025/month.

### Option D — Supabase Auth

The bundled auth layer of the Supabase platform, built on the open-source GoTrue service.

- **Pricing:** Free up to 50K MAU, then $0.00325 per additional MAU on the Supabase Pro plan ($25/month base).
- **Storage:** Users live in your Supabase Postgres database.
- **Features:** OAuth, magic links, MFA, integrates with Postgres Row Level Security.
- **Lock-in:** Requires using Supabase as your database (or running GoTrue separately, which loses the integration value).

## Comparative Analysis

| Criterion | Better Auth | Auth.js (NextAuth v5) | Clerk | Supabase Auth |
|---|---|---|---|---|
| **Pricing model** | $0 (library) | $0 (library) | Per-MAU | Per-MAU |
| **Cost at 10K MAU** | $0 | $0 | $0 | $0 |
| **Cost at 100K MAU** | $0 | $0 | ~$2,025/mo | ~$163/mo |
| **Cost at 500K MAU** | $0 | $0 | ~$9,825/mo | ~$1,463/mo |
| **User data location** | Our DB | Our DB | Clerk (US only) | Supabase (your project) |
| **Pre-built UI** | No | No | **Yes** | Minimal |
| **OAuth providers** | Yes | Yes | Yes | Yes |
| **Passkeys / 2FA in core** | **Yes** | Plugins | Yes (Pro tier) | Yes |
| **Organizations / RBAC** | **Yes (built-in)** | Manual | Yes (Pro tier) | Manual via RLS |
| **Next.js App Router** | First-class | First-class | First-class | Good |
| **Self-host friendly** | Yes | Yes | No | Yes (self-host Supabase) |
| **Maintenance roadmap signal** | Strong (Auth.js team joined) | Uncertain (team left) | Strong (commercial) | Strong (commercial) |

## Decision

**Better Auth** is selected as the authentication library.

Rationale:

1. **Cost is $0 regardless of user count or project count.** This is the dominant criterion for a multi-site portfolio.
2. **User data lives in our own Neon database** (see ADR-002). Joins between application tables and user records are direct SQL — no webhooks, no sync jobs, no eventual consistency.
3. **Modern features (passkeys, 2FA, organizations, RBAC) are core**, not plugins. This avoids the Auth.js situation where each feature is a community plugin of varying quality.
4. **The Auth.js team moved to Better Auth in September 2025**, which is a strong roadmap signal. It is effectively the future of the Auth.js ecosystem.
5. **No US-only data residency lock-in** (Clerk's main GDPR weakness). User data lives wherever Neon hosts our database.

Clerk was a close runner-up. It would be the right choice if (a) we wanted ready-made UI components and (b) we knew the project would stay under 10K MAU. Above that threshold, the per-MAU cost makes it untenable for a portfolio model.

## Consequences

### Positive

- Zero auth cost regardless of how many users or how many sites.
- User records live alongside business data — simpler queries, no cross-system joins.
- Modern features (passkeys, 2FA, organizations) are built-in, not bolted on.
- No vendor lock-in: schema is portable, easy to migrate if needed.

### Negative / Trade-offs

- **No pre-built UI components.** Login, signup, password reset, and account pages must be built. Mitigation: shadcn/ui blocks plus Better Auth examples cover most of this in a day per project.
- **Security patching is our responsibility.** Updates to the library must be applied promptly. Mitigation: Dependabot + a regular dependency review window.
- **Library is relatively young** (released 2024). The Auth.js team migration mitigates risk, but it has a smaller production track record than Clerk or Auth.js.
- **No SSO/SAML connectors for enterprise** out of the box. If a B2B project requires enterprise SSO, we evaluate WorkOS for that project specifically.

### Revisit Triggers

- A specific project requires enterprise SSO/SAML at scale → adopt WorkOS for that project (or Clerk Business tier).
- A project requires SOC 2 / HIPAA compliance from the auth layer itself → reconsider managed services (Clerk Business / Auth0).
- Better Auth abandonware risk materializes (project stops being maintained) → migrate to Auth.js fork or self-host (the data is ours, migration is feasible).

## References

- Better Auth Documentation — https://www.better-auth.com/
- Auth.js (NextAuth) Documentation — https://authjs.dev/
- Clerk Pricing — https://clerk.com/pricing
- Supabase Auth — https://supabase.com/docs/guides/auth
- "Better Auth vs Clerk vs NextAuth vs Supabase Auth: Which Authentication for Next.js SaaS in 2026" — https://makerkit.dev/blog/tutorials/better-auth-vs-clerk
- "Clerk vs Better Auth (2026) — We Verified Every Price So You Don't Have To" — https://dev.to/thiago_alvarez_a7561753aa/clerk-vs-better-auth-2026-we-verified-every-price-so-you-dont-have-to-13pk
- "Better Auth vs Clerk vs Auth.js for Next.js 2026" — https://www.buildmvpfast.com/blog/betterauth-vs-clerk-nextjs-mvp-auth-2026
- "Best Next.js Authentication Solutions in 2026" — https://www.pkgpulse.com/guides/best-nextjs-auth-solutions-2026
- "Better Auth vs Clerk vs NextAuth: 2026 SaaS Showdown" — https://starterpick.com/blog/better-auth-clerk-nextauth-saas-showdown-2026
