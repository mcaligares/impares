# ADR-007: Migrations Runner

## Status

Accepted — June 2026

## Context

Per ADR-002, the database is Neon Postgres with branching enabled. Per ADR-006, the application uses Drizzle ORM with the schema defined in `src/lib/db/schema.ts`. We now need to choose how migrations are **authored, versioned, generated, and applied** across local development, preview deployments, and production.

The template already exposes a `/migration` skill (`.claude/skills/migration/SKILL.md`) that writes timestamped SQL files into `scripts/migrations/`. Whatever runner we choose must coexist with that workflow — either by owning the directory or by adapting the skill to its conventions. There are also two distinct sources of schema change to support:

1. **Application schema** (entities like `expense`, `user_profile`, etc.) — generated from the Drizzle TS schema.
2. **Better Auth tables** (`user`, `session`, `account`, `verification`) per ADR-004 — produced by Better Auth's CLI as raw SQL.
3. **Ad-hoc operational changes** — indexes, data backfills, constraint changes that don't map cleanly to a schema diff.

The runner must handle all three in a single ordered history.

## Decision Drivers

- **Single source of truth for schema** — minimize the chance of code and DB drifting.
- **Versioned, deterministic history** — files in Git, ordered by timestamp, applied in the same order everywhere.
- **Neon branching integration** — preview environments must apply pending migrations to a branch DB automatically.
- **Mixed origin support** — must accept both auto-generated SQL (from Drizzle) and hand-written SQL (Better Auth, ops changes).
- **Operational simplicity** — fewer external services and tools to install.
- **Skill compatibility** — should not require rewriting the `/migration` skill from scratch.
- **CI/CD friendliness** — apply migrations on deploy with a single command and no interactive prompts.

## Options Considered

### Option A — Drizzle Kit

The migration tool that ships with Drizzle ORM. Diffs the TS schema against the previous snapshot and writes SQL.

- **Command surface:** `drizzle-kit generate` (write SQL from schema diff), `drizzle-kit migrate` (apply pending SQL), `drizzle-kit push` (dev-only direct sync, no SQL file), `drizzle-kit studio` (GUI).
- **Migration format:** plain SQL files in a configurable directory; an auto-managed `_journal.json` tracks applied state.
- **Hand-written SQL:** supported — you can place SQL files in the migrations directory and they apply in timestamp order alongside generated ones.
- **Driver:** uses `@neondatabase/serverless` natively (same driver as the runtime per ADR-006).
- **Programmatic API:** `migrate()` from `drizzle-orm/neon-http/migrator` runs in a Node script or a Vercel Function.
- **Dependencies:** already in `package.json` once Drizzle is adopted (ADR-006). Zero new dependencies.
- **License:** Apache 2.0.

### Option B — node-pg-migrate

A long-standing PostgreSQL migration runner that operates on hand-written SQL or JS up/down files.

- **Command surface:** `node-pg-migrate up`, `down`, `create`, `redo`.
- **Migration format:** SQL or JS files, each with explicit `up` and `down` sections.
- **Hand-written SQL:** that *is* its model — no schema-diff generator.
- **Driver:** `pg` (TCP). No native HTTP driver path; on Neon this works via the pooled endpoint but is a separate connection model from the runtime client.
- **Programmatic API:** Node CLI; can be invoked from any postdeploy hook.
- **Dependencies:** new dependency (`node-pg-migrate`).
- **License:** MIT.
- **Schema sync with Drizzle:** none — the Drizzle TS schema and the migration SQL would have to be kept aligned by hand. The benefit Drizzle gives us in ADR-006 (no codegen drift) is partially lost.

### Option C — Atlas (ariga.io)

A modern declarative schema management tool. Supports multiple workflows: HCL-defined schema, SQL files, or **deriving migrations from a Drizzle schema** via the `atlas-provider-drizzle` adapter.

- **Command surface:** `atlas migrate diff`, `atlas migrate apply`, `atlas schema apply`, `atlas migrate lint`.
- **Migration format:** plain SQL with a checksum-validated history (`atlas.sum`).
- **Hand-written SQL:** first-class — Atlas was designed around it.
- **Driver:** uses its own Go-based engine; connects via standard Postgres URL.
- **Programmatic API:** CLI binary written in Go (must be installed separately, including in CI).
- **Standout features:** **migration linting** (detects destructive changes, missing indexes, locking risks), schema diffs against a live DB, integration with CI cloud product for review apps.
- **Dependencies:** external binary, not an npm package. Must be installed on every dev machine and in Vercel's build image.
- **License:** Apache 2.0 (OSS edition); paid cloud features.

## Comparative Analysis

| Criterion | Drizzle Kit | node-pg-migrate | Atlas |
|---|---|---|---|
| **Generates SQL from Drizzle schema** | **Yes (native)** | No (manual) | Yes (via adapter) |
| **Accepts hand-written SQL** | Yes | **Yes (primary mode)** | **Yes (primary mode)** |
| **Migration file format** | Timestamped `.sql` | Numbered `.sql` / `.js` (up + down) | Timestamped `.sql` + `atlas.sum` |
| **Runtime driver match (Neon HTTP)** | **Native** | TCP (`pg`) | Internal Go driver |
| **Install footprint** | Already present (Drizzle) | npm package | **External Go binary** |
| **CI install on Vercel** | None needed | `pnpm install` | Extra step in build |
| **Migration linting / safety checks** | Basic | None | **Strong (destructive change detection)** |
| **Down migrations** | Not generated by default | **Yes (paired up/down)** | Yes |
| **Skill (`/migration`) compatibility** | **Direct (same directory)** | Direct | Direct |
| **Neon branching support** | Via any URL | Via any URL | Via any URL |
| **License** | Apache 2.0 | MIT | Apache 2.0 (OSS) |
| **Ecosystem coupling** | Tightly tied to Drizzle | Independent | Independent |

