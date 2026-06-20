# ADR-002: Database

## Status

Accepted — June 2026

## Context

Most projects in the portfolio require a relational database for application data (users, content, transactions). Across the portfolio, the access patterns vary: some sites are dormant most of the day, others have steady but low traffic, and a few may grow substantially. We need a database service that:

1. Allows multiple projects without paying a flat per-project fee.
2. Scales cost down when a project is idle (scale-to-zero or equivalent).
3. Uses an open standard so we can move away if needed.
4. Provides isolated environments per branch/preview deployment.
5. Has a viable free tier for prototyping and pre-launch projects.

The decisive criterion is **how cost scales when adding the Nth project**, not the entry price alone.

## Decision Drivers

- **Per-project marginal cost** — must be near zero across the portfolio.
- **Scale-to-zero** — idle projects should not generate compute charges.
- **Standard SQL dialect** — to avoid lock-in and preserve migration options.
- **Free tier covering early projects** — multi-project free tier preferred.
- **Branching for preview environments** — to avoid paying for separate staging databases.
- **Production reliability** — must support real applications, not only prototypes.

## Options Considered

### Option A — Neon (Serverless PostgreSQL)

Neon is a serverless Postgres platform that separates compute from storage, allowing scale-to-zero.

- **Free tier:** 10 projects, 0.5 GB storage per project, 100 CU-hours/month per project (1 Compute Unit = 1 vCPU + 4 GB RAM).
- **Launch:** $19/month, covers up to 1,000 projects in one organization, 10 GB storage included, 300 compute hours included.
- **Scale:** $69/month for higher compute and storage tiers.
- Compute scales to zero after inactivity; cold start ~300–500 ms.
- Native database branching (copy-on-write) for preview environments at no extra cost.
- Acquired by Databricks in May 2025.

### Option B — Supabase (Postgres + BaaS bundle)

Supabase bundles Postgres with Auth, Storage, Realtime, and Edge Functions.

- **Free tier:** 2 projects, 500 MB database storage, 50K Auth MAU, 1 GB file storage. Projects pause after 7 days of inactivity.
- **Pro:** $25/month per organization, includes $10 in compute credits (one Micro instance). **Each additional project requires its own ~$10/month compute on top.**
- Postgres does **not** scale to zero — compute runs continuously.
- Includes Row Level Security as a first-class feature.

### Option C — Turso (Distributed SQLite)

Turso is a managed distributed SQLite platform (libSQL fork) with edge replicas.

- **Free tier:** 100 databases, 5 GB storage, 500M row reads/month.
- **Developer:** $4.99/month, 500 active DBs, 9 GB storage.
- Scale-to-zero was deprecated in January 2026 — DBs are now always-on in paid tiers.
- SQLite-based: fewer concurrent writes than Postgres, no `pgvector`, no most Postgres extensions.
- Excellent read latency through edge replicas.

### Option D — PlanetScale (MySQL/Postgres)

PlanetScale offers a Vitess-based MySQL platform and recently added Postgres support.

- **No free tier** since 2024.
- Paid plans start around $39/month.
- Best-in-class schema migration workflow with branching.
- Used by Cursor, Intercom, Block — battle-tested at scale.

## Comparative Analysis

| Criterion | Neon | Supabase | Turso | PlanetScale |
|---|---|---|---|---|
| **Engine** | PostgreSQL | PostgreSQL | SQLite (libSQL) | MySQL / Postgres |
| **Entry cost** | $0 (10 projects free) | $0 (2 projects, pause after 7d) | $0 (100 DBs free) | **No free tier** |
| **First paid tier** | $19/mo | $25/mo | $4.99/mo | ~$39/mo |
| **Cost per extra project** | ~$0 (shared pool) | **+$10/mo (compute)** | ~$0 (shared pool) | Varies per plan |
| **Scale-to-zero** | **Yes** | No | No (deprecated 2026) | No |
| **Cold start** | 300–500 ms | None (always on) | None (always on) | None |
| **Branching for previews** | Yes (instant, free) | Manual, slower | Per-database | Yes (best-in-class) |
| **SQL standard** | Standard Postgres | Standard Postgres | SQLite (limited) | Standard MySQL/Postgres |
| **Migration ease** | Trivial (pg_dump) | Trivial (pg_dump) | Hard (different engine) | Medium |
| **Bundled Auth/Storage** | No | **Yes** | No | No |

