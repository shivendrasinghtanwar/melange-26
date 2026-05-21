# Scroll-driven animations — engineering notes

Hard-won lessons from building the Hero → Milestones fold transition in
`HeroFold.tsx`. Future agents (and future-me) — read this **before**
touching any scroll-coordinated animation in this codebase, or before
adding a new one. Almost every rule below was written down because we
shipped the opposite mistake first and watched it break.

The component this is calibrated around is the fold transition, but
the principles apply to anything that pairs an in-flight CSS / JS
animation with `window.scrollY` movement (parallax, pinned sequences,
scroll-scrubbed reveals).

---

## 1. CSS `scroll-behavior: smooth` fights every JS-driven scroll

If you use `window.scrollTo(x, y)`, `element.scrollTop = n`, GSAP's
`ScrollToPlugin`, or a hand-rolled `requestAnimationFrame` loop that
sets scroll position each frame — **CSS `scroll-behavior: smooth` will
sabotage you.** The browser queues a smooth-scroll for every JS
mutation, which then either:

- runs after your animation finishes (page lags behind the visual),
- overshoots your target because multiple smooth-scrolls chain
  themselves, or
- visually stutters because the smooth-scroll interpolation fights
  your per-frame writes.

**Rule:** the global CSS rule on `<html>` is `scroll-behavior: auto`.
Every smooth scroll in this app is programmatic and passes
`behavior: 'smooth'` explicitly in JS (Hero anchor click handler,
Footer's "Return to the top"). That keeps deliberate smooth scrolls
working without poisoning every JS-driven scroll.

Don't undo this. If you find yourself reaching for a per-animation
override like `html.style.scrollBehavior = 'auto'`, you're patching a
symptom — the global is already correct, something else regressed.

## 2. Trigger detection: input events, not scroll position

The naive way to "fire close when the user scrolls up at the boundary"
is an `onScroll` listener watching `window.scrollY < boundary - 50`.
**This is wrong** and will produce the bug where the page natively
scrolls a long way before your trigger fires:

1. User wheels up at the boundary.
2. Browser scrolls the page natively (no JS in the way).
3. `onScroll` fires AFTER the native scroll already happened.
4. By the time your code decides to act, scrollY has already moved
   significantly. The animation starts mid-scroll instead of at the
   boundary.

**Rule:** fire from the input event itself — `wheel`, `touchmove`,
`keydown`. `preventDefault()` on the same event blocks the native
scroll. The animation starts cleanly at the boundary.

```ts
window.addEventListener('wheel', onWheel, { passive: false, capture: true });
```

`passive: false` is mandatory — you can't `preventDefault` a passive
wheel event. `capture: true` gets you the event before any child
handler can stopPropagation.

## 3. macOS trackpad momentum: real, but often misdiagnosed

macOS continues to emit `wheel` events for ~700 ms after a flick
gesture ends ("kinetic scrolling"). These look like real input but
the user isn't actively scrolling anymore. Naive trigger detection
treats them as gestures and double-fires.

**Important nuance:** momentum tails carry the direction of the
gesture that started them. A downward flick produces downward
momentum (positive `deltaY`). It cannot satisfy `deltaY < 0` and
therefore cannot fire an upward trigger. **Don't add filters to
defend against events that can't actually arrive.**

We learned this the slow way:

- v1 used a 1000 ms cooldown after the open animation. Result: hard
  upward scrolls within the cooldown window weren't blocked AND
  weren't fired — they slipped through into native scroll and the
  user watched the page travel halfway into Hero before the cooldown
  lifted and close finally fired.
- v2 added a 12 px wheel-magnitude threshold to filter "tiny momentum
  events". Result: gentle real trackpad scrolls (3-10 px per event)
  were also filtered, recreating the same lag bug.
- v3 (current): no cooldown, no magnitude threshold. The only
  momentum that could affect us has the wrong sign anyway.

**Rule:** only filter momentum you can prove is actually arriving in
a direction that matters. Otherwise you're suppressing legitimate
user input. If you do need to filter, prefer event-property checks
(`deltaY` direction, event-arrival cadence) over time cooldowns.

## 4. Don't combine "block trigger" with "allow native scroll"

If your handler considers firing an action but decides not to (e.g.
during a cooldown), and you don't `preventDefault`, the wheel event
falls through to the browser and scrolls the page natively. You've
gotten the worst of both worlds: no animation, but the page jumped.

**Rule:** the decision to `preventDefault` and the decision to
`trigger*()` should be made together. Either:

- the event matches your interest → `preventDefault` AND trigger,
- the event matches your interest but you're not ready to act yet →
  `preventDefault` AND defer, or
- the event doesn't match → don't `preventDefault`, let the browser
  scroll.

Never: "match, but don't fire, and let the browser scroll anyway."

## 5. `useLayoutEffect`, not `useEffect`, for animation start states

GSAP-style libraries set inline styles via JS. When you remount a
component that needs to start animation from a non-default state
(e.g. the close-direction lid starts at `rotateX(110)`, `opacity: 0`),
the order of events matters:

1. React renders the component → DOM commits with CSS-default styles
   (`rotateX(0)`, `opacity: 1`).
2. The browser paints.  ← one-frame flash of the rest state here
3. `useEffect` runs → `gsap.set(...)` overrides the default.
4. Animation runs.

`useLayoutEffect` runs synchronously *between* step 1 and step 2, so
the browser paints with the gsap-set state already applied. No flash.

**Rule:** if a JS animation needs a non-CSS-default starting state on
remount, set it in `useLayoutEffect`. Save `useEffect` for things
that don't need to run before paint (event listeners, network calls,
state-change side effects that the user doesn't see).

## 6. Outer SVG without `viewBox` doesn't size correctly with `height: auto`

This one cost an hour. If you do:

```tsx
<svg className="my-svg" aria-hidden="true">
  <use href="#some-symbol" />
</svg>
```

```css
.my-svg { width: 100%; height: auto; }
```

The outer `<svg>` element has **no intrinsic aspect ratio**, because
it has no `viewBox` attribute. `height: auto` then falls back to the
default intrinsic SVG height (150 px), and `preserveAspectRatio` on
the referenced symbol shrinks the whole graphic to fit inside a
300×150 box.

**Rule:** if you set `width: 100%; height: auto` on an outer SVG, give
it a `viewBox` matching the symbol it references:

```tsx
<svg className="my-svg" viewBox="0 0 600 720" aria-hidden="true">
  <use href="#some-symbol" />
</svg>
```

This isn't only a sizing concern — without a viewBox, `<use>`
references rendered inside the SVG may also position incorrectly.

## 7. `overscroll-behavior: none` is required at page edges

Browsers swallow boundary wheel events to power rubber-banding on
macOS / pull-to-refresh on mobile. If your fold transition needs to
catch the very first wheel event at the top of the page, you need:

```css
html, body { overscroll-behavior: none; }
```

The `HeroFold` component sets this on mount via `style.overscrollBehavior`
and restores it on unmount, so it's scoped to when the fold overlay
is active.

## 8. React state in event handlers — use a `stateRef`

When you `setState()` inside a wheel/touch handler, the state change is
queued for the next render. Subsequent wheel events in the same tick
will still see the **old** state. If your handler branches on state,
mirror it into a ref:

```tsx
const [state, setState] = useState<FoldState>('closed');
const stateRef = useRef(state);
stateRef.current = state; // updates every render
```

…and read `stateRef.current` inside event handlers. Otherwise you'll
process the same event a dozen times during the React render delay.

## 9. Touch input mirrors wheel — just translate the delta

For mobile, the equivalent of `wheel.deltaY < 0` (up-scroll) is the
finger moving DOWN, which in onTouchMove is `touchStartY - currentY < 0`:

```ts
const delta = touchStartY - currentY;
// delta > 0 → finger moved up → page scrolls down
// delta < 0 → finger moved down → page scrolls up
```

Same `preventDefault` semantics apply (need `passive: false`). Same
boundary check. Apply a small magnitude threshold for touch
(`~10 px`) since accidental touches produce tiny `delta` values
without intent — this is genuinely useful for touch in a way it
isn't for wheel.

## 10. Reduced motion is non-negotiable

`prefers-reduced-motion: reduce` users get **no scroll animation at
all** — short-circuit to the end state. The current implementation:

```ts
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  setState('open');
  return;
}
```

Any new scroll-driven moment must do the equivalent: either skip
registering the ScrollTrigger / GSAP timeline entirely, or call
`gsap.set(target, endStateVars)` and bail.

## 11. Mid-page reload / deep links also bypass the fold

Don't animate from scratch when the user lands mid-page (refresh
after scrolling) or via `#hash` deep-link. They didn't see the
transition's "start state"; jumping them back to start and replaying
it is hostile. Short-circuit to the end state, same as reduced motion.

