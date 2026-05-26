import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { Hero } from './Hero';
/* HeroFold owns its own state machine (closed → opening → open →
   closing) and re-entry guards. SectionSnap and its cross-fold
   coordination module are gone — native CSS scroll-snap handles every
   other boundary, so the only fold-vs-fold collision we used to worry
   about (HeroFold's open running into SectionSnap's snap-down) no
   longer exists. */

gsap.registerPlugin(ScrollToPlugin);

/**
 * Fold-open / fold-close overlay (reversible, infinite).
 *
 * The Hero is rendered as a normal 100svh section in App.tsx. This
 * component mounts a fixed overlay on top that displays a visual copy of
 * the hero, and runs the fold open + close animations as GSAP timelines.
 *
 * State machine:
 *   closed   — overlay visible at scrollY=0, lid flat & opaque, scroll
 *              input blocked. Any scroll input → opening.
 *   opening  — GSAP timeline rotates the lid 0→110°, fades it out in the
 *              last 30%, and scrolls the page to the milestones section
 *              in the first 70%. onComplete → open.
 *   open     — overlay unmounted (returns null), page is at the Milestones
 *              section, scroll is fully normal. Substantial scroll-up past
 *              the boundary (or "Return to top" click) → closing.
 *   closing  — Mirror timeline: lid restored from rotateX(110)/opacity(0)
 *              back to flat/opaque while the page scrolls back to 0.
 *              onComplete → closed.
 *
 * History: the original implementation hand-rolled the animation with a
 * rAF easing loop, synced separately-defined CSS @keyframes, and had to
 * temporarily clear `html { scroll-behavior: smooth }` to stop the
 * browser from queueing stale smooth-scroll commands behind the JS
 * scrollTo() calls. All three workarounds went away when the whole
 * animation moved into a single GSAP timeline that drives the lid
 * transform, the shadow/hinge opacities, AND the window scroll
 * together.
 */

type FoldState = 'closed' | 'opening' | 'open' | 'closing';

const FOLD_DURATION = 1.4; // seconds
const FOLD_EASE = 'power2.out';

const TRIGGER_DOWN_KEYS = new Set(['ArrowDown', 'PageDown', ' ', 'End']);
const TRIGGER_UP_KEYS   = new Set(['ArrowUp',   'PageUp',   'Home']);
const TOUCH_THRESHOLD_PX = 10;

// Close trigger lives on the input events themselves (wheel / touch /
// key), not on the after-the-fact scroll position. The first up-gesture
// at the boundary preventDefaults the native scroll AND fires close —
// no "burn the cooldown while scrolling past the boundary" lag, no
// half-Hero-revealed-before-the-animation-fires bug on fast scrolls.
//
// No cooldown: the only momentum we'd ever need to filter is from the
// gesture that opened the fold, which was a DOWNWARD scroll — its
// momentum tail emits positive-deltaY events that can't satisfy the
// `deltaY < 0` test anyway. A cooldown here just blocked legitimate
// fast-scroll close intent.
//
// CLOSE_BOUNDARY_BUFFER_PX: how much slack around milestones-top still
// counts as "at the boundary" — 50px means "essentially at the top of
// milestones", close enough to fire on intent but not so loose that
// casual reading-scroll inside the section triggers an unwanted close.
const CLOSE_BOUNDARY_BUFFER_PX = 50;

