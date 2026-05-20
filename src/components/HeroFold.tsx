import { useEffect, useRef, useState } from 'react';
import { Hero } from './Hero';

/**
 * Hero → Milestones "bottom-fold open" transition (one-shot).
 *
 * The first scroll input (wheel, touch swipe, arrow key, page-down, click on
 * any in-page anchor) triggers a 1.2s CSS animation that rotates the hero
 * around its top edge so the bottom edge swings forward + down, revealing
 * the milestones rendered directly below. During the animation, body scroll
 * is locked — the user can't pause or reverse the fold mid-way.
 *
 * Once the animation completes, the lid is hidden (`display:none` via the
 * .card-frame--open class), body scroll is unlocked, and the user is at
 * scroll position 0 with the Milestones section at the top of the viewport.
 *
 * Reduced motion, deep links (any URL hash other than #top), and reloads
 * partway down the page all skip directly to the 'open' state.
 */

type FoldState = 'closed' | 'opening' | 'open';

const FOLD_DURATION_MS = 1200;
const TRIGGER_KEYS = new Set([
  'ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', ' ', 'End', 'Home',
]);
const TOUCH_THRESHOLD_PX = 10;

export function HeroFold() {
  const frameRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<FoldState>('closed');

  // Initial state check — skip the fold under reduced motion, mid-page
  // reload, or deep link to a specific section.
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

  // Lock body scroll + listen for trigger input while the fold isn't open.
  useEffect(() => {
    if (state === 'open') return;

    const html = document.documentElement;
    const body = document.body;
    const prev = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      bodyTouchAction: body.style.touchAction,
      htmlOverscroll: html.style.overscrollBehavior,
      bodyOverscroll: body.style.overscrollBehavior,
    };
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    body.style.touchAction = 'none';
    // overscroll-behavior: none stops the browser from swallowing wheel
    // events at boundaries (especially macOS rubber-band on scroll UP at
    // scrollY=0, which otherwise consumes the event before our listener
    // ever sees it).
    html.style.overscrollBehavior = 'none';
    body.style.overscrollBehavior = 'none';

    let touchStartY = 0;
    const canTrigger = state === 'closed';
    const trigger = () => { if (canTrigger) setState('opening'); };

    // Fire on ANY wheel event regardless of direction or delta size —
    // up, down, sideways, even tiny trackpad taps all count as "the
    // user wants to leave the cover".
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

    // capture:true so we run before any default browser/page handling,
    // and so this works even if downstream code calls stopPropagation.
    window.addEventListener('wheel', onWheel, { passive: false, capture: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true, capture: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false, capture: true });
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('click', onClick, true);

    return () => {
      html.style.overflow = prev.htmlOverflow;
      body.style.overflow = prev.bodyOverflow;
      body.style.touchAction = prev.bodyTouchAction;
      html.style.overscrollBehavior = prev.htmlOverscroll;
      body.style.overscrollBehavior = prev.bodyOverscroll;
      window.removeEventListener('wheel', onWheel, true);
      window.removeEventListener('touchstart', onTouchStart, true);
      window.removeEventListener('touchmove', onTouchMove, true);
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('click', onClick, true);
    };
  }, [state]);

  // Once the animation finishes, advance to the 'open' state — that's
  // what hides the lid and releases the scroll lock.
  useEffect(() => {
    if (state !== 'opening') return;
    const t = window.setTimeout(() => setState('open'), FOLD_DURATION_MS);
    return () => window.clearTimeout(t);
  }, [state]);

  return (
    <div ref={frameRef} className={`card-frame card-frame--${state}`}>
      <div className="card-pin">
        <div className="hero-lid">
          <Hero />
        </div>
      </div>
    </div>
  );
}