## 12. GSAP timelines are the unit of choreography

If two elements need to move together, put them on one timeline with
shared `duration` and `ease` defaults. Don't run parallel separate
animations with the same duration constant and pray they stay in
sync — they won't, especially under React re-renders or paint hiccups.

```ts
const tl = gsap.timeline({
  defaults: { duration: 1.4, ease: 'power2.out' },
  onComplete: () => setState('open'),
});
tl.to(lid,    { rotateX: 110 }, 0);
tl.to(shadow, { opacity: 1 },   0);
tl.to(window, { scrollTo: { y: target }, duration: 0.98 }, 0);
```

The third positional argument (`0`) is the timeline position. `0` =
"start at the beginning". `'<'` = "start with the previous tween".
Use these explicitly; defaults can surprise you.

## 13. Choreography: when to overlap, when to sequence

For the open direction (Hero → Milestones), the lid is **opaque** for
the first 70% of the animation, then fades out in the last 30%. The
scroll is timed to fit inside that opaque window (0 → 70%) so that by
the time the user can see "through" the lid, the page is already at
the target. If the scroll bled into the fade-out window, the user
would see the page jump as the lid disappears.

For the close direction, the opposite: the lid materializes (rotates
back from 110° and opacity 0 → 1) during the first 30%, while the
page stays where it is. The scroll runs in the last 70%, hidden
behind the now-opaque lid. The result is that the user perceives the
lid descending back into place over a stationary Hero — even though
the page actually scrolled all the way back from Milestones during
that time.

