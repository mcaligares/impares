## Context

Styling is Tailwind v4 (CSS-first, no config file) with all `@keyframes` and animation utility classes centralized in `src/app/globals.css`. Atomic UI lives in `src/components/ui/`, feature components in `src/components/match/`, and pages use the orchestrator pattern (`page.tsx` server + `page.client.tsx` client). `canvas-confetti` is already a dependency and a `worldCupConfetti` feature flag already exists.

Current state of the three target areas:
- **Button shine** (`src/components/ui/button.tsx:36-41`, `globals.css:48-51`): a `bg-white/40` overlay span rests at `-translate-x-[130%]` and is animated by `group-hover:animate-[shine_0.9s_ease]`. Because the animation is bound to continuous hover with no fill, leaving the button mid-sweep removes the class and snaps the overlay back to its left resting position — the "freezes in the middle, then vanishes" glitch. It is also the only animation **not** under the `prefers-reduced-motion` guard.
- **Confetti** (`src/components/ui/confetti.tsx`): a component that fires once on **mount**, and is only mounted on the **home page** (`src/app/page.client.tsx:30`) — so it celebrates page load, not the create-match action.
- **Team entrance** (`src/components/match/team-board.tsx:70`): both `TeamColumn`s share a single `a-fade-up` (vertical rise), with no directional or per-team motion.

## Goals / Non-Goals

**Goals:**
- The primary-button shimmer always completes a full, smooth sweep and never snaps backward.
- Confetti fires on successful match creation ("Crear partido"), not on home-page load.
- Equipo A enters from the left, Equipo B from the right, each with an overshoot/bounce.
- All three behaviors respect `prefers-reduced-motion`.

**Non-Goals:**
- No changes to data fetching, server actions, balancing, or the `getMatchTeams` shape.
- No new dependencies, no confetti library swap, no redesign of the player cards or VS badge.
- No new feature flag — reuse the existing confetti flag.

## Decisions

### 1. Button shimmer: drive a one-shot via `animationend` instead of `group-hover`

Bind the sweep to an imperative one-shot rather than to the hover state. On pointer enter (and focus), if not already sweeping, set a `shining` state that applies a new `.a-shine` utility class to the overlay; clear it on the span's `onAnimationEnd`. Because the class is not tied to continuous hover, leaving the button mid-sweep lets the animation **run to completion** off-screen, then re-arms for the next hover.

- Move the sweep into a named utility in `globals.css` (`.a-shine { animation: shine 0.9s ease; }`) instead of the inline `animate-[shine_...]` arbitrary value, so it can be added to the reduced-motion guard.
- The `Button` is already `'use client'`; this adds only a small local `useState` + two handlers, within the `ui/` rule that atomic components may use hooks and take primitive props only.

**Alternatives considered:**
- *Rest the overlay at the end (right) position so a mid-hover-out snap goes off-screen-right instead of left* — pure CSS, no JS, but a mid-sweep exit still pops the overlay from mid-button straight off-screen (a smaller glitch, not a clean finish). Rejected for not fully satisfying the "no abrupt glitch" scenario.
- *Transition-based sweep with opacity fade-out* — transitions reverse on hover-out (the shine sweeps backward); masking that with an opacity fade is fiddly and still not a guaranteed full pass.

### 2. Confetti: extract a standalone `fireConfetti()` and call it on creation success

Refactor `src/components/ui/confetti.tsx` to export a plain `fireConfetti()` function holding the existing burst + side-cannon loop, still gated by `featuresConfig.worldCupConfetti`. `canvas-confetti` renders to its own fixed canvas appended to `document.body`, so the animation persists across React navigation. We therefore call `fireConfetti()` from the home `handleSubmit` success branch (`page.client.tsx:20-21`) right when the match is created; the burst carries over visually into the match page that we `router.push` to.

Remove the on-mount `<Confetti />` from the home page (it celebrated page load, which is meaningless and now redundant). Match-creation success is the meaningful trigger the user asked for.

**Alternatives considered:**
- *Keep the mount-based component and render it on the match page* — would fire on every match-page visit, not on the click, and wouldn't tie to success/failure. Rejected.
- *Fire from inside the `Button`'s onClick* — the button doesn't know whether the server action succeeded; celebrating before validation would fire on invalid input too. The orchestrator (`page.client.tsx`) is the correct place, consistent with the "no action calls in components" rule.

### 3. Team entrance: directional bounce keyframes, one per side

Add two keyframes and utilities in `globals.css`:

```css
@keyframes slide-in-left  { from { opacity: 0; transform: translateX(-56px); } to { opacity: 1; transform: none; } }
@keyframes slide-in-right { from { opacity: 0; transform: translateX(56px);  } to { opacity: 1; transform: none; } }
.a-slide-left  { animation: slide-in-left  0.7s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
.a-slide-right { animation: slide-in-right 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
```

The `cubic-bezier(0.34, 1.56, 0.64, 1)` (back-out) easing overshoots past the final position and settles — the "rebote" the user asked for — in a single keyframe. `TeamColumn` gains a `direction: 'left' | 'right'` prop; Equipo A passes `'left'`, Equipo B passes `'right'`, replacing the shared `a-fade-up`. The VS badge keeps its `a-vs` pulse.

**Alternatives considered:**
- *Multi-stop keyframe with an explicit bounce* — more verbose and harder to tune than a back-out bezier for the same single-overshoot effect.

### 4. Reduced-motion: extend the existing guard

Add `.a-shine`, `.a-slide-left`, `.a-slide-right` to the `@media (prefers-reduced-motion: reduce)` `animation: none !important` list in `globals.css` (closing today's gap where `shine` was unguarded). For confetti, skip `fireConfetti()` when reduced motion is requested (or keep it minimal) so creation still navigates without a forced particle storm.

## Risks / Trade-offs

- **Horizontal overflow during slide-in** → the ±56px off-screen start could momentarily push past the viewport and flash a horizontal scrollbar on narrow screens. Mitigation: keep the offset moderate and add `overflow-x-clip` to the teams grid container (`team-board.tsx:43`); verify the column glow shadows still read (clip, not hidden, preserves layout).
- **Confetti persisting after navigation** → desired here, but relies on `canvas-confetti`'s body-level canvas. If a future change scopes confetti to a React canvas, the cross-navigation behavior breaks. Documented so it's intentional, not incidental.
- **Removing home-load confetti is a visible behavior change** → some users may have liked it on load; it is replaced, not deleted, by the more meaningful create-success trigger. Easy to revert by re-adding `<Confetti />` if undesired.
- **JS one-shot on the button** adds minimal state to an atomic component → acceptable per the `ui/` conventions; keeps the animation robust where pure CSS could not guarantee completion.

## Open Questions

- Should confetti also respect `prefers-reduced-motion` by firing **nothing**, or a single small burst? Default decision: fire nothing under reduced motion. Revisit if the user wants a token celebration.
