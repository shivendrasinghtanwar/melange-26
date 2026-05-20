import { useEffect, useRef, useState } from 'react';
import { Hero } from './Hero';

/**
 * Fold-open / fold-close overlay (reversible, infinite).
 *
 * The Hero is rendered as a normal 100svh section in App.tsx. This
 * component mounts a fixed overlay on top that displays a visual copy of
 * the hero, and runs the fold open + close animations.
 *
 * State machine:
 *   closed   — overlay visible at scrollY=0, lid flat & opaque, scroll
 *              input blocked. Any scroll input → opening.
 *   opening  — 1.2s fold-open animation; in parallel, scrollY animates
 *              0 → window.innerHeight. → open.
 *   open     — overlay unmounted (returns null), page is at the
 *              Milestones section, scroll is fully normal. The first
 *              upward scroll input AT the milestones-top boundary
 *              (scrollY ≤ innerHeight) → closing.
 *   closing  — 1.2s fold-close animation (mirror of open); in parallel,
 *              scrollY animates from current down to 0. → closed.
 *
 * Both transitions can repeat indefinitely. Reduced motion, mid-page
 * reloads, and deep-link hashes skip directly to 'open'.
 */

type FoldState = 'closed' | 'opening' | 'open' | 'closing';

const FOLD_DURATION_MS = 1200;
const TRIGGER_DOWN_KEYS = new Set(['ArrowDown', 'PageDown', ' ', 'End']);
const TRIGGER_UP_KEYS   = new Set(['ArrowUp',   'PageUp',   'Home']);
const TOUCH_THRESHOLD_PX = 10;
// Anything within this many pixels of scrollY=innerHeight counts as
// "at the milestones-top boundary" — a small tolerance for sub-pixel
// scroll positions and momentum-scroll overshoot.
const BOUNDARY_BUFFER_PX = 5;