**Rule:** if the user is going to see through the animating element
at some point, time the scroll to happen when they can't.

## 14. Don't trust trackpad momentum across browsers / OSes

We optimized hard for macOS-trackpad-on-Chromium. Edge cases to keep
an eye out for:

- **Windows Precision Touchpad**: emits wheel events with `deltaMode`
  set differently. Some send fewer, larger events. Less momentum tail.
- **Magic Mouse 2** on macOS: same kinetic-scrolling behaviour as
  trackpad, slightly different cadence.
- **Browser scrollbar drag**: doesn't fire wheel events at all. Only
  produces `scroll` events. Our input-event-based triggers don't see
  it. This is acceptable for the fold (scrollbar users can just
  scroll normally — the fold isn't a load-bearing UX).
- **Mobile Safari**: respects `overscroll-behavior` but has its own
  bounce physics. Test on real device, not desktop devtools touch sim.

If you add a new scroll-driven animation, test on:

1. macOS Chrome + trackpad (the primary).
2. macOS Safari (slightly different wheel-event cadence).
3. iOS Safari on a real iPhone (touch + URL bar resize gotchas).
4. Windows Chrome + Precision touchpad if possible.

---

## Quick reference — when adding a new scroll-driven moment

- [ ] Outer SVG has `viewBox` if you're using `height: auto` on it.
- [ ] Global `<html>` `scroll-behavior` stays `auto` — don't switch
      it back to `smooth`.
- [ ] Trigger detection fires from `wheel` / `touchmove` / `keydown`,
      not `scroll`.
- [ ] `wheel` listener registered with `{ passive: false, capture: true }`.
- [ ] `preventDefault()` and trigger decisions made together. Never
      "block trigger but let native scroll through".
- [ ] No cooldown unless you can prove what momentum direction you're
      filtering.
- [ ] No magnitude threshold on wheel unless light real gestures are
      a known false-positive source for THIS specific trigger.
- [ ] `useLayoutEffect` for animation start states on remount.
- [ ] `stateRef` mirrors state for event-handler reads.
- [ ] Reduced-motion short-circuits to end state.
- [ ] Mid-page reload / deep-link short-circuits to end state.
- [ ] GSAP timeline used as the choreography unit; shared
      `defaults.ease` for related tweens.
- [ ] Tested on macOS Chrome, macOS Safari, iOS Safari (real device).
