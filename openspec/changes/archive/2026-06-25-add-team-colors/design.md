## Context

Team colors are currently two fixed Tailwind tokens (`team-a` orange, `team-b` violet) applied via utility classes. The organizer wants per-match random colors from a palette, distinct per team, never the brand cyan, and persisted. The chosen mechanism is to **store the colors on the match** (true random at creation), so they need a schema change and the UI must move from fixed classes to dynamic per-match colors.

## Goals / Non-Goals

**Goals:**
- A config palette of hex colors, none = brand cyan.
- Pick two distinct palette colors at match creation, store on the match.
- Persist (stable across reloads and re-draws).
- Render each team in its stored color; legacy matches fall back to defaults.

**Non-Goals:**
- Manual color editing/picking by the user.
- Re-theming the rest of the app; the brand cyan stays the app/landing color.

## Decisions

**1. Store on the `match` row.**
Add `team_a_color` and `team_b_color` (`text`, nullable) to the `match` entity (+ migration). Nullable so existing rows are valid and legacy matches fall back. *Rationale:* the user chose true-random-at-creation persisted in DB over deriving from the id.

**2. Palette in `src/config/color.config.ts` (`as const`).**
A curated, hue-spread list excluding cyan and near-cyan blues and greens (per the brand/no-green direction), e.g. orange, amber, magenta, rose, violet, indigo. Centralizes the colors for tuning.

**3. Pick two distinct colors at registration, rng injectable.**
A small picker `pickTwoColors(palette, rng = Math.random)` returns two different entries (pick one, then pick another excluding it). Injectable `rng` keeps it unit-testable. `registerMatch` calls it and passes the colors to `insertMatch`. *Rationale:* randomness is a side effect; isolating it behind an injectable rng keeps tests deterministic.

**4. `getMatchTeams` returns the stored colors; UI renders via inline `style`.**
Dynamic hex can't be a Tailwind utility class, so `TeamBoard`/`PlayerCard` accept a color string and apply it through inline `style` (border, glow/shadow, text, accent bar). When a match's colors are null, fall back to the existing `team-a`/`team-b` defaults.

## Risks / Trade-offs

- **Inline styles instead of utility classes** for the team color. Acceptable and necessary for runtime colors; structure/spacing stay in Tailwind.
- **Two random picks could be low-contrast** (e.g. magenta vs rose). Mitigation: a hue-spread palette; a future refinement could enforce a minimum hue distance between the two picks.
- **Migration required** (two nullable columns). Low risk; nullable, no backfill needed.

## Migration Plan

`pnpm db:generate` produces the `match` column additions; apply with `pnpm db:migrate` when ready. Legacy rows keep `NULL` colors and render with defaults. Rollback: revert the change; drop the columns if migrated.

## Open Questions

- Whether to enforce a minimum visual contrast between the two picked colors — start simple (distinct entry), refine if pairs look too similar.