export function HeroFold() {
  const [state, setState] = useState<FoldState>('closed');
  const stateRef = useRef<FoldState>(state);
  stateRef.current = state;

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

  // Mount-once listeners — they read latest state through stateRef.
  // overscroll-behavior:none is also applied for the component's lifetime
  // so the browser doesn't swallow boundary wheel events on macOS
  // (rubber-band) or mobile (pull-to-refresh).
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverscroll = html.style.overscrollBehavior;
    const prevBodyOverscroll = body.style.overscrollBehavior;
    html.style.overscrollBehavior = 'none';
    body.style.overscrollBehavior = 'none';

    let touchStartY = 0;
    const atMilestonesTop = () =>
      window.scrollY <= window.innerHeight + BOUNDARY_BUFFER_PX;

    const triggerOpen  = () => { if (stateRef.current === 'closed') setState('opening'); };
    const triggerClose = () => { if (stateRef.current === 'open')   setState('closing'); };

    const onWheel = (e: WheelEvent) => {
      const s = stateRef.current;
      if (s === 'opening' || s === 'closing') {
        e.preventDefault();
        return;
      }
      if (s === 'closed') {
        e.preventDefault();
        triggerOpen();
        return;
      }
      // s === 'open' — let normal scroll through unless we're at the top
      // of milestones and the gesture is upward.
      if (e.deltaY < 0 && atMilestonesTop()) {
        e.preventDefault();
        triggerClose();
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0]?.clientY ?? 0;
    };

    const onTouchMove = (e: TouchEvent) => {
      const s = stateRef.current;
      if (s === 'opening' || s === 'closing') {
        e.preventDefault();
        return;
      }
      const y = e.touches[0]?.clientY ?? 0;
      const delta = touchStartY - y; // positive = finger moved up = scroll DOWN
      if (s === 'closed') {
        e.preventDefault();
        if (Math.abs(delta) > TOUCH_THRESHOLD_PX) triggerOpen();
        return;
      }
      // s === 'open' — intercept only downward-finger (upward-scroll)
      // gestures while we're at the boundary.
      if (delta < -TOUCH_THRESHOLD_PX && atMilestonesTop()) {
        e.preventDefault();
        triggerClose();
      }
    };

    const onKey = (e: KeyboardEvent) => {
      const s = stateRef.current;
      const isDown = TRIGGER_DOWN_KEYS.has(e.key);
      const isUp   = TRIGGER_UP_KEYS.has(e.key);
      if (s === 'opening' || s === 'closing') {
        if (isDown || isUp) e.preventDefault();
        return;
      }
      if (s === 'closed') {
        if (isDown || isUp) {
          e.preventDefault();
          triggerOpen();
        }
        return;
      }
      // s === 'open'
      if (isUp && atMilestonesTop()) {
        e.preventDefault();
        triggerClose();
      }
    };

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest('a[href^="#"]') as HTMLAnchorElement | null;
      if (!anchor) return;
      const s = stateRef.current;
      if (s === 'closed') {
        e.preventDefault();
        e.stopPropagation();
        triggerOpen();
        return;
      }
      if (s === 'open') {
        const href = anchor.getAttribute('href') || '';
        if (href === '#top') {
          // "Return to the top" — animate back into the closed cover.
          e.preventDefault();
          e.stopPropagation();
          triggerClose();
        }
        // Other anchors (e.g. #milestones, #rsvp) — let smoothScroll do
        // its thing.
        return;
      }
      // opening or closing — swallow any clicks during animation
      e.preventDefault();
      e.stopPropagation();
    };

    // Backup: touchscreen swipes that bypass touchmove preventDefault can
    // still scroll. If we end up below the boundary in 'open' state,
    // force the close transition.
    const onScroll = () => {
      if (stateRef.current === 'open' && window.scrollY < window.innerHeight - 1) {
        triggerClose();
      }
    };

    window.addEventListener('wheel',      onWheel,      { passive: false, capture: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true,  capture: true });
    window.addEventListener('touchmove',  onTouchMove,  { passive: false, capture: true });
    window.addEventListener('keydown',    onKey,        true);
    window.addEventListener('click',      onClick,      true);
    window.addEventListener('scroll',     onScroll,     { passive: true });

    return () => {
      html.style.overscrollBehavior = prevHtmlOverscroll;
      body.style.overscrollBehavior = prevBodyOverscroll;
      window.removeEventListener('wheel',      onWheel,      true);
      window.removeEventListener('touchstart', onTouchStart, true);
      window.removeEventListener('touchmove',  onTouchMove,  true);
      window.removeEventListener('keydown',    onKey,        true);
      window.removeEventListener('click',      onClick,      true);
      window.removeEventListener('scroll',     onScroll);
    };
  }, []);

  // During 'opening', animate scrollY up to the milestones section. The
  // scroll completes in the first 70% of the animation (while the lid is
  // still opaque) so that when the lid fades from t=0.7 onward the page
  // beneath is already at the right place. Using #milestones offsetTop
  // (not window.innerHeight) is more accurate on mobile where 100svh and
  // the live innerHeight can disagree by tens of pixels because of the
  // URL bar.
  useEffect(() => {
    if (state !== 'opening') return;
    const milestonesEl = document.getElementById('milestones');
    const target = milestonesEl ? milestonesEl.offsetTop : window.innerHeight;
    return animateFold({
      start: window.scrollY,
      target,
      scrollDuration: FOLD_DURATION_MS * 0.7,
      totalDuration: FOLD_DURATION_MS,
      scrollDelay: 0,
      onComplete: () => setState('open'),
    });
  }, [state]);

  // During 'closing', mirror the opening — but delay the scroll by 30%
  // of the duration so the lid has time to rotate back in and become
  // opaque first. The scroll then happens invisibly behind the opaque
  // lid, ending exactly when the lid finishes its rotation home.
  useEffect(() => {
    if (state !== 'closing') return;
    return animateFold({
      start: window.scrollY,
      target: 0,
      scrollDuration: FOLD_DURATION_MS * 0.7,
      totalDuration: FOLD_DURATION_MS,
      scrollDelay: FOLD_DURATION_MS * 0.3,
      onComplete: () => setState('closed'),
    });
  }, [state]);

  if (state === 'open') return null;

  return (
    <div className={`fold-overlay fold-overlay--${state}`} aria-hidden="true">
      <div className="fold-overlay__lid">
        <Hero withId={false} />
      </div>
    </div>
  );
}

type AnimateFoldOpts = {
  start: number;
  target: number;
  /** ms before the scroll begins (used by close so the lid covers first). */
  scrollDelay: number;
  /** ms over which the scroll itself runs (typically < totalDuration). */
  scrollDuration: number;
  /** ms over which the CSS keyframes run — we wait this long before
   *  signalling completion so the visual animation isn't cut short. */
  totalDuration: number;
  onComplete: () => void;
};

function animateFold({
  start,
  target,
  scrollDelay,
  scrollDuration,
  totalDuration,
  onComplete,
}: AnimateFoldOpts) {
  const startTime = performance.now();
  let rafId = 0;
  let cancelled = false;

  const step = () => {
    if (cancelled) return;
    const elapsed = performance.now() - startTime;
    const scrollElapsed = Math.max(0, elapsed - scrollDelay);
    const t = Math.min(1, scrollElapsed / scrollDuration);
    const eased = 1 - Math.pow(1 - t, 3);
    window.scrollTo(0, start + (target - start) * eased);
    if (elapsed < totalDuration) {
      rafId = requestAnimationFrame(step);
    } else {
      // Final position snap (in case rAF dropped frames near the end).
      window.scrollTo(0, target);
      onComplete();
    }
  };
  rafId = requestAnimationFrame(step);

  return () => {
    cancelled = true;
    if (rafId) cancelAnimationFrame(rafId);
  };
}