## Decision

**Drizzle Kit** is selected as the migrations runner.

Rationale:

1. **Single source of truth for schema is preserved.** ADR-006 chose Drizzle specifically to avoid the codegen-drift problem (Prisma) and the hand-written-types problem (Kysely). Picking a runner that *doesn't* read the Drizzle schema (node-pg-migrate) would reintroduce that problem in a different layer: the TS schema and the SQL history would have to be kept aligned by hand. Drizzle Kit closes the loop.
2. **Zero new dependencies and zero CI install changes.** Drizzle Kit ships in the same package family that ADR-006 already adopted. Atlas requires a Go binary on every machine and in Vercel's build image; that is real operational surface for a benefit (linting) we don't yet need at the template's scale.
3. **The runtime driver matches the migration driver.** Both Drizzle Kit's `migrate()` and the application runtime use `@neondatabase/serverless`. We do not maintain two connection models (HTTP for the app, TCP for migrations) — important on Neon where the HTTP driver is the supported serverless path.
4. **Hand-written SQL is still first-class.** Better Auth's generated tables (ADR-004) and ad-hoc operational changes (indexes, backfills) can be dropped into `scripts/migrations/` as raw SQL and applied in timestamp order alongside generated migrations. The `/migration` skill keeps working with at most cosmetic edits.
5. **Atlas's linting is real value we'll revisit, not adopt up-front.** The strongest reason to pick Atlas is its destructive-change detection. For a template that mostly serves small projects, the cost (binary install, second tool to learn, CI changes) outweighs the benefit today. Documented as a revisit trigger below.

node-pg-migrate was rejected because it undoes the schema-as-code property we just chose Drizzle to gain. Atlas was the runner-up and remains the best path if we later need migration safety enforcement in CI.

## Consequences

### Positive

- Migrations are generated from the Drizzle schema with `drizzle-kit generate` and applied with `drizzle-kit migrate` (or programmatically via `migrate()`).
- The application schema, runtime client, and migration tooling are all the same package family — one mental model.
- The `/migration` skill keeps writing into `scripts/migrations/`. The skill's "Step 6: aplicar en Supabase" becomes "run `pnpm db:migrate`."
- Better Auth's SQL output drops into the same directory and applies in order with the rest.
- Neon branch URLs work transparently — preview deployments point `DATABASE_URL` at a branch and run `pnpm db:migrate` in the postdeploy hook.

### Negative / Trade-offs

- **No automatic down migrations.** Drizzle Kit does not generate paired up/down files. Mitigation: for the few cases that need a rollback path, hand-write a reverse SQL file with a later timestamp. This is consistent with the existing `/migration` skill, which already treats rollback as a commented section.
- **No built-in destructive-change linting.** A `DROP COLUMN` will be generated and applied silently. Mitigation: code review on the generated SQL is the gate; if this proves insufficient, adopt Atlas (revisit trigger below) or wire `drizzle-kit check` into CI.
- **`drizzle-kit push` is tempting for local dev but bypasses the migration history.** It's useful for fast iteration on a personal branch but must not be used against shared branches or production. Mitigation: document in the layer README; do not include `db:push` in the default `package.json` scripts to reduce footgun risk.
- **Tooling is tied to Drizzle's release cadence.** If Drizzle Kit lags behind a Postgres feature we need, we'd have to drop to raw SQL for that one migration. Acceptable: raw SQL files coexist with generated ones.

### Revisit Triggers

- A project ships SQL changes frequently enough that destructive-change detection becomes load-bearing — adopt Atlas (keep schema in Drizzle, point Atlas at the migrations directory for linting in CI).
- We start running production migrations on tables with millions of rows where lock duration matters — adopt Atlas for `migrate lint` integration with the lock-impact checks.
- Drizzle Kit's release cadence slows or it falls behind Postgres feature parity — re-evaluate against `node-pg-migrate` (raw SQL) or Atlas (declarative schema).

## References

- Drizzle Kit Overview — https://orm.drizzle.team/docs/kit-overview
- Drizzle Kit Migrations — https://orm.drizzle.team/docs/migrations
- Drizzle + Neon HTTP Migrator — https://orm.drizzle.team/docs/migrations#neon-http
- node-pg-migrate Documentation — https://salsita.github.io/node-pg-migrate/
- Atlas Documentation — https://atlasgo.io/docs
- Atlas Drizzle Provider — https://atlasgo.io/guides/orms/drizzle
- "Drizzle Kit vs Atlas vs node-pg-migrate: Postgres Migration Tools 2026" — https://orm.drizzle.team/blog/drizzle-kit-vs-atlas-2026
- Neon Branching for Preview Environments — https://neon.com/docs/guides/branching-pitr
