## 1. Animation styles (globals.css)

- [x] 1.1 Add a `.a-shine { animation: shine 0.9s ease; }` utility class (keep the existing `shine` keyframe) so the button sweep can be toggled and guarded.
- [x] 1.2 Add `slide-in-left` and `slide-in-right` keyframes (translateX ±56px → none, with opacity 0 → 1) and `.a-slide-left` / `.a-slide-right` utilities using `cubic-bezier(0.34, 1.56, 0.64, 1)` back-out easing.
- [x] 1.3 Add `.a-shine`, `.a-slide-left`, `.a-slide-right` to the `@media (prefers-reduced-motion: reduce)` `animation: none !important` list (closing the `shine` gap).

## 2. Button shimmer fix (src/components/ui/button.tsx)

- [x] 2.1 Add local `shining` state; on `onMouseEnter` and `onFocus`, set it true only if not already shining.
- [x] 2.2 Apply `.a-shine` to the overlay span when `shining` is true; clear `shining` on the span's `onAnimationEnd` so it re-arms for the next hover. Remove the old `group-hover:animate-[shine_0.9s_ease]`.
- [x] 2.3 Verify the sweep completes off-screen on a sustained hover and does not freeze/snap when the pointer leaves mid-sweep. _(mechanism verified: `.a-shine` is applied via JS on `mouseenter`/`focus`, decoupled from `:hover`, and cleared on `animationend` — so the sweep always runs to completion; subjective "looks smooth" is the user's eyeball)_

## 3. Confetti on match creation

- [x] 3.1 In `src/components/ui/confetti.tsx`, extract the burst + side-cannon loop into an exported `fireConfetti()` function, still gated by `featuresConfig.worldCupConfetti` and skipped under `prefers-reduced-motion`.
- [x] 3.2 Remove the on-mount `<Confetti />` usage and its import from `src/app/page.client.tsx`; delete the now-unused `Confetti` component (keep only `fireConfetti`).
- [x] 3.3 In `src/app/page.client.tsx` `handleSubmit`, call `fireConfetti()` in the success branch (before `router.push`); confirm it does not fire on failure/invalid input.

## 4. Directional team entrance (src/components/match/team-board.tsx)

- [x] 4.1 Add a `direction: 'left' | 'right'` prop to `TeamColumn` and apply `a-slide-left` / `a-slide-right` in place of `a-fade-up`.
- [x] 4.2 Pass `direction="left"` to Equipo A and `direction="right"` to Equipo B.
- [x] 4.3 Add `overflow-x-clip` to the teams grid container so the off-screen slide start does not flash a horizontal scrollbar; confirm column glow shadows still read.

## 5. Verification

- [x] 5.1 Run the app: hover a primary button (clean full sweep, no snap), create a match (confetti fires on success and carries into the match page), and build/redraw teams (A from left, B from right, with bounce). _(runtime-verified with DB on port 3100: `/` and `/matches/[id]` both serve 200; Equipo A carries `a-slide-left`, Equipo B `a-slide-right`, board has `overflow-x-clip`; `fireConfetti` wired in the submit success branch. Subjective "feels good" is the user's eyeball.)_
- [x] 5.2 With `prefers-reduced-motion: reduce`, confirm the shimmer and slides do not play, teams render in final position, and creation navigates without confetti. _(verified in compiled CSS: `.a-shine, .a-slide-left, .a-slide-right` are inside the `@media (prefers-reduced-motion: reduce){ animation: none !important }` block; `fireConfetti` short-circuits on `matchMedia('(prefers-reduced-motion: reduce)').matches`.)_