export function HeroFold() {
  const [state, setState] = useState<FoldState>('closed');
  const stateRef = useRef<FoldState>(state);
  stateRef.current = state;

  const lidRef = useRef<HTMLDivElement>(null);
  const hingeRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);

  // Skip the fold entirely under reduced motion / mid-page reload /
  // deep link to a specific section.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setState('open');
      return;
    }
    if (window.scrollY > 50) {
      setState('open');
      return;
    }
    const hash = window.location.hash;
    if (hash && hash !== '#top') {
      setState('open');
    }
  }, []);

  // Trigger handlers + overscroll-behavior guard.
  // overscroll-behavior:none stops the browser from swallowing boundary
  // wheel events for rubber-band (macOS) and pull-to-refresh (mobile).
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverscroll = html.style.overscrollBehavior;
    const prevBodyOverscroll = body.style.overscrollBehavior;
    html.style.overscrollBehavior = 'none';
    body.style.overscrollBehavior = 'none';

    let touchStartY = 0;

    // Boundary between hero zone and milestones zone, computed fresh per
    // call from #milestones' bounding rect so layout shifts and mobile-
    // URL-bar height variation don't desync the gate.
    const getMilestonesBoundary = () => {
      const el = document.getElementById('milestones');
      if (!el) return window.innerHeight;
      return el.getBoundingClientRect().top + window.scrollY;
    };

    const triggerOpen = () => {
      if (stateRef.current !== 'closed') return;
      setState('opening');
    };
    const triggerClose = () => {
      if (stateRef.current !== 'open') return;
      setState('closing');
    };

    // True when the user is at-or-near the milestones-top boundary —
    // i.e. close enough that an up-gesture means "back to hero" and not
    // "keep scrolling up inside milestones to re-read".
    const canFireClose = () => {
      const boundary = getMilestonesBoundary();
      return window.scrollY <= boundary + CLOSE_BOUNDARY_BUFFER_PX;
    };

    const onWheel = (e: WheelEvent) => {
      const s = stateRef.current;
      if (s === 'opening' || s === 'closing') { e.preventDefault(); return; }
      if (s === 'closed') { e.preventDefault(); triggerOpen(); return; }
      // s === 'open': ANY up-wheel at the boundary fires close BEFORE
      // the browser natively scrolls. No magnitude threshold — a light
      // trackpad scroll is just as much intent as a hard one.
      if (e.deltaY < 0 && canFireClose()) {
        e.preventDefault();
        triggerClose();
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0]?.clientY ?? 0;
    };

    const onTouchMove = (e: TouchEvent) => {
      const s = stateRef.current;
      if (s === 'opening' || s === 'closing') { e.preventDefault(); return; }
      const y = e.touches[0]?.clientY ?? 0;
      const delta = touchStartY - y; // positive = finger moved up = page would scroll down
      if (s === 'closed') {
        e.preventDefault();
        if (Math.abs(delta) > TOUCH_THRESHOLD_PX) triggerOpen();
        return;
      }
      // s === 'open': downward finger drag (delta < 0) at the boundary
      // fires close — same logic as wheel-up, just translated to touch.
      if (delta < -TOUCH_THRESHOLD_PX && canFireClose()) {
        e.preventDefault();
        triggerClose();
      }
    };

    const onKey = (e: KeyboardEvent) => {
      const s = stateRef.current;
      const isDown = TRIGGER_DOWN_KEYS.has(e.key);
      const isUp   = TRIGGER_UP_KEYS.has(e.key);
      if (!isDown && !isUp) return;
      if (s === 'opening' || s === 'closing') { e.preventDefault(); return; }
      if (s === 'closed' && isDown) { e.preventDefault(); triggerOpen(); return; }
      // s === 'open': up-keys at the boundary fire close.
      if (s === 'open' && isUp && canFireClose()) {
        e.preventDefault();
        triggerClose();
      }
    };

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest('a[href^="#"]') as HTMLAnchorElement | null;
      if (!anchor) return;
      const s = stateRef.current;
      const href = anchor.getAttribute('href') || '';
      if (s === 'closed') {
        e.preventDefault(); e.stopPropagation();
        triggerOpen();
        return;
      }
      if (s === 'open') {
        // Only the Footer's "Return to the top" link triggers close.
        if (href === '#top') {
          e.preventDefault(); e.stopPropagation();
          triggerClose();
        }
        return;
      }
      e.preventDefault(); e.stopPropagation();
    };

    window.addEventListener('wheel',      onWheel,      { passive: false, capture: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true,  capture: true });
    window.addEventListener('touchmove',  onTouchMove,  { passive: false, capture: true });
    window.addEventListener('keydown',    onKey,        true);
    window.addEventListener('click',      onClick,      true);

    return () => {
      html.style.overscrollBehavior = prevHtmlOverscroll;
      body.style.overscrollBehavior = prevBodyOverscroll;
      window.removeEventListener('wheel',      onWheel,      true);
      window.removeEventListener('touchstart', onTouchStart, true);
      window.removeEventListener('touchmove',  onTouchMove,  true);
      window.removeEventListener('keydown',    onKey,        true);
      window.removeEventListener('click',      onClick,      true);
    };
  }, []);

  // OPEN timeline. Lid rotates 0→110° across the full duration; opacity
  // holds at 1 for the first 70% then fades to 0 in the last 30%. The
  // page scrolls to milestones in the first 70% so it's already there
  // by the time the lid finishes fading out. useLayoutEffect (not
  // useEffect) so the timeline starts BEFORE the next browser paint —
  // avoids any one-frame flash of the lid at rest before motion begins.
  useLayoutEffect(() => {
    if (state !== 'opening') return;
    if (!lidRef.current || !hingeRef.current || !shadowRef.current) return;

    const el = document.getElementById('milestones');
    const target = el ? el.getBoundingClientRect().top + window.scrollY : window.innerHeight;

    const tl = gsap.timeline({
      defaults: { duration: FOLD_DURATION, ease: FOLD_EASE },
      onComplete: () => setState('open'),
    });

    tl.to(lidRef.current,    { rotateX: 110 }, 0);
    tl.to(lidRef.current,    { opacity: 0, duration: FOLD_DURATION * 0.3, ease: 'power1.out' }, FOLD_DURATION * 0.7);
    tl.to(hingeRef.current,  { opacity: 0, duration: 0.55, ease: 'power2.out' }, 0);
    tl.to(shadowRef.current, { opacity: 1 }, 0);
    tl.to(window,            { scrollTo: { y: target }, duration: FOLD_DURATION * 0.7 }, 0);

    return () => { tl.kill(); };
  }, [state]);

  // CLOSE timeline. The overlay is freshly mounted (it was unmounted
  // while in 'open'), so the lid renders at its CSS default rotateX(0)/
  // opacity(1). gsap.set() forces the close start-state (rotateX 110,
  // opacity 0, hinge invisible, shadow full) inside the same layout
  // tick — that's why this is useLayoutEffect, not useEffect: it runs
  // synchronously after mount, before the browser paints, so the user
  // never sees the lid in its default rest state when close begins.
  useLayoutEffect(() => {
    if (state !== 'closing') return;
    if (!lidRef.current || !hingeRef.current || !shadowRef.current) return;

    gsap.set(lidRef.current,    { rotateX: 110, opacity: 0 });
    gsap.set(shadowRef.current, { opacity: 1 });
    gsap.set(hingeRef.current,  { opacity: 0 });

    const tl = gsap.timeline({
      defaults: { duration: FOLD_DURATION, ease: FOLD_EASE },
      onComplete: () => setState('closed'),
    });

    // Opacity returns fast (first 30%), then lid rotates back from 110→0.
    tl.to(lidRef.current,    { opacity: 1, duration: FOLD_DURATION * 0.3, ease: 'power2.out' }, 0);
    tl.to(lidRef.current,    { rotateX: 0 }, 0);
    tl.to(shadowRef.current, { opacity: 0 }, 0);
    // Hinge hairline fades back in near the end, once the lid has lowered.
    tl.to(hingeRef.current,  { opacity: 1, duration: 0.55, ease: 'power2.out' }, FOLD_DURATION * 0.6);
    // Scroll back to 0 is delayed so the lid has time to rotate back in
    // and the scroll happens "behind" an opaque lid.
    tl.to(window,            { scrollTo: { y: 0 }, duration: FOLD_DURATION * 0.7 }, FOLD_DURATION * 0.3);

    return () => { tl.kill(); };
  }, [state]);

  if (state === 'open') return null;

  return (
    <div className="fold-overlay" aria-hidden="true">
      <div ref={lidRef} className="fold-overlay__lid">
        <div ref={hingeRef}  className="fold-overlay__hinge"  />
        <div ref={shadowRef} className="fold-overlay__shadow" />
        <Hero withId={false} />
      </div>
    </div>
  );
}
