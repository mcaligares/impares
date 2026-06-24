## Why

The current UI motion is half-finished and undersells the product. The primary button's hover "shine" sweep cancels mid-pass and snaps back abruptly (it looks broken), the celebratory confetti only fires on home-page load instead of when the user actually accomplishes something (creating a match), and the two teams on the match page enter with a single shared fade that lacks the impact a "reveal" moment deserves. These are small, high-visibility polish issues that directly affect how finished the app feels.

## What Changes

- **Fix the button hover shimmer**: rework the `primary` button's shine sweep so it always completes a clean left-to-right pass and never freezes/snaps mid-sweep on hover-out. Bring it under the `prefers-reduced-motion` guard (today it is the only animation excluded).
- **Confetti on match creation**: fire a confetti burst when the user clicks **"Crear partido"** and the match is created successfully, instead of (or in addition to) the current home-page-load burst. Reuse the installed `canvas-confetti` and the existing feature-flag gating.
- **Directional team entrance on the match page**: when teams are built, **Equipo A** slides in from the left (left → right) and **Equipo B** slides in from the right (right → left), each with an overshoot/bounce easing for impact, replacing the current shared `fade-up`.
- All motion remains disabled under `prefers-reduced-motion`.

## Capabilities

### New Capabilities
- `ui-motion`: the app's interaction and feedback motion — primary-button hover feedback, the match-creation celebration (confetti), the match-page team-entrance animation, and the cross-cutting reduced-motion requirement.

### Modified Capabilities
<!-- No requirement-level change to existing data/structure specs; match-ui's register and team-display behavior is unchanged. The new motion behaviors are captured in the new ui-motion capability. -->

## Impact

- **Styles**: `src/app/globals.css` — the `shine` keyframe + reduced-motion guard; new directional slide-in keyframes for team entrance.
- **Components**: `src/components/ui/button.tsx` (shine overlay), `src/components/ui/confetti.tsx` (extract an imperative fire helper), `src/components/match/team-board.tsx` (per-team entrance classes).
- **Flow wiring**: `src/app/page.client.tsx` — fire confetti on successful `registerMatchFromText` before navigating to the match page.
- **Dependencies**: none new — `canvas-confetti` is already installed and a `worldCupConfetti` feature flag already exists (`src/config/features.config.ts`).
- **No data, action, or API changes.**
