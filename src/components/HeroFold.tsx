import { useEffect, useState } from 'react';
import { Hero } from './Hero';

/**
 * Fold-open overlay (one-shot).
 *
 * The Hero is rendered as a normal 100svh section in the document flow
 * (see App.tsx). On first load, this component mounts a fixed-position
 * overlay containing a visual copy of the Hero. Any scroll input fires
 * a 1.2s animation that rotates the overlay open while the page scrolls
 * programmatically from scrollY=0 to one viewport height in parallel.
 *
 * Once the animation completes:
 *   - the overlay unmounts (state='open' returns null)
 *   - the user is at scrollY≈100svh with the Milestones section at the top
 *   - scrolling back UP reveals the real (in-flow) Hero above
 *
 * The fold never replays once dismissed — refreshing the page is the only
 * way to see it again.
 */

type FoldState = 'closed' | 'opening' | 'open';

const FOLD_DURATION_MS = 1200;
const TRIGGER_KEYS = new Set([
  'ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', ' ', 'End', 'Home',
]);
const TOUCH_THRESHOLD_PX = 10;

export function HeroFold() {
  const [state, setState] = useState<FoldState>('closed');

  // Skip the fold under reduced motion, mid-page reloads, or deep links.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setState('open');
      return;
    }
    if (window.scrollY > 50) {
      // Browser restored a scroll position past the hero — skip the fold
      // and leave the user where they were.
      setState('open');
      return;
    }
    const hash = window.location.hash;
    if (hash && hash !== '#top') {
      // Deep link to a specific section — go straight there.
      setState('open');
    }
  }, []);

  // Block user input + listen for trigger gestures while the overlay
  // is still up (closed or opening).
  useEffect(() => {
    if (state === 'open') return;

    let touchStartY = 0;
    const canTrigger = state === 'closed';
    const trigger = () => { if (canTrigger) setState('opening'); };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      trigger();
    };
    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0]?.clientY ?? 0;
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const y = e.touches[0]?.clientY ?? 0;
      if (Math.abs(touchStartY - y) > TOUCH_THRESHOLD_PX) trigger();
    };
    const onKey = (e: KeyboardEvent) => {
      if (TRIGGER_KEYS.has(e.key)) {
        e.preventDefault();
        trigger();
      }
    };
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest('a[href^="#"]')) {
        e.preventDefault();
        e.stopPropagation();
        trigger();
      }
    };

    // capture:true so we run before any default browser/page handling.
    window.addEventListener('wheel', onWheel, { passive: false, capture: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true, capture: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false, capture: true });
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('click', onClick, true);

    return () => {
      window.removeEventListener('wheel', onWheel, true);
      window.removeEventListener('touchstart', onTouchStart, true);
      window.removeEventListener('touchmove', onTouchMove, true);
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('click', onClick, true);
    };
  }, [state]);

  // While opening, programmatically scroll the page from 0 → 100svh so
  // that when the overlay finishes fading out, the user is already at
  // the Milestones section.
  useEffect(() => {
    if (state !== 'opening') return;

    const startScrollY = window.scrollY;
    const targetScrollY = window.innerHeight;
    const startTime = performance.now();
    let rafId = 0;
    let cancelled = false;

    const step = () => {
      if (cancelled) return;
      const elapsed = performance.now() - startTime;
      const t = Math.min(1, elapsed / FOLD_DURATION_MS);
      const eased = 1 - Math.pow(1 - t, 3);
      window.scrollTo(0, startScrollY + (targetScrollY - startScrollY) * eased);
      if (t < 1) {
        rafId = requestAnimationFrame(step);
      } else {
        setState('open');
      }
    };
    rafId = requestAnimationFrame(step);

    return () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
    };
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
