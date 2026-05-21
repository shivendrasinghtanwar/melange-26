# Animation library choice — GSAP

**Status:** accepted, 2026-05-21.
**Branch:** `feat/gsap-hero-fold` (GSAP refactor of `HeroFold.tsx` already on this branch; merge to `release` once the in-flight hero animation iteration is settled).

## Decision

Adopt **GSAP** (`gsap` v3, free as of mid-2024 under Webflow) as the JS-driven animation library for melange-26.

**Motion** (motion.dev) was the formally considered alternative and is deferred. Re-evaluate only if a future workload specifically demands what Motion does better than GSAP (declarative `<motion.div>` React API, WAAPI offload, sub-15 kB total bundle).

## Why GSAP, not Motion

Two answers from the brainstorming session pinned the choice:

1. **Scroll-driven moments are planned** beyond the fold transition (a few — not a full motion design pass, but more than zero). GSAP's **ScrollTrigger** plugin is the most mature scroll-driven animation tool available — pin elements while a sequence plays, scrub timelines off scroll progress, snap to positions, callbacks at boundaries. Motion's `scroll()` driver is leaner and adequate for simple cases but has no first-class pinning or timeline scrubbing.
2. **Bundle size is not a deciding factor** for this site — it's a one-time wedding-invitation landing page; the JS gets cached after first paint and visitors don't revisit constantly. The ~70 kB premium GSAP + ScrollTrigger costs over Motion is acceptable in exchange for ScrollTrigger's depth.

If either answer had pointed the other way, Motion would have been the call.

## Conventions

| Use case | Tool |
|---|---|
| Hover state colour change | CSS `transition` |
| Property A→B over a fixed duration (single element, no scroll, no sync) | CSS keyframes or `transition` |
| Reveal-on-scroll for a section as it enters viewport | `IntersectionObserver` + CSS class toggle (existing `Reveal` component) |
| Continuous decorative animation (marquee, ganesh fade, wordmark stagger) | CSS keyframes |
| Drives `window.scrollY` programmatically | GSAP + `ScrollToPlugin` |
| Coordinates multiple elements' properties on a shared timeline with synced easing | GSAP `gsap.timeline()` |
| Scrubs animation off scroll progress, pins elements, snaps to positions | GSAP + `ScrollTrigger` |
| Anything that needs imperative interrupt/reverse mid-flight | GSAP |

**Bias:** when in doubt, CSS. Reach for GSAP when the alternative is hand-rolled `requestAnimationFrame` or when CSS and JS would need to be kept in lock-step manually.

## What's already in place

On the `feat/gsap-hero-fold` branch:

- `gsap` v3.15+ in `package.json`.
- `HeroFold.tsx` rewritten to use a `gsap.timeline()` per direction (open / close), with `ScrollToPlugin` driving the page-scroll part of each timeline. The old `animateFold` rAF helper, the `html.scrollBehavior = 'auto'` workaround, the synced CSS `@keyframes` (`foldOpen`/`foldClose`/`foldShadowIn`/`foldShadowOut`/`hingeFadeIn`/`hingeFadeOut`), and the `.fold-overlay--opening`/`--closing` state classes are all retired.
- `.fold-overlay__shadow` and `.fold-overlay__hinge` are now real DOM children (refs targetable by GSAP) instead of `::after`/`::before` pseudo-elements.
- Global `html { scroll-behavior }` switched `smooth → auto`. Every in-app smooth scroll already passes `behavior: 'smooth'` explicitly in JS, so the global no longer needs to be smooth and stopping it being smooth prevents the browser's smooth-scroll queue from fighting GSAP's `ScrollToPlugin`.
- Bundle: 182 kB → 257 kB (gzipped ~58 → ~87 kB). +75 kB for GSAP core + ScrollToPlugin.

Trigger detection (wheel / touch / key / click / scroll), the 1000 ms close-trigger cooldown + 50 px threshold (defenses against macOS trackpad-momentum tails), `overscroll-behavior: none`, and the reduced-motion / mid-reload / deep-link short-circuits all stayed — these were never animation-engine hacks, they're event-handling necessities that any animation library would still have to live around.

## Future use — when ScrollTrigger lands

ScrollTrigger is **not** added preemptively. It lands when the first scroll-driven moment lands. Likely first candidates, ordered by appearance in the page:

1. **Milestones content scrubbing** — as the user scrolls through the section, the three milestone cards stagger their reveal off scroll progress rather than viewport entry.
2. **Marigold petal scrub** in the Particulars header as the section enters.
3. **Gallery parallax** — the two marquee rows drift at slightly different vertical rates while in view.

Each of these is a 5–15 line addition; the convention is to register `ScrollTrigger` once at module scope alongside the existing `gsap.registerPlugin(ScrollToPlugin)`.

## Reduced motion

All GSAP animations must respect `prefers-reduced-motion: reduce`:

- The fold already short-circuits to `state = 'open'` (no animation) when reduced motion is preferred — see the first `useEffect` in `HeroFold.tsx`.
- Future ScrollTriggers should either skip registration under reduced motion or set `gsap.set(...)` to the end state and return.

## Risks and known unknowns

- **Bundle growth as more plugins land.** ScrollTrigger adds another ~12 kB gzipped. Stay aware of the cumulative cost; if it ever crosses ~120 kB total, reconsider the decision.
- **Trackpad-momentum on macOS** remains a real browser-level behaviour. The 1000 ms cooldown + 50 px threshold in `HeroFold.tsx` defuse it; future scroll-driven work should design close-style triggers to be similarly defensive (don't trust the first wheel event after a long gesture).
- **GSAP API stability** is excellent (v3 has been stable since 2019) but is still owned by a single vendor. If Webflow ever changes the license terms back, the fallback is Motion or hand-rolled CSS + IntersectionObserver — all the work would survive a port.

## Migration / rollout

Nothing to migrate. The branch is the entire migration. Merge `feat/gsap-hero-fold` → `release` when the hero-fold iteration the user is currently working on is settled.
