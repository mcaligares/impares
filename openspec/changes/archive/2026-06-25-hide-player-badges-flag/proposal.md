## Why

Player characteristic badges (mobility / endurance) are always shown on every player card. There is no way to turn them off without editing the code, which is needed to support deployments or demos where ability hints should stay hidden. A deploy-time toggle lets the same build present matches with or without badges.

## What Changes

- Add an environment-variable feature flag that hides the player characteristic badges across the UI when enabled.
- Read the flag in the config layer (the only layer allowed to read `process.env`) and expose it as a boolean on the existing feature-flag config.
- Have `PlayerCard` skip rendering the mobility/endurance badge row when the flag hides badges; everything else on the card (name, layout) stays unchanged.
- Document the new variable in `.env.example`.
- Because the badges render in a client component, the variable uses the `NEXT_PUBLIC_` prefix so it reaches the browser bundle.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `match-ui`: the rule that player ability is always presented as characteristic badges gains an exception — badge display becomes conditional on a deploy-time flag. With the flag enabled, cards render with no badges (still no numbers anywhere).

## Impact

- Config: `src/config/features.config.ts` — new flag reading an env var.
- Component: `src/components/match/player-card.tsx` — conditional badge row.
- Env: `.env.example` — document the new `NEXT_PUBLIC_*` variable. No change to data, actions, services, or stored ratings (mobility/endurance still flow to the client; only their rendering is gated).
