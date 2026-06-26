## Context

Player badges (mobility / endurance) are rendered unconditionally in `src/components/match/player-card.tsx`, driven by `src/config/badges.config.ts`. The project already has a feature-flag convention: `src/config/features.config.ts` exports a static `as const` object (e.g. `worldCupConfetti: true`) consumed directly by components. Per the config-layer convention, `src/config/` is the only place allowed to read `process.env`.

The request is for an **environment-variable** flag, not a hardcoded one. The badge row renders in a client component, which constrains how the variable is read.

## Goals / Non-Goals

**Goals:**
- A deploy-time toggle (env var) that hides the badge row on all player cards.
- Keep the existing feature-flag idiom (boolean on `featuresConfig`, read directly in the component).
- Default to current behavior (badges shown) when the variable is unset.

**Non-Goals:**
- Per-match, per-user, or runtime toggling.
- Removing badge data from the client payload or changing `getMatchTeams` / services.
- Any UI to switch the flag, or a settings screen.

## Decisions

**Read the env var in the config layer, expose a boolean.**
Add `hidePlayerBadges` to `featuresConfig`, set from `process.env`. Component reads `featuresConfig.hidePlayerBadges` and conditionally renders the badge row — consistent with how `confetti.tsx` reads `featuresConfig.worldCupConfetti`. Alternative (reading `process.env` directly in the component) rejected: violates the config-layer convention.

**Use the `NEXT_PUBLIC_` prefix.**
`player-card.tsx` is a client component, so the variable must be `NEXT_PUBLIC_HIDE_PLAYER_BADGES` to be inlined into the browser bundle. A non-prefixed var would read as `undefined` on the client and the flag would never take effect. Trade-off: `NEXT_PUBLIC_` values are baked in at build time, so changing the flag requires a rebuild/redeploy — acceptable for a deploy-time toggle.

**Truthiness parsing.**
Treat the var as enabled only for an explicit truthy string (`=== 'true'`), everything else (unset, empty, `'false'`) means badges visible. Keeps the default safe and avoids surprising "any non-empty string is true" behavior.

## Risks / Trade-offs

- [Build-time only] `NEXT_PUBLIC_` is fixed at build → flipping the flag needs a redeploy. Mitigation: documented as a deploy-time flag; matches the use case (demos/deployments).
- [Data still on the client] Mobility/endurance still ship to the browser, only hidden visually. Mitigation: explicitly a presentation flag, not a privacy boundary; called out in Non-Goals.
- [Spec tension] The "ability presented only as badges" rule now has an exception. Mitigation: the MODIFIED requirement preserves the "never as numbers" guarantee under all configurations.