## Decision

**Neon** is selected as the database service.

Rationale:

1. **Per-project cost is effectively zero.** A single Launch plan ($19/month) covers up to 1,000 projects, eliminating the linear scaling problem that Supabase Pro has ($10/month per extra project).
2. **Scale-to-zero matches the portfolio's traffic profile.** Most sites in a multi-site portfolio are dormant most of the time. Paying for idle compute (Supabase, Turso, PlanetScale) is wasteful.
3. **Standard Postgres eliminates lock-in.** A `pg_dump` / `pg_restore` migration to RDS, self-hosted Postgres, or back to Supabase is trivial. SQLite would have made migration significantly harder.
4. **Free tier covers all pre-launch projects.** 10 projects at 0.5 GB each is enough to develop the entire portfolio at $0.
5. **Branching enables preview environments without paying for staging databases.** Each pull request can have its own database branch.

Supabase was the runner-up. It would be the right choice if we wanted Auth, Storage, and Realtime as a single bundle. We chose to compose these services individually because (a) Supabase's per-project compute cost is the original problem we are solving, and (b) composing services keeps each piece replaceable.

## Consequences

### Positive

- Multi-project portfolio runs at $0/month while in free tier, then $19/month total once usage exceeds it.
- Branching enables preview database environments without additional cost.
- Postgres is the most portable choice — no engine lock-in.
- Compute scaling matches actual traffic, not provisioned capacity.

### Negative / Trade-offs

- **Cold starts on dormant projects.** A landing page that sees one visit per day will incur ~300–500 ms latency on the first request after idling. Mitigation: scheduled health check pings on critical paths, or accept the latency for non-critical sites.
- **No bundled Auth, Storage, or Realtime.** These must be sourced separately (covered in ADR-003 and ADR-004). The composed cost is still lower than Supabase Pro's per-project model.
- **No Row Level Security available by default.** Authorization must live in application code (the service layer), not in the database. This is consistent with a layered architecture but is more boilerplate than Supabase RLS policies.
- **Cold-start variance** can be visible to end users on first request after idle periods. For UX-critical paths, this may force a higher Neon tier (Scale at $69/month with autoscaling minimums).

### Revisit Triggers

- A specific project needs guaranteed sub-100 ms cold reads → upgrade that project's compute or move to a non-serverless Postgres host.
- Cumulative storage across all projects exceeds 50 GB → evaluate Neon Scale or self-hosted Postgres.
- A project needs real-time database subscriptions (WebSocket pub/sub) on the database itself → reconsider Supabase for that project only.

## References

- Neon Pricing — https://neon.com/pricing
- Neon Documentation — https://neon.com/docs
- Supabase Pricing — https://supabase.com/pricing
- Turso Pricing — https://turso.tech/pricing
- PlanetScale Pricing — https://planetscale.com/pricing
- "Neon vs Supabase (2026): Features, Pricing, and Migration Guide" — https://www.closefuture.io/blogs/neon-vs-supabase
- "Neon vs Supabase vs Turso 2026" — https://www.pkgpulse.com/blog/neon-vs-supabase-vs-turso-2026
- "Database Free Tier Comparison 2026" — https://agentdeals.dev/database-free-tier-comparison-2026
- "Best Database Software for Startups and SaaS (2026)" — https://makerkit.dev/blog/tutorials/best-database-software-startups
- "Neon Pricing 2026: Plans, Costs & Honest Breakdown" — https://checkthat.ai/brands/neon/pricing
