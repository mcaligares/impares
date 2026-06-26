## 1. Config flag

- [x] 1.1 Add `hidePlayerBadges` to `featuresConfig` in `src/config/features.config.ts`, set from `process.env.NEXT_PUBLIC_HIDE_PLAYER_BADGES === 'true'`
- [x] 1.2 Document `NEXT_PUBLIC_HIDE_PLAYER_BADGES` in `.env.example` (default unset = badges shown)

## 2. Component

- [x] 2.1 In `src/components/match/player-card.tsx`, import `featuresConfig` and skip the mobility/endurance badge row when `featuresConfig.hidePlayerBadges` is true
- [x] 2.2 Verify the rest of the card (name, layout) renders unchanged when badges are hidden

## 3. Verify

- [x] 3.1 With the var unset, confirm badges render as before
- [x] 3.2 With `NEXT_PUBLIC_HIDE_PLAYER_BADGES=true`, confirm no badge images render and no badge assets are requested
